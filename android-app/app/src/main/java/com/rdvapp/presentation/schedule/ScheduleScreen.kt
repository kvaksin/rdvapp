package com.rdvapp.presentation.schedule

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rdvapp.data.model.Booking
import com.rdvapp.data.model.Child
import com.rdvapp.data.model.Slot
import com.rdvapp.presentation.auth.AuthViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleScreen(
    authViewModel: AuthViewModel,
    viewModel: ScheduleViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    val authUiState = authViewModel.uiState
    var showBookingDialog by remember { mutableStateOf(false) }
    var showBookingDetailDialog by remember { mutableStateOf<Booking?>(null) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "Schedule",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Date Picker Row
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(getWeekDates()) { date ->
                DateCard(
                    date = date,
                    isSelected = date == uiState.selectedDate,
                    onClick = { viewModel.selectDate(date) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Content based on loading state
        when {
            uiState.isLoadingSlots || uiState.isLoadingBookings -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            uiState.errorMessage != null -> {
                ErrorSection(
                    message = uiState.errorMessage,
                    onRetry = { viewModel.loadSlots() }
                )
            }
            else -> {
                // Available Slots Section
                Text(
                    text = "Available Slots",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.slots.filter { it.isAvailable }) { slot ->
                        SlotCard(
                            slot = slot,
                            onClick = {
                                viewModel.selectSlot(slot)
                                showBookingDialog = true
                            }
                        )
                    }
                    
                    if (uiState.slots.filter { it.isAvailable }.isEmpty()) {
                        item {
                            EmptyStateCard(
                                title = "No Available Slots",
                                message = "There are no available time slots for this date. Please select another date."
                            )
                        }
                    }
                    
                    // Your Bookings Section
                    if (uiState.bookings.isNotEmpty()) {
                        item {
                            Spacer(modifier = Modifier.height(24.dp))
                            Text(
                                text = "Your Bookings",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }
                        
                        items(uiState.bookings) { booking ->
                            BookingCard(
                                booking = booking,
                                onClick = { showBookingDetailDialog = booking }
                            )
                        }
                    }
                }
            }
        }
    }
    
    // Booking Dialog
    if (showBookingDialog && uiState.selectedSlot != null) {
        BookingDialog(
            slot = uiState.selectedSlot,
            children = authUiState.user?.children ?: emptyList(),
            onConfirm = { childId, notes ->
                viewModel.createBooking(uiState.selectedSlot.id, childId, notes)
                showBookingDialog = false
                viewModel.clearSelection()
            },
            onDismiss = {
                showBookingDialog = false
                viewModel.clearSelection()
            }
        )
    }
    
    // Booking Detail Dialog
    showBookingDetailDialog?.let { booking ->
        BookingDetailDialog(
            booking = booking,
            onReschedule = { newSlotId, notes ->
                viewModel.rescheduleBooking(booking.id, newSlotId, notes)
                showBookingDetailDialog = null
            },
            onCancel = { reason ->
                viewModel.cancelBooking(booking.id, reason)
                showBookingDetailDialog = null
            },
            onDismiss = {
                showBookingDetailDialog = null
            }
        )
    }
}

@Composable
private fun DateCard(
    date: LocalDate,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.surface
            }
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isSelected) 6.dp else 2.dp
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()),
                fontSize = 12.sp,
                color = if (isSelected) {
                    MaterialTheme.colorScheme.onPrimary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
            )
            Text(
                text = date.dayOfMonth.toString(),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = if (isSelected) {
                    MaterialTheme.colorScheme.onPrimary
                } else {
                    MaterialTheme.colorScheme.onSurface
                }
            )
        }
    }
}

@Composable
private fun SlotCard(
    slot: Slot,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = formatTime(slot.startTime),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "${slot.duration} minutes",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Book slot",
                tint = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
private fun BookingCard(
    booking: Booking,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = booking.child?.name ?: "Unknown Child",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
                
                Text(
                    text = booking.status.name,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = booking.slot?.let { formatTime(it.startTime) } ?: "Unknown Time",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            
            if (!booking.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = booking.notes,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}

@Composable
private fun EmptyStateCard(
    title: String,
    message: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.EventBusy,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = message,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun ErrorSection(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Error",
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.error
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = message,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}

// Helper functions
private fun getWeekDates(): List<LocalDate> {
    val today = LocalDate.now()
    return (0..6).map { today.plusDays(it.toLong()) }
}

private fun formatTime(timeString: String): String {
    // This would need proper ISO 8601 parsing in real implementation
    return timeString.substring(11, 16) // Extract HH:mm from ISO format
}

// Dialogs would be implemented here
@Composable
private fun BookingDialog(
    slot: Slot,
    children: List<Child>,
    onConfirm: (String, String?) -> Unit,
    onDismiss: () -> Unit
) {
    // Implementation for booking dialog
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Book Appointment") },
        text = { Text("Booking dialog implementation") },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Book")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun BookingDetailDialog(
    booking: Booking,
    onReschedule: (String, String?) -> Unit,
    onCancel: (String?) -> Unit,
    onDismiss: () -> Unit
) {
    // Implementation for booking detail dialog
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Booking Details") },
        text = { Text("Booking detail dialog implementation") },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}