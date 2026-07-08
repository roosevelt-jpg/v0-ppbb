import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint,
  addDoc,
  writeBatch,
} from 'firebase/firestore'
import { CustomForm, FormSubmission, FormStatistics } from '@/lib/form-builder-types'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { slugifyFormTitle } from '@/lib/form-builder-utils'

async function generateUniqueFormSlug(title: string, excludeFormId?: string): Promise<string> {
  const base = slugifyFormTitle(title) || `form-${Date.now()}`
  let candidate = base
  let attempt = 0

  while (attempt < 50) {
    const snap = await getDocs(query(collection(db, 'customForms'), where('slug', '==', candidate)))
    const collision = snap.docs.find((d) => d.id !== excludeFormId)
    if (!collision) return candidate
    attempt += 1
    candidate = `${base}-${attempt}`
  }

  return `${base}-${Date.now()}`
}

// ============ FORM CRUD OPERATIONS ============

export async function getAllForms(filters?: {
  status?: string
  category?: string
}): Promise<CustomForm[]> {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status))
    }
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category))
    }

    const q = query(collection(db, 'customForms'), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as CustomForm[]
  } catch (error) {
    console.error('[v0] Error fetching forms:', error)
    return []
  }
}

export function subscribeToForms(callback: (forms: CustomForm[]) => void) {
  try {
    const q = query(collection(db, 'customForms'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snapshot => {
      const forms = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as CustomForm[]
      callback(forms)
    })
  } catch (error) {
    console.error('[v0] Error subscribing to forms:', error)
    return () => {}
  }
}

export async function getFormById(formId: string): Promise<CustomForm | null> {
  try {
    const docRef = doc(db, 'customForms', formId)
    const snapshot = await getDoc(docRef)

    if (!snapshot.exists()) {
      return null
    }

    return {
      ...snapshot.data(),
      id: snapshot.id,
      createdAt: snapshot.data().createdAt?.toDate() || new Date(),
      updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
    } as CustomForm
  } catch (error) {
    console.error('[v0] Error fetching form:', error)
    return null
  }
}

export async function createForm(
  form: Omit<CustomForm, 'id' | 'createdAt' | 'updatedAt' | 'submissionCount'>
): Promise<string> {
  try {
    const slug =
      form.status === 'active'
        ? form.slug || (await generateUniqueFormSlug(form.title))
        : form.slug || ''

    const payload = sanitizeForFirestore({
      ...form,
      slug: slug || '',
      bannerImageUrl: form.bannerImageUrl || '',
      submissionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const docRef = await addDoc(collection(db, 'customForms'), payload)
    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating form:', error)
    throw error
  }
}

export async function updateForm(formId: string, updates: Partial<CustomForm>) {
  try {
    let slug = updates.slug
    if (updates.status === 'active' && !slug) {
      const existing = await getFormById(formId)
      slug = existing?.slug || (await generateUniqueFormSlug(updates.title || existing?.title || 'form', formId))
    }

    const docRef = doc(db, 'customForms', formId)
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        ...updates,
        ...(slug !== undefined ? { slug } : {}),
        updatedAt: new Date(),
      })
    )
  } catch (error) {
    console.error('[v0] Error updating form:', error)
    throw error
  }
}

export async function deleteForm(formId: string) {
  try {
    const batch = writeBatch(db)

    // Delete the form
    batch.delete(doc(db, 'customForms', formId))

    // Delete all submissions for this form
    const submissionsQuery = query(
      collection(db, 'formSubmissions'),
      where('formId', '==', formId)
    )
    const submissionsSnapshot = await getDocs(submissionsQuery)
    submissionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    await batch.commit()
  } catch (error) {
    console.error('[v0] Error deleting form:', error)
    throw error
  }
}

// ============ FORM SUBMISSION OPERATIONS ============

