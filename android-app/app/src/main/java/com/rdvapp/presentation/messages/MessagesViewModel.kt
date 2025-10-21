package com.rdvapp.presentation.messages

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rdvapp.data.model.*
import com.rdvapp.data.network.NetworkResult
import com.rdvapp.data.repository.MessageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@HiltViewModel
class MessagesViewModel @Inject constructor(
    private val messageRepository: MessageRepository
) : ViewModel() {
    
    var uiState by mutableStateOf(MessagesUiState())
        private set
    
    init {
        loadMessages()
    }
    
    fun loadMessages(
        type: MessageType? = null,
        unreadOnly: Boolean = false
    ) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            
            when (val result = messageRepository.getMessages(
                type = type,
                unreadOnly = unreadOnly
            )) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        messages = result.data.messages,
                        unreadCount = result.data.unreadCount,
                        errorMessage = null
                    )
                }
                is NetworkResult.Error -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        errorMessage = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isLoading = result.isLoading)
                }
            }
        }
    }
    
    fun loadMessage(messageId: String) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoadingDetail = true, errorMessage = null)
            
            when (val result = messageRepository.getMessage(messageId)) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoadingDetail = false,
                        selectedMessage = result.data,
                        errorMessage = null
                    )
                    // Mark as read
                    markMessageAsRead(messageId)
                }
                is NetworkResult.Error -> {
                    uiState = uiState.copy(
                        isLoadingDetail = false,
                        errorMessage = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isLoadingDetail = result.isLoading)
                }
            }
        }
    }
    
    fun sendMessage(
        type: MessageType,
        subject: String?,
        message: String,
        classIds: List<String> = emptyList(),
        childIds: List<String> = emptyList(),
        attachments: List<String> = emptyList()
    ) {
        viewModelScope.launch {
            uiState = uiState.copy(isSending = true, errorMessage = null)
            
            when (val result = messageRepository.sendMessage(
                type = type,
                subject = subject,
                message = message,
                classIds = classIds,
                childIds = childIds,
                attachments = attachments
            )) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isSending = false,
                        errorMessage = null
                    )
                    // Reload messages to show the new one
                    loadMessages()
                    clearComposer()
                }
                is NetworkResult.Error -> {
                    uiState = uiState.copy(
                        isSending = false,
                        errorMessage = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isSending = result.isLoading)
                }
            }
        }
    }
    
    fun replyToMessage(messageId: String, content: String, attachments: List<String> = emptyList()) {
        viewModelScope.launch {
            uiState = uiState.copy(isSending = true, errorMessage = null)
            
            when (val result = messageRepository.replyToMessage(messageId, content, attachments)) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isSending = false,
                        selectedMessage = result.data.message,
                        errorMessage = null
                    )
                    // Reload messages to update the thread
                    loadMessages()
                }
                is NetworkResult.Error -> {
                    uiState = uiState.copy(
                        isSending = false,
                        errorMessage = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isSending = result.isLoading)
                }
            }
        }
    }
    
    fun markMessageAsRead(messageId: String) {
        viewModelScope.launch {
            messageRepository.markMessageAsRead(messageId)
            // Update local state
            uiState = uiState.copy(
                messages = uiState.messages.map { message ->
                    if (message.id == messageId) {
                        message.copy(isUnread = false)
                    } else {
                        message
                    }
                },
                unreadCount = maxOf(0, uiState.unreadCount - 1)
            )
        }
    }
    
    fun uploadFile(file: File, description: String? = null) {
        viewModelScope.launch {
            uiState = uiState.copy(isUploading = true, errorMessage = null)
            
            when (val result = messageRepository.uploadFile(file, description)) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isUploading = false,
                        uploadedAttachments = uiState.uploadedAttachments + result.data,
                        errorMessage = null
                    )
                }
                is NetworkResult.Error -> {
                    uiState = uiState.copy(
                        isUploading = false,
                        errorMessage = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isUploading = result.isLoading)
                }
            }
        }
    }
    
    fun removeAttachment(attachment: Attachment) {
        uiState = uiState.copy(
            uploadedAttachments = uiState.uploadedAttachments - attachment
        )
    }
    
    fun selectMessage(message: Message?) {
        uiState = uiState.copy(selectedMessage = message)
    }
    
    fun setComposingMessage(composing: Boolean) {
        uiState = uiState.copy(isComposingMessage = composing)
        if (!composing) {
            clearComposer()
        }
    }
    
    fun setMessageFilter(filter: MessageFilter) {
        uiState = uiState.copy(messageFilter = filter)
        loadMessages(type = filter.type, unreadOnly = filter.unreadOnly)
    }
    
    fun clearError() {
        uiState = uiState.copy(errorMessage = null)
    }
    
    private fun clearComposer() {
        uiState = uiState.copy(
            uploadedAttachments = emptyList(),
            isComposingMessage = false
        )
    }
}

data class MessagesUiState(
    val isLoading: Boolean = false,
    val isLoadingDetail: Boolean = false,
    val isSending: Boolean = false,
    val isUploading: Boolean = false,
    val messages: List<Message> = emptyList(),
    val selectedMessage: Message? = null,
    val unreadCount: Int = 0,
    val uploadedAttachments: List<Attachment> = emptyList(),
    val isComposingMessage: Boolean = false,
    val messageFilter: MessageFilter = MessageFilter(),
    val errorMessage: String? = null
)

data class MessageFilter(
    val type: MessageType? = null,
    val unreadOnly: Boolean = false
)