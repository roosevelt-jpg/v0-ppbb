import type { CustomForm, FormField, FormFieldOption, FormSection } from '@/lib/form-builder-types'

function opts(labels: string[]): FormFieldOption[] {
  return labels.map((label, i) => ({
    id: `opt-${i + 1}`,
    label,
    value: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
  }))
}

function field(
  id: string,
  type: FormField['type'],
  label: string,
  order: number,
  required = true,
  options?: string[]
): FormField {
  return {
    id,
    type,
    label,
    required,
    order,
    ...(options ? { options: opts(options) } : {}),
  }
}

function section(
  id: string,
  title: string,
  order: number,
  fields: FormField[],
  description?: string
): FormSection {
  return { id, title, description, fields, order }
}

/** Templates mirrored from Passive Blessings Google Forms (where publicly readable). */
export const PB_FORM_TEMPLATES: Omit<
  CustomForm,
  'id' | 'createdAt' | 'updatedAt' | 'submissionCount' | 'createdBy'
>[] = [
  {
    title: 'Passive Blessings Partnership Inquiry',
    description:
      'For sponsors, collaborations, campaigns, events, products, CSR, and strategic partnerships. Our team typically responds in 7–14 working days.',
    category: 'partnership',
    status: 'active',
    slug: 'partnership-inquiry',
    sections: [
      section('s1', 'Contact Information', 1, [
        field('fullName', 'text', 'Full Name', 1),
        field('company', 'text', 'Company / Organization Name', 2),
        field('jobTitle', 'text', 'Job Title / Role', 3),
        field('email', 'email', 'Email Address', 4),
        field('phone', 'phone', 'Mobile / WhatsApp Number', 5),
        field('website', 'textarea', 'Website / Social Media Links', 6),
      ]),
      section('s2', 'Partnership Details', 2, [
        field(
          'partnershipType',
          'radio',
          'Type of Partnership Inquiry',
          1,
          true,
          [
            "Sponsor a Passive Blessings' Initiatives",
            'Sponsor Request for Your Initiative by Passive Blessings',
            'Product placement / supply partnership',
            'Co-host event / collaboration',
            'Charity / CSR partnership',
            'Corporate wellness / workforce activation',
            'Venue partnership',
            'Media / PR partnership',
            'Strategic long-term partnership',
            'Government / institutional collaboration',
          ]
        ),
        field('projectName', 'text', 'Project / Event / Campaign Name', 2),
        field('partnerName', 'text', 'Partner / Organizer Name', 3),
        field(
          'partnerType',
          'select',
          'Partner Type',
          4,
          true,
          [
            'Corporate Company',
            'SME / Business',
            'Government Entity',
            'NGO / Charity',
            'School / University',
            'Influencer / Media',
            'Startup',
            'Individual',
          ]
        ),
      ]),
      section('s3', 'Project Information', 3, [
        field('projectDate', 'text', 'Proposed Project Date & Time / Duration', 1),
        field('deadline', 'text', 'Deadline to Respond/Participate', 2),
        field('location', 'text', 'Location / Venue', 3),
        field(
          'audience',
          'multiselect',
          'Target Audience (Who is this for?)',
          4,
          true,
          [
            'Youth',
            'Families',
            'Women',
            'Men',
            'Workers / Frontline Staff',
            'Reverts',
            'Businesses',
            'Community Public',
            'Schools / Students',
            'Other',
          ]
        ),
      ]),
      section('s4', 'The Ask', 4, [
        field(
          'requesting',
          'multiselect',
          'What are you requesting from Passive Blessings?',
          1,
          true,
          [
            'Community access',
            'Event co-hosting',
            'Promotion',
            'Volunteers',
            'Venue attendance',
            'Product purchase',
            'Strategic collaboration',
            'Sponsorship/Funding',
          ]
        ),
        field(
          'offering',
          'multiselect',
          'What can you offer Passive Blessings in return?',
          2,
          true,
          [
            'Sponsorship funding',
            'Venue access',
            'Giveaways',
            'Media exposure',
            'Revenue share',
            'Long-term collaboration',
            'Discounts for members',
          ]
        ),
      ]),
      section('s5', 'Value Alignment', 5, [
        field(
          'pbBenefits',
          'textarea',
          "What would be PB's internal benefits from this partnership?",
          1
        ),
        field(
          'yourBenefits',
          'textarea',
          'What would be your benefits from partnering with Passive Blessings?',
          2
        ),
        field(
          'whyPb',
          'textarea',
          'Why do you want to partner with Passive Blessings specifically?',
          3
        ),
        field(
          'credibility',
          'textarea',
          'Your Past Credibility / Previous Projects / Experience',
          4
        ),
        field(
          'nextStep',
          'radio',
          'Your Preferred Next Step',
          5,
          true,
          [
            'Intro call',
            'Meeting in person',
            'Send proposal deck',
            'Receive sponsorship packages',
            'Receive media kit',
            'WhatsApp discussion',
            'Email Coordination',
          ]
        ),
      ]),
    ],
  },
  {
    title: 'Volunteer with PB (Unpaid Service)',
    description:
      'Apply to volunteer with Passive Blessings. This is unpaid community service — thank you for giving your time.',
    category: 'volunteer',
    status: 'active',
    slug: 'volunteer-unpaid-service',
    sections: [
      section('v1', 'Personal Details', 1, [
        field('fullName', 'text', 'Full Name', 1),
        field('email', 'email', 'Email Address', 2),
        field('phone', 'phone', 'Mobile / WhatsApp Number', 3),
        field('nationality', 'text', 'Nationality', 4),
        field('emirate', 'select', 'Emirate / City', 5, true, [
          'Dubai',
          'Abu Dhabi',
          'Sharjah',
          'Ajman',
          'Umm Al Quwain',
          'Ras Al Khaimah',
          'Fujairah',
          'Other',
        ]),
        field('gender', 'radio', 'Gender', 6, true, ['Male', 'Female', 'Prefer not to say']),
        field('ageRange', 'select', 'Age range', 7, true, [
          'Under 18',
          '18–24',
          '25–34',
          '35–44',
          '45–54',
          '55+',
        ]),
      ]),
      section('v2', 'Availability & Interests', 2, [
        field(
          'areas',
          'multiselect',
          'Areas you want to support',
          1,
          true,
          [
            'Weekly meal distribution',
            'Events setup / logistics',
            'Sisters programs',
            'Brothers programs',
            'Family / kids activities',
            'Charity case support',
            'Registration / check-in',
            'Photography / media',
            'Admin / coordination',
            'Other',
          ]
        ),
        field(
          'days',
          'multiselect',
          'Days you are usually available',
          2,
          true,
          ['Weekdays', 'Weekends', 'Evenings', 'Flexible / on call']
        ),
        field('hoursPerMonth', 'select', 'Hours you can give per month', 3, true, [
          '1–4 hours',
          '5–10 hours',
          '11–20 hours',
          '20+ hours',
        ]),
        field('skills', 'textarea', 'Skills, languages, or experience relevant to volunteering', 4, false),
        field('motivation', 'textarea', 'Why do you want to volunteer with Passive Blessings?', 5),
        field('emergencyContact', 'text', 'Emergency contact name & number', 6),
      ]),
      section('v3', 'Agreement', 3, [
        field(
          'unpaidAck',
          'checkbox',
          'I understand this is unpaid volunteer service',
          1,
          true,
          ['I understand and agree']
        ),
        field(
          'conductAck',
          'checkbox',
          'I agree to follow Passive Blessings community guidelines and instructions from organizers',
          2,
          true,
          ['I agree']
        ),
      ]),
    ],
  },
  {
    title: 'Community Feedback',
    description:
      'Anonymous-friendly feedback to help Passive Blessings improve community, events, and management.',
    category: 'other',
    status: 'active',
    slug: 'community-feedback',
    sections: [
      section('f1', 'About Your Experience', 1, [
        field(
          'overall',
          'radio',
          'How would you describe your overall experience with Passive Blessings so far?',
          1,
          true,
          ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Poor']
        ),
        field(
          'connected',
          'rating',
          'How connected do you feel to the community? (1–5)',
          2
        ),
        field(
          'valueMost',
          'radio',
          'Which part of PB do you value most?',
          3,
          true,
          [
            'Community / Belonging',
            'Charity / Welfare',
            'Events & Activities',
            'Spiritual Growth',
            'Networking / Business',
            'Opportunities / Jobs',
            'Supportive People',
            'Other',
          ]
        ),
      ]),
      section('f2', 'Events & Programs', 2, [
        field(
          'eventSatisfaction',
          'rating',
          'How satisfied are you with our events and activities? (1–5)',
          1
        ),
        field('moreEvents', 'textarea', 'What events/programs would you like to see more of?', 2),
        field(
          'timingConvenient',
          'radio',
          'Are event timings and locations convenient for you?',
          3,
          true,
          ['Yes', 'Sometimes', 'No']
        ),
        field(
          'eventsTeamFeedback',
          'textarea',
          'Any specific feedback for the events organizing team?',
          4
        ),
      ]),
      section('f3', 'Communication & Management', 3, [
        field(
          'commsClarity',
          'rating',
          'How clear is our communication (WhatsApp, updates, announcements)? (1–5)',
          1
        ),
        field(
          'safeManaged',
          'rating',
          'Do you feel the community is well-managed and safe? (1–5)',
          2
        ),
        field(
          'commsSuggestions',
          'textarea',
          'Any suggestions for improving communication or management?',
          3
        ),
      ]),
      section('f4', 'Community Culture', 4, [
        field(
          'welcomed',
          'radio',
          'Do you feel welcomed and respected within PB?',
          1,
          true,
          ['Always', 'Usually', 'Sometimes', 'Rarely', 'No']
        ),
        field(
          'concerning',
          'textarea',
          'Have you experienced or observed anything concerning?',
          2
        ),
      ]),
      section('f5', 'Growth & Future', 5, [
        field(
          'futureFocus',
          'radio',
          'What should Passive Blessings focus on more in the future?',
          1,
          true,
          [
            'Charity initiatives',
            'Youth development',
            "Women's programs",
            'Family programs',
            'Spiritual growth',
            'Business / careers',
            'Better events',
            'Stronger community systems',
            'More volunteering opportunities',
          ]
        ),
        field(
          'wouldVolunteer',
          'radio',
          'Would you volunteer or contribute skills to PB?',
          2,
          false,
          ['Yes', 'Maybe', 'No']
        ),
        field('leadershipFeedback', 'textarea', 'Any final honest feedback for leadership?', 3),
        field('contactOk', 'radio', 'Would you like us to contact you?', 4, false, ['Yes', 'No']),
        field('contactDetails', 'text', 'Name / Number (Optional)', 5, false),
      ]),
    ],
  },
  {
    title: 'Charity Support Request',
    description:
      'Confidential application for charity support. Documents are reviewed securely by authorized team members only.',
    category: 'charity',
    status: 'active',
    slug: 'charity-support-request',
    sections: [
      section('c1', 'Personal Information', 1, [
        field('fullName', 'text', 'Full Name', 1),
        field('email', 'email', 'Email Address', 2),
        field('phone', 'phone', 'Phone / WhatsApp Number', 3),
        field('dateOfBirth', 'date', 'Date of Birth', 4, false),
        field('nationality', 'text', 'Nationality', 5),
        field('emirate', 'select', 'Current Emirate / Area', 6, true, [
          'Dubai',
          'Abu Dhabi',
          'Sharjah',
          'Ajman',
          'Umm Al Quwain',
          'Ras Al Khaimah',
          'Fujairah',
          'Other',
        ]),
        field('familySize', 'number', 'Number of family members in household', 7, false),
      ]),
      section('c2', 'Support Needed', 2, [
        field(
          'supportType',
          'select',
          'Type of Support Needed',
          1,
          true,
          [
            'Financial Assistance',
            'Medical Support',
            'Education Support',
            'Rent / Housing',
            'Food Support',
            'Emergency Relief',
            'Other',
          ]
        ),
        field(
          'emergencyLevel',
          'radio',
          'Urgency / Emergency Level',
          2,
          true,
          ['Low', 'Medium', 'High', 'Critical']
        ),
        field('amountNeeded', 'number', 'Amount Needed (AED)', 3, false),
        field('reason', 'textarea', 'Describe your situation and why you need support', 4),
        field('referralSource', 'text', 'How did you hear about Passive Blessings? (optional)', 5, false),
      ]),
      section('c3', 'Documents', 3, [
        field('emiratesId', 'file', 'Emirates ID copy', 1),
        field('passport', 'file', 'Passport copy', 2),
        field('visa', 'file', 'Visa / residency page', 3),
        field('salaryCertificate', 'file', 'Salary certificate / payslip (or unemployment declaration)', 4),
        field('bankStatement', 'file', 'Bank statement (optional)', 5, false),
        field('supportingDocs', 'file', 'Other supporting documents (optional)', 6, false),
      ], 'Upload clear scans or photos. Sensitive documents are stored securely.'),
      section('c4', 'Consent', 4, [
        field(
          'consent',
          'checkbox',
          'I consent to Passive Blessings collecting and storing this data in accordance with UAE data protection laws and the platform privacy policy',
          1,
          true,
          ['I consent']
        ),
      ]),
    ],
  },
]
