#!/usr/bin/env node

// Test script for notification cleanup functionality
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function testNotificationCleanup() {
  console.log('🧹 Testing Notification Cleanup Functionality\n')
  
  try {
    const notificationsPath = path.join(__dirname, 'data', 'notifications.json')
    
    // Read current notifications
    let notifications = []
    if (fs.existsSync(notificationsPath)) {
      notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf8'))
    }
    
    console.log('📊 Current Notifications State:')
    console.log(`   Total notifications: ${notifications.length}`)
    
    if (notifications.length === 0) {
      console.log('   No notifications found to test with')
      return
    }
    
    // Analyze notification ages
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    let oldNotifications = []
    let recentNotifications = []
    
    notifications.forEach(notification => {
      const createdAt = new Date(notification.createdAt)
      const ageInDays = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000))
      
      if (createdAt <= thirtyDaysAgo) {
        oldNotifications.push({ ...notification, ageInDays })
      } else {
        recentNotifications.push({ ...notification, ageInDays })
      }
    })
    
    console.log(`   Old notifications (30+ days): ${oldNotifications.length}`)
    console.log(`   Recent notifications (<30 days): ${recentNotifications.length}`)
    
    if (oldNotifications.length > 0) {
      console.log('\n📅 Old Notifications to be cleaned:')
      oldNotifications.forEach(notif => {
        console.log(`   - ${notif.type} (${notif.ageInDays} days old): ${notif.message.substring(0, 50)}...`)
      })
    }
    
    if (recentNotifications.length > 0) {
      console.log('\n📅 Recent Notifications to be kept:')
      recentNotifications.slice(0, 5).forEach(notif => {
        console.log(`   - ${notif.type} (${notif.ageInDays} days old): ${notif.message.substring(0, 50)}...`)
      })
      if (recentNotifications.length > 5) {
        console.log(`   ... and ${recentNotifications.length - 5} more recent notifications`)
      }
    }
    
    // Create test scenario with old notifications if none exist
    if (oldNotifications.length === 0) {
      console.log('\n🧪 Creating test notifications with old dates...')
      
      const testOldNotifications = [
        {
          id: 'test-old-1',
          type: 'test_old_notification',
          recipientId: 'admin-1',
          senderId: 'system',
          message: 'Test old notification 1 - should be cleaned up',
          isRead: true,
          createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
          status: 'sent'
        },
        {
          id: 'test-old-2',
          type: 'test_old_notification',
          recipientId: 'admin-1',
          senderId: 'system',
          message: 'Test old notification 2 - should be cleaned up',
          isRead: false,
          createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
          status: 'sent'
        },
        {
          id: 'test-recent-1',
          type: 'test_recent_notification',
          recipientId: 'admin-1',
          senderId: 'system',
          message: 'Test recent notification - should be kept',
          isRead: false,
          createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
          status: 'sent'
        }
      ]
      
      const updatedNotifications = [...notifications, ...testOldNotifications]
      fs.writeFileSync(notificationsPath, JSON.stringify(updatedNotifications, null, 2))
      
      console.log(`   ✓ Added ${testOldNotifications.length} test notifications`)
      console.log('   - 2 old notifications (35 and 45 days old)')
      console.log('   - 1 recent notification (15 days old)')
      
      // Re-analyze after adding test data
      oldNotifications = testOldNotifications.filter(n => new Date(n.createdAt) <= thirtyDaysAgo)
      recentNotifications = [...recentNotifications, ...testOldNotifications.filter(n => new Date(n.createdAt) > thirtyDaysAgo)]
    }
    
    console.log('\n🎯 Expected Cleanup Results:')
    console.log(`   Notifications to remove: ${oldNotifications.length}`)
    console.log(`   Notifications to keep: ${recentNotifications.length}`)
    
    console.log('\n✅ Test Setup Complete!')
    console.log('   • Notification cleanup function ready to test')
    console.log('   • Server will run cleanup on startup and daily at 2 AM')
    console.log('   • Administrators can manually trigger cleanup via API')
    
    console.log('\n🔧 Manual Testing:')
    console.log('   1. Start the server: npm run dev')
    console.log('   2. Check server logs for cleanup messages')
    console.log('   3. Use admin API: POST /api/auth/notifications/cleanup')
    console.log('   4. Verify old notifications are removed from notifications.json')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

// Run the test
testNotificationCleanup()