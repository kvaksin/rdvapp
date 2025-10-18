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

// Class operations
async function getClasses() {
  const classes = await readJsonFile('classes.json') || []
  return classes.sort((a, b) => a.name.localeCompare(b.name))
}

async function createClass(data) {
  const classes = await getClasses()
  const newClass = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  classes.push(newClass)
  await writeJsonFile('classes.json', classes)
  return newClass
}

async function deleteClass(id) {
  const classes = await getClasses()
  const filteredClasses = classes.filter(cls => cls.id !== id)
  // If no classes were filtered out, the ID didn't exist
  if (filteredClasses.length === classes.length) {
    return false
  }
  await writeJsonFile('classes.json', filteredClasses)
  
  // Update any slots that reference this class
  const slots = await getSlots()
  const updatedSlots = slots.map(slot => {
    if (slot.classId === id) {
      return { ...slot, classId: null }
    }
    return slot
  })
  await writeJsonFile('slots.json', updatedSlots)
  return true
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
  
  const defaultClasses = [
    {
      id: uuidv4(),
      name: 'Mathematics',
      description: 'Elementary and advanced mathematics classes',
      color: '#3B82F6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Science',
      description: 'Physics, chemistry, and biology classes',
      color: '#10B981',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Languages',
      description: 'French, Dutch, and English language classes',
      color: '#F59E0B',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
  
  try {
    await Promise.all([
      writeJsonFile('slots.json', []),
      writeJsonFile('bookings.json', []),
      writeJsonFile('classes.json', defaultClasses),
      writeJsonFile('config.json', defaultConfig)
    ])
    console.log('Database reset successful')
    return true
  } catch (error) {
    console.error('Error resetting database:', error)
    throw error
  }
}

// Reset all slots and bookings for a specific class
async function resetClassSchedule(classId) {
  await ensureDataDir();
  // Remove all slots for the class
  const slots = await getSlots();
  const remainingSlots = slots.filter(slot => slot.classId !== classId);
  await writeJsonFile('slots.json', remainingSlots);

  // Remove all bookings for slots that belonged to this class
  const bookings = await getBookings();
  const slotIdsToRemove = slots.filter(slot => slot.classId === classId).map(slot => slot.id);
  const remainingBookings = bookings.filter(booking => !slotIdsToRemove.includes(booking.slotId));
  await writeJsonFile('bookings.json', remainingBookings);

  return true;
}

export {
  getConfig,
  updateConfig,
  getSlots,
  createSlot,
  updateSlot,
  findSlot,
  getClasses,
  createClass,
  deleteClass,
  getBookings,
  createBooking,
  updateBooking,
  findBooking,
  resetDatabase
  ,resetClassSchedule
}
