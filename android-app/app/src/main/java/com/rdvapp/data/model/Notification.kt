package com.rdvapp.data.model

import kotlinx.serialization.Serializable

@Serializable
data class NotificationPreferences(
    val id: String,
    val userId: String,
    val appointmentConfirmations: Boolean = true,
    val appointmentReminders: Boolean = true,
    val reminderTiming: ReminderTiming = ReminderTiming.BOTH,
    val messageNotifications: Boolean = true,
    val systemNotifications: Boolean = true,
    val quietHoursEnabled: Boolean = false,
    val quietHoursStart: String = "22:00", // HH:mm format
    val quietHoursEnd: String = "08:00",   // HH:mm format
    val soundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val updatedAt: String
)

@Serializable
enum class ReminderTiming {
    NONE,
    ONE_HOUR,
    TWENTY_FOUR_HOURS,
    BOTH
}

@Serializable
data class UpdateNotificationPreferencesRequest(
    val appointmentConfirmations: Boolean? = null,
    val appointmentReminders: Boolean? = null,
    val reminderTiming: ReminderTiming? = null,
    val messageNotifications: Boolean? = null,
    val systemNotifications: Boolean? = null,
    val quietHoursEnabled: Boolean? = null,
    val quietHoursStart: String? = null,
    val quietHoursEnd: String? = null,
    val soundEnabled: Boolean? = null,
    val vibrationEnabled: Boolean? = null
)

@Serializable
data class NotificationPreferencesResponse(
    val preferences: NotificationPreferences
)

@Serializable
data class DeviceTokenRequest(
    val token: String,
    val platform: String = "android"
)

@Serializable
data class DeviceTokenResponse(
    val success: Boolean,
    val message: String
)

@Serializable
data class PushNotification(
    val id: String,
    val title: String,
    val body: String,
    val data: Map<String, String> = emptyMap(),
    val imageUrl: String? = null,
    val scheduledFor: String? = null,
    val sentAt: String? = null
)

@Serializable
data class NotificationHistory(
    val notifications: List<PushNotification>,
    val totalCount: Int
)

// Extension functions for display
fun ReminderTiming.displayName(): String = when (this) {
    ReminderTiming.NONE -> "No Reminders"
    ReminderTiming.ONE_HOUR -> "1 Hour Before"
    ReminderTiming.TWENTY_FOUR_HOURS -> "24 Hours Before"
    ReminderTiming.BOTH -> "Both (24h & 1h)"
}

fun NotificationPreferences.isInQuietHours(currentTime: String): Boolean {
    if (!quietHoursEnabled) return false
    
    // This is a simplified check - real implementation would need proper time parsing
    val current = currentTime.replace(":", "").toIntOrNull() ?: return false
    val start = quietHoursStart.replace(":", "").toIntOrNull() ?: return false
    val end = quietHoursEnd.replace(":", "").toIntOrNull() ?: return false
    
    return if (start <= end) {
        current in start..end
    } else {
        current >= start || current <= end
    }
}