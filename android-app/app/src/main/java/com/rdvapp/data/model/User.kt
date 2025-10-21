package com.rdvapp.data.model

import kotlinx.serialization.Serializable
import java.time.LocalDateTime

@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String,
    val phone: String? = null,
    val profileImageUrl: String? = null,
    val role: UserRole,
    val isActive: Boolean = true,
    val children: List<Child> = emptyList(),
    val managedClassIds: List<String> = emptyList(),
    val createdAt: String,
    val updatedAt: String
) {
    val isParent: Boolean
        get() = role == UserRole.PARENT
    
    val isClassLead: Boolean
        get() = role == UserRole.CLASS_LEAD
    
    val isAdmin: Boolean
        get() = role == UserRole.ADMIN
}

@Serializable
enum class UserRole {
    PARENT,
    CLASS_LEAD,
    ADMIN
}

@Serializable
data class Child(
    val id: String,
    val name: String,
    val age: Int,
    val classId: String? = null,
    val parentId: String,
    val isActive: Boolean = true,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class Class(
    val id: String,
    val name: String,
    val description: String? = null,
    val leadId: String,
    val isActive: Boolean = true,
    val children: List<Child> = emptyList(),
    val createdAt: String,
    val updatedAt: String
)

// Auth request/response models
@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val token: String,
    val user: User,
    val expiresIn: Long
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val confirmPassword: String,
    val name: String,
    val phone: String? = null,
    val children: List<ChildRegistration> = emptyList()
)

@Serializable
data class ChildRegistration(
    val name: String,
    val age: Int,
    val classId: String? = null
)

@Serializable
data class RegisterResponse(
    val token: String,
    val user: User,
    val expiresIn: Long
)

@Serializable
data class RefreshTokenRequest(
    val token: String
)

@Serializable
data class RefreshTokenResponse(
    val token: String,
    val expiresIn: Long
)

@Serializable
data class UserProfileUpdateRequest(
    val name: String? = null,
    val phone: String? = null,
    val profileImageUrl: String? = null
)

@Serializable
data class UserProfileResponse(
    val user: User
)

@Serializable
data class FCMTokenRequest(
    val token: String
)

// Error response model
@Serializable
data class ErrorResponse(
    val error: String,
    val message: String,
    val details: Map<String, String>? = null
)