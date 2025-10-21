package com.rdvapp.data.model

data class NotificationData(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val data: Map<String, String>,
    val isRead: Boolean,
    val createdAt: Long
) {
    val isAppointmentReminder: Boolean
        get() = type == "appointment_reminder"
    
    val isNewMessage: Boolean
        get() = type == "new_message"
    
    val isSystemNotification: Boolean
        get() = type == "system_notification"
    
    val formattedTime: String
        get() = java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault())
            .format(java.util.Date(createdAt))
}

data class NotificationPreferences(
    val appointmentsEnabled: Boolean = true,
    val messagesEnabled: Boolean = true,
    val systemEnabled: Boolean = true,
    val soundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val quietHoursEnabled: Boolean = false,
    val quietStartTime: String = "22:00",
    val quietEndTime: String = "08:00"
)