#!/usr/bin/env node

// Test the manual cleanup API endpoint
import fetch from 'node-fetch'

const API_BASE = 'http://localhost:4000/api'

async function testManualCleanupAPI() {
  console.log('🧪 Testing Manual Notification Cleanup API\n')
  
  try {
    // First, try to login as admin to get a token
    console.log('1. Logging in as admin...')
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    })
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text()
      throw new Error(`Login failed: ${error}`)
    }
    
    const loginData = await loginResponse.json()
    const token = loginData.token
    console.log('   ✓ Admin login successful')
    
    // Check current notification count
    console.log('\n2. Checking current notifications count...')
    const notificationsResponse = await fetch(`${API_BASE}/auth/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!notificationsResponse.ok) {
      throw new Error('Failed to fetch notifications')
    }
    
    const notifications = await notificationsResponse.json()
    console.log(`   Current admin notifications: ${notifications.length}`)
    
    // Test manual cleanup API
    console.log('\n3. Testing manual cleanup API...')
    const cleanupResponse = await fetch(`${API_BASE}/auth/notifications/cleanup`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!cleanupResponse.ok) {
      const error = await cleanupResponse.text()
      throw new Error(`Cleanup API failed: ${error}`)
    }
    
    const cleanupResult = await cleanupResponse.json()
    console.log('   ✓ Cleanup API successful!')
    console.log('   Cleanup result:', cleanupResult)
    
    console.log('\n✅ Manual Cleanup API Test Results:')
    console.log('   • Admin authentication: ✓ Working')
    console.log('   • Cleanup endpoint access: ✓ Working')
    console.log('   • Cleanup functionality: ✓ Working')
    
    console.log('\n📊 Cleanup Summary:')
    console.log(`   • Initial notifications: ${cleanupResult.result.initialCount}`)
    console.log(`   • Remaining notifications: ${cleanupResult.result.remainingCount}`)
    console.log(`   • Removed notifications: ${cleanupResult.result.removedCount}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Wait a moment for server to start, then run test
setTimeout(() => {
  testManualCleanupAPI()
}, 2000)