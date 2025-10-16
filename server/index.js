const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const { createEvent } = require('ics')
const fs = require('fs')
const path = require('path')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yaml')

// Load and parse OpenAPI spec
const openApiYaml = fs.readFileSync(path.join(__dirname, '..', 'openapi.yaml'), 'utf8')
const openApiSpec = YAML.parse(openApiYaml)

// Configure Swagger UI options
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RDV API Documentation'
}

const prisma = new PrismaClient()
const app = express()
app.use(cors())
app.use(express.json())

// Serve static files from the dist directory with caching
app.use(express.static(path.join(__dirname, '..', 'dist'), {
  maxAge: '1h',
  etag: true,
  lastModified: true
}))

// API routes
app.use('/api', (req, res, next) => {
  // Remove /api prefix for route handling
  req.url = req.url.replace(/^\/api/, '')
  next()
})

// Handle SPA routing - return index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next()
  }
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'), {}, (err) => {
    if (err) {
      console.error('Error sending file:', err)
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
app.get('/api/slots', async (req, res) => {
  const { from, to } = req.query
  const where = {}
  if (from && to) {
    where.start = { gte: new Date(from) }
    where.end = { lte: new Date(to) }
  }
  const slots = await prisma.slot.findMany({ where, orderBy: { start: 'asc' } })
  res.json(slots)
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    dbConnected: prisma.$connect != null
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
  let config = await prisma.config.findUnique({ where: { id: 'config' } })
  if (!config) {
    config = await prisma.config.create({ data: { id: 'config', rdvDurationMinutes: 15 } })
  }
  res.json(config)
})

// PUT config
app.put('/api/config', async (req, res) => {
  const { rdvDurationMinutes } = req.body
  if (![10,15,20,30].includes(rdvDurationMinutes)) return res.status(400).json({ error: 'invalid duration' })
  let config = await prisma.config.findUnique({ where: { id: 'config' } })
  if (!config) {
    config = await prisma.config.create({ data: { id: 'config', rdvDurationMinutes } })
  } else {
    config = await prisma.config.update({ where: { id: 'config' }, data: { rdvDurationMinutes } })
  }
  res.json(config)
})

// POST timeframe -> create slots based on current config
app.post('/api/slots/timeframe', async (req, res) => {
  const { start, end } = req.body
  if (!start || !end) return res.status(400).json({ error: 'start and end required' })
  const config = await prisma.config.findUnique({ where: { id: 'config' } })
  const duration = (config && config.rdvDurationMinutes) || 15

  const s = new Date(start)
  const e = new Date(end)
  if (s >= e) return res.status(400).json({ error: 'invalid timeframe' })

  const created = []
  let cursor = new Date(s)
  while (cursor.getTime() + duration * 60000 <= e.getTime()) {
    const slotStart = new Date(cursor)
    const slotEnd = new Date(cursor.getTime() + duration * 60000)
    // avoid creating duplicate exact slots
    const exists = await prisma.slot.findFirst({ where: { start: slotStart, end: slotEnd } })
    if (!exists) {
      const slot = await prisma.slot.create({ data: { start: slotStart, end: slotEnd } })
      created.push(slot)
    }
    cursor = new Date(cursor.getTime() + duration * 60000)
  }

  res.json({ created })
})

// DELETE slot
app.delete('/api/slots/:id', async (req, res) => {
  const { id } = req.params
  await prisma.slot.updateMany({ where: { id, booked: false }, data: { removed: true } })
  res.json({ success: true })
})

// GET bookings
app.get('/api/bookings', async (req, res) => {
  const bookings = await prisma.booking.findMany({ orderBy: { bookedAt: 'desc' } })
  res.json(bookings)
})

// POST booking: transactional safe booking
app.post('/api/bookings', async (req, res) => {
  const { slotId, childName } = req.body
  if (!slotId || !childName) return res.status(400).json({ error: 'slotId and childName required' })

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ensure slot exists and not booked/removed
      const slot = await tx.slot.findUnique({ where: { id: slotId } })
      if (!slot || slot.booked || slot.removed) throw new Error('slot_unavailable')

      // mark slot booked and create booking
      await tx.slot.update({ where: { id: slotId }, data: { booked: true } })
      const booking = await tx.booking.create({ data: { slotId, childName, originalSlotStart: slot.start } })
  // no direct bookingId field on Slot; slot.booked=true marks it reserved
      return booking
    })

    res.status(201).json({ booking: result })
  } catch (err) {
    if (err.message === 'slot_unavailable') return res.status(409).json({ error: 'Slot unavailable' })
    console.error(err)
    res.status(500).json({ error: 'internal' })
  }
})

// PUT modify booking -> move to new slot
app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params
  const { slotId, childName } = req.body
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } })
      if (!booking) throw new Error('not_found')

  // free old slot
  await tx.slot.updateMany({ where: { id: booking.slotId }, data: { booked: false } })

      // claim new slot (must exist and not booked)
      const newSlot = await tx.slot.findUnique({ where: { id: slotId } })
      if (!newSlot || newSlot.booked || newSlot.removed) throw new Error('slot_unavailable')

  await tx.slot.update({ where: { id: slotId }, data: { booked: true } })

      const upd = await tx.booking.update({ where: { id }, data: { slotId, childName: childName || booking.childName, originalSlotStart: newSlot.start } })

  // no bookingId field to set

      return upd
    })

    res.json({ booking: updated })
  } catch (err) {
    if (err.message === 'not_found') return res.status(404).json({ error: 'Booking not found' })
    if (err.message === 'slot_unavailable') return res.status(409).json({ error: 'Slot unavailable' })
    console.error(err)
    res.status(500).json({ error: 'internal' })
  }
})

// DELETE booking
app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params
  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } })
      if (!booking) return
      // remove booking and free slot
      await tx.booking.update({ where: { id }, data: { cancelled: true } })
  await tx.slot.updateMany({ where: { id: booking.slotId }, data: { booked: false } })
    })
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
  const [booking, config] = await Promise.all([
    prisma.booking.findUnique({ where: { id }, include: { Slot: true } }),
    prisma.config.findUnique({ where: { id: 'config' } })
  ])
  
  if (!booking) return res.status(404).send('Not found')
  
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
app.post('/api/reset', async (req, res) => {
  const { confirm } = req.body
  if (!confirm) return res.status(400).json({ error: 'confirmation required' })
  await prisma.$transaction([prisma.booking.deleteMany(), prisma.slot.deleteMany()])
  res.json({ success: true })
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log('API server listening on', port))
