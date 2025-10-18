import { authenticatedFetch } from '../contexts/AuthContext'

// Empty string for same-origin requests (when using Vite proxy)
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchSlots(from?: any, to?: any, classId?: string) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/slots', baseUrl)
    if (from) url.searchParams.set('from', from)
    if (to) url.searchParams.set('to', to)
    if (classId) url.searchParams.set('classId', classId)
    const res = await authenticatedFetch(url.toString(), {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    })
    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Failed to fetch slots: ${error}`)
    }
    return res.json()
  } catch (error) {
    console.error('Error fetching slots:', error)
    throw error
  }
}

export async function createTimeframe(start: any, end: any, classId?: string) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/slots/timeframe', baseUrl)
    console.log('Creating timeframe:', { start, end, classId, url: url.toString() })
    
    const res = await authenticatedFetch(url.toString(), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ start, end, classId }),
      cache: 'no-store'
    })
    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Failed to create timeframe: ${error}`)
    }
    const data = await res.json()
    console.log('Timeframe created:', data)
    return data
  } catch (error) {
    console.error('Error creating timeframe:', error)
    throw error
  }
}

export async function fetchBookings() {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/bookings', baseUrl)
    const res = await authenticatedFetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error fetching bookings:', error)
    throw error
  }
}

export async function bookSlot(slotId: any, childName: any) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/bookings', baseUrl)
    const res = await authenticatedFetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, childName })
    })
    if (!res.ok) {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        throw new Error(data.error || data.message || `HTTP ${res.status}`)
      } catch {
        throw new Error(text || `HTTP ${res.status}`)
      }
    }
    return res.json()
  } catch (error) {
    console.error('Error booking slot:', error)
    throw error
  }
}

export async function cancelBooking(id: any) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL(`/api/bookings/${id}`, baseUrl)
    const res = await authenticatedFetch(url.toString(), { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error canceling booking:', error)
    throw error
  }
}

export async function fetchConfig() {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/config', baseUrl)
    const res = await authenticatedFetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error fetching config:', error)
    throw error
  }
}

export async function updateConfig(cfg:any) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/config', baseUrl)
    const res = await authenticatedFetch(url.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error updating config:', error)
    throw error
  }
}

export async function deleteSlot(id:any) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL(`/api/slots/${id}`, baseUrl)
    const res = await authenticatedFetch(url.toString(), { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error deleting slot:', error)
    throw error
  }
}

export async function resetAll(confirm:boolean) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/reset', baseUrl)
    const res = await authenticatedFetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error resetting:', error)
    throw error
  }
}

export async function resetClass(classId: string) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/reset-class', baseUrl)
    const res = await authenticatedFetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, confirm: true })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error resetting class schedule:', error)
    throw error
  }
}

export async function fetchClasses() {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/classes', baseUrl)
    const res = await authenticatedFetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error fetching classes:', error)
    throw error
  }
}

export async function createClass(data: { name: string; description?: string; color: string }) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/classes', baseUrl)
    const res = await authenticatedFetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error creating class:', error)
    throw error
  }
}

export async function deleteClass(id: string) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL(`/api/classes/${id}`, baseUrl)
    const res = await authenticatedFetch(url.toString(), { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error deleting class:', error)
    throw error
  }
}

export async function ping() {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/ping', baseUrl)
    const res = await authenticatedFetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error pinging server:', error)
    throw error
  }
}

export async function fetchDocs() {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/docs', baseUrl)
    const res = await authenticatedFetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error fetching docs:', error)
    throw error
  }
}
