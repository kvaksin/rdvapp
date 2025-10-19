import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createEvent } from 'ics'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import session from 'express-session'
import passport from 'passport'
import helmet from 'helmet'
import * as db from './db.js'
import * as auth from './auth.js'
import authRoutes from './authRoutes.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load and parse OpenAPI spec
const openApiYaml = fs.readFileSync(path.join(__dirname, '..', 'openapi.yaml'), 'utf8')
const openApiSpec = YAML.parse(openApiYaml)

// Configure Swagger UI options
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RDV API Documentation'
}

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
  ],
  credentials: true
}))

app.use(express.json())

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Determine the correct dist directory path based on environment
const distPath = process.env.NODE_ENV === 'production'
  ? path.join(process.cwd(), 'dist')
  : path.join(__dirname, '..', 'dist');

console.log('Environment:', process.env.NODE_ENV)
console.log('Current directory:', process.cwd())
console.log('Dist path:', distPath)
console.log('Directory contents:', fs.readdirSync(process.cwd()))

// Create dist directory if it doesn't exist
if (!fs.existsSync(distPath)) {
  console.log('Creating dist directory')
  fs.mkdirSync(distPath, { recursive: true })
}

// Log all directories up to dist
let currentPath = distPath
while (currentPath !== '/') {
  try {
    console.log(`Contents of ${currentPath}:`, fs.readdirSync(currentPath))
  } catch (error) {
    console.log(`Cannot read ${currentPath}:`, error.message)
  }
  currentPath = path.dirname(currentPath)
}

// API routes first
app.use('/api', (req, res, next) => {
  req.url = req.url.replace(/^\/api/, '')
  next()
})

// Serve static files from multiple possible locations
const possibleDistPaths = [
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), '..', 'dist'),
  '/opt/render/project/src/dist',
  path.join(__dirname, '..', 'dist')
];

// Find the first valid dist path
const validDistPath = possibleDistPaths.find(p => {
  try {
    return fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'));
  } catch (error) {
    console.log(`Error checking path ${p}:`, error.message);
    return false;
  }
}) || distPath;

console.log('Using dist path:', validDistPath);

// Static files with proper caching
app.use(express.static(validDistPath, {
  maxAge: '1h',
  etag: true,
  lastModified: true,
  fallthrough: true // Continue to next middleware if file not found
}))

// Authentication routes - must come before catch-all route
app.use('/auth', authRoutes)

// SPA routing - this should be the last middleware
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth')) {
    return next()
  }

  const indexPath = path.join(validDistPath, 'index.html')
  
  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath)
    console.log('Available files in dist:', fs.readdirSync(validDistPath))
    return res.status(404).send('Application not found')
  }
  
  console.log('Serving index.html from:', indexPath)

  res.sendFile(indexPath, {}, (err) => {
    if (err) {
      console.error('Error sending file:', err)
      console.error('File path attempted:', indexPath)
      console.error('Directory contents:', fs.readdirSync(path.dirname(indexPath)))
      res.status(500).send('Error loading application')
    }
  })
})

// Serve OpenAPI spec as JSON
app.get('/api/openapi.json', (req, res) => {
  res.json(openApiSpec)
})

// Mount Swagger UI at /api/docs/ui
app.use('/api/docs/ui', swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerUiOptions))

// Helper: parse ISO -> [year, month, day, hour, minute]
function toIcsDate(iso) {
  const d = new Date(iso)
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()]
}

// GET slots in range
app.get('/api/slots', auth.authenticateToken, async (req, res) => {
  try {
    // Disable caching for slots endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Expires', '-1')
    res.set('Pragma', 'no-cache')
    
    const { from, to, classId } = req.query
    
    // Check user access to classes
    const userAccessibleClasses = auth.getUserAccessibleClasses(req.user.id)
    
    const where = {}
    if (from && to) {
      where.start = { gte: from }
      where.end = { lte: to }
    }
    let slots = await db.getSlots(where)
    
    // Filter slots by user access to classes
    if (userAccessibleClasses !== 'all') {
      slots = slots.filter(slot => 
        !slot.classId || userAccessibleClasses.includes(slot.classId)
      )
    }
    
    // Optional filter by classId if provided
    if (classId) {
      slots = slots.filter(s => (s.classId || null) === classId)
    }
    console.log('Retrieved slots:', slots)
    res.json(slots)
  } catch (error) {
    console.error('Error getting slots:', error)
    res.status(500).json({ error: 'Failed to get slots' })
  }
})

