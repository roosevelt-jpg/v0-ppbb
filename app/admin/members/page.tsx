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
    { key: 'name', label: 'Name', width: '200px' },
    {
      key: 'email', label: 'Email', width: '250px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value}</span>,
    },
    {
      key: 'location', label: 'Location', width: '150px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'status', label: 'Status', width: '100px',
      render: (value: any) => (
        <span style={{
          backgroundColor: value === 'active' ? '#e8f5e9' : '#fff3e0',
          color: value === 'active' ? '#2e7d32' : '#e65100',
          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
        }}>
          {value || 'active'}
        </span>
      ),
    },
    {
      key: 'createdAt', label: 'Joined', width: '150px',
      render: (value: any) => {
        if (!value) return '-'
        const date = value.toDate ? value.toDate() : new Date(value)
        return <span style={{ color: '#888888' }}>{formatDistanceToNow(date, { addSuffix: true })}</span>
      },
    },
  ]

  const handleEditMember = (member: any) => { setSelectedMember(member); setEditModalOpen(true) }
  const handleDeleteMember = (member: any) => {
    if (confirm(`Are you sure you want to delete ${member.name}?`)) console.log('Delete member:', member)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMember.firstName.trim() || !newMember.lastName.trim() || !newMember.email.trim()) {
      alert('Please fill in all required fields'); return
    }
    try {
      await addDoc(collection(db, 'users'), {
        firstName: newMember.firstName, lastName: newMember.lastName, email: newMember.email,
        phone: newMember.phone || '', location: newMember.location || '',
        status: newMember.status || 'active', role: 'member', createdAt: serverTimestamp(),
      })
      setNewMember({ firstName: '', lastName: '', email: '', phone: '', location: '', status: 'active' })
      setAddModalOpen(false)
      alert('Member added successfully!')
    } catch (error) {
      console.error('[v0] Error adding member:', error)
      alert('Failed to add member. Please try again.')
    }
  }

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setCSVImporting(true); setCSVErrors([])
    try {
      const content = await file.text()
      const result = parseCSV(content)
      if (result.errors.length > 0) { setCSVErrors(result.errors); setCSVImporting(false); return }
      let successCount = 0, failCount = 0
      for (const member of result.valid) {
        try {
          await addDoc(collection(db, 'users'), {
            firstName: member.firstName, lastName: member.lastName, email: member.email,
            phone: member.phone || '', location: member.location || '',
            status: member.status || 'active', role: 'member', createdAt: serverTimestamp(),
          })
          successCount++
        } catch { failCount++ }
      }
      alert(`CSV Import Complete!\nSuccessfully added: ${successCount}\nFailed: ${failCount}`)
      setCSVImportOpen(false)
    } catch (error) {
      alert('Failed to process CSV file. Please ensure it is a valid CSV.')
    } finally {
      setCSVImporting(false)
    }
  }

  // Inline styles for modal to completely bypass global CSS
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '1rem',
  }
  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '448px',
    maxHeight: '90vh', overflowY: 'auto', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  }
  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    border: '1px solid #d1d5db', borderRadius: '8px',
    padding: '8px 12px', fontSize: '14px', lineHeight: '1.5',
    outline: 'none', height: 'auto', minHeight: '40px',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500,
    marginBottom: '4px', color: '#111', textTransform: 'none', letterSpacing: 'normal',
  }
  const btnPrimaryStyle: React.CSSProperties = {
    flex: 1, padding: '8px 16px', backgroundColor: '#111827', color: 'white',
    borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    border: 'none', height: 'auto', minHeight: '40px', width: '100%',
  }
  const btnSecondaryStyle: React.CSSProperties = {
    flex: 1, padding: '8px 16px', backgroundColor: 'white', color: '#111',
    borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    border: '1px solid #d1d5db', height: 'auto', minHeight: '40px', width: '100%',
  }

  return (
    <div className="space-y-6 px-8">
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setCSVImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 rounded-lg hover:bg-neutral-50 transition font-medium"
        >
          <Upload className="w-4 h-4" /> Import CSV
        </button>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-medium"
        >
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <AdminTable
        title="All Members" columns={columns} data={members} loading={loading}
        searchPlaceholder="Search by name, email, or location..."
        onEdit={handleEditMember} onDelete={handleDeleteMember}
      />

      {/* Add Member Modal */}
      {addModalOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Add New Member</h2>
              <button onClick={() => setAddModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: '0', minHeight: 'auto', height: 'auto', boxShadow: 'none' }}>
                ×
              </button>
            </div>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input type="text" value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input type="text" value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input type="tel" value={newMember.phone || ''}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input type="text" value={newMember.location || ''}
                  onChange={(e) => setNewMember({ ...newMember, location: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={newMember.status || 'active'}
                  onChange={(e) => setNewMember({ ...newMember, status: e.target.value as any })}
                  style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="button" onClick={() => setAddModalOpen(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" style={btnPrimaryStyle}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {csvImportOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Import Members from CSV</h2>
              <button onClick={() => { setCSVImportOpen(false); setCSVErrors([]) }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: '0', minHeight: 'auto', height: 'auto', boxShadow: 'none' }}>
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>Required columns: firstName, lastName, email</p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>Optional columns: phone, location, status</p>

              <input type="file" id="csv-import" accept=".csv" onChange={handleCSVImport}
                disabled={csvImporting} style={{ display: 'none' }} />

              <button type="button" onClick={() => document.getElementById('csv-import')?.click()}
                disabled={csvImporting}
                style={{ ...btnSecondaryStyle, border: '2px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Upload style={{ width: '16px', height: '16px' }} />
                {csvImporting ? 'Importing...' : 'Choose CSV File'}
              </button>

              {csvErrors.length > 0 && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', maxHeight: '160px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#7f1d1d', marginBottom: '8px' }}>Import Errors:</p>
                  {csvErrors.map((err, idx) => (
                    <p key={idx} style={{ fontSize: '12px', color: '#991b1b', margin: '2px 0' }}>Row {err.row}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => { setCSVImportOpen(false); setCSVErrors([]) }} style={btnSecondaryStyle}>Close</button>
            </div>
          </div>
        </div>
      )}

      <EditMemberModal open={editModalOpen} onOpenChange={setEditModalOpen} member={selectedMember}
        onSuccess={() => { setEditModalOpen(false); setSelectedMember(null) }} />
    </div>
  )
}
