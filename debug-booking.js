#!/usr/bin/env node

import fetch from 'node-fetch'

async function testBooking() {
  try {
    // First login
    console.log('1. Logging in...')
    const loginResponse = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'parent@example.com',
        password: 'Tenbosch@123'
      })
    })
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text()
      throw new Error(`Login failed: ${error}`)
    }
    
    const loginData = await loginResponse.json()
    console.log('Login successful:', loginData.user.email)
    
    const token = loginData.token
    
    // Now test booking
    console.log('2. Attempting booking...')
    const bookingResponse = await fetch('http://localhost:4000/api/bookings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        slotId: '1dbdc650-ebeb-44b5-8ac3-b49d7a3ff7c0',
        childId: '17609021514918d4fgs576'
      })
    })
    
    console.log('Booking response status:', bookingResponse.status)
    const bookingData = await bookingResponse.text()
    console.log('Booking response:', bookingData)
    
    if (!bookingResponse.ok) {
      console.log('❌ Booking failed')
      // Try to get more details if it's JSON
      try {
        const jsonData = JSON.parse(bookingData)
        console.log('Error details:', jsonData)
      } catch (e) {
        console.log('Raw error response:', bookingData)
      }
    } else {
      console.log('✅ Booking successful')
    }
    
  } catch (error) {
    console.error('Test error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testBooking()