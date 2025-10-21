package com.rdvapp.presentation.schedule

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rdvapp.data.model.*
import com.rdvapp.data.network.NetworkResult
import com.rdvapp.data.repository.BookingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class ScheduleViewModel @Inject constructor(
    private val bookingRepository: BookingRepository
) : ViewModel() {
    
    var uiState by mutableStateOf(ScheduleUiState())
        private set
    
    init {
        loadScheduleData()
    }
    
    private fun loadScheduleData() {
        loadSlots()
        loadBookings()
    }
    
    fun loadSlots(
        startDate: String? = null,
        endDate: String? = null,
        available: Boolean? = true
    ) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoadingSlots = true, errorMessage = null)
            
            when (val result = bookingRepository.getSlots(
                startDate = startDate,
                endDate = endDate,
                available = available
            )) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoadingSlots = false,
                        slots = result.data.slots,
                        errorMessage = null
                    )
                }
                is NetworkResult.Error -> {
                    uiState = uiState.copy(
                        isLoadingSlots = false,
                        errorMessage = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isLoadingSlots = result.isLoading)
                }
            }
        }
    }
    
    fun loadBookings() {
        viewModelScope.launch {
            uiState = uiState.copy(isLoadingBookings = true, errorMessage = null)
            
            when (val result = bookingRepository.getBookings()) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoadingBookings = false,
                        bookings = result.data.bookings,
                        errorMessage = null
                    )
                }
                is NetworkResult.Error -> {
                    uiState = uiState.copy(
                        isLoadingBookings = false,
                        errorMessage = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    uiState = uiState.copy(isLoadingBookings = result.isLoading)
                }
            }
        }
    }
    
    fun createBooking(slotId: String, childId: String, notes: String?) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            
            when (val result = bookingRepository.createBooking(slotId, childId, notes)) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        errorMessage = null
                    )
                    // Reload data to show updated state
                    loadScheduleData()
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
    
    fun rescheduleBooking(bookingId: String, newSlotId: String, notes: String?) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            
            when (val result = bookingRepository.rescheduleBooking(bookingId, newSlotId, notes)) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        errorMessage = null
                    )
                    // Reload data to show updated state
                    loadScheduleData()
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
    
    fun cancelBooking(bookingId: String, reason: String?) {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            
            when (val result = bookingRepository.cancelBooking(bookingId, reason)) {
                is NetworkResult.Success -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        errorMessage = null
                    )
                    // Reload data to show updated state
                    loadScheduleData()
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
    
    fun selectDate(date: LocalDate) {
        uiState = uiState.copy(selectedDate = date)
        
        // Load slots for the selected date
        val dateString = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
        loadSlots(startDate = dateString, endDate = dateString)
    }
    
    fun selectSlot(slot: Slot?) {
        uiState = uiState.copy(selectedSlot = slot)
    }
    
    fun selectChild(child: Child?) {
        uiState = uiState.copy(selectedChild = child)
    }
    
    fun clearError() {
        uiState = uiState.copy(errorMessage = null)
    }
    
    fun clearSelection() {
        uiState = uiState.copy(
            selectedSlot = null,
            selectedChild = null
        )
    }
}

data class ScheduleUiState(
    val isLoading: Boolean = false,
    val isLoadingSlots: Boolean = false,
    val isLoadingBookings: Boolean = false,
    val slots: List<Slot> = emptyList(),
    val bookings: List<Booking> = emptyList(),
    val selectedDate: LocalDate = LocalDate.now(),
    val selectedSlot: Slot? = null,
    val selectedChild: Child? = null,
    val errorMessage: String? = null
)