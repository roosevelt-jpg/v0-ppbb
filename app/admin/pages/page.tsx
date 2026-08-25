'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { getAllPages, createPage, updatePage, deletePage } from '@/lib/admin'
import { Page } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_ICON_COMPACT,
  ACTION_ROW,
} from '@/lib/admin-design-system'
import {
  subscribeToNavigation,
  DEFAULT_NAVIGATION,
  type NavigationConfig,
} from '@/lib/platform-config'
import { getCmsPageHref } from '@/lib/cms-page-routes'
import {
  normalizeCmsContentForSave,
  prepareCmsContentForEditor,
} from '@/lib/cms-page-content'
import { RichTextEditor } from '@/components/rich-text-editor'

export const dynamic = 'force-dynamic'

type MenuPlacement = 'header' | 'footer' | 'none'

function placementFromPage(page: Page): MenuPlacement {
  if (!page.showInMenu || page.menuLocation === 'none') return 'none'
  if (page.menuLocation === 'navbar') return 'header'
  if (
    page.menuLocation === 'footer-quicklinks' ||
    page.menuLocation === 'footer-getinvolved' ||
    page.menuLocation === 'footer-legal'
  ) {
    return 'footer'
  }
  return 'none'
}

function menuLocationFromPlacement(
  placement: MenuPlacement,
  footerColumn: Page['menuLocation'],
  headerSection: string
): Page['menuLocation'] {
  if (placement === 'none') return 'none'
  if (placement === 'header') return 'navbar'
  return footerColumn || 'footer-quicklinks'
}

function buildPagePayload(page: Page) {
  const title = page.title.trim()
  const seoTitle = page.seoTitle?.trim() || title
  const content = normalizeCmsContentForSave(page.content || '', seoTitle, title)

  return {
    slug: page.slug.trim(),
    title,
    description: page.description || '',
    content,
    seoTitle,
    seoDescription: page.seoDescription || '',
    keywords: page.keywords || [],
    status: page.status,
    order: page.order ?? 0,
    showInMenu: !!page.showInMenu,
    menuLocation: page.showInMenu ? page.menuLocation || 'none' : 'none',
    menuLabel: page.menuLabel?.trim() || page.title.trim(),
    menuOrder: page.menuOrder ?? 0,
    headerSection: page.showInMenu && page.menuLocation === 'navbar' ? page.headerSection || '' : '',
    externalHref: page.externalHref?.trim() || '',
  }
}

