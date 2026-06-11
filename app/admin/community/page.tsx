'use client'

import React from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Flag, Trash2, Users, MessageSquare, Eye, Check, X } from 'lucide-react'

interface Flag {
  id: string
  type: 'post' | 'comment' | 'user' | 'group'
  targetId: string
  reason: string
  reportedBy: string
  reportedAt: any
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  groupId?: string
  adminNotes?: string
}

export default function CommunityAdminPage() {
  const [flags, setFlags] = React.useState<Flag[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedFlag, setSelectedFlag] = React.useState<Flag | null>(null)
  const [adminNotes, setAdminNotes] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('pending')

  // Load flagged content
  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'communityModeration'), where('status', '==', statusFilter)),
      (snapshot) => {
        const flagsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Flag[]
        setFlags(flagsData.sort((a, b) => (b.reportedAt?.toDate?.() || 0) - (a.reportedAt?.toDate?.() || 0)))
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error loading flags:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [statusFilter])

  const handleResolve = async (flagId: string, action: 'approve' | 'delete' | 'ban') => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    try {
      await updateDoc(doc(db, 'communityModeration', flagId), {
        status: 'resolved',
        action,
        adminNotes,
        resolvedBy: firebaseUser.uid,
        resolvedAt: new Date(),
      })

      setSelectedFlag(null)
      setAdminNotes('')
    } catch (error) {
      console.error('[v0] Error resolving flag:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800'
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'dismissed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Community Moderation</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold">{flags.filter((f) => f.status === 'pending').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Reviewed</p>
          <p className="text-2xl font-bold">{flags.filter((f) => f.status === 'reviewed').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Resolved</p>
          <p className="text-2xl font-bold">{flags.filter((f) => f.status === 'resolved').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Dismissed</p>
          <p className="text-2xl font-bold">{flags.filter((f) => f.status === 'dismissed').length}</p>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === status ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flags List */}
        <div className="lg:col-span-2">
          {!loading ? (
            <div className="space-y-4">
              {flags.map((flag) => (
                <Card
                  key={flag.id}
                  className={`p-4 cursor-pointer border-2 transition ${
                    selectedFlag?.id === flag.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFlag(flag)}
                >
                  <div className="flex gap-4">
                    <div className="text-2xl">
                      {flag.type === 'post' && '📝'}
                      {flag.type === 'comment' && '💬'}
                      {flag.type === 'user' && '👤'}
                      {flag.type === 'group' && '👥'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">
                          {flag.type === 'post' && 'Post Flagged'}
                          {flag.type === 'comment' && 'Comment Flagged'}
                          {flag.type === 'user' && 'User Flagged'}
                          {flag.type === 'group' && 'Group Flagged'}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(flag.status)}`}>
                          {flag.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {flag.reason}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Reported:</strong> {flag.reportedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">Loading...</div>
          )}

          {!loading && flags.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-600">No {statusFilter} flags</p>
            </Card>
          )}
        </div>

        {/* Detail Panel */}
        {selectedFlag && (
          <Card className="p-6 h-fit sticky top-8">
            <h3 className="font-bold text-lg mb-4">Review Details</h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium">{selectedFlag.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium">{selectedFlag.reason}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Target ID</p>
                <p className="font-medium text-xs break-all">{selectedFlag.targetId}</p>
              </div>
            </div>

            {selectedFlag.status === 'pending' && (
              <>
                <textarea
                  placeholder="Add admin notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-4 h-24"
                />

                <div className="space-y-2">
                  <Button onClick={() => handleResolve(selectedFlag.id, 'approve')} className="w-full bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button onClick={() => handleResolve(selectedFlag.id, 'delete')} className="w-full bg-red-600 hover:bg-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button onClick={() => handleResolve(selectedFlag.id, 'ban')} className="w-full bg-orange-600 hover:bg-orange-700">
                    <X className="w-4 h-4 mr-2" />
                    Ban User
                  </Button>
                </div>
              </>
            )}

            {selectedFlag.status === 'resolved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">Resolved</p>
                {selectedFlag.adminNotes && (
                  <p className="text-sm text-green-800 mt-2">{selectedFlag.adminNotes}</p>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
