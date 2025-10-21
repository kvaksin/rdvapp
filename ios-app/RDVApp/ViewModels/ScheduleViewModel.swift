//
//  ScheduleViewModel.swift
//  RDVApp
//
//  Schedule management view model
//

import Foundation
import Combine

class ScheduleViewModel: ObservableObject {
    @Published var slots: [Slot] = []
    @Published var bookings: [Booking] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedDate = Date()
    @Published var showingBookingDetail = false
    @Published var selectedSlot: Slot?
    @Published var selectedBooking: Booking?
    
    private var cancellables = Set<AnyCancellable>()
    private let apiService = APIService.shared
    
    init() {
        loadData()
        
        // Reload data when date changes
        $selectedDate
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                self?.loadSlots()
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Data Loading
    func loadData() {
        loadSlots()
        loadBookings()
    }
    
    func loadSlots() {
        isLoading = true
        errorMessage = nil
        
        let startOfDay = Calendar.current.startOfDay(for: selectedDate)
        let endOfDay = Calendar.current.date(byAdding: .day, value: 1, to: startOfDay)!
        
        apiService.getSlots(from: startOfDay, to: endOfDay)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.slots = response.slots.sorted { $0.startTime < $1.startTime }
                }
            )
            .store(in: &cancellables)
    }
    
    func loadBookings() {
        apiService.getBookings()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.bookings = response.bookings.sorted { 
                        guard let slot1 = $0.slot, let slot2 = $1.slot else { return false }
                        return slot1.startTime < slot2.startTime
                    }
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Booking Management
    func createBooking(for slot: Slot, childId: String?, notes: String?) {
        isLoading = true
        errorMessage = nil
        
        let request = CreateBookingRequest(
            slotId: slot.id,
            childId: childId,
            notes: notes
        )
        
        apiService.createBooking(request: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    // Reload data to get updated state
                    self?.loadData()
                    self?.showingBookingDetail = false
                }
            )
            .store(in: &cancellables)
    }
    
    func rescheduleBooking(_ booking: Booking, to newSlot: Slot) {
        isLoading = true
        errorMessage = nil
        
        let request = RescheduleBookingRequest(newSlotId: newSlot.id)
        
        apiService.rescheduleBooking(id: booking.id, request: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.loadData()
                    self?.showingBookingDetail = false
                }
            )
            .store(in: &cancellables)
    }
    
    func cancelBooking(_ booking: Booking) {
        isLoading = true
        errorMessage = nil
        
        apiService.cancelBooking(id: booking.id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.loadData()
                    self?.showingBookingDetail = false
                }
            )
            .store(in: &cancellables)
    }
    
    func updateBooking(_ booking: Booking, childId: String?, notes: String?) {
        isLoading = true
        errorMessage = nil
        
        let request = UpdateBookingRequest(
            slotId: nil,
            childId: childId,
            notes: notes,
            status: nil
        )
        
        apiService.updateBooking(id: booking.id, request: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.loadData()
                    self?.showingBookingDetail = false
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Helper Methods
    func selectSlot(_ slot: Slot) {
        selectedSlot = slot
        selectedBooking = nil
        showingBookingDetail = true
    }
    
    func selectBooking(_ booking: Booking) {
        selectedBooking = booking
        selectedSlot = booking.slot
        showingBookingDetail = true
    }
    
    func clearSelection() {
        selectedSlot = nil
        selectedBooking = nil
        showingBookingDetail = false
        errorMessage = nil
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    // MARK: - Computed Properties
    var availableSlots: [Slot] {
        slots.filter { $0.isAvailable }
    }
    
    var bookedSlots: [Slot] {
        slots.filter { $0.isBooked }
    }
    
    var upcomingBookings: [Booking] {
        bookings.filter { booking in
            guard let slot = booking.slot else { return false }
            return slot.startTime > Date() && booking.status != .cancelled
        }
    }
    
    var pastBookings: [Booking] {
        bookings.filter { booking in
            guard let slot = booking.slot else { return false }
            return slot.startTime < Date()
        }
    }
    
    var todaysBookings: [Booking] {
        bookings.filter { booking in
            guard let slot = booking.slot else { return false }
            return Calendar.current.isDateInToday(slot.startTime) && booking.status != .cancelled
        }
    }
    
    var hasBookingsForSelectedDate: Bool {
        bookings.contains { booking in
            guard let slot = booking.slot else { return false }
            return Calendar.current.isDate(slot.startTime, inSameDayAs: selectedDate) && booking.status != .cancelled
        }
    }
    
    func bookingsForDate(_ date: Date) -> [Booking] {
        bookings.filter { booking in
            guard let slot = booking.slot else { return false }
            return Calendar.current.isDate(slot.startTime, inSameDayAs: date) && booking.status != .cancelled
        }
    }
    
    func slotsForDate(_ date: Date) -> [Slot] {
        slots.filter { slot in
            Calendar.current.isDate(slot.startTime, inSameDayAs: date)
        }
    }
}