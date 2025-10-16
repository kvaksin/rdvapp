const express = require('express');const express = require('express')

const cors = require('cors');const cors = require('cors')

const { createEvent } = require('ics');const { PrismaClient } = require('@prisma/client')

const fs = require('fs');const { createEvent } = require('ics')

const path = require('path');const fs = require('fs')

const swaggerUi = require('swagger-ui-express');const path = require('path')

const YAML = require('yaml');const swaggerUi = require('swagger-ui-express')

const { JsonDB } = require('./db');const YAML = require('yaml')



// Initialize database// Load and parse OpenAPI spec

const db = new JsonDB();const openApiYaml = fs.readFileSync(path.join(__dirname, '..', 'openapi.yaml'), 'utf8')

const openApiSpec = YAML.parse(openApiYaml)

// Load and parse OpenAPI spec

const openApiYaml = fs.readFileSync(path.join(__dirname, '..', 'openapi.yaml'), 'utf8');// Configure Swagger UI options

const openApiSpec = YAML.parse(openApiYaml);const swaggerUiOptions = {

  customCss: '.swagger-ui .topbar { display: none }',

// Configure Swagger UI options  customSiteTitle: 'RDV API Documentation'

const swaggerUiOptions = {}

  customCss: '.swagger-ui .topbar { display: none }',

  customSiteTitle: 'RDV API Documentation'const prisma = new PrismaClient({

};  log: ['query', 'info', 'warn', 'error'],

  errorFormat: 'pretty',

const app = express();})

app.use(cors());

app.use(express.json());// Handle Prisma connection

async function connectPrisma() {

// API routes first  try {

app.use('/api', (req, res, next) => {    await prisma.$connect()

  req.url = req.url.replace(/^\/api/, '');    console.log('Successfully connected to database')

  next();    return true

});  } catch (error) {

    console.error('Database connection error:', error)

// Determine the correct dist directory path based on environment    return false

const distPath = process.env.NODE_ENV === 'production'  }

  ? path.join(process.cwd(), 'dist')}

  : path.join(__dirname, '..', 'dist');

const app = express()

// Create dist directory if it doesn't existapp.use(cors())

if (!fs.existsSync(distPath)) {app.use(express.json())

  console.log('Creating dist directory');

  fs.mkdirSync(distPath, { recursive: true });// Ensure database connection before starting server

}connectPrisma().then(connected => {

  if (!connected) {

// Static files with proper caching    console.error('Could not connect to database. Exiting...')

app.use(express.static(distPath, {    process.exit(1)

  maxAge: '1h',  }

  etag: true,})

  lastModified: true,

  fallthrough: true// Determine the correct dist directory path based on environment

}));const distPath = process.env.NODE_ENV === 'production'

  ? path.join(process.cwd(), 'dist')

// Helper: parse ISO -> [year, month, day, hour, minute]  : path.join(__dirname, '..', 'dist');

function toIcsDate(iso) {

  const d = new Date(iso);console.log('Environment:', process.env.NODE_ENV)

  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];console.log('Current directory:', process.cwd())

}console.log('Dist path:', distPath)

console.log('Directory contents:', fs.readdirSync(process.cwd()))

// GET slots in range

app.get('/api/slots', async (req, res) => {// Create dist directory if it doesn't exist

  const { from, to } = req.query;if (!fs.existsSync(distPath)) {

  const where = {};  console.log('Creating dist directory')

  if (from && to) {  fs.mkdirSync(distPath, { recursive: true })

    where.start = { gte: new Date(from) };}

    where.end = { lte: new Date(to) };

  }// Log all directories up to dist

  const slots = await db.findSlots(where);let currentPath = distPath

  res.json(slots);while (currentPath !== '/') {

});  try {

    console.log(`Contents of ${currentPath}:`, fs.readdirSync(currentPath))

// Health check endpoint  } catch (error) {

app.get('/api/health', (req, res) => {    console.log(`Cannot read ${currentPath}:`, error.message)

  res.json({   }

    status: 'healthy',  currentPath = path.dirname(currentPath)

    timestamp: new Date().toISOString(),}

    env: process.env.NODE_ENV

  });// API routes first

});app.use('/api', (req, res, next) => {

  req.url = req.url.replace(/^\/api/, '')

// simple ping  next()

app.get('/api/ping', (req, res) => {})

  res.json({ ok: true, now: new Date().toISOString() });

});// Serve static files from multiple possible locations

const possibleDistPaths = [

// GET config  path.join(process.cwd(), 'dist'),

app.get('/api/config', async (req, res) => {  path.join(process.cwd(), '..', 'dist'),

  const config = await db.getConfig();  '/opt/render/project/src/dist',

  res.json(config);  path.join(__dirname, '..', 'dist')

});];