export async function getFormSubmissions(
  formId: string,
  filters?: { status?: string }
): Promise<FormSubmission[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('formId', '==', formId),
      orderBy('submittedAt', 'desc'),
    ]

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status))
    }

    const q = query(collection(db, 'formSubmissions'), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      submittedAt: doc.data().submittedAt?.toDate() || new Date(),
      reviewedAt: doc.data().reviewedAt?.toDate(),
    })) as FormSubmission[]
  } catch (error) {
    console.error('[v0] Error fetching submissions:', error)
    return []
  }
}

export async function getSubmissionById(submissionId: string): Promise<FormSubmission | null> {
  try {
    const docRef = doc(db, 'formSubmissions', submissionId)
    const snapshot = await getDoc(docRef)

    if (!snapshot.exists()) {
      return null
    }

    return {
      ...snapshot.data(),
      id: snapshot.id,
      submittedAt: snapshot.data().submittedAt?.toDate() || new Date(),
      reviewedAt: snapshot.data().reviewedAt?.toDate(),
    } as FormSubmission
  } catch (error) {
    console.error('[v0] Error fetching submission:', error)
    return null
  }
}

export function subscribeToFormSubmissions(
  formId: string,
  callback: (submissions: FormSubmission[]) => void,
  filters?: { status?: string }
) {
  try {
    const constraints: QueryConstraint[] = [
      where('formId', '==', formId),
      orderBy('submittedAt', 'desc'),
    ]
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status))
    }
    const q = query(collection(db, 'formSubmissions'), ...constraints)
    return onSnapshot(q, (snapshot) => {
      const submissions = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        submittedAt: d.data().submittedAt?.toDate() || new Date(),
        reviewedAt: d.data().reviewedAt?.toDate(),
      })) as FormSubmission[]
      callback(submissions)
    })
  } catch (error) {
    console.error('[v0] Error subscribing to submissions:', error)
    return () => {}
  }
}

export async function submitForm(
  formId: string,
  responses: Record<string, any>,
  userEmail?: string
): Promise<string> {
  try {
    const submission: Omit<FormSubmission, 'id'> = {
      formId,
      userEmail,
      responses,
      status: 'pending',
      submittedAt: new Date(),
    }

    const docRef = await addDoc(collection(db, 'formSubmissions'), {
      ...submission,
      submittedAt: new Date(),
    })

    // Update submission count on form
    const formRef = doc(db, 'customForms', formId)
    const formDoc = await getDoc(formRef)
    if (formDoc.exists()) {
      const currentCount = formDoc.data().submissionCount || 0
      await updateDoc(formRef, {
        submissionCount: currentCount + 1,
      })
    }

    return docRef.id
  } catch (error) {
    console.error('[v0] Error submitting form:', error)
    throw error
  }
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: 'pending' | 'reviewed' | 'approved' | 'rejected',
  reviewerEmail?: string,
  notes?: string
) {
  try {
    await updateDoc(doc(db, 'formSubmissions', submissionId), {
      status,
      reviewedAt: new Date(),
      reviewedBy: reviewerEmail,
      notes,
    })
  } catch (error) {
    console.error('[v0] Error updating submission status:', error)
    throw error
  }
}

// ============ FORM STATISTICS ============

export async function getFormStatistics(): Promise<FormStatistics> {
  try {
    const formsSnapshot = await getDocs(collection(db, 'customForms'))
    const submissionsSnapshot = await getDocs(collection(db, 'formSubmissions'))

    const activeForms = formsSnapshot.docs.filter(
      doc => doc.data().status === 'active'
    ).length

    const pendingSubmissions = submissionsSnapshot.docs.filter(
      doc => doc.data().status === 'pending'
    ).length

    const totalSubmissions = submissionsSnapshot.size

    return {
      totalForms: formsSnapshot.size,
      activeForms,
      totalSubmissions,
      pendingReviews: pendingSubmissions,
      averageResponseRate: totalSubmissions > 0 ? (totalSubmissions / activeForms) || 0 : 0,
    }
  } catch (error) {
    console.error('[v0] Error calculating statistics:', error)
    return {
      totalForms: 0,
      activeForms: 0,
      totalSubmissions: 0,
      pendingReviews: 0,
      averageResponseRate: 0,
    }
  }
}

