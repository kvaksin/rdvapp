// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function fetchSlots(from?: any, to?: any) {
  const url = new URL(`${API_BASE}/api/slots`)
  if (from) url.searchParams.set('from', from)
  if (to) url.searchParams.set('to', to)
  const res = await fetch(url.toString())
  return res.json()
}

export async function createTimeframe(start: any, end: any) {
  const res = await fetch(`${API_BASE}/api/slots/timeframe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start, end }) })
  return res.json()
}

export async function fetchBookings() {
  const res = await fetch(`${API_BASE}/api/bookings`)
  return res.json()
}

export async function bookSlot(slotId: any, childName: any) {
  const res = await fetch(`${API_BASE}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slotId, childName }) })
  return res.json()
}

export async function cancelBooking(id: any) {
  const res = await fetch(`${API_BASE}/api/bookings/${id}`, { method: 'DELETE' })
  return res.json()
}

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/api/config`)
  return res.json()
}

export async function updateConfig(cfg:any) {
  const res = await fetch(`${API_BASE}/api/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) })
  return res.json()
}

export async function deleteSlot(id:any) {
  const res = await fetch(`${API_BASE}/api/slots/${id}`, { method: 'DELETE' })
  return res.json()
}

export async function resetAll(confirm:boolean) {
  const res = await fetch(`${API_BASE}/api/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm }) })
  return res.json()
}

export async function ping() {
  const res = await fetch(`${API_BASE}/api/ping`)
  return res.json()
}

export async function fetchDocs() {
  const res = await fetch(`${API_BASE}/api/docs`)
  return res.json()
}
