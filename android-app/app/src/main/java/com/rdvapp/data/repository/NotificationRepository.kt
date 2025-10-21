package com.rdvapp.data.repository

import com.rdvapp.data.model.NotificationData
import com.rdvapp.data.model.NotificationPreferences
import kotlinx.coroutines.flow.Flow

interface NotificationRepository {
    suspend fun storeNotification(
        id: String,
        type: String,
        title: String,
        body: String,
        data: Map<String, String>
    )
    
    suspend fun getNotifications(): List<NotificationData>
    
    suspend fun markNotificationAsRead(notificationId: String)
    
    suspend fun deleteNotification(notificationId: String)
    
    suspend fun getUnreadNotificationCount(): Int
    
    suspend fun getNotificationPreferences(): NotificationPreferences
    
    suspend fun updateNotificationPreferences(preferences: NotificationPreferences)
    
    fun getNotificationsFlow(): Flow<List<NotificationData>>
    
    fun getUnreadCountFlow(): Flow<Int>
}