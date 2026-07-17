'use client'

import React from 'react'
import { Upload, X, File, Image as ImageIcon } from 'lucide-react'

interface MediaFile {
  file: File
  preview?: string
  type: 'image' | 'document'
}

interface MediaUploadProps {
  onFilesAdded: (files: MediaFile[]) => void
  maxFiles?: number
  allowedTypes?: string[]
}

export function MediaUpload({
  onFilesAdded,
  maxFiles = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'],
}: MediaUploadProps) {
  const [files, setFiles] = React.useState<MediaFile[]>([])
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (files.length + newFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} not allowed`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        alert('File size must be less than 10MB')
        return false
      }
      return true
    })

    const mediaFiles: MediaFile[] = validFiles.map((file) => {
      const mediaFile: MediaFile = {
        file,
        type: file.type.startsWith('image/') ? 'image' : 'document',
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          mediaFile.preview = e.target?.result as string
        }
        reader.readAsDataURL(file)
      }

      return mediaFile
    })

    const updatedFiles = [...files, ...mediaFiles]
    setFiles(updatedFiles)
    onFilesAdded(updatedFiles)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFilesAdded(updated)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleChange}
            className="hidden"
            accept={allowedTypes.join(',')}
          />

          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">Drag files here or click to select</p>
          <p className="text-xs text-gray-500">Images and PDFs up to 10MB</p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-sm rounded-lg transition"
          >
            Choose Files
          </button>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {files.map((mediaFile, index) => (
              <div key={index} className="relative group">
                {mediaFile.type === 'image' && mediaFile.preview ? (
                  <div className="bg-gray-200 rounded-lg overflow-hidden h-24">
                    <img src={mediaFile.preview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="bg-gray-200 rounded-lg h-24 flex items-center justify-center">
                    <File className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-black hover:bg-neutral-800 !text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>

                <p className="text-xs text-gray-600 mt-1 truncate">{mediaFile.file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
