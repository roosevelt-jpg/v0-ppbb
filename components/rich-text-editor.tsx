'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import { Bold, Italic, List, Link2, Underline } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

function exec(command: string, value?: string) {
  document.execCommand(command, false, value)
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here…',
  minHeight = 160,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = editorRef.current
    if (!el || el.innerHTML === value) return
    el.innerHTML = value || ''
  }, [value])

  const emitChange = useCallback(() => {
    const html = editorRef.current?.innerHTML || ''
    onChange(html === '<br>' ? '' : html)
  }, [onChange])

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) exec('createLink', url)
    emitChange()
  }

  return (
    <div className={`border border-neutral-300 rounded-lg overflow-hidden bg-white w-full min-w-0 ${className}`}>
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        {[
          { icon: Bold, cmd: 'bold', label: 'Bold' },
          { icon: Italic, cmd: 'italic', label: 'Italic' },
          { icon: Underline, cmd: 'underline', label: 'Underline' },
        ].map(({ icon: Icon, cmd, label }) => (
          <button
            key={cmd}
            type="button"
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              exec(cmd)
              emitChange()
            }}
            className="min-h-0 min-w-0 h-6 w-6 p-0 pb-compact-btn inline-flex items-center justify-center rounded hover:bg-neutral-200 bg-transparent text-neutral-800 shadow-none"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <button
          type="button"
          title="Bullet list"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            exec('insertUnorderedList')
            emitChange()
          }}
          className="min-h-0 min-w-0 h-6 w-6 p-0 pb-compact-btn inline-flex items-center justify-center rounded hover:bg-neutral-200 bg-transparent text-neutral-800 shadow-none"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={addLink}
          className="min-h-0 min-w-0 h-6 w-6 p-0 pb-compact-btn inline-flex items-center justify-center rounded hover:bg-neutral-200 bg-transparent text-neutral-800 shadow-none"
        >
          <Link2 className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text/plain')
          if (!text) return
          e.preventDefault()
          const html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .split(/\n\s*\n/)
            .map((b) => b.trim())
            .filter(Boolean)
            .map((b) => `<p>${b.replace(/\n/g, '<br>')}</p>`)
            .join('')
          document.execCommand('insertHTML', false, html || text.replace(/\n/g, '<br>'))
          emitChange()
        }}
        className="px-3 py-2 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400 break-words [overflow-wrap:anywhere] w-full min-w-0"
        style={{ minHeight }}
        suppressContentEditableWarning
      />
    </div>
  )
}
