'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAllPages, createPage, updatePage, deletePage } from '@/lib/admin'
import { Page } from '@/lib/types'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AdminPages() {
  const [pages, setPages] = React.useState<Page[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingPage, setEditingPage] = React.useState<Page | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)

  React.useEffect(() => {
    const loadPages = async () => {
      try {
        const fetchedPages = await getAllPages(true)
        setPages(fetchedPages)
      } catch (error) {
        console.error('[v0] Error loading pages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPages()
  }, [])

  const handleCreateNew = () => {
    setEditingPage({
      id: '',
      slug: '',
      title: '',
      description: '',
      content: '',
      seoTitle: '',
      seoDescription: '',
      keywords: [],
      status: 'draft',
      order: pages.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    setIsCreating(true)
  }

  const handleSavePage = async () => {
    if (!editingPage) return

    try {
      if (isCreating) {
        const pageData = {
          slug: editingPage.slug,
          title: editingPage.title,
          description: editingPage.description,
          content: editingPage.content,
          seoTitle: editingPage.seoTitle,
          seoDescription: editingPage.seoDescription,
          keywords: editingPage.keywords,
          status: editingPage.status,
          order: editingPage.order,
        }
        const newPageId = await createPage(pageData)
        if (newPageId) {
          setPages([...pages, { ...editingPage, id: newPageId }])
        }
      } else {
        await updatePage(editingPage.id, editingPage)
        setPages(pages.map((p) => (p.id === editingPage.id ? editingPage : p)))
      }
      setEditingPage(null)
      setIsCreating(false)
    } catch (error) {
      console.error('[v0] Error saving page:', error)
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    try {
      await deletePage(pageId)
      setPages(pages.filter((p) => p.id !== pageId))
    } catch (error) {
      console.error('[v0] Error deleting page:', error)
    }
  }

  return (
    <>
      
      <div className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">All Pages</h2>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading pages...</p>
        ) : pages.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No pages yet. Create one to get started!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pages.map((page) => (
              <Card key={page.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{page.title}</h3>
                  <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  <p className="text-xs text-muted-foreground mt-1">{page.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {page.status === 'published' ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-600" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPage(page)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Page Editor Modal */}
        {editingPage && (
          <div className="admin-modal-overlay p-4">
            <div className="admin-modal-content bg-white rounded-lg w-full max-w-2xl flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-200 flex-shrink-0">
                <h2 className="text-2xl font-bold">
                  {isCreating ? 'Create New Page' : 'Edit Page'}
                </h2>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium mb-2">Page Title</label>
                  <input
                    type="text"
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                  <input
                    type="text"
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editingPage.description}
                    onChange={(e) => setEditingPage({ ...editingPage, description: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={editingPage.content}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground h-40 font-mono text-sm"
                    placeholder="Enter HTML or markdown content"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">SEO Title</label>
                    <input
                      type="text"
                      value={editingPage.seoTitle}
                      onChange={(e) => setEditingPage({ ...editingPage, seoTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={editingPage.status}
                      onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Buttons */}
              <div className="p-6 border-t border-neutral-200 flex gap-3 flex-shrink-0">
                <Button
                  onClick={handleSavePage}
                  className="flex-1"
                >
                  Save Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingPage(null)
                    setIsCreating(false)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
