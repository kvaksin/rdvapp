export interface Slot {
  id: string
  start: string
  end: string
  createdAt: string
  removed: boolean
  booked: boolean
}

export interface Booking {
  id: string
  slotId: string
  childName: string
  bookedAt: string
  cancelled: boolean
  originalSlotStart: string
}
