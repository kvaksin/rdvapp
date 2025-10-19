import React, { useState, useEffect } from 'react'
import { FormattedMessage, FormattedDate, useIntl } from 'react-intl'
import { authenticatedFetch } from '../contexts/AuthContext'

interface ClassAssignmentRequest {
  id: string
  userId: string
  classId: string
  userEmail: string
  className: string
  classColor: string
  reason: string
  childName?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  rejectionReason?: string
}

const ClassAssignmentRequests: React.FC = () => {
  const intl = useIntl()
  const [requests, setRequests] = useState<ClassAssignmentRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 ClassAssignmentRequests: Fetching requests...')
      console.log('🌐 ClassAssignmentRequests: Calling URL:', '/auth/class-assignment-requests')
      console.log('🌐 ClassAssignmentRequests: Full URL will be:', window.location.origin + '/auth/class-assignment-requests')
      
      // Check authentication token
      const token = localStorage.getItem('auth_token')
      console.log('🔑 ClassAssignmentRequests: Auth token exists:', !!token)
      console.log('🔑 ClassAssignmentRequests: Token preview:', token ? token.substring(0, 30) + '...' : 'No token')
      
      // Check current user
      const userStr = localStorage.getItem('auth_user')
      const user = userStr ? JSON.parse(userStr) : null
      console.log('👤 ClassAssignmentRequests: Current user:', user)
      console.log('👤 ClassAssignmentRequests: User roles:', user?.roles)
      
      const response = await authenticatedFetch('/auth/class-assignment-requests')
      
      console.log('📡 ClassAssignmentRequests: Response status:', response.status)
      console.log('📡 ClassAssignmentRequests: Response headers:', response.headers)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 ClassAssignmentRequests: Received data:', data)
        console.log('📊 ClassAssignmentRequests: Data length:', data.length)
        console.log('📊 ClassAssignmentRequests: Data type:', typeof data)
        console.log('📊 ClassAssignmentRequests: Is array?', Array.isArray(data))
        console.log('🔥 ClassAssignmentRequests: Setting requests state with:', data)
        setRequests(data)
      } else {
        const errorText = await response.text()
        console.error('❌ ClassAssignmentRequests: API error:', response.status, errorText)
        throw new Error('Failed to fetch class assignment requests')
      }
    } catch (err) {
      console.error('💥 ClassAssignmentRequests: Error fetching requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  // Add debugging for requests state changes
  React.useEffect(() => {
    console.log('🎯 ClassAssignmentRequests: requests state changed:', requests)
    console.log('📏 ClassAssignmentRequests: requests.length:', requests.length)
  }, [requests])

  const handleApprove = async (requestId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await authenticatedFetch(`/auth/approve-class-assignment/${requestId}`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchRequests() // Refresh the list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve request')
      }
    } catch (err) {
      console.error('Error approving request:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve request')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt(intl.formatMessage({
      id: 'admin.classRequests.rejectionReasonPrompt',
      defaultMessage: 'Rejection reason (optional):'
    }))

    if (reason === null) return // User cancelled

    try {
      setLoading(true)
      setError(null)
      const response = await authenticatedFetch(`/auth/reject-class-assignment/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || '' })
      })

      if (response.ok) {
        await fetchRequests() // Refresh the list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject request')
      }
    } catch (err) {
      console.error('Error rejecting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to reject request')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'approved': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const pendingRequests = requests.filter(req => req.status === 'pending')
  const processedRequests = requests.filter(req => req.status !== 'pending')

  // Add debugging for filtered requests
  console.log('🚥 ClassAssignmentRequests: pendingRequests.length:', pendingRequests.length)
  console.log('🚥 ClassAssignmentRequests: processedRequests.length:', processedRequests.length)
  console.log('🚥 ClassAssignmentRequests: pendingRequests:', pendingRequests)

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-300">
          <FormattedMessage id="admin.classRequests.title" defaultMessage="Class Assignment Requests" />
          {pendingRequests.length > 0 && (
            <span className="bg-yellow-600 text-white text-sm px-2 py-1 rounded-full ml-2">
              {pendingRequests.length}
            </span>
          )}
        </h3>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            loading 
              ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-400' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <FormattedMessage id="common.loading" defaultMessage="Loading..." />
            </div>
          ) : (
            <FormattedMessage id="admin.refreshRequests" defaultMessage="Refresh" />
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <FormattedMessage id="admin.loadingRequests" defaultMessage="Loading requests..." />
        </div>
      ) : pendingRequests.length === 0 && processedRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-4">📝</div>
          <h4 className="text-lg font-medium mb-2">
            <FormattedMessage id="admin.classRequests.noRequests" defaultMessage="No pending class assignment requests" />
          </h4>
          <p className="text-gray-500">
            <FormattedMessage 
              id="admin.classRequests.description" 
              defaultMessage="Review and approve class assignment change requests"
            />
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-yellow-300 mb-3 flex items-center gap-2">
                <span>⏳</span>
                <FormattedMessage id="admin.classRequests.pending" defaultMessage="Pending Requests" />
                <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </h4>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: request.classColor }}
                          />
                          <div>
                            <h5 className="text-white font-medium">{request.userEmail}</h5>
                            <p className="text-sm text-gray-300">
                              <FormattedMessage 
                                id="admin.classRequests.requestedClass" 
                                defaultMessage="Requested class" 
                              />: <span className="text-purple-300">{request.className}</span>
                            </p>
                          </div>
                        </div>
                        
                        {request.childName && (
                          <div className="text-sm text-purple-300 mb-2">
                            👶 {request.childName}
                          </div>
                        )}
                        
                        {request.reason && (
                          <div className="text-sm text-gray-300 mb-3">
                            <span className="text-gray-400">💭 </span>
                            <FormattedMessage id="admin.classRequests.reason" defaultMessage="Reason" />: {request.reason}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400">
                          <FormattedMessage 
                            id="admin.classRequests.requestedBy" 
                            defaultMessage="Requested by"
                          /> {request.userEmail} • <FormattedDate 
                            value={new Date(request.createdAt)}
                            year="numeric"
                            month="short"
                            day="numeric"
                            hour="2-digit"
                            minute="2-digit"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:w-32">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            loading 
                              ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-400' 
                              : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 shadow-lg hover:shadow-green-500/25'
                          }`}
                        >
                          ✅ <FormattedMessage id="admin.classRequests.approve" defaultMessage="Approve Request" />
                        </button>
                        
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            loading 
                              ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-400' 
                              : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 shadow-lg hover:shadow-red-500/25'
                          }`}
                        >
                          ❌ <FormattedMessage id="admin.classRequests.reject" defaultMessage="Reject Request" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed Requests */}
          {processedRequests.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-3 flex items-center gap-2">
                <span>📋</span>
                <FormattedMessage id="admin.classRequests.processed" defaultMessage="Recent Processed Requests" />
              </h4>
              <div className="space-y-3">
                {processedRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: request.classColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm truncate">{request.userEmail}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-purple-300 text-sm truncate">{request.className}</span>
                          </div>
                          {request.status === 'rejected' && request.rejectionReason && (
                            <div className="text-xs text-red-300 mt-1 truncate">
                              {request.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        <FormattedMessage 
                          id={`admin.classRequests.status.${request.status}`} 
                          defaultMessage={request.status}
                        />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ClassAssignmentRequests