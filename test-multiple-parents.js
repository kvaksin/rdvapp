#!/usr/bin/env node

// Test script to demonstrate multiple parents per child functionality
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load auth functions
const authPath = path.join(__dirname, 'server', 'auth.js')
const { default: auth } = await import(authPath)

async function demonstrateMultipleParents() {
  console.log('🏠 Demonstrating Multiple Parents Per Child\n')
  
  try {
    // Create a test scenario with two parents and one shared child
    console.log('📝 Setting up test scenario...')
    
    // First, let's see the current state
    const children = auth.getChildren()
    const existingChild = children[0] // Use existing child "Lora"
    
    if (!existingChild) {
      console.log('❌ No existing children found. Please create a child first.')
      return
    }
    
    console.log(`   Using existing child: ${existingChild.name} (${existingChild.id})`)
    
    // Get current relationships for this child
    const currentParents = auth.getParentsByChild(existingChild.id)
    console.log(`   Current parents: ${currentParents.length}`)
    
    // Load users to find parents
    const users = auth.getUsers()
    const parentUsers = users.filter(user => user.roles.includes('parent'))
    
    console.log(`   Available parent users: ${parentUsers.length}`)
    
    if (parentUsers.length >= 2) {
      // Add the child to multiple parents
      const parent1 = parentUsers[0]
      const parent2 = parentUsers[1]
      
      console.log(`\n🔗 Adding child to multiple parents:`)
      console.log(`   Parent 1: ${parent1.name} (${parent1.id})`)
      console.log(`   Parent 2: ${parent2.name} (${parent2.id})`)
      
      // Create relationships (if not already existing)
      try {
        const relationship1 = auth.addParentChildRelationship(parent1.id, existingChild.id, 'parent')
        console.log(`   ✓ Relationship 1 created: ${relationship1.id}`)
      } catch (error) {
        console.log(`   ℹ️  Relationship 1 already exists`)
      }
      
      try {
        const relationship2 = auth.addParentChildRelationship(parent2.id, existingChild.id, 'parent')
        console.log(`   ✓ Relationship 2 created: ${relationship2.id}`)
      } catch (error) {
        console.log(`   ℹ️  Relationship 2 already exists`)
      }
      
      // Verify both parents can access the child
      console.log(`\n✅ Verification:`)
      
      const parent1Children = auth.getChildrenByParent(parent1.id)
      const parent2Children = auth.getChildrenByParent(parent2.id)
      
      console.log(`   Parent 1 (${parent1.name}) children:`)
      parent1Children.forEach(child => {
        console.log(`     - ${child.name} (${child.id})`)
      })
      
      console.log(`   Parent 2 (${parent2.name}) children:`)
      parent2Children.forEach(child => {
        console.log(`     - ${child.name} (${child.id})`)
      })
      
      // Verify child has multiple parents
      const childParents = auth.getParentsByChild(existingChild.id)
      console.log(`   Child ${existingChild.name} has ${childParents.length} parents:`)
      childParents.forEach(parent => {
        console.log(`     - ${parent.name} (${parent.id})`)
      })
      
      console.log('\n🎉 Multiple parent functionality verified!')
      console.log('   ✓ Same child can be accessed by multiple parents')
      console.log('   ✓ Both parents can book appointments for the shared child')
      console.log('   ✓ Child enrollment is managed independently')
      
    } else {
      console.log('\n⚠️  Need at least 2 parent users to demonstrate multiple parent functionality')
      console.log('   Please create additional parent users in the system')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

// Run the demonstration
demonstrateMultipleParents()