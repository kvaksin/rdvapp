import express from 'express'
import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import rateLimit from 'express-rate-limit'
import * as auth from './auth.js'
import * as db from './db.js'

const router = express.Router()

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' }
})

// Configure Passport strategies
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
}, async (payload, done) => {
  try {
    const user = auth.getUserWithRolesAndClasses(payload.userId)
    if (user) {
      return done(null, user)
    } else {
      return done(null, false)
    }
  } catch (error) {
    return done(error, false)
  }
}))

// Serialize/deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  const user = auth.getUserWithRolesAndClasses(id)
  done(null, user)
})

// Routes

// Register new user
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, confirmPassword, phone, roles, classAssignments } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Validate roles
    const validRoles = ['administrator', 'class_lead', 'parent']
    if (roles && roles.some(role => !validRoles.includes(role))) {
      return res.status(400).json({ error: 'Invalid role specified' })
    }

    // Validate class assignments
    if (classAssignments && classAssignments.length > 0) {
      const classes = await db.getClasses()
      const classIds = classes.map(c => c.id)
      
      for (const assignment of classAssignments) {
        if (!classIds.includes(assignment.classId)) {
          return res.status(400).json({ error: `Invalid class ID: ${assignment.classId}` })
        }
        
        // Parents must provide child name
        if (roles && roles.includes('parent') && !assignment.childName) {
          return res.status(400).json({ error: 'Child name is required for parent role' })
        }
      }
    }

    const user = await auth.createUser({
      email,
      password,
      phone,
      roles: roles || [],
      classAssignments: classAssignments || []
    })

    const token = auth.generateJWT(user)

    res.status(201).json({
      message: 'User created successfully',
      user: auth.getUserWithRolesAndClasses(user.id),
      token
    })

  } catch (error) {
    console.error('Registration error:', error)
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: 'User already exists' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login user
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await auth.authenticateUser(email, password)
    const userWithRoles = auth.getUserWithRolesAndClasses(user.id)
    const token = auth.generateJWT(user)

    res.json({
      message: 'Login successful',
      user: userWithRoles,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

// Get current user profile
router.get('/profile', auth.authenticateToken, (req, res) => {
  res.json({
    user: req.user
  })
})

// Update user profile
router.put('/profile', auth.authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body
    const users = auth.getUsers()
    const userIndex = users.findIndex(u => u.id === req.user.id)
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update allowed fields
    if (phone !== undefined) {
      users[userIndex].phone = phone
    }

    users[userIndex].updatedAt = new Date().toISOString()
    auth.saveUsers(users)

    const updatedUser = auth.getUserWithRolesAndClasses(req.user.id)
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get available classes for registration
router.get('/classes', (req, res) => {
  try {
    const classes = db.readClasses()
    res.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    res.status(500).json({ error: 'Failed to fetch classes' })
  }
})

// Logout (client-side should remove token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' })
})

// Admin routes for user management
router.get('/users', auth.authenticateToken, auth.requireRole(['administrator']), (req, res) => {
  try {
    const users = auth.getUsers().map(user => {
      const userWithRoles = auth.getUserWithRolesAndClasses(user.id)
      return userWithRoles
    })
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Update user roles/classes (admin only)
router.put('/users/:userId/assignments', auth.authenticateToken, auth.requireRole(['administrator']), async (req, res) => {
  try {
    const { userId } = req.params
    const { roles, classAssignments } = req.body

    const user = auth.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update roles
    if (roles) {
      const userRoles = auth.getUserRoles()
      // Remove existing roles
      const filteredRoles = userRoles.filter(ur => ur.userId !== userId)
      // Add new roles
      roles.forEach(role => {
        filteredRoles.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId,
          role,
          createdAt: new Date().toISOString()
        })
      })
      auth.saveUserRoles(filteredRoles)
    }

    // Update class assignments
    if (classAssignments) {
      const userClasses = auth.getUserClasses()
      // Remove existing assignments
      const filteredClasses = userClasses.filter(uc => uc.userId !== userId)
      // Add new assignments
      classAssignments.forEach(assignment => {
        filteredClasses.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId,
          classId: assignment.classId,
          childName: assignment.childName || null,
          createdAt: new Date().toISOString()
        })
      })
      auth.saveUserClasses(filteredClasses)
    }

    const updatedUser = auth.getUserWithRolesAndClasses(userId)
    res.json({
      message: 'User assignments updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user assignments:', error)
    res.status(500).json({ error: 'Failed to update user assignments' })
  }
})

// Get pending users (admin and class_lead)
router.get('/pending-users', passport.authenticate('jwt', { session: false }), auth.requireRole(['administrator', 'class_lead']), async (req, res) => {
  try {
    const pendingUsers = auth.getPendingUsers()
    
    // Add role and class information to each pending user
    const usersWithDetails = pendingUsers.map(user => {
      const userRoles = auth.getUserRoles().filter(ur => ur.userId === user.id)
      const userClasses = auth.getUserClasses().filter(uc => uc.userId === user.id)
      
      return {
        ...user,
        roles: userRoles.map(ur => ur.role),
        classAssignments: userClasses
      }
    })
    
    res.json(usersWithDetails)
  } catch (error) {
    console.error('Error fetching pending users:', error)
    res.status(500).json({ error: 'Failed to fetch pending users' })
  }
})

// Approve user (admin and class_lead, but class leads can only be approved by admins)
router.post('/approve/:userId', passport.authenticate('jwt', { session: false }), auth.requireRole(['administrator', 'class_lead']), async (req, res) => {
  try {
    const { userId } = req.params
    const approverId = req.user.id
    
    // Check if the user being approved has class_lead role
    const pendingUser = auth.getUserById(userId)
    if (!pendingUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const userRoles = auth.getUserRoles().filter(ur => ur.userId === userId).map(ur => ur.role)
    const isClassLead = userRoles.includes('class_lead')
    
    // If the pending user is a class lead, only administrators can approve them
    if (isClassLead && !req.user.roles.includes('administrator')) {
      return res.status(403).json({ 
        error: 'Only administrators can approve class leads',
        details: 'Class lead approvals require administrator privileges'
      })
    }
    
    const approvedUser = await auth.approveUser(userId, approverId)
    
    res.json({
      message: 'User approved successfully',
      user: approvedUser
    })
  } catch (error) {
    console.error('Error approving user:', error)
    res.status(400).json({ error: error.message })
  }
})

// Reject user (admin and class_lead)
router.post('/reject/:userId', passport.authenticate('jwt', { session: false }), auth.requireRole(['administrator', 'class_lead']), async (req, res) => {
  try {
    const { userId } = req.params
    const { reason } = req.body
    const rejectorId = req.user.id
    
    const rejectedUser = await auth.rejectUser(userId, rejectorId, reason)
    
    res.json({
      message: 'User rejected successfully',
      user: rejectedUser
    })
  } catch (error) {
    console.error('Error rejecting user:', error)
    res.status(400).json({ error: error.message })
  }
})

// Get user notifications
router.get('/notifications', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const userId = req.user.id
    const notifications = auth.getUserNotifications(userId)
    
    res.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Mark notification as read
router.post('/notifications/:notificationId/read', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { notificationId } = req.params
    const userId = req.user.id
    
    const notification = auth.markNotificationAsRead(notificationId, userId)
    
    res.json({
      message: 'Notification marked as read',
      notification
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(400).json({ error: error.message })
  }
})

export default router