// PUT config// Find the first valid dist path

app.put('/api/config', async (req, res) => {const validDistPath = possibleDistPaths.find(p => {

  const { appointmentDuration } = req.body;  try {

  if (![10,15,20,30].includes(appointmentDuration)) {    return fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'));

    return res.status(400).json({ error: 'invalid duration' });  } catch (error) {

  }    console.log(`Error checking path ${p}:`, error.message);

  const config = await db.updateConfig({ appointmentDuration });    return false;

  res.json(config);  }

});}) || distPath;



// POST timeframe -> create slots based on current configconsole.log('Using dist path:', validDistPath);

app.post('/api/slots/timeframe', async (req, res) => {

  const { start, end } = req.body;// Static files with proper caching

  if (!start || !end) return res.status(400).json({ error: 'start and end required' });app.use(express.static(validDistPath, {

    maxAge: '1h',

  const config = await db.getConfig();  etag: true,

  const duration = config.appointmentDuration;  lastModified: true,

  fallthrough: true // Continue to next middleware if file not found

  const s = new Date(start);}))

  const e = new Date(end);

  if (s >= e) return res.status(400).json({ error: 'invalid timeframe' });// SPA routing - this should be the last middleware

app.get('*', (req, res, next) => {

  const created = [];  if (req.path.startsWith('/api/')) {

  let cursor = new Date(s);    return next()

    }

  while (cursor.getTime() + duration * 60000 <= e.getTime()) {

    const slotStart = new Date(cursor);  const indexPath = path.join(validDistPath, 'index.html')

    const slotEnd = new Date(cursor.getTime() + duration * 60000);  

    const slot = await db.createSlot({ start: slotStart, end: slotEnd });  // Check if index.html exists

    created.push(slot);  if (!fs.existsSync(indexPath)) {

    cursor = new Date(cursor.getTime() + duration * 60000);    console.error('index.html not found at:', indexPath)

  }    console.log('Available files in dist:', fs.readdirSync(validDistPath))

    return res.status(404).send('Application not found')

  res.json({ created });  }

});  

  console.log('Serving index.html from:', indexPath)

// DELETE slot

app.delete('/api/slots/:id', async (req, res) => {  res.sendFile(indexPath, {}, (err) => {

  const { id } = req.params;    if (err) {

  await db.updateSlot(id, { removed: true });      console.error('Error sending file:', err)

  res.json({ success: true });      console.error('File path attempted:', indexPath)

});      console.error('Directory contents:', fs.readdirSync(path.dirname(indexPath)))

      res.status(500).send('Error loading application')

// GET bookings    }

app.get('/api/bookings', async (req, res) => {  })

  const bookings = await db.findBookings();})

  res.json(bookings);

});// Serve OpenAPI spec as JSON

app.get('/api/openapi.json', (req, res) => {

// POST booking  res.json(openApiSpec)

app.post('/api/bookings', async (req, res) => {})

  const { slotId, childName } = req.body;

  if (!slotId || !childName) return res.status(400).json({ error: 'slotId and childName required' });// Mount Swagger UI at /api/docs/ui

app.use('/api/docs/ui', swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerUiOptions))

  try {

    const slots = await db.findSlots();// Helper: parse ISO -> [year, month, day, hour, minute]

    const slot = slots.find(s => s.id === slotId);function toIcsDate(iso) {

      const d = new Date(iso)

    if (!slot || slot.booked || slot.removed) {  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()]

      return res.status(409).json({ error: 'Slot unavailable' });}

    }

// GET slots in range

    await db.updateSlot(slotId, { booked: true });app.get('/api/slots', async (req, res) => {

    const booking = await db.createBooking({   const { from, to } = req.query

      slotId,   const where = {}

      childName,  if (from && to) {

      originalSlotStart: slot.start     where.start = { gte: new Date(from) }

    });    where.end = { lte: new Date(to) }

  }

    res.status(201).json({ booking });  const slots = await prisma.slot.findMany({ where, orderBy: { start: 'asc' } })

  } catch (err) {  res.json(slots)

    console.error(err);})

    res.status(500).json({ error: 'internal' });

  }// Health check endpoint

});app.get('/api/health', (req, res) => {

  res.json({ 

// PUT modify booking    status: 'healthy',

app.put('/api/bookings/:id', async (req, res) => {    timestamp: new Date().toISOString(),

  const { id } = req.params;    env: process.env.NODE_ENV,

  const { slotId, childName } = req.body;    dbConnected: prisma.$connect != null

    })

  try {})

    const booking = await db.findBookingById(id);

    if (!booking) {// simple ping

      return res.status(404).json({ error: 'Booking not found' });app.get('/api/ping', (req, res) => {

    }  res.json({ ok: true, now: new Date().toISOString() })

})

    const slots = await db.findSlots();

    const newSlot = slots.find(s => s.id === slotId);// API docs JSON + simple HTML tester

    app.get('/api/docs', (req, res) => {

    if (!newSlot || newSlot.booked || newSlot.removed) {  const docs = {

      return res.status(409).json({ error: 'Slot unavailable' });    info: 'Simple RDV API',

    }    base: '/api',

    endpoints: [

    await db.updateSlot(booking.slotId, { booked: false });      { method: 'GET', path: '/slots', desc: 'List slots (query from,to optional)' },

    await db.updateSlot(slotId, { booked: true });      { method: 'POST', path: '/slots/timeframe', desc: 'Create slots between start and end (ISO strings)' },

          { method: 'DELETE', path: '/slots/:id', desc: 'Remove a slot (soft remove) if not booked' },

    const updated = await db.updateBooking(id, {       { method: 'GET', path: '/bookings', desc: 'List bookings' },

      slotId,      { method: 'POST', path: '/bookings', desc: 'Create a booking (slotId, childName) transactional' },

      childName: childName || booking.childName,      { method: 'PUT', path: '/bookings/:id', desc: 'Reschedule a booking to a different slot' },

      originalSlotStart: newSlot.start       { method: 'DELETE', path: '/bookings/:id', desc: 'Cancel a booking' },

    });      { method: 'GET', path: '/bookings/:id/ics', desc: 'Download .ics for a booking' },

      { method: 'GET', path: '/config', desc: 'Get configuration (rdvDurationMinutes)' },

    res.json({ booking: updated });      { method: 'PUT', path: '/config', desc: 'Update configuration (rdvDurationMinutes)' },

  } catch (err) {      { method: 'POST', path: '/reset', desc: 'Reset schedule (confirm: true required)' }

    console.error(err);    ]

    res.status(500).json({ error: 'internal' });  }

  }

});  // return JSON by default; if HTML requested, render a simple tester page

  const accept = req.headers.accept || ''

// DELETE booking  if (accept.includes('text/html')) {

app.delete('/api/bookings/:id', async (req, res) => {    const html = `<!doctype html>

  const { id } = req.params;    <html>

  try {    <head><meta charset="utf-8"><title>API Docs - RDV</title></head>

    const booking = await db.findBookingById(id);    <body style="font-family:system-ui,Segoe UI,Helvetica,Arial,sans-serif;padding:20px;">

    if (booking) {      <h1>RDV API</h1>

      await db.updateBooking(id, { cancelled: true });      <p>Base: /api</p>

      await db.updateSlot(booking.slotId, { booked: false });      <pre>${JSON.stringify(docs, null, 2)}</pre>

    }      <hr/>

    res.json({ success: true });      <h2>Quick tests</h2>

  } catch (err) {      <button onclick="fetch('/api/ping').then(r=>r.json()).then(j=>alert(JSON.stringify(j)))">Ping</button>

    console.error(err);      <button onclick="fetch('/api/slots').then(r=>r.json()).then(j=>alert('slots: '+j.length))">List slots</button>

    res.status(500).json({ error: 'internal' });      <button onclick="(async ()=>{ const iso=new Date().toISOString(); const later=new Date(Date.now()+30*60000).toISOString(); const res=await fetch('/api/slots/timeframe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start:iso,end:later})}); const j=await res.json(); alert('created:'+ (j.created? j.created.length : JSON.stringify(j))) })()">Create 30m timeframe</button>

  }      <p>Open dev console for network details.</p>

});    </body>

    </html>`

// Helper: format datetime for description    res.setHeader('Content-Type', 'text/html; charset=utf-8')

function formatDateTime(date, locale = 'en') {    return res.send(html)

  return new Date(date).toLocaleString(locale, {  }

    weekday: 'long',

    year: 'numeric',  res.json(docs)

    month: 'long',})

    day: 'numeric',

    hour: '2-digit',// GET config

    minute: '2-digit'app.get('/api/config', async (req, res) => {

  });  let config = await prisma.config.findUnique({ where: { id: 'config' } })

}  if (!config) {

    config = await prisma.config.create({ data: { id: 'config', rdvDurationMinutes: 15 } })

// GET booking ICS  }

app.get('/api/bookings/:id/ics', async (req, res) => {  res.json(config)

  const { id } = req.params;})

  const locale = req.query.locale || 'en';

  // PUT config

  const booking = await db.findBookingById(id);app.put('/api/config', async (req, res) => {

  if (!booking) return res.status(404).send('Not found');  const { rdvDurationMinutes } = req.body

    if (![10,15,20,30].includes(rdvDurationMinutes)) return res.status(400).json({ error: 'invalid duration' })

  const config = await db.getConfig();  let config = await prisma.config.findUnique({ where: { id: 'config' } })

  const duration = config.appointmentDuration;  if (!config) {

  const startDate = new Date(booking.originalSlotStart);    config = await prisma.config.create({ data: { id: 'config', rdvDurationMinutes } })

    } else {

  const start = toIcsDate(startDate);    config = await prisma.config.update({ where: { id: 'config' }, data: { rdvDurationMinutes } })

  const end = toIcsDate(new Date(startDate.getTime() + duration * 60000));  }

    res.json(config)

  const formattedDateTime = formatDateTime(startDate, locale);})

  const baseUrl = process.env.NODE_ENV === 'production' 

    ? `https://${process.env.BASE_URL}` // POST timeframe -> create slots based on current config

    : process.env.BASE_URL || 'http://localhost:4000';app.post('/api/slots/timeframe', async (req, res) => {

    const { start, end } = req.body

  const event = {  if (!start || !end) return res.status(400).json({ error: 'start and end required' })

    start,  const config = await prisma.config.findUnique({ where: { id: 'config' } })

    end,  const duration = (config && config.rdvDurationMinutes) || 15

    title: `RDV — ${booking.childName}`,

    description: [  const s = new Date(start)

      `Appointment for ${booking.childName}`,  const e = new Date(end)

      `When: ${formattedDateTime}`,  if (s >= e) return res.status(400).json({ error: 'invalid timeframe' })

      `Duration: ${duration} minutes`,

      `\nManage your appointment:`,  const created = []

      `${baseUrl}/api/bookings/${booking.id}`  let cursor = new Date(s)

    ].join('\n'),  while (cursor.getTime() + duration * 60000 <= e.getTime()) {

    uid: `booking-${booking.id}`,    const slotStart = new Date(cursor)

    url: `${baseUrl}/api/bookings/${booking.id}`,    const slotEnd = new Date(cursor.getTime() + duration * 60000)

    alarms: [    // avoid creating duplicate exact slots

      { action: 'display', description: 'Appointment reminder', trigger: { hours: 24, before: true } },    const exists = await prisma.slot.findFirst({ where: { start: slotStart, end: slotEnd } })

      { action: 'display', description: 'Appointment reminder', trigger: { hours: 1, before: true } },    if (!exists) {

      { action: 'display', description: 'Appointment starting soon', trigger: { minutes: 15, before: true } }      const slot = await prisma.slot.create({ data: { start: slotStart, end: slotEnd } })

    ],      created.push(slot)

    status: 'CONFIRMED',    }

    busyStatus: 'BUSY',    cursor = new Date(cursor.getTime() + duration * 60000)

    productId: '-//RDVAPP//Appointment System//EN',  }

    startInputType: 'utc',

    endInputType: 'utc'  res.json({ created })

  };})



  createEvent(event, (err, value) => {// DELETE slot

    if (err) {app.delete('/api/slots/:id', async (req, res) => {

      console.error('Error creating ICS file:', err);  const { id } = req.params

      return res.status(500).send('Error creating calendar file');  await prisma.slot.updateMany({ where: { id, booked: false }, data: { removed: true } })

    }  res.json({ success: true })

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');})

    res.setHeader('Content-Disposition', `attachment; filename=rdv-${booking.id}.ics`);

    res.send(value);// GET bookings

  });app.get('/api/bookings', async (req, res) => {

});  const bookings = await prisma.booking.findMany({ orderBy: { bookedAt: 'desc' } })

  res.json(bookings)

// POST reset})

app.post('/api/reset', async (req, res) => {

  const { confirm } = req.body;// POST booking: transactional safe booking

  if (!confirm) return res.status(400).json({ error: 'confirmation required' });app.post('/api/bookings', async (req, res) => {

  await db.reset();  const { slotId, childName } = req.body

  res.json({ success: true });  if (!slotId || !childName) return res.status(400).json({ error: 'slotId and childName required' })

});

  try {

const port = process.env.PORT || 4000;    const result = await prisma.$transaction(async (tx) => {

      // ensure slot exists and not booked/removed

app.listen(port, () => {      const slot = await tx.slot.findUnique({ where: { id: slotId } })

  console.log('API server listening on', port);      if (!slot || slot.booked || slot.removed) throw new Error('slot_unavailable')

  console.log('Environment:', process.env.NODE_ENV);

});      // mark slot booked and create booking
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

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('Database connection successful')

    // Run migrations
    const { execSync } = require('child_process')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('Database migrations completed')

    // Start server
    app.listen(port, () => {
      console.log('API server listening on', port)
      console.log('Environment:', process.env.NODE_ENV)
      console.log('Database connected:', !!prisma)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer().catch(console.error)
