'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminTable } from '@/components/admin-table'
import { EditSponsorModal } from '@/components/edit-sponsor-modal'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Plus } from 'lucide-react'

export default function SponsorsPage() {
  const [sponsors, setSponsors] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedSponsor, setSelectedSponsor] = React.useState<any>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [newSponsor, setNewSponsor] = React.useState({
    name: '',
    category: '',
    contactPerson: '',
    email: '',
    sponsorshipLevel: 'standard' as 'gold' | 'silver' | 'bronze' | 'standard',
  })

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'sponsors'),
      (snapshot) => {
        const sponsorData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]
        setSponsors(sponsorData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching sponsors:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSponsor.name.trim() || !newSponsor.email.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await addDoc(collection(db, 'sponsors'), {
        name: newSponsor.name,
        category: newSponsor.category,
        contactPerson: newSponsor.contactPerson,
        email: newSponsor.email,
        sponsorshipLevel: newSponsor.sponsorshipLevel,
        createdAt: serverTimestamp(),
        status: 'active',
      })

      setNewSponsor({
        name: '',
        category: '',
        contactPerson: '',
        email: '',
        sponsorshipLevel: 'standard',
      })
      setAddModalOpen(false)
      alert('Sponsor added successfully!')
    } catch (error) {
      console.error('[v0] Error adding sponsor:', error)
      alert('Failed to add sponsor. Please try again.')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Sponsor Name',
      width: '250px',
      render: (value: any) => <span style={{ fontWeight: 500, color: '#111111' }}>{value}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      width: '150px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'contactPerson',
      label: 'Contact Person',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888' }}>{value || '-'}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      width: '200px',
      render: (value: any) => <span style={{ color: '#888888', fontSize: '12px' }}>{value || '-'}</span>,
    },
    {
      key: 'sponsorshipLevel',
      label: 'Level',
      width: '120px',
      render: (value: any) => {
        const levelColors: any = {
          gold: '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32',
          standard: '#888888',
        }
        return (
          <span
            style={{
              backgroundColor: `${levelColors[value] || '#888888'}20`,
              color: levelColors[value] || '#888888',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {value || 'standard'}
          </span>
        )
      },
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

  return (
    <div className="space-y-6">
      <div className="px-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Sponsor
          </button>
        </div>

        <AdminTable
          title="All Sponsors"
          columns={columns}
          data={sponsors}
          loading={loading}
          searchPlaceholder="Search by sponsor name, category, or contact..."
          onEdit={(item) => {
            setSelectedSponsor(item)
            setEditModalOpen(true)
          }}
          onDelete={async (item) => {
            if (confirm('Are you sure you want to delete this sponsor?')) {
              try {
                const { updateDocument } = await import('@/lib/admin-queries')
                await updateDocument('sponsors', item.id, { status: 'inactive', updatedAt: new Date() })
              } catch (error) {
                console.error('[v0] Error deleting sponsor:', error)
                alert('Failed to delete sponsor')
              }
            }
          }}
        />
      </div>

      {/* Add Sponsor Modal */}
      {addModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content bg-white rounded-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Sponsor</h2>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSponsor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sponsor Name *</label>
                <input
                  type="text"
                  value={newSponsor.name}
                  onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={newSponsor.category}
                  onChange={(e) => setNewSponsor({ ...newSponsor, category: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Technology, Finance, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  value={newSponsor.contactPerson}
                  onChange={(e) => setNewSponsor({ ...newSponsor, contactPerson: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={newSponsor.email}
                  onChange={(e) => setNewSponsor({ ...newSponsor, email: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sponsorship Level</label>
                <select
                  value={newSponsor.sponsorshipLevel}
                  onChange={(e) => setNewSponsor({ ...newSponsor, sponsorshipLevel: e.target.value as any })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                >
                  <option value="standard">Standard</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
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
                  Add Sponsor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSponsor && (
        <EditSponsorModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedSponsor(null)
          }}
          sponsor={selectedSponsor}
        />
      )}
    </div>
  )
}
