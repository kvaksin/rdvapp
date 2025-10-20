import React, { useState, useEffect } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useAuth } from '../contexts/AuthContext'
import { authenticatedFetch } from '../contexts/AuthContext'

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
  const [messages, setMessages] = useState<Message[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSendMessage, setShowSendMessage] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

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

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load messages
      const messagesRes = await authenticatedFetch(`${baseUrl}/api/messages`)
      if (messagesRes.ok) {
        setMessages(await messagesRes.json())
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

  const sendMessage = async () => {
    try {
      setSendingMessage(true)
      setError(null)

      let endpoint = ''
      let payload: any = {
        subject: subject.trim() || undefined,
        message: messageText.trim()
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
      setShowSendMessage(false)

      // Reload messages
      await loadData()
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
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
                       sendingMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendingMessage ? (
                <FormattedMessage id="common.sending" defaultMessage="Sending..." />
              ) : (
                <FormattedMessage id="communication.sendMessage" defaultMessage="Send Message" />
              )}
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

              return (
                <div
                  key={message.id}
                  className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                    isUnread ? 'border-blue-500' : 'border-gray-600'
                  } hover:bg-gray-750 transition-colors cursor-pointer`}
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
                  </div>

                  {message.subject && (
                    <h4 className="font-medium text-white mb-2">{message.subject}</h4>
                  )}

                  <p className="text-gray-300 whitespace-pre-wrap">{message.message}</p>
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