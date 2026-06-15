'use client'

import React, { useState, useEffect } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { Workshop } from '@/lib/types'
import { Plus, Edit2, Trash2, Calendar, Users, Clock } from 'lucide-react'

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    instructorName: '',
    instructorEmail: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    capacity: 30,
  })

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'workshops'), orderBy('date', 'desc')),
      (snapshot) => {
        setWorkshops(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || new Date(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        } as Workshop)))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.date || !formData.time) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const workshopData = {
        ...formData,
        date: new Date(formData.date),
        registered: 0,
        registrations: [],
        status: 'draft',
        updatedAt: new Date(),
      }

      if (editingId) {
        await updateDoc(doc(db, 'workshops', editingId), workshopData)
        alert('Workshop updated successfully')
      } else {
        await addDoc(collection(db, 'workshops'), {
          ...workshopData,
          createdAt: new Date(),
        })
        alert('Workshop created successfully')
      }

      setFormData({
        title: '',
        description: '',
        category: '',
        instructorName: '',
        instructorEmail: '',
        date: '',
        time: '',
        duration: 60,
        location: '',
        capacity: 30,
      })
      setEditingId(null)
      setShowCreateModal(false)
    } catch (error) {
      console.error('[v0] Error saving workshop:', error)
      alert('Error saving workshop')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workshop?')) return
    try {
      await deleteDoc(doc(db, 'workshops', id))
      alert('Workshop deleted successfully')
    } catch (error) {
      console.error('[v0] Error deleting workshop:', error)
      alert('Error deleting workshop')
    }
  }

  return (
    <AdminPageLayout title="Workshops" subtitle="Manage educational workshops and events">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 style={{ color: '#111111' }} className="text-3xl font-bold">Workshops</h1>
          <Button
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workshop
          </Button>
        </div>

        {loading ? (
          <p style={{ color: '#888888' }}>Loading workshops...</p>
        ) : workshops.length === 0 ? (
          <Card style={{ borderColor: '#e4e1da' }} className="p-8 text-center">
            <p style={{ color: '#888888' }}>No workshops created yet</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workshops.map(workshop => (
              <Card key={workshop.id} style={{ borderColor: '#e4e1da' }} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 style={{ color: '#111111' }} className="font-bold text-lg">{workshop.title}</h3>
                    <p style={{ color: '#888888' }} className="text-sm mt-1">{workshop.description}</p>
                    
                    <div className="flex gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                        <Calendar className="h-4 w-4" />
                        {workshop.date.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                        <Clock className="h-4 w-4" />
                        {workshop.time} ({workshop.duration} min)
                      </div>
                      <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                        <Users className="h-4 w-4" />
                        {workshop.registered}/{workshop.capacity} registered
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setFormData({
                          title: workshop.title,
                          description: workshop.description,
                          category: workshop.category,
                          instructorName: workshop.instructorName,
                          instructorEmail: workshop.instructorEmail,
                          date: workshop.date.toISOString().split('T')[0],
                          time: workshop.time,
                          duration: workshop.duration,
                          location: workshop.location,
                          capacity: workshop.capacity,
                        })
                        setEditingId(workshop.id)
                        setShowCreateModal(true)
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(workshop.id)}
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
              <h2 style={{ color: '#111111' }} className="text-2xl font-bold">{editingId ? 'Edit Workshop' : 'Create Workshop'}</h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                <input
                  type="text"
                  placeholder="Workshop Title *"
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
                  placeholder="Instructor Name"
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="email"
                  placeholder="Instructor Email"
                  value={formData.instructorEmail}
                  onChange={(e) => setFormData({ ...formData, instructorEmail: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <input
                  type="number"
                  placeholder="Capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e1da', borderRadius: '6px', backgroundColor: '#f7f6f2', color: '#111111', boxSizing: 'border-box' }}
                />

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button type="submit" style={{ backgroundColor: '#111111', color: '#f7f6f2' }}>
                    {editingId ? 'Update Workshop' : 'Create Workshop'}
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
