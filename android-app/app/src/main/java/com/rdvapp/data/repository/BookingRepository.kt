package com.rdvapp.data.repository

import com.rdvapp.data.model.*
import com.rdvapp.data.network.ApiService
import com.rdvapp.data.network.NetworkResult
import com.rdvapp.data.network.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BookingRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getSlots(
        startDate: String? = null,
        endDate: String? = null,
        available: Boolean? = null,
        classId: String? = null,
        page: Int = 1,
        limit: Int = 50
    ): NetworkResult<SlotsResponse> {
        return safeApiCall {
            apiService.getSlots(
                startDate = startDate,
                endDate = endDate,
                available = available,
                classId = classId,
                page = page,
                limit = limit
            )
        }
    }
    
    suspend fun createSlots(
        start: String,
        end: String,
        duration: Int = 30,
        classId: String? = null
    ): NetworkResult<CreateSlotsResponse> {
        return safeApiCall {
            apiService.createSlots(
                CreateSlotsRequest(
                    start = start,
                    end = end,
                    duration = duration,
                    classId = classId
                )
            )
        }
    }
    
    suspend fun deleteSlot(slotId: String): NetworkResult<Unit> {
        return safeApiCall {
            apiService.deleteSlot(slotId)
        }.let { result ->
            when (result) {
                is NetworkResult.Success -> NetworkResult.Success(Unit)
                is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
            }
        }
    }
    
    suspend fun getBookings(
        userId: String? = null,
        childId: String? = null,
        status: BookingStatus? = null,
        startDate: String? = null,
        endDate: String? = null,
        page: Int = 1,
        limit: Int = 50
    ): NetworkResult<BookingsResponse> {
        return safeApiCall {
            apiService.getBookings(
                userId = userId,
                childId = childId,
                status = status?.name,
                startDate = startDate,
                endDate = endDate,
                page = page,
                limit = limit
            )
        }
    }
    
    suspend fun createBooking(
        slotId: String,
        childId: String,
        notes: String? = null
    ): NetworkResult<BookingResponse> {
        return safeApiCall {
            apiService.createBooking(
                BookingRequest(
                    slotId = slotId,
                    childId = childId,
                    notes = notes
                )
            )
        }
    }
    
    suspend fun rescheduleBooking(
        bookingId: String,
        newSlotId: String,
        notes: String? = null
    ): NetworkResult<BookingResponse> {
        return safeApiCall {
            apiService.rescheduleBooking(
                bookingId = bookingId,
                request = RescheduleBookingRequest(
                    newSlotId = newSlotId,
                    notes = notes
                )
            )
        }
    }
    
    suspend fun cancelBooking(
        bookingId: String,
        reason: String? = null
    ): NetworkResult<Unit> {
        return safeApiCall {
            apiService.cancelBooking(
                bookingId = bookingId,
                request = reason?.let { CancelBookingRequest(it) }
            )
        }.let { result ->
            when (result) {
                is NetworkResult.Success -> NetworkResult.Success(Unit)
                is NetworkResult.Error -> NetworkResult.Error(result.message, result.code)
                is NetworkResult.Loading -> NetworkResult.Loading(result.isLoading)
            }
        }
    }
    
    suspend fun exportBookingToCalendar(bookingId: String): NetworkResult<String> {
        return safeApiCall {
            apiService.exportBookingToCalendar(bookingId)
        }
    }
}