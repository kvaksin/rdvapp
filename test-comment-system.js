const baseUrl = 'http://localhost:4000'

// Test comment and deletion functionality
async function testCommentSystem() {
  console.log('Testing comment and message deletion system...')
  
  try {
    // First login as admin
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    })
    
    if (!loginRes.ok) {
      throw new Error('Login failed')
    }
    
    const loginData = await loginRes.json()
    const adminToken = loginData.token
    console.log('✓ Admin login successful')
    
    // Get existing messages
    const messagesRes = await fetch(`${baseUrl}/api/messages`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    
    if (!messagesRes.ok) {
      throw new Error('Failed to get messages')
    }
    
    const messages = await messagesRes.json()
    console.log(`✓ Found ${messages.length} messages`)
    
    if (messages.length === 0) {
      console.log('No messages to test with. Creating a test message first...')
      
      // Create a test message
      const createRes = await fetch(`${baseUrl}/api/messages/admin-to-class`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: 'Test Message for Comments',
          message: 'This is a test message to test the comment functionality.',
          classIds: ['71779d11-0f9b-4dd7-bece-75560921b5b4']
        })
      })
      
      if (!createRes.ok) {
        throw new Error('Failed to create test message')
      }
      
      console.log('✓ Test message created')
      
      // Refetch messages
      const messagesRes2 = await fetch(`${baseUrl}/api/messages`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const updatedMessages = await messagesRes2.json()
      messages.push(...updatedMessages)
    }
    
    const testMessage = messages[0]
    console.log(`✓ Testing with message: "${testMessage.subject || testMessage.message.substring(0, 30)}..."`)
    
    // Test 1: Add a comment
    const commentRes = await fetch(`${baseUrl}/api/messages/${testMessage.id}/comments`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comment: 'This is a test comment from the admin user.'
      })
    })
    
    if (!commentRes.ok) {
      throw new Error('Failed to add comment')
    }
    
    const newComment = await commentRes.json()
    console.log('✓ Comment added successfully:', newComment.comment)
    
    // Test 2: Get comments for message
    const getCommentsRes = await fetch(`${baseUrl}/api/messages/${testMessage.id}/comments`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    
    if (!getCommentsRes.ok) {
      throw new Error('Failed to get comments')
    }
    
    const comments = await getCommentsRes.json()
    console.log(`✓ Retrieved ${comments.length} comments for message`)
    
    // Test 3: Delete the comment
    if (comments.length > 0) {
      const deleteCommentRes = await fetch(`${baseUrl}/api/messages/comments/${comments[0].id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      
      if (!deleteCommentRes.ok) {
        throw new Error('Failed to delete comment')
      }
      
      console.log('✓ Comment deleted successfully')
    }
    
    // Test 4: Test unauthorized access (try to delete a message as a different user)
    console.log('Testing authorization...')
    
    // Login as class lead
    const classLeadRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'm3c@ex.com',
        password: 'classLead123'
      })
    })
    
    if (classLeadRes.ok) {
      const classLeadData = await classLeadRes.json()
      const classLeadToken = classLeadData.token
      
      // Try to delete admin message as class lead (should fail)
      const unauthorizedDelete = await fetch(`${baseUrl}/api/messages/${testMessage.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${classLeadToken}` }
      })
      
      if (unauthorizedDelete.status === 404 || unauthorizedDelete.status === 403) {
        console.log('✓ Authorization working - class lead cannot delete admin message')
      } else {
        console.log('⚠ Authorization issue - class lead was able to delete admin message')
      }
    }
    
    console.log('\n🎉 All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testCommentSystem()