import React, { useState, useEffect } from 'react'
import { FormattedMessage, FormattedDate, useIntl } from 'react-intl'
import { authenticatedFetch, useAuth } from '../contexts/AuthContext'
import { fetchClasses } from '../api/client'
import type { Class } from '../types/api'

interface User {
  id: string
  email: string
  phone?: string
  createdAt: string
  isActive: boolean
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  roles: string[]
  classAssignments: Array<{
    id: string
    classId: string
    childName?: string
    createdAt: string
  }>
}

const UserManagement: React.FC = () => {
  const intl = useIntl()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Helper function to check if current user is admin
  const isAdmin = currentUser?.roles?.includes('administrator') || false
  const isClassLead = currentUser?.roles?.includes('class_lead') || false

  // Get class info by ID
  const getClassInfo = (classId: string) => {
    return classes.find(cls => cls.id === classId)
  }

  // Check if current user can manage this user
  const canManageUser = (user: User) => {
    if (isAdmin) return true // Admins can manage all users
    if (isClassLead) {
      // Class leads can only manage parents
      return user.roles.includes('parent')
    }
    return false
  }

  // Filter users based on current user permissions
  const getManageableUsers = (allUsers: User[]) => {
    if (isAdmin) return allUsers
    if (isClassLead) {
      // Class leads can only see and manage parents
      return allUsers.filter(user => user.roles.includes('parent'))
    }
    return []
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await authenticatedFetch('/auth/users')
      if (response.ok) {
        const data = await response.json()
        const manageableUsers = getManageableUsers(data)
        setUsers(manageableUsers)
        setFilteredUsers(manageableUsers)
      } else {
        throw new Error('Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchClassesData = async () => {
    try {
      const classesData = await fetchClasses()
      setClasses(classesData)
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.phone && user.phone.includes(searchTerm))
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter)
      
      return matchesSearch && matchesStatus && matchesRole
    })
    
    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, roleFilter])

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const selectAllUsers = () => {
    setSelectedUsers(new Set(filteredUsers.filter(user => canManageUser(user)).map(user => user.id)))
  }

  const clearAllSelections = () => {
    setSelectedUsers(new Set())
  }

  const deactivateUser = async (userId: string) => {
    if (!window.confirm(intl.formatMessage({ id: 'userManagement.deactivate.confirm' }))) {
      return
    }

    try {
      const response = await authenticatedFetch(`/auth/users/${userId}/deactivate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchUsers()
        alert(intl.formatMessage({ id: 'userManagement.deactivate.success' }))
      } else {
        throw new Error('Failed to deactivate user')
      }
    } catch (error) {
      console.error('Error deactivating user:', error)
      setError(error instanceof Error ? error.message : 'Failed to deactivate user')
    }
  }

  const reactivateUser = async (userId: string) => {
    try {
      const response = await authenticatedFetch(`/auth/users/${userId}/reactivate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchUsers()
        alert(intl.formatMessage({ id: 'userManagement.reactivate.success' }))
      } else {
        throw new Error('Failed to reactivate user')
      }
    } catch (error) {
      console.error('Error reactivating user:', error)
      setError(error instanceof Error ? error.message : 'Failed to reactivate user')
    }
  }

  const bulkDeactivateUsers = async () => {
    const userIds = Array.from(selectedUsers)
    if (userIds.length === 0) return

    if (!window.confirm(intl.formatMessage(
      { id: 'userManagement.bulkDeactivate.confirm' },
      { count: userIds.length }
    ))) {
      return
    }

    try {
      setLoading(true)
      const response = await authenticatedFetch('/auth/users/bulk-deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      })

      if (response.ok) {
        setSelectedUsers(new Set())
        await fetchUsers()
        alert(intl.formatMessage(
          { id: 'userManagement.bulkDeactivate.success' },
          { count: userIds.length }
        ))
      } else {
        throw new Error('Failed to deactivate users')
      }
    } catch (error) {
      console.error('Error deactivating users:', error)
      setError(error instanceof Error ? error.message : 'Failed to deactivate users')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (user: User) => {
    if (!canManageUser(user)) return
    setEditingUser({ ...user })
    setShowEditModal(true)
  }

  const saveUser = async () => {
    if (!editingUser) return

    try {
      const response = await authenticatedFetch(`/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingUser.email,
          phone: editingUser.phone,
          isActive: editingUser.isActive
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingUser(null)
        await fetchUsers()
        alert(intl.formatMessage({ id: 'userManagement.update.success' }))
      } else {
        throw new Error('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setError(error instanceof Error ? error.message : 'Failed to update user')
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchClassesData()
  }, [])

  if (!isAdmin && !isClassLead) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-medium mb-2 text-red-400">
          <FormattedMessage id="userManagement.accessDenied" defaultMessage="Access Denied" />
        </h3>
        <p className="text-gray-400">
          <FormattedMessage 
            id="userManagement.accessDeniedDescription" 
            defaultMessage="You don't have permission to access user management."
          />
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span>👥</span>
          <FormattedMessage id="userManagement.title" defaultMessage="User Management" />
        </h1>
        <p className="text-gray-400">
          <FormattedMessage 
            id="userManagement.description" 
            defaultMessage="Manage and monitor user accounts, permissions, and activities"
          />
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="userManagement.search" defaultMessage="Search Users" />
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={intl.formatMessage({ id: 'userManagement.searchPlaceholder' })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="userManagement.statusFilter" defaultMessage="Status" />
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">
                {intl.formatMessage({ id: 'userManagement.statusFilter.all' })}
              </option>
              <option value="pending">
                {intl.formatMessage({ id: 'userManagement.statusFilter.pending' })}
              </option>
              <option value="approved">
                {intl.formatMessage({ id: 'userManagement.statusFilter.approved' })}
              </option>
              <option value="rejected">
                {intl.formatMessage({ id: 'userManagement.statusFilter.rejected' })}
              </option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="userManagement.roleFilter" defaultMessage="Role" />
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">
                {intl.formatMessage({ id: 'userManagement.roleFilter.all' })}
              </option>
              <option value="parent">
                {intl.formatMessage({ id: 'userManagement.roleFilter.parent' })}
              </option>
              {isAdmin && (
                <>
                  <option value="class_lead">
                    {intl.formatMessage({ id: 'userManagement.roleFilter.classLead' })}
                  </option>
                  <option value="administrator">
                    {intl.formatMessage({ id: 'userManagement.roleFilter.administrator' })}
                  </option>
                </>
              )}
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-end">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FormattedMessage id="userManagement.refresh" defaultMessage="Refresh" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-blue-300">
                <FormattedMessage 
                  id="userManagement.selected" 
                  defaultMessage="{count, plural, one {# user selected} other {# users selected}}"
                  values={{ count: selectedUsers.size }}
                />
              </span>
              <button
                onClick={clearAllSelections}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                <FormattedMessage id="userManagement.clearSelection" defaultMessage="Clear Selection" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={bulkDeactivateUsers}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                <FormattedMessage 
                  id="userManagement.bulkDeactivate" 
                  defaultMessage="Deactivate Selected ({count})"
                  values={{ count: selectedUsers.size }}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-purple-300 flex items-center gap-2">
              <FormattedMessage id="userManagement.usersList" defaultMessage="Users List" />
              {filteredUsers.length > 0 && (
                <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded-full">
                  {filteredUsers.length}
                </span>
              )}
            </h2>
            {filteredUsers.length > 0 && (
              <button
                onClick={selectAllUsers}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                <FormattedMessage id="userManagement.selectAll" defaultMessage="Select All" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <FormattedMessage id="userManagement.loading" defaultMessage="Loading users..." />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-xl font-medium mb-2">
                <FormattedMessage id="userManagement.noUsers" defaultMessage="No users found" />
              </h3>
              <p className="text-gray-500">
                <FormattedMessage 
                  id="userManagement.noUsersDescription" 
                  defaultMessage="No users match the current filter criteria."
                />
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size > 0 && selectedUsers.size === filteredUsers.filter(user => canManageUser(user)).length}
                      onChange={selectedUsers.size > 0 ? clearAllSelections : selectAllUsers}
                      className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <FormattedMessage id="userManagement.table.user" defaultMessage="User" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <FormattedMessage id="userManagement.table.role" defaultMessage="Role" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <FormattedMessage id="userManagement.table.status" defaultMessage="Status" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <FormattedMessage id="userManagement.table.created" defaultMessage="Created" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <FormattedMessage id="userManagement.table.actions" defaultMessage="Actions" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      {canManageUser(user) && (
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.roles.join(', ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : user.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                      {!user.isActive && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <FormattedDate 
                        value={new Date(user.createdAt)}
                        year="numeric"
                        month="short"
                        day="numeric"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {canManageUser(user) && (
                          <>
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-purple-400 hover:text-purple-300 text-sm"
                            >
                              <FormattedMessage id="userManagement.edit" defaultMessage="Edit" />
                            </button>
                            {user.isActive ? (
                              <button
                                onClick={() => deactivateUser(user.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                <FormattedMessage id="userManagement.deactivate" defaultMessage="Deactivate" />
                              </button>
                            ) : (
                              <button
                                onClick={() => reactivateUser(user.id)}
                                className="text-green-400 hover:text-green-300 text-sm"
                              >
                                <FormattedMessage id="userManagement.reactivate" defaultMessage="Reactivate" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              <FormattedMessage id="userManagement.editUser" defaultMessage="Edit User" />
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FormattedMessage id="userManagement.email" defaultMessage="Email" />
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FormattedMessage id="userManagement.phone" defaultMessage="Phone" />
                </label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingUser.isActive}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500 mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  <FormattedMessage id="userManagement.active" defaultMessage="Active" />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveUser}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors"
              >
                <FormattedMessage id="userManagement.save" defaultMessage="Save" />
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm font-medium transition-colors"
              >
                <FormattedMessage id="userManagement.cancel" defaultMessage="Cancel" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
