'use client'

import React from 'react'
import {
  BUTTON_ICON_COMPACT,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ACTION_ROW,
} from '@/lib/admin-design-system'
import { Card } from '@/components/ui/card'
import { Plus, Search, Download, Pencil, Trash2, Archive } from 'lucide-react'

interface Column {
  key: string
  label: string
  width?: string
  render?: (value: any, row: any) => React.ReactNode
}

interface AdminTableProps {
  title: string
  columns: Column[]
  data: any[]
  loading?: boolean
  onEdit?: (item: any) => void
  onArchive?: (item: any) => void
  onDelete?: (item: any) => void
  onAdd?: () => void
  onExport?: () => void
  searchPlaceholder?: string
  /** Minimum table width in px when columns would otherwise compress off-screen */
  tableMinWidth?: number
  /** Set false to hide the built-in Actions column (e.g. when actions live in a data column) */
  showActionsColumn?: boolean
}

/** Shared horizontal scroll wrapper for admin data tables */
export const ADMIN_TABLE_SCROLL_CLASS = 'admin-table-scroll'

export function AdminTableScroll({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`${ADMIN_TABLE_SCROLL_CLASS} ${className}`.trim()}>{children}</div>
}

function resolveTableMinWidth(columns: Column[], hasActions: boolean, override?: number): number {
  if (override && override > 0) return override

  const columnTotal = columns.reduce((sum, col) => {
    if (col.width?.endsWith('px')) {
      const parsed = parseInt(col.width, 10)
      return sum + (Number.isFinite(parsed) ? parsed : 140)
    }
    return sum + 140
  }, 0)

  const actionsWidth = hasActions ? 140 : 0
  return Math.max(columnTotal + actionsWidth, 720)
}

export function AdminTable({
  title,
  columns,
  data,
  loading = false,
  onEdit,
  onArchive,
  onDelete,
  onAdd,
  onExport,
  searchPlaceholder = 'Search...',
  tableMinWidth,
  showActionsColumn = true,
}: AdminTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('')

  const hasActions = showActionsColumn && Boolean(onEdit || onArchive || onDelete)
  const minWidth = resolveTableMinWidth(columns, hasActions, tableMinWidth)

  const filteredData = data.filter((item) =>
    columns.some((col) => String(item[col.key]).toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold" style={{ color: '#111111' }}>
          {title}
        </h2>
        <div className="flex gap-2 flex-shrink-0">
          {onExport && (
            <button type="button" onClick={onExport} className={`${BUTTON_SECONDARY} text-sm gap-2`}>
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
          {onAdd && (
            <button type="button" onClick={onAdd} className={`${BUTTON_PRIMARY} text-sm gap-2`}>
              <Plus className="h-4 w-4" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: '#888888' }} />
        <input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '40px',
            paddingRight: '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            backgroundColor: '#f7f6f2',
            borderColor: '#e4e1da',
            color: '#111111',
            border: '1px solid #e4e1da',
            borderRadius: '6px',
          }}
        />
      </div>

      {/* Table */}
      <Card
        className="min-w-0"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e4e1da',
        }}
      >
        <AdminTableScroll>
          <table className="w-full" style={{ minWidth: `${minWidth}px` }}>
            <thead>
              <tr
                style={{
                  borderBottomColor: '#e4e1da',
                  borderBottomWidth: 1,
                  backgroundColor: '#f7f6f2',
                }}
              >
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium whitespace-nowrap"
                    style={{ color: '#888888', width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
                {hasActions && (
                  <th
                    className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[1%] "
                    style={{ color: '#888888' }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-6 py-8 text-center">
                    <div style={{ color: '#888888' }}>Loading...</div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-6 py-8 text-center">
                    <div style={{ color: '#888888' }}>No data found</div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      borderBottomColor: '#e4e1da',
                      borderBottomWidth: 1,
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={`${item.id}-${col.key}`}
                        className="px-4 sm:px-6 py-4 text-sm whitespace-nowrap"
                        style={{ color: '#333333' }}
                      >
                        {col.render ? col.render(item[col.key], item) : String(item[col.key] || '-')}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-3 py-3 text-sm whitespace-nowrap w-[1%]">
                        <div className={ACTION_ROW}>
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className={BUTTON_ICON_COMPACT}
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Pencil />
                            </button>
                          )}
                          {onArchive && (
                            <button
                              type="button"
                              onClick={() => onArchive(item)}
                              className={BUTTON_ICON_COMPACT}
                              aria-label="Archive"
                              title="Archive"
                            >
                              <Archive />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className={BUTTON_ICON_COMPACT}
                              aria-label="Delete"
                              title="Delete"
                            >
                              <Trash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminTableScroll>
      </Card>

      {/* Pagination Info */}
      {filteredData.length > 0 && (
        <div className="text-xs" style={{ color: '#888888' }}>
          Showing {filteredData.length} of {data.length} records
        </div>
      )}
    </div>
  )
}
