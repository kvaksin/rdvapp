import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

// Helper to read JSON file
async function readJsonFile(filename) {
  await ensureDataDir()
  try {
    const filePath = path.join(DATA_DIR, filename)
    // Check if file exists, if not create with default data
    try {
      await fs.access(filePath)
    } catch {
      // File doesn't exist, create with default data
      const defaultData = filename === 'config.json' 
        ? { id: 'config', rdvDurationMinutes: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : []
      await writeJsonFile(filename, defaultData)
      return defaultData
    }
    
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    // Return defaults if there's an error
    return filename === 'config.json' 
      ? { id: 'config', rdvDurationMinutes: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      : []
  }
}

// Helper to write JSON file
async function writeJsonFile(filename, data) {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  let fd = null
  
  try {
    // Convert data to JSON string with proper formatting
    const jsonString = JSON.stringify(data, null, 2)
    
    // Write to temporary file first
    const tempPath = `${filePath}.tmp`
    await fs.writeFile(tempPath, jsonString, 'utf8')
    
    // Open the temp file and ensure it's synced to disk
    fd = await fs.open(tempPath, 'r')
    await fd.sync()
    await fd.close()
    fd = null
    
    // Atomically rename temp file to target file
    await fs.rename(tempPath, filePath)
    
    // Verify the file was written correctly
    const written = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(written)
    
    console.log(`Successfully wrote ${filename}:`, parsed)
    return parsed
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)
    // Try to clean up
    if (fd) {
      try {
        await fd.close()
      } catch (closeError) {
        console.error('Error closing file:', closeError)
      }
    }
    throw error
  }
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
  await ensureDataDir()
  const defaultConfig = {
    id: 'config',
    rdvDurationMinutes: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  try {
    await Promise.all([
      writeJsonFile('slots.json', []),
      writeJsonFile('bookings.json', []),
      writeJsonFile('config.json', defaultConfig)
    ])
    console.log('Database reset successful')
    return true
  } catch (error) {
    console.error('Error resetting database:', error)
    throw error
  }
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
