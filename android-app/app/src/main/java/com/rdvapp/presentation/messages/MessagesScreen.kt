package com.rdvapp.presentation.messages

import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rdvapp.data.model.Message
import com.rdvapp.data.model.MessageType
import com.rdvapp.data.model.displayName
import com.rdvapp.data.model.shortDisplayName
import com.rdvapp.presentation.auth.AuthViewModel
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessagesScreen(
    authViewModel: AuthViewModel,
    viewModel: MessagesViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    val authUiState = authViewModel.uiState
    var showComposeDialog by remember { mutableStateOf(false) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header with unread count
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Messages",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (uiState.unreadCount > 0) {
                    Text(
                        text = "${uiState.unreadCount} unread",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            IconButton(
                onClick = { showComposeDialog = true }
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Compose Message",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Filter chips
        MessageFilterChips(
            currentFilter = uiState.messageFilter,
            onFilterChanged = viewModel::setMessageFilter,
            userRole = authUiState.user?.role
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Content based on loading state
        when {
            uiState.isLoading && uiState.messages.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            uiState.errorMessage != null -> {
                ErrorSection(
                    message = uiState.errorMessage,
                    onRetry = { viewModel.loadMessages() }
                )
            }
            uiState.messages.isEmpty() -> {
                EmptyMessagesState(
                    onCompose = { showComposeDialog = true }
                )
            }
            else -> {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.messages) { message ->
                        MessageCard(
                            message = message,
                            onClick = {
                                viewModel.selectMessage(message)
                                viewModel.loadMessage(message.id)
                            }
                        )
                    }
                }
            }
        }
    }
    
    // Compose Message Dialog
    if (showComposeDialog) {
        ComposeMessageDialog(
            authViewModel = authViewModel,
            viewModel = viewModel,
            onDismiss = { showComposeDialog = false }
        )
    }
    
    // Message Detail Dialog
    uiState.selectedMessage?.let { message ->
        MessageDetailDialog(
            message = message,
            viewModel = viewModel,
            onDismiss = { viewModel.selectMessage(null) }
        )
    }
}

@Composable
private fun MessageFilterChips(
    currentFilter: MessageFilter,
    onFilterChanged: (MessageFilter) -> Unit,
    userRole: com.rdvapp.data.model.UserRole?
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            FilterChip(
                selected = currentFilter.type == null && !currentFilter.unreadOnly,
                onClick = { onFilterChanged(MessageFilter()) },
                label = { Text("All") }
            )
        }
        
        item {
            FilterChip(
                selected = currentFilter.unreadOnly,
                onClick = { 
                    onFilterChanged(currentFilter.copy(unreadOnly = !currentFilter.unreadOnly))
                },
                label = { Text("Unread") }
            )
        }
        
        // Add type-specific filters based on user role
        userRole?.let { role ->
            val availableTypes = when (role) {
                com.rdvapp.data.model.UserRole.PARENT -> listOf(
                    MessageType.CLASS_LEAD_TO_PARENTS,
                    MessageType.ADMIN_TO_CLASS,
                    MessageType.SYSTEM_NOTIFICATION
                )
                com.rdvapp.data.model.UserRole.CLASS_LEAD -> listOf(
                    MessageType.PARENT_TO_CLASS_LEAD,
                    MessageType.ADMIN_TO_CLASS,
                    MessageType.SYSTEM_NOTIFICATION
                )
                com.rdvapp.data.model.UserRole.ADMIN -> MessageType.values().toList()
            }
            
            items(availableTypes) { type ->
                FilterChip(
                    selected = currentFilter.type == type,
                    onClick = { 
                        onFilterChanged(
                            if (currentFilter.type == type) {
                                currentFilter.copy(type = null)
                            } else {
                                currentFilter.copy(type = type)
                            }
                        )
                    },
                    label = { Text(type.shortDisplayName()) }
                )
            }
        }
    }
}

@Composable
private fun MessageCard(
    message: Message,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (message.isUnread) 4.dp else 2.dp
        ),
        colors = CardDefaults.cardColors(
            containerColor = if (message.isUnread) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = message.senderName,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = if (message.isUnread) {
                            MaterialTheme.colorScheme.onPrimaryContainer
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        }
                    )
                    
                    Text(
                        text = message.type.displayName(),
                        fontSize = 12.sp,
                        color = if (message.isUnread) {
                            MaterialTheme.colorScheme.onPrimaryContainer
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    )
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = formatMessageTime(message.createdAt),
                        fontSize = 12.sp,
                        color = if (message.isUnread) {
                            MaterialTheme.colorScheme.onPrimaryContainer
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    )
                    
                    if (message.isUnread) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(
                                    MaterialTheme.colorScheme.primary,
                                    androidx.compose.foundation.shape.CircleShape
                                )
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Subject (if present)
            if (!message.subject.isNullOrBlank()) {
                Text(
                    text = message.subject,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = if (message.isUnread) {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    }
                )
                Spacer(modifier = Modifier.height(4.dp))
            }
            
            // Message preview
            Text(
                text = message.message,
                fontSize = 14.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = if (message.isUnread) {
                    MaterialTheme.colorScheme.onPrimaryContainer
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
            )
            
            // Bottom indicators
            if (message.hasAttachments || message.hasReplies) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (message.hasAttachments) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AttachFile,
                                contentDescription = "Has attachments",
                                modifier = Modifier.size(16.dp),
                                tint = if (message.isUnread) {
                                    MaterialTheme.colorScheme.onPrimaryContainer
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                            Text(
                                text = "${message.attachments.size}",
                                fontSize = 12.sp,
                                color = if (message.isUnread) {
                                    MaterialTheme.colorScheme.onPrimaryContainer
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                        }
                    }
                    
                    if (message.hasReplies) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Reply,
                                contentDescription = "Has replies",
                                modifier = Modifier.size(16.dp),
                                tint = if (message.isUnread) {
                                    MaterialTheme.colorScheme.onPrimaryContainer
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                            Text(
                                text = "${message.replyCount}",
                                fontSize = 12.sp,
                                color = if (message.isUnread) {
                                    MaterialTheme.colorScheme.onPrimaryContainer
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyMessagesState(
    onCompose: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.MailOutline,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "No messages yet",
            fontSize = 20.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Start a conversation with teachers or administrators",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Button(onClick = onCompose) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Compose Message")
        }
    }
}

@Composable
private fun ErrorSection(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(48.dp),
            tint = MaterialTheme.colorScheme.error
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Error loading messages",
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.error
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = message,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}

// Helper function for time formatting
private fun formatMessageTime(timeString: String): String {
    return try {
        // This would need proper ISO 8601 parsing in real implementation
        val formatter = DateTimeFormatter.ofPattern("MMM dd, HH:mm")
        LocalDateTime.parse(timeString.substring(0, 19)).format(formatter)
    } catch (e: Exception) {
        timeString.substring(0, 10) // Fallback to date only
    }
}