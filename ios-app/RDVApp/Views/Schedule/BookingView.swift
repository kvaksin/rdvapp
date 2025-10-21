//
//  BookingView.swift
//  RDVApp
//
//  Booking creation and management view
//

import SwiftUI

struct BookingView: View {
    let slot: Slot
    let booking: Booking?
    let onComplete: (Bool) -> Void
    
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var scheduleViewModel: ScheduleViewModel
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedChildId: String?
    @State private var notes = ""
    @State private var showingCancelAlert = false
    @State private var showingRescheduleOptions = false
    @State private var isProcessing = false
    
    private var isEditing: Bool {
        booking != nil
    }
    
    private var isOwnBooking: Bool {
        guard let booking = booking,
              let user = authViewModel.user else { return false }
        return booking.parentId == user.id
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Slot Information
                slotInfoSection
                
                // Booking Form
                ScrollView {
                    VStack(spacing: 24) {
                        if isEditing {
                            existingBookingInfo
                        }
                        
                        if !isEditing || isOwnBooking {
                            bookingForm
                        }
                        
                        if let errorMessage = scheduleViewModel.errorMessage {
                            errorView(message: errorMessage)
                        }
                        
                        // Action Buttons
                        actionButtons
                    }
                    .padding()
                }
            }
            .navigationTitle(isEditing ? "Appointment Details" : "Book Appointment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        onComplete(false)
                    }
                }
            }
        }
        .alert("Cancel Appointment", isPresented: $showingCancelAlert) {
            Button("Keep", role: .cancel) { }
            Button("Cancel Appointment", role: .destructive) {
                cancelBooking()
            }
        } message: {
            Text("Are you sure you want to cancel this appointment? This action cannot be undone.")
        }
        .sheet(isPresented: $showingRescheduleOptions) {
            RescheduleView(booking: booking!) { newSlot in
                rescheduleBooking(to: newSlot)
            }
        }
        .onAppear {
            loadInitialData()
        }
    }
    
    // MARK: - Slot Info Section
    private var slotInfoSection: some View {
        VStack(spacing: 16) {
            // Date and Time
            VStack(spacing: 8) {
                Text(slot.formattedDate)
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Text(slot.formattedTimeRange)
                    .font(.title3)
                    .foregroundColor(.purple)
            }
            
            // Class Lead Info
            if let classLeadName = slot.classLeadName {
                HStack {
                    Image(systemName: "person.circle")
                        .foregroundColor(.purple)
                    
                    Text("with \(classLeadName)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            // Location
            if let location = slot.location {
                HStack {
                    Image(systemName: "location")
                        .foregroundColor(.purple)
                    
                    Text(location)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            // Slot Notes
            if let slotNotes = slot.notes, !slotNotes.isEmpty {
                HStack {
                    Image(systemName: "info.circle")
                        .foregroundColor(.purple)
                    
                    Text(slotNotes)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                    
                    Spacer()
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
    }
    
    // MARK: - Existing Booking Info
    private var existingBookingInfo: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Booking Information")
                .font(.title3)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                InfoRow(label: "Parent", value: booking?.parentName ?? "")
                InfoRow(label: "Email", value: booking?.parentEmail ?? "")
                
                if let phone = booking?.parentPhone {
                    InfoRow(label: "Phone", value: phone)
                }
                
                if let childName = booking?.childName {
                    InfoRow(label: "Child", value: childName)
                }
                
                InfoRow(label: "Status", value: booking?.status.displayName ?? "")
                
                if let existingNotes = booking?.notes, !existingNotes.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Notes:")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        Text(existingNotes)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Booking Form
    private var bookingForm: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(isEditing ? "Update Booking" : "Booking Details")
                .font(.title3)
                .fontWeight(.semibold)
            
            // Child Selection (for parents with multiple children)
            if let user = authViewModel.user, user.isParent && user.children.count > 1 {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Select Child")
                        .font(.headline)
                    
                    ForEach(user.children, id: \.id) { child in
                        Button(action: { selectedChildId = child.id }) {
                            HStack {
                                Image(systemName: selectedChildId == child.id ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(selectedChildId == child.id ? .purple : .gray)
                                
                                VStack(alignment: .leading) {
                                    Text(child.name)
                                        .font(.subheadline)
                                        .foregroundColor(.primary)
                                    
                                    if let className = child.className {
                                        Text("Class: \(className)")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                
                                Spacer()
                                
                                Text("Age \(child.age)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
            }
            
            // Notes Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Notes (Optional)")
                    .font(.headline)
                
                TextEditor(text: $notes)
                    .frame(minHeight: 80)
                    .padding(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
                
                Text("Add any special requests or information for your appointment")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    // MARK: - Action Buttons
    private var actionButtons: some View {
        VStack(spacing: 12) {
            if isEditing && isOwnBooking {
                // Update Button
                Button(action: updateBooking) {
                    HStack {
                        if isProcessing {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        }
                        
                        Text(isProcessing ? "Updating..." : "Update Appointment")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                .disabled(isProcessing)
                
                // Reschedule Button
                Button(action: { showingRescheduleOptions = true }) {
                    Text("Reschedule")
                        .font(.headline)
                        .foregroundColor(.purple)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.purple, lineWidth: 2)
                        )
                }
                .disabled(isProcessing)
                
                // Cancel Button
                Button(action: { showingCancelAlert = true }) {
                    Text("Cancel Appointment")
                        .font(.headline)
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.red, lineWidth: 2)
                        )
                }
                .disabled(isProcessing)
                
            } else if !isEditing {
                // Book Button
                Button(action: createBooking) {
                    HStack {
                        if isProcessing {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        }
                        
                        Text(isProcessing ? "Booking..." : "Book Appointment")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.purple)
                    .cornerRadius(12)
                }
                .disabled(isProcessing || !canBook)
            }
        }
    }
    
    // MARK: - Error View
    private func errorView(message: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle")
                .foregroundColor(.red)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.red)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
    }
    
    // MARK: - Helper Properties
    private var canBook: Bool {
        guard let user = authViewModel.user else { return false }
        
        if user.children.count > 1 {
            return selectedChildId != nil
        }
        
        return true
    }
    
    // MARK: - Actions
    private func loadInitialData() {
        if let booking = booking {
            selectedChildId = booking.childId
            notes = booking.notes ?? ""
        } else if let user = authViewModel.user, user.children.count == 1 {
            selectedChildId = user.children.first?.id
        }
    }
    
    private func createBooking() {
        isProcessing = true
        let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        
        scheduleViewModel.createBooking(
            for: slot,
            childId: selectedChildId,
            notes: trimmedNotes.isEmpty ? nil : trimmedNotes
        )
    }
    
    private func updateBooking() {
        guard let booking = booking else { return }
        
        isProcessing = true
        let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        
        scheduleViewModel.updateBooking(
            booking,
            childId: selectedChildId,
            notes: trimmedNotes.isEmpty ? nil : trimmedNotes
        )
    }
    
    private func rescheduleBooking(to newSlot: Slot) {
        guard let booking = booking else { return }
        
        isProcessing = true
        scheduleViewModel.rescheduleBooking(booking, to: newSlot)
    }
    
    private func cancelBooking() {
        guard let booking = booking else { return }
        
        isProcessing = true
        scheduleViewModel.cancelBooking(booking)
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text("\(label):")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .multilineTextAlignment(.trailing)
        }
    }
}

// MARK: - Reschedule View
struct RescheduleView: View {
    let booking: Booking
    let onReschedule: (Slot) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @StateObject private var scheduleViewModel = ScheduleViewModel()
    @State private var selectedDate = Date()
    
    var body: some View {
        NavigationView {
            VStack {
                // Date Picker
                DatePicker("Select New Date", selection: $selectedDate, displayedComponents: .date)
                    .datePickerStyle(CompactDatePickerStyle())
                    .padding()
                
                // Available Slots
                List(scheduleViewModel.availableSlots, id: \.id) { slot in
                    Button(action: { rescheduleToSlot(slot) }) {
                        VStack(alignment: .leading) {
                            Text(slot.formattedTimeRange)
                                .font(.headline)
                            
                            if let classLeadName = slot.classLeadName {
                                Text("with \(classLeadName)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Reschedule")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .onChange(of: selectedDate) { _ in
                scheduleViewModel.selectedDate = selectedDate
            }
            .onAppear {
                scheduleViewModel.selectedDate = selectedDate
            }
        }
    }
    
    private func rescheduleToSlot(_ slot: Slot) {
        onReschedule(slot)
        dismiss()
    }
}

#Preview {
    let sampleSlot = Slot(
        id: "1",
        startTime: Date(),
        endTime: Date().addingTimeInterval(3600),
        isBooked: false,
        classLeadId: "teacher1",
        classLeadName: "John Smith",
        location: "Room 101",
        notes: "Bring your materials",
        isRemoved: false,
        createdAt: Date(),
        updatedAt: Date()
    )
    
    return BookingView(slot: sampleSlot, booking: nil) { _ in }
        .environmentObject(AuthViewModel())
        .environmentObject(ScheduleViewModel())
}