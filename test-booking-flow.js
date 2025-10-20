#!/usr/bin/env node

import fetch from 'node-fetch'

async function testBookingFlow() {
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
    
    // Cancel existing booking
    console.log('2. Cancelling existing booking...')
    const cancelResponse = await fetch('http://localhost:4000/api/bookings/4c5e7dd4-d46f-4cc2-b8fc-8de41666f8a1/cancel', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('Cancel response status:', cancelResponse.status)
    if (cancelResponse.ok) {
      console.log('✅ Existing booking cancelled')
    } else {
      const cancelError = await cancelResponse.text()
      console.log('❌ Cancel failed:', cancelError)
    }
    
    // Now test booking with available slot
    console.log('3. Attempting new booking...')
    const bookingResponse = await fetch('http://localhost:4000/api/bookings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        slotId: 'c984c42e-4ebc-4d3f-82b2-544da771d73b', // Available slot
        childId: '17609021514918d4fgs576'
      })
    })
    
    console.log('Booking response status:', bookingResponse.status)
    const bookingData = await bookingResponse.text()
    console.log('Booking response:', bookingData)
    
    if (!bookingResponse.ok) {
      console.log('❌ Booking failed')
      try {
        const jsonData = JSON.parse(bookingData)
        console.log('Error details:', jsonData)
      } catch (e) {
        console.log('Raw error response:', bookingData)
      }
    } else {
      console.log('✅ Booking successful!')
      try {
        const jsonData = JSON.parse(bookingData)
        console.log('Booking details:', jsonData)
      } catch (e) {
        console.log('Raw response:', bookingData)
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testBookingFlow()