'use client'

import React from 'react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_SMALL, TEXT_SMALL, FLEX_BETWEEN } from '@/lib/admin-design-system'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface AdminTableColumn {
  key: string
  label: string
  width?: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface AdminTableProps {
  columns: AdminTableColumn[]
  data: any[]
  loading?: boolean
  onRowClick?: (row: any) => void
  actions?: {
    label: string
    onClick: (row: any) => void
    variant?: 'primary' | 'secondary' | 'danger'
  }[]
}

export function AdminTable({
  columns,
  data,
  loading = false,
  onRowClick,
  actions,
}: AdminTableProps) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      setSortConfig(prev =>
        prev?.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      )
    } else {
      setSortConfig({ key, direction: 'asc' })
    }
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-neutral-700 ${
                  col.sortable ? 'cursor-pointer hover:bg-neutral-100' : ''
                }`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{col.label}</span>
                  {col.sortable && (
                    <div className="text-neutral-400">
                      {sortConfig?.key === col.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-700">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-neutral-500">
                Loading...
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-neutral-500">
                No data found
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-neutral-200 hover:bg-neutral-50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm text-neutral-900">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {actions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={(e) => {
                            e.stopPropagation()
                            action.onClick(row)
                          }}
                          className={`${BUTTON_SMALL} ${
                            action.variant === 'danger'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : action.variant === 'secondary'
                              ? 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
                              : BUTTON_PRIMARY
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

interface AdminFormProps {
  fields: {
    name: string
    label: string
    type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date'
    required?: boolean
    options?: { value: string; label: string }[]
    placeholder?: string
    value?: any
    onChange?: (value: any) => void
  }[]
  onSubmit: (data: Record<string, any>) => void
  loading?: boolean
  submitLabel?: string
}

export function AdminForm({ fields, onSubmit, loading = false, submitLabel = 'Save' }: AdminFormProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: field.value || '' }), {})
  )

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-600 ml-1">*</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              name={field.name}
              value={formData[field.name]}
              onChange={e => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none min-h-32"
            />
          ) : field.type === 'select' ? (
            <select
              name={field.name}
              value={formData[field.name]}
              onChange={e => handleChange(field.name, e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <input
              type="checkbox"
              name={field.name}
              checked={formData[field.name]}
              onChange={e => handleChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300"
            />
          ) : (
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name]}
              onChange={e => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          )}
        </div>
      ))}

      <div className="pt-4">
        <button type="submit" disabled={loading} className={BUTTON_PRIMARY + ' w-full'}>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export function AdminCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

export function AdminStats({ items }: { items: { label: string; value: string | number; trend?: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-xs font-medium text-neutral-600 uppercase">{item.label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{item.value}</p>
          {item.trend && <p className="text-xs text-neutral-500 mt-1">{item.trend}</p>}
        </div>
      ))}
    </div>
  )
}
