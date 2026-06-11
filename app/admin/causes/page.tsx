'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function DonationCausesPage() {
  const [causes, setCauses] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newCause, setNewCause] = React.useState({
    name: '',
    description: '',
    category: 'education',
    targetAmount: 0,
    image: '',
    status: 'active',
  })

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'causes'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCauses(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleAddCause = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCause.name.trim()) return

    await addDoc(collection(db, 'causes'), {
      ...newCause,
      currentAmount: 0,
      createdAt: serverTimestamp(),
      active: true,
    })

    setNewCause({
      name: '',
      description: '',
      category: 'education',
      targetAmount: 0,
      image: '',
      status: 'active',
    })
  }

  const handleDeleteCause = async (id: string) => {
    if (!confirm('Delete this cause?')) return
    await deleteDoc(doc(db, 'causes', id))
  }

  return (
    <div>
      <AdminHeader title="Donation Causes" subtitle="Manage charitable causes and campaigns" />

      <div className="space-y-6">
        {/* Add New Cause Form */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold mb-4">Add New Cause</h2>
          <form onSubmit={handleAddCause} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Cause Name"
              value={newCause.name}
              onChange={(e) => setNewCause({ ...newCause, name: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <select
              value={newCause.category}
              onChange={(e) => setNewCause({ ...newCause, category: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="food">Food & Nutrition</option>
              <option value="shelter">Shelter</option>
              <option value="emergency">Emergency Relief</option>
              <option value="other">Other</option>
            </select>
            <input
              type="number"
              placeholder="Target Amount (AED)"
              value={newCause.targetAmount}
              onChange={(e) => setNewCause({ ...newCause, targetAmount: parseInt(e.target.value) })}
              className="border rounded px-3 py-2"
            />
            <input
              type="url"
              placeholder="Image URL"
              value={newCause.image}
              onChange={(e) => setNewCause({ ...newCause, image: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <textarea
              placeholder="Cause Description"
              value={newCause.description}
              onChange={(e) => setNewCause({ ...newCause, description: e.target.value })}
              className="border rounded px-3 py-2 md:col-span-2"
              rows={3}
            />
            <button
              type="submit"
              className="md:col-span-2 bg-black hover:bg-gray-800 text-white py-2 rounded font-medium"
            >
              Add Cause
            </button>
          </form>
        </div>

        {/* Causes List Table */}
        <AdminTable
          title="Active Causes"
          columns={['Name', 'Category', 'Target Amount', 'Current Amount', 'Progress', 'Status', 'Actions']}
          data={causes.map((cause) => ({
            name: cause.name,
            category: cause.category,
            targetAmount: `AED ${cause.targetAmount?.toLocaleString() || 0}`,
            currentAmount: `AED ${(cause.currentAmount || 0).toLocaleString()}`,
            progress: `${Math.round(((cause.currentAmount || 0) / (cause.targetAmount || 1)) * 100)}%`,
            status: (
              <span className={`px-2 py-1 rounded text-sm ${cause.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                {cause.status}
              </span>
            ),
            actions: (
              <button onClick={() => handleDeleteCause(cause.id)} className="text-red-600 hover:text-red-800">
                Delete
              </button>
            ),
          }))}
          onEdit={() => {}}
          onDelete={handleDeleteCause}
          loading={loading}
        />
      </div>
    </div>
  )
}
