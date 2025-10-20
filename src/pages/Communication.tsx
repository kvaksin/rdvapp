import React, { useState, useEffect, useRef } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authenticatedFetch } from '../contexts/AuthContext'

interface Attachment {
  id: string
  originalName: string
  filename: string
  mimetype: string
  size: number
  uploadedAt: string
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  type: 'admin_to_class' | 'class_lead_to_parents' | 'parent_to_class_lead'
  subject?: string
  message: string
  classIds: string[]
  childIds: string[]
  recipients: string[]
  createdAt: string
  readBy: string[]
  attachments?: Attachment[]
}

interface Comment {
  id: string
  messageId: string
  senderId: string
  senderName: string
  senderRole: string
  comment: string
  createdAt: string
}

interface Class {
  id: string
  name: string
  description?: string
}

interface Child {
  id: string
  name: string
  firstName: string
  lastName: string
  classId: string
  className: string
  parents: Array<{
    id: string
    name: string
    email: string
  }>
}

const Communication: React.FC = () => {
  const { user } = useAuth()
  const intl = useIntl()
  const [searchParams] = useSearchParams()
  const highlightedMessageId = searchParams.get('messageId')
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSendMessage, setShowSendMessage] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [comments, setComments] = useState<{ [messageId: string]: Comment[] }>({})
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<{ [messageId: string]: string }>({})
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set())
  const [submittingComment, setSubmittingComment] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Get default message type based on user role
  const getDefaultMessageType = (): 'admin_to_class' | 'class_lead_to_parents' | 'parent_to_class_lead' => {
    if (user?.roles.includes('administrator')) {
      return 'admin_to_class'
    } else if (user?.roles.includes('class_lead')) {
      return 'class_lead_to_parents'
    } else if (user?.roles.includes('parent')) {
      return 'parent_to_class_lead'
    }
    return 'admin_to_class' // fallback
  }

  // Message composition state
  const [messageType, setMessageType] = useState<'admin_to_class' | 'class_lead_to_parents' | 'parent_to_class_lead'>(getDefaultMessageType())
  const [subject, setSubject] = useState('')
  const [messageText, setMessageText] = useState('')
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])
  const [recipientMode, setRecipientMode] = useState<'byClass' | 'byChildren'>('byClass')

  const baseUrl = window.location.origin

  useEffect(() => {
    loadData()
  }, [])

  // Scroll to highlighted message after messages load
  useEffect(() => {
    if (highlightedMessageId && messages.length > 0) {
      const messageElement = messageRefs.current[highlightedMessageId]
      if (messageElement) {
        // Scroll to the message with some offset
        messageElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        
        // Mark as read if it's unread
        const message = messages.find(m => m.id === highlightedMessageId)
        if (message && !message.readBy?.includes(user?.id || '')) {
          markAsRead(highlightedMessageId)
        }
      }
    }
  }, [highlightedMessageId, messages, user?.id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load messages
      const messagesRes = await authenticatedFetch(`${baseUrl}/api/messages`)
      if (messagesRes.ok) {
        const loadedMessages = await messagesRes.json()
        setMessages(loadedMessages)
        
        // Load comment counts for all messages
        await loadCommentCounts(loadedMessages)
      }

      // Load classes
      const classesRes = await fetch(`${baseUrl}/api/classes/public`)
      if (classesRes.ok) {
        setClasses(await classesRes.json())
      }

      // Load children for messaging (if class lead or admin)
      if (user?.roles.includes('class_lead') || user?.roles.includes('administrator')) {
        const childrenRes = await authenticatedFetch(`${baseUrl}/api/messages/children-for-messaging`)
        if (childrenRes.ok) {
          setChildren(await childrenRes.json())
        }
      }
    } catch (err: any) {
      console.error('Error loading communication data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadCommentCounts = async (messagesToLoad: Message[]) => {
    try {
      const commentPromises = messagesToLoad.map(async (message) => {
        try {
          const res = await authenticatedFetch(`${baseUrl}/api/messages/${message.id}/comments`)
          if (res.ok) {
            const messageComments = await res.json()
            return { messageId: message.id, comments: messageComments }
          }
        } catch (err) {
          console.error(`Error loading comments for message ${message.id}:`, err)
        }
        return { messageId: message.id, comments: [] }
      })

      const commentResults = await Promise.all(commentPromises)
      const commentsMap: { [messageId: string]: Comment[] } = {}
      
      commentResults.forEach(result => {
        commentsMap[result.messageId] = result.comments
      })
      
      setComments(commentsMap)
    } catch (err) {
      console.error('Error loading comment counts:', err)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    const invalidFiles = files.filter(file => file.size > maxSize)
    
    if (invalidFiles.length > 0) {
      setError(`Some files are too large. Maximum file size is 5MB. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }
    
    // Limit total files to 5
    const totalFiles = selectedFiles.length + files.length
    if (totalFiles > 5) {
      setError('Maximum 5 files allowed per message')
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    // Clear the input so the same file can be selected again
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (): Promise<Attachment[]> => {
    if (selectedFiles.length === 0) return []
    
    const formData = new FormData()
    selectedFiles.forEach(file => {
      formData.append('attachments', file)
    })
    
    const uploadRes = await authenticatedFetch(`${baseUrl}/api/uploads/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!uploadRes.ok) {
      const errorData = await uploadRes.json()
      throw new Error(errorData.error || 'Failed to upload files')
    }
    
    const { attachments } = await uploadRes.json()
    return attachments
  }

  const sendMessage = async () => {
    try {
      setSendingMessage(true)
      setUploadingFiles(true)
      setError(null)

      // Upload files first if any are selected
      let attachments: Attachment[] = []
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles()
      }

      let endpoint = ''
      let payload: any = {
        subject: subject.trim() || undefined,
        message: messageText.trim(),
        attachments
      }

      if (messageType === 'admin_to_class') {
        endpoint = '/api/messages/admin-to-class'
        payload.classIds = selectedClasses
      } else if (messageType === 'class_lead_to_parents') {
        endpoint = '/api/messages/class-lead-to-parents'
        if (recipientMode === 'byChildren') {
          payload.childIds = selectedChildren
        } else {
          payload.classIds = selectedClasses
        }
      } else if (messageType === 'parent_to_class_lead') {
        endpoint = '/api/messages/parent-to-class-lead'
        payload.classIds = selectedClasses
      }

      const res = await authenticatedFetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      // Reset form
      setMessageType(getDefaultMessageType())
      setSubject('')
      setMessageText('')
      setSelectedClasses([])
      setSelectedChildren([])
      setRecipientMode('byClass')
      setSelectedFiles([])
      setShowSendMessage(false)

      // Reload messages
      await loadData()
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
      setUploadingFiles(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await authenticatedFetch(`${baseUrl}/api/messages/${messageId}/read`, {
        method: 'PUT'
      })
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, readBy: [...(msg.readBy || []), user?.id].filter((id): id is string => Boolean(id)) }
          : msg
      ))
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'admin_to_class': return '👨‍💼'
      case 'class_lead_to_parents': return '👨‍🏫'
      case 'parent_to_class_lead': return '👨‍👩‍👧‍👦'
      default: return '💬'
    }
  }

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'admin_to_class': return intl.formatMessage({ id: 'communication.adminMessage' })
      case 'class_lead_to_parents': return intl.formatMessage({ id: 'communication.classLeadMessage' })
      case 'parent_to_class_lead': return intl.formatMessage({ id: 'communication.parentMessage' })
      default: return intl.formatMessage({ id: 'communication.message' })
    }
  }

  const canSendMessages = () => {
    return user?.roles.includes('administrator') || 
           user?.roles.includes('class_lead') || 
           user?.roles.includes('parent')
  }

  const canDeleteMessage = (message: Message) => {
    return user?.roles.includes('administrator') || message.senderId === user?.id
  }

  const canDeleteComment = (comment: Comment) => {
    return user?.roles.includes('administrator') || comment.senderId === user?.id
  }

  const loadComments = async (messageId: string) => {
    if (loadingComments.has(messageId)) return

    try {
      setLoadingComments(prev => new Set(prev).add(messageId))
      const res = await authenticatedFetch(`${baseUrl}/api/messages/${messageId}/comments`)
      if (res.ok) {
        const messageComments = await res.json()
        setComments(prev => ({
          ...prev,
          [messageId]: messageComments
        }))
      }
    } catch (err) {
      console.error('Error loading comments:', err)
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageId)
        return newSet
      })
    }
  }

  const toggleCommentsExpanded = async (messageId: string) => {
    const isExpanded = expandedMessages.has(messageId)
    
    if (isExpanded) {
      setExpandedMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageId)
        return newSet
      })
    } else {
      setExpandedMessages(prev => new Set(prev).add(messageId))
      // Comments are already loaded during initial page load, so no need to reload
    }
  }

  const submitComment = async (messageId: string) => {
    const commentText = newComments[messageId]?.trim()
    if (!commentText || submittingComment.has(messageId)) return

    try {
      setSubmittingComment(prev => new Set(prev).add(messageId))
      const res = await authenticatedFetch(`${baseUrl}/api/messages/${messageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText })
      })

      if (res.ok) {
        const newComment = await res.json()
        setComments(prev => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), newComment]
        }))
        setNewComments(prev => ({
          ...prev,
          [messageId]: ''
        }))
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to add comment')
      }
    } catch (err: any) {
      console.error('Error submitting comment:', err)
      setError(err.message || 'Failed to add comment')
    } finally {
      setSubmittingComment(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageId)
        return newSet
      })
    }
  }

  const deleteComment = async (commentId: string, messageId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const res = await authenticatedFetch(`${baseUrl}/api/messages/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setComments(prev => ({
          ...prev,
          [messageId]: prev[messageId]?.filter(c => c.id !== commentId) || []
        }))
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to delete comment')
      }
    } catch (err: any) {
      console.error('Error deleting comment:', err)
      setError(err.message || 'Failed to delete comment')
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This will also delete all comments.')) return

    try {
      const res = await authenticatedFetch(`${baseUrl}/api/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId))
        setComments(prev => {
          const newComments = { ...prev }
          delete newComments[messageId]
          return newComments
        })
        setExpandedMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(messageId)
          return newSet
        })
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to delete message')
      }
    } catch (err: any) {
      console.error('Error deleting message:', err)
      setError(err.message || 'Failed to delete message')
    }
  }

  const getAvailableMessageTypes = () => {
    const types = []
    if (user?.roles.includes('administrator')) {
      types.push({ value: 'admin_to_class', label: intl.formatMessage({ id: 'communication.sendToClass' }) })
    }
    if (user?.roles.includes('class_lead') || user?.roles.includes('administrator')) {
      types.push({ value: 'class_lead_to_parents', label: intl.formatMessage({ id: 'communication.sendToParents' }) })
    }
    if (user?.roles.includes('parent')) {
      types.push({ value: 'parent_to_class_lead', label: intl.formatMessage({ id: 'communication.sendToClassLead' }) })
    }
    return types
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <FormattedMessage id="common.loading" defaultMessage="Loading..." />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            <FormattedMessage id="communication.title" defaultMessage="Communication" />
          </h1>
          <p className="text-gray-400 mt-1">
            <FormattedMessage id="communication.subtitle" defaultMessage="Send and receive messages" />
          </p>
        </div>
        
        {canSendMessages() && (
          <button
            onClick={() => setShowSendMessage(!showSendMessage)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <FormattedMessage id="communication.newMessage" defaultMessage="New Message" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-100">
          {error}
        </div>
      )}

      {/* Send Message Form */}
      {showSendMessage && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            <FormattedMessage id="communication.composeMessage" defaultMessage="Compose Message" />
          </h3>

          {/* Message Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="communication.messageType" defaultMessage="Message Type" />
            </label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getAvailableMessageTypes().map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="communication.subject" defaultMessage="Subject" />
              <span className="text-gray-500 ml-1">
                (<FormattedMessage id="common.optional" defaultMessage="optional" />)
              </span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={intl.formatMessage({ id: 'communication.subjectPlaceholder' })}
            />
          </div>

          {/* Recipients Selection */}
          {(messageType === 'admin_to_class' || messageType === 'parent_to_class_lead') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FormattedMessage id="communication.selectClasses" defaultMessage="Select Classes" />
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {classes.map(cls => (
                  <label key={cls.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses([...selectedClasses, cls.id])
                        } else {
                          setSelectedClasses(selectedClasses.filter(id => id !== cls.id))
                        }
                      }}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-white">{cls.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {messageType === 'class_lead_to_parents' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FormattedMessage id="communication.selectRecipients" defaultMessage="Select Recipients" />
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientMode('byClass')
                      setSelectedChildren([])
                    }}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      recipientMode === 'byClass'
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <FormattedMessage id="communication.byClass" defaultMessage="By Class" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientMode('byChildren')
                      setSelectedClasses([])
                    }}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      recipientMode === 'byChildren'
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <FormattedMessage id="communication.byChildren" defaultMessage="By Children" />
                  </button>
                </div>
              </div>

              {recipientMode === 'byClass' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FormattedMessage id="communication.selectClasses" defaultMessage="Select Classes" />
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {classes.map(cls => (
                      <label key={cls.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses([...selectedClasses, cls.id])
                            } else {
                              setSelectedClasses(selectedClasses.filter(id => id !== cls.id))
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-white">{cls.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {recipientMode === 'byChildren' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FormattedMessage id="communication.selectChildren" defaultMessage="Select Children" />
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {children.map(child => (
                      <label key={child.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedChildren.includes(child.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChildren([...selectedChildren, child.id])
                            } else {
                              setSelectedChildren(selectedChildren.filter(id => id !== child.id))
                            }
                          }}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-2">
                          <div className="text-white">{child.firstName} {child.lastName}</div>
                          <div className="text-sm text-gray-400">
                            {child.className} • {child.parents.map(p => p.name).join(', ')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="communication.message" defaultMessage="Message" /> *
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={intl.formatMessage({ id: 'communication.messagePlaceholder' })}
              required
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FormattedMessage id="communication.attachments" defaultMessage="Attachments" />
              <span className="text-gray-500 ml-1">
                (<FormattedMessage id="common.optional" defaultMessage="optional" />, max 5MB per file, 5 files total)
              </span>
            </label>
            
            {/* File Input */}
            <div className="mb-3">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  file:cursor-pointer cursor-pointer"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              />
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Selected files:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-white text-sm truncate">{file.name}</span>
                      <span className="text-gray-400 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowSendMessage(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <FormattedMessage id="common.cancel" defaultMessage="Cancel" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!messageText.trim() || 
                       (messageType === 'admin_to_class' && selectedClasses.length === 0) ||
                       (messageType === 'parent_to_class_lead' && selectedClasses.length === 0) ||
                       (messageType === 'class_lead_to_parents' && 
                        ((recipientMode === 'byClass' && selectedClasses.length === 0) ||
                         (recipientMode === 'byChildren' && selectedChildren.length === 0))) ||
                       sendingMessage || uploadingFiles}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {(sendingMessage || uploadingFiles) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>
                {uploadingFiles ? (
                  <FormattedMessage id="communication.uploadingFiles" defaultMessage="Uploading files..." />
                ) : sendingMessage ? (
                  <FormattedMessage id="common.sending" defaultMessage="Sending..." />
                ) : (
                  <FormattedMessage id="communication.sendMessage" defaultMessage="Send Message" />
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          <FormattedMessage id="communication.recentMessages" defaultMessage="Recent Messages" />
          {messages.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({messages.length})
            </span>
          )}
        </h2>

        {messages.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-2">💬</div>
            <p className="text-gray-400">
              <FormattedMessage id="communication.noMessages" defaultMessage="No messages yet" />
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(message => {
              const isUnread = !message.readBy?.includes(user?.id || '')
              const classNames = classes
                .filter(c => message.classIds.includes(c.id))
                .map(c => c.name)
                .join(', ')

              const isHighlighted = highlightedMessageId === message.id
              
              return (
                <div
                  key={message.id}
                  ref={(el) => messageRefs.current[message.id] = el}
                  className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                    isHighlighted 
                      ? 'border-yellow-500 ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                      : isUnread 
                        ? 'border-blue-500' 
                        : 'border-gray-600'
                  } hover:bg-gray-750 transition-all duration-300 cursor-pointer`}
                  onClick={() => isUnread && markAsRead(message.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getMessageTypeIcon(message.type)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{message.senderName}</span>
                          <span className="text-xs text-gray-400">
                            {getMessageTypeLabel(message.type)}
                          </span>
                          {isUnread && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                              <FormattedMessage id="communication.new" defaultMessage="New" />
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatMessageDate(message.createdAt)}
                          {classNames && (
                            <span className="ml-2">• {classNames}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {canDeleteMessage(message) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMessage(message.id)
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {message.subject && (
                    <h4 className="font-medium text-white mb-2">{message.subject}</h4>
                  )}

                  <p className="text-gray-300 whitespace-pre-wrap mb-3">{message.message}</p>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-2">
                        <FormattedMessage id="communication.attachments" defaultMessage="Attachments" /> ({message.attachments.length})
                      </p>
                      <div className="space-y-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-white text-sm font-medium">{attachment.originalName}</p>
                                <p className="text-gray-400 text-xs">
                                  {(attachment.size / 1024 / 1024).toFixed(2)} MB • {attachment.mimetype}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`${baseUrl}/api/uploads/files/${attachment.filename}`}
                              download={attachment.originalName}
                              className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <FormattedMessage id="common.download" defaultMessage="Download" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCommentsExpanded(message.id)
                        }}
                        className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        <svg className={`w-4 h-4 transition-transform ${expandedMessages.has(message.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm">
                          {comments[message.id]?.length || 0} {(comments[message.id]?.length || 0) === 1 ? 'comment' : 'comments'}
                        </span>
                      </button>
                      
                      {loadingComments.has(message.id) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      )}
                    </div>

                    {expandedMessages.has(message.id) && (
                      <div className="space-y-3">
                        {/* Existing Comments */}
                        {comments[message.id]?.map(comment => (
                          <div key={comment.id} className="bg-gray-700 rounded-lg p-3 ml-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-white">{comment.senderName}</span>
                                <span className="text-xs text-gray-400">
                                  {formatMessageDate(comment.createdAt)}
                                </span>
                              </div>
                              
                              {canDeleteComment(comment) && (
                                <button
                                  onClick={() => deleteComment(comment.id, message.id)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                  title="Delete comment"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.comment}</p>
                          </div>
                        ))}

                        {/* Add Comment Form */}
                        <div className="ml-4">
                          <div className="flex space-x-2">
                            <textarea
                              value={newComments[message.id] || ''}
                              onChange={(e) => setNewComments(prev => ({
                                ...prev,
                                [message.id]: e.target.value
                              }))}
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={2}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                submitComment(message.id)
                              }}
                              disabled={!newComments[message.id]?.trim() || submittingComment.has(message.id)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              {submittingComment.has(message.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                'Post'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Communication