//
//  ContentView.swift
//  RDVApp
//
//  Main content view that handles authentication state
//

import SwiftUI

struct ContentView: View {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                TabBarView()
                    .environmentObject(authViewModel)
            } else {
                LoginView()
                    .environmentObject(authViewModel)
            }
        }
        .onAppear {
            authViewModel.checkAuthenticationStatus()
        }
    }
}

#Preview {
    ContentView()
}