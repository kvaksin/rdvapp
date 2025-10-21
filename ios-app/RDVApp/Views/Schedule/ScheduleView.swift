//
//  ScheduleView.swift
//  RDVApp
//
//  Main schedule view with calendar and slots
//

import SwiftUI

struct ScheduleView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var scheduleViewModel = ScheduleViewModel()
    @State private var showingCalendar = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Date Selector
                dateSelector
                
                // Content
                if scheduleViewModel.isLoading && scheduleViewModel.slots.isEmpty {
                    loadingView
                } else {
                    contentView
                }
            }
            .navigationTitle("Schedule")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingCalendar = true }) {
                        Image(systemName: "calendar")
                    }
                }
            }
        }
        .sheet(isPresented: $scheduleViewModel.showingBookingDetail) {
            if let slot = scheduleViewModel.selectedSlot {
                BookingView(
                    slot: slot,
                    booking: scheduleViewModel.selectedBooking,
                    onComplete: { success in
                        if success {
                            scheduleViewModel.loadData()
                        }
                        scheduleViewModel.clearSelection()
                    }
                )
                .environmentObject(authViewModel)
                .environmentObject(scheduleViewModel)
            }
        }
        .sheet(isPresented: $showingCalendar) {
            CalendarPickerView(selectedDate: $scheduleViewModel.selectedDate)
        }
        .refreshable {
            scheduleViewModel.loadData()
        }
        .onAppear {
            scheduleViewModel.loadData()
        }
    }
    
    // MARK: - Date Selector
    private var dateSelector: some View {
        VStack(spacing: 16) {
            // Week View
            HStack {
                Button(action: previousWeek) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(.purple)
                }
                
                Spacer()
                
                Text(weekDateRange)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button(action: nextWeek) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(.purple)
                }
            }
            .padding(.horizontal)
            
            // Day Selector
            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(weekDates, id: \.self) { date in
                            DayButton(
                                date: date,
                                isSelected: Calendar.current.isDate(date, inSameDayAs: scheduleViewModel.selectedDate),
                                hasBookings: scheduleViewModel.hasBookingsForSelectedDate,
                                action: {
                                    scheduleViewModel.selectedDate = date
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                .onAppear {
                    proxy.scrollTo(scheduleViewModel.selectedDate, anchor: .center)
                }
            }
        }
        .padding(.vertical)
        .background(Color(.systemGray6))
    }
    
    // MARK: - Content View
    private var contentView: some View {
        VStack(spacing: 0) {
            // Quick Stats
            if !scheduleViewModel.bookings.isEmpty {
                quickStatsView
            }
            
            // Main Content
            ScrollView {
                LazyVStack(spacing: 16) {
                    // Today's Bookings
                    if !scheduleViewModel.todaysBookings.isEmpty && Calendar.current.isDateInToday(scheduleViewModel.selectedDate) {
                        todaysBookingsSection
                    }
                    
                    // Available Slots
                    if !scheduleViewModel.availableSlots.isEmpty {
                        availableSlotsSection
                    }
                    
                    // Existing Bookings for Selected Date
                    let selectedDateBookings = scheduleViewModel.bookingsForDate(scheduleViewModel.selectedDate)
                    if !selectedDateBookings.isEmpty {
                        existingBookingsSection(selectedDateBookings)
                    }
                    
                    // Empty State
                    if scheduleViewModel.slots.isEmpty && !scheduleViewModel.isLoading {
                        emptyStateView
                    }
                }
                .padding()
            }
        }
    }
    
    // MARK: - Quick Stats
    private var quickStatsView: some View {
        HStack(spacing: 20) {
            StatCard(
                title: "Upcoming",
                value: "\(scheduleViewModel.upcomingBookings.count)",
                color: .blue
            )
            
            StatCard(
                title: "Today",
                value: "\(scheduleViewModel.todaysBookings.count)",
                color: .green
            )
            
            StatCard(
                title: "Available",
                value: "\(scheduleViewModel.availableSlots.count)",
                color: .purple
            )
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    // MARK: - Today's Bookings Section
    private var todaysBookingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today's Appointments")
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.horizontal)
            
            ForEach(scheduleViewModel.todaysBookings, id: \.id) { booking in
                BookingCard(booking: booking) {
                    scheduleViewModel.selectBooking(booking)
                }
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Available Slots Section
    private var availableSlotsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Available Slots - \(formattedSelectedDate)")
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.horizontal)
            
            ForEach(scheduleViewModel.availableSlots, id: \.id) { slot in
                SlotCard(slot: slot) {
                    scheduleViewModel.selectSlot(slot)
                }
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Existing Bookings Section
    private func existingBookingsSection(_ bookings: [Booking]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your Appointments - \(formattedSelectedDate)")
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.horizontal)
            
            ForEach(bookings, id: \.id) { booking in
                BookingCard(booking: booking) {
                    scheduleViewModel.selectBooking(booking)
                }
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Loading schedule...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No slots available")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("There are no time slots available for \(formattedSelectedDate). Try selecting a different date.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: { scheduleViewModel.selectedDate = Date() }) {
                Text("Back to Today")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.purple)
                    .cornerRadius(12)
            }
        }
        .padding()
    }
    
    // MARK: - Helper Properties
    private var weekDates: [Date] {
        guard let weekInterval = Calendar.current.dateInterval(of: .weekOfYear, for: scheduleViewModel.selectedDate) else {
            return []
        }
        
        var dates: [Date] = []
        var date = weekInterval.start
        
        while date < weekInterval.end {
            dates.append(date)
            date = Calendar.current.date(byAdding: .day, value: 1, to: date)!
        }
        
        return dates
    }
    
    private var weekDateRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        
        guard let firstDate = weekDates.first,
              let lastDate = weekDates.last else {
            return ""
        }
        
        if Calendar.current.isDate(firstDate, equalTo: lastDate, toGranularity: .month) {
            return "\(formatter.string(from: firstDate)) - \(Calendar.current.component(.day, from: lastDate))"
        } else {
            return "\(formatter.string(from: firstDate)) - \(formatter.string(from: lastDate))"
        }
    }
    
    private var formattedSelectedDate: String {
        let formatter = DateFormatter()
        if Calendar.current.isDateInToday(scheduleViewModel.selectedDate) {
            return "Today"
        } else if Calendar.current.isDateInTomorrow(scheduleViewModel.selectedDate) {
            return "Tomorrow"
        } else {
            formatter.dateStyle = .medium
            return formatter.string(from: scheduleViewModel.selectedDate)
        }
    }
    
    // MARK: - Actions
    private func previousWeek() {
        scheduleViewModel.selectedDate = Calendar.current.date(byAdding: .weekOfYear, value: -1, to: scheduleViewModel.selectedDate) ?? scheduleViewModel.selectedDate
    }
    
    private func nextWeek() {
        scheduleViewModel.selectedDate = Calendar.current.date(byAdding: .weekOfYear, value: 1, to: scheduleViewModel.selectedDate) ?? scheduleViewModel.selectedDate
    }
}

// MARK: - Day Button
struct DayButton: View {
    let date: Date
    let isSelected: Bool
    let hasBookings: Bool
    let action: () -> Void
    
    private var dayFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter
    }
    
    private var weekdayFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "E"
        return formatter
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(weekdayFormatter.string(from: date))
                    .font(.caption)
                    .foregroundColor(isSelected ? .white : .secondary)
                
                Text(dayFormatter.string(from: date))
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(isSelected ? .white : .primary)
                
                if hasBookings {
                    Circle()
                        .fill(isSelected ? Color.white : Color.purple)
                        .frame(width: 6, height: 6)
                } else {
                    Circle()
                        .fill(Color.clear)
                        .frame(width: 6, height: 6)
                }
            }
            .frame(width: 50, height: 70)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.purple : Color.clear)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Calendar Picker View
struct CalendarPickerView: View {
    @Binding var selectedDate: Date
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            DatePicker("Select Date", selection: $selectedDate, displayedComponents: .date)
                .datePickerStyle(GraphicalDatePickerStyle())
                .padding()
                .navigationTitle("Select Date")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Done") {
                            dismiss()
                        }
                    }
                }
        }
    }
}

#Preview {
    ScheduleView()
        .environmentObject(AuthViewModel())
}