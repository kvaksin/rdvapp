import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'
import { getClasses } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'data')

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// Data file helpers
const readJsonFile = (filename) => {
  const filePath = path.join(dataDir, filename)
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.log(`Creating new ${filename}`)
    return []
  }
}

const writeJsonFile = (filename, data) => {
  const filePath = path.join(dataDir, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// User management
export const getUsers = () => readJsonFile('users.json')
export const saveUsers = (users) => writeJsonFile('users.json', users)

export const getUserRoles = () => readJsonFile('userRoles.json')
export const saveUserRoles = (userRoles) => writeJsonFile('userRoles.json', userRoles)

export const getUserClasses = () => readJsonFile('userClasses.json')
export const saveUserClasses = (userClasses) => writeJsonFile('userClasses.json', userClasses)

export const getNotifications = () => readJsonFile('notifications.json')
export const saveNotifications = (notifications) => writeJsonFile('notifications.json', notifications)

// User authentication functions
export const createUser = async (userData) => {
  const users = getUsers()
  
  // Check if user already exists
  const existingUser = users.find(user => user.email === userData.email)
  if (existingUser) {
    throw new Error('User already exists')
  }

  // Hash password
  const saltRounds = 12
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds)

  // Create user
  const newUser = {
    id: generateId(),
    email: userData.email,
    password: hashedPassword,
    phone: userData.phone || null,
    createdAt: new Date().toISOString(),
    isActive: true,
    status: 'pending', // pending, approved, rejected
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null
  }

  users.push(newUser)
  saveUsers(users)

  // Create user roles
  if (userData.roles && userData.roles.length > 0) {
    const userRoles = getUserRoles()
    userData.roles.forEach(role => {
      userRoles.push({
        id: generateId(),
        userId: newUser.id,
        role: role, // 'administrator', 'class_lead', 'parent'
        createdAt: new Date().toISOString()
      })
    })
    saveUserRoles(userRoles)
  }

  // Create user class assignments
  if (userData.classAssignments && userData.classAssignments.length > 0) {
    const userClasses = getUserClasses()
    userData.classAssignments.forEach(assignment => {
      userClasses.push({
        id: generateId(),
        userId: newUser.id,
        classId: assignment.classId,
        childName: assignment.childName || null, // Only for parents
        createdAt: new Date().toISOString()
      })
    })
    saveUserClasses(userClasses)
  }

  // Create approval notification for admins
  const notifications = getNotifications()
  const userRoles = userData.roles || []
  const isParent = userRoles.includes('parent')
  const isClassLead = userRoles.includes('class_lead')
  
  // Get all administrators for notification
  const allUsers = getUsers()
  const allUserRoles = getUserRoles()
  const adminUsers = allUserRoles
    .filter(ur => ur.role === 'administrator')
    .map(ur => allUsers.find(u => u.id === ur.userId))
    .filter(u => u && u.status === 'approved')

  // Create notifications for admins
  adminUsers.forEach(admin => {
    notifications.push({
      id: generateId(),
      type: 'user_approval_request',
      recipientId: admin.id,
      senderId: newUser.id,
      senderEmail: newUser.email,
      userRole: userRoles.join(', '),
      classAssignments: userData.classAssignments || [],
      message: `New ${userRoles.join(', ')} registration: ${newUser.email}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      status: 'pending'
    })
  })
  
  saveNotifications(notifications)

  return { ...newUser, password: undefined } // Remove password from response
}

export const authenticateUser = async (email, password) => {
  const users = getUsers()
  const user = users.find(u => u.email === email && u.isActive)
  
  if (!user) {
    throw new Error('Invalid credentials')
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    throw new Error('Invalid credentials')
  }

  // Check if user is approved
  if (user.status === 'pending') {
    throw new Error('Account pending approval. Please wait for an administrator to approve your account.')
  }
  
  if (user.status === 'rejected') {
    const reason = user.rejectionReason ? ` Reason: ${user.rejectionReason}` : ''
    throw new Error(`Account has been rejected.${reason}`)
  }

  return { ...user, password: undefined }
}

export const getUserById = (userId) => {
  const users = getUsers()
  const user = users.find(u => u.id === userId && u.isActive)
  return user ? { ...user, password: undefined } : null
}

export const getUserByEmail = (email) => {
  const users = getUsers()
  const user = users.find(u => u.email === email && u.isActive)
  return user ? { ...user, password: undefined } : null
}

export const getUserWithRolesAndClasses = (userId) => {
  const user = getUserById(userId)
  if (!user) return null

  const userRoles = getUserRoles().filter(ur => ur.userId === userId)
  const userClasses = getUserClasses().filter(uc => uc.userId === userId)

  return {
    ...user,
    roles: userRoles.map(ur => ur.role),
    classAssignments: userClasses
  }
}

// JWT functions
export const generateJWT = (user) => {
  const payload = {
    userId: user.id,
    email: user.email
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Role and permission functions
export const hasRole = (userId, role) => {
  const userRoles = getUserRoles()
  return userRoles.some(ur => ur.userId === userId && ur.role === role)
}

export const hasAccessToClass = (userId, classId) => {
  // Administrators have access to all classes
  if (hasRole(userId, 'administrator')) {
    return true
  }

  // Check if user has direct access to this class
  const userClasses = getUserClasses()
  return userClasses.some(uc => uc.userId === userId && uc.classId === classId)
}

export const getUserAccessibleClasses = (userId) => {
  // Administrators can access all classes
  if (hasRole(userId, 'administrator')) {
    return 'all'
  }

  // Return specific class IDs the user has access to
  const userClasses = getUserClasses()
  return userClasses
    .filter(uc => uc.userId === userId)
    .map(uc => uc.classId)
}

// Utility functions
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// Middleware for authentication
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = verifyJWT(token)
    const user = getUserWithRolesAndClasses(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // **SECURITY FIX**: Check user approval status
    if (user.status === 'pending') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        details: 'Please wait for an administrator to approve your account.'
      })
    }
    
    if (user.status === 'rejected') {
      const reason = user.rejectionReason ? ` Reason: ${user.rejectionReason}` : ''
      return res.status(403).json({ 
        error: 'Account access denied',
        details: `Your account has been rejected.${reason}`
      })
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account not approved',
        details: 'Your account must be approved before accessing the system.'
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}

// Middleware for role-based authorization
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userRoles = req.user.roles
    const hasRequiredRole = roles.some(role => userRoles.includes(role))

    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// Middleware for class access authorization
export const requireClassAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const classId = req.params.classId || req.body.classId || req.query.classId

  if (!classId) {
    return res.status(400).json({ error: 'Class ID required' })
  }

  if (!hasAccessToClass(req.user.id, classId)) {
    return res.status(403).json({ error: 'Access denied to this class' })
  }

  next()
}

// Approval management functions
export const approveUser = async (userId, approverId) => {
  const users = getUsers()
  const userIndex = users.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    throw new Error('User not found')
  }
  
  if (users[userIndex].status !== 'pending') {
    throw new Error('User is not pending approval')
  }
  
  users[userIndex].status = 'approved'
  users[userIndex].approvedBy = approverId
  users[userIndex].approvedAt = new Date().toISOString()
  
  saveUsers(users)
  
  // Create notification for the approved user
  const notifications = getNotifications()
  notifications.push({
    id: generateId(),
    type: 'user_approved',
    recipientId: userId,
    senderId: approverId,
    message: 'Your account has been approved. You can now log in.',
    isRead: false,
    createdAt: new Date().toISOString(),
    status: 'sent'
  })
  
  saveNotifications(notifications)
  
  return { ...users[userIndex], password: undefined }
}

export const rejectUser = async (userId, rejectorId, reason = null) => {
  const users = getUsers()
  const userIndex = users.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    throw new Error('User not found')
  }
  
  if (users[userIndex].status !== 'pending') {
    throw new Error('User is not pending approval')
  }
  
  users[userIndex].status = 'rejected'
  users[userIndex].rejectedBy = rejectorId
  users[userIndex].rejectedAt = new Date().toISOString()
  users[userIndex].rejectionReason = reason
  
  saveUsers(users)
  
  // Create notification for the rejected user
  const notifications = getNotifications()
  notifications.push({
    id: generateId(),
    type: 'user_rejected',
    recipientId: userId,
    senderId: rejectorId,
    message: `Your account has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
    isRead: false,
    createdAt: new Date().toISOString(),
    status: 'sent'
  })
  
  saveNotifications(notifications)
  
  return { ...users[userIndex], password: undefined }
}

// User deletion function
export const deleteUsers = async (userIds, deleterId) => {
  const users = getUsers()
  const userRoles = getUserRoles()
  const userClasses = getUserClasses()
  const notifications = getNotifications()
  const children = getChildrenData()
  
  const deletedUsers = []
  
  for (const userId of userIds) {
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      console.warn(`User with ID ${userId} not found`)
      continue
    }
    
    // Store user info before deletion (without password)
    const { password, ...userInfo } = users[userIndex]
    deletedUsers.push(userInfo)
    
    // Remove user from users array
    users.splice(userIndex, 1)
    
    // Delete children if user is a parent
    const userChildrenToDelete = children.filter(child => child.parentId === userId)
    if (userChildrenToDelete.length > 0) {
      const filteredChildren = children.filter(child => child.parentId !== userId)
      saveChildren(filteredChildren)
      console.log(`Deleted ${userChildrenToDelete.length} children for user ${userInfo.email}`)
    }
  }
  
  // Remove user roles for deleted users
  const filteredUserRoles = userRoles.filter(ur => !userIds.includes(ur.userId))
  saveUserRoles(filteredUserRoles)
  
  // Remove user class assignments for deleted users
  const filteredUserClasses = userClasses.filter(uc => !userIds.includes(uc.userId))
  saveUserClasses(filteredUserClasses)
  
  // Remove notifications for deleted users
  const filteredNotifications = notifications.filter(n => 
    !userIds.includes(n.recipientId) && !userIds.includes(n.senderId)
  )
  saveNotifications(filteredNotifications)
  
  // Save updated users
  saveUsers(users)
  
  // Create audit log notification for the admin who deleted users
  const auditNotification = {
    id: generateId(),
    type: 'users_deleted',
    recipientId: deleterId,
    senderId: deleterId,
    message: `Deleted ${deletedUsers.length} users: ${deletedUsers.map(u => u.email).join(', ')}`,
    isRead: false,
    createdAt: new Date().toISOString(),
    status: 'sent'
  }
  
  const updatedNotifications = getNotifications()
  updatedNotifications.push(auditNotification)
  saveNotifications(updatedNotifications)
  
  return deletedUsers
}

// Notification management functions
export const getUserNotifications = (userId) => {
  const notifications = getNotifications()
  return notifications.filter(n => n.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export const markNotificationAsRead = (notificationId, userId) => {
  const notifications = getNotifications()
  const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.recipientId === userId)
  
  if (notificationIndex === -1) {
    throw new Error('Notification not found')
  }
  
  notifications[notificationIndex].isRead = true
  saveNotifications(notifications)
  
  return notifications[notificationIndex]
}

export const getPendingUsers = () => {
  const users = getUsers()
  return users.filter(u => u.status === 'pending')
    .map(u => ({ ...u, password: undefined }))
}

// Class assignment request management
const classAssignmentRequestsFile = path.join(dataDir, 'classAssignmentRequests.json')

// Children management
const childrenFile = path.join(dataDir, 'children.json')

const getClassAssignmentRequestsData = () => {
  try {
    if (!fs.existsSync(classAssignmentRequestsFile)) {
      return []
    }
    const data = fs.readFileSync(classAssignmentRequestsFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading class assignment requests:', error)
    return []
  }
}

const saveClassAssignmentRequests = (requests) => {
  try {
    fs.writeFileSync(classAssignmentRequestsFile, JSON.stringify(requests, null, 2))
  } catch (error) {
    console.error('Error saving class assignment requests:', error)
    throw error
  }
}

export const getClassAssignmentRequests = async () => {
  const requests = getClassAssignmentRequestsData()
  const users = getUsers()
  const classes = await getClasses()

  // Enhance requests with user and class information
  return requests.map(request => {
    const user = users.find(u => u.id === request.userId)
    const targetClass = classes.find(c => c.id === request.classId)
    
    return {
      ...request,
      userEmail: user?.email || 'Unknown',
      className: targetClass?.name || 'Unknown Class',
      classColor: targetClass?.color || '#6B7280'
    }
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export const createClassAssignmentRequest = async ({ userId, classId, reason, childName }) => {
  const users = getUsers()
  const classes = await getClasses()
  const requests = getClassAssignmentRequestsData()

  // Validate user exists
  const user = users.find(u => u.id === userId)
  if (!user) {
    throw new Error('User not found')
  }

  // Validate class exists
  const targetClass = classes.find(c => c.id === classId)
  if (!targetClass) {
    throw new Error('Class not found')
  }

  // Check if user already has a pending request for this class
  const existingRequest = requests.find(r => 
    r.userId === userId && 
    r.classId === classId && 
    r.status === 'pending'
  )
  if (existingRequest) {
    throw new Error('You already have a pending request for this class')
  }

  const newRequest = {
    id: generateId(),
    userId,
    classId,
    reason: reason || '',
    childName: childName || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  requests.push(newRequest)
  saveClassAssignmentRequests(requests)

  // Create notification for admins
  const notifications = getNotifications()
  const allUsers = getUsers()
  const allUserRoles = getUserRoles()
  const adminUsers = allUserRoles
    .filter(ur => ur.role === 'administrator')
    .map(ur => allUsers.find(u => u.id === ur.userId))
    .filter(u => u && u.status === 'approved')
  
  for (const admin of adminUsers) {
    const notification = {
      id: generateId(),
      type: 'class_assignment_request',
      recipientId: admin.id,
      senderId: userId,
      message: `New class assignment request from ${user.email} for class ${targetClass.name}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      status: 'sent',
      metadata: {
        requestId: newRequest.id,
        userEmail: user.email,
        className: targetClass.name
      }
    }
    notifications.push(notification)
  }

  saveNotifications(notifications)
  return newRequest
}

export const approveClassAssignmentRequest = async (requestId, approverId) => {
  const requests = getClassAssignmentRequestsData()
  const users = getUsers()
  const userClasses = getUserClasses()
  const notifications = getNotifications()

  const requestIndex = requests.findIndex(r => r.id === requestId)
  if (requestIndex === -1) {
    throw new Error('Class assignment request not found')
  }

  const request = requests[requestIndex]
  if (request.status !== 'pending') {
    throw new Error('Request has already been processed')
  }

  const user = users.find(u => u.id === request.userId)
  if (!user) {
    throw new Error('User not found')
  }

  // Update request status
  requests[requestIndex] = {
    ...request,
    status: 'approved',
    updatedAt: new Date().toISOString(),
    approverId
  }

  // Remove existing class assignments for this user
  const filteredUserClasses = userClasses.filter(uc => uc.userId !== request.userId)
  
  // Add new class assignment
  const newAssignment = {
    id: generateId(),
    userId: request.userId,
    classId: request.classId,
    childName: request.childName,
    createdAt: new Date().toISOString()
  }
  filteredUserClasses.push(newAssignment)

  // Save changes
  saveClassAssignmentRequests(requests)
  saveUserClasses(filteredUserClasses)

  // Create notification for user
  const classes = await getClasses()
  const targetClass = classes.find(c => c.id === request.classId)
  const userNotification = {
    id: generateId(),
    type: 'class_assignment_approved',
    recipientId: request.userId,
    senderId: approverId,
    message: `Your class assignment request for ${targetClass?.name || 'the requested class'} has been approved`,
    isRead: false,
    createdAt: new Date().toISOString(),
    status: 'sent'
  }

  notifications.push(userNotification)
  saveNotifications(notifications)

  return { request: requests[requestIndex], assignment: newAssignment }
}

export const rejectClassAssignmentRequest = async (requestId, approverId, reason = '') => {
  const requests = getClassAssignmentRequestsData()
  const users = getUsers()
  const notifications = getNotifications()

  const requestIndex = requests.findIndex(r => r.id === requestId)
  if (requestIndex === -1) {
    throw new Error('Class assignment request not found')
  }

  const request = requests[requestIndex]
  if (request.status !== 'pending') {
    throw new Error('Request has already been processed')
  }

  const user = users.find(u => u.id === request.userId)
  if (!user) {
    throw new Error('User not found')
  }

  // Update request status
  requests[requestIndex] = {
    ...request,
    status: 'rejected',
    updatedAt: new Date().toISOString(),
    approverId,
    rejectionReason: reason
  }

  // Save changes
  saveClassAssignmentRequests(requests)

  // Create notification for user
  const userNotification = {
    id: generateId(),
    type: 'class_assignment_rejected',
    recipientId: request.userId,
    senderId: approverId,
    message: `Your class assignment request has been rejected${reason ? ': ' + reason : ''}`,
    isRead: false,
    createdAt: new Date().toISOString(),
    status: 'sent'
  }

  notifications.push(userNotification)
  saveNotifications(notifications)

  return requests[requestIndex]
}

// Children management functions
const getChildrenData = () => {
  try {
    if (!fs.existsSync(childrenFile)) {
      return []
    }
    const data = fs.readFileSync(childrenFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading children data:', error)
    return []
  }
}

const saveChildren = (children) => {
  try {
    fs.writeFileSync(childrenFile, JSON.stringify(children, null, 2))
  } catch (error) {
    console.error('Error saving children data:', error)
    throw error
  }
}

export const getChildren = () => {
  return getChildrenData()
}

export const getChildrenByParent = (parentId) => {
  const children = getChildrenData()
  return children.filter(child => child.parentId === parentId)
}

export const getChildrenByClass = (classId) => {
  const children = getChildrenData()
  return children.filter(child => child.classId === classId)
}

export const addChild = ({ parentId, name, classId }) => {
  const children = getChildrenData()
  
  // Check if child with same name already exists for this parent
  const existingChild = children.find(c => c.parentId === parentId && c.name.toLowerCase() === name.toLowerCase())
  if (existingChild) {
    throw new Error('Child with this name already exists')
  }
  
  const newChild = {
    id: generateId(),
    parentId,
    name,
    classId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  children.push(newChild)
  saveChildren(children)
  
  return newChild
}

export const updateChild = (childId, updates) => {
  const children = getChildrenData()
  const childIndex = children.findIndex(c => c.id === childId)
  
  if (childIndex === -1) {
    throw new Error('Child not found')
  }
  
  children[childIndex] = {
    ...children[childIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  saveChildren(children)
  return children[childIndex]
}

export const deleteChild = (childId) => {
  const children = getChildrenData()
  const filteredChildren = children.filter(c => c.id !== childId)
  
  if (filteredChildren.length === children.length) {
    throw new Error('Child not found')
  }
  
  saveChildren(filteredChildren)
  return true
}

// User Management Functions
export const getAllUsersForManagement = (currentUser) => {
  const users = getUsers()
  const userRoles = getUserRoles()
  
  // Get all users with their roles and class assignments
  const usersWithDetails = users.map(user => {
    const roles = userRoles
      .filter(ur => ur.userId === user.id)
      .map(ur => ur.role)
    
    const classAssignments = getUserClasses()
      .filter(uc => uc.userId === user.id)
    
    return {
      ...user,
      password: undefined, // Never return passwords
      roles,
      classAssignments
    }
  })
  
  // Filter based on current user permissions
  if (currentUser.roles && currentUser.roles.includes('administrator')) {
    // Admins can see all users
    return usersWithDetails
  } else if (currentUser.roles && currentUser.roles.includes('class_lead')) {
    // Class leads can only see parents
    return usersWithDetails.filter(user => user.roles.includes('parent'))
  }
  
  return []
}

export const updateUser = (userId, updates, currentUser) => {
  const users = getUsers()
  const userIndex = users.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    throw new Error('User not found')
  }
  
  const targetUser = users[userIndex]
  const userRoles = getUserRoles()
  const targetUserRoles = userRoles
    .filter(ur => ur.userId === userId)
    .map(ur => ur.role)
  
  // Check permissions
  if (!canManageUser(currentUser, targetUserRoles)) {
    throw new Error('You do not have permission to manage this user')
  }
  
  // Prevent self-deactivation for admins
  if (userId === currentUser.id && updates.isActive === false) {
    throw new Error('You cannot deactivate your own account')
  }
  
  // Update user
  users[userIndex] = {
    ...targetUser,
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  saveUsers(users)
  return { ...users[userIndex], password: undefined }
}

export const deactivateUser = (userId, currentUser) => {
  return updateUser(userId, { isActive: false }, currentUser)
}

export const reactivateUser = (userId, currentUser) => {
  return updateUser(userId, { isActive: true }, currentUser)
}

export const bulkDeactivateUsers = (userIds, currentUser) => {
  const users = getUsers()
  const userRoles = getUserRoles()
  let deactivated = 0
  let errors = []
  
  for (const userId of userIds) {
    try {
      const targetUser = users.find(u => u.id === userId)
      if (!targetUser) {
        errors.push(`User ${userId} not found`)
        continue
      }
      
      const targetUserRoles = userRoles
        .filter(ur => ur.userId === userId)
        .map(ur => ur.role)
      
      // Check permissions
      if (!canManageUser(currentUser, targetUserRoles)) {
        errors.push(`No permission to manage user ${targetUser.email}`)
        continue
      }
      
      // Prevent self-deactivation
      if (userId === currentUser.id) {
        errors.push('Cannot deactivate your own account')
        continue
      }
      
      // Deactivate user
      const userIndex = users.findIndex(u => u.id === userId)
      users[userIndex] = {
        ...users[userIndex],
        isActive: false,
        updatedAt: new Date().toISOString()
      }
      deactivated++
    } catch (error) {
      errors.push(`Error deactivating user ${userId}: ${error.message}`)
    }
  }
  
  if (deactivated > 0) {
    saveUsers(users)
  }
  
  return {
    deactivated,
    errors,
    total: userIds.length
  }
}

// Helper function to check if current user can manage target user
const canManageUser = (currentUser, targetUserRoles) => {
  if (!currentUser.roles) return false
  
  // Admins can manage everyone
  if (currentUser.roles.includes('administrator')) {
    return true
  }
  
  // Class leads can only manage parents
  if (currentUser.roles.includes('class_lead')) {
    return targetUserRoles.includes('parent') && 
           !targetUserRoles.includes('administrator') && 
           !targetUserRoles.includes('class_lead')
  }
  
  return false
}