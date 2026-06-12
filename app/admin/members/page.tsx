'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminTable } from '@/components/admin-table'
import { EditMemberModal } from '@/components/edit-member-modal'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { parseCSV, type MemberCSVRow } from '@/lib/csv-parser'
import { Upload, Plus } from 'lucide-react'

export default function MembersPage() {
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMember, setSelectedMember] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [csvImportOpen, setCSVImportOpen] = React.useState(false)
  const [csvImporting, setCSVImporting] = React.useState(false)
  const [csvErrors, setCSVErrors] = React.useState<Array<{ row: number; error: string }>>([])
  const [newMember, setNewMember] = React.useState<MemberCSVRow>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    status: 'active',
  })

  React.useEffect(() => {
    // Subscribe to real-time member updates
    const q = query(collection(db, 'users'), where('role', 'in', ['member', 'member+volunteer']))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const memberData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]
        setMembers(memberData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching members:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Name',
      width: '200px',
    },
    {
      key: 'email',
      label: 'Email',
      width: '250px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      width: '150px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (value: any) => (
        <span
          style={{
            backgroundColor: value === 'active' ? '#e8f5e9' : '#fff3e0',
            color: value === 'active' ? '#2e7d32' : '#e65100',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {value || 'active'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      width: '150px',
      render: (value: any) => {
        if (!value) return '-'
        const date = value.toDate ? value.toDate() : new Date(value)
        return <span style={{ color: '#888888' }}>{formatDistanceToNow(date, { addSuffix: true })}</span>
      },
    },
  ]

  const handleEditMember = (member: any) => {
    setSelectedMember(member)
    setEditModalOpen(true)
  }

  const handleDeleteMember = (member: any) => {
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      console.log('Delete member:', member)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMember.firstName.trim() || !newMember.lastName.trim() || !newMember.email.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await addDoc(collection(db, 'users'), {
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        email: newMember.email,
        phone: newMember.phone || '',
        location: newMember.location || '',
        status: newMember.status || 'active',
        role: 'member',
        createdAt: serverTimestamp(),
      })

      setNewMember({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        status: 'active',
      })
      setAddModalOpen(false)
      alert('Member added successfully!')
    } catch (error) {
      console.error('[v0] Error adding member:', error)
      alert('Failed to add member. Please try again.')
    }
  }

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCSVImporting(true)
    setCSVErrors([])

    try {
      const content = await file.text()
      const result = parseCSV(content)

      if (result.errors.length > 0) {
        setCSVErrors(result.errors)
        setCSVImporting(false)
        return
      }

      // Batch add members
      const batch = result.valid
      let successCount = 0
      let failCount = 0

      for (const member of batch) {
        try {
          await addDoc(collection(db, 'users'), {
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            phone: member.phone || '',
            location: member.location || '',
            status: member.status || 'active',
            role: 'member',
            createdAt: serverTimestamp(),
          })
          successCount++
        } catch (error) {
          failCount++
          console.error('[v0] Error adding member from CSV:', error)
        }
      }

      alert(`CSV Import Complete!\nSuccessfully added: ${successCount}\nFailed: ${failCount}`)
      setCSVImportOpen(false)
    } catch (error) {
      console.error('[v0] Error processing CSV:', error)
      alert('Failed to process CSV file. Please ensure it is a valid CSV.')
    } finally {
      setCSVImporting(false)
    }
  }

  return (
    <div className="space-y-6 px-8">
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setCSVImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 rounded-lg hover:bg-neutral-50 transition font-medium"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <AdminTable
        title="All Members"
        columns={columns}
        data={members}
        loading={loading}
        searchPlaceholder="Search by name, email, or location..."
        onEdit={handleEditMember}
        onDelete={handleDeleteMember}
      />

      {/* Add Member Modal */}
      {addModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content bg-white rounded-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Member</h2>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={newMember.phone || ''}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={newMember.location || ''}
                  onChange={(e) => setNewMember({ ...newMember, location: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newMember.status || 'active'}
                  onChange={(e) => setNewMember({ ...newMember, status: e.target.value as any })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-medium"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {csvImportOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content bg-white rounded-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Import Members from CSV</h2>
              <button
                onClick={() => {
                  setCSVImportOpen(false)
                  setCSVErrors([])
                }}
                className="text-neutral-500 hover:text-neutral-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-neutral-600">Required columns: firstName, lastName, email</p>
              <p className="text-sm text-neutral-600">Optional columns: phone, location, status</p>

              <input
                type="file"
                id="csv-import"
                accept=".csv"
                onChange={handleCSVImport}
                disabled={csvImporting}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => document.getElementById('csv-import')?.click()}
                disabled={csvImporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg hover:border-neutral-400 transition font-medium disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {csvImporting ? 'Importing...' : 'Choose CSV File'}
              </button>

              {csvErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium text-red-900 mb-2">Import Errors:</p>
                  {csvErrors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-700">
                      Row {err.row}: {err.error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCSVImportOpen(false)
                  setCSVErrors([])
                }}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      <EditMemberModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        member={selectedMember}
        onSuccess={() => {
          setEditModalOpen(false)
          setSelectedMember(null)
        }}
      />
    </div>
  )
}
