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
