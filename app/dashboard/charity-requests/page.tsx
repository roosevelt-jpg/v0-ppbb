'use client'

import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Trash2 } from 'lucide-react'

export default function CharityRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'urgent',
  })

  useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    const unsubscribe = onSnapshot(
      query(collection(db, 'charityRequests'), where('submittedBy', '==', firebaseUser.uid)),
      (snapshot) => {
        setRequests(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching requests:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    try {
      await addDoc(collection(db, 'charityRequests'), {
        title: formData.title,
        description: formData.description,
        amount: parseInt(formData.amount),
        category: formData.category,
        submittedBy: firebaseUser.uid,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setFormData({ title: '', description: '', amount: '', category: 'urgent' })
      setShowForm(false)
    } catch (error) {
      console.error('[v0] Error submitting request:', error)
    }
  }

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Delete this request?')) return
    try {
      await deleteDoc(doc(db, 'charityRequests', id))
    } catch (error) {
      console.error('[v0] Error deleting request:', error)
    }
  }

  return (
    <>
      <MemberHeader title="Charity Requests" subtitle="Submit and track support requests" />

      <div className="p-8 space-y-6">
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-2" />
            New Request
          </Button>
        </div>

        {/* Request Form */}
        {showForm && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Submit a New Request</h2>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded"
                  placeholder="Brief title of your request"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded"
                  rows={4}
                  placeholder="Detailed description of your need"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount (AED)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="medical">Medical</option>
                    <option value="education">Education</option>
                    <option value="housing">Housing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">Submit Request</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Requests</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading requests...</p>
          ) : requests.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground">No requests submitted yet</p>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <FileText size={32} className="text-blue-500" />
                    <div>
                      <h3 className="font-bold text-lg">{request.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{request.description}</p>
                      <div className="flex gap-2 mt-3">
                        <span
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{
                            backgroundColor:
                              request.status === 'approved'
                                ? '#e8f5e9'
                                : request.status === 'pending'
                                  ? '#fff3e0'
                                  : '#ffebee',
                            color:
                              request.status === 'approved'
                                ? '#2e7d32'
                                : request.status === 'pending'
                                  ? '#e65100'
                                  : '#c62828',
                          }}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                          {request.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          AED {request.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  )
}
