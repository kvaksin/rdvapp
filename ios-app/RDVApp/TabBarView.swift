//
//  TabBarView.swift
//  RDVApp
//
//  Main tab bar navigation
//

import SwiftUI

struct TabBarView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Binding var selectedTab: Int
    
    enum Tab: Int, CaseIterable {
        case schedule = 0
        case messages = 1
        case profile = 2
        
        var title: String {
            switch self {
            case .schedule: return "Schedule"
            case .messages: return "Messages"
            case .profile: return "Profile"
            }
        }
        
        var iconName: String {
            switch self {
            case .schedule: return "calendar"
            case .messages: return "envelope"
            case .profile: return "person"
            }
        }
        
        var selectedIconName: String {
            switch self {
            case .schedule: return "calendar.circle.fill"
            case .messages: return "envelope.fill"
            case .profile: return "person.fill"
            }
        }
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ScheduleView()
                .tabItem {
                    Image(systemName: selectedTab == Tab.schedule.rawValue ? Tab.schedule.selectedIconName : Tab.schedule.iconName)
                    Text(Tab.schedule.title)
                }
                .tag(Tab.schedule.rawValue)
                .environmentObject(authViewModel)
            
            MessagesView()
                .tabItem {
                    Image(systemName: selectedTab == Tab.messages.rawValue ? Tab.messages.selectedIconName : Tab.messages.iconName)
                    Text(Tab.messages.title)
                }
                .tag(Tab.messages.rawValue)
                .environmentObject(authViewModel)
            
            ProfileView()
                .tabItem {
                    Image(systemName: selectedTab == Tab.profile.rawValue ? Tab.profile.selectedIconName : Tab.profile.iconName)
                    Text(Tab.profile.title)
                }
                .tag(Tab.profile.rawValue)
                .environmentObject(authViewModel)
        }
        .accentColor(.purple)
    }
}
}

#Preview {
    TabBarView()
        .environmentObject(AuthViewModel())
}