import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const STRIPE_PRICE_ID_MAP: Record<string, string> = {} // Will be populated from plan data

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, gateway } = await req.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Missing planId or userId' },
        { status: 400 }
      )
    }

    // Fetch the pricing plan from Firestore
    const planDoc = await getDoc(doc(db, 'pricingPlans', planId))
    if (!planDoc.exists()) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    const plan = planDoc.data()

    // Route to appropriate payment gateway
    switch (gateway) {
      case 'stripe':
        return handleStripeCheckout(plan, userId, planId)
      case 'paypal':
        return handlePayPalCheckout(plan, userId, planId)
      case 'ziina':
        return handleZiinaCheckout(plan, userId, planId)
      default:
        return NextResponse.json(
          { error: 'Invalid payment gateway' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[v0] Checkout error:', error)
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    )
  }
}

async function handleStripeCheckout(plan: any, userId: string, planId: string) {
  try {
    const stripe = require('stripe')(STRIPE_SECRET)

    // Create or get Stripe product
    let productId = plan.stripeProductId
    if (!productId) {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { planId },
      })
      productId = product.id

      // Update plan with Stripe product ID
      await updateDoc(doc(db, 'pricingPlans', planId), {
        stripeProductId: productId,
      })
    }

    // Create or get price
    let priceId = plan.stripePriceId
    if (!priceId) {
      const price = await stripe.prices.create({
        unit_amount: plan.price, // already in cents
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: plan.billingPeriod === 'yearly' ? 'year' : 'month',
        },
        product: productId,
      })
      priceId = price.id

      // Update plan with Stripe price ID
      await updateDoc(doc(db, 'pricingPlans', planId), {
        stripePriceId: priceId,
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/membership?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/membership?status=canceled`,
      customer_email: (await getDoc(doc(db, 'users', userId))).data()?.email,
      metadata: {
        userId,
        planId,
      },
    })

    // Log checkout session
    await addDoc(collection(db, 'checkoutSessions'), {
      userId,
      planId,
      sessionId: session.id,
      gateway: 'stripe',
      status: 'pending',
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
    })
  } catch (error) {
    console.error('[v0] Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Stripe checkout failed' },
      { status: 500 }
    )
  }
}

async function handlePayPalCheckout(plan: any, userId: string, planId: string) {
  try {
    // PayPal integration - create subscription plan if needed
    const paypalClientId = process.env.PAYPAL_CLIENT_ID
    const paypalSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!paypalClientId || !paypalSecret) {
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 400 }
      )
    }

    // Get PayPal access token
    const auth = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64')
    const tokenResponse = await fetch('https://api.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    const { access_token } = await tokenResponse.json()

    // Create or get PayPal plan
    let paypalPlanId = plan.paypalPlanId
    if (!paypalPlanId) {
      const planResponse = await fetch('https://api.paypal.com/v1/billing/plans', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: 'PROD_' + planId.substring(0, 10),
          name: plan.name,
          description: plan.description,
          billing_cycles: [
            {
              frequency: {
                interval_unit: plan.billingPeriod === 'yearly' ? 'YEAR' : 'MONTH',
                interval_count: 1,
              },
              tenure_type: 'REGULAR',
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: {
                  value: (plan.price / 100).toString(),
                  currency_code: plan.currency,
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_amount: 'YES',
            payment_failure_threshold: 3,
          },
        }),
      })

      const planData = await planResponse.json()
      paypalPlanId = planData.id

      // Update plan with PayPal ID
      await updateDoc(doc(db, 'pricingPlans', planId), {
        paypalPlanId,
      })
    }

    // Create subscription
    const subscriptionResponse = await fetch('https://api.paypal.com/v1/billing/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: paypalPlanId,
        subscriber: {
          email_address: (await getDoc(doc(db, 'users', userId))).data()?.email,
        },
        application_context: {
          brand_name: process.env.NEXT_PUBLIC_APP_NAME || 'Passive Blessings',
          locale: 'en-US',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/return?planId=${planId}&userId=${userId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/membership?status=canceled`,
        },
      }),
    })

    const subscription = await subscriptionResponse.json()

    // Log checkout session
    await addDoc(collection(db, 'checkoutSessions'), {
      userId,
      planId,
      subscriptionId: subscription.id,
      gateway: 'paypal',
      status: 'pending',
      createdAt: serverTimestamp(),
    })

    // Find approval link
    const approvalLink = subscription.links.find((link: any) => link.rel === 'approve')

    return NextResponse.json({
      checkoutUrl: approvalLink?.href,
    })
  } catch (error) {
    console.error('[v0] PayPal checkout error:', error)
    return NextResponse.json(
      { error: 'PayPal checkout failed' },
      { status: 500 }
    )
  }
}

async function handleZiinaCheckout(plan: any, userId: string, planId: string) {
  try {
    const ziinaPublicKey = process.env.ZIINA_PUBLIC_KEY
    const ziinaPrivateKey = process.env.ZIINA_PRIVATE_KEY

    if (!ziinaPublicKey || !ziinaPrivateKey) {
      return NextResponse.json(
        { error: 'Ziina not configured' },
        { status: 400 }
      )
    }

    // Create Ziina charge/transaction for subscription
    const userData = (await getDoc(doc(db, 'users', userId))).data()
    
    const ziinaPayload = {
      amount: plan.price / 100, // Ziina expects amount in full currency units
      currency: plan.currency,
      description: `${plan.name} - ${plan.billingPeriod} subscription`,
      customer: {
        name: userData?.firstName + ' ' + userData?.lastName,
        email: userData?.email,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/ziina/return?planId=${planId}&userId=${userId}`,
      metadata: {
        planId,
        userId,
        type: 'subscription',
      },
    }

    // Create transaction on Ziina
    const ziinaResponse = await fetch('https://api.ziina.me/v1/transactions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ziinaPrivateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ziinaPayload),
    })

    const transaction = await ziinaResponse.json()

    // Log checkout session
    await addDoc(collection(db, 'checkoutSessions'), {
      userId,
      planId,
      transactionId: transaction.id,
      gateway: 'ziina',
      status: 'pending',
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({
      checkoutUrl: transaction.redirect_url || transaction.checkout_url,
    })
  } catch (error) {
    console.error('[v0] Ziina checkout error:', error)
    return NextResponse.json(
      { error: 'Ziina checkout failed' },
      { status: 500 }
    )
  }
}
