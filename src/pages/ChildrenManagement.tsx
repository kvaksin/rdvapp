import React, { useState, useEffect } from 'react'
import { useAuth, authenticatedFetch } from '../contexts/AuthContext'

interface Child {
  id: string
  parentId: string
  name: string
  classId: string
  createdAt: string
  updatedAt: string
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

const ChildrenManagement: React.FC = () => {
  const { user } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [parents, setParents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
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
      
      const [childrenRes, classesRes] = await Promise.all([
        authenticatedFetch(`${baseUrl}/api/children`),
        authenticatedFetch(`${baseUrl}/api/classes`)
      ])
      
      if (!childrenRes.ok) throw new Error('Failed to load children')
      if (!classesRes.ok) throw new Error('Failed to load classes')
      
      setChildren(await childrenRes.json())
      setClasses(await classesRes.json())

      // Load parents for admins and class leads
      if (user?.roles.includes('administrator') || user?.roles.includes('class_lead')) {
        try {
          const usersRes = await authenticatedFetch(`${baseUrl}/auth/users`)
          if (usersRes.ok) {
            const userData = await usersRes.json()
            const parentUsers = userData.filter((u: User) => u.roles.includes('parent'))
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
    const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = !selectedClass || child.classId === selectedClass
    return matchesSearch && matchesClass
  })

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId)
    return cls?.name || 'Unknown Class'
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
            name: formData.name,
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
            name: formData.name,
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
      name: child.name,
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
    setFormData({ name: '', classId: '', parentId: '' })
    setEditingChild(null)
    setShowAddForm(false)
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
        <div className="text-gray-600">Loading children...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Children Management</h1>
          <p className="text-gray-600">Manage children and their class enrollments</p>
        </div>
        {canAddChild() && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Child
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by name
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter child name..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingChild ? 'Edit Child' : 'Add New Child'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Parent selection for admins and class leads */}
            {(user?.roles.includes('administrator') || user?.roles.includes('class_lead')) && !editingChild && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent *
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a parent</option>
                  {parents.map(parent => (
                    <option key={parent.id} value={parent.id}>{parent.email}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingChild ? 'Update Child' : 'Add Child'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Children List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredChildren.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || selectedClass ? 'No children match your filters' : 'No children found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Class</th>
                  {(user?.roles.includes('administrator') || user?.roles.includes('class_lead')) && (
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Parent</th>
                  )}
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Created</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredChildren.map(child => (
                  <tr key={child.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{child.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getClassName(child.classId)}
                      </span>
                    </td>
                    {(user?.roles.includes('administrator') || user?.roles.includes('class_lead')) && (
                      <td className="px-6 py-4 text-sm text-gray-600">{getParentEmail(child.parentId)}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(child.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {canManageChild(child) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(child)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-600">
        Showing {filteredChildren.length} of {children.length} children
      </div>
    </div>
  )
}

export default ChildrenManagement