// Public classes endpoint for registration (no authentication required)
app.get('/api/classes/public', async (req, res) => {
  try {
    const classes = await db.getClasses()
    res.json(classes)
  } catch (error) {
    console.error('Error getting public classes:', error)
    res.status(500).json({ error: 'Failed to get classes' })
  }
})

// Class management endpoints
app.get('/api/classes', auth.authenticateToken, async (req, res) => {
  try {
    const classes = await db.getClasses()
    
    // Filter classes by user access
    const userAccessibleClasses = auth.getUserAccessibleClasses(req.user.id)
    
    if (userAccessibleClasses === 'all') {
      res.json(classes)
    } else {
      const filteredClasses = classes.filter(cls => userAccessibleClasses.includes(cls.id))
      res.json(filteredClasses)
    }
  } catch (error) {
    console.error('Error getting classes:', error)
    res.status(500).json({ error: 'Failed to get classes' })
  }
})

app.post('/api/classes', auth.authenticateToken, auth.requireRole(['administrator', 'class_lead']), async (req, res) => {
  try {
    const { name, description, color } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Class name is required' })
    }
    const newClass = await db.createClass({
      name,
      description,
      color: color || '#6366F1' // Default indigo color
    })
    res.status(201).json(newClass)
  } catch (error) {
    console.error('Error creating class:', error)
    res.status(500).json({ error: 'Failed to create class' })
  }
})

app.delete('/api/classes/:id', auth.authenticateToken, auth.requireRole(['administrator']), async (req, res) => {
  try {
    const { id } = req.params
    await db.deleteClass(id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting class:', error)
    res.status(500).json({ error: 'Failed to delete class' })
  }
})

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const config = await db.getConfig()
  console.log('Health check - Current config:', config)
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    dbConnected: true,
    config
  })
})

// simple ping
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() })
})

// API docs JSON + simple HTML tester
app.get('/api/docs', (req, res) => {
  const docs = {
    info: 'Simple RDV API',
    base: '/api',
    endpoints: [
      { method: 'GET', path: '/slots', desc: 'List slots (query from,to optional)' },
      { method: 'POST', path: '/slots/timeframe', desc: 'Create slots between start and end (ISO strings)' },
      { method: 'DELETE', path: '/slots/:id', desc: 'Remove a slot (soft remove) if not booked' },
      { method: 'GET', path: '/bookings', desc: 'List bookings' },
      { method: 'POST', path: '/bookings', desc: 'Create a booking (slotId, childName) transactional' },
      { method: 'PUT', path: '/bookings/:id', desc: 'Reschedule a booking to a different slot' },
      { method: 'DELETE', path: '/bookings/:id', desc: 'Cancel a booking' },
      { method: 'GET', path: '/bookings/:id/ics', desc: 'Download .ics for a booking' },
      { method: 'GET', path: '/config', desc: 'Get configuration (rdvDurationMinutes)' },
      { method: 'PUT', path: '/config', desc: 'Update configuration (rdvDurationMinutes)' },
      { method: 'POST', path: '/reset', desc: 'Reset schedule (confirm: true required)' }
    ]
  }

  // return JSON by default; if HTML requested, render a simple tester page
  const accept = req.headers.accept || ''
  if (accept.includes('text/html')) {
    const html = `<!doctype html>
    <html>
    <head><meta charset="utf-8"><title>API Docs - RDV</title></head>
    <body style="font-family:system-ui,Segoe UI,Helvetica,Arial,sans-serif;padding:20px;">
      <h1>RDV API</h1>
      <p>Base: /api</p>
      <pre>${JSON.stringify(docs, null, 2)}</pre>
      <hr/>
      <h2>Quick tests</h2>
      <button onclick="fetch('/api/ping').then(r=>r.json()).then(j=>alert(JSON.stringify(j)))">Ping</button>
      <button onclick="fetch('/api/slots').then(r=>r.json()).then(j=>alert('slots: '+j.length))">List slots</button>
      <button onclick="(async ()=>{ const iso=new Date().toISOString(); const later=new Date(Date.now()+30*60000).toISOString(); const res=await fetch('/api/slots/timeframe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start:iso,end:later})}); const j=await res.json(); alert('created:'+ (j.created? j.created.length : JSON.stringify(j))) })()">Create 30m timeframe</button>
      <p>Open dev console for network details.</p>
    </body>
    </html>`
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.send(html)
  }

  res.json(docs)
})

