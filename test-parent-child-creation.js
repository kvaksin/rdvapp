// Test script to verify parent child creation functionality
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Base URL for the API
const API_BASE = 'http://localhost:4000';

// Test function to login and create a child
async function testParentChildCreation() {
  try {
    console.log('Testing parent child creation...');
    
    // Step 1: Login as parent
    console.log('\n1. Logging in as parent...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'vl@ex.com', // Using the parent without class assignment
        password: '123123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.user.email);
    
    const token = loginData.token;
    
    // Step 2: Get available classes
    console.log('\n2. Getting available classes...');
    const classesResponse = await fetch(`${API_BASE}/api/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!classesResponse.ok) {
      throw new Error(`Failed to get classes: ${classesResponse.status}`);
    }
    
    const classesData = await classesResponse.json();
    console.log('Available classes:', classesData.map(c => ({ id: c.id, name: c.name })));
    
    // Step 3: Try to create a child for a class the parent doesn't have explicit access to
    const targetClassId = classesData[0]?.id; // Use first available class
    if (!targetClassId) {
      throw new Error('No classes available');
    }
    
    console.log(`\n3. Creating child for class: ${targetClassId}`);
    const createChildResponse = await fetch(`${API_BASE}/api/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        firstName: 'TestUnique',
        lastName: `Child${Date.now()}`,
        classId: targetClassId
      })
    });
    
    const createChildData = await createChildResponse.json();
    
    if (!createChildResponse.ok) {
      console.error('Child creation failed:', createChildResponse.status, createChildData);
      return false;
    }
    
    console.log('Child creation successful:', createChildData);
    return true;
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

// Run the test
testParentChildCreation().then(success => {
  if (success) {
    console.log('\n✅ Test PASSED: Parent can create children for any class');
  } else {
    console.log('\n❌ Test FAILED: Parent still cannot create children');
  }
  rl.close();
}).catch(error => {
  console.error('Test error:', error);
  rl.close();
});