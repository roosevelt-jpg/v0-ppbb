'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc, onSnapshot, orderBy, writeBatch } from 'firebase/firestore'
import { AlertCircle, CheckCircle, XCircle, Flag, Trash2, Ban, Eye, MessageSquare, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type ModerationTab = 'reports' | 'users' | 'content'

export default function ModerationPage() {
  const [reports, setReports] = React.useState<any[]>([])
  const [flaggedUsers, setFlaggedUsers] = React.useState<any[]>([])
  const [flaggedContent, setFlaggedContent] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'resolved'>('pending')
  const [activeTab, setActiveTab] = React.useState<ModerationTab>('reports')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedReports, setSelectedReports] = React.useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = React.useState<'approve' | 'reject' | 'delete' | null>(null)

  // Fetch reports
  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'communityReports'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setReports(reportsData)
      },
      (error) => {
        console.error('[v0] Error fetching reports:', error)
      }
    )
    return () => unsubscribe()
  }, [])

  // Fetch flagged users
  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), where('flags', '>', 0)),
      (snapshot) => {
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setFlaggedUsers(userData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching flagged users:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // Fetch flagged content
  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'posts'), where('flagged', '==', true), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const contentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setFlaggedContent(contentData)
      },
      (error) => {
        console.error('[v0] Error fetching flagged content:', error)
      }
    )
    return () => unsubscribe()
  }, [])

  const handleApprove = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'communityReports', reportId), {
        status: 'approved',
        resolvedAt: new Date(),
        resolvedBy: 'admin'
      })
    } catch (error) {
      console.error('[v0] Error approving report:', error)
    }
  }

  const handleReject = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'communityReports', reportId), {
        status: 'rejected',
        resolvedAt: new Date(),
        resolvedBy: 'admin'
      })
    } catch (error) {
      console.error('[v0] Error rejecting report:', error)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    try {
      await updateDoc(doc(db, 'posts', contentId), {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: 'admin'
      })
    } catch (error) {
      console.error('[v0] Error deleting content:', error)
    }
  }

  const handleBanUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        active: false,
        bannedAt: new Date(),
        bannedReason: 'Community violation'
      })
    } catch (error) {
      console.error('[v0] Error banning user:', error)
    }
  }

  const handleBulkModeration = async () => {
    if (selectedReports.size === 0 || !bulkAction) return

    try {
      const batch = writeBatch(db)
      selectedReports.forEach((reportId) => {
        const reportRef = doc(db, 'communityReports', reportId)
        batch.update(reportRef, {
          status: bulkAction === 'approve' ? 'approved' : bulkAction === 'reject' ? 'rejected' : 'deleted',
          resolvedAt: new Date(),
          resolvedBy: 'admin_bulk'
        })
      })
      await batch.commit()
      setSelectedReports(new Set())
      setBulkAction(null)
    } catch (error) {
      console.error('[v0] Error bulk moderating:', error)
    }
  }

  const toggleReportSelection = (reportId: string) => {
    const newSelected = new Set(selectedReports)
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId)
    } else {
      newSelected.add(reportId)
    }
    setSelectedReports(newSelected)
  }

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === 'all' ? true : filter === 'pending' ? r.status === 'pending' : r.status !== 'pending'
    const matchesSearch = searchTerm === '' || 
      r.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    approvedReports: reports.filter(r => r.status === 'approved').length,
    rejectedReports: reports.filter(r => r.status === 'rejected').length,
    flaggedUsers: flaggedUsers.length,
    flaggedContent: flaggedContent.length
  }

  return (
    <AdminPageLayout title="Moderation" subtitle="Review and manage community reports">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4 border border-neutral-200">
            <p className="text-xs text-neutral-600 uppercase tracking-wide">Total Reports</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.totalReports}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <p className="text-xs text-neutral-600 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingReports}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <p className="text-xs text-neutral-600 uppercase tracking-wide">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approvedReports}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <p className="text-xs text-neutral-600 uppercase tracking-wide">Rejected</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejectedReports}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <p className="text-xs text-neutral-600 uppercase tracking-wide">Flagged Users</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.flaggedUsers}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <p className="text-xs text-neutral-600 uppercase tracking-wide">Flagged Content</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.flaggedContent}</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200">
          {(['reports', 'users', 'content'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab === 'reports' && `Reports (${stats.pendingReports})`}
              {tab === 'users' && `Flagged Users (${stats.flaggedUsers})`}
              {tab === 'content' && `Flagged Content (${stats.flaggedContent})`}
            </button>
          ))}
        </div>

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filters & Search */}
            <div className="flex gap-2 flex-wrap items-center">
              {['all', 'pending', 'resolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                    filter === f
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Resolved'}
                </button>
              ))}
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>

            {/* Bulk Actions */}
            {selectedReports.size > 0 && (
              <Card className="p-4 border-2 border-blue-200 bg-blue-50">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-neutral-900">{selectedReports.size} reports selected</span>
                  <div className="flex gap-2">
                    <select
                      value={bulkAction || ''}
                      onChange={(e) => setBulkAction(e.target.value as any)}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    >
                      <option value="">Choose action...</option>
                      <option value="approve">Approve All</option>
                      <option value="reject">Reject All</option>
                    </select>
                    <button
                      onClick={handleBulkModeration}
                      disabled={!bulkAction}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setSelectedReports(new Set())}
                      className="px-4 py-2 bg-neutral-300 text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-400 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Reports List */}
            <div className="space-y-3">
              {loading ? (
                <Card className="p-8 border border-neutral-200 text-center text-neutral-600">Loading...</Card>
              ) : filteredReports.length === 0 ? (
                <Card className="p-8 border border-neutral-200 text-center text-neutral-600">No reports found</Card>
              ) : (
                filteredReports.map(report => (
                  <Card key={report.id} className="p-4 border border-neutral-200">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.has(report.id)}
                        onChange={() => toggleReportSelection(report.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="w-4 h-4 text-red-600" />
                          <span className="font-semibold text-neutral-900">{report.reason}</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            report.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            report.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-1">{report.description}</p>
                        <div className="flex gap-4 text-xs text-neutral-500">
                          <span>Reported by: {report.reportedBy}</span>
                          <span>{formatDistanceToNow(report.createdAt?.toDate?.() || new Date(), { addSuffix: true })}</span>
                        </div>
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(report.id)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(report.id)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {flaggedUsers.length === 0 ? (
              <Card className="p-8 border border-neutral-200 text-center text-neutral-600">No flagged users</Card>
            ) : (
              flaggedUsers.map(user => (
                <Card key={user.id} className="p-4 border border-neutral-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900">{user.firstName} {user.lastName}</h4>
                      <p className="text-sm text-neutral-600">{user.email}</p>
                      <p className="text-xs text-neutral-500 mt-1">Flags: {user.flags || 0}</p>
                    </div>
                    <button
                      onClick={() => handleBanUser(user.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition flex items-center gap-1"
                    >
                      <Ban className="w-4 h-4" />
                      Ban User
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-3">
            {flaggedContent.length === 0 ? (
              <Card className="p-8 border border-neutral-200 text-center text-neutral-600">No flagged content</Card>
            ) : (
              flaggedContent.map(content => (
                <Card key={content.id} className="p-4 border border-neutral-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-neutral-600" />
                        <h4 className="font-semibold text-neutral-900 line-clamp-2">{content.text}</h4>
                      </div>
                      <p className="text-xs text-neutral-500">
                        By: {content.authorName} • {formatDistanceToNow(content.createdAt?.toDate?.() || new Date(), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteContent(content.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
