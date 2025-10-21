package com.rdvapp.presentation.profile

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rdvapp.data.model.NotificationPreferences
import com.rdvapp.data.model.User
import com.rdvapp.data.network.NetworkResult
import com.rdvapp.data.repository.AuthRepository
import com.rdvapp.data.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val notificationRepository: NotificationRepository
) : ViewModel() {
    
    var uiState by mutableStateOf(ProfileUiState())
        private set
    
    init {
        loadProfile()
        loadNotificationPreferences()
    }
    
    private fun loadProfile() {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true)
            
            when (val result = authRepository.getCurrentUser()) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        user = result.data,
                        isLoading = false,
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
    
    private fun loadNotificationPreferences() {
        viewModelScope.launch {
            try {
                val preferences = notificationRepository.getNotificationPreferences()
                uiState = uiState.copy(notificationPreferences = preferences)
            } catch (e: Exception) {
                uiState = uiState.copy(errorMessage = "Failed to load notification preferences")
            }
        }
    }
    
    fun updateProfile(name: String, phone: String) {
        if (!validateInput(name, phone)) return
        
        viewModelScope.launch {
            uiState = uiState.copy(isSaving = true, errorMessage = null)
            
            when (val result = authRepository.updateProfile(name = name, phone = phone)) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        user = result.data,
                        isSaving = false,
                        errorMessage = null
                    )
                }
                is NetworkResult.Error -> {
                    uiState = uiState.copy(
                        isSaving = false,
                        errorMessage = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isSaving = result.isLoading)
                }
            }
        }
    }
    
    fun updateNotificationPreferences(preferences: NotificationPreferences) {
        viewModelScope.launch {
            uiState = uiState.copy(isSaving = true)
            
            try {
                notificationRepository.updateNotificationPreferences(preferences)
                uiState = uiState.copy(
                    notificationPreferences = preferences,
                    isSaving = false,
                    errorMessage = null
                )
            } catch (e: Exception) {
                uiState = uiState.copy(
                    isSaving = false,
                    errorMessage = "Failed to update notification preferences"
                )
            }
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true)
            
            when (val result = authRepository.logout()) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        isLoggedOut = true
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
    
    fun clearError() {
        uiState = uiState.copy(errorMessage = null)
    }
    
    private fun validateInput(name: String, phone: String): Boolean {
        return when {
            name.isBlank() -> {
                uiState = uiState.copy(errorMessage = "Name is required")
                false
            }
            phone.isNotBlank() && !isValidPhone(phone) -> {
                uiState = uiState.copy(errorMessage = "Invalid phone number format")
                false
            }
            else -> true
        }
    }
    
    private fun isValidPhone(phone: String): Boolean {
        // Simple phone validation - adjust regex as needed
        val phoneRegex = Regex("^[+]?[0-9]{10,15}$")
        return phoneRegex.matches(phone.replace("\\s".toRegex(), ""))
    }
}

data class ProfileUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val user: User? = null,
    val notificationPreferences: NotificationPreferences = NotificationPreferences(),
    val errorMessage: String? = null,
    val isLoggedOut: Boolean = false
)