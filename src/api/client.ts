// Empty string for same-origin requests (when using Vite proxy)
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchSlots(from?: any, to?: any) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/slots', baseUrl)
    if (from) url.searchParams.set('from', from)
    if (to) url.searchParams.set('to', to)
    const res = await fetch(url.toString(), {
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

export async function createTimeframe(start: any, end: any) {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/slots/timeframe', baseUrl)
    console.log('Creating timeframe:', { start, end, url: url.toString() })
    
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ start, end }),
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
    const res = await fetch(url.toString())
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
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, childName })
    })
    if (!res.ok) throw new Error(await res.text())
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
    const res = await fetch(url.toString(), { method: 'DELETE' })
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
    const res = await fetch(url.toString())
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
    const res = await fetch(url.toString(), {
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
    const res = await fetch(url.toString(), { method: 'DELETE' })
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
    const res = await fetch(url.toString(), {
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

export async function ping() {
  try {
    const baseUrl = window.location.origin + (API_BASE || '')
    const url = new URL('/api/ping', baseUrl)
    const res = await fetch(url.toString())
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
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (error) {
    console.error('Error fetching docs:', error)
    throw error
  }
}
