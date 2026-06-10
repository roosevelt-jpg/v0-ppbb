'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronRight, Plus, Search, Filter, Download } from 'lucide-react'

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
  onDelete?: (item: any) => void
  onAdd?: () => void
  onExport?: () => void
  searchPlaceholder?: string
}

export function AdminTable({
  title,
  columns,
  data,
  loading = false,
  onEdit,
  onDelete,
  onAdd,
  onExport,
  searchPlaceholder = 'Search...',
}: AdminTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('')

  const filteredData = data.filter((item) =>
    columns.some((col) => String(item[col.key]).toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: '#111111' }}>
          {title}
        </h2>
        <div className="flex gap-2">
          {onExport && (
            <Button
              size="sm"
              onClick={onExport}
              style={{
                backgroundColor: '#f7f6f2',
                color: '#111111',
                border: '1px solid #e4e1da',
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {onAdd && (
            <Button
              size="sm"
              onClick={onAdd}
              style={{
                backgroundColor: '#111111',
                color: '#f7f6f2',
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
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
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e4e1da',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
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
                    className="px-6 py-3 text-left text-xs font-medium"
                    style={{ color: '#888888', width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#888888' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-8 text-center">
                    <div style={{ color: '#888888' }}>Loading...</div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-8 text-center">
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
                        className="px-6 py-4 text-sm"
                        style={{ color: '#333333' }}
                      >
                        {col.render ? col.render(item[col.key], item) : String(item[col.key] || '-')}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {onEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(item)}
                            style={{ color: '#111111' }}
                          >
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(item)}
                            style={{ color: '#888888' }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
