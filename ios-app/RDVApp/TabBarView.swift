//
//  TabBarView.swift
//  RDVApp
//
//  Main tab bar navigation
//

import SwiftUI

struct TabBarView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedTab: Tab = .schedule
    
    enum Tab: String, CaseIterable {
        case schedule = "Schedule"
        case messages = "Messages"
        case profile = "Profile"
        
        var iconName: String {
            switch self {
            case .schedule:
                return "calendar"
            case .messages:
                return "envelope"
            case .profile:
                return "person"
            }
        }
        
        var selectedIconName: String {
            switch self {
            case .schedule:
                return "calendar.circle.fill"
            case .messages:
                return "envelope.fill"
            case .profile:
                return "person.fill"
            }
        }
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ScheduleView()
                .tabItem {
                    Image(systemName: selectedTab == .schedule ? Tab.schedule.selectedIconName : Tab.schedule.iconName)
                    Text(Tab.schedule.rawValue)
                }
                .tag(Tab.schedule)
                .environmentObject(authViewModel)
            
            MessagesView()
                .tabItem {
                    Image(systemName: selectedTab == .messages ? Tab.messages.selectedIconName : Tab.messages.iconName)
                    Text(Tab.messages.rawValue)
                }
                .tag(Tab.messages)
                .environmentObject(authViewModel)
            
            ProfileView()
                .tabItem {
                    Image(systemName: selectedTab == .profile ? Tab.profile.selectedIconName : Tab.profile.iconName)
                    Text(Tab.profile.rawValue)
                }
                .tag(Tab.profile)
                .environmentObject(authViewModel)
        }
        .accentColor(.purple)
    }
}

#Preview {
    TabBarView()
        .environmentObject(AuthViewModel())
}