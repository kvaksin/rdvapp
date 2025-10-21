package com.rdvapp.presentation.messages

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.rdvapp.data.model.*
import com.rdvapp.presentation.auth.AuthViewModel
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeMessageDialog(
    authViewModel: AuthViewModel,
    viewModel: MessagesViewModel,
    onDismiss: () -> Unit
) {
    val authUiState = authViewModel.uiState
    val uiState = viewModel.uiState
    val context = LocalContext.current
    
    var messageType by remember { mutableStateOf<MessageType?>(null) }
    var subject by remember { mutableStateOf("") }
    var messageContent by remember { mutableStateOf("") }
    var selectedChildIds by remember { mutableStateOf<List<String>>(emptyList()) }
    
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            // Convert URI to File and upload
            // This is a simplified implementation
            val file = File(context.cacheDir, "temp_attachment")
            // In real implementation, you'd copy the URI content to the file
            viewModel.uploadFile(file, "Attachment")
        }
    }
    
    // Determine available message types based on user role
    val availableMessageTypes = remember(authUiState.user?.role) {
        when (authUiState.user?.role) {
            UserRole.PARENT -> listOf(MessageType.PARENT_TO_CLASS_LEAD)
            UserRole.CLASS_LEAD -> listOf(MessageType.CLASS_LEAD_TO_PARENTS)
            UserRole.ADMIN -> listOf(MessageType.ADMIN_TO_CLASS, MessageType.SYSTEM_NOTIFICATION)
            else -> emptyList()
        }
    }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Compose Message",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close"
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Message Type Selection
                    item {
                        Text(
                            text = "Message Type",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium
                        )
                        
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(availableMessageTypes) { type ->
                                FilterChip(
                                    selected = messageType == type,
                                    onClick = { messageType = type },
                                    label = { Text(type.displayName()) }
                                )
                            }
                        }
                    }
                    
                    // Child Selection (for parents)
                    if (authUiState.user?.isParent == true && authUiState.user.children.isNotEmpty()) {
                        item {
                            Text(
                                text = "Select Children",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium
                            )
                            
                            Column {
                                authUiState.user.children.forEach { child ->
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Checkbox(
                                            checked = selectedChildIds.contains(child.id),
                                            onCheckedChange = { checked ->
                                                selectedChildIds = if (checked) {
                                                    selectedChildIds + child.id
                                                } else {
                                                    selectedChildIds - child.id
                                                }
                                            }
                                        )
                                        Text(
                                            text = child.name,
                                            modifier = Modifier.padding(start = 8.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                    
                    // Subject Field
                    item {
                        OutlinedTextField(
                            value = subject,
                            onValueChange = { subject = it },
                            label = { Text("Subject (Optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    
                    // Message Content
                    item {
                        OutlinedTextField(
                            value = messageContent,
                            onValueChange = { messageContent = it },
                            label = { Text("Message") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp),
                            maxLines = 5
                        )
                    }
                    
                    // Attachments
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Attachments",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium
                            )
                            
                            IconButton(
                                onClick = { filePickerLauncher.launch("*/*") },
                                enabled = !uiState.isUploading
                            ) {
                                if (uiState.isUploading) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp))
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.AttachFile,
                                        contentDescription = "Add Attachment"
                                    )
                                }
                            }
                        }
                        
                        // Show uploaded attachments
                        uiState.uploadedAttachments.forEach { attachment ->
                            AttachmentChip(
                                attachment = attachment,
                                onRemove = { viewModel.removeAttachment(attachment) }
                            )
                        }
                    }
                    
                    // Error Message
                    if (uiState.errorMessage != null) {
                        item {
                            Text(
                                text = uiState.errorMessage,
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        enabled = !uiState.isSending
                    ) {
                        Text("Cancel")
                    }
                    
                    Button(
                        onClick = {
                            messageType?.let { type ->
                                viewModel.sendMessage(
                                    type = type,
                                    subject = subject.takeIf { it.isNotBlank() },
                                    message = messageContent,
                                    childIds = selectedChildIds,
                                    attachments = uiState.uploadedAttachments.map { it.id }
                                )
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = !uiState.isSending && 
                                messageType != null && 
                                messageContent.isNotBlank()
                    ) {
                        if (uiState.isSending) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Send")
                        }
                    }
                }
            }
        }
    }
    
    // Auto-dismiss on successful send
    LaunchedEffect(uiState.isSending) {
        if (!uiState.isSending && uiState.errorMessage == null && messageContent.isNotBlank()) {
            // Check if message was sent successfully by comparing with previous state
            onDismiss()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessageDetailDialog(
    message: Message,
    viewModel: MessagesViewModel,
    onDismiss: () -> Unit
) {
    val uiState = viewModel.uiState
    var replyContent by remember { mutableStateOf("") }
    var showReplyField by remember { mutableStateOf(false) }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Message Details",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close"
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Message Info
                    item {
                        MessageInfoCard(message = message)
                    }
                    
                    // Message Content
                    item {
                        Card {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                            ) {
                                if (!message.subject.isNullOrBlank()) {
                                    Text(
                                        text = message.subject,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                                
                                Text(
                                    text = message.message,
                                    fontSize = 14.sp,
                                    lineHeight = 20.sp
                                )
                            }
                        }
                    }
                    
                    // Attachments
                    if (message.hasAttachments) {
                        item {
                            Text(
                                text = "Attachments",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium
                            )
                            
                            message.attachments.forEach { attachment ->
                                AttachmentCard(attachment = attachment)
                            }
                        }
                    }
                    
                    // Replies
                    if (message.hasReplies) {
                        item {
                            Text(
                                text = "Replies (${message.replyCount})",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        
                        items(message.replies) { reply ->
                            ReplyCard(reply = reply)
                        }
                    }
                    
                    // Reply Field
                    if (showReplyField) {
                        item {
                            OutlinedTextField(
                                value = replyContent,
                                onValueChange = { replyContent = it },
                                label = { Text("Write a reply...") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(100.dp),
                                maxLines = 3
                            )
                        }
                    }
                    
                    // Error Message
                    if (uiState.errorMessage != null) {
                        item {
                            Text(
                                text = uiState.errorMessage,
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (!showReplyField) {
                        Button(
                            onClick = { showReplyField = true },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Reply,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Reply")
                        }
                    } else {
                        OutlinedButton(
                            onClick = { 
                                showReplyField = false
                                replyContent = ""
                            },
                            modifier = Modifier.weight(1f),
                            enabled = !uiState.isSending
                        ) {
                            Text("Cancel")
                        }
                        
                        Button(
                            onClick = {
                                if (replyContent.isNotBlank()) {
                                    viewModel.replyToMessage(message.id, replyContent)
                                    replyContent = ""
                                    showReplyField = false
                                }
                            },
                            modifier = Modifier.weight(1f),
                            enabled = !uiState.isSending && replyContent.isNotBlank()
                        ) {
                            if (uiState.isSending) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                            } else {
                                Text("Send Reply")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MessageInfoCard(message: Message) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "From: ${message.senderName}",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = message.type.displayName(),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Text(
                    text = formatMessageTime(message.createdAt),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun AttachmentCard(attachment: Attachment) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = when {
                    attachment.isImage -> Icons.Default.Image
                    attachment.isPdf -> Icons.Default.PictureAsPdf
                    else -> Icons.Default.AttachFile
                },
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = attachment.originalName,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = attachment.sizeFormatted,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            IconButton(
                onClick = {
                    // Handle download/view attachment
                }
            ) {
                Icon(
                    imageVector = Icons.Default.Download,
                    contentDescription = "Download"
                )
            }
        }
    }
}

@Composable
private fun AttachmentChip(
    attachment: Attachment,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.AttachFile,
                contentDescription = null,
                modifier = Modifier.size(16.dp)
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            Text(
                text = attachment.originalName,
                fontSize = 12.sp,
                modifier = Modifier.weight(1f)
            )
            
            IconButton(
                onClick = onRemove,
                modifier = Modifier.size(24.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Remove",
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
private fun ReplyCard(reply: MessageReply) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = reply.senderName,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = formatMessageTime(reply.createdAt),
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = reply.content,
                fontSize = 12.sp
            )
            
            if (reply.attachments.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${reply.attachments.size} attachment(s)",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

// Helper function (reused from MessagesScreen)
private fun formatMessageTime(timeString: String): String {
    return try {
        timeString.substring(0, 16).replace("T", " ")
    } catch (e: Exception) {
        timeString
    }
}