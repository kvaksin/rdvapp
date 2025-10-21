import fs, { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'
import { getClasses, getSlots } from './db.js'

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

// Re-export getClasses from db.js for use in other modules
export { getClasses } from './db.js'

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
    firstName: userData.firstName || null,
    lastName: userData.lastName || null,
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

  // Create approval notification for admins and class leads
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

  // Get class leads for the classes this parent is registering for (if parent)
  let relevantClassLeads = []
  if (isParent && userData.classAssignments && userData.classAssignments.length > 0) {
    const userClasses = getUserClasses()
    const classIds = userData.classAssignments.map(ca => ca.classId)
    
    // Find class leads for these classes
    const classLeadUsers = allUserRoles
      .filter(ur => ur.role === 'class_lead')
      .map(ur => allUsers.find(u => u.id === ur.userId))
      .filter(u => u && u.status === 'approved')
    
    // Filter class leads who have access to the relevant classes
    relevantClassLeads = classLeadUsers.filter(classLead => {
      const classLeadClasses = userClasses.filter(uc => uc.userId === classLead.id)
      return classLeadClasses.some(clc => classIds.includes(clc.classId))
    })
  }

  // Create notifications for admins
  adminUsers.forEach(admin => {
    const fullName = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || 'Unknown Name'
    notifications.push({
      id: generateId(),
      type: 'user_approval_request',
      recipientId: admin.id,
      senderId: newUser.id,
      senderEmail: newUser.email,
      senderName: fullName,
      userRole: userRoles.join(', '),
      classAssignments: userData.classAssignments || [],
      message: `New ${userRoles.join(', ')} registration: ${fullName} (${newUser.email})`,
      isRead: false,
      createdAt: new Date().toISOString(),
      status: 'pending'
    })
  })

  // Create notifications for relevant class leads (when parent registers)
  if (isParent) {
    relevantClassLeads.forEach(classLead => {
      const fullName = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || 'Unknown Name'
      notifications.push({
        id: generateId(),
        type: 'user_approval_request',
        recipientId: classLead.id,
        senderId: newUser.id,
        senderEmail: newUser.email,
        senderName: fullName,
        userRole: userRoles.join(', '),
        classAssignments: userData.classAssignments || [],
        message: `New ${userRoles.join(', ')} registration: ${fullName} (${newUser.email})`,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'pending'
      })
    })
  }
  
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
export const generateId = () => {
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

// Cleanup old notifications (30+ days)
export const cleanupOldNotifications = () => {
  const notifications = getNotifications()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days in milliseconds
  
  const initialCount = notifications.length
  const recentNotifications = notifications.filter(notification => {
    const createdAt = new Date(notification.createdAt)
    return createdAt > thirtyDaysAgo
  })
  
  const removedCount = initialCount - recentNotifications.length
  
  if (removedCount > 0) {
    saveNotifications(recentNotifications)
    console.log(`🧹 Cleaned up ${removedCount} old notifications (older than 30 days)`)
  }
  
  return {
    initialCount,
    remainingCount: recentNotifications.length,
    removedCount
  }
}

// Auto-cleanup notifications on startup and periodically
export const scheduleNotificationCleanup = () => {
  // Run cleanup on startup
  cleanupOldNotifications()
  
  // Schedule daily cleanup at 2 AM
  const scheduleNextCleanup = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(2, 0, 0, 0) // 2 AM
    
    const timeUntilNextCleanup = tomorrow.getTime() - now.getTime()
    
    setTimeout(() => {
      cleanupOldNotifications()
      scheduleNextCleanup() // Schedule the next one
    }, timeUntilNextCleanup)
    
    console.log(`📅 Next notification cleanup scheduled for: ${tomorrow.toLocaleString()}`)
  }
  
  scheduleNextCleanup()
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

// Parent-Child relationship management
const parentChildRelationshipsFile = path.join(dataDir, 'parentChildRelationships.json')

const getParentChildRelationships = () => {
  try {
    if (!fs.existsSync(parentChildRelationshipsFile)) {
      return []
    }
    const data = fs.readFileSync(parentChildRelationshipsFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading parent-child relationships:', error)
    return []
  }
}

const saveParentChildRelationships = (relationships) => {
  try {
    fs.writeFileSync(parentChildRelationshipsFile, JSON.stringify(relationships, null, 2))
  } catch (error) {
    console.error('Error saving parent-child relationships:', error)
    throw error
  }
}

// Export parent-child relationship functions
export { getParentChildRelationships, saveParentChildRelationships }

// Add new parent-child relationship functions
export const addParentChildRelationship = (parentId, childId, relationship = 'parent') => {
  const relationships = getParentChildRelationships()
  
  // Check if relationship already exists
  const existingRelationship = relationships.find(
    rel => rel.parentId === parentId && rel.childId === childId
  )
  
  if (!existingRelationship) {
    const newRelationship = {
      id: `${Date.now()}${Math.random().toString(36).substring(2)}`,
      parentId,
      childId,
      relationship,
      createdAt: new Date().toISOString()
    }
    
    relationships.push(newRelationship)
    saveParentChildRelationships(relationships)
  }
  
  return relationships
}

export const removeParentChildRelationships = (childId) => {
  const relationships = getParentChildRelationships()
  const filteredRelationships = relationships.filter(rel => rel.childId !== childId)
  saveParentChildRelationships(filteredRelationships)
  return filteredRelationships
}

// Alias for backward compatibility
const saveChildrenData = saveChildren

export const getChildren = () => {
  return getChildrenData()
}

export const getChildrenByParent = (parentId) => {
  const children = getChildrenData()
  const relationships = getParentChildRelationships()
  
  // Get child IDs for this parent
  const childIds = relationships
    .filter(rel => rel.parentId === parentId)
    .map(rel => rel.childId)
  
  // Return children that this parent has access to
  return children.filter(child => childIds.includes(child.id))
}

export const getChildrenByClass = (classId) => {
  const children = getChildrenData()
  return children.filter(child => child.classId === classId)
}

export const getParentsByChild = (childId) => {
  const relationships = getParentChildRelationships()
  const users = getUsers()
  
  // Get parent IDs for this child
  const parentIds = relationships
    .filter(rel => rel.childId === childId)
    .map(rel => rel.parentId)
  
  // Return parent users
  return users.filter(user => parentIds.includes(user.id))
}

export const addChild = ({ parentId, name, firstName, lastName, birthday, classId }) => {
  const children = getChildrenData()
  const relationships = getParentChildRelationships()
  
  // Handle legacy name parameter or firstName/lastName
  let childFirstName = firstName
  let childLastName = lastName
  let fullName = name
  
  if (!firstName && !lastName && name) {
    // Legacy: split name into firstName and lastName
    const nameParts = name.trim().split(' ')
    childFirstName = nameParts[0] || ''
    childLastName = nameParts.slice(1).join(' ') || ''
    fullName = name
  } else if (firstName || lastName) {
    fullName = `${firstName || ''} ${lastName || ''}`.trim()
  }
  
  if (!childFirstName && !childLastName) {
    throw new Error('Child firstName and lastName are required')
  }
  
  // Check if child with same name and class already exists
  const existingChild = children.find(c => {
    if (c.firstName && c.lastName) {
      return c.firstName.toLowerCase() === childFirstName.toLowerCase() && 
             c.lastName.toLowerCase() === childLastName.toLowerCase() && 
             c.classId === classId
    } else {
      // Legacy check
      return c.name && c.name.toLowerCase() === fullName.toLowerCase() && c.classId === classId
    }
  })
  
  let childId
  
  if (existingChild) {
    // Child exists, just create relationship if it doesn't exist
    childId = existingChild.id
    const existingRelationship = relationships.find(rel => 
      rel.parentId === parentId && rel.childId === childId
    )
    
    if (existingRelationship) {
      throw new Error('This child is already associated with this parent')
    }
  } else {
    // Create new child
    const newChild = {
      id: generateId(),
      name: fullName, // Keep for backward compatibility
      firstName: childFirstName,
      lastName: childLastName,
      birthday: birthday || null,
      classId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    children.push(newChild)
    saveChildren(children)
    childId = newChild.id
  }
  
  // Create parent-child relationship
  const newRelationship = {
    id: generateId(),
    parentId,
    childId,
    relationship: 'parent',
    createdAt: new Date().toISOString()
  }
  
  relationships.push(newRelationship)
  saveParentChildRelationships(relationships)
  
  // Return the child with relationship info
  return {
    ...children.find(c => c.id === childId),
    relationshipId: newRelationship.id
  }
}

export const linkParentToChild = (parentId, childId) => {
  const children = getChildrenData()
  const relationships = getParentChildRelationships()
  
  // Check if child exists
  const child = children.find(c => c.id === childId)
  if (!child) {
    throw new Error('Child not found')
  }
  
  // Check if relationship already exists
  const existingRelationship = relationships.find(rel => 
    rel.parentId === parentId && rel.childId === childId
  )
  
  if (existingRelationship) {
    throw new Error('This child is already associated with this parent')
  }
  
  // Create new relationship
  const newRelationship = {
    id: generateId('rel'),
    parentId,
    childId,
    relationship: 'parent',
    createdAt: new Date().toISOString()
  }
  
  relationships.push(newRelationship)
  saveParentChildRelationships(relationships)
  
  return {
    ...child,
    relationshipId: newRelationship.id
  }
}

export const updateChild = (childId, updates) => {
  const children = getChildrenData()
  const childIndex = children.findIndex(c => c.id === childId)
  
  if (childIndex === -1) {
    throw new Error('Child not found')
  }
  
  // Don't allow updating the ID
  const { id, ...allowedUpdates } = updates
  
  children[childIndex] = {
    ...children[childIndex],
    ...allowedUpdates,
    updatedAt: new Date().toISOString()
  }
  
  saveChildren(children)
  return children[childIndex]
}

export const deleteChild = (childId) => {
  const children = getChildrenData()
  const relationships = getParentChildRelationships()
  
  // Check if child exists
  const childExists = children.some(c => c.id === childId)
  if (!childExists) {
    throw new Error('Child not found')
  }
  
  // Remove all parent-child relationships for this child
  const filteredRelationships = relationships.filter(rel => rel.childId !== childId)
  saveParentChildRelationships(filteredRelationships)
  
  // Remove the child
  const filteredChildren = children.filter(c => c.id !== childId)
  saveChildren(filteredChildren)
  
  return true
}

// Add function to remove parent-child relationship (without deleting the child)
export const removeParentChildRelationship = (parentId, childId) => {
  const relationships = getParentChildRelationships()
  const relationshipIndex = relationships.findIndex(rel => 
    rel.parentId === parentId && rel.childId === childId
  )
  
  if (relationshipIndex === -1) {
    throw new Error('Parent-child relationship not found')
  }
  
  relationships.splice(relationshipIndex, 1)
  saveParentChildRelationships(relationships)
  
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

// Remove user from specific class (Class leads can remove users from their classes)
export const removeUserFromClass = (userId, classId, currentUser) => {
  // Check permissions
  if (!currentUser.roles.includes('administrator') && !currentUser.roles.includes('class_lead')) {
    throw new Error('Insufficient permissions')
  }
  
  // If class lead, check if they manage this class
  if (currentUser.roles.includes('class_lead') && !currentUser.roles.includes('administrator')) {
    const userClassIds = currentUser.classAssignments?.map(ca => ca.classId) || []
    if (!userClassIds.includes(classId)) {
      throw new Error('You can only remove users from classes you manage')
    }
  }
  
  const userClasses = getUserClasses()
  const assignments = userClasses.filter(uc => uc.userId === userId && uc.classId === classId)
  
  if (assignments.length === 0) {
    throw new Error('User is not assigned to this class')
  }
  
  // Remove all assignments for this user-class combination
  const updatedUserClasses = userClasses.filter(uc => !(uc.userId === userId && uc.classId === classId))
  saveUserClasses(updatedUserClasses)
  
  // Create notification for user
  const notifications = getNotifications()
  const newNotification = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
    userId: userId,
    type: 'class_removal',
    title: 'Removed from Class',
    message: `You have been removed from a class by ${currentUser.email}`,
    isRead: false,
    createdAt: new Date().toISOString()
  }
  
  notifications.push(newNotification)
  saveNotifications(notifications)
  
  return {
    removedAssignments: assignments.length,
    classId,
    userId
  }
}

// Delete user completely (Admins only)
export const deleteUser = (userId, currentUser) => {
  if (!currentUser.roles.includes('administrator')) {
    throw new Error('Only administrators can delete users')
  }
  
  const users = getUsers()
  const userIndex = users.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    throw new Error('User not found')
  }
  
  const { password, ...userInfo } = users[userIndex]
  
  // Remove user from users array
  users.splice(userIndex, 1)
  saveUsers(users)
  
  // Remove user roles
  const userRoles = getUserRoles()
  const updatedUserRoles = userRoles.filter(ur => ur.userId !== userId)
  saveUserRoles(updatedUserRoles)
  
  // Remove user class assignments
  const userClasses = getUserClasses()
  const updatedUserClasses = userClasses.filter(uc => uc.userId !== userId)
  saveUserClasses(updatedUserClasses)
  
  // Remove parent-child relationships for this user
  const relationships = getParentChildRelationships()
  const updatedRelationships = relationships.filter(rel => rel.parentId !== userId)
  saveParentChildRelationships(updatedRelationships)
  
  // Note: We don't delete children themselves as they may be linked to other parents
  
  // Remove user notifications
  const notifications = getNotifications()
  const updatedNotifications = notifications.filter(n => n.userId !== userId)
  saveNotifications(updatedNotifications)
  
  // Remove class assignment requests
  const requests = getClassAssignmentRequestsData()
  const updatedRequests = requests.filter(r => r.userId !== userId)
  saveClassAssignmentRequests(updatedRequests)
  
  return userInfo
}

// Bulk delete users (Admins only)
export const bulkDeleteUsers = (userIds, currentUser) => {
  if (!currentUser.roles.includes('administrator')) {
    throw new Error('Only administrators can delete users')
  }
  
  const deletedUsers = []
  const errors = []
  
  for (const userId of userIds) {
    try {
      const deletedUser = deleteUser(userId, currentUser)
      deletedUsers.push(deletedUser)
    } catch (error) {
      errors.push({ userId, error: error.message })
    }
  }
  
  return {
    deleted: deletedUsers.length,
    errors,
    total: userIds.length,
    deletedUsers
  }
}

// Message management functions
export const getMessages = () => {
  try {
    const messagesPath = path.join(dataDir, 'messages.json')
    if (!fs.existsSync(messagesPath)) {
      return []
    }
    const data = fs.readFileSync(messagesPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading messages:', error)
    return []
  }
}

export const saveMessages = (messages) => {
  try {
    const messagesPath = path.join(dataDir, 'messages.json')
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2))
  } catch (error) {
    console.error('Error saving messages:', error)
    throw error
  }
}

export const addMessage = (messageData) => {
  const messages = getMessages()
  const newMessage = {
    id: generateId(),
    senderId: messageData.senderId,
    senderName: messageData.senderName,
    senderRole: messageData.senderRole,
    type: messageData.type, // 'admin_to_class', 'class_lead_to_parents', 'parent_to_class_lead'
    subject: messageData.subject || '',
    message: messageData.message,
    classIds: messageData.classIds || [], // Classes this message is sent to
    childIds: messageData.childIds || [], // Specific children (for parent targeting)
    recipients: messageData.recipients || [], // Specific user IDs to receive the message
    createdAt: new Date().toISOString(),
    readBy: [] // Users who have read this message
  }
  
  messages.push(newMessage)
  saveMessages(messages)
  return newMessage
}

export const getMessagesForUser = (userId, userRoles, userClasses, limit = 20) => {
  const messages = getMessages()
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  
  // Filter messages for the user based on their role and classes
  const userMessages = messages.filter(message => {
    // Only show messages from the last 2 weeks
    if (new Date(message.createdAt) < twoWeeksAgo) {
      return false
    }
    
    // If user is explicitly a recipient
    if (message.recipients.includes(userId)) {
      return true
    }
    
    // Admin can see all messages
    if (userRoles.includes('administrator')) {
      return true
    }
    
    // Class lead can see messages for their classes
    if (userRoles.includes('class_lead')) {
      const leadClassIds = userClasses.map(uc => uc.classId)
      if (message.classIds.some(classId => leadClassIds.includes(classId))) {
        return true
      }
      // Class leads can see parent messages to their classes
      if (message.type === 'parent_to_class_lead' && message.classIds.some(classId => leadClassIds.includes(classId))) {
        return true
      }
    }
    
    // Parents can see admin messages to their classes and their own messages
    if (userRoles.includes('parent')) {
      const parentClassIds = userClasses.map(uc => uc.classId)
      
      // Admin messages to classes the parent is in
      if (message.type === 'admin_to_class' && message.classIds.some(classId => parentClassIds.includes(classId))) {
        return true
      }
      
      // Class lead messages to parents - only if specifically targeted
      if (message.type === 'class_lead_to_parents') {
        // If message has specific recipients, only show to those recipients
        if (message.recipients && message.recipients.length > 0) {
          return message.recipients.includes(userId)
        }
        // If message has childIds, only show to parents of those children
        if (message.childIds && message.childIds.length > 0) {
          const parentChildRelationships = getParentChildRelationships()
          return message.childIds.some(childId => 
            parentChildRelationships.some(rel => rel.parentId === userId && rel.childId === childId)
          )
        }
        // If no specific targeting, show to all parents in the class
        return message.classIds.some(classId => parentClassIds.includes(classId))
      }
      
      // Parents can see their own messages
      if (message.senderId === userId) {
        return true
      }
    }
    
    return false
  })
  
  // Sort by creation date (newest first) and limit
  return userMessages
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

export const markMessageAsRead = (messageId, userId) => {
  const messages = getMessages()
  const message = messages.find(m => m.id === messageId)
  
  if (message && !message.readBy.includes(userId)) {
    message.readBy.push(userId)
    saveMessages(messages)
  }
  
  return message
}

export const cleanupOldMessages = () => {
  const messages = getMessages()
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  
  const validMessages = messages.filter(message => 
    new Date(message.createdAt) >= twoWeeksAgo
  )
  
  if (validMessages.length !== messages.length) {
    saveMessages(validMessages)
    console.log(`Cleaned up ${messages.length - validMessages.length} old messages`)
  }
  
  return validMessages.length
}

// Check if a user can manage a specific booking (cancel/modify)
export const canManageBooking = async (userId, booking) => {
  // Administrators can manage all bookings
  if (hasRole(userId, 'administrator')) {
    return true
  }

  // Class leads can manage bookings in their classes
  if (hasRole(userId, 'class_lead')) {
    // Get the slot to check the class
    const slots = await getSlots()
    const slot = slots.find(s => s.id === booking.slotId)
    if (slot && hasAccessToClass(userId, slot.classId)) {
      return true
    }
  }

  // Parents can only manage bookings for their own children
  if (hasRole(userId, 'parent') && booking.childId) {
    const parentChildRelationships = getParentChildRelationships()
    return parentChildRelationships.some(rel => 
      rel.parentId === userId && rel.childId === booking.childId
    )
  }

  return false
}

// Get bookings that a user can manage (for UI purposes)
export const getUserManageableBookings = async (userId, allBookings) => {
  const results = []
  for (const booking of allBookings) {
    if (await canManageBooking(userId, booking)) {
      results.push(booking)
    }
  }
  return results
}

// Comment management functions
export const getComments = () => {
  try {
    const data = readFileSync('./data/comments.json', 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Error reading comments.json:', err)
    return []
  }
}

export const saveComments = (comments) => {
  try {
    writeFileSync('./data/comments.json', JSON.stringify(comments, null, 2))
  } catch (err) {
    console.error('Error writing comments.json:', err)
  }
}

export const addComment = (commentData) => {
  const comments = getComments()
  const newComment = {
    id: generateId(),
    messageId: commentData.messageId,
    senderId: commentData.senderId,
    senderName: commentData.senderName,
    senderRole: commentData.senderRole,
    comment: commentData.comment,
    createdAt: new Date().toISOString()
  }
  
  comments.push(newComment)
  saveComments(comments)
  return newComment
}

export const getCommentsForMessage = (messageId) => {
  const comments = getComments()
  return comments
    .filter(comment => comment.messageId === messageId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export const deleteComment = (commentId, userId) => {
  const comments = getComments()
  const commentIndex = comments.findIndex(c => c.id === commentId)
  
  if (commentIndex === -1) {
    return null
  }
  
  const comment = comments[commentIndex]
  
  // Only the comment author or an admin can delete the comment
  if (comment.senderId !== userId && !hasRole(userId, 'administrator')) {
    return null
  }
  
  comments.splice(commentIndex, 1)
  saveComments(comments)
  return comment
}

export const deleteMessage = (messageId, userId) => {
  const messages = getMessages()
  const messageIndex = messages.findIndex(m => m.id === messageId)
  
  if (messageIndex === -1) {
    return null
  }
  
  const message = messages[messageIndex]
  
  // Only the message author or an admin can delete the message
  if (message.senderId !== userId && !hasRole(userId, 'administrator')) {
    return null
  }
  
  // Also delete all comments for this message
  const comments = getComments()
  const updatedComments = comments.filter(c => c.messageId !== messageId)
  saveComments(updatedComments)
  
  // Remove the message
  messages.splice(messageIndex, 1)
  saveMessages(messages)
  
  return message
}