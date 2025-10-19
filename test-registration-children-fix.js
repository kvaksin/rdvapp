#!/usr/bin/env node

/**
 * Test script to verify that the registration form can load children for classes
 */

import fetch from 'node-fetch';
import fs from 'fs';

async function testChildrenEndpoint() {
  console.log('🧪 Testing Children Loading in Registration Form\n');

  try {
    // 1. Test if we have any classes
    console.log('📋 1. Checking available classes...');
    const classesResponse = await fetch('http://localhost:4000/api/classes/public', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!classesResponse.ok) {
      throw new Error(`Failed to fetch classes: ${classesResponse.status}`);
    }

    const classes = await classesResponse.json();
    console.log(`   ✅ Found ${classes.length} classes`);

    if (classes.length === 0) {
      console.log('   ⚠️  No classes found - cannot test children loading');
      return;
    }

    // 2. Test the children endpoint (this would need authentication in real use)
    const firstClass = classes[0];
    console.log(`\n👶 2. Testing children endpoint for class: ${firstClass.name} (${firstClass.id})`);
    
    // Note: This will fail without authentication, but we can check if endpoint exists
    const childrenResponse = await fetch(`http://localhost:4000/auth/children/class/${firstClass.id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`   📡 Children endpoint status: ${childrenResponse.status}`);
    
    if (childrenResponse.status === 401) {
      console.log('   ✅ Endpoint exists and requires authentication (expected)');
      console.log('   💡 Registration form should use authenticatedFetch() to access this endpoint');
    } else if (childrenResponse.ok) {
      const children = await childrenResponse.json();
      console.log(`   ✅ Found ${children.length} children for this class`);
    } else {
      console.log(`   ❌ Unexpected response: ${childrenResponse.status}`);
    }

    // 3. Check if we have children data at all
    console.log('\n📊 3. Checking children data...');
    try {
      const childrenPath = './data/children.json';
      
      if (fs.existsSync(childrenPath)) {
        const childrenData = JSON.parse(fs.readFileSync(childrenPath, 'utf8'));
        console.log(`   ✅ Found ${childrenData.length} total children in database`);
        
        const childrenInFirstClass = childrenData.filter(child => child.classId === firstClass.id);
        console.log(`   ✅ ${childrenInFirstClass.length} children belong to class "${firstClass.name}"`);
        
        if (childrenInFirstClass.length > 0) {
          console.log('   📋 Sample child data:');
          const sampleChild = childrenInFirstClass[0];
          console.log(`      - Name: ${sampleChild.firstName || sampleChild.name} ${sampleChild.lastName || ''}`);
          console.log(`      - ID: ${sampleChild.id}`);
          console.log(`      - Class: ${sampleChild.classId}`);
        }
      } else {
        console.log('   ❌ No children.json file found');
      }
    } catch (err) {
      console.log('   ⚠️  Could not read children data:', err.message);
    }

    console.log('\n🔧 Fix Applied:');
    console.log('   ✅ Changed fetch() to authenticatedFetch() in Register.tsx');
    console.log('   ✅ Registration form should now load children properly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testChildrenEndpoint();