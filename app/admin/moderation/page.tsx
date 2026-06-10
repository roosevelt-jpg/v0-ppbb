'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { AlertCircle, CheckCircle, XCircle, Flag } from 'lucide-react'

export default function ModerationPage() {
  const [reports, setReports] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'resolved'>('pending')

  React.useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsSnap = await getDocs(collection(db, 'communityReports'))
        const reportsData = reportsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setReports(reportsData)
      } catch (error) {
        console.error('[v0] Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const handleApprove = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'communityReports', reportId), {
        status: 'approved',
        resolvedAt: new Date()
      })
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'approved' } : r))
    } catch (error) {
      console.error('[v0] Error approving report:', error)
    }
  }

  const handleReject = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'communityReports', reportId), {
        status: 'rejected',
        resolvedAt: new Date()
      })
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'rejected' } : r))
    } catch (error) {
      console.error('[v0] Error rejecting report:', error)
    }
  }

  const filteredReports = filter === 'all' ? reports : reports.filter(r => 
    filter === 'pending' ? r.status === 'pending' : r.status !== 'pending'
  )

  return (
    <>
      <AdminHeader title="Content Moderation" subtitle="Review and manage community reports" />
      
      <div className="p-8 bg-neutral-50 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 uppercase tracking-wide">Total Reports</p>
            <p className="text-3xl font-bold text-neutral-900 mt-2">{reports.length}</p>
          </Card>
          <Card className="p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 uppercase tracking-wide">Pending</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{reports.filter(r => r.status === 'pending').length}</p>
          </Card>
          <Card className="p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 uppercase tracking-wide">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{reports.filter(r => r.status === 'approved').length}</p>
          </Card>
          <Card className="p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 uppercase tracking-wide">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{reports.filter(r => r.status === 'rejected').length}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'pending', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {f === 'all' ? 'All Reports' : f === 'pending' ? 'Pending' : 'Resolved'}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-8 border border-neutral-200 text-center text-neutral-600">Loading reports...</Card>
          ) : filteredReports.length === 0 ? (
            <Card className="p-8 border border-neutral-200 text-center text-neutral-600">No {filter} reports found</Card>
          ) : (
            filteredReports.map(report => (
              <Card key={report.id} className="p-6 border border-neutral-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-neutral-900">{report.reason}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        report.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        report.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">{report.description}</p>
                    <p className="text-xs text-neutral-500 mt-2">Reported by: {report.reportedBy}</p>
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
    </>
  )
}
