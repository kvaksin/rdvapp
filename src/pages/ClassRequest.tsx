import React, { useState, useEffect } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { authenticatedFetch, useAuth } from '../contexts/AuthContext'
import type { Class } from '../types/api'

interface ClassAssignmentRequest {
  id: string
  userId: string
  classId: string
  reason: string
  childName?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  className?: string
  classColor?: string
  rejectionReason?: string
}

const ClassRequest: React.FC = () => {
  const intl = useIntl()
  const { user } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [reason, setReason] = useState('')
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userRequests, setUserRequests] = useState<ClassAssignmentRequest[]>([])

  // Check if user has parent role
  const isParent = user?.roles?.includes('parent') || false
  const isClassLead = user?.roles?.includes('class_lead') || false

  useEffect(() => {
    loadData()
  }, [])

  // Fetch available classes
  const fetchClasses = async (): Promise<Class[]> => {
    try {
      const response = await authenticatedFetch('/api/classes/public')
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching classes:', error)
      throw error
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [classesData, requestsData] = await Promise.all([
        fetchClasses(),
        fetchUserRequests()
      ])
      setClasses(classesData)
      setUserRequests(requestsData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRequests = async () => {
    try {
      const response = await authenticatedFetch('/auth/class-assignment-requests')
      if (response.ok) {
        const allRequests = await response.json()
        // Filter to show only current user's requests
        return allRequests.filter((req: ClassAssignmentRequest) => req.userId === user?.id)
      }
      return []
    } catch (err) {
      console.error('Error fetching user requests:', err)
      return []
    }
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClassId) {
      setError('Please select a class')
      return
    }

    // For parents, child name is required
    if (isParent && !childName.trim()) {
      setError('Child name is required for parent requests')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await authenticatedFetch('/auth/request-class-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClassId,
          reason: reason.trim(),
          childName: isParent ? childName.trim() : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      setSuccess('Class assignment request submitted successfully!')
      setSelectedClassId('')
      setReason('')
      setChildName('')
      
      // Refresh user requests
      await loadData()
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request')
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

  const getCurrentClassAssignment = () => {
    if (!user?.classAssignments?.length) return null
    return user.classAssignments[0] // Assuming one class per user
  }

  const currentAssignment = getCurrentClassAssignment()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span>🏫</span>
          <FormattedMessage id="admin.classRequests.title" defaultMessage="Class Assignment Requests" />
        </h1>
        <p className="text-gray-400">
          <FormattedMessage 
            id="classRequest.description" 
            defaultMessage="Request a new class assignment or change your current assignment"
          />
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Current Assignment */}
      {currentAssignment && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-purple-300 mb-4">
            <FormattedMessage id="classRequest.currentAssignment" defaultMessage="Current Assignment" />
          </h2>
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: classes.find(c => c.id === currentAssignment.classId)?.color || '#6B7280' }}
            />
            <span className="text-white font-medium">
              {classes.find(c => c.id === currentAssignment.classId)?.name || currentAssignment.classId || 'No class assigned'}
            </span>
            {currentAssignment.childName && (
              <span className="text-purple-300 text-sm">
                • {currentAssignment.childName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Request Form */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-purple-300 mb-6">
          <FormattedMessage id="classRequest.newRequest" defaultMessage="New Class Assignment Request" />
        </h2>

        <form onSubmit={handleSubmitRequest} className="space-y-6">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="classRequest.selectClass" defaultMessage="Select Class" />
              <span className="text-red-400 ml-1">*</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">
                {intl.formatMessage({ id: 'classRequest.chooseClass', defaultMessage: 'Choose a class...' })}
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.description && `- ${cls.description}`}
                </option>
              ))}
            </select>
          </div>

          {/* Child Name (for parents) */}
          {isParent && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FormattedMessage id="classRequest.childName" defaultMessage="Child's Name" />
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={intl.formatMessage({ id: 'classRequest.childNamePlaceholder', defaultMessage: 'Enter your child\'s name' })}
                required={isParent}
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="admin.classRequests.reason" defaultMessage="Reason" />
              <span className="text-gray-500 ml-1">
                (<FormattedMessage id="common.optional" defaultMessage="optional" />)
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder={intl.formatMessage({ id: 'classRequest.reasonPlaceholder', defaultMessage: 'Explain why you need this class assignment change...' })}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedClassId || (isParent && !childName.trim())}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              loading || !selectedClassId || (isParent && !childName.trim())
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <FormattedMessage id="common.submitting" defaultMessage="Submitting..." />
              </div>
            ) : (
              <FormattedMessage id="classRequest.submitRequest" defaultMessage="Submit Request" />
            )}
          </button>
        </form>
      </div>

      {/* User's Requests History */}
      {userRequests.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-purple-300 mb-4">
            <FormattedMessage id="classRequest.yourRequests" defaultMessage="Your Requests" />
          </h2>
          <div className="space-y-4">
            {userRequests.map((request) => (
              <div key={request.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: request.classColor || '#6B7280' }}
                      />
                      <span className="text-white font-medium">{request.className}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        <FormattedMessage 
                          id={`classRequest.status.${request.status}`} 
                          defaultMessage={request.status}
                        />
                      </span>
                    </div>
                    
                    {request.childName && (
                      <p className="text-sm text-purple-300 mb-1">
                        👶 {request.childName}
                      </p>
                    )}
                    
                    {request.reason && (
                      <p className="text-sm text-gray-300 mb-2">
                        💭 {request.reason}
                      </p>
                    )}
                    
                    {request.status === 'rejected' && request.rejectionReason && (
                      <p className="text-sm text-red-300 mb-2">
                        ❌ <FormattedMessage id="classRequest.rejectionReason" defaultMessage="Rejection reason" />: {request.rejectionReason}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      <FormattedMessage 
                        id="classRequest.submittedOn" 
                        defaultMessage="Submitted on {date}"
                        values={{ 
                          date: new Date(request.createdAt).toLocaleDateString() 
                        }}
                      />
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassRequest