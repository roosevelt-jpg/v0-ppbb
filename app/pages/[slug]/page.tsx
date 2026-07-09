import { notFound } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { getAdminDb } from '@/lib/firebase-admin'
import { stripDuplicateCmsHeadings } from '@/lib/cms-page-content'

export const dynamic = 'force-dynamic'

async function getPublishedPage(slug: string) {
  const db = getAdminDb()
  const snap = await db
    .collection('pages')
    .where('slug', '==', slug)
    .where('status', '==', 'published')
    .limit(1)
    .get()

  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as {
    title: string
    description?: string
    content?: string
    seoTitle?: string
    externalHref?: string
  }
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPublishedPage(slug)

  if (!page) notFound()

  if (page.externalHref?.trim()) {
    const { redirect } = await import('next/navigation')
    redirect(page.externalHref.trim())
  }

  const title = page.seoTitle || page.title
  const bodyHtml = stripDuplicateCmsHeadings(page.content || '', title, page.title)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">{title}</h1>
          {page.description ? (
            <p className="text-neutral-600 mb-8 font-body">{page.description}</p>
          ) : null}
          <article
            className="prose prose-neutral max-w-none font-body cms-page-content"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
