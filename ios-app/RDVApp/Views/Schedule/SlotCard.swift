//
//  SlotCard.swift
//  RDVApp
//
//  Reusable slot card component
//

import SwiftUI

struct SlotCard: View {
    let slot: Slot
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Time Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(slot.formattedTimeRange)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                    
                    Text(formatDuration(slot.duration))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Details
                VStack(alignment: .trailing, spacing: 4) {
                    if let classLeadName = slot.classLeadName {
                        Text(classLeadName)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    if let location = slot.location {
                        HStack {
                            Image(systemName: "location")
                                .font(.caption)
                            Text(location)
                                .font(.caption)
                        }
                        .foregroundColor(.secondary)
                    }
                    
                    // Status Badge
                    HStack {
                        Circle()
                            .fill(slot.isAvailable ? Color.green : Color.orange)
                            .frame(width: 8, height: 8)
                        
                        Text(slot.isAvailable ? "Available" : "Booked")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(slot.isAvailable ? .green : .orange)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(.systemGray4), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        
        if hours > 0 && minutes > 0 {
            return "\(hours)h \(minutes)m"
        } else if hours > 0 {
            return "\(hours)h"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Booking Card
struct BookingCard: View {
    let booking: Booking
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        if let slot = booking.slot {
                            Text(slot.formattedTimeRange)
                                .font(.headline)
                                .fontWeight(.semibold)
                        }
                        
                        if let childName = booking.childName {
                            Text("For: \(childName)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    // Status Badge
                    StatusBadge(status: booking.status)
                }
                
                // Details
                if let slot = booking.slot {
                    HStack {
                        if let classLeadName = slot.classLeadName {
                            Label(classLeadName, systemImage: "person.circle")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        if let location = slot.location {
                            Label(location, systemImage: "location")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                // Notes
                if let notes = booking.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(statusBorderColor(booking.status), lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func statusBorderColor(_ status: BookingStatus) -> Color {
        switch status {
        case .pending:
            return .orange
        case .confirmed:
            return .green
        case .cancelled:
            return .red
        case .completed:
            return .blue
        }
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: BookingStatus
    
    var body: some View {
        Text(status.displayName)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .cornerRadius(8)
    }
    
    private var backgroundColor: Color {
        switch status {
        case .pending:
            return .orange
        case .confirmed:
            return .green
        case .cancelled:
            return .red
        case .completed:
            return .blue
        }
    }
}

#Preview {
    VStack {
        let sampleSlot = Slot(
            id: "1",
            startTime: Date(),
            endTime: Date().addingTimeInterval(3600),
            isBooked: false,
            classLeadId: "teacher1",
            classLeadName: "John Smith",
            location: "Room 101",
            notes: nil,
            isRemoved: false,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        SlotCard(slot: sampleSlot) { }
        
        let sampleBooking = Booking(
            id: "1",
            slotId: "1",
            parentId: "parent1",
            parentName: "Jane Doe",
            parentEmail: "jane@example.com",
            parentPhone: "+1234567890",
            childId: "child1",
            childName: "Emma",
            notes: "Please remind Emma to bring her art supplies",
            status: .confirmed,
            slot: sampleSlot,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        BookingCard(booking: sampleBooking) { }
    }
    .padding()
}