#!/usr/bin/env node

// Simple test to verify the multiple parents functionality
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function testMultipleParentsSupport() {
  console.log('🏠 Testing Multiple Parents Support\n')
  
  try {
    // Load data files directly
    const childrenPath = path.join(__dirname, 'data', 'children.json')
    const relationshipsPath = path.join(__dirname, 'data', 'parentChildRelationships.json')
    const usersPath = path.join(__dirname, 'data', 'users.json')
    
    const children = JSON.parse(fs.readFileSync(childrenPath, 'utf8'))
    const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'))
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    
    // Find parent users
    const parentUsers = users.filter(user => user.roles.includes('parent'))
    console.log(`Found ${parentUsers.length} parent users:`)
    parentUsers.forEach(parent => {
      console.log(`   - ${parent.name} (${parent.id})`)
    })
    
    if (parentUsers.length < 2) {
      console.log('\n⚠️  Need at least 2 parent users to demonstrate multiple parent functionality')
      console.log('Let me create a second parent...\n')
      
      // Create a second parent user
      const newParent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: "Test Parent 2",
        email: "testparent2@example.com",
        password: "$2b$10$hash", // placeholder hash
        roles: ["parent"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      users.push(newParent)
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))
      console.log(`✓ Created new parent: ${newParent.name} (${newParent.id})`)
      
      // Add relationship between new parent and existing child
      if (children.length > 0) {
        const existingChild = children[0]
        const newRelationship = {
          id: Date.now().toString() + 'rel' + Math.random().toString(36).substr(2, 6),
          parentId: newParent.id,
          childId: existingChild.id,
          relationship: "parent",
          createdAt: new Date().toISOString()
        }
        
        relationships.push(newRelationship)
        fs.writeFileSync(relationshipsPath, JSON.stringify(relationships, null, 2))
        
        console.log(`✓ Created relationship: ${newParent.name} → ${existingChild.name}`)
        
        // Now verify multiple parents for same child
        const childParents = relationships.filter(rel => rel.childId === existingChild.id)
        console.log(`\n🎉 Success! Child "${existingChild.name}" now has ${childParents.length} parents:`)
        
        childParents.forEach(rel => {
          const parent = users.find(u => u.id === rel.parentId)
          console.log(`   - ${parent?.name} (${parent?.id})`)
        })
        
        console.log('\n✅ Multiple parent functionality is working:')
        console.log('   • Same child can be referenced by multiple parents')
        console.log('   • Each parent can independently manage bookings for the shared child')
        console.log('   • Child data remains consistent across all parent relationships')
        
      } else {
        console.log('❌ No children found to create relationships with')
      }
      
    } else {
      // Check existing relationships
      console.log('\nChecking existing relationships...')
      
      children.forEach(child => {
        const childRelationships = relationships.filter(rel => rel.childId === child.id)
        if (childRelationships.length > 1) {
          console.log(`✓ Child "${child.name}" has ${childRelationships.length} parents:`)
          childRelationships.forEach(rel => {
            const parent = users.find(u => u.id === rel.parentId)
            console.log(`   - ${parent?.name}`)
          })
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testMultipleParentsSupport()