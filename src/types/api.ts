export interface Class {
  id: string
  name: string
  description?: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Slot {
  id: string
  start: string
  end: string
  createdAt: string
  removed: boolean
  booked: boolean
  classId?: string
  class?: Class
}

export interface Booking {
  id: string
  slotId: string
  childName: string
  bookedAt: string
  cancelled: boolean
  originalSlotStart: string
}

export interface Notification {
  id: string
  type: 'user_approval_request' | 'user_approved' | 'user_rejected' | 'class_assignment_request' | 'class_assignment_approved' | 'class_assignment_rejected' | 'new_message'
  recipientId: string
  senderId: string
  senderName?: string
  senderEmail?: string
  message: string
  messageId?: string // For new_message notifications
  classNames?: string
  userRole?: string
  classAssignments?: Array<{
    classId: string
    childName?: string
  }>
  isRead: boolean
  createdAt: string
  status: string
}
