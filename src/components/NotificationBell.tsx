import React, { useState, useEffect, useRef } from 'react'
import { FormattedMessage, FormattedDate } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { useAuth, authenticatedFetch } from '../contexts/AuthContext'
import { Notification } from '../types/api'

const NotificationBell = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
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

  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read
    await markAsRead(notification.id)
    
    // Navigate to appropriate page based on notification type
    switch (notification.type) {
      case 'user_approval_request':
        // Navigate to user approval page where admin/class_lead can approve/reject users
        navigate('/user-approval')
        break
      
      case 'class_assignment_request':
        // Navigate to admin page where admin can manage class assignment requests
        navigate('/admin')
        break
      
      case 'new_message':
        // Navigate to communication page and highlight the specific message
        if (notification.messageId) {
          navigate(`/communication?messageId=${notification.messageId}`)
        } else {
          navigate('/communication')
        }
        break
      
      case 'user_approved':
      case 'user_rejected':
      case 'class_assignment_approved':
      case 'class_assignment_rejected':
      default:
        // For informational notifications, just mark as read (no navigation needed)
        break
    }
    
    // Close the notification dropdown
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_approval_request':
        return '👤'
      case 'user_approved':
        return '✅'
      case 'user_rejected':
        return '❌'
      case 'class_assignment_request':
        return '📋'
      case 'class_assignment_approved':
        return '✅'
      case 'class_assignment_rejected':
        return '❌'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'user_approval_request':
      case 'class_assignment_request':
        return 'text-blue-400'
      case 'user_approved':
      case 'class_assignment_approved':
        return 'text-green-400'
      case 'user_rejected':
      case 'class_assignment_rejected':
        return 'text-red-400'
      default:
        return 'text-gray-300'
    }
  }

  const isActionableNotification = (type: string) => {
    return ['user_approval_request', 'class_assignment_request'].includes(type)
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
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              <FormattedMessage id="notifications.title" defaultMessage="Notifications" />
            </h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400 mt-1">
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
              <div className="p-4 text-center text-gray-400">
                <FormattedMessage id="notifications.loading" defaultMessage="Loading..." />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <FormattedMessage id="notifications.empty" defaultMessage="No notifications" />
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-700 transition-colors ${
                    !notification.isRead ? 'bg-purple-900/20' : ''
                  } ${isActionableNotification(notification.type) 
                      ? 'hover:bg-gray-700 cursor-pointer' 
                      : 'hover:bg-gray-750 cursor-default'
                    }`}
                  onClick={() => handleNotificationClick(notification)}
                  title={isActionableNotification(notification.type) 
                    ? 'Click to go to pending task' 
                    : 'Informational notification'
                  }
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
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
                        <p className="text-xs text-gray-500 mt-1">
                          <FormattedMessage 
                            id="notifications.role" 
                            defaultMessage="Role: {role}"
                            values={{ role: notification.userRole }}
                          />
                        </p>
                      )}
                      {isActionableNotification(notification.type) && (
                        <p className="text-xs text-blue-400 mt-1 font-medium">
                          Click to view pending task →
                        </p>
                      )}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full absolute right-2 top-4"></div>
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