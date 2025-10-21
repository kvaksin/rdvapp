package com.rdvapp.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.rdvapp.MainActivity
import com.rdvapp.R
import com.rdvapp.data.repository.AuthRepository
import com.rdvapp.data.repository.NotificationRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class RDVFirebaseMessagingService : FirebaseMessagingService() {
    
    @Inject
    lateinit var authRepository: AuthRepository
    
    @Inject
    lateinit var notificationRepository: NotificationRepository
    
    private val serviceScope = CoroutineScope(Dispatchers.IO)
    
    companion object {
        private const val TAG = "FCM"
        private const val NOTIFICATION_CHANNEL_ID = "rdv_notifications"
        private const val NOTIFICATION_CHANNEL_NAME = "RDV Notifications"
        private const val NOTIFICATION_CHANNEL_DESCRIPTION = "Notifications for RDV app"
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: $token")
        
        // Send token to server
        serviceScope.launch {
            try {
                authRepository.updateFCMToken(token)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to update FCM token", e)
            }
        }
    }
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "From: ${remoteMessage.from}")
        
        // Check if message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            handleDataMessage(remoteMessage.data)
        }
        
        // Check if message contains a notification payload
        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            showNotification(
                title = it.title ?: "RDV Notification",
                body = it.body ?: "",
                data = remoteMessage.data
            )
        }
        
        // If no notification payload, create one from data
        if (remoteMessage.notification == null && remoteMessage.data.isNotEmpty()) {
            val title = remoteMessage.data["title"] ?: "RDV Notification"
            val body = remoteMessage.data["body"] ?: "You have a new notification"
            showNotification(title, body, remoteMessage.data)
        }
    }
    
    private fun handleDataMessage(data: Map<String, String>) {
        val notificationType = data["type"]
        val notificationId = data["notification_id"]
        
        when (notificationType) {
            "appointment_reminder" -> {
                val appointmentId = data["appointment_id"]
                val time = data["time"]
                showAppointmentReminder(appointmentId, time)
            }
            "appointment_cancelled" -> {
                val appointmentId = data["appointment_id"]
                showAppointmentCancellation(appointmentId)
            }
            "new_message" -> {
                val messageId = data["message_id"]
                val senderName = data["sender_name"]
                showNewMessageNotification(messageId, senderName)
            }
            "slot_available" -> {
                val date = data["date"]
                val time = data["time"]
                showSlotAvailableNotification(date, time)
            }
            "system_notification" -> {
                val title = data["title"] ?: "System Notification"
                val body = data["body"] ?: "You have a system notification"
                showNotification(title, body, data)
            }
        }
        
        // Store notification in local database
        notificationId?.let { id ->
            serviceScope.launch {
                try {
                    notificationRepository.storeNotification(
                        id = id,
                        type = notificationType ?: "general",
                        title = data["title"] ?: "Notification",
                        body = data["body"] ?: "",
                        data = data
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to store notification", e)
                }
            }
        }
    }
    
    private fun showAppointmentReminder(appointmentId: String?, time: String?) {
        val title = "Appointment Reminder"
        val body = if (time != null) {
            "You have an appointment at $time"
        } else {
            "You have an upcoming appointment"
        }
        
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("navigate_to", "appointments")
            appointmentId?.let { putExtra("appointment_id", it) }
        }
        
        showNotification(title, body, emptyMap(), intent)
    }
    
    private fun showAppointmentCancellation(appointmentId: String?) {
        val title = "Appointment Cancelled"
        val body = "One of your appointments has been cancelled"
        
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("navigate_to", "appointments")
            appointmentId?.let { putExtra("appointment_id", it) }
        }
        
        showNotification(title, body, emptyMap(), intent)
    }
    
    private fun showNewMessageNotification(messageId: String?, senderName: String?) {
        val title = "New Message"
        val body = if (senderName != null) {
            "New message from $senderName"
        } else {
            "You have a new message"
        }
        
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("navigate_to", "messages")
            messageId?.let { putExtra("message_id", it) }
        }
        
        showNotification(title, body, emptyMap(), intent)
    }
    
    private fun showSlotAvailableNotification(date: String?, time: String?) {
        val title = "New Appointment Slot Available"
        val body = if (date != null && time != null) {
            "New slot available on $date at $time"
        } else {
            "New appointment slots are now available"
        }
        
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("navigate_to", "schedule")
        }
        
        showNotification(title, body, emptyMap(), intent)
    }
    
    private fun showNotification(
        title: String,
        body: String,
        data: Map<String, String>,
        customIntent: Intent? = null
    ) {
        val intent = customIntent ?: Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notificationBuilder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
        
        // Add action buttons based on notification type
        val notificationType = data["type"]
        when (notificationType) {
            "appointment_reminder" -> {
                val rescheduleIntent = Intent(this, MainActivity::class.java).apply {
                    putExtra("navigate_to", "schedule")
                    putExtra("action", "reschedule")
                    data["appointment_id"]?.let { putExtra("appointment_id", it) }
                }
                val reschedulePendingIntent = PendingIntent.getActivity(
                    this, 1, rescheduleIntent, PendingIntent.FLAG_IMMUTABLE
                )
                notificationBuilder.addAction(
                    R.drawable.ic_schedule,
                    "Reschedule",
                    reschedulePendingIntent
                )
            }
            "new_message" -> {
                val replyIntent = Intent(this, MainActivity::class.java).apply {
                    putExtra("navigate_to", "messages")
                    putExtra("action", "reply")
                    data["message_id"]?.let { putExtra("message_id", it) }
                }
                val replyPendingIntent = PendingIntent.getActivity(
                    this, 2, replyIntent, PendingIntent.FLAG_IMMUTABLE
                )
                notificationBuilder.addAction(
                    R.drawable.ic_reply,
                    "Reply",
                    replyPendingIntent
                )
            }
        }
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Generate unique notification ID based on content
        val notificationId = data["notification_id"]?.hashCode() ?: System.currentTimeMillis().toInt()
        
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = NOTIFICATION_CHANNEL_DESCRIPTION
                enableLights(true)
                enableVibration(true)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}