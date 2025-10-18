import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'

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