// GET config
app.get('/api/config', async (req, res) => {
  const config = await db.getConfig()
  res.json(config)
})

// PUT config
app.put('/api/config', async (req, res) => {
  try {
    console.log('Updating config, received:', req.body)
    const { rdvDurationMinutes } = req.body
    
    if (typeof rdvDurationMinutes !== 'number') {
      console.log('Invalid duration type:', typeof rdvDurationMinutes)
      return res.status(400).json({ error: 'rdvDurationMinutes must be a number' })
    }
    
    if (![10,15,20,30].includes(rdvDurationMinutes)) {
      console.log('Invalid duration value:', rdvDurationMinutes)
      return res.status(400).json({ error: 'rdvDurationMinutes must be one of: 10, 15, 20, 30' })
    }
    
    console.log('Updating config with duration:', rdvDurationMinutes)
    const config = await db.updateConfig({ rdvDurationMinutes })
    console.log('Config updated:', config)
    res.json(config)
  } catch (error) {
    console.error('Error updating config:', error)
    res.status(500).json({ error: 'Failed to update configuration' })
  }
})

// POST timeframe -> create slots based on current config
app.post('/api/slots/timeframe', auth.authenticateToken, auth.requireRole(['administrator', 'class_lead']), async (req, res) => {
  try {
    // Disable caching for this endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Expires', '-1')
    res.set('Pragma', 'no-cache')
    
    console.log('Received timeframe request:', req.body)
    const { start, end, classId } = req.body
    
    // Check if user has access to the class (if classId provided)
    if (classId && !auth.hasAccessToClass(req.user.id, classId)) {
      return res.status(403).json({ error: 'Access denied to this class' })
    }
    
    if (classId) {
      const classes = await db.getClasses()
      if (!classes.find(c => c.id === classId)) {
        return res.status(400).json({ error: 'Invalid class ID' })
      }
    }
    
    if (!start || !end) {
      console.log('Missing required fields:', { start, end })
      return res.status(400).json({ error: 'start and end required' })
    }
    
    // Validate date formats
    if (!Date.parse(start) || !Date.parse(end)) {
      console.log('Invalid date format:', { start, end })
      return res.status(400).json({ error: 'start and end must be valid ISO date strings' })
    }
    
  console.log('Creating timeframe with:', { start, end, classId })
    const config = await db.getConfig()
    console.log('Current config:', config)
    const duration = (config && config.rdvDurationMinutes) || 15

  const s = new Date(start)
  const e = new Date(end)
  if (s >= e) return res.status(400).json({ error: 'invalid timeframe' })

  const created = []
  // Load existing slots once to check duplicates efficiently
  const existingSlots = await db.getSlots()
  let cursor = new Date(s)
  while (cursor.getTime() + duration * 60000 <= e.getTime()) {
    const slotStart = new Date(cursor)
    const slotEnd = new Date(cursor.getTime() + duration * 60000)

    // Check for existing slots for the same class (or no class) at the same time
    const exists = existingSlots.some(slot =>
      new Date(slot.start).getTime() === slotStart.getTime() &&
      new Date(slot.end).getTime() === slotEnd.getTime() &&
      ((slot.classId || null) === (classId || null))
    )

    if (!exists) {
      const slot = await db.createSlot({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        classId: classId || null
      })
      created.push(slot)
      existingSlots.push(slot) // keep local cache in sync
    }
    cursor = new Date(cursor.getTime() + duration * 60000)
  }

    console.log('Created slots:', created)
    res.json({ created })
  } catch (error) {
    console.error('Error creating timeframe:', error)
    res.status(500).json({ error: 'Failed to create timeframe' })
  }
})

