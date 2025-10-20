import React, { useState, useEffect } from 'react'
import { useAuth, authenticatedFetch } from '../contexts/AuthContext'
import { FormattedMessage } from 'react-intl'

interface Child {
  id: string
  parentId: string
  name?: string // Legacy field for backward compatibility
  firstName: string
  lastName: string
  birthday?: string // Date string (YYYY-MM-DD format)
  classId: string
  createdAt: string
  updatedAt: string
}

interface ParentChildRelationship {
  id: string
  parentId: string
  childId: string
  relationship: string
  createdAt: string
}

interface Class {
  id: string
  name: string
  description?: string
  color?: string
}

interface User {
  id: string
  email: string
  roles: string[]
}

interface ParentUser extends User {
  firstName?: string
  lastName?: string
}

interface ParentRelationshipEditorProps {
  childId: string
  currentParentIds: string[]
  allParents: ParentUser[]
  onSave: (childId: string, parentIds: string[]) => void
  onCancel: () => void
}

const ParentRelationshipEditor: React.FC<ParentRelationshipEditorProps> = ({
  childId,
  currentParentIds,
  allParents,
  onSave,
  onCancel
}) => {
  const [selectedParents, setSelectedParents] = useState<string[]>(currentParentIds)

  const handleToggleParent = (parentId: string) => {
    setSelectedParents(prev => 
      prev.includes(parentId) 
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    )
  }

  const handleSave = () => {
    onSave(childId, selectedParents)
  }

  const child = React.useMemo(() => {
    // We'll need to get child info from the parent component
    return null
  }, [childId])

  return (
    <div className="space-y-6">
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-medium text-white mb-4">
          Select Parents for Child
        </h4>
        <p className="text-gray-300 text-sm mb-4">
          Choose which parents should be associated with this child. A child can have multiple parents.
        </p>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {allParents.map(parent => (
            <div key={parent.id} className="flex items-center">
              <input
                type="checkbox"
                id={`parent-${parent.id}`}
                checked={selectedParents.includes(parent.id)}
                onChange={() => handleToggleParent(parent.id)}
                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor={`parent-${parent.id}`} className="ml-3 flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {parent.firstName && parent.lastName 
                        ? `${parent.firstName} ${parent.lastName}`
                        : 'Unnamed Parent'
                      }
                    </div>
                    <div className="text-xs text-gray-400">{parent.email}</div>
                  </div>
                  {currentParentIds.includes(parent.id) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>

        {selectedParents.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-400">Warning</h3>
                <p className="mt-1 text-sm text-yellow-300">
                  This child will have no parents assigned. Make sure this is intentional.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-600">
        <button
          onClick={handleSave}
          className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Update Parent Relationships
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-600 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-500 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>

      <div className="text-xs text-gray-400">
        Selected: {selectedParents.length} parent{selectedParents.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

const ChildrenManagement: React.FC = () => {
  const { user } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [parents, setParents] = useState<ParentUser[]>([])
  const [parentChildRelationships, setParentChildRelationships] = useState<ParentChildRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedParent, setSelectedParent] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [showParentEditor, setShowParentEditor] = useState<{ childId: string; currentParents: string[] } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    classId: '',
    parentId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const baseUrl = window.location.origin
      
      // All users can fetch children, parents should see all classes for child creation
      const fetchPromises = [
        authenticatedFetch(`${baseUrl}/api/children`),
        fetch(`${baseUrl}/api/classes/public`) // Use public endpoint to see all classes
      ]
      
      // Only admins and class leads can fetch parent-child relationships
      if (user?.roles.includes('administrator') || user?.roles.includes('class_lead')) {
        fetchPromises.push(authenticatedFetch(`${baseUrl}/auth/parent-child-relationships`))
      }
      
      const responses = await Promise.all(fetchPromises)
      
      const [childrenRes, classesRes, relationshipsRes] = responses
      
      if (!childrenRes.ok) throw new Error('Failed to load children')
      if (!classesRes.ok) throw new Error('Failed to load classes')
      if (relationshipsRes && !relationshipsRes.ok) throw new Error('Failed to load parent-child relationships')
      
      setChildren(await childrenRes.json())
      setClasses(await classesRes.json())
      
      // Set relationships only if we fetched them
      if (relationshipsRes) {
        setParentChildRelationships(await relationshipsRes.json())
      } else {
        // For parent users, clear relationships as they don't need them
        setParentChildRelationships([])
      }

      // Load parents for admins and class leads
      if (user?.roles.includes('administrator') || user?.roles.includes('class_lead')) {
        try {
          const usersRes = await authenticatedFetch(`${baseUrl}/auth/users`)
          if (usersRes.ok) {
            const userData = await usersRes.json()
            const parentUsers = userData.filter((u: ParentUser) => u.roles.includes('parent'))
            setParents(parentUsers)
          }
        } catch (err) {
          console.warn('Could not load parent users:', err)
        }
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredChildren = children.filter(child => {
    const fullName = child.firstName && child.lastName 
      ? `${child.firstName} ${child.lastName}` 
      : child.name || ''
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = !selectedClass || child.classId === selectedClass
    const matchesParent = !selectedParent || child.parentId === selectedParent
    return matchesSearch && matchesClass && matchesParent
  })

  // Calculate statistics
  const totalChildren = children.length
  const childrenByClass = classes.map(cls => ({
    class: cls,
    count: children.filter(child => child.classId === cls.id).length
  }))
  const childrenWithBirthdays = children.filter(child => child.birthday).length

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId)
    return cls?.name || 'Unknown Class'
  }

  const getChildParents = (childId: string): ParentUser[] => {
    const childRelationships = parentChildRelationships.filter(rel => rel.childId === childId)
    return childRelationships.map(rel => parents.find(p => p.id === rel.parentId)).filter(Boolean) as ParentUser[]
  }

  const getParentName = (parentId: string) => {
    const parent = parents.find(p => p.id === parentId)
    if (!parent) return 'Unknown Parent'
    
    if (parent.firstName && parent.lastName) {
      return `${parent.firstName} ${parent.lastName}`
    }
    return parent.email || 'Unknown Parent'
  }

  const getParentEmail = (parentId: string) => {
    const parent = parents.find(p => p.id === parentId)
    return parent?.email || 'Unknown Parent'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      const baseUrl = window.location.origin
      
      if (editingChild) {
        const res = await authenticatedFetch(`${baseUrl}/api/children/${editingChild.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            birthday: formData.birthday || undefined,
            classId: formData.classId
          })
        })
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to update child')
        }
      } else {
        const res = await authenticatedFetch(`${baseUrl}/api/children`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            birthday: formData.birthday || undefined,
            classId: formData.classId,
            parentId: formData.parentId || undefined
          })
        })
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to create child')
        }
      }
      
      await loadData()
      resetForm()
    } catch (err: any) {
      console.error('Error saving child:', err)
      setError(err.message || 'Failed to save child')
    }
  }

  const handleEdit = (child: Child) => {
    setEditingChild(child)
    setFormData({
      firstName: child.firstName || '',
      lastName: child.lastName || '',
      birthday: child.birthday || '',
      classId: child.classId,
      parentId: child.parentId
    })
    setShowAddForm(true)
  }

  const handleDelete = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child?')) return
    
    try {
      setError(null)
      const baseUrl = window.location.origin
      const res = await authenticatedFetch(`${baseUrl}/api/children/${childId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete child')
      }
      await loadData()
    } catch (err: any) {
      console.error('Error deleting child:', err)
      setError(err.message || 'Failed to delete child')
    }
  }

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', birthday: '', classId: '', parentId: '' })
    setEditingChild(null)
    setShowAddForm(false)
  }

  const handleEditParents = (childId: string) => {
    const currentParents = getChildParents(childId).map(p => p.id)
    setShowParentEditor({ childId, currentParents })
  }

  const handleUpdateParentRelationships = async (childId: string, newParentIds: string[]) => {
    try {
      setError(null)
      const baseUrl = window.location.origin
      
      // Update parent-child relationships
      const res = await authenticatedFetch(`${baseUrl}/auth/children/${childId}/parents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentIds: newParentIds })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update parent relationships')
      }
      
      await loadData()
      setShowParentEditor(null)
    } catch (err: any) {
      console.error('Error updating parent relationships:', err)
      setError(err.message || 'Failed to update parent relationships')
    }
  }

  const canManageChild = (child: Child) => {
    if (user?.roles.includes('administrator')) return true
    if (user?.roles.includes('class_lead')) {
      // Class leads can manage children in their classes
      return true // TODO: Check if class lead has access to child's class
    }
    if (user?.roles.includes('parent')) {
      return child.parentId === user.id
    }
    return false
  }

  const canAddChild = () => {
    return user?.roles.includes('administrator') || 
           user?.roles.includes('class_lead') || 
           user?.roles.includes('parent')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading children...</div>
      </div>
    )
  }

  const isAdminView = user?.roles.includes('administrator') || user?.roles.includes('class_lead')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-white mb-2">
            <FormattedMessage id="childrenManagement.title" defaultMessage="Children Management" />
          </h1>
          <p className="text-gray-400">
            <FormattedMessage id="childrenManagement.subtitle" defaultMessage="Manage children and their class enrollments" />
          </p>
        </div>
        {canAddChild() && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <FormattedMessage id="childrenManagement.addChild" defaultMessage="Add Child" />
          </button>
        )}
      </div>

      {/* Statistics Dashboard - Admin/Class Lead View */}
      {isAdminView && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-blue-100 text-sm font-medium">Total Children</p>
                <p className="text-white text-3xl font-bold">{totalChildren}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 bg-opacity-30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-green-100 text-sm font-medium">Active Classes</p>
                <p className="text-white text-3xl font-bold">{classes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500 bg-opacity-30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-purple-100 text-sm font-medium">With Birthdays</p>
                <p className="text-white text-3xl font-bold">{childrenWithBirthdays}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-500 bg-opacity-30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-orange-100 text-sm font-medium">Parent Families</p>
                <p className="text-white text-3xl font-bold">{parents.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          <FormattedMessage id="childrenManagement.filters" defaultMessage="Filters & Search" />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="childrenManagement.search" defaultMessage="Search by name" />
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter child name..."
                className="w-full border border-gray-600 rounded-lg pl-10 pr-4 py-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="childrenManagement.filterByClass" defaultMessage="Filter by class" />
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">
                <FormattedMessage id="childrenManagement.allClasses" defaultMessage="All classes" />
              </option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {isAdminView && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FormattedMessage id="childrenManagement.filterByParent" defaultMessage="Filter by parent" />
              </label>
              <select
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">
                  <FormattedMessage id="childrenManagement.allParents" defaultMessage="All parents" />
                </option>
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.firstName && parent.lastName 
                      ? `${parent.firstName} ${parent.lastName} (${parent.email})`
                      : parent.email
                    }
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {(searchTerm || selectedClass || selectedParent) && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-300">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 text-blue-600 hover:text-blue-500"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedClass && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Class: {getClassName(selectedClass)}
                  <button
                    onClick={() => setSelectedClass('')}
                    className="ml-1 text-green-600 hover:text-green-500"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedParent && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Parent: {getParentName(selectedParent)}
                  <button
                    onClick={() => setSelectedParent('')}
                    className="ml-1 text-purple-600 hover:text-purple-500"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedClass('')
                  setSelectedParent('')
                }}
                className="text-xs text-gray-400 hover:text-gray-300 underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    {editingChild ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  {editingChild ? (
                    <FormattedMessage id="childrenManagement.editChild" defaultMessage="Edit Child" />
                  ) : (
                    <FormattedMessage id="childrenManagement.addNew" defaultMessage="Add New Child" />
                  )}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <FormattedMessage id="childrenManagement.firstName" defaultMessage="First Name" /> *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <FormattedMessage id="childrenManagement.lastName" defaultMessage="Last Name" /> *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <FormattedMessage id="childrenManagement.birthday" defaultMessage="Birthday" />
                    </label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                      className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Assignment Information Section */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Class Assignment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <FormattedMessage id="childrenManagement.class" defaultMessage="Class" /> *
                      </label>
                      <select
                        value={formData.classId}
                        onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                        required
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select a class</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Parent selection for admins and class leads */}
                    {isAdminView && !editingChild && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Parent *
                        </label>
                        <select
                          value={formData.parentId}
                          onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                          required
                          className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Select a parent</option>
                          {parents.map(parent => (
                            <option key={parent.id} value={parent.id}>
                              {parent.firstName && parent.lastName 
                                ? `${parent.firstName} ${parent.lastName} (${parent.email})`
                                : parent.email
                              }
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-600">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingChild ? 'Update Child' : 'Add Child'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-600 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-500 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Parent Relationship Editor Modal */}
      {showParentEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  Edit Parent Relationships
                </h3>
                <button
                  onClick={() => setShowParentEditor(null)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <ParentRelationshipEditor 
                childId={showParentEditor.childId}
                currentParentIds={showParentEditor.currentParents}
                allParents={parents}
                onSave={(childId, parentIds) => handleUpdateParentRelationships(childId, parentIds)}
                onCancel={() => setShowParentEditor(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Children List */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-750 border-b border-gray-600">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Children Registry
            </h3>
            <div className="text-sm text-gray-400">
              Showing {filteredChildren.length} of {children.length} children
            </div>
          </div>
        </div>

        {filteredChildren.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No children found</h3>
            <p className="text-gray-400">
              {searchTerm || selectedClass || selectedParent 
                ? 'No children match your current filters. Try adjusting your search criteria.' 
                : 'No children have been registered yet.'
              }
            </p>
            {canAddChild() && !searchTerm && !selectedClass && !selectedParent && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Child
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Child Name
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Birthday
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Class
                    </div>
                  </th>
                  {isAdminView && (
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Parent
                      </div>
                    </th>
                  )}
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Created
                    </div>
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredChildren.map(child => (
                  <tr key={child.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {child.firstName ? child.firstName[0].toUpperCase() : 'C'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {child.firstName && child.lastName 
                              ? `${child.firstName} ${child.lastName}` 
                              : child.name || 'Unnamed Child'
                            }
                          </div>
                          <div className="text-sm text-gray-400">ID: {child.id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {child.birthday ? (
                          <div>
                            <div>{new Date(child.birthday).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">
                              Age: {Math.floor((new Date().getTime() - new Date(child.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not set</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        classes.find(c => c.id === child.classId)?.color 
                          ? 'text-white' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                      style={{
                        backgroundColor: classes.find(c => c.id === child.classId)?.color || '#3B82F6'
                      }}>
                        {getClassName(child.classId)}
                      </span>
                    </td>
                    {isAdminView && (
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {(() => {
                            const childParents = getChildParents(child.id)
                            if (childParents.length === 0) {
                              return (
                                <div className="text-gray-500">No parents assigned</div>
                              )
                            }
                            if (childParents.length === 1) {
                              const parent = childParents[0]
                              return (
                                <div>
                                  <div className="font-medium text-white">
                                    {parent.firstName && parent.lastName 
                                      ? `${parent.firstName} ${parent.lastName}` 
                                      : parent.email
                                    }
                                  </div>
                                  <div className="text-gray-400">{parent.email}</div>
                                </div>
                              )
                            }
                            return (
                              <div>
                                <div className="font-medium text-white">
                                  {childParents.length} parents
                                </div>
                                <div className="text-gray-400 space-y-1">
                                  {childParents.map((parent) => (
                                    <div key={parent.id} className="text-xs">
                                      {parent.firstName && parent.lastName 
                                        ? `${parent.firstName} ${parent.lastName}` 
                                        : parent.email
                                      }
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div>
                        <div>{new Date(child.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(child.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {canManageChild(child) ? (
                        <div className="flex justify-center gap-1 flex-wrap">
                          <button
                            onClick={() => handleEdit(child)}
                            className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          {isAdminView && (
                            <button
                              onClick={() => handleEditParents(child.id)}
                              className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                              title="Edit parent relationships"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Parents
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No access</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enhanced Summary */}
      {isAdminView && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Class Distribution
            </h4>
            <div className="space-y-3">
              {childrenByClass.map(({ class: cls, count }) => (
                <div key={cls.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cls.color || '#3B82F6' }}
                    ></div>
                    <span className="text-sm text-gray-300">{cls.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{count} children</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Registrations
            </h4>
            <div className="space-y-3">
              {children
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map(child => (
                  <div key={child.id} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {child.firstName && child.lastName 
                          ? `${child.firstName} ${child.lastName}` 
                          : child.name || 'Unnamed Child'
                        }
                      </div>
                      <div className="text-xs text-gray-400">{getClassName(child.classId)}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(child.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Summary */}
      <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-700 pt-4">
        {filteredChildren.length === totalChildren ? (
          `Displaying all ${totalChildren} children`
        ) : (
          `Showing ${filteredChildren.length} of ${totalChildren} children`
        )}
        {(searchTerm || selectedClass || selectedParent) && (
          <span> • Filters active</span>
        )}
      </div>
    </div>
  )
}

export default ChildrenManagement