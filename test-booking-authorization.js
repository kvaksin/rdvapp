/**
 * Test script to verify booking authorization logic
 */
import * as auth from './server/auth.js'

// Mock booking data for testing
const mockBookings = [
  {
    id: "booking1",
    slotId: "slot1", 
    childName: "L V",
    childId: "1760987412903jgn9r0hvq", // Child of parent 17609874129012qwwngohj and 1760987485428lsqelciy6
    bookedAt: "2025-10-20T21:25:27.310Z",
    cancelled: false
  },
  {
    id: "booking2", 
    slotId: "slot2",
    childName: "Sara Sara", 
    childId: "1760995399380nqxzap4o7", // Child of parent 176099539937579fx059if
    bookedAt: "2025-10-20T21:24:40.146Z",
    cancelled: false
  }
]

console.log('🧪 Testing Booking Authorization Logic...\n')

// Test Cases
const testCases = [
  {
    name: "Admin can manage any booking",
    userId: "admin-1",
    booking: mockBookings[0],
    expectedResult: true
  },
  {
    name: "Class lead can manage bookings in their class", 
    userId: "1760987051915h0hmoo3i7", // m3c - class lead
    booking: mockBookings[0],
    expectedResult: true // Should be true if slot is in their class
  },
  {
    name: "Parent can manage their own child's booking",
    userId: "17609874129012qwwngohj", // K V - parent of L V
    booking: mockBookings[0], // L V's booking
    expectedResult: true
  },
  {
    name: "Parent cannot manage other parent's child's booking",
    userId: "17609874129012qwwngohj", // K V - parent of L V  
    booking: mockBookings[1], // Sara Sara's booking (different parent)
    expectedResult: false
  },
  {
    name: "Second parent can manage shared child's booking",
    userId: "1760987485428lsqelciy6", // v l - also parent of L V
    booking: mockBookings[0], // L V's booking
    expectedResult: true
  },
  {
    name: "Non-parent cannot manage any booking",
    userId: "176099539937579fx059if", // Val - parent of Sara Sara
    booking: mockBookings[0], // L V's booking (not their child)
    expectedResult: false
  }
]

// Run tests
async function runTests() {
  let passed = 0
  let failed = 0

  for (let index = 0; index < testCases.length; index++) {
    const testCase = testCases[index]
    try {
      const result = await auth.canManageBooking(testCase.userId, testCase.booking)
      const success = result === testCase.expectedResult
      
      if (success) {
        console.log(`✅ Test ${index + 1}: ${testCase.name}`)
        passed++
      } else {
        console.log(`❌ Test ${index + 1}: ${testCase.name}`)
        console.log(`   Expected: ${testCase.expectedResult}, Got: ${result}`)
        failed++
      }
    } catch (error) {
      console.log(`💥 Test ${index + 1}: ${testCase.name} - ERROR: ${error.message}`)
      failed++
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

  if (failed === 0) {
    console.log('🎉 All tests passed! Booking authorization is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please review the authorization logic.')
  }
}

// Run the tests
runTests().catch(console.error)