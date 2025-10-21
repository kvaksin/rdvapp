//
//  Class.swift
//  RDVApp
//
//  Class and booking data models
//

import Foundation

// MARK: - Slot
struct Slot: Codable, Identifiable {
    let id: String
    let startTime: Date
    let endTime: Date
    let isBooked: Bool
    let classLeadId: String?
    let classLeadName: String?
    let location: String?
    let notes: String?
    let isRemoved: Bool
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case startTime = "start_time"
        case endTime = "end_time"
        case isBooked = "booked"
        case classLeadId = "class_lead_id"
        case classLeadName = "class_lead_name"
        case location, notes
        case isRemoved = "removed"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
    
    var duration: TimeInterval {
        endTime.timeIntervalSince(startTime)
    }
    
    var isAvailable: Bool {
        !isBooked && !isRemoved
    }
    
    var formattedTimeRange: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return "\(formatter.string(from: startTime)) - \(formatter.string(from: endTime))"
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: startTime)
    }
}

// MARK: - Booking
struct Booking: Codable, Identifiable {
    let id: String
    let slotId: String
    let parentId: String
    let parentName: String
    let parentEmail: String
    let parentPhone: String?
    let childId: String?
    let childName: String?
    let notes: String?
    let status: BookingStatus
    let slot: Slot?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case slotId = "slot_id"
        case parentId = "parent_id"
        case parentName = "parent_name"
        case parentEmail = "parent_email"
        case parentPhone = "parent_phone"
        case childId = "child_id"
        case childName = "child_name"
        case notes, status, slot
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Booking Status
enum BookingStatus: String, Codable, CaseIterable {
    case pending = "pending"
    case confirmed = "confirmed"
    case cancelled = "cancelled"
    case completed = "completed"
    
    var displayName: String {
        switch self {
        case .pending:
            return "Pending"
        case .confirmed:
            return "Confirmed"
        case .cancelled:
            return "Cancelled"
        case .completed:
            return "Completed"
        }
    }
    
    var color: String {
        switch self {
        case .pending:
            return "orange"
        case .confirmed:
            return "green"
        case .cancelled:
            return "red"
        case .completed:
            return "blue"
        }
    }
}

// MARK: - Booking Request Models
struct CreateBookingRequest: Codable {
    let slotId: String
    let childId: String?
    let notes: String?
    
    enum CodingKeys: String, CodingKey {
        case slotId = "slot_id"
        case childId = "child_id"
        case notes
    }
}

struct UpdateBookingRequest: Codable {
    let slotId: String?
    let childId: String?
    let notes: String?
    let status: BookingStatus?
    
    enum CodingKeys: String, CodingKey {
        case slotId = "slot_id"
        case childId = "child_id"
        case notes, status
    }
}

struct RescheduleBookingRequest: Codable {
    let newSlotId: String
    
    enum CodingKeys: String, CodingKey {
        case newSlotId = "new_slot_id"
    }
}

// MARK: - Slot Creation Models
struct CreateSlotsRequest: Codable {
    let start: Date
    let end: Date
    let duration: Int? // in minutes
    let classLeadId: String?
    let location: String?
    let notes: String?
    
    enum CodingKeys: String, CodingKey {
        case start, end, duration
        case classLeadId = "class_lead_id"
        case location, notes
    }
}

// MARK: - Response Models
struct SlotsResponse: Codable {
    let slots: [Slot]
    let total: Int
    let available: Int
    let booked: Int
}

struct BookingsResponse: Codable {
    let bookings: [Booking]
    let total: Int
}

struct BookingResponse: Codable {
    let booking: Booking
    let message: String?
}

// MARK: - Calendar Integration
struct CalendarEvent {
    let title: String
    let startDate: Date
    let endDate: Date
    let location: String?
    let notes: String?
    let attendees: [String]
    
    init(from booking: Booking) {
        self.title = "RDV Appointment"
        if let slot = booking.slot {
            self.startDate = slot.startTime
            self.endDate = slot.endTime
            self.location = slot.location
        } else {
            self.startDate = Date()
            self.endDate = Date().addingTimeInterval(3600) // 1 hour default
            self.location = nil
        }
        
        var notesText = ""
        if let childName = booking.childName {
            notesText += "Child: \(childName)\n"
        }
        if let bookingNotes = booking.notes {
            notesText += "Notes: \(bookingNotes)"
        }
        self.notes = notesText.isEmpty ? nil : notesText
        
        self.attendees = [booking.parentEmail]
    }
}

// MARK: - Date Extensions for Class Models
extension Date {
    static func from(isoString: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: isoString) ?? ISO8601DateFormatter().date(from: isoString)
    }
    
    func toISOString() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: self)
    }
    
    var isToday: Bool {
        Calendar.current.isDateInToday(self)
    }
    
    var isTomorrow: Bool {
        Calendar.current.isDateInTomorrow(self)
    }
    
    var isThisWeek: Bool {
        Calendar.current.isDate(self, equalTo: Date(), toGranularity: .weekOfYear)
    }
}