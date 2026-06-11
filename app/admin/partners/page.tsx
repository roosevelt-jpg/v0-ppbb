'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { AdminTable } from '@/components/admin-table'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function CharityPartnersPage() {
  const [partners, setPartners] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newPartner, setNewPartner] = React.useState({
    name: '',
    description: '',
    website: '',
    paymentLink: '',
    logo: '',
    status: 'active',
  })

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'charityPartners'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setPartners(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPartner.name.trim()) return

    await addDoc(collection(db, 'charityPartners'), {
      ...newPartner,
      createdAt: serverTimestamp(),
      active: true,
    })

    setNewPartner({
      name: '',
      description: '',
      website: '',
      paymentLink: '',
      logo: '',
      status: 'active',
    })
  }

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Delete this charity partner?')) return
    await deleteDoc(doc(db, 'charityPartners', id))
  }

  return (
    <div>
      <AdminHeader title="Charity Partners" subtitle="Manage official charity partner organizations" />

      <div className="space-y-6">
        {/* Add New Partner Form */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold mb-4">Add New Charity Partner</h2>
          <form onSubmit={handleAddPartner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Partner Name (e.g., Beit Al Khair)"
              value={newPartner.name}
              onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="url"
              placeholder="Website URL"
              value={newPartner.website}
              onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="url"
              placeholder="Payment Link"
              value={newPartner.paymentLink}
              onChange={(e) => setNewPartner({ ...newPartner, paymentLink: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="url"
              placeholder="Logo URL"
              value={newPartner.logo}
              onChange={(e) => setNewPartner({ ...newPartner, logo: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <textarea
              placeholder="Partner Description"
              value={newPartner.description}
              onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
              className="border rounded px-3 py-2 md:col-span-2"
              rows={3}
            />
            <button
              type="submit"
              className="md:col-span-2 bg-black hover:bg-gray-800 text-white py-2 rounded font-medium"
            >
              Add Partner
            </button>
          </form>
        </div>

        {/* Partners List Table */}
        <AdminTable
          title="Charity Partners"
          columns={['Name', 'Website', 'Payment Link', 'Status', 'Added', 'Actions']}
          data={partners.map((partner) => ({
            name: partner.name,
            website: (
              <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View
              </a>
            ),
            paymentLink: (
              <a href={partner.paymentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Payment Link
              </a>
            ),
            status: (
              <span className={`px-2 py-1 rounded text-sm ${partner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                {partner.status}
              </span>
            ),
            added: formatDistanceToNow(partner.createdAt?.toDate?.() || new Date(), { addSuffix: true }),
            actions: (
              <button onClick={() => handleDeletePartner(partner.id)} className="text-red-600 hover:text-red-800">
                Delete
              </button>
            ),
          }))}
          onEdit={() => {}}
          onDelete={handleDeletePartner}
          loading={loading}
        />
      </div>
    </div>
  )
}
