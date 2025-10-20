import express from 'express'
import * as auth from './auth.js'

const router = express.Router()

// Get children for current user (parents see their own, class leads and admins see all in their classes)
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const { classId } = req.query
    const currentUser = req.user
    
    let children = []
    
    if (currentUser.roles.includes('administrator')) {
      // Admins see all children
      children = auth.getChildren()
      if (classId) {
        children = children.filter(child => child.classId === classId)
      }
    } else if (currentUser.roles.includes('class_lead')) {
      // Class leads see children in their assigned classes
      const userAccessibleClasses = auth.getUserAccessibleClasses(currentUser.id)
      if (userAccessibleClasses === 'all') {
        children = auth.getChildren()
      } else {
        children = auth.getChildren().filter(child => 
          userAccessibleClasses.includes(child.classId)
        )
      }
      if (classId && userAccessibleClasses.includes(classId)) {
        children = children.filter(child => child.classId === classId)
      }
    } else if (currentUser.roles.includes('parent')) {
      // Parents see only their own children
      children = auth.getChildrenByParent(currentUser.id)
      if (classId) {
        children = children.filter(child => child.classId === classId)
      }
    }
    
    res.json(children)
  } catch (error) {
    console.error('Error getting children:', error)
    res.status(500).json({ error: 'Failed to get children' })
  }
})

// Get a specific child by ID
router.get('/:childId', auth.authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params
    const currentUser = req.user
    const children = auth.getChildren()
    const child = children.find(c => c.id === childId)
    
    if (!child) {
      return res.status(404).json({ error: 'Child not found' })
    }
    
    // Check permissions
    if (currentUser.roles.includes('administrator')) {
      // Admins can see any child
    } else if (currentUser.roles.includes('class_lead')) {
      // Class leads can see children in their classes
      const userAccessibleClasses = auth.getUserAccessibleClasses(currentUser.id)
      if (userAccessibleClasses !== 'all' && !userAccessibleClasses.includes(child.classId)) {
        return res.status(403).json({ error: 'Access denied to this child' })
      }
    } else if (currentUser.roles.includes('parent')) {
      // Parents can only see their own children
      if (child.parentId !== currentUser.id) {
        return res.status(403).json({ error: 'Access denied to this child' })
      }
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    res.json(child)
  } catch (error) {
    console.error('Error getting child:', error)
    res.status(500).json({ error: 'Failed to get child' })
  }
})

// Create a new child
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    const { name, firstName, lastName, birthday, classId, parentId } = req.body
    const currentUser = req.user
    
    // Support both old format (name) and new format (firstName/lastName)
    if ((!name && (!firstName || !lastName)) || !classId) {
      return res.status(400).json({ error: 'Child name (firstName/lastName or name) and classId are required' })
    }
    
    let targetParentId = parentId || currentUser.id
    
    // Permission checks
    if (currentUser.roles.includes('parent')) {
      // Parents can only create children for themselves
      if (parentId && parentId !== currentUser.id) {
        return res.status(403).json({ error: 'Parents can only add their own children' })
      }
      targetParentId = currentUser.id
      
      // Parents can request enrollment in any available class
      // Access validation will be handled by administrators/class leads
      // No class access restriction for parents creating their own children
    } else if (currentUser.roles.includes('class_lead')) {
      // Class leads can create children for parents in their classes
      const userAccessibleClasses = auth.getUserAccessibleClasses(currentUser.id)
      if (userAccessibleClasses !== 'all' && !userAccessibleClasses.includes(classId)) {
        return res.status(403).json({ error: 'Access denied to this class' })
      }
      
      if (!parentId) {
        return res.status(400).json({ error: 'Parent ID required when created by class lead' })
      }
    } else if (currentUser.roles.includes('administrator')) {
      // Admins can create children for any parent
      if (!parentId) {
        return res.status(400).json({ error: 'Parent ID required when created by administrator' })
      }
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    // Validate parent exists and is a parent
    const users = auth.getUsers()
    const userRoles = auth.getUserRoles()
    const parentUser = users.find(u => u.id === targetParentId)
    const parentUserRoles = userRoles.filter(ur => ur.userId === targetParentId)
    
    if (!parentUser || !parentUserRoles.some(ur => ur.role === 'parent')) {
      return res.status(400).json({ error: 'Invalid parent ID' })
    }
    
    // Prepare child data
    const childData = {
      parentId: targetParentId,
      classId
    }
    
    // Support both old and new formats
    if (firstName && lastName) {
      childData.firstName = firstName.trim()
      childData.lastName = lastName.trim()
      childData.name = `${firstName.trim()} ${lastName.trim()}` // Keep legacy name field
    } else if (name) {
      childData.name = name.trim()
      // Try to split legacy name into firstName/lastName
      const nameParts = name.trim().split(' ')
      childData.firstName = nameParts[0] || ''
      childData.lastName = nameParts.slice(1).join(' ') || ''
    }
    
    // Add birthday if provided
    if (birthday) {
      childData.birthday = birthday
    }
    
    const newChild = auth.addChild(childData)
    
    res.status(201).json(newChild)
  } catch (error) {
    console.error('Error creating child:', error)
    if (error.message === 'Child with this name already exists') {
      res.status(409).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to create child' })
    }
  }
})

