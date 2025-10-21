package com.rdvapp.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Message(
    val id: String,
    val type: MessageType,
    val subject: String? = null,
    val message: String,
    val senderId: String,
    val senderName: String,
    val recipientType: RecipientType,
    val classIds: List<String> = emptyList(),
    val childIds: List<String> = emptyList(),
    val attachments: List<Attachment> = emptyList(),
    val replies: List<MessageReply> = emptyList(),
    val isUnread: Boolean = true,
    val createdAt: String,
    val updatedAt: String
) {
    val hasAttachments: Boolean
        get() = attachments.isNotEmpty()
    
    val hasReplies: Boolean
        get() = replies.isNotEmpty()
    
    val replyCount: Int
        get() = replies.size
}

@Serializable
enum class MessageType {
    ADMIN_TO_CLASS,
    CLASS_LEAD_TO_PARENTS,
    PARENT_TO_CLASS_LEAD,
    SYSTEM_NOTIFICATION
}

@Serializable
enum class RecipientType {
    ALL_PARENTS,
    CLASS_PARENTS,
    SPECIFIC_PARENTS,
    CLASS_LEADS,
    ADMINS
}

@Serializable
data class MessageReply(
    val id: String,
    val messageId: String,
    val content: String,
    val senderId: String,
    val senderName: String,
    val attachments: List<Attachment> = emptyList(),
    val createdAt: String
)

@Serializable
data class Attachment(
    val id: String,
    val filename: String,
    val originalName: String,
    val mimeType: String,
    val size: Long,
    val url: String,
    val uploadedAt: String
) {
    val sizeFormatted: String
        get() {
            return when {
                size < 1024 -> "${size}B"
                size < 1024 * 1024 -> "${size / 1024}KB"
                else -> "${size / (1024 * 1024)}MB"
            }
        }
    
    val isImage: Boolean
        get() = mimeType.startsWith("image/")
    
    val isPdf: Boolean
        get() = mimeType == "application/pdf"
}

@Serializable
data class SendMessageRequest(
    val type: MessageType,
    val subject: String? = null,
    val message: String,
    val classIds: List<String> = emptyList(),
    val childIds: List<String> = emptyList(),
    val attachments: List<String> = emptyList() // Attachment IDs
)

@Serializable
data class SendMessageResponse(
    val message: Message,
    val success: Boolean,
    val deliveredTo: Int
)

@Serializable
data class ReplyToMessageRequest(
    val content: String,
    val attachments: List<String> = emptyList()
)

@Serializable
data class ReplyToMessageResponse(
    val reply: MessageReply,
    val message: Message
)

@Serializable
data class MessagesResponse(
    val messages: List<Message>,
    val totalCount: Int,
    val unreadCount: Int
)

@Serializable
data class MessageDetailResponse(
    val message: Message
)

@Serializable
data class MarkMessageReadRequest(
    val messageId: String
)

@Serializable
data class MarkMessageReadResponse(
    val success: Boolean
)

@Serializable
data class MessageFilters(
    val type: MessageType? = null,
    val unreadOnly: Boolean = false,
    val startDate: String? = null,
    val endDate: String? = null,
    val page: Int = 1,
    val limit: Int = 20
)

@Serializable
data class UploadResponse(
    val attachment: Attachment,
    val success: Boolean
)

// Extension functions for display
fun MessageType.displayName(): String = when (this) {
    MessageType.ADMIN_TO_CLASS -> "Admin Announcement"
    MessageType.CLASS_LEAD_TO_PARENTS -> "Class Update"
    MessageType.PARENT_TO_CLASS_LEAD -> "Parent Message"
    MessageType.SYSTEM_NOTIFICATION -> "System Notice"
}

fun MessageType.shortDisplayName(): String = when (this) {
    MessageType.ADMIN_TO_CLASS -> "Admin"
    MessageType.CLASS_LEAD_TO_PARENTS -> "Class"
    MessageType.PARENT_TO_CLASS_LEAD -> "Parent"
    MessageType.SYSTEM_NOTIFICATION -> "System"
}

fun MessageType.iconName(): String = when (this) {
    MessageType.ADMIN_TO_CLASS -> "admin_panel_settings"
    MessageType.CLASS_LEAD_TO_PARENTS -> "school"
    MessageType.PARENT_TO_CLASS_LEAD -> "person"
    MessageType.SYSTEM_NOTIFICATION -> "info"
}