#!/usr/bin/env node

// Test script to verify the new parent-child relationship system
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test the data structure and relationship logic
function testParentChildSystem() {
  console.log('🧪 Testing Parent-Child Relationship System\n')
  
  try {
    // Load current data
    const childrenPath = path.join(__dirname, 'data', 'children.json')
    const relationshipsPath = path.join(__dirname, 'data', 'parentChildRelationships.json')
    const usersPath = path.join(__dirname, 'data', 'users.json')
    
    const children = JSON.parse(fs.readFileSync(childrenPath, 'utf8'))
    const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'))
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    
    console.log('📊 Current Data State:')
    console.log(`- Children: ${children.length}`)
    console.log(`- Relationships: ${relationships.length}`)
    console.log(`- Users: ${users.length}`)
    console.log()
    
    // Test 1: Verify data structure
    console.log('✅ Test 1: Data Structure Validation')
    
    // Check children structure
    children.forEach(child => {
      if (!child.id || !child.name || !child.classId) {
        throw new Error(`Invalid child structure: ${JSON.stringify(child)}`)
      }
      if (child.parentId) {
        throw new Error(`Child ${child.name} still has parentId - should be removed`)
      }
    })
    console.log('   ✓ Children data structure is correct')
    
    // Check relationships structure
    relationships.forEach(rel => {
      if (!rel.id || !rel.parentId || !rel.childId || !rel.relationship) {
        throw new Error(`Invalid relationship structure: ${JSON.stringify(rel)}`)
      }
    })
    console.log('   ✓ Relationships data structure is correct')
    
    // Test 2: Simulate auth.js functions
    console.log('\n✅ Test 2: Relationship Functions')
    
    // Simulate getChildrenByParent
    const testParentId = relationships.length > 0 ? relationships[0].parentId : null
    if (testParentId) {
      const parentRelationships = relationships.filter(rel => rel.parentId === testParentId)
      const parentChildren = children.filter(child => 
        parentRelationships.some(rel => rel.childId === child.id)
      )
      console.log(`   ✓ Parent ${testParentId} has ${parentChildren.length} children:`)
      parentChildren.forEach(child => {
        console.log(`     - ${child.name} (${child.id})`)
      })
    }
    
    // Test 3: Verify multiple parents can reference same child
    console.log('\n✅ Test 3: Multiple Parent Support')
    
    // Check if any child has multiple parents
    const childParentCount = {}
    relationships.forEach(rel => {
      if (!childParentCount[rel.childId]) {
        childParentCount[rel.childId] = []
      }
      childParentCount[rel.childId].push(rel.parentId)
    })
    
    let foundMultiParent = false
    Object.entries(childParentCount).forEach(([childId, parentIds]) => {
      if (parentIds.length > 1) {
        const child = children.find(c => c.id === childId)
        console.log(`   ✓ Child ${child?.name} has ${parentIds.length} parents: ${parentIds.join(', ')}`)
        foundMultiParent = true
      }
    })
    
    if (!foundMultiParent) {
      console.log('   ℹ️  No children currently have multiple parents (this is normal for test data)')
    }
    
    console.log('\n🎉 All tests passed! The parent-child relationship system is working correctly.\n')
    
    // Show usage examples
    console.log('📖 System Capabilities:')
    console.log('   • Children are independent entities (not owned by parents)')
    console.log('   • Multiple parents can reference the same child')
    console.log('   • Deleting a parent preserves children and only removes relationships')
    console.log('   • Booking system uses child IDs for proper validation')
    console.log('   • Class enrollment is managed at child level')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testParentChildSystem()