export default function AdminPages() {
  const { user } = useAuth()
  const [pages, setPages] = React.useState<Page[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingPage, setEditingPage] = React.useState<Page | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [menuPlacement, setMenuPlacement] = React.useState<MenuPlacement>('none')
  const [navConfig, setNavConfig] = React.useState<NavigationConfig>(DEFAULT_NAVIGATION)

  React.useEffect(() => {
    const loadPages = async () => {
      try {
        const fetchedPages = await getAllPages(true)
        setPages(fetchedPages.filter((p) => p.status !== 'deleted'))
      } catch (error) {
        console.error('[v0] Error loading pages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPages()
  }, [])

  React.useEffect(() => {
    return subscribeToNavigation(setNavConfig)
  }, [])

  const navLinks = navConfig.links
    .filter((l) => l.isVisible !== false)
    .sort((a, b) => a.order - b.order)

  const openEditor = (page: Page, creating: boolean) => {
    setEditingPage({
      ...page,
      content: prepareCmsContentForEditor(page.content || ''),
    })
    setIsCreating(creating)
    setMenuPlacement(placementFromPage(page))
  }

  const handleCreateNew = () => {
    openEditor(
      {
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
        menuLocation: 'none',
        showInMenu: false,
        menuLabel: '',
        menuOrder: pages.length,
        headerSection: '',
        externalHref: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      true
    )
    setMenuPlacement('none')
  }

  const handlePlacementChange = (placement: MenuPlacement) => {
    if (!editingPage) return
    setMenuPlacement(placement)
    if (placement === 'none') {
      setEditingPage({ ...editingPage, showInMenu: false, menuLocation: 'none', headerSection: '' })
      return
    }
    const menuLocation =
      placement === 'header'
        ? 'navbar'
        : editingPage.menuLocation?.startsWith('footer-')
          ? editingPage.menuLocation
          : 'footer-quicklinks'
    setEditingPage({
      ...editingPage,
      showInMenu: true,
      menuLocation,
      headerSection: placement === 'header' ? editingPage.headerSection || navLinks[0]?.href || '' : '',
    })
  }

  const handleSavePage = async () => {
    if (!editingPage) return

    try {
      const payload = buildPagePayload(editingPage)
      if (isCreating) {
        const newPageId = await createPage(payload, user || undefined)
        if (newPageId) {
          setPages([...pages, { ...editingPage, ...payload, id: newPageId }])
        }
      } else {
        await updatePage(editingPage.id, payload, user || undefined)
        setPages(pages.map((p) => (p.id === editingPage.id ? { ...editingPage, ...payload } : p)))
      }
      setEditingPage(null)
      setIsCreating(false)
      setMenuPlacement('none')
    } catch (error) {
      console.error('[v0] Error saving page:', error)
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    try {
      await deletePage(pageId, user || undefined)
      setPages(pages.filter((p) => p.id !== pageId))
    } catch (error) {
      console.error('[v0] Error deleting page:', error)
    }
  }

  const handlePreview = (page: Page) => {
    if (page.status !== 'published') {
      window.alert('Publish this page first to preview it on the public site.')
      return
    }
    const href = getCmsPageHref(page)
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <AdminPageLayout
      title="Pages CMS"
      subtitle="Edit site pages with formatting — bold, italics, lists, headings, and links."
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold">All Pages</h2>
        <button type="button" onClick={handleCreateNew} className={`inline-flex items-center gap-2 ${BUTTON_PRIMARY}`}>
          <Plus className="h-4 w-4" />
          Create Page
        </button>
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
            <Card key={page.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{page.title}</h3>
                <p className="text-sm text-muted-foreground truncate">/{page.slug}</p>
                {page.description ? (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{page.description}</p>
                ) : null}
              </div>
              <div className={`${ACTION_ROW} flex-shrink-0`}>
                {page.status === 'published' ? (
                  <Eye className="h-3.5 w-3.5 text-green-600" aria-hidden />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
                )}
                <button
                  type="button"
                  title="Preview page"
                  onClick={() => handlePreview(page)}
                  className={BUTTON_ICON_COMPACT}
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Edit page"
                  onClick={() => openEditor(page, false)}
                  className={BUTTON_ICON_COMPACT}
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete page"
                  onClick={() => handleDeletePage(page.id)}
                  className={BUTTON_ICON_COMPACT}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editingPage && (
        <div className="admin-modal-overlay p-4">
          <div className="admin-modal-content bg-white rounded-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-200 flex-shrink-0">
              <h2 className="text-2xl font-bold">{isCreating ? 'Create New Page' : 'Edit Page'}</h2>
            </div>

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
                  placeholder="my-page"
                />
                <p className="text-xs text-neutral-500 mt-1">Public URL: /pages/{editingPage.slug || '…'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingPage.description}
                  onChange={(e) => setEditingPage({ ...editingPage, description: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Page content</label>
                <p className="text-xs text-neutral-500 mb-2">
                  Use the toolbar for bold, italics, subtitles, bullets, numbering, and hyperlinks.
                  Applies to this page and all future pages.
                </p>
                <RichTextEditor
                  value={editingPage.content}
                  onChange={(html) => setEditingPage({ ...editingPage, content: html })}
                  placeholder="Write or paste page content…"
                  minHeight={280}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value as Page['status'] })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">External URL (optional)</label>
                <input
                  type="text"
                  value={editingPage.externalHref || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, externalHref: e.target.value })}
                  placeholder="/about or https://…"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  When set, menu links go here instead of /pages/slug (useful for app routes).
                </p>
              </div>

              <div className="border-t border-neutral-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-4">Menu Configuration</h3>

                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={editingPage.showInMenu}
                    onChange={(e) => {
                      const checked = e.target.checked
                      if (!checked) {
                        setMenuPlacement('none')
                        setEditingPage({
                          ...editingPage,
                          showInMenu: false,
                          menuLocation: 'none',
                          headerSection: '',
                        })
                      } else {
                        const placement: MenuPlacement = menuPlacement === 'none' ? 'footer' : menuPlacement
                        setMenuPlacement(placement)
                        setEditingPage({
                          ...editingPage,
                          showInMenu: true,
                          menuLocation: menuLocationFromPlacement(
                            placement,
                            editingPage.menuLocation,
                            editingPage.headerSection || ''
                          ),
                        })
                      }
                    }}
                    className="w-4 h-4 border border-neutral-300 rounded"
                  />
                  <span className="text-sm font-medium">Show in Menu</span>
                </label>

                {editingPage.showInMenu && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Placement</label>
                      <select
                        value={menuPlacement}
                        onChange={(e) => handlePlacementChange(e.target.value as MenuPlacement)}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                      >
                        <option value="header">Header (navbar dropdown)</option>
                        <option value="footer">Footer column</option>
                      </select>
                    </div>

                    {menuPlacement === 'header' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Header Section</label>
                        <select
                          value={editingPage.headerSection || ''}
                          onChange={(e) =>
                            setEditingPage({
                              ...editingPage,
                              menuLocation: 'navbar',
                              headerSection: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                        >
                          <option value="">Top-level header link</option>
                          {navLinks.map((link) => (
                            <option key={link.href} value={link.href}>
                              {link.label} ({link.href})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {menuPlacement === 'footer' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Footer Column</label>
                        <select
                          value={editingPage.menuLocation || 'footer-quicklinks'}
                          onChange={(e) =>
                            setEditingPage({
                              ...editingPage,
                              menuLocation: e.target.value as Page['menuLocation'],
                              headerSection: '',
                            })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                        >
                          <option value="footer-quicklinks">Quick Links</option>
                          <option value="footer-getinvolved">Get Involved</option>
                          <option value="footer-legal">Legal</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Menu Label (optional)</label>
                      <input
                        type="text"
                        value={editingPage.menuLabel || ''}
                        onChange={(e) => setEditingPage({ ...editingPage, menuLabel: e.target.value })}
                        placeholder="Leave blank to use page title"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Menu Order</label>
                      <input
                        type="number"
                        value={editingPage.menuOrder}
                        onChange={(e) =>
                          setEditingPage({ ...editingPage, menuOrder: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex flex-col-reverse sm:flex-row gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingPage(null)
                  setIsCreating(false)
                  setMenuPlacement('none')
                }}
                className={`flex-1 ${BUTTON_SECONDARY}`}
              >
                Cancel
              </button>
              <button type="button" onClick={handleSavePage} className={`flex-1 ${BUTTON_PRIMARY}`}>
                Save Page
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  )
}
