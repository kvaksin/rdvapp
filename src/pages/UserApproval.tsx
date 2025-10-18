import React, { useState, useEffect } from 'react'
import { FormattedMessage, FormattedDate, useIntl } from 'react-intl'
import { authenticatedFetch, useAuth } from '../contexts/AuthContext'
import { fetchClasses } from '../api/client'
import type { Class } from '../types/api'

interface PendingUser {
  id: string
  email: string
  phone?: string
  createdAt: string
  roles: string[]
  classAssignments: Array<{
    id: string
    classId: string
    childName?: string
    createdAt: string
  }>
}

const UserApproval: React.FC = () => {
  const intl = useIntl()
  const { user: currentUser } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to get class info by ID
  const getClassInfo = (classId: string) => {
    return classes.find(cls => cls.id === classId)
  }

  // Helper function to check if current user is admin
  const isAdmin = currentUser?.roles?.includes('administrator') || false

  // Helper function to check if a user is a class lead
  const isClassLead = (user: PendingUser) => {
    return user.roles.includes('class_lead')
  }

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching pending users...')
      const response = await authenticatedFetch('/auth/pending-users')
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Received pending users:', data)
        setPendingUsers(data)
      } else {
        const errorText = await response.text()
        console.error('API error:', response.status, errorText)
        throw new Error(`Failed to fetch pending users: ${response.status} - ${errorText}`)
      }
    } catch (err) {
      console.error('Error fetching pending users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load pending users')
    } finally {
      setLoading(false)
    }
  }

  const fetchClassesData = async () => {
    try {
      console.log('Fetching classes...')
      const classesData = await fetchClasses()
      console.log('Received classes:', classesData)
      setClasses(classesData)
    } catch (err) {
      console.error('Error fetching classes:', err)
      // Don't set error for classes fetch as it's not critical
    }
  }

  const approveUser = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await authenticatedFetch(`/auth/approve/${userId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchPendingUsers() // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to approve user' }))
        if (response.status === 403 && errorData.details?.includes('Class lead approvals require administrator privileges')) {
          throw new Error('Only administrators can approve class leads')
        } else {
          throw new Error(errorData.error || 'Failed to approve user')
        }
      }
    } catch (err) {
      console.error('Error approving user:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve user')
    } finally {
      setLoading(false)
    }
  }

  const rejectUser = async (userId: string, reason?: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await authenticatedFetch(`/auth/reject/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      
      if (response.ok) {
        await fetchPendingUsers() // Refresh the list
      } else {
        throw new Error('Failed to reject user')
      }
    } catch (err) {
      console.error('Error rejecting user:', err)
      setError('Failed to reject user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassesData()
    fetchPendingUsers()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span>👥</span>
          <FormattedMessage id="userApproval.title" defaultMessage="User Approval Management" />
        </h1>
        <p className="text-gray-400">
          <FormattedMessage 
            id="userApproval.description" 
            defaultMessage="Review and approve or reject pending user registrations"
          />
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-purple-300 flex items-center gap-2">
              <FormattedMessage id="userApproval.pendingUsers" defaultMessage="Pending Users" />
              {pendingUsers.length > 0 && (
                <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => {
                fetchClassesData()
                fetchPendingUsers()
              }}
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
                <FormattedMessage id="admin.refreshUsers" defaultMessage="Refresh" />
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <FormattedMessage id="admin.loadingUsers" defaultMessage="Loading pending users..." />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-medium mb-2">
                <FormattedMessage id="admin.noPendingUsers" defaultMessage="No pending users to approve" />
              </h3>
              <p className="text-gray-500">
                <FormattedMessage 
                  id="userApproval.noPendingDescription" 
                  defaultMessage="All user registrations have been processed."
                />
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingUsers.map((user) => (
                <div key={user.id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{user.email}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {user.roles.map((role) => (
                              <span 
                                key={role}
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  role === 'administrator' ? 'bg-red-600 text-white' :
                                  role === 'class_lead' ? 'bg-yellow-600 text-white' :
                                  'bg-blue-600 text-white'
                                }`}
                              >
                                <FormattedMessage 
                                  id={`auth.role${role.charAt(0).toUpperCase()}${role.slice(1).replace('_', '')}`}
                                  defaultMessage={role}
                                />
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {user.phone && (
                          <div className="text-gray-300">
                            <span className="text-gray-400">📞 </span>
                            <FormattedMessage id="admin.phone" defaultMessage="Phone: {phone}" values={{ phone: user.phone }} />
                          </div>
                        )}
                        
                        <div className="text-gray-300">
                          <span className="text-gray-400">📅 </span>
                          <FormattedMessage 
                            id="admin.registeredOn" 
                            defaultMessage="Registered on {date}"
                            values={{
                              date: <FormattedDate 
                                value={new Date(user.createdAt)}
                                year="numeric"
                                month="short"
                                day="numeric"
                                hour="2-digit"
                                minute="2-digit"
                              />
                            }}
                          />
                        </div>

                        {user.classAssignments.length > 0 && (
                          <div className="md:col-span-2 text-gray-300">
                            <div className="text-gray-400 mb-2">
                              🏫 <FormattedMessage id="admin.classAssignments" defaultMessage="Class assignments:" />
                            </div>
                            <div className="ml-4 space-y-2">
                              {user.classAssignments.map((assignment) => {
                                const classInfo = getClassInfo(assignment.classId)
                                return (
                                  <div key={assignment.id} className="flex items-start gap-3 text-gray-300">
                                    <div 
                                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                                      style={{ backgroundColor: classInfo?.color || '#6B7280' }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-white">
                                        {classInfo?.name || assignment.classId}
                                      </div>
                                      {classInfo?.description && (
                                        <div className="text-sm text-gray-400 mt-1">
                                          {classInfo.description}
                                        </div>
                                      )}
                                      {assignment.childName && (
                                        <div className="text-sm text-purple-300 mt-1">
                                          👶 {assignment.childName}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 lg:flex-col">
                      {isClassLead(user) && !isAdmin && (
                        <div className="text-xs text-yellow-400 mb-2 text-center">
                          <FormattedMessage 
                            id="userApproval.classLeadAdminOnly" 
                            defaultMessage="Only administrators can approve class leads"
                          />
                        </div>
                      )}
                      
                      <button
                        onClick={() => approveUser(user.id)}
                        disabled={loading || (isClassLead(user) && !isAdmin)}
                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          loading || (isClassLead(user) && !isAdmin)
                            ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-400' 
                            : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 shadow-lg hover:shadow-green-500/25'
                        }`}
                        title={isClassLead(user) && !isAdmin ? intl.formatMessage({
                          id: 'userApproval.classLeadAdminOnlyTooltip',
                          defaultMessage: 'Only administrators can approve class leads'
                        }) : undefined}
                      >
                        ✅ <FormattedMessage id="admin.approve" defaultMessage="Approve" />
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt(intl.formatMessage({
                            id: 'userApproval.rejectionReasonPrompt',
                            defaultMessage: 'Rejection reason (optional):'
                          }))
                          if (reason !== null) { // null means cancelled
                            rejectUser(user.id, reason || undefined)
                          }
                        }}
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          loading 
                            ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-400' 
                            : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 shadow-lg hover:shadow-red-500/25'
                        }`}
                      >
                        ❌ <FormattedMessage id="admin.reject" defaultMessage="Reject" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-blue-400 text-lg">💡</div>
            <div className="text-blue-300 text-sm">
              <FormattedMessage 
                id="userApproval.helpText" 
                defaultMessage="Review user details carefully before approval. Approved users will receive email notification and can immediately access the system."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserApproval