import React, { useState, useEffect, useRef } from 'react'
import { FormattedMessage, FormattedDate } from 'react-intl'
import { useAuth, authenticatedFetch } from '../contexts/AuthContext'

interface Notification {
  id: string
  type: string
  recipientId: string
  senderId: string
  senderEmail?: string
  userRole?: string
  classAssignments?: Array<{
    id: string
    classId: string
    childName?: string
    createdAt: string
  }>
  message: string
  isRead: boolean
  createdAt: string
  status: string
}

const NotificationBell = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/auth/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await authenticatedFetch(`/auth/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_approval_request':
        return '👤'
      case 'user_approved':
        return '✅'
      case 'user_rejected':
        return '❌'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'user_approval_request':
        return 'text-blue-600'
      case 'user_approved':
        return 'text-green-600'
      case 'user_rejected':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              <FormattedMessage id="notifications.title" defaultMessage="Notifications" />
            </h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                <FormattedMessage 
                  id="notifications.unread.count" 
                  defaultMessage="{count} unread"
                  values={{ count: unreadCount }}
                />
              </p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <FormattedMessage id="notifications.loading" defaultMessage="Loading..." />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FormattedMessage id="notifications.empty" defaultMessage="No notifications" />
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <FormattedDate 
                          value={new Date(notification.createdAt)}
                          year="numeric"
                          month="short"
                          day="numeric"
                          hour="2-digit"
                          minute="2-digit"
                        />
                      </p>
                      {notification.userRole && (
                        <p className="text-xs text-gray-400 mt-1">
                          <FormattedMessage 
                            id="notifications.role" 
                            defaultMessage="Role: {role}"
                            values={{ role: notification.userRole }}
                          />
                        </p>
                      )}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full absolute right-2 top-4"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={fetchNotifications}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <FormattedMessage id="notifications.refresh" defaultMessage="Refresh" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell