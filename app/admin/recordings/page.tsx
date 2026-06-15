'use client'

import React, { useState, useEffect } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { Recording } from '@/lib/types'
import { Plus, Edit2, Trash2, Play, Eye, Heart } from 'lucide-react'

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    videoUrl: '',
    thumbnail: '',
    duration: 0,
    instructor: '',
    tags: '',
    transcript: '',
  })

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'recordings'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setRecordings(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        } as Recording)))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.videoUrl) {
      alert('Please fill in required fields: Title and Video URL')
      return
    }

    try {
      const recordingData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()),
        duration: parseInt(formData.duration.toString()),
        views: 0,
        likes: 0,
        status: 'draft',
        updatedAt: new Date(),
      }

      if (editingId) {
        await updateDoc(doc(db, 'recordings', editingId), recordingData)
        alert('Recording updated successfully')
      } else {
        await addDoc(collection(db, 'recordings'), {
          ...recordingData,
          createdAt: new Date(),
        })
        alert('Recording created successfully')
      }

      setFormData({
        title: '',
        description: '',
        category: '',
        videoUrl: '',
        thumbnail: '',
        duration: 0,
        instructor: '',
        tags: '',
        transcript: '',
      })
      setEditingId(null)
      setShowCreateModal(false)
    } catch (error) {
      console.error('[v0] Error saving recording:', error)
      alert('Error saving recording')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return
    try {
      await deleteDoc(doc(db, 'recordings', id))
      alert('Recording deleted successfully')
    } catch (error) {
      console.error('[v0] Error deleting recording:', error)
      alert('Error deleting recording')
    }
  }

  return (
    <AdminPageLayout title="Recordings" subtitle="Manage educational video recordings">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 style={{ color: '#111111' }} className="text-3xl font-bold">Recordings</h1>
          <Button
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recording
          </Button>
        </div>

        {loading ? (
          <p style={{ color: '#888888' }}>Loading recordings...</p>
        ) : recordings.length === 0 ? (
          <Card style={{ borderColor: '#e4e1da' }} className="p-8 text-center">
            <p style={{ color: '#888888' }}>No recordings added yet</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recordings.map(recording => (
              <Card key={recording.id} style={{ borderColor: '#e4e1da' }} className="p-6">
                <div className="flex gap-6">
                  {recording.thumbnail && (
                    <img
                      src={recording.thumbnail}
                      alt={recording.title}
                      className="w-24 h-24 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 style={{ color: '#111111' }} className="font-bold text-lg">{recording.title}</h3>
                    <p style={{ color: '#888888' }} className="text-sm mt-1">{recording.description}</p>
                    
                    <div className="flex gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                        <Play className="h-4 w-4" />
                        {Math.floor(recording.duration / 60)} min {recording.duration % 60} sec
                      </div>
                      <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                        <Eye className="h-4 w-4" />
                        {recording.views} views
                      </div>
                      <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                        <Heart className="h-4 w-4" />
                        {recording.likes} likes
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setFormData({
                          title: recording.title,
                          description: recording.description,
                          category: recording.category,
                          videoUrl: recording.videoUrl,
                          thumbnail: recording.thumbnail || '',
                          duration: recording.duration,
                          instructor: recording.instructor,
                          tags: recording.tags?.join(', ') || '',
                          transcript: recording.transcript || '',
                        })
                        setEditingId(recording.id)
                        setShowCreateModal(true)
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(recording.id)}
                      variant="ghost"
                      size="sm"
                      style={{ color: '#d32f2f' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card style={{ borderColor: '#e4e1da', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} className="p-8 space-y-4">
              <h2 style={{ color: '#111111' }} className="text-2xl font-bold">{editingId ? 'Edit Recording' : 'Add Recording'}</h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                <input
                  type="text"
                  placeholder="Recording Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />
                
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="text"
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="text"
                  placeholder="Video URL (YouTube, Vimeo, etc.) *"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="text"
                  placeholder="Thumbnail URL"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="number"
                  placeholder="Duration (seconds)"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="text"
                  placeholder="Instructor Name"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <textarea
                  placeholder="Transcript (optional)"
                  value={formData.transcript}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button type="submit" style={{ backgroundColor: '#111111', color: '#f7f6f2' }}>
                    {editingId ? 'Update Recording' : 'Add Recording'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
