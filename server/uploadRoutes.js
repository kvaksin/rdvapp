import express from 'express'
import multer from 'multer'
import path from 'path'
import * as auth from './auth.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'))
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-zip-compressed'
  ]
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('File type not allowed'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per message
  }
})

// Upload files endpoint
router.post('/upload', auth.authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const attachments = req.files.map(file => ({
      id: auth.generateId(),
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }))

    res.json({ attachments })
  } catch (error) {
    console.error('Error uploading files:', error)
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 5MB per file.' })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 5 files per message.' })
    }
    if (error.message === 'File type not allowed') {
      return res.status(400).json({ error: 'File type not allowed. Only images, documents, and zip files are supported.' })
    }
    
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

// Serve uploaded files
router.get('/files/:filename', auth.authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params
    const currentUser = req.user
    
    // Security: Check if user has permission to access this file
    // Files can be accessed if user has access to the message containing the attachment
    const filePath = path.join(__dirname, '..', 'uploads', filename)
    
    // TODO: Add proper file access validation based on message permissions
    // For now, any authenticated user can access files
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving file:', err)
        res.status(404).json({ error: 'File not found' })
      }
    })
  } catch (error) {
    console.error('Error serving file:', error)
    res.status(500).json({ error: 'Failed to serve file' })
  }
})

export default router