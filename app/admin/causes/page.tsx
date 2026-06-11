'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function DonationCausesPage() {
  const [causes, setCauses] = React.useState<any[]>([])
  const [partners, setPartners] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingCause, setEditingCause] = React.useState<any>(null)
  const [newCause, setNewCause] = React.useState({
    name: '',
    description: '',
    category: 'education',
    targetAmount: 0,
    image: '',
    status: 'active',
    partnerId: '',
  })

  React.useEffect(() => {
    const unsubscribeCauses = onSnapshot(collection(db, 'causes'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCauses(data)
    })

    const unsubscribePartners = onSnapshot(collection(db, 'charityPartners'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setPartners(data)
      setLoading(false)
    })

    return () => {
      unsubscribeCauses()
      unsubscribePartners()
    }
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
      partnerId: '',
    })
  }

  const handleDeleteCause = async (id: string) => {
    if (!confirm('Delete this cause?')) return
    await deleteDoc(doc(db, 'causes', id))
  }

  const handleEditCause = (cause: any) => {
    setEditingCause(cause)
  }

  const handleUpdateCause = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCause.id) return

    try {
      const { id, ...updateData } = editingCause
      await updateDoc(doc(db, 'causes', editingCause.id), {
        ...updateData,
        updatedAt: serverTimestamp(),
      })
      setEditingCause(null)
    } catch (error) {
      console.error('[v0] Error updating cause:', error)
    }
  }

  const handleCloseEditModal = () => {
    setEditingCause(null)
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
            <select
              value={newCause.partnerId}
              onChange={(e) => setNewCause({ ...newCause, partnerId: e.target.value })}
              className="border rounded px-3 py-2"
              required
            >
              <option value="">Select Charity Partner</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
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
              <div className="flex gap-2">
                <button onClick={() => handleEditCause(cause)} className="text-blue-600 hover:text-blue-800 font-medium">
                  Edit
                </button>
                <button onClick={() => handleDeleteCause(cause.id)} className="text-red-600 hover:text-red-800 font-medium">
                  Delete
                </button>
              </div>
            ),
          }))}
          onEdit={() => {}}
          onDelete={handleDeleteCause}
          loading={loading}
        />

        {/* Edit Cause Modal */}
        {editingCause && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">Edit Cause</h2>
              <form onSubmit={handleUpdateCause} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Cause Name"
                  value={editingCause.name}
                  onChange={(e) => setEditingCause({ ...editingCause, name: e.target.value })}
                  className="border rounded px-3 py-2"
                  required
                />
                <select
                  value={editingCause.category}
                  onChange={(e) => setEditingCause({ ...editingCause, category: e.target.value })}
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
                  value={editingCause.targetAmount}
                  onChange={(e) => setEditingCause({ ...editingCause, targetAmount: parseInt(e.target.value) })}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  value={editingCause.image}
                  onChange={(e) => setEditingCause({ ...editingCause, image: e.target.value })}
                  className="border rounded px-3 py-2"
                />
                <select
                  value={editingCause.partnerId}
                  onChange={(e) => setEditingCause({ ...editingCause, partnerId: e.target.value })}
                  className="border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Charity Partner</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
                <select
                  value={editingCause.status}
                  onChange={(e) => setEditingCause({ ...editingCause, status: e.target.value })}
                  className="border rounded px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <textarea
                  placeholder="Cause Description"
                  value={editingCause.description}
                  onChange={(e) => setEditingCause({ ...editingCause, description: e.target.value })}
                  className="border rounded px-3 py-2 md:col-span-2"
                  rows={2}
                />
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
