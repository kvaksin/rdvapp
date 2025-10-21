package com.rdvapp.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Slot(
    val id: String,
    val startTime: String, // ISO 8601 format
    val endTime: String,   // ISO 8601 format
    val isBooked: Boolean = false,
    val isRemoved: Boolean = false,
    val classId: String? = null,
    val createdAt: String,
    val updatedAt: String
) {
    val duration: Long
        get() {
            // Calculate duration in minutes
            // This would need proper date parsing in real implementation
            return 30L // Default 30 minutes
        }
    
    val isAvailable: Boolean
        get() = !isBooked && !isRemoved
}

@Serializable
data class Booking(
    val id: String,
    val slotId: String,
    val slot: Slot? = null,
    val userId: String,
    val user: User? = null,
    val childId: String,
    val child: Child? = null,
    val notes: String? = null,
    val status: BookingStatus = BookingStatus.CONFIRMED,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
enum class BookingStatus {
    CONFIRMED,
    CANCELLED,
    RESCHEDULED,
    COMPLETED
}

@Serializable
data class BookingRequest(
    val slotId: String,
    val childId: String,
    val notes: String? = null
)

@Serializable
data class BookingResponse(
    val booking: Booking,
    val message: String? = null
)

@Serializable
data class RescheduleBookingRequest(
    val newSlotId: String,
    val notes: String? = null
)

@Serializable
data class CancelBookingRequest(
    val reason: String? = null
)

@Serializable
data class SlotsResponse(
    val slots: List<Slot>,
    val totalCount: Int
)

@Serializable
data class BookingsResponse(
    val bookings: List<Booking>,
    val totalCount: Int
)

@Serializable
data class CreateSlotsRequest(
    val start: String, // ISO 8601 format
    val end: String,   // ISO 8601 format
    val duration: Int = 30, // Duration in minutes
    val classId: String? = null
)

@Serializable
data class CreateSlotsResponse(
    val slots: List<Slot>,
    val message: String
)

@Serializable
data class SlotFilters(
    val startDate: String? = null,
    val endDate: String? = null,
    val classId: String? = null,
    val available: Boolean? = null,
    val page: Int = 1,
    val limit: Int = 50
)

@Serializable
data class BookingFilters(
    val userId: String? = null,
    val childId: String? = null,
    val status: BookingStatus? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val page: Int = 1,
    val limit: Int = 50
)