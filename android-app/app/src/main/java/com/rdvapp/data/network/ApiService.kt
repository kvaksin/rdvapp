package com.rdvapp.data.network

import com.rdvapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Authentication endpoints
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>
    
    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<RefreshTokenResponse>
    
    @POST("auth/logout")
    suspend fun logout(): Response<Void>
    
    @GET("auth/me")
    suspend fun getCurrentUser(): Response<UserProfileResponse>
    
    @PUT("auth/profile")
    suspend fun updateProfile(@Body request: UserProfileUpdateRequest): Response<UserProfileResponse>
    
    @PUT("auth/fcm-token")
    suspend fun updateFCMToken(@Body request: FCMTokenRequest): Response<Void>
    
    // Slots endpoints
    @GET("slots")
    suspend fun getSlots(
        @Query("start") startDate: String? = null,
        @Query("end") endDate: String? = null,
        @Query("available") available: Boolean? = null,
        @Query("classId") classId: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<SlotsResponse>
    
    @POST("slots/timeframe")
    suspend fun createSlots(@Body request: CreateSlotsRequest): Response<CreateSlotsResponse>
    
    @DELETE("slots/{id}")
    suspend fun deleteSlot(@Path("id") slotId: String): Response<Void>
    
    // Bookings endpoints
    @GET("bookings")
    suspend fun getBookings(
        @Query("userId") userId: String? = null,
        @Query("childId") childId: String? = null,
        @Query("status") status: String? = null,
        @Query("start") startDate: String? = null,
        @Query("end") endDate: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<BookingsResponse>
    
    @POST("bookings")
    suspend fun createBooking(@Body request: BookingRequest): Response<BookingResponse>
    
    @PUT("bookings/{id}")
    suspend fun rescheduleBooking(
        @Path("id") bookingId: String,
        @Body request: RescheduleBookingRequest
    ): Response<BookingResponse>
    
    @DELETE("bookings/{id}")
    suspend fun cancelBooking(
        @Path("id") bookingId: String,
        @Body request: CancelBookingRequest? = null
    ): Response<Void>
    
    @GET("bookings/{id}/ics")
    suspend fun exportBookingToCalendar(@Path("id") bookingId: String): Response<String>
    
    // Messages endpoints
    @GET("messages")
    suspend fun getMessages(
        @Query("type") type: String? = null,
        @Query("unread") unreadOnly: Boolean = false,
        @Query("start") startDate: String? = null,
        @Query("end") endDate: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<MessagesResponse>
    
    @GET("messages/{id}")
    suspend fun getMessage(@Path("id") messageId: String): Response<MessageDetailResponse>
    
    @POST("messages")
    suspend fun sendMessage(@Body request: SendMessageRequest): Response<SendMessageResponse>
    
    @POST("messages/{id}/reply")
    suspend fun replyToMessage(
        @Path("id") messageId: String,
        @Body request: ReplyToMessageRequest
    ): Response<ReplyToMessageResponse>
    
    @PUT("messages/{id}/read")
    suspend fun markMessageAsRead(@Path("id") messageId: String): Response<MarkMessageReadResponse>
    
    // File upload endpoints
    @Multipart
    @POST("uploads")
    suspend fun uploadFile(
        @Part file: okhttp3.MultipartBody.Part,
        @Part("description") description: okhttp3.RequestBody? = null
    ): Response<UploadResponse>
    
    // Notification endpoints
    @GET("user/notification-preferences")
    suspend fun getNotificationPreferences(): Response<NotificationPreferencesResponse>
    
    @PUT("user/notification-preferences")
    suspend fun updateNotificationPreferences(
        @Body request: UpdateNotificationPreferencesRequest
    ): Response<NotificationPreferencesResponse>
    
    @PUT("user/device-token")
    suspend fun updateDeviceToken(@Body request: DeviceTokenRequest): Response<DeviceTokenResponse>
    
    @GET("user/notifications")
    suspend fun getNotificationHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<NotificationHistory>
    
    // Class management endpoints (for class leads and admins)
    @GET("classes")
    suspend fun getClasses(): Response<List<Class>>
    
    @GET("classes/{id}")
    suspend fun getClass(@Path("id") classId: String): Response<Class>
    
    @GET("classes/{id}/children")
    suspend fun getClassChildren(@Path("id") classId: String): Response<List<Child>>
}