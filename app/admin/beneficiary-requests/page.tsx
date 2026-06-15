'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getAllBeneficiaryRequests,
  approveBeneficiaryRequest,
  rejectBeneficiaryRequest,
  getBeneficiaryAccessLogs,
  canDownloadSensitiveDocument,
} from '@/lib/beneficiary-queries'
import { BeneficiarySupportRequest, BeneficiaryAccessLog } from '@/lib/types'
import { AlertCircle, CheckCircle2, Clock, XCircle, Eye, Download, Filter } from 'lucide-react'

export default function BeneficiaryRequestsAdmin() {
  const [requests, setRequests] = useState<BeneficiarySupportRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<BeneficiarySupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<BeneficiarySupportRequest | null>(null)
  const [accessLogs, setAccessLogs] = useState<BeneficiaryAccessLog[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    emergencyLevel: '',
  })

  // Load beneficiary requests
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const reqs = await getAllBeneficiaryRequests('admin', {
          status: filters.status || undefined,
          emergencyLevel: filters.emergencyLevel || undefined,
        })

        setRequests(reqs)
      } catch (error) {
        console.error('[v0] Error loading beneficiary requests:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [filters])

  // Load access logs when request selected
  useEffect(() => {
    if (!selectedRequest) return

    const loadLogs = async () => {
      const logs = await getBeneficiaryAccessLogs(selectedRequest.id)
      setAccessLogs(logs)
    }

    loadLogs()
  }, [selectedRequest])

  const handleApprove = async (requestId: string, notes: string) => {
    setActionLoading(true)
    try {
      await approveBeneficiaryRequest(requestId, 'admin-system', notes)
      setRequests(requests.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r)))
      setSelectedRequest(null)
      alert('Request approved successfully')
    } catch (error) {
      console.error('[v0] Error approving request:', error)
      alert('Error approving request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (requestId: string, reason: string) => {
    setActionLoading(true)
    try {
      await rejectBeneficiaryRequest(requestId, 'admin-system', reason)
      setRequests(requests.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r)))
      setSelectedRequest(null)
      alert('Request rejected')
    } catch (error) {
      console.error('[v0] Error rejecting request:', error)
      alert('Error rejecting request')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
      case 'rejected':
        return <XCircle size={20} style={{ color: '#dc2626' }} />
      case 'under_review':
      case 'submitted':
        return <Clock size={20} style={{ color: '#ea580c' }} />
      default:
        return <AlertCircle size={20} style={{ color: '#6b7280' }} />
    }
  }

  const stats = {
    total: requests.length,
    submitted: requests.filter((r) => r.status === 'submitted').length,
    underReview: requests.filter((r) => r.status === 'under_review').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    critical: requests.filter((r) => r.emergencyLevel === 'critical').length,
  }

  return (
    <>
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {[
            { label: 'Total Requests', value: stats.total, color: '#111111' },
            { label: 'Submitted', value: stats.submitted, color: '#ea580c' },
            { label: 'Under Review', value: stats.underReview, color: '#f59e0b' },
            { label: 'Approved', value: stats.approved, color: '#16a34a' },
            { label: 'Critical Cases', value: stats.critical, color: '#dc2626' },
          ].map((stat) => (
            <Card
              key={stat.label}
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                borderLeft: `4px solid ${stat.color}`,
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#888888', marginBottom: '8px' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
          <Filter size={20} />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.emergencyLevel}
            onChange={(e) => setFilters({ ...filters, emergencyLevel: e.target.value })}
            style={{
              padding: '8px 12px',
              border: '1px solid #e4e1da',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Requests List & Detail View */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          {/* List */}
          <div>
            {loading ? (
              <p>Loading requests...</p>
            ) : requests.length === 0 ? (
              <Card style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: '#888888' }}>No requests found</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {requests.map((request) => (
                  <Card
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      backgroundColor: selectedRequest?.id === request.id ? '#faf9f7' : '#ffffff',
                      borderLeft: `4px solid ${
                        request.emergencyLevel === 'critical'
                          ? '#dc2626'
                          : request.emergencyLevel === 'high'
                            ? '#f59e0b'
                            : '#6b7280'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          {getStatusIcon(request.status)}
                          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>
                            {request.fullName}
                          </h3>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              backgroundColor:
                                request.status === 'approved'
                                  ? '#e0f2fe'
                                  : request.status === 'rejected'
                                    ? '#fee2e2'
                                    : '#fef3c7',
                              color:
                                request.status === 'approved'
                                  ? '#0369a1'
                                  : request.status === 'rejected'
                                    ? '#7f1d1d'
                                    : '#92400e',
                              borderRadius: '3px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#666666', marginBottom: '8px' }}>
                          {request.reasonCategory} - {request.emergencyLevel} priority
                        </p>
                        <p style={{ fontSize: '12px', color: '#888888' }}>
                          Submitted: {new Date(request.submissionDate || request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedRequest && (
            <Card
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                position: 'sticky',
                top: '80px',
                height: 'fit-content',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111111', marginBottom: '12px' }}>
                    Request Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <p style={{ color: '#888888' }}>Name</p>
                      <p style={{ fontWeight: 600, color: '#111111' }}>{selectedRequest.fullName}</p>
                    </div>
                    <div>
                      <p style={{ color: '#888888' }}>Contact</p>
                      <p style={{ fontWeight: 600, color: '#111111' }}>
                        {selectedRequest.phoneNumber} / {selectedRequest.email}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#888888' }}>Reason</p>
                      <p style={{ fontWeight: 600, color: '#111111', textTransform: 'capitalize' }}>
                        {selectedRequest.reasonCategory}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#888888' }}>Emergency Level</p>
                      <p
                        style={{
                          fontWeight: 600,
                          color: '#111111',
                          textTransform: 'capitalize',
                          padding: '4px 8px',
                          backgroundColor:
                            selectedRequest.emergencyLevel === 'critical'
                              ? '#fee2e2'
                              : selectedRequest.emergencyLevel === 'high'
                                ? '#fef3c7'
                                : '#dbeafe',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}
                      >
                        {selectedRequest.emergencyLevel}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e4e1da', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                    Request
                  </h4>
                  <p style={{ fontSize: '12px', color: '#666666', lineHeight: '1.5' }}>
                    {selectedRequest.reason}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #e4e1da', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                    Documents ({selectedRequest.supportingDocuments.length})
                  </h4>
                  <p style={{ fontSize: '12px', color: '#888888' }}>
                    Encrypted and access-logged
                  </p>
                </div>

                {selectedRequest.status === 'submitted' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      borderTop: '1px solid #e4e1da',
                      paddingTop: '12px',
                    }}
                  >
                    <textarea
                      placeholder="Add notes before approving/rejecting..."
                      id="notes"
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '12px',
                        border: '1px solid #e4e1da',
                        borderRadius: '4px',
                        minHeight: '80px',
                        fontFamily: 'inherit',
                      }}
                    />
                    <Button
                      onClick={() => {
                        const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value
                        handleApprove(selectedRequest.id, notes)
                      }}
                      disabled={actionLoading}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value
                        handleReject(selectedRequest.id, notes)
                      }}
                      disabled={actionLoading}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {accessLogs.length > 0 && (
                  <div style={{ borderTop: '1px solid #e4e1da', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                      Access Log ({accessLogs.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {accessLogs.slice(0, 5).map((log) => (
                        <p key={log.id} style={{ fontSize: '11px', color: '#888888' }}>
                          {log.action} by {log.userRole} on {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
