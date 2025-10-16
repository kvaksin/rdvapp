import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data')

// Helper to read JSON file
async function readJsonFile(filename) {
  try {
    const content = await fs.readFile(path.join(DATA_DIR, filename), 'utf8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

// Helper to write JSON file
async function writeJsonFile(filename, data) {
  await fs.writeFile(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    'utf8'
  )
}

// Config operations
async function getConfig() {
  const config = await readJsonFile('config.json')
  return config || {
    id: 'config',
    rdvDurationMinutes: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

async function updateConfig(data) {
  const config = await getConfig()
  const updatedConfig = {
    ...config,
    ...data,
    updatedAt: new Date().toISOString()
  }
  await writeJsonFile('config.json', updatedConfig)
  return updatedConfig
}

// Slot operations
async function getSlots(where = {}) {
  const slots = await readJsonFile('slots.json') || []
  return slots.filter(slot => {
    if (where.start?.gte && new Date(slot.start) < new Date(where.start.gte)) return false
    if (where.end?.lte && new Date(slot.end) > new Date(where.end.lte)) return false
    return true
  }).sort((a, b) => new Date(a.start) - new Date(b.start))
}

async function createSlot(data) {
  const slots = await getSlots()
  const newSlot = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString(),
    removed: false,
    booked: false
  }
  slots.push(newSlot)
  await writeJsonFile('slots.json', slots)
  return newSlot
}

async function updateSlot(id, data) {
  const slots = await getSlots()
  const index = slots.findIndex(slot => slot.id === id)
  if (index === -1) return null
  
  slots[index] = { ...slots[index], ...data }
  await writeJsonFile('slots.json', slots)
  return slots[index]
}

async function findSlot(id) {
  const slots = await getSlots()
  return slots.find(slot => slot.id === id)
}

// Booking operations
async function getBookings() {
  const bookings = await readJsonFile('bookings.json') || []
  return bookings.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt))
}

async function createBooking(data) {
  const bookings = await getBookings()
  const newBooking = {
    id: uuidv4(),
    ...data,
    bookedAt: new Date().toISOString(),
    cancelled: false
  }
  bookings.push(newBooking)
  await writeJsonFile('bookings.json', bookings)
  return newBooking
}

async function updateBooking(id, data) {
  const bookings = await getBookings()
  const index = bookings.findIndex(booking => booking.id === id)
  if (index === -1) return null
  
  bookings[index] = { ...bookings[index], ...data }
  await writeJsonFile('bookings.json', bookings)
  return bookings[index]
}

async function findBooking(id) {
  const bookings = await getBookings()
  return bookings.find(booking => booking.id === id)
}

async function resetDatabase() {
  await writeJsonFile('slots.json', [])
  await writeJsonFile('bookings.json', [])
  await writeJsonFile('config.json', {
    id: 'config',
    rdvDurationMinutes: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
}

export {
  getConfig,
  updateConfig,
  getSlots,
  createSlot,
  updateSlot,
  findSlot,
  getBookings,
  createBooking,
  updateBooking,
  findBooking,
  resetDatabase
}
