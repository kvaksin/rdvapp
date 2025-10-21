package com.rdvapp.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.google.gson.Gson
import com.rdvapp.data.local.dao.NotificationDao
import com.rdvapp.data.local.entity.NotificationEntity
import com.rdvapp.data.model.NotificationData
import com.rdvapp.data.model.NotificationPreferences
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val notificationDao: NotificationDao,
    private val dataStore: DataStore<Preferences>,
    private val gson: Gson
) : NotificationRepository {
    
    companion object {
        private val APPOINTMENTS_ENABLED = booleanPreferencesKey("notifications_appointments")
        private val MESSAGES_ENABLED = booleanPreferencesKey("notifications_messages")
        private val SYSTEM_ENABLED = booleanPreferencesKey("notifications_system")
        private val SOUND_ENABLED = booleanPreferencesKey("notifications_sound")
        private val VIBRATION_ENABLED = booleanPreferencesKey("notifications_vibration")
        private val QUIET_HOURS_ENABLED = booleanPreferencesKey("notifications_quiet_hours")
        private val QUIET_START_TIME = stringPreferencesKey("notifications_quiet_start")
        private val QUIET_END_TIME = stringPreferencesKey("notifications_quiet_end")
    }
    
    override suspend fun storeNotification(
        id: String,
        type: String,
        title: String,
        body: String,
        data: Map<String, String>
    ) {
        val entity = NotificationEntity(
            id = id,
            type = type,
            title = title,
            body = body,
            data = gson.toJson(data),
            isRead = false,
            createdAt = System.currentTimeMillis()
        )
        notificationDao.insertNotification(entity)
    }
    
    override suspend fun getNotifications(): List<NotificationData> {
        return notificationDao.getAllNotifications().map { entity ->
            NotificationData(
                id = entity.id,
                type = entity.type,
                title = entity.title,
                body = entity.body,
                data = gson.fromJson(entity.data, Map::class.java) as? Map<String, String> ?: emptyMap(),
                isRead = entity.isRead,
                createdAt = entity.createdAt
            )
        }
    }
    
    override suspend fun markNotificationAsRead(notificationId: String) {
        notificationDao.markAsRead(notificationId)
    }
    
    override suspend fun deleteNotification(notificationId: String) {
        notificationDao.deleteNotification(notificationId)
    }
    
    override suspend fun getUnreadNotificationCount(): Int {
        return notificationDao.getUnreadCount()
    }
    
    override suspend fun getNotificationPreferences(): NotificationPreferences {
        val preferences = dataStore.data.first()
        return NotificationPreferences(
            appointmentsEnabled = preferences[APPOINTMENTS_ENABLED] ?: true,
            messagesEnabled = preferences[MESSAGES_ENABLED] ?: true,
            systemEnabled = preferences[SYSTEM_ENABLED] ?: true,
            soundEnabled = preferences[SOUND_ENABLED] ?: true,
            vibrationEnabled = preferences[VIBRATION_ENABLED] ?: true,
            quietHoursEnabled = preferences[QUIET_HOURS_ENABLED] ?: false,
            quietStartTime = preferences[QUIET_START_TIME] ?: "22:00",
            quietEndTime = preferences[QUIET_END_TIME] ?: "08:00"
        )
    }
    
    override suspend fun updateNotificationPreferences(preferences: NotificationPreferences) {
        dataStore.edit { prefs ->
            prefs[APPOINTMENTS_ENABLED] = preferences.appointmentsEnabled
            prefs[MESSAGES_ENABLED] = preferences.messagesEnabled
            prefs[SYSTEM_ENABLED] = preferences.systemEnabled
            prefs[SOUND_ENABLED] = preferences.soundEnabled
            prefs[VIBRATION_ENABLED] = preferences.vibrationEnabled
            prefs[QUIET_HOURS_ENABLED] = preferences.quietHoursEnabled
            prefs[QUIET_START_TIME] = preferences.quietStartTime
            prefs[QUIET_END_TIME] = preferences.quietEndTime
        }
    }
    
    override fun getNotificationsFlow(): Flow<List<NotificationData>> {
        return notificationDao.getAllNotificationsFlow().map { entities ->
            entities.map { entity ->
                NotificationData(
                    id = entity.id,
                    type = entity.type,
                    title = entity.title,
                    body = entity.body,
                    data = gson.fromJson(entity.data, Map::class.java) as? Map<String, String> ?: emptyMap(),
                    isRead = entity.isRead,
                    createdAt = entity.createdAt
                )
            }
        }
    }
    
    override fun getUnreadCountFlow(): Flow<Int> {
        return notificationDao.getUnreadCountFlow()
    }
}