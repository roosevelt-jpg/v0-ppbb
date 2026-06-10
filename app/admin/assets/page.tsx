'use client'

import React, { useEffect, useState } from 'react'
import { HeroSliderSettings, SliderImage } from '@/lib/types'
import { 
  getHeroSliderSettings, 
  addSliderImage, 
  updateSliderImage, 
  deleteSliderImage,
  publishHeroSlider 
} from '@/lib/hero-slider'
import { getImageDimensions, validateImage } from '@/lib/image-service'
import { Upload, Trash2, Eye, EyeOff, Save, AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function AssetsPage() {
  const [settings, setSettings] = useState<HeroSliderSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddingImage, setIsAddingImage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [imageValidation, setImageValidation] = useState<{ errors: string[]; warnings: string[] } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    link: '',
    displayDuration: 5,
    imageUrl: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const data = await getHeroSliderSettings()
    setSettings(data)
    setLoading(false)
  }

  const handleImageUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFormData(prev => ({ ...prev, imageUrl: url }))
    setPreviewImage(url)
    setImageValidation(null)
    
    if (url) {
      try {
        // Get image dimensions
        const dimensions = await getImageDimensions(url)
        setImageDimensions(dimensions)
        
        // Validate image
        const validation = validateImage(dimensions.width, dimensions.height)
        setImageValidation({
          errors: validation.errors,
          warnings: validation.warnings,
        })
      } catch (error) {
        console.error('[v0] Error loading image:', error)
        setImageDimensions(null)
        setImageValidation({
          errors: ['Failed to load image. Please check the URL.'],
          warnings: [],
        })
      }
    }
  }

  const handleAddImage = async () => {
    if (!formData.title || !formData.imageUrl) {
      alert('Please fill in title and image URL')
      return
    }

    const newImage: SliderImage = {
      id: `slider-${Date.now()}`,
      title: formData.title,
      subtitle: formData.subtitle,
      link: formData.link,
      imageUrl: formData.imageUrl,
      displayDuration: formData.displayDuration,
      displayOrder: (settings?.images.length || 0),
      isActive: true,
    }

    setIsSaving(true)
    const success = await addSliderImage(newImage)
    
    if (success) {
      await loadSettings()
      setFormData({
        title: '',
        subtitle: '',
        link: '',
        displayDuration: 5,
        imageUrl: '',
      })
      setPreviewImage('')
      setIsAddingImage(false)
    }
    setIsSaving(false)
  }

  const handleToggleActive = async (image: SliderImage) => {
    setIsSaving(true)
    const updated = { ...image, isActive: !image.isActive }
    const success = await updateSliderImage(updated)
    
    if (success) {
      await loadSettings()
    }
    setIsSaving(false)
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    setIsSaving(true)
    const success = await deleteSliderImage(imageId)
    
    if (success) {
      await loadSettings()
    }
    setIsSaving(false)
  }

  const handlePublish = async () => {
    setIsSaving(true)
    const success = await publishHeroSlider()
    
    if (success) {
      alert('Hero slider published successfully!')
      await loadSettings()
    }
    setIsSaving(false)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Hero Slider Assets</h1>
        <p className="text-neutral-600">Manage images that appear in the homepage hero slider</p>
      </div>

      {/* Current Settings */}
      {settings && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-blue-900 mb-4">Current Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-600">Transition</p>
              <p className="font-semibold text-blue-900">{settings.transitionEffect}</p>
            </div>
            <div>
              <p className="text-blue-600">Autoplay</p>
              <p className="font-semibold text-blue-900">{settings.autoplay ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-blue-600">Duration</p>
              <p className="font-semibold text-blue-900">{settings.autoplayDuration}s</p>
            </div>
            <div>
              <p className="text-blue-600">Active Images</p>
              <p className="font-semibold text-blue-900">
                {settings.images.filter(img => img.isActive).length}/{settings.images.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Image Form */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Upload className="w-5 h-5" />
          <h2 className="text-xl font-semibold">
            {isAddingImage ? 'Add New Image' : 'Add Image to Slider'}
          </h2>
        </div>

        {isAddingImage ? (
          <div className="space-y-4">
            {/* Image Preview with info */}
            {previewImage && (
              <div className="rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                <img src={previewImage} alt="Preview" className="w-full h-64 object-contain bg-neutral-50" />
                
                {/* Image Info */}
                {imageDimensions && (
                  <div className="p-4 bg-neutral-50 border-t border-neutral-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-600">Dimensions</p>
                        <p className="font-semibold text-neutral-900">{imageDimensions.width} × {imageDimensions.height}px</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Aspect Ratio</p>
                        <p className="font-semibold text-neutral-900">{(imageDimensions.width / imageDimensions.height).toFixed(2)}:1</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validation Messages */}
            {imageValidation && imageValidation.errors.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Image Errors</p>
                  <ul className="text-sm text-red-800 mt-1 space-y-1">
                    {imageValidation.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {imageValidation && imageValidation.warnings.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">Image Tips</p>
                  <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                    {imageValidation.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {imageDimensions && imageValidation && imageValidation.errors.length === 0 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Image looks good!</p>
                  <p className="text-sm text-green-800">Your image will automatically adjust to fit the hero slider without stretching.</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={handleImageUrlChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Slide title"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Optional subtitle"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Link (Optional)
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Display Duration (seconds)
              </label>
              <input
                type="number"
                value={formData.displayDuration}
                onChange={e => setFormData(prev => ({ ...prev, displayDuration: parseInt(e.target.value) }))}
                min="2"
                max="30"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddImage}
                disabled={isSaving}
                className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 font-semibold"
              >
                {isSaving ? 'Saving...' : 'Add Image'}
              </button>
              <button
                onClick={() => {
                  setIsAddingImage(false)
                  setFormData({
                    title: '',
                    subtitle: '',
                    link: '',
                    displayDuration: 5,
                    imageUrl: '',
                  })
                  setPreviewImage('')
                }}
                className="flex-1 bg-neutral-200 text-neutral-900 py-2 rounded-lg hover:bg-neutral-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingImage(true)}
            className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-neutral-400 font-semibold transition-colors"
          >
            + Add New Image
          </button>
        )}
      </div>

      {/* Images List */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Images ({settings?.images.length || 0})</h2>
        
        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Automatic Image Resizing</p>
            <p className="text-sm text-blue-800 mt-1">All images automatically adjust to fit the hero slider without stretching or distortion. Larger images are optimized for quality, and smaller images are enhanced for clarity.</p>
          </div>
        </div>
        
        {settings?.images && settings.images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.images
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map(image => (
                <div key={image.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="w-full h-40 bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 mb-1">{image.title}</h3>
                    {image.subtitle && (
                      <p className="text-sm text-neutral-600 mb-3">{image.subtitle}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-600">
                        {image.displayDuration}s
                      </span>
                      {image.isActive && (
                        <span className="text-xs bg-green-100 px-2 py-1 rounded text-green-700 font-semibold">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(image)}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-1 text-sm py-2 bg-neutral-100 hover:bg-neutral-200 rounded font-semibold text-neutral-700 disabled:opacity-50"
                      >
                        {image.isActive ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Show
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-1 text-sm py-2 bg-red-50 hover:bg-red-100 rounded font-semibold text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-neutral-50 rounded-lg text-neutral-600">
            No images added yet
          </div>
        )}
      </div>

      {/* Publish Button */}
      {settings && settings.images.filter(img => img.isActive).length > 0 && (
        <button
          onClick={handlePublish}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:bg-neutral-400"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Publishing...' : 'Publish Changes'}
        </button>
      )}
    </div>
  )
}
