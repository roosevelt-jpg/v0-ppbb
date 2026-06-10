'use client'

export const dynamic = 'force-dynamic'
import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Trash2, Upload, File } from 'lucide-react'

export default function CharityRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'urgent',
    documents: [] as { name: string; url: string }[],
  })
  const [uploadingFiles, setUploadingFiles] = useState(false)

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
        documents: formData.documents,
        submittedBy: firebaseUser.uid,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setFormData({ title: '', description: '', amount: '', category: 'urgent', documents: [] })
      setShowForm(false)
    } catch (error) {
      console.error('[v0] Error submitting request:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploadingFiles(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (event) => {
        const fileData = {
          name: file.name,
          url: event.target?.result as string,
        }
        setFormData((prev) => ({
          ...prev,
          documents: [...prev.documents, fileData],
        }))
      }
      reader.readAsDataURL(file)
    }
    setUploadingFiles(false)
  }

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
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

              <div>
                <label className="text-sm font-medium">Supporting Documents</label>
                <div className="mt-2 border-2 border-dashed rounded p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={uploadingFiles}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">Click to upload documents (PDF, images, Word)</p>
                  </label>
                </div>

                {formData.documents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Uploaded documents:</p>
                    {formData.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <File size={16} className="text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{doc.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

                      {request.documents && request.documents.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Documents:</p>
                          <div className="flex flex-wrap gap-2">
                            {request.documents.map((doc: any, idx: number) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                              >
                                {doc.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
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
