//
//  Message.swift
//  RDVApp
//
//  Message data models
//

import Foundation

// MARK: - Message
struct Message: Codable, Identifiable {
    let id: String
    let type: MessageType
    let subject: String?
    let message: String
    let senderName: String
    let senderId: String
    let createdAt: Date
    let attachments: [MessageAttachment]
    let replies: [MessageReply]
    
    enum CodingKeys: String, CodingKey {
        case id, type, subject, message
        case senderName = "sender_name"
        case senderId = "sender_id"
        case createdAt = "created_at"
        case attachments, replies
    }
    
    var hasAttachments: Bool {
        !attachments.isEmpty
    }
    
    var hasReplies: Bool {
        !replies.isEmpty
    }
    
    var displayTitle: String {
        if let subject = subject, !subject.isEmpty {
            return subject
        }
        return String(message.prefix(50)) + (message.count > 50 ? "..." : "")
    }
    
    var isUnread: Bool {
        // TODO: Implement read status tracking
        false
    }
}

// MARK: - Message Type
enum MessageType: String, Codable, CaseIterable {
    case classLeadToParents = "class_lead_to_parents"
    case parentToClassLead = "parent_to_class_lead"
    case adminToClass = "admin_to_class"
    
    var displayName: String {
        switch self {
        case .classLeadToParents:
            return "Class Lead to Parents"
        case .parentToClassLead:
            return "Parent to Class Lead"
        case .adminToClass:
            return "Admin to Class"
        }
    }
    
    var iconName: String {
        switch self {
        case .classLeadToParents:
            return "person.2"
        case .parentToClassLead:
            return "person"
        case .adminToClass:
            return "building.2"
        }
    }
    
    var shortDisplayName: String {
        switch self {
        case .classLeadToParents:
            return "To Parents"
        case .parentToClassLead:
            return "To Class Lead"
        case .adminToClass:
            return "To Class"
        }
    }
}

// MARK: - Message Attachment
struct MessageAttachment: Codable, Identifiable {
    let id: String
    let filename: String
    let originalName: String
    let size: Int
    let mimeType: String
    let url: String
    let messageId: String
    let uploadedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, filename
        case originalName = "original_name"
        case size
        case mimeType = "mime_type"
        case url
        case messageId = "message_id"
        case uploadedAt = "uploaded_at"
    }
    
    var fileExtension: String {
        (filename as NSString).pathExtension.lowercased()
    }
    
    var isImage: Bool {
        ["jpg", "jpeg", "png", "gif", "webp"].contains(fileExtension)
    }
    
    var isPDF: Bool {
        fileExtension == "pdf"
    }
    
    var isVideo: Bool {
        ["mp4", "mov", "avi", "mkv"].contains(fileExtension)
    }
    
    var isAudio: Bool {
        ["mp3", "wav", "aac", "m4a"].contains(fileExtension)
    }
    
    var iconName: String {
        if isImage { return "photo" }
        if isPDF { return "doc.text" }
        if isVideo { return "video" }
        if isAudio { return "music.note" }
        return "doc"
    }
    
    var formattedSize: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: Int64(size))
    }
}

// MARK: - Message Reply
struct MessageReply: Codable, Identifiable {
    let id: String
    let messageId: String
    let reply: String
    let senderName: String
    let senderId: String
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case messageId = "message_id"
        case reply
        case senderName = "sender_name"
        case senderId = "sender_id"
        case createdAt = "created_at"
    }
}

// MARK: - Message Request Models
struct SendMessageRequest: Codable {
    let type: String
    let subject: String?
    let message: String
    let classIds: [String]?
    let childIds: [String]?
    let attachments: [String]?
    
    enum CodingKeys: String, CodingKey {
        case type, subject, message
        case classIds = "class_ids"
        case childIds = "child_ids"
        case attachments
    }
}

struct ReplyToMessageRequest: Codable {
    let messageId: String
    let reply: String
    
    enum CodingKeys: String, CodingKey {
        case messageId = "message_id"
        case reply
    }
}

struct MessageFiltersRequest: Codable {
    let type: MessageType?
    let unreadOnly: Bool?
    let fromDate: Date?
    let toDate: Date?
    let limit: Int?
    let offset: Int?
    
    enum CodingKeys: String, CodingKey {
        case type
        case unreadOnly = "unread_only"
        case fromDate = "from_date"
        case toDate = "to_date"
        case limit, offset
    }
}

// MARK: - Response Models
struct MessagesResponse: Codable {
    let messages: [Message]
    let total: Int
    let unread: Int
    let hasMore: Bool
    
    enum CodingKeys: String, CodingKey {
        case messages, total, unread
        case hasMore = "has_more"
    }
}

struct MessageResponse: Codable {
    let message: Message
    let success: Bool
}

struct ReplyResponse: Codable {
    let reply: MessageReply
    let success: Bool
}

// MARK: - File Upload Models
struct FileUploadResponse: Codable {
    let id: String
    let filename: String
    let originalName: String
    let size: Int
    let mimeType: String
    let url: String
    
    enum CodingKeys: String, CodingKey {
        case id, filename
        case originalName = "original_name"
        case size
        case mimeType = "mime_type"
        case url
    }
}

// MARK: - Message Grouping
struct MessageGroup {
    let date: Date
    let messages: [Message]
    
    var formattedDate: String {
        let formatter = DateFormatter()
        if Calendar.current.isDateInToday(date) {
            return "Today"
        } else if Calendar.current.isDateInYesterday(date) {
            return "Yesterday"
        } else if Calendar.current.isDate(date, equalTo: Date(), toGranularity: .weekOfYear) {
            formatter.dateFormat = "EEEE"
            return formatter.string(from: date)
        } else {
            formatter.dateStyle = .medium
            return formatter.string(from: date)
        }
    }
}

// MARK: - Message Utilities
extension Array where Element == Message {
    func groupedByDate() -> [MessageGroup] {
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: self) { message in
            calendar.startOfDay(for: message.createdAt)
        }
        
        return grouped.map { date, messages in
            MessageGroup(date: date, messages: messages.sorted { $0.createdAt > $1.createdAt })
        }.sorted { $0.date > $1.date }
    }
    
    func unreadCount() -> Int {
        filter { $0.isUnread }.count
    }
    
    func filtered(by type: MessageType?) -> [Message] {
        guard let type = type else { return self }
        return filter { $0.type == type }
    }
}