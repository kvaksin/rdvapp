//
//  NotificationSettingsView.swift
//  RDVApp
//
//  Notification settings and preferences view
//

import SwiftUI

struct NotificationSettingsView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var notificationService = NotificationService.shared
    @Environment(\.dismiss) private var dismiss
    
    @State private var preferences = NotificationPreferences.default
    @State private var isLoading = false
    @State private var showingPermissionAlert = false
    
    var body: some View {
        NavigationView {
            Form {
                // Permission Status Section
                Section("Notification Permission") {
                    HStack {
                        Image(systemName: notificationService.isAuthorized ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(notificationService.isAuthorized ? .green : .red)
                        
                        VStack(alignment: .leading) {
                            Text(notificationService.isAuthorized ? "Notifications Enabled" : "Notifications Disabled")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            Text(notificationService.isAuthorized ? "You'll receive notifications for important updates" : "Enable notifications to stay updated")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        if !notificationService.isAuthorized {
                            Button("Enable") {
                                showingPermissionAlert = true
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.small)
                        }
                    }
                }
                
                // Notification Types Section
                if notificationService.isAuthorized {
                    Section("Notification Types") {
                        Toggle("Appointment Reminders", isOn: $preferences.appointmentReminders)
                        Toggle("Appointment Confirmations", isOn: $preferences.appointmentConfirmations)
                        Toggle("New Messages", isOn: $preferences.newMessages)
                        Toggle("Message Replies", isOn: $preferences.messageReplies)
                        Toggle("Schedule Changes", isOn: $preferences.scheduleChanges)
                        Toggle("System Announcements", isOn: $preferences.systemAnnouncements)
                    }
                    
                    // Timing Section
                    Section("Reminder Timing") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Appointment Reminder")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            Picker("Minutes before appointment", selection: $preferences.reminderMinutes) {
                                Text("5 minutes").tag(5)
                                Text("15 minutes").tag(15)
                                Text("30 minutes").tag(30)
                                Text("1 hour").tag(60)
                                Text("2 hours").tag(120)
                            }
                            .pickerStyle(SegmentedPickerStyle())
                        }
                    }
                    
                    // Quiet Hours Section
                    Section("Quiet Hours") {
                        Toggle("Enable Quiet Hours", isOn: $preferences.quietHoursEnabled)
                        
                        if preferences.quietHoursEnabled {
                            DatePicker("Start Time", selection: $preferences.quietHoursStart, displayedComponents: .hourAndMinute)
                            DatePicker("End Time", selection: $preferences.quietHoursEnd, displayedComponents: .hourAndMinute)
                            
                            Text("During quiet hours, only urgent notifications will be delivered")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // Test Notification Section
                    Section("Test Notifications") {
                        Button(action: sendTestNotification) {
                            HStack {
                                Image(systemName: "bell.badge")
                                    .foregroundColor(.purple)
                                Text("Send Test Notification")
                                    .foregroundColor(.primary)
                            }
                        }
                        
                        Text("Send a test notification to verify your settings")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Notification History Section
                Section("Notification History") {
                    Button(action: clearNotificationHistory) {
                        HStack {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                            Text("Clear Notification History")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        savePreferences()
                    }
                    .disabled(isLoading)
                }
            }
            .alert("Enable Notifications", isPresented: $showingPermissionAlert) {
                Button("Settings") {
                    openAppSettings()
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("To receive notifications, please enable them in Settings > Notifications > RDV App")
            }
            .onAppear {
                loadPreferences()
            }
        }
    }
    
    // MARK: - Actions
    private func loadPreferences() {
        // Load preferences from API or UserDefaults
        APIService.shared.getNotificationPreferences()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(_) = completion {
                        // Use default preferences if API fails
                        preferences = NotificationPreferences.default
                    }
                },
                receiveValue: { apiPreferences in
                    preferences = apiPreferences
                }
            )
            .store(in: &Set<AnyCancellable>())
    }
    
    private func savePreferences() {
        isLoading = true
        
        APIService.shared.updateNotificationPreferences(preferences)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    if case .failure(let error) = completion {
                        print("Failed to save preferences: \(error.localizedDescription)")
                    } else {
                        dismiss()
                    }
                },
                receiveValue: { _ in
                    print("Notification preferences saved")
                }
            )
            .store(in: &Set<AnyCancellable>())
    }
    
    private func sendTestNotification() {
        let content = UNMutableNotificationContent()
        content.title = "Test Notification"
        content.body = "This is a test notification from RDV App. Your notifications are working correctly!"
        content.sound = .default
        content.badge = 1
        
        let request = UNNotificationRequest(
            identifier: "test_notification",
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to send test notification: \(error.localizedDescription)")
            }
        }
    }
    
    private func clearNotificationHistory() {
        notificationService.clearAllNotifications()
    }
    
    private func openAppSettings() {
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsUrl)
        }
    }
}

// MARK: - Permission Status View
struct NotificationPermissionView: View {
    let isAuthorized: Bool
    let onRequestPermission: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: isAuthorized ? "checkmark.circle.fill" : "bell.slash")
                .font(.system(size: 60))
                .foregroundColor(isAuthorized ? .green : .orange)
            
            Text(isAuthorized ? "Notifications Enabled" : "Notifications Disabled")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text(isAuthorized ? 
                 "You'll receive important updates about your appointments and messages." :
                 "Enable notifications to stay updated about your appointments and receive important messages.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            if !isAuthorized {
                Button(action: onRequestPermission) {
                    Text("Enable Notifications")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.purple)
                        .cornerRadius(12)
                }
            }
        }
        .padding()
    }
}

#Preview {
    NotificationSettingsView()
        .environmentObject(AuthViewModel())
}