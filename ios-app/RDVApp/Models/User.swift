//
//  User.swift
//  RDVApp
//
//  User data models
//

import Foundation

// MARK: - User
struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let phone: String?
    let isAdmin: Bool
    let isClassLead: Bool
    let isParent: Bool
    let children: [Child]
    let managedClasses: [ClassInfo]
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, email, name, phone
        case isAdmin = "is_admin"
        case isClassLead = "is_class_lead"
        case isParent = "is_parent"
        case children
        case managedClasses = "managed_classes"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Child
struct Child: Codable, Identifiable {
    let id: String
    let name: String
    let age: Int
    let classId: String?
    let className: String?
    let parentId: String
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, name, age
        case classId = "class_id"
        case className = "class_name"
        case parentId = "parent_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - ClassInfo
struct ClassInfo: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let schedule: String
    let studentCount: Int
    let classLeadId: String
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, name, description, schedule
        case studentCount = "student_count"
        case classLeadId = "class_lead_id"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Authentication Models
struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String
    let password: String
    let name: String
    let phone: String?
    let children: [ChildRegistration]?
}

struct ChildRegistration: Codable {
    let name: String
    let age: Int
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

// MARK: - Profile Update Models
struct UpdateProfileRequest: Codable {
    let name: String
    let phone: String?
}

// MARK: - Date Extensions
extension Date {
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let dateString = try container.decode(String.self)
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateString) {
            self = date
        } else {
            // Fallback to simpler format
            let simpleFormatter = ISO8601DateFormatter()
            if let date = simpleFormatter.date(from: dateString) {
                self = date
            } else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid date format")
            }
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        try container.encode(formatter.string(from: self))
    }
}