// Update a child
router.put('/:childId', auth.authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params
    const { name, firstName, lastName, birthday, classId } = req.body
    const currentUser = req.user
    
    const children = auth.getChildren()
    const child = children.find(c => c.id === childId)
    
    if (!child) {
      return res.status(404).json({ error: 'Child not found' })
    }
    
    // Permission checks
    if (currentUser.roles.includes('parent')) {
      // Parents can only update their own children
      if (child.parentId !== currentUser.id) {
        return res.status(403).json({ error: 'Access denied to this child' })
      }
      
      // If changing class, check access to new class
      if (classId && classId !== child.classId) {
        if (!auth.hasAccessToClass(currentUser.id, classId)) {
          return res.status(403).json({ error: 'Access denied to new class' })
        }
      }
    } else if (currentUser.roles.includes('class_lead')) {
      // Class leads can update children in their classes
      const userAccessibleClasses = auth.getUserAccessibleClasses(currentUser.id)
      if (userAccessibleClasses !== 'all' && !userAccessibleClasses.includes(child.classId)) {
        return res.status(403).json({ error: 'Access denied to this child' })
      }
      
      // If changing class, check access to new class
      if (classId && classId !== child.classId) {
        if (userAccessibleClasses !== 'all' && !userAccessibleClasses.includes(classId)) {
          return res.status(403).json({ error: 'Access denied to new class' })
        }
      }
    } else if (!currentUser.roles.includes('administrator')) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const updates = {}
    
    // Handle name updates - support both old and new formats
    if (firstName !== undefined && lastName !== undefined) {
      updates.firstName = firstName.trim()
      updates.lastName = lastName.trim()
      updates.name = `${firstName.trim()} ${lastName.trim()}` // Keep legacy name field
    } else if (name !== undefined) {
      updates.name = name.trim()
      // Try to split legacy name into firstName/lastName
      const nameParts = name.trim().split(' ')
      updates.firstName = nameParts[0] || ''
      updates.lastName = nameParts.slice(1).join(' ') || ''
    }
    
    // Handle birthday update
    if (birthday !== undefined) {
      updates.birthday = birthday
    }
    
    if (classId !== undefined) updates.classId = classId
    
    const updatedChild = auth.updateChild(childId, updates)
    res.json(updatedChild)
  } catch (error) {
    console.error('Error updating child:', error)
    res.status(500).json({ error: 'Failed to update child' })
  }
})

// Delete a child
router.delete('/:childId', auth.authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params
    const currentUser = req.user
    
    const children = auth.getChildren()
    const child = children.find(c => c.id === childId)
    
    if (!child) {
      return res.status(404).json({ error: 'Child not found' })
    }
    
    // Permission checks
    if (currentUser.roles.includes('parent')) {
      // Parents can only delete their own children
      if (child.parentId !== currentUser.id) {
        return res.status(403).json({ error: 'Access denied to this child' })
      }
    } else if (currentUser.roles.includes('class_lead')) {
      // Class leads can delete children in their classes
      const userAccessibleClasses = auth.getUserAccessibleClasses(currentUser.id)
      if (userAccessibleClasses !== 'all' && !userAccessibleClasses.includes(child.classId)) {
        return res.status(403).json({ error: 'Access denied to this child' })
      }
    } else if (!currentUser.roles.includes('administrator')) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    auth.deleteChild(childId)
    res.json({ message: 'Child deleted successfully' })
  } catch (error) {
    console.error('Error deleting child:', error)
    if (error.message === 'Child not found') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to delete child' })
    }
  }
})

export default router