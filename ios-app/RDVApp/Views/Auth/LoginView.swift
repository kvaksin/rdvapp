//
//  LoginView.swift
//  RDVApp
//
//  User login screen
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showingRegister = false
    @State private var showPassword = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Login Form
                ScrollView {
                    VStack(spacing: 24) {
                        loginForm
                        
                        // Error Message
                        if let errorMessage = authViewModel.errorMessage {
                            errorView(message: errorMessage)
                        }
                        
                        // Login Button
                        loginButton
                        
                        // Register Link
                        registerLink
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 40)
                }
            }
            .background(Color(.systemBackground))
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingRegister) {
            RegisterView()
                .environmentObject(authViewModel)
        }
        .onAppear {
            authViewModel.clearError()
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 16) {
            // Logo/Icon
            Circle()
                .fill(Color.purple.gradient)
                .frame(width: 80, height: 80)
                .overlay {
                    Image(systemName: "calendar.badge.clock")
                        .font(.title)
                        .foregroundColor(.white)
                }
            
            // Title
            VStack(spacing: 8) {
                Text("Welcome to RDV")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Schedule your appointments with ease")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.top, 60)
        .padding(.bottom, 20)
    }
    
    // MARK: - Login Form
    private var loginForm: some View {
        VStack(spacing: 20) {
            // Email Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Email")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                TextField("Enter your email", text: $email)
                    .textFieldStyle(CustomTextFieldStyle())
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
            }
            
            // Password Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Password")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                HStack {
                    if showPassword {
                        TextField("Enter your password", text: $password)
                    } else {
                        SecureField("Enter your password", text: $password)
                    }
                    
                    Button(action: { showPassword.toggle() }) {
                        Image(systemName: showPassword ? "eye.slash" : "eye")
                            .foregroundColor(.secondary)
                    }
                }
                .textFieldStyle(CustomTextFieldStyle())
            }
        }
    }
    
    // MARK: - Error View
    private func errorView(message: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle")
                .foregroundColor(.red)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.red)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
    }
    
    // MARK: - Login Button
    private var loginButton: some View {
        Button(action: performLogin) {
            HStack {
                if authViewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                }
                
                Text(authViewModel.isLoading ? "Signing In..." : "Sign In")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.purple, Color.blue]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(16)
        }
        .disabled(authViewModel.isLoading || !isFormValid)
        .opacity((authViewModel.isLoading || !isFormValid) ? 0.6 : 1.0)
    }
    
    // MARK: - Register Link
    private var registerLink: some View {
        VStack(spacing: 16) {
            Text("Don't have an account?")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button(action: { showingRegister = true }) {
                Text("Create Account")
                    .font(.headline)
                    .foregroundColor(.purple)
            }
        }
        .padding(.top, 20)
    }
    
    // MARK: - Helper Properties
    private var isFormValid: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !password.isEmpty
    }
    
    // MARK: - Actions
    private func performLogin() {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        authViewModel.login(email: trimmedEmail, password: password)
    }
}

// MARK: - Custom Text Field Style
struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(.systemGray4), lineWidth: 1)
            )
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthViewModel())
}