// DELETE slot
app.delete('/api/slots/:id', async (req, res) => {
  const { id } = req.params
  const slot = await db.findSlot(id)
  if (slot && !slot.booked) {
    await db.updateSlot(id, { removed: true })
  }
  res.json({ success: true })
})

// GET bookings
app.get('/api/bookings', auth.authenticateToken, async (req, res) => {
  const bookings = await db.getBookings()
  
  // Filter bookings by user access to classes
  const userAccessibleClasses = auth.getUserAccessibleClasses(req.user.id)
  
  if (userAccessibleClasses === 'all') {
    res.json(bookings)
  } else {
    // Get slots to check class associations
    const slots = await db.getSlots()
    const slotClassMap = new Map(slots.map(slot => [slot.id, slot.classId]))
    
    const filteredBookings = bookings.filter(booking => {
      const slotClassId = slotClassMap.get(booking.slotId)
      return !slotClassId || userAccessibleClasses.includes(slotClassId)
    })
    
    res.json(filteredBookings)
  }
})

// POST booking
app.post('/api/bookings', auth.authenticateToken, async (req, res) => {
  const { slotId, childName } = req.body
  if (!slotId || !childName) return res.status(400).json({ error: 'slotId and childName required' })

  try {
    // ensure slot exists and not booked/removed
    const slot = await db.findSlot(slotId)
    if (!slot || slot.booked || slot.removed) {
      return res.status(409).json({ error: 'Slot unavailable' })
    }

    // Check if user has access to the slot's class
    if (slot.classId && !auth.hasAccessToClass(req.user.id, slot.classId)) {
      return res.status(403).json({ error: 'Access denied to this class' })
    }

    // For parents, validate that they have the correct child name for this class
    if (req.user.roles.includes('parent') && slot.classId) {
      const userClasses = auth.getUserClasses()
      const userClassAssignment = userClasses.find(uc => 
        uc.userId === req.user.id && uc.classId === slot.classId
      )
      
      if (!userClassAssignment || userClassAssignment.childName !== childName) {
        return res.status(403).json({ error: 'Invalid child name for this class' })
      }
    }

    // mark slot booked and create booking
    await db.updateSlot(slotId, { booked: true })
    const booking = await db.createBooking({ 
      slotId, 
      childName,
      originalSlotStart: slot.start 
    })

    res.status(201).json({ booking })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal' })
  }
})

