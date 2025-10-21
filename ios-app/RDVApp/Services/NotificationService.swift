//
//  NotificationService.swift
//  RDVApp
//
//  Push notification service for handling remote and local notifications
//

import Foundation
import UserNotifications
import UIKit
import Combine

class NotificationService: NSObject, ObservableObject {
    static let shared = NotificationService()
    
    @Published var isAuthorized = false
    @Published var notificationSettings: UNNotificationSettings?
    @Published var deviceToken: String?
    
    private let notificationCenter = UNUserNotificationCenter.current()
    private var cancellables = Set<AnyCancellable>()
    
    override init() {
        super.init()
        notificationCenter.delegate = self
        checkAuthorizationStatus()
    }
    
    // MARK: - Authorization
    func requestPermission() {
        notificationCenter.requestAuthorization(options: [.alert, .badge, .sound]) { [weak self] granted, error in
            DispatchQueue.main.async {
                self?.isAuthorized = granted
                if granted {
                    self?.registerForRemoteNotifications()
                }
                if let error = error {
                    print("Notification permission error: \(error.localizedDescription)")
                }
            }
        }
    }
    
    func checkAuthorizationStatus() {
        notificationCenter.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.notificationSettings = settings
                self?.isAuthorized = settings.authorizationStatus == .authorized
                
                if settings.authorizationStatus == .authorized {
                    self?.registerForRemoteNotifications()
                }
            }
        }
    }
    
    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
    
    // MARK: - Device Token Management
    func setDeviceToken(_ deviceToken: Data) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = tokenString
        
        // Send device token to backend
        sendDeviceTokenToServer(tokenString)
    }
    
    private func sendDeviceTokenToServer(_ token: String) {
        // This will be called from AuthViewModel after successful login
        APIService.shared.updateDeviceToken(token)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Failed to register device token: \(error.localizedDescription)")
                    }
                },
                receiveValue: { _ in
                    print("Device token registered successfully")
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Local Notifications
    func scheduleAppointmentReminder(for booking: Booking) {
        guard let slot = booking.slot,
              let childName = booking.childName else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Appointment Reminder"
        content.body = "Don't forget about \(childName)'s appointment at \(slot.formattedTimeRange)"
        content.sound = .default
        content.badge = 1
        
        // Add custom data for deep linking
        content.userInfo = [
            "type": "appointment_reminder",
            "bookingId": booking.id,
            "slotId": booking.slotId
        ]
        
        // Schedule notification 30 minutes before appointment
        let reminderTime = slot.startTime.addingTimeInterval(-30 * 60) // 30 minutes before
        
        if reminderTime > Date() {
            let calendar = Calendar.current
            let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: reminderTime)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            
            let request = UNNotificationRequest(
                identifier: "appointment_reminder_\(booking.id)",
                content: content,
                trigger: trigger
            )
            
            notificationCenter.add(request) { error in
                if let error = error {
                    print("Failed to schedule reminder: \(error.localizedDescription)")
                }
            }
        }
    }
    
    func scheduleAppointmentConfirmation(for booking: Booking) {
        guard let slot = booking.slot,
              let childName = booking.childName else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Appointment Confirmed"
        content.body = "Your appointment for \(childName) on \(slot.formattedDate) at \(slot.formattedTimeRange) has been confirmed"
        content.sound = .default
        content.badge = 1
        
        content.userInfo = [
            "type": "appointment_confirmed",
            "bookingId": booking.id,
            "slotId": booking.slotId
        ]
        
        let request = UNNotificationRequest(
            identifier: "appointment_confirmed_\(booking.id)",
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        )
        
        notificationCenter.add(request)
    }
    
    func scheduleNewMessageNotification(for message: Message) {
        let content = UNMutableNotificationContent()
        content.title = "New Message"
        content.body = "\(message.senderName): \(message.displayTitle)"
        content.sound = .default
        content.badge = 1
        
        content.userInfo = [
            "type": "new_message",
            "messageId": message.id,
            "senderId": message.senderId
        ]
        
        let request = UNNotificationRequest(
            identifier: "message_\(message.id)",
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        )
        
        notificationCenter.add(request)
    }
    
    // MARK: - Cancel Notifications
    func cancelAppointmentNotifications(for bookingId: String) {
        let identifiers = [
            "appointment_reminder_\(bookingId)",
            "appointment_confirmed_\(bookingId)"
        ]
        
        notificationCenter.removePendingNotificationRequests(withIdentifiers: identifiers)
        notificationCenter.removeDeliveredNotifications(withIdentifiers: identifiers)
    }
    
    func clearAllNotifications() {
        notificationCenter.removeAllPendingNotificationRequests()
        notificationCenter.removeAllDeliveredNotifications()
        UIApplication.shared.applicationIconBadgeNumber = 0
    }
    
    // MARK: - Badge Management
    func updateBadgeCount(_ count: Int) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
        }
    }
    
    func clearBadge() {
        updateBadgeCount(0)
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension NotificationService: UNUserNotificationCenterDelegate {
    
    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle different notification types
        if let type = userInfo["type"] as? String {
            handleNotificationTap(type: type, userInfo: userInfo)
        }
        
        completionHandler()
    }
    
    private func handleNotificationTap(type: String, userInfo: [AnyHashable: Any]) {
        switch type {
        case "appointment_reminder", "appointment_confirmed":
            if let bookingId = userInfo["bookingId"] as? String {
                navigateToBooking(bookingId: bookingId)
            }
            
        case "new_message":
            if let messageId = userInfo["messageId"] as? String {
                navigateToMessage(messageId: messageId)
            }
            
        case "schedule_change":
            navigateToSchedule()
            
        default:
            break
        }
    }
    
    // MARK: - Navigation Helpers
    private func navigateToBooking(bookingId: String) {
        // Post notification to navigate to specific booking
        NotificationCenter.default.post(
            name: .navigateToBooking,
            object: nil,
            userInfo: ["bookingId": bookingId]
        )
    }
    
    private func navigateToMessage(messageId: String) {
        // Post notification to navigate to specific message
        NotificationCenter.default.post(
            name: .navigateToMessage,
            object: nil,
            userInfo: ["messageId": messageId]
        )
    }
    
    private func navigateToSchedule() {
        // Post notification to navigate to schedule tab
        NotificationCenter.default.post(
            name: .navigateToSchedule,
            object: nil
        )
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let navigateToBooking = Notification.Name("navigateToBooking")
    static let navigateToMessage = Notification.Name("navigateToMessage")
    static let navigateToSchedule = Notification.Name("navigateToSchedule")
    static let navigateToMessages = Notification.Name("navigateToMessages")
}

// MARK: - Notification Types
enum NotificationType: String, CaseIterable {
    case appointmentReminder = "appointment_reminder"
    case appointmentConfirmed = "appointment_confirmed"
    case appointmentCancelled = "appointment_cancelled"
    case appointmentRescheduled = "appointment_rescheduled"
    case newMessage = "new_message"
    case messageReply = "message_reply"
    case scheduleChange = "schedule_change"
    case systemAnnouncement = "system_announcement"
    
    var title: String {
        switch self {
        case .appointmentReminder:
            return "Appointment Reminder"
        case .appointmentConfirmed:
            return "Appointment Confirmed"
        case .appointmentCancelled:
            return "Appointment Cancelled"
        case .appointmentRescheduled:
            return "Appointment Rescheduled"
        case .newMessage:
            return "New Message"
        case .messageReply:
            return "Message Reply"
        case .scheduleChange:
            return "Schedule Update"
        case .systemAnnouncement:
            return "Announcement"
        }
    }
}

// MARK: - Notification Preferences
struct NotificationPreferences: Codable {
    var appointmentReminders: Bool = true
    var appointmentConfirmations: Bool = true
    var newMessages: Bool = true
    var messageReplies: Bool = true
    var scheduleChanges: Bool = true
    var systemAnnouncements: Bool = true
    
    // Timing preferences
    var reminderMinutes: Int = 30 // Minutes before appointment
    var quietHoursEnabled: Bool = false
    var quietHoursStart: Date = Calendar.current.date(from: DateComponents(hour: 22, minute: 0)) ?? Date()
    var quietHoursEnd: Date = Calendar.current.date(from: DateComponents(hour: 8, minute: 0)) ?? Date()
    
    static var `default`: NotificationPreferences {
        return NotificationPreferences()
    }
    
    func isQuietTime() -> Bool {
        guard quietHoursEnabled else { return false }
        
        let now = Date()
        let calendar = Calendar.current
        
        let currentTime = calendar.dateComponents([.hour, .minute], from: now)
        let startTime = calendar.dateComponents([.hour, .minute], from: quietHoursStart)
        let endTime = calendar.dateComponents([.hour, .minute], from: quietHoursEnd)
        
        let current = currentTime.hour! * 60 + currentTime.minute!
        let start = startTime.hour! * 60 + startTime.minute!
        let end = endTime.hour! * 60 + endTime.minute!
        
        if start <= end {
            return current >= start && current <= end
        } else {
            return current >= start || current <= end
        }
    }
}