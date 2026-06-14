'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { YouTubeConfig, YouTubeVideo } from '@/lib/types'
import { 
  getYouTubeConfig, 
  saveYouTubeConfig,
  updateYouTubeVideos,
  formatViewCount,
  formatDuration
} from '@/lib/youtube-service'
import { Save, RefreshCw, AlertCircle } from 'lucide-react'

export default function YouTubeConfigPage() {
  const [config, setConfig] = useState<YouTubeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    channelId: '',
    apiKey: '',
    maxVideosDisplay: 4,
    refreshInterval: 24,
    autoRefresh: true,
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    setError(null)
    const data = await getYouTubeConfig()
    
    if (data) {
      setConfig(data)
      setFormData({
        channelId: data.channelId,
        apiKey: data.apiKey,
        maxVideosDisplay: data.maxVideosDisplay,
        refreshInterval: data.refreshInterval,
        autoRefresh: data.autoRefresh,
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!formData.channelId || !formData.apiKey) {
      setError('Channel ID and API Key are required')
      return
    }

    setIsSaving(true)
    setError(null)

    const newConfig: YouTubeConfig = {
      id: 'default',
      channelId: formData.channelId,
      apiKey: formData.apiKey,
      maxVideosDisplay: formData.maxVideosDisplay,
      refreshInterval: formData.refreshInterval,
      autoRefresh: formData.autoRefresh,
      videos: config?.videos || [],
      createdAt: config?.createdAt || new Date(),
      updatedAt: new Date(),
      lastFetched: config?.lastFetched,
    }

    const success = await saveYouTubeConfig(newConfig)
    
    if (success) {
      await loadConfig()
      await handleRefresh()
    } else {
      setError('Failed to save configuration')
    }

    setIsSaving(false)
  }

  const handleRefresh = async () => {
    if (!formData.channelId || !formData.apiKey) {
      setError('Please save Channel ID and API Key first')
      return
    }

    setIsRefreshing(true)
    setError(null)

    const currentConfig: YouTubeConfig = {
      id: 'default',
      channelId: formData.channelId,
      apiKey: formData.apiKey,
      maxVideosDisplay: formData.maxVideosDisplay,
      refreshInterval: formData.refreshInterval,
      autoRefresh: formData.autoRefresh,
      videos: config?.videos || [],
      createdAt: config?.createdAt || new Date(),
      updatedAt: new Date(),
    }

    const updated = await updateYouTubeVideos(currentConfig)
    
    if (updated) {
      setConfig(updated)
    } else {
      setError('Failed to fetch videos. Check your API key and Channel ID.')
    }

    setIsRefreshing(false)
  }

  if (loading) {
    return (
      <AdminPageLayout title="YouTube Videos" subtitle="Configure and manage YouTube integration">
        <div className="p-8">Loading...</div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="YouTube Videos" subtitle="Configure and manage YouTube integration">
      <div className="w-full max-w-4xl space-y-6 p-6">

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold mb-6">Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                YouTube Channel ID *
              </label>
              <input
                type="text"
                value={formData.channelId}
                onChange={e => setFormData(prev => ({ ...prev, channelId: e.target.value }))}
                placeholder="UC_x5XG1OV2P6uZZ5FSM9Ttw"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Find it in your YouTube channel URL: youtube.com/channel/YOUR_CHANNEL_ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                YouTube Data API Key *
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Get your API key from{' '}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Videos to Display
                </label>
                <select
                  value={formData.maxVideosDisplay}
                  onChange={e => setFormData(prev => ({ ...prev, maxVideosDisplay: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="1">1 Video</option>
                  <option value="2">2 Videos</option>
                  <option value="3">3 Videos</option>
                  <option value="4">4 Videos</option>
                  <option value="6">6 Videos</option>
                  <option value="8">8 Videos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Refresh Interval (Hours)
                </label>
                <input
                  type="number"
                  value={formData.refreshInterval}
                  onChange={e => setFormData(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                  min="1"
                  max="168"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={formData.autoRefresh}
                onChange={e => setFormData(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                className="w-4 h-4"
              />
              <label htmlFor="autoRefresh" className="text-sm font-medium text-neutral-700">
                Auto-refresh videos on schedule
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-white py-3 rounded-lg font-semibold disabled:bg-neutral-400 transition"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !formData.channelId || !formData.apiKey}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:bg-neutral-400 transition"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Fetching...' : 'Fetch Videos Now'}
            </button>
          </div>
        </div>

        {/* Last Fetched Info */}
        {config?.lastFetched && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              Last updated: {new Date(config.lastFetched).toLocaleString()}
            </p>
          </div>
        )}

        {/* Videos List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Latest Videos ({config?.videos.length || 0})
          </h2>

          {config?.videos && config.videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.videos.slice(0, config.maxVideosDisplay).map(video => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative bg-black aspect-video overflow-hidden">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 line-clamp-2 mb-2">
                      {video.title}
                    </h3>

                    <div className="flex justify-between items-center text-xs text-neutral-600">
                      <span>{formatViewCount(video.viewCount)} views</span>
                      {video.duration && <span>{formatDuration(video.duration)}</span>}
                    </div>

                    <p className="text-xs text-neutral-500 mt-2">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-neutral-50 rounded-lg text-neutral-600">
              <p>No videos fetched yet. Save your configuration and fetch videos.</p>
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  )
}
