//
//  ContentView.swift
//  RDVApp
//
//  Main content view that handles authentication state
//

import SwiftUI

struct ContentView: View {
    @StateObject private var authViewModel = AuthViewModel()
    @State private var selectedTab: Int = 0
    @State private var navigateToBookingId: String?
    @State private var navigateToMessageId: String?
    
    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                TabBarView(selectedTab: $selectedTab)
                    .environmentObject(authViewModel)
            } else {
                LoginView()
                    .environmentObject(authViewModel)
            }
        }
        .onAppear {
            authViewModel.checkAuthenticationStatus()
            setupNotificationRouting()
        }
    }
    
    private func setupNotificationRouting() {
        // Listen for notification routing requests
        NotificationCenter.default.addObserver(
            forName: .navigateToBooking,
            object: nil,
            queue: .main
        ) { notification in
            if let bookingId = notification.userInfo?["bookingId"] as? String {
                selectedTab = 0 // Schedule tab
                navigateToBookingId = bookingId
            }
        }
        
        NotificationCenter.default.addObserver(
            forName: .navigateToMessage,
            object: nil,
            queue: .main
        ) { notification in
            if let messageId = notification.userInfo?["messageId"] as? String {
                selectedTab = 1 // Messages tab
                navigateToMessageId = messageId
            }
        }
        
        NotificationCenter.default.addObserver(
            forName: .navigateToSchedule,
            object: nil,
            queue: .main
        ) { _ in
            selectedTab = 0 // Schedule tab
        }
        
        NotificationCenter.default.addObserver(
            forName: .navigateToMessages,
            object: nil,
            queue: .main
        ) { _ in
            selectedTab = 1 // Messages tab
        }
    }
}

#Preview {
    ContentView()
}