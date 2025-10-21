package com.rdvapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val data: String, // JSON string
    val isRead: Boolean,
    val createdAt: Long
)