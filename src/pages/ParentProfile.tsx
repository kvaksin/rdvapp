import React, { useState, useEffect } from 'react'
import { useAuth, authenticatedFetch } from '../contexts/AuthContext'
import { FormattedMessage, useIntl } from 'react-intl'

interface Child {
  id: string
  name: string
  parentId: string
  classId: string
  createdAt: string
}

interface Class {
  id: string
  name: string
  description?: string
  color?: string
}

interface ClassAssignmentRequest {
  id: string
  userId: string
  classId: string
  reason: string
  childName?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

interface UserProfile {
  id: string
  email: string
  phone?: string
  roles: string[]
  classAssignments: Array<{
    id: string
    classId: string
    childName?: string
    createdAt: string
  }>
  status: string
  createdAt: string
}

const ParentProfile: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const intl = useIntl()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [requests, setRequests] = useState<ClassAssignmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit profile state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    email: '',
    phone: ''
  })
  
  // Class request state
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    classId: '',
    reason: '',
    childName: ''
  })

  useEffect(() => {
    if (user && !authLoading) {
      loadProfileData()
    }
  }, [user, authLoading])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const baseUrl = window.location.origin
      
      const [profileRes, childrenRes, classesRes] = await Promise.all([
        authenticatedFetch(`${baseUrl}/auth/profile`),
        authenticatedFetch(`${baseUrl}/api/children`),
        authenticatedFetch(`${baseUrl}/api/classes/public`)
      ])
      
      if (!profileRes.ok) throw new Error('Failed to load profile')
      if (!childrenRes.ok) throw new Error('Failed to load children')
      if (!classesRes.ok) throw new Error('Failed to load classes')
      
      const [profileData, childrenData, classesData] = await Promise.all([
        profileRes.json(),
        childrenRes.json(),
        classesRes.json()
      ])
      
      setProfile(profileData.user)
      setChildren(childrenData)
      setClasses(classesData)
      
      // Try to load requests (may not be available)
      try {
        const requestsRes = await authenticatedFetch(`${baseUrl}/auth/class-assignment-requests`)
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json()
          setRequests(requestsData)
        }
      } catch (err) {
        console.warn('Could not load class assignment requests:', err)
      }
      
      // Initialize edit form
      setEditForm({
        email: profileData.user.email || '',
        phone: profileData.user.phone || ''
      })
      
    } catch (err: any) {
      console.error('Error loading profile data:', err)
      setError(err.message || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError(null)
      const baseUrl = window.location.origin
      
      const response = await authenticatedFetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: editForm.phone
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }
      
      await loadProfileData()
      setIsEditing(false)
      
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    }
  }

  const handleClassRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError(null)
      const baseUrl = window.location.origin
      
      const response = await authenticatedFetch(`${baseUrl}/auth/request-class-assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: requestForm.classId,
          reason: requestForm.reason,
          childName: requestForm.childName || undefined
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit class request')
      }
      
      // Reload requests
      await loadProfileData()
      setShowRequestForm(false)
      setRequestForm({ classId: '', reason: '', childName: '' })
      
      // Show success message
      alert(intl.formatMessage({ 
        id: 'profile.classRequest.success', 
        defaultMessage: 'Class assignment request submitted successfully!' 
      }))
      
    } catch (err: any) {
      console.error('Error submitting class request:', err)
      setError(err.message || 'Failed to submit class request')
    }
  }

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId)
    return cls?.name || 'Unknown Class'
  }

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">
          <FormattedMessage id="profile.loading" defaultMessage="Loading profile..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-gray-600">
          <FormattedMessage id="profile.notFound" defaultMessage="Profile not found" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          <FormattedMessage id="profile.title" defaultMessage="My Profile" />
        </h1>
        <p className="text-gray-600">
          <FormattedMessage id="profile.subtitle" defaultMessage="Manage your profile information and class assignments" />
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">
              <FormattedMessage id="profile.personalInfo" defaultMessage="Personal Information" />
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isEditing ? (
                <FormattedMessage id="profile.cancel" defaultMessage="Cancel" />
              ) : (
                <FormattedMessage id="profile.edit" defaultMessage="Edit" />
              )}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FormattedMessage id="profile.email" defaultMessage="Email" />
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  <FormattedMessage id="profile.emailNotEditable" defaultMessage="Email cannot be changed" />
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FormattedMessage id="profile.phone" defaultMessage="Phone" />
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FormattedMessage id="profile.save" defaultMessage="Save" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  <FormattedMessage id="profile.cancel" defaultMessage="Cancel" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <FormattedMessage id="profile.email" defaultMessage="Email" />
                </label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <FormattedMessage id="profile.phone" defaultMessage="Phone" />
                </label>
                <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <FormattedMessage id="profile.roles" defaultMessage="Roles" />
                </label>
                <p className="text-gray-900">{profile.roles.join(', ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <FormattedMessage id="profile.status" defaultMessage="Status" />
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {profile.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* My Children */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">
              <FormattedMessage id="profile.myChildren" defaultMessage="My Children" />
            </h2>
            <button
              onClick={() => window.location.href = '/children-management'}
              className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
            >
              <FormattedMessage id="profile.manageChildren" defaultMessage="Manage" />
            </button>
          </div>

          {children.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              <FormattedMessage id="profile.noChildren" defaultMessage="No children registered" />
            </p>
          ) : (
            <div className="space-y-3">
              {children.map(child => (
                <div key={child.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{child.name}</p>
                    <p className="text-sm text-gray-600">{getClassName(child.classId)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Class Assignments */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-4">
          <FormattedMessage id="profile.currentAssignments" defaultMessage="Current Class Assignments" />
        </h2>
        
        {profile.classAssignments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            <FormattedMessage id="profile.noAssignments" defaultMessage="No class assignments" />
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.classAssignments.map(assignment => (
              <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900">{getClassName(assignment.classId)}</h3>
                {assignment.childName && (
                  <p className="text-sm text-gray-600">Child: {assignment.childName}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Assigned: {new Date(assignment.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Class Assignment Requests */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">
            <FormattedMessage id="profile.classRequests" defaultMessage="Class Assignment Requests" />
          </h2>
          <button
            onClick={() => setShowRequestForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FormattedMessage id="profile.newRequest" defaultMessage="New Request" />
          </button>
        </div>

        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            <FormattedMessage id="profile.noRequests" defaultMessage="No class assignment requests" />
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{getClassName(request.classId)}</h3>
                    {request.childName && (
                      <p className="text-sm text-gray-600">Child: {request.childName}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Reason: {request.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRequestStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Class Request Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">
              <FormattedMessage id="profile.requestClassAssignment" defaultMessage="Request Class Assignment" />
            </h3>
            
            <form onSubmit={handleClassRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FormattedMessage id="profile.selectClass" defaultMessage="Select Class" />
                </label>
                <select
                  value={requestForm.classId}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, classId: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FormattedMessage id="profile.childName" defaultMessage="Child Name (Optional)" />
                </label>
                <input
                  type="text"
                  value={requestForm.childName}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, childName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FormattedMessage id="profile.reason" defaultMessage="Reason for Request" />
                </label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FormattedMessage id="profile.submitRequest" defaultMessage="Submit Request" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  <FormattedMessage id="profile.cancel" defaultMessage="Cancel" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentProfile