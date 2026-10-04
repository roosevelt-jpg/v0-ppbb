import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { planFromId, type PlanId } from './plans';
import { BILLING_FRAUD, isBillingBlocked } from './billing-fraud';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly moduleRef: ModuleRef,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.stripe &&
        process.env.STRIPE_PRICE_ID_PRO &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.BILLING_SUCCESS_URL &&
        process.env.BILLING_CANCEL_URL,
    );
  }

  /** Live marketplace Checkout (destination charge + application fee). */
  isMarketplacePaymentsConfigured(): boolean {
    return Boolean(
      this.stripe &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        (process.env.MARKETPLACE_CHECKOUT_SUCCESS_URL || process.env.BILLING_SUCCESS_URL) &&
        (process.env.MARKETPLACE_CHECKOUT_CANCEL_URL || process.env.BILLING_CANCEL_URL),
    );
  }

  isConnectOnboardingConfigured(): boolean {
    return Boolean(
      this.stripe &&
        (process.env.STRIPE_CONNECT_RETURN_URL || process.env.BILLING_SUCCESS_URL) &&
        (process.env.STRIPE_CONNECT_REFRESH_URL || process.env.BILLING_CANCEL_URL),
    );
  }

  platformFeeBps(): number {
    const raw = Number(process.env.MARKETPLACE_PLATFORM_FEE_BPS ?? '2000');
    if (!Number.isFinite(raw) || raw < 0 || raw > 10_000) return 2000;
    return Math.floor(raw);
  }

  applicationFeeCents(amountCents: number): number {
    return Math.min(amountCents, Math.floor((amountCents * this.platformFeeBps()) / 10_000));
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new ApiException(
        'billing_not_configured',
        'STRIPE_SECRET_KEY is not set. Add Stripe keys to enable billing.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return this.stripe;
  }

  async getSummary(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const usage = await this.usage.summary(organizationId);
    const plan = planFromId(org.plan);
    const hasDefaultPaymentMethod = Boolean(org.stripeDefaultPaymentMethodId);

    // Refresh card fingerprint from Stripe when configured (best-effort).
    if (this.stripe && org.stripeCustomerId && hasDefaultPaymentMethod) {
      void this.syncDefaultPaymentMethod(organizationId).catch(() => undefined);
    }

    return {
      plan: org.plan,
      planName: plan.name,
      billingStatus: org.billingStatus,
      characterQuota: org.characterQuota,
      charactersUsed: usage.characters,
      charactersRemaining: Math.max(org.characterQuota - usage.characters, 0),
      periodStart: usage.periodStart,
      requests: usage.requests,
      stripeConfigured: this.isConfigured(),
      hasCustomer: Boolean(org.stripeCustomerId),
      hasDefaultPaymentMethod,
      autoDebitEnabled: hasDefaultPaymentMethod && org.billingStatus === 'active',
      cardBrand: org.cardBrand,
      cardLast4: org.cardLast4,
      paymentFailureCount: org.paymentFailureCount,
      fraudHold: org.billingStatus === 'fraud_hold' || Boolean(org.fraudHoldAt),
      connectAccountId: org.stripeConnectAccountId,
      connectChargesEnabled: org.stripeConnectChargesEnabled,
      marketplacePaymentsConfigured: this.isMarketplacePaymentsConfigured(),
      platformFeeBps: this.platformFeeBps(),
    };
  }

  async assertBillingHealthy(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    if (isBillingBlocked(org.billingStatus) || org.fraudHoldAt) {
      throw new ApiException(
        'billing_fraud_hold',
        'Billing is locked due to fraudulent or unpaid activity. Contact support or clear the hold in Stripe after a valid card is on file.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    if (org.billingStatus === 'past_due') {
      throw new ApiException(
        'billing_past_due',
        'Your card was declined. Update the payment method — auto-debit retries use the card on file.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async assertWithinQuota(organizationId: string, upcomingCharacters: number) {
    await this.assertBillingHealthy(organizationId);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const usage = await this.usage.summary(organizationId);
    if (usage.characters + upcomingCharacters > org.characterQuota) {
      throw new ApiException(
        'quota_exceeded',
        `Monthly character quota exceeded (${usage.characters}/${org.characterQuota}). Upgrade to Pro.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  private async assertCheckoutNotAbusive(organizationId: string) {
    await this.assertBillingHealthy(organizationId);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const now = Date.now();
    const windowStart = now - BILLING_FRAUD.checkoutWindowMs;
    const last = org.lastCheckoutAt?.getTime() ?? 0;
    let attempts = org.checkoutAttemptCount;
    if (last < windowStart) attempts = 0;
    if (attempts >= BILLING_FRAUD.maxCheckoutAttempts) {
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          billingStatus: 'fraud_hold',
          fraudHoldAt: new Date(),
        },
      });
      await this.audit.record({
        organizationId,
        action: 'billing.fraud_hold',
        route: 'billing.checkout_rate_limit',
        metadata: { attempts, windowMs: BILLING_FRAUD.checkoutWindowMs },
      });
      throw new ApiException(
        'billing_fraud_hold',
        'Too many checkout attempts. Billing temporarily locked to block fraud.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        checkoutAttemptCount: attempts + 1,
        lastCheckoutAt: new Date(),
      },
    });
  }

  /** Feature gate for Pro-only surfaces (marketplace publish/install). */
  async assertPro(organizationId: string) {
    await this.assertBillingHealthy(organizationId);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    if (org.plan !== 'pro') {
      throw new ApiException(
        'plan_required',
        'Marketplace requires a Pro plan. Upgrade under Billing.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async ensureCustomer(organizationId: string, email?: string) {
    const stripe = this.requireStripe();
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    if (org.stripeCustomerId) {
      return org.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      name: org.name,
      email: email || undefined,
      metadata: { organizationId: org.id },
    });

    await this.prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async getConnectStatus(organizationId: string) {
    await this.assertPro(organizationId);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    if (org.stripeConnectAccountId && this.stripe) {
      try {
        const account = await this.stripe.accounts.retrieve(org.stripeConnectAccountId);
        const chargesEnabled = Boolean(account.charges_enabled);
        if (chargesEnabled !== org.stripeConnectChargesEnabled) {
          await this.prisma.organization.update({
            where: { id: org.id },
            data: { stripeConnectChargesEnabled: chargesEnabled },
          });
        }
        return {
          connected: true,
          accountId: org.stripeConnectAccountId,
          chargesEnabled,
          detailsSubmitted: Boolean(account.details_submitted),
          onboardingConfigured: this.isConnectOnboardingConfigured(),
          marketplacePaymentsConfigured: this.isMarketplacePaymentsConfigured(),
          platformFeeBps: this.platformFeeBps(),
        };
      } catch {
        // fall through to DB cache
      }
    }

    return {
      connected: Boolean(org.stripeConnectAccountId),
      accountId: org.stripeConnectAccountId,
      chargesEnabled: org.stripeConnectChargesEnabled,
      detailsSubmitted: org.stripeConnectChargesEnabled,
      onboardingConfigured: this.isConnectOnboardingConfigured(),
      marketplacePaymentsConfigured: this.isMarketplacePaymentsConfigured(),
      platformFeeBps: this.platformFeeBps(),
    };
  }

  async createConnectOnboardingLink(input: {
    organizationId: string;
    userId: string;
    email?: string;
    ip?: string;
  }) {
    await this.assertPro(input.organizationId);
    if (!this.isConnectOnboardingConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Stripe Connect onboarding is not configured (secret + return/refresh URLs).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const stripe = this.requireStripe();
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
    });

    let accountId = org.stripeConnectAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: input.email || undefined,
        metadata: { organizationId: org.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await this.prisma.organization.update({
        where: { id: org.id },
        data: {
          stripeConnectAccountId: accountId,
          stripeConnectChargesEnabled: Boolean(account.charges_enabled),
        },
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url:
        process.env.STRIPE_CONNECT_REFRESH_URL ?? process.env.BILLING_CANCEL_URL!,
      return_url:
        process.env.STRIPE_CONNECT_RETURN_URL ?? process.env.BILLING_SUCCESS_URL!,
      type: 'account_onboarding',
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'marketplace.connect_onboarding_started',
      route: 'POST /v1/marketplace/connect/onboard',
      ip: input.ip,
      metadata: { accountId },
    });

    return { url: link.url, accountId };
  }

  async createMarketplaceCheckout(input: {
    organizationId: string;
    workspaceId: string;
    userId: string;
    listingId: string;
    listingTitle: string;
    amountCents: number;
    currency: string;
    destinationAccountId: string;
    ip?: string;
  }) {
    if (!this.isMarketplacePaymentsConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Marketplace payments are not configured.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (input.amountCents < 50) {
      throw new ApiException(
        'validation_error',
        'Paid listings must be at least 50 cents',
        HttpStatus.BAD_REQUEST,
      );
    }

    const stripe = this.requireStripe();
    const fee = this.applicationFeeCents(input.amountCents);
    const success =
      process.env.MARKETPLACE_CHECKOUT_SUCCESS_URL ??
      `${process.env.BILLING_SUCCESS_URL}&marketplace=1`;
    const cancel =
      process.env.MARKETPLACE_CHECKOUT_CANCEL_URL ??
      `${process.env.BILLING_CANCEL_URL}&marketplace=1`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency,
            unit_amount: input.amountCents,
            product_data: {
              name: input.listingTitle,
              metadata: { listingId: input.listingId },
            },
          },
        },
      ],
      success_url: success,
      cancel_url: cancel,
      client_reference_id: input.organizationId,
      metadata: {
        type: 'marketplace_listing',
        listingId: input.listingId,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
      },
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: {
          destination: input.destinationAccountId,
        },
        metadata: {
          type: 'marketplace_listing',
          listingId: input.listingId,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'marketplace.checkout_started',
      route: 'POST /v1/marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        sessionId: session.id,
        listingId: input.listingId,
        amountCents: input.amountCents,
        applicationFeeCents: fee,
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
      applicationFeeCents: fee,
    };
  }

  async createCheckoutSession(input: {
    organizationId: string;
    userId: string;
    email?: string;
    ip?: string;
  }) {
    if (!this.isConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Stripe billing is not fully configured (secret, price, webhook, success/cancel URLs).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.assertCheckoutNotAbusive(input.organizationId);

    const stripe = this.requireStripe();
    const priceId = process.env.STRIPE_PRICE_ID_PRO!;
    const customerId = await this.ensureCustomer(input.organizationId, input.email);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.BILLING_SUCCESS_URL!,
      cancel_url: process.env.BILLING_CANCEL_URL!,
      client_reference_id: input.organizationId,
      metadata: { organizationId: input.organizationId, purpose: 'pro_upgrade' },
      payment_method_types: ['card'],
      payment_method_collection: 'always',
      billing_address_collection: 'required',
      customer_update: { address: 'auto', name: 'auto' },
      // Card stays on file and is used for every renewal / auto-debit.
      subscription_data: {
        metadata: { organizationId: input.organizationId },
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
      },
    } as Stripe.Checkout.SessionCreateParams);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'billing.checkout_started',
      route: 'POST /v1/billing/checkout',
      ip: input.ip,
      metadata: { sessionId: session.id, autoDebit: true },
    });

    return { url: session.url, autoDebit: true };
  }

  /** Checkout in setup mode — add/update card for always-on auto-debit without changing plan. */
  async createSetupCardSession(input: {
    organizationId: string;
    userId: string;
    email?: string;
    ip?: string;
  }) {
    if (!this.isConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Stripe billing is not fully configured.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.assertCheckoutNotAbusive(input.organizationId);

    const stripe = this.requireStripe();
    const customerId = await this.ensureCustomer(input.organizationId, input.email);
    const success =
      process.env.BILLING_PORTAL_RETURN_URL ??
      process.env.BILLING_SUCCESS_URL ??
      'http://localhost:3000/billing?card=saved';

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      success_url: `${success}${success.includes('?') ? '&' : '?'}card=saved`,
      cancel_url: process.env.BILLING_CANCEL_URL!,
      client_reference_id: input.organizationId,
      metadata: { organizationId: input.organizationId, purpose: 'save_card_auto_debit' },
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_update: { address: 'auto', name: 'auto' },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'billing.setup_card_started',
      route: 'POST /v1/billing/setup-card',
      ip: input.ip,
      metadata: { sessionId: session.id },
    });

    return { url: session.url, autoDebit: true };
  }

  async syncDefaultPaymentMethod(organizationId: string) {
    const stripe = this.requireStripe();
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    if (!org.stripeCustomerId) return null;

    const customer = await stripe.customers.retrieve(org.stripeCustomerId);
    if (customer.deleted) return null;

    let pmId =
      typeof customer.invoice_settings?.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings?.default_payment_method?.id;

    if (!pmId && org.stripeSubscriptionId) {
      const sub = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      pmId =
        typeof sub.default_payment_method === 'string'
          ? sub.default_payment_method
          : sub.default_payment_method?.id ?? undefined;
    }

    if (!pmId) {
      const methods = await stripe.paymentMethods.list({
        customer: org.stripeCustomerId,
        type: 'card',
        limit: 1,
      });
      pmId = methods.data[0]?.id;
      if (pmId) {
        await stripe.customers.update(org.stripeCustomerId, {
          invoice_settings: { default_payment_method: pmId },
        });
      }
    }

    if (!pmId) {
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          stripeDefaultPaymentMethodId: null,
          cardBrand: null,
          cardLast4: null,
        },
      });
      return null;
    }

    const pm = await stripe.paymentMethods.retrieve(pmId);
    const brand = pm.card?.brand ?? null;
    const last4 = pm.card?.last4 ?? null;

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        stripeDefaultPaymentMethodId: pmId,
        cardBrand: brand,
        cardLast4: last4,
      },
    });

    return { paymentMethodId: pmId, brand, last4 };
  }

  private async recordPaymentFailure(organizationId: string, reason: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const failures = org.paymentFailureCount + 1;
    const fraudHold = failures >= BILLING_FRAUD.maxPaymentFailures;
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        paymentFailureCount: failures,
        billingStatus: fraudHold ? 'fraud_hold' : 'past_due',
        fraudHoldAt: fraudHold ? new Date() : org.fraudHoldAt,
      },
    });
    await this.audit.record({
      organizationId,
      action: fraudHold ? 'billing.fraud_hold' : 'billing.payment_failed',
      route: 'stripe.webhook',
      metadata: { reason, failures },
    });
  }

  private async clearPaymentFailures(organizationId: string) {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        paymentFailureCount: 0,
        fraudHoldAt: null,
        billingStatus: 'active',
      },
    });
  }

  private async organizationIdFromCustomer(customerId: string | null | undefined) {
    if (!customerId) return null;
    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    return org?.id ?? null;
  }

  async createPortalSession(input: { organizationId: string; userId: string; ip?: string }) {
    if (!this.isConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Stripe billing is not fully configured.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const stripe = this.requireStripe();
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
    });

    if (!org.stripeCustomerId) {
      throw new ApiException(
        'billing_no_customer',
        'No Stripe customer yet. Start checkout first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: process.env.BILLING_PORTAL_RETURN_URL ?? process.env.BILLING_SUCCESS_URL!,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'billing.portal_opened',
      route: 'POST /v1/billing/portal',
      ip: input.ip,
    });

    return { url: portal.url };
  }

  async applyEntitlement(input: {
    organizationId: string;
    plan: PlanId;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    billingStatus?: string;
  }) {
    const plan = planFromId(input.plan);
    const updated = await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        plan: plan.id,
        characterQuota: plan.characterQuota,
        billingStatus: input.billingStatus ?? 'active',
        ...(input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {}),
        ...(input.stripeSubscriptionId !== undefined
          ? { stripeSubscriptionId: input.stripeSubscriptionId }
          : {}),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      action: 'billing.plan_changed',
      route: 'stripe.webhook',
      metadata: {
        plan: updated.plan,
        characterQuota: updated.characterQuota,
        billingStatus: updated.billingStatus,
      },
    });

    return updated;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.requireStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new ApiException(
        'billing_not_configured',
        'STRIPE_WEBHOOK_SECRET is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new ApiException('invalid_webhook', 'Invalid Stripe webhook signature', HttpStatus.BAD_REQUEST);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'payment' && session.metadata?.type === 'marketplace_listing') {
          const { MarketplaceService } = await import('../marketplace/marketplace.service');
          const marketplace = this.moduleRef.get(MarketplaceService, { strict: false });
          await marketplace.fulfillPaidCheckout({
            sessionId: session.id,
            listingId: session.metadata.listingId,
            organizationId: session.metadata.organizationId,
            workspaceId: session.metadata.workspaceId,
            userId: session.metadata.userId,
            amountTotal: session.amount_total ?? 0,
            currency: session.currency ?? 'usd',
          });
          break;
        }

        const organizationId =
          session.metadata?.organizationId ?? session.client_reference_id ?? undefined;
        if (!organizationId) break;

        if (session.mode === 'subscription') {
          await this.applyEntitlement({
            organizationId,
            plan: 'pro',
            stripeCustomerId:
              typeof session.customer === 'string' ? session.customer : session.customer?.id,
            stripeSubscriptionId:
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id,
            billingStatus: 'active',
          });
          await this.clearPaymentFailures(organizationId);
          await this.syncDefaultPaymentMethod(organizationId);
        }

        if (session.mode === 'setup') {
          const setupIntentId =
            typeof session.setup_intent === 'string'
              ? session.setup_intent
              : session.setup_intent?.id;
          if (setupIntentId && this.stripe) {
            const setupIntent = await this.stripe.setupIntents.retrieve(setupIntentId);
            const pmId =
              typeof setupIntent.payment_method === 'string'
                ? setupIntent.payment_method
                : setupIntent.payment_method?.id;
            const customerId =
              typeof session.customer === 'string' ? session.customer : session.customer?.id;
            if (pmId && customerId) {
              await this.stripe.customers.update(customerId, {
                invoice_settings: { default_payment_method: pmId },
              });
              if (session.metadata?.organizationId) {
                const org = await this.prisma.organization.findUnique({
                  where: { id: organizationId },
                });
                if (org?.stripeSubscriptionId) {
                  await this.stripe.subscriptions.update(org.stripeSubscriptionId, {
                    default_payment_method: pmId,
                  });
                }
              }
            }
          }
          await this.clearPaymentFailures(organizationId);
          await this.syncDefaultPaymentMethod(organizationId);
          await this.audit.record({
            organizationId,
            action: 'billing.card_saved_auto_debit',
            route: 'stripe.webhook',
            metadata: { sessionId: session.id },
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;
        if (!organizationId) break;

        if (event.type === 'customer.subscription.deleted' || subscription.status === 'canceled') {
          await this.applyEntitlement({
            organizationId,
            plan: 'free',
            stripeSubscriptionId: null,
            billingStatus: 'canceled',
          });
        } else {
          const status =
            subscription.status === 'active' || subscription.status === 'trialing'
              ? 'active'
              : subscription.status === 'past_due' || subscription.status === 'unpaid'
                ? subscription.status
                : subscription.status;
          await this.applyEntitlement({
            organizationId,
            plan: 'pro',
            stripeSubscriptionId: subscription.id,
            billingStatus: status,
          });
          if (status === 'active' || status === 'trialing') {
            await this.clearPaymentFailures(organizationId);
          }
          await this.syncDefaultPaymentMethod(organizationId);
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const organizationId = await this.organizationIdFromCustomer(customerId);
        if (organizationId) {
          await this.clearPaymentFailures(organizationId);
          await this.syncDefaultPaymentMethod(organizationId);
        }
        break;
      }
      case 'invoice.payment_failed':
      case 'payment_intent.payment_failed': {
        const obj = event.data.object as Stripe.Invoice | Stripe.PaymentIntent;
        const customerId =
          typeof obj.customer === 'string' ? obj.customer : obj.customer?.id ?? null;
        const organizationId = await this.organizationIdFromCustomer(customerId);
        if (organizationId) {
          await this.recordPaymentFailure(organizationId, event.type);
        }
        break;
      }
      case 'charge.dispute.created':
      case 'radar.early_fraud_warning.created': {
        const obj = event.data.object as { charge?: string | { customer?: string | null } } & {
          customer?: string | null;
        };
        let customerId: string | null = typeof obj.customer === 'string' ? obj.customer : null;
        if (!customerId && this.stripe && typeof obj.charge === 'string') {
          const charge = await this.stripe.charges.retrieve(obj.charge);
          customerId = typeof charge.customer === 'string' ? charge.customer : null;
        }
        const organizationId = await this.organizationIdFromCustomer(customerId);
        if (organizationId) {
          await this.prisma.organization.update({
            where: { id: organizationId },
            data: { billingStatus: 'fraud_hold', fraudHoldAt: new Date() },
          });
          await this.audit.record({
            organizationId,
            action: 'billing.fraud_hold',
            route: 'stripe.webhook',
            metadata: { event: event.type },
          });
        }
        break;
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await this.prisma.organization.updateMany({
          where: { stripeConnectAccountId: account.id },
          data: { stripeConnectChargesEnabled: Boolean(account.charges_enabled) },
        });
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  /** Test helper — apply entitlement without Stripe. */
  applyEntitlementForTests(input: {
    organizationId: string;
    plan: PlanId;
    characterQuota?: number;
  }) {
    const plan = planFromId(input.plan);
    return this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        plan: plan.id,
        characterQuota: input.characterQuota ?? plan.characterQuota,
        billingStatus: 'active',
      },
    });
  }

  /** Test helper — mark org as Connect-ready without Stripe. */
  setConnectForTests(input: {
    organizationId: string;
    accountId?: string;
    chargesEnabled?: boolean;
  }) {
    return this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        stripeConnectAccountId: input.accountId ?? `acct_test_${input.organizationId}`,
        stripeConnectChargesEnabled: input.chargesEnabled ?? true,
      },
    });
  }
}