// PUT modify booking -> move to new slot
app.put('/api/bookings/:id', auth.authenticateToken, async (req, res) => {
  const { id } = req.params
  const { slotId, childName } = req.body
  try {
    const booking = await db.findBooking(id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Check access to both old and new slots
    const oldSlot = await db.findSlot(booking.slotId)
    const newSlot = await db.findSlot(slotId)
    
    if (oldSlot?.classId && !auth.hasAccessToClass(req.user.id, oldSlot.classId)) {
      return res.status(403).json({ error: 'Access denied to original booking class' })
    }
    
    if (newSlot?.classId && !auth.hasAccessToClass(req.user.id, newSlot.classId)) {
      return res.status(403).json({ error: 'Access denied to new slot class' })
    }

    // free old slot
    await db.updateSlot(booking.slotId, { booked: false })

    // claim new slot (must exist and not booked)
    const targetSlot = await db.findSlot(slotId)
    if (!targetSlot || targetSlot.booked || targetSlot.removed) {
      return res.status(409).json({ error: 'Slot unavailable' })
    }

    await db.updateSlot(slotId, { booked: true })
    const updated = await db.updateBooking(id, { 
      slotId, 
      childName: childName || booking.childName, 
      originalSlotStart: targetSlot.start 
    })

    res.json({ booking: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal' })
  }
})

// DELETE booking
app.delete('/api/bookings/:id', auth.authenticateToken, async (req, res) => {
  const { id } = req.params
  try {
    const booking = await db.findBooking(id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Check access to booking's slot class
    const slot = await db.findSlot(booking.slotId)
    if (slot?.classId && !auth.hasAccessToClass(req.user.id, slot.classId)) {
      return res.status(403).json({ error: 'Access denied to this booking' })
    }

    await db.updateBooking(id, { cancelled: true })
    await db.updateSlot(booking.slotId, { booked: false })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal' })
  }
})

// Helper: format datetime for description
function formatDateTime(date, locale = 'en') {
  return new Date(date).toLocaleString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// GET booking ICS
app.get('/api/bookings/:id/ics', async (req, res) => {
  const { id } = req.params
  const locale = req.query.locale || 'en'  // Get locale from query parameter
  
  // Get booking with slot and config information
  const booking = await db.findBooking(id)
  if (!booking) {
    return res.status(404).send('Booking not found')
  }

  const [slot, config] = await Promise.all([
    db.findSlot(booking.slotId),
    db.getConfig()
  ])
  
  if (!booking || !slot) return res.status(404).send('Not found')
  
  const duration = (config && config.rdvDurationMinutes) || 15
  const startDate = new Date(booking.originalSlotStart)
  
  const start = toIcsDate(startDate)
  const end = toIcsDate(new Date(startDate.getTime() + duration * 60000))
  
  // Format date/time for description
  const formattedDateTime = formatDateTime(startDate, locale)
  // Construct base URL with https:// for production, http:// for local
const baseUrl = process.env.NODE_ENV === 'production' 
  ? `https://${process.env.BASE_URL}` 
  : process.env.BASE_URL || 'http://localhost:4000'
  
  const event = {
    start,
    end,
    title: `RDV — ${booking.childName}`,
    description: [
      `Appointment for ${booking.childName}`,
      `When: ${formattedDateTime}`,
      `Duration: ${duration} minutes`,
      `\nManage your appointment:`,
      `${baseUrl}/api/bookings/${booking.id}`
    ].join('\n'),
    uid: `booking-${booking.id}`,
    url: `${baseUrl}/api/bookings/${booking.id}`,
    // Add multiple reminders
    alarms: [
      { action: 'display', description: 'Appointment reminder', trigger: { hours: 24, before: true } },
      { action: 'display', description: 'Appointment reminder', trigger: { hours: 1, before: true } },
      { action: 'display', description: 'Appointment starting soon', trigger: { minutes: 15, before: true } }
    ],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    productId: '-//RDVAPP//Appointment System//EN',
    // Add timezone information
    startInputType: 'utc',
    endInputType: 'utc'
  }

  createEvent(event, (err, value) => {
    if (err) {
      console.error('Error creating ICS file:', err)
      return res.status(500).send('Error creating calendar file')
    }
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=rdv-${booking.id}.ics`)
    res.send(value)
  })
})

// POST reset

// Reset schedule for a specific class
app.post('/api/reset-class', async (req, res) => {
  const { classId, confirm } = req.body;
  if (!confirm || !classId) return res.status(400).json({ error: 'classId and confirmation required' });
  await db.resetClassSchedule(classId);
  res.json({ success: true });
});

// Reset all data
app.post('/api/reset', async (req, res) => {
  const { confirm } = req.body
  if (!confirm) return res.status(400).json({ error: 'confirmation required' })
  await db.resetDatabase()
  res.json({ success: true })
})

const port = process.env.PORT || 4000

// Initialize data files
// await db.resetDatabase().catch(console.error) // Commented out to prevent auto-reset

// Start server
app.listen(port, () => {
  console.log('API server listening on', port)
  console.log('Environment:', process.env.NODE_ENV || 'development')
  console.log('Data directory:', path.join(__dirname, '..', 'data'))
})
