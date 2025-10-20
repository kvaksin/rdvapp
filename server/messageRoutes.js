import express from 'express'
import * as auth from './auth.js'

const router = express.Router()

// Get messages for current user
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user
    const limit = parseInt(req.query.limit) || 20
    
    // Get user's classes
    const userClasses = auth.getUserClasses().filter(uc => uc.userId === currentUser.id)
    
    const messages = auth.getMessagesForUser(currentUser.id, currentUser.roles, userClasses, limit)
    res.json(messages)
  } catch (error) {
    console.error('Error getting messages:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

// Send message from admin to classes
router.post('/admin-to-class', auth.authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user
    const { subject, message, classIds } = req.body
    
    // Only administrators can send admin-to-class messages
    if (!currentUser.roles.includes('administrator')) {
      return res.status(403).json({ error: 'Only administrators can send messages to classes' })
    }
    
    if (!message || !classIds || classIds.length === 0) {
      return res.status(400).json({ error: 'Message and class selection are required' })
    }
    
    // Get all users in the selected classes (parents and class leads)
    const userClasses = auth.getUserClasses()
    const recipients = userClasses
      .filter(uc => classIds.includes(uc.classId))
      .map(uc => uc.userId)
    
    // Also include class leads who manage these classes
    const allUserRoles = auth.getUserRoles()
    const classLeads = allUserRoles
      .filter(ur => ur.role === 'class_lead')
      .map(ur => ur.userId)
    
    const classLeadClasses = userClasses.filter(uc => classLeads.includes(uc.userId))
    const relevantClassLeads = classLeadClasses
      .filter(uc => classIds.includes(uc.classId))
      .map(uc => uc.userId)
    
    const allRecipients = [...new Set([...recipients, ...relevantClassLeads])]
    
    const messageData = {
      senderId: currentUser.id,
      senderName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      senderRole: 'administrator',
      type: 'admin_to_class',
      subject,
      message,
      classIds,
      recipients: allRecipients
    }
    
    const newMessage = auth.addMessage(messageData)
    
    // Create notifications for all recipients
    const notifications = auth.getNotifications()
    const classes = await auth.getClasses()
    const classNames = classes.filter(c => classIds.includes(c.id)).map(c => c.name).join(', ')
    
    allRecipients.forEach(recipientId => {
      if (recipientId !== currentUser.id) { // Don't notify sender
        notifications.push({
          id: auth.generateId(),
          type: 'new_message',
          recipientId,
          senderId: currentUser.id,
          senderName: messageData.senderName,
          message: `New message from administrator: ${subject || message.substring(0, 50)}`,
          messageId: newMessage.id,
          classNames,
          isRead: false,
          createdAt: new Date().toISOString(),
          status: 'pending'
        })
      }
    })
    
    auth.saveNotifications(notifications)
    
    res.json({ message: 'Message sent successfully', messageId: newMessage.id })
  } catch (error) {
    console.error('Error sending admin message:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Send message from class lead to parents
router.post('/class-lead-to-parents', auth.authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user
    const { subject, message, childIds, classIds } = req.body
    
    // Only class leads can send messages to parents
    if (!currentUser.roles.includes('class_lead') && !currentUser.roles.includes('administrator')) {
      return res.status(403).json({ error: 'Only class leads can send messages to parents' })
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }
    
    let recipients = []
    let targetClassIds = classIds || []
    
    if (childIds && childIds.length > 0) {
      // Send to parents of specific children
      const parentChildRelationships = auth.getParentChildRelationships()
      const children = auth.getChildren()
      
      recipients = childIds.flatMap(childId => {
        const child = children.find(c => c.id === childId)
        if (child && !targetClassIds.includes(child.classId)) {
          targetClassIds.push(child.classId)
        }
        return parentChildRelationships
          .filter(rel => rel.childId === childId)
          .map(rel => rel.parentId)
      })
    } else if (classIds && classIds.length > 0) {
      // Send to all parents in selected classes
      const userClasses = auth.getUserClasses()
      const allUserRoles = auth.getUserRoles()
      const parentIds = allUserRoles
        .filter(ur => ur.role === 'parent')
        .map(ur => ur.userId)
      
      recipients = userClasses
        .filter(uc => classIds.includes(uc.classId) && parentIds.includes(uc.userId))
        .map(uc => uc.userId)
    } else {
      return res.status(400).json({ error: 'Either children or classes must be selected' })
    }
    
    recipients = [...new Set(recipients)] // Remove duplicates
    
    const messageData = {
      senderId: currentUser.id,
      senderName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      senderRole: 'class_lead',
      type: 'class_lead_to_parents',
      subject,
      message,
      classIds: targetClassIds,
      childIds: childIds || [],
      recipients
    }
    
    const newMessage = auth.addMessage(messageData)
    
    // Create notifications for all parent recipients
    const notifications = auth.getNotifications()
    const classes = await auth.getClasses()
    const classNames = classes.filter(c => targetClassIds.includes(c.id)).map(c => c.name).join(', ')
    
    recipients.forEach(recipientId => {
      notifications.push({
        id: auth.generateId(),
        type: 'new_message',
        recipientId,
        senderId: currentUser.id,
        senderName: messageData.senderName,
        message: `New message from class lead: ${subject || message.substring(0, 50)}`,
        messageId: newMessage.id,
        classNames,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'pending'
      })
    })
    
    auth.saveNotifications(notifications)
    
    res.json({ message: 'Message sent successfully', messageId: newMessage.id })
  } catch (error) {
    console.error('Error sending class lead message:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Send message from parent to class lead
router.post('/parent-to-class-lead', auth.authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user
    const { subject, message, classIds } = req.body
    
    // Only parents can send messages to class leads
    if (!currentUser.roles.includes('parent')) {
      return res.status(403).json({ error: 'Only parents can send messages to class leads' })
    }
    
    if (!message || !classIds || classIds.length === 0) {
      return res.status(400).json({ error: 'Message and class selection are required' })
    }
    
    // Get class leads for the selected classes
    const userClasses = auth.getUserClasses()
    const allUserRoles = auth.getUserRoles()
    const classLeadIds = allUserRoles
      .filter(ur => ur.role === 'class_lead')
      .map(ur => ur.userId)
    
    const recipients = userClasses
      .filter(uc => classIds.includes(uc.classId) && classLeadIds.includes(uc.userId))
      .map(uc => uc.userId)
    
    // Also include administrators
    const adminIds = allUserRoles
      .filter(ur => ur.role === 'administrator')
      .map(ur => ur.userId)
    
    const allRecipients = [...new Set([...recipients, ...adminIds])]
    
    const messageData = {
      senderId: currentUser.id,
      senderName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      senderRole: 'parent',
      type: 'parent_to_class_lead',
      subject,
      message,
      classIds,
      recipients: allRecipients
    }
    
    const newMessage = auth.addMessage(messageData)
    
    // Create notifications for class leads and admins
    const notifications = auth.getNotifications()
    const classes = await auth.getClasses()
    const classNames = classes.filter(c => classIds.includes(c.id)).map(c => c.name).join(', ')
    
    allRecipients.forEach(recipientId => {
      notifications.push({
        id: auth.generateId(),
        type: 'new_message',
        recipientId,
        senderId: currentUser.id,
        senderName: messageData.senderName,
        message: `New message from parent: ${subject || message.substring(0, 50)}`,
        messageId: newMessage.id,
        classNames,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'pending'
      })
    })
    
    auth.saveNotifications(notifications)
    
    res.json({ message: 'Message sent successfully', messageId: newMessage.id })
  } catch (error) {
    console.error('Error sending parent message:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Mark message as read
router.put('/:messageId/read', auth.authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params
    const currentUser = req.user
    
    const message = auth.markMessageAsRead(messageId, currentUser.id)
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }
    
    res.json({ message: 'Message marked as read' })
  } catch (error) {
    console.error('Error marking message as read:', error)
    res.status(500).json({ error: 'Failed to mark message as read' })
  }
})

// Get children for class lead (to select message recipients)
router.get('/children-for-messaging', auth.authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user
    
    if (!currentUser.roles.includes('class_lead') && !currentUser.roles.includes('administrator')) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    let children = []
    
    if (currentUser.roles.includes('administrator')) {
      // Admins can see all children
      children = auth.getChildren()
    } else {
      // Class leads see children in their classes
      const userClasses = auth.getUserClasses().filter(uc => uc.userId === currentUser.id)
      const classIds = userClasses.map(uc => uc.classId)
      children = auth.getChildren().filter(child => classIds.includes(child.classId))
    }
    
    // Get parent information for each child
    const parentChildRelationships = auth.getParentChildRelationships()
    const users = auth.getUsers()
    const classes = await auth.getClasses()
    
    const enrichedChildren = children.map(child => {
      const parentRelationships = parentChildRelationships.filter(rel => rel.childId === child.id)
      const parents = parentRelationships.map(rel => {
        const parent = users.find(u => u.id === rel.parentId)
        return parent ? {
          id: parent.id,
          name: `${parent.firstName || ''} ${parent.lastName || ''}`.trim(),
          email: parent.email
        } : null
      }).filter(Boolean)
      
      const childClass = classes.find(c => c.id === child.classId)
      
      return {
        ...child,
        parents,
        className: childClass ? childClass.name : 'Unknown Class'
      }
    })
    
    res.json(enrichedChildren)
  } catch (error) {
    console.error('Error getting children for messaging:', error)
    res.status(500).json({ error: 'Failed to get children' })
  }
})

export default router