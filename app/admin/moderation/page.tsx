'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc, onSnapshot, orderBy, writeBatch, addDoc } from 'firebase/firestore'
import { AlertCircle, CheckCircle, XCircle, Flag, Trash2, Ban, Eye, MessageSquare, TrendingUp, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AdminUserCell } from '@/components/admin-user-cell'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { BUTTON_PRIMARY, BUTTON_DANGER, FILTER_PILL_ACTIVE, FILTER_PILL_INACTIVE } from '@/lib/admin-design-system'
import { useAdminAudit } from '@/lib/use-admin-audit'

type ModerationTab = 'reports' | 'users' | 'content' | 'community-messages' | 'banned-words'

export default function ModerationPage() {
  const audit = useAdminAudit()
  const [reports, setReports] = React.useState<any[]>([])
  const [flaggedUsers, setFlaggedUsers] = React.useState<any[]>([])
  const [flaggedContent, setFlaggedContent] = React.useState<any[]>([])
  const [communityMessages, setCommunityMessages] = React.useState<any[]>([])
  const [bannedWords, setBannedWords] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'resolved'>('pending')
  const [activeTab, setActiveTab] = React.useState<ModerationTab>('reports')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedReports, setSelectedReports] = React.useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = React.useState<'approve' | 'reject' | 'delete' | null>(null)
  const [newBannedWord, setNewBannedWord] = React.useState('')
  const [communityFilter, setCommunityFilter] = React.useState<'all' | 'pending'>('pending')

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

  // Fetch flagged community messages
  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'community_messages'), where('isFlagged', '==', true), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setCommunityMessages(messagesData)
      },
      (error) => {
        console.error('[v0] Error fetching flagged messages:', error)
      }
    )
    return () => unsubscribe()
  }, [])

  // Fetch banned words
  React.useEffect(() => {
    const fetchBannedWords = async () => {
      try {
        const settingsSnap = await getDocs(collection(db, 'moderation_settings'))
        if (settingsSnap.docs.length > 0) {
          const words = settingsSnap.docs[0]?.data()?.bannedWords || []
          setBannedWords(words)
        }
      } catch (error) {
        console.error('[v0] Error fetching banned words:', error)
      }
    }
    fetchBannedWords()
  }, [])

  const handleApprove = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'communityReports', reportId), {
        status: 'approved',
        resolvedAt: new Date(),
        resolvedBy: 'admin'
      })
      audit({
        actionType: 'approve',
        action: `Approved community report: ${reportId}`,
        entityType: 'content',
        entityId: reportId,
        status: 'success',
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
      audit({
        actionType: 'reject',
        action: `Rejected community report: ${reportId}`,
        entityType: 'content',
        entityId: reportId,
        status: 'success',
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
      audit({
        actionType: 'delete',
        action: `Deleted flagged post: ${contentId}`,
        entityType: 'content',
        entityId: contentId,
        status: 'success',
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
      audit({
        actionType: 'update',
        action: `Banned user: ${userId}`,
        entityType: 'member',
        entityId: userId,
        status: 'success',
        details: 'Community violation',
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
      audit({
        actionType: bulkAction === 'approve' ? 'approve' : bulkAction === 'reject' ? 'reject' : 'delete',
        action: `Bulk ${bulkAction} on ${selectedReports.size} community report(s)`,
        entityType: 'content',
        status: 'success',
        details: `Report IDs: ${Array.from(selectedReports).join(', ')}`,
      })
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

  const handleDeleteCommunityMessage = async (messageId: string) => {
    try {
      console.log('[v0] Deleting community message:', messageId)
      await updateDoc(doc(db, 'community_messages', messageId), {
        moderationStatus: 'rejected',
        isFlagged: false,
        deletedAt: new Date(),
        deletedBy: 'admin'
      })
      audit({
        actionType: 'delete',
        action: `Deleted community message: ${messageId}`,
        entityType: 'content',
        entityId: messageId,
        status: 'success',
      })
    } catch (error) {
      console.error('[v0] Error deleting community message:', error)
    }
  }

  const handleApproveCommunityMessage = async (messageId: string) => {
    try {
      console.log('[v0] Approving community message:', messageId)
      await updateDoc(doc(db, 'community_messages', messageId), {
        moderationStatus: 'approved',
        isFlagged: false
      })
      audit({
        actionType: 'approve',
        action: `Approved community message: ${messageId}`,
        entityType: 'content',
        entityId: messageId,
        status: 'success',
      })
    } catch (error) {
      console.error('[v0] Error approving community message:', error)
    }
  }

  const handleAddBannedWord = async () => {
    if (!newBannedWord.trim()) return

    try {
      const word = newBannedWord.toLowerCase().trim()
      const updatedWords = [...bannedWords, word]
      
      console.log('[v0] Adding banned word:', word)
      
      const settingsSnap = await getDocs(collection(db, 'moderation_settings'))
      if (settingsSnap.docs.length > 0) {
        await updateDoc(doc(db, 'moderation_settings', settingsSnap.docs[0].id), {
          bannedWords: updatedWords,
          updatedAt: new Date()
        })
      } else {
        await addDoc(collection(db, 'moderation_settings'), {
          bannedWords: updatedWords,
          createdAt: new Date()
        })
      }
      
      audit({
        actionType: 'update',
        action: `Added banned word: ${word}`,
        entityType: 'settings',
        status: 'success',
      })

      setBannedWords(updatedWords)
      setNewBannedWord('')
    } catch (error) {
      console.error('[v0] Error adding banned word:', error)
    }
  }

  const handleRemoveBannedWord = async (wordToRemove: string) => {
    try {
      const updatedWords = bannedWords.filter(w => w !== wordToRemove)
      
      console.log('[v0] Removing banned word:', wordToRemove)
      
      const settingsSnap = await getDocs(collection(db, 'moderation_settings'))
      if (settingsSnap.docs.length > 0) {
        await updateDoc(doc(db, 'moderation_settings', settingsSnap.docs[0].id), {
          bannedWords: updatedWords,
          updatedAt: new Date()
        })
      }
      
      audit({
        actionType: 'update',
        action: `Removed banned word: ${wordToRemove}`,
        entityType: 'settings',
        status: 'success',
      })

      setBannedWords(updatedWords)
    } catch (error) {
      console.error('[v0] Error removing banned word:', error)
    }
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
    flaggedContent: flaggedContent.length,
    flaggedMessages: communityMessages.filter(m => m.moderationStatus === 'pending').length,
    totalBannedWords: bannedWords.length
  }

  return (
    <AdminPageLayout title="Moderation" subtitle="Review and manage community reports">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4 border border-neutral-200 dark:border-border">
            <p className="text-xs text-neutral-600 dark:text-muted-foreground uppercase tracking-wide">Total Reports</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-foreground mt-1">{stats.totalReports}</p>
          </Card>
          <Card className="p-4 border border-neutral-200 dark:border-border">
            <p className="text-xs text-neutral-600 dark:text-muted-foreground uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingReports}</p>
          </Card>
          <Card className="p-4 border border-neutral-200 dark:border-border">
            <p className="text-xs text-neutral-600 dark:text-muted-foreground uppercase tracking-wide">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approvedReports}</p>
          </Card>
          <Card className="p-4 border border-neutral-200 dark:border-border">
            <p className="text-xs text-neutral-600 dark:text-muted-foreground uppercase tracking-wide">Rejected</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejectedReports}</p>
          </Card>
          <Card className="p-4 border border-neutral-200 dark:border-border">
            <p className="text-xs text-neutral-600 dark:text-muted-foreground uppercase tracking-wide">Flagged Users</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.flaggedUsers}</p>
          </Card>
          <Card className="p-4 border border-neutral-200 dark:border-border">
            <p className="text-xs text-neutral-600 dark:text-muted-foreground uppercase tracking-wide">Flagged Content</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.flaggedContent}</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap overflow-x-auto">
          {(['reports', 'users', 'content', 'community-messages', 'banned-words'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
            >
              {tab === 'reports' && `Reports (${stats.pendingReports})`}
              {tab === 'users' && `Flagged Users (${stats.flaggedUsers})`}
              {tab === 'content' && `Flagged Content (${stats.flaggedContent})`}
              {tab === 'community-messages' && `Community Messages (${stats.flaggedMessages})`}
              {tab === 'banned-words' && `Banned Words (${stats.totalBannedWords})`}
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
                  className={filter === f ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
                >
                  {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Resolved'}
                </button>
              ))}
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 border border-neutral-300 dark:border-border rounded-lg text-sm"
              />
            </div>

            {/* Bulk Actions */}
            {selectedReports.size > 0 && (
              <Card className="p-4 border-2 border-blue-200 bg-blue-50">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-neutral-900 dark:text-foreground">{selectedReports.size} reports selected</span>
                  <div className="flex gap-2">
                    <select
                      value={bulkAction || ''}
                      onChange={(e) => setBulkAction(e.target.value as any)}
                      className="px-3 py-2 border border-neutral-300 dark:border-border rounded-lg text-sm"
                    >
                      <option value="">Choose action...</option>
                      <option value="approve">Approve All</option>
                      <option value="reject">Reject All</option>
                    </select>
                    <button
                      onClick={handleBulkModeration}
                      disabled={!bulkAction}
                      className={`${BUTTON_PRIMARY} text-sm`}
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setSelectedReports(new Set())}
                      className={`${FILTER_PILL_INACTIVE} text-sm`}
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
                <Card className="p-8 border border-neutral-200 dark:border-border text-center text-neutral-600 dark:text-muted-foreground">Loading...</Card>
              ) : filteredReports.length === 0 ? (
                <Card className="p-8 border border-neutral-200 dark:border-border text-center text-neutral-600 dark:text-muted-foreground">No reports found</Card>
              ) : (
                filteredReports.map(report => (
                  <Card key={report.id} className="p-4 border border-neutral-200 dark:border-border">
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
                          <span className="font-semibold text-neutral-900 dark:text-foreground">{report.reason}</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            report.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            report.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-muted-foreground mb-1">{report.description}</p>
                        <div className="flex gap-4 text-xs text-neutral-500 dark:text-muted-foreground">
                          <span>Reported by: {report.reportedBy}</span>
                          <span>{formatDistanceToNow(report.createdAt?.toDate?.() || new Date(), { addSuffix: true })}</span>
                        </div>
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(report.id)}
                            className={`${BUTTON_PRIMARY} text-sm flex items-center gap-1`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(report.id)}
                            className={`${BUTTON_DANGER} text-sm flex items-center gap-1`}
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
              <Card className="p-8 border border-neutral-200 dark:border-border text-center text-neutral-600 dark:text-muted-foreground">No flagged users</Card>
            ) : (
              flaggedUsers.map(user => (
                <Card key={user.id} className="p-4 border border-neutral-200 dark:border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <AdminUserCell user={user} />
                      <p className="text-sm text-neutral-600 dark:text-muted-foreground mt-1 break-all">{user.email || 'Not provided'}</p>
                      <p className="text-sm text-neutral-600 dark:text-muted-foreground">
                        Phone: {formatUserPhoneDisplay(user)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-2">Flags: {user.flags || 0}</p>
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
              <Card className="p-8 border border-neutral-200 dark:border-border text-center text-neutral-600 dark:text-muted-foreground">No flagged content</Card>
            ) : (
              flaggedContent.map(content => (
                <Card key={content.id} className="p-4 border border-neutral-200 dark:border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-neutral-600 dark:text-muted-foreground" />
                        <h4 className="font-semibold text-neutral-900 dark:text-foreground line-clamp-2">{content.text}</h4>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-muted-foreground">
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

        {/* Community Messages Tab */}
        {activeTab === 'community-messages' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              {['pending', 'all'].map(f => (
                <button
                  key={f}
                  onClick={() => setCommunityFilter(f as any)}
                  className={communityFilter === f ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
                >
                  {f === 'pending' ? 'Pending' : 'All'}
                </button>
              ))}
            </div>

            {communityMessages.length === 0 ? (
              <Card className="p-8 border border-neutral-200 dark:border-border text-center text-neutral-600 dark:text-muted-foreground">No flagged community messages</Card>
            ) : (
              <div className="space-y-3">
                {(communityFilter === 'all' ? communityMessages : communityMessages.filter(m => m.moderationStatus === 'pending')).map(message => (
                  <Card key={message.id} className="p-4 border border-neutral-200 dark:border-border">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="w-4 h-4 text-red-600" />
                          <span className="font-semibold text-neutral-900 dark:text-foreground">{message.content.slice(0, 100)}</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            message.moderationStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                            message.moderationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {message.moderationStatus}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-muted-foreground mb-2">{message.content}</p>
                        <div className="flex gap-4 text-xs text-neutral-500 dark:text-muted-foreground">
                          <span>By: {message.authorName}</span>
                          <span>Community: {message.communityId}</span>
                          <span>{formatDistanceToNow(message.createdAt?.toDate?.() || new Date(), { addSuffix: true })}</span>
                        </div>
                      </div>
                      {message.moderationStatus === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApproveCommunityMessage(message.id)}
                            className={`${BUTTON_PRIMARY} text-sm flex items-center gap-1`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeleteCommunityMessage(message.id)}
                            className={`${BUTTON_DANGER} text-sm flex items-center gap-1`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Banned Words Tab */}
        {activeTab === 'banned-words' && (
          <div className="space-y-4">
            <Card className="p-6 border border-neutral-200 dark:border-border">
              <h3 className="text-lg font-semibold mb-4">Add Banned Word</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter word to ban..."
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBannedWord()}
                  className="flex-1 px-3 py-2 border border-neutral-300 dark:border-border rounded-lg text-sm"
                />
                <button
                  onClick={handleAddBannedWord}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
                >
                  Add Word
                </button>
              </div>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold text-neutral-900 dark:text-foreground">Current Banned Words ({bannedWords.length})</h3>
              {bannedWords.length === 0 ? (
                <Card className="p-4 border border-neutral-200 dark:border-border text-center text-neutral-600 dark:text-muted-foreground">No banned words configured</Card>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {bannedWords.map(word => (
                    <div
                      key={word}
                      className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm"
                    >
                      <span className="font-medium">{word}</span>
                      <button
                        onClick={() => handleRemoveBannedWord(word)}
                        className="ml-1 hover:text-red-900 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
