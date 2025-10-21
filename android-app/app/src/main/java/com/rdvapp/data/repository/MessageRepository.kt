package com.rdvapp.data.repository

import com.rdvapp.data.model.*
import com.rdvapp.data.network.ApiService
import com.rdvapp.data.network.NetworkResult
import com.rdvapp.data.network.safeApiCall
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MessageRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getMessages(
        type: MessageType? = null,
        unreadOnly: Boolean = false,
        startDate: String? = null,
        endDate: String? = null,
        page: Int = 1,
        limit: Int = 20
    ): NetworkResult<MessagesResponse> {
        return safeApiCall {
            apiService.getMessages(
                type = type?.name,
                unreadOnly = unreadOnly,
                startDate = startDate,
                endDate = endDate,
                page = page,
                limit = limit
            )
        }
    }
    
    suspend fun getMessage(messageId: String): NetworkResult<Message> {
        return safeApiCall {
            apiService.getMessage(messageId)
        }.let { result ->
            when (result) {
                is NetworkResult.Success -> NetworkResult.Success(result.data.message)
                is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
            }
        }
    }
    
    suspend fun sendMessage(
        type: MessageType,
        subject: String? = null,
        message: String,
        classIds: List<String> = emptyList(),
        childIds: List<String> = emptyList(),
        attachments: List<String> = emptyList()
    ): NetworkResult<SendMessageResponse> {
        return safeApiCall {
            apiService.sendMessage(
                SendMessageRequest(
                    type = type,
                    subject = subject,
                    message = message,
                    classIds = classIds,
                    childIds = childIds,
                    attachments = attachments
                )
            )
        }
    }
    
    suspend fun replyToMessage(
        messageId: String,
        content: String,
        attachments: List<String> = emptyList()
    ): NetworkResult<ReplyToMessageResponse> {
        return safeApiCall {
            apiService.replyToMessage(
                messageId = messageId,
                request = ReplyToMessageRequest(
                    content = content,
                    attachments = attachments
                )
            )
        }
    }
    
    suspend fun markMessageAsRead(messageId: String): NetworkResult<Unit> {
        return safeApiCall {
            apiService.markMessageAsRead(messageId)
        }.let { result ->
            when (result) {
                is NetworkResult.Success -> NetworkResult.Success(Unit)
                is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
            }
        }
    }
    
    suspend fun uploadFile(
        file: File,
        description: String? = null
    ): NetworkResult<Attachment> {
        return try {
            val fileRequestBody = file.asRequestBody("*/*".toMediaTypeOrNull())
            val filePart = MultipartBody.Part.createFormData("file", file.name, fileRequestBody)
            val descriptionPart = description?.toRequestBody("text/plain".toMediaTypeOrNull())
            
            safeApiCall {
                apiService.uploadFile(filePart, descriptionPart)
            }.let { result ->
                when (result) {
                    is NetworkResult.Success -> NetworkResult.Success(result.data.attachment)
                    is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                    is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
                }
            }
        } catch (e: Exception) {
            NetworkResult.Error("Failed to upload file: ${e.message}")
        }
    }
}