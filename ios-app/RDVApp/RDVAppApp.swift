//
//  RDVAppApp.swift
//  RDVApp
//
//  Main app entry point
//

import SwiftUI

@main
struct RDVAppApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                    // Clear badge when app becomes active
                    NotificationService.shared.clearBadge()
                }
        }
    }
}

// MARK: - App Delegate
class AppDelegate: NSObject, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Setup notification service
        _ = NotificationService.shared
        
        return true
    }
    
    // MARK: - Push Notification Registration
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        NotificationService.shared.setDeviceToken(deviceToken)
    }
    
    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Failed to register for remote notifications: \(error.localizedDescription)")
    }
}