// ============ PRE-BUILT FORMS ============

export async function createDefaultForms() {
  try {
    const defaultForms = [
      {
        title: 'Charity Support Request',
        description: 'Apply for financial support from our charity program',
        category: 'charity' as const,
        createdBy: 'system',
        status: 'active' as const,
        sections: [
          {
            title: 'Personal Information',
            description: 'Tell us about yourself',
            fields: [
              {
                id: 'fullName',
                type: 'text' as const,
                label: 'Full Name',
                required: true,
                order: 1,
              },
              {
                id: 'email',
                type: 'email' as const,
                label: 'Email Address',
                required: true,
                order: 2,
              },
              {
                id: 'phone',
                type: 'phone' as const,
                label: 'Phone Number',
                required: true,
                order: 3,
              },
            ],
            order: 1,
          },
          {
            title: 'Support Details',
            description: 'Describe your support needs',
            fields: [
              {
                id: 'requestType',
                type: 'select' as const,
                label: 'Type of Support Needed',
                required: true,
                options: [
                  { id: '1', label: 'Financial Assistance', value: 'financial' },
                  { id: '2', label: 'Medical Support', value: 'medical' },
                  { id: '3', label: 'Education Support', value: 'education' },
                  { id: '4', label: 'Emergency Relief', value: 'emergency' },
                ],
                order: 1,
              },
              {
                id: 'description',
                type: 'textarea' as const,
                label: 'Describe Your Situation',
                required: true,
                order: 2,
              },
              {
                id: 'amount',
                type: 'number' as const,
                label: 'Amount Needed (AED)',
                required: false,
                order: 3,
              },
            ],
            order: 2,
          },
        ],
      },
      {
        title: 'Event Registration',
        description: 'Register for upcoming community events',
        category: 'event' as const,
        createdBy: 'system',
        status: 'active' as const,
        sections: [
          {
            title: 'Attendee Information',
            fields: [
              {
                id: 'name',
                type: 'text' as const,
                label: 'Full Name',
                required: true,
                order: 1,
              },
              {
                id: 'email',
                type: 'email' as const,
                label: 'Email',
                required: true,
                order: 2,
              },
              {
                id: 'guests',
                type: 'number' as const,
                label: 'Number of Guests',
                required: false,
                order: 3,
              },
            ],
            order: 1,
          },
        ],
      },
      {
        title: 'Volunteer Application',
        description: 'Join our volunteer program',
        category: 'volunteer' as const,
        createdBy: 'system',
        status: 'active' as const,
        sections: [
          {
            title: 'Volunteer Details',
            fields: [
              {
                id: 'name',
                type: 'text' as const,
                label: 'Full Name',
                required: true,
                order: 1,
              },
              {
                id: 'experience',
                type: 'textarea' as const,
                label: 'Volunteer Experience',
                required: false,
                order: 2,
              },
              {
                id: 'interests',
                type: 'multiselect' as const,
                label: 'Areas of Interest',
                required: true,
                options: [
                  { id: '1', label: 'Community Support', value: 'community' },
                  { id: '2', label: 'Education', value: 'education' },
                  { id: '3', label: 'Healthcare', value: 'healthcare' },
                ],
                order: 3,
              },
            ],
            order: 1,
          },
        ],
      },
    ]

    for (const form of defaultForms) {
      const formRef = collection(db, 'customForms')
      const existingForm = await getDocs(
        query(formRef, where('title', '==', form.title))
      )

      if (existingForm.empty) {
        const slug = slugifyFormTitle(form.title)
        await addDoc(formRef, sanitizeForFirestore({
          ...form,
          slug,
          submissionCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      }
    }
  } catch (error) {
    console.error('[v0] Error creating default forms:', error)
  }
}
