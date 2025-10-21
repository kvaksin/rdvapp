package com.rdvapp.presentation.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rdvapp.data.model.ChildRegistration
import com.rdvapp.data.model.User
import com.rdvapp.data.network.NetworkResult
import com.rdvapp.data.repository.AuthRepository
import com.rdvapp.utils.PreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val preferencesManager: PreferencesManager
) : ViewModel() {
    
    var uiState by mutableStateOf(AuthUiState())
        private set
    
    init {
        checkAuthStatus()
    }
    
    private fun checkAuthStatus() {
        viewModelScope.launch {
            val token = preferencesManager.getAuthToken()
            if (token != null) {
                getCurrentUser()
            } else {
                uiState = uiState.copy(isAuthenticated = false, isLoading = false)
            }
        }
    }
    
    fun login(email: String, password: String) {
        if (!validateLoginInput(email, password)) return
        
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            
            when (val result = authRepository.login(email, password)) {
                is NetworkResult.Success -> {
                    preferencesManager.saveAuthToken(result.data.token)
                    uiState = uiState.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        user = result.data.user,
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
    
    fun register(
        email: String,
        password: String,
        confirmPassword: String,
        name: String,
        phone: String?,
        children: List<ChildRegistration>
    ) {
        if (!validateRegisterInput(email, password, confirmPassword, name, children)) return
        
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            
            when (val result = authRepository.register(
                email, password, confirmPassword, name, phone, children
            )) {
                is NetworkResult.Success -> {
                    preferencesManager.saveAuthToken(result.data.token)
                    uiState = uiState.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        user = result.data.user,
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
    
    fun logout() {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true)
            
            // Call logout API
            authRepository.logout()
            
            // Clear local storage regardless of API response
            preferencesManager.clearAuthToken()
            
            uiState = AuthUiState() // Reset to initial state
        }
    }
    
    private fun getCurrentUser() {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true)
            
            when (val result = authRepository.getCurrentUser()) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        user = result.data
                    )
                }
                is NetworkResult.Error -> {
                    // Token might be invalid, clear it
                    preferencesManager.clearAuthToken()
                    uiState = uiState.copy(
                        isLoading = false,
                        isAuthenticated = false,
                        errorMessage = "Session expired. Please login again."
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isLoading = result.isLoading)
                }
            }
        }
    }
    
    fun updateProfile(
        name: String? = null,
        phone: String? = null,
        profileImageUrl: String? = null
    ) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            
            when (val result = authRepository.updateProfile(name, phone, profileImageUrl)) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        user = result.data,
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
    
    fun clearError() {
        uiState = uiState.copy(errorMessage = null)
    }
    
    private fun validateLoginInput(email: String, password: String): Boolean {
        return when {
            email.isBlank() -> {
                uiState = uiState.copy(errorMessage = "Email is required")
                false
            }
            !isValidEmail(email) -> {
                uiState = uiState.copy(errorMessage = "Invalid email format")
                false
            }
            password.isBlank() -> {
                uiState = uiState.copy(errorMessage = "Password is required")
                false
            }
            else -> true
        }
    }
    
    private fun validateRegisterInput(
        email: String,
        password: String,
        confirmPassword: String,
        name: String,
        children: List<ChildRegistration>
    ): Boolean {
        return when {
            email.isBlank() -> {
                uiState = uiState.copy(errorMessage = "Email is required")
                false
            }
            !isValidEmail(email) -> {
                uiState = uiState.copy(errorMessage = "Invalid email format")
                false
            }
            password.isBlank() -> {
                uiState = uiState.copy(errorMessage = "Password is required")
                false
            }
            password.length < 6 -> {
                uiState = uiState.copy(errorMessage = "Password must be at least 6 characters")
                false
            }
            password != confirmPassword -> {
                uiState = uiState.copy(errorMessage = "Passwords do not match")
                false
            }
            name.isBlank() -> {
                uiState = uiState.copy(errorMessage = "Name is required")
                false
            }
            children.isEmpty() -> {
                uiState = uiState.copy(errorMessage = "At least one child is required")
                false
            }
            children.any { it.name.isBlank() } -> {
                uiState = uiState.copy(errorMessage = "All children must have names")
                false
            }
            children.any { it.age < 1 || it.age > 18 } -> {
                uiState = uiState.copy(errorMessage = "Children age must be between 1 and 18")
                false
            }
            else -> true
        }
    }
    
    private fun isValidEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
    
    fun updateFCMToken(token: String) {
        viewModelScope.launch {
            try {
                authRepository.updateFCMToken(token)
            } catch (e: Exception) {
                // Log error but don't show to user as this is background operation
                android.util.Log.e("AuthViewModel", "Failed to update FCM token", e)
            }
        }
    }
}

data class AuthUiState(
    val isLoading: Boolean = true,
    val isAuthenticated: Boolean = false,
    val user: User? = null,
    val errorMessage: String? = null
)