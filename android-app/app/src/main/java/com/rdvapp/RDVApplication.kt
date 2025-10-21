package com.rdvapp

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class RDVApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize any global configurations here
        setupNotificationChannels()
    }
    
    private fun setupNotificationChannels() {
        // Notification channels will be created by NotificationService
        // when it's first initialized
    }
}