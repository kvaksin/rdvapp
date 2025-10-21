//
//  ProfileView.swift
//  RDVApp
//
//  User profile and settings view
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var notificationService = NotificationService.shared
    @State private var showingLogoutAlert = false
    @State private var showingEditProfile = false
    @State private var showingNotificationSettings = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if let user = authViewModel.user {
                    // Profile Header
                    profileHeader(for: user)
                    
                    // Profile Sections
                    List {
                        // User Information Section
                        Section("Profile Information") {
                            profileInfoRow(title: "Name", value: user.name)
                            profileInfoRow(title: "Email", value: user.email)
                            profileInfoRow(title: "Phone", value: user.phone ?? "Not provided")
                            profileInfoRow(title: "Role", value: userRoleDescription(for: user))
                        }
                        
                        // Children Section (for parents)
                        if user.isParent && !user.children.isEmpty {
                            Section("Children") {
                                ForEach(user.children, id: \.id) { child in
                                    HStack {
                                        VStack(alignment: .leading) {
                                            Text(child.name)
                                                .font(.subheadline)
                                            if let className = child.className {
                                                Text("Class: \(className)")
                                                    .font(.caption)
                                                    .foregroundColor(.secondary)
                                            }
                                        }
                                        Spacer()
                                        Text("Age \(child.age)")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                        }
                        
                        // Settings Section
                        Section("Settings") {
                            Button(action: { showingEditProfile = true }) {
                                Label("Edit Profile", systemImage: "person.crop.circle")
                                    .foregroundColor(.primary)
                            }
                            
                            Button(action: { showingNotificationSettings = true }) {
                                HStack {
                                    Label("Notifications", systemImage: "bell")
                                        .foregroundColor(.primary)
                                    
                                    Spacer()
                                    
                                    // Show notification status
                                    if notificationService.isAuthorized {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                    } else {
                                        Image(systemName: "exclamationmark.triangle.fill")
                                            .foregroundColor(.orange)
                                    }
                                }
                            }
                        }
                        
                        // Support Section
                        Section("Support") {
                            Link(destination: URL(string: "mailto:support@rdvapp.com")!) {
                                Label("Contact Support", systemImage: "envelope")
                            }
                        }
                        
                        // Logout Section
                        Section {
                            Button(action: { showingLogoutAlert = true }) {
                                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                                    .foregroundColor(.red)
                            }
                        }
                    }
                    .listStyle(InsetGroupedListStyle())
                } else {
                    // Loading state
                    VStack {
                        ProgressView()
                        Text("Loading profile...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.top)
                    }
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
        }
        .alert("Sign Out", isPresented: $showingLogoutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Sign Out", role: .destructive) {
                authViewModel.logout()
            }
        } message: {
            Text("Are you sure you want to sign out?")
        }
        .sheet(isPresented: $showingEditProfile) {
            EditProfileView()
                .environmentObject(authViewModel)
        }
        .sheet(isPresented: $showingNotificationSettings) {
            NotificationSettingsView()
                .environmentObject(authViewModel)
        }
    }
    
    // MARK: - Profile Header
    private func profileHeader(for user: User) -> some View {
        VStack(spacing: 16) {
            // Profile Picture (placeholder)
            Circle()
                .fill(Color.purple.gradient)
                .frame(width: 80, height: 80)
                .overlay {
                    Text(user.name.prefix(1).uppercased())
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
            
            // User Name and Role
            VStack(spacing: 4) {
                Text(user.name)
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Text(userRoleDescription(for: user))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 20)
        .frame(maxWidth: .infinity)
        .background(Color(.systemGray6))
    }
    
    // MARK: - Profile Info Row
    private func profileInfoRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .multilineTextAlignment(.trailing)
        }
    }
    
    // MARK: - Helper Functions
    private func userRoleDescription(for user: User) -> String {
        var roles: [String] = []
        
        if user.isAdmin { roles.append("Administrator") }
        if user.isClassLead { roles.append("Class Lead") }
        if user.isParent { roles.append("Parent") }
        
        return roles.isEmpty ? "User" : roles.joined(separator: ", ")
    }
}

// MARK: - Edit Profile View
struct EditProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss
    
    @State private var name = ""
    @State private var phone = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                Section("Personal Information") {
                    TextField("Full Name", text: $name)
                    TextField("Phone Number", text: $phone)
                        .keyboardType(.phonePad)
                }
                
                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveProfile()
                    }
                    .disabled(isLoading || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .onAppear {
            loadCurrentData()
        }
    }
    
    private func loadCurrentData() {
        if let user = authViewModel.user {
            name = user.name
            phone = user.phone ?? ""
        }
    }
    
    private func saveProfile() {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else {
            errorMessage = "Name is required"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        authViewModel.updateProfile(
            name: trimmedName,
            phone: phone.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        
        // Simulate API call completion
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isLoading = false
            dismiss()
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthViewModel())
}