package com.rdvapp.data.repository

import com.rdvapp.data.model.*
import com.rdvapp.data.network.ApiService
import com.rdvapp.data.network.NetworkResult
import com.rdvapp.data.network.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun login(email: String, password: String): NetworkResult<LoginResponse> {
        return safeApiCall {
            apiService.login(LoginRequest(email, password))
        }
    }
    
    suspend fun register(
        email: String,
        password: String,
        confirmPassword: String,
        name: String,
        phone: String? = null,
        children: List<ChildRegistration> = emptyList()
    ): NetworkResult<RegisterResponse> {
        return safeApiCall {
            apiService.register(
                RegisterRequest(
                    email = email,
                    password = password,
                    confirmPassword = confirmPassword,
                    name = name,
                    phone = phone,
                    children = children
                )
            )
        }
    }
    
    suspend fun refreshToken(token: String): NetworkResult<RefreshTokenResponse> {
        return safeApiCall {
            apiService.refreshToken(RefreshTokenRequest(token))
        }
    }
    
    suspend fun logout(): NetworkResult<Unit> {
        return safeApiCall {
            apiService.logout()
        }.let { result ->
            when (result) {
                is NetworkResult.Success -> NetworkResult.Success(Unit)
                is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
            }
        }
    }
    
    suspend fun getCurrentUser(): NetworkResult<User> {
        return safeApiCall {
            apiService.getCurrentUser()
        }.let { result ->
            when (result) {
                is NetworkResult.Success -> NetworkResult.Success(result.data.user)
                is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
            }
        }
    }
    
    suspend fun updateProfile(
        name: String? = null,
        phone: String? = null,
        profileImageUrl: String? = null
    ): NetworkResult<User> {
        return safeApiCall {
            apiService.updateProfile(
                UserProfileUpdateRequest(
                    name = name,
                    phone = phone,
                    profileImageUrl = profileImageUrl
                )
            )
        }.let { result ->
            when (result) {
                is NetworkResult.Success -> NetworkResult.Success(result.data.user)
                is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
            }
        }
    }
    
    suspend fun updateFCMToken(token: String): NetworkResult<Unit> {
        return safeApiCall {
            apiService.updateFCMToken(FCMTokenRequest(token))
        }.let { result ->
            when (result) {
                is NetworkResult.Success -> NetworkResult.Success(Unit)
                is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
            }
        }
    }
}