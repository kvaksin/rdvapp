// Test script to verify that users with non-approved status cannot access protected endpoints
import axios from 'axios'

const BASE_URL = 'http://localhost:4000'

async function testUserStatusSecurity() {
  console.log('🔒 Testing user status security...\n')
  
  try {
    // Create a test user with pending status
    console.log('1. Creating test user with pending status...')
    
    // First, let's create a user through the registration endpoint
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'security.test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      roles: ['parent']
    })
    
    const { token } = registerResponse.data
    console.log('   ✅ User created with token')
    
    // The user should start with pending status, so let's try to access a protected endpoint
    console.log('\n2. Attempting to access protected endpoint with pending user...')
    
    try {
      const slotsResponse = await axios.get(`${BASE_URL}/api/slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('   ❌ SECURITY VULNERABILITY: Pending user was able to access /api/slots!')
      console.log('   Response:', slotsResponse.status, slotsResponse.statusText)
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('   ✅ SECURITY WORKING: Pending user correctly denied access')
        console.log('   Error:', error.response.data.error)
        console.log('   Details:', error.response.data.details)
      } else {
        console.log('   ⚠️  Unexpected error:', error.message)
      }
    }
    
    // Now let's approve the user and test again
    console.log('\n3. Approving the user...')
    
    // Get admin token
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Tenbosch@123'
    })
    
    const adminToken = adminLoginResponse.data.token
    
    // Get the user ID
    const usersResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    
    const testUser = usersResponse.data.find(u => u.email === 'security.test@example.com')
    
    if (!testUser) {
      console.log('   ❌ Could not find test user')
      return
    }
    
    // Approve the user
    await axios.post(`${BASE_URL}/auth/approve/${testUser.id}`, {}, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    
    console.log('   ✅ User approved')
    
    // Test access again with same token
    console.log('\n4. Testing access with approved user (same token)...')
    
    try {
      const slotsResponse = await axios.get(`${BASE_URL}/api/slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('   ✅ Approved user successfully accessed /api/slots')
      console.log('   Found slots:', slotsResponse.data.length)
    } catch (error) {
      console.log('   ❌ Approved user denied access:', error.response?.data?.error || error.message)
    }
    
    // Clean up - delete the test user
    console.log('\n5. Cleaning up test user...')
    
    try {
      await axios.delete(`${BASE_URL}/auth/delete-users`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        data: {
          userIds: [testUser.id]
        }
      })
      console.log('   ✅ Test user cleaned up')
    } catch (error) {
      console.log('   ⚠️  Could not clean up test user:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
    }
  }
}

// Run the test
testUserStatusSecurity()