//
//  RegisterView.swift
//  RDVApp
//
//  User registration screen
//

import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss
    
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var name = ""
    @State private var phone = ""
    @State private var showPassword = false
    @State private var showConfirmPassword = false
    
    // Children management
    @State private var children: [ChildRegistration] = []
    @State private var showingAddChild = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Registration Form
                ScrollView {
                    VStack(spacing: 24) {
                        personalInfoSection
                        
                        // Children Section (Optional)
                        childrenSection
                        
                        // Error Message
                        if let errorMessage = authViewModel.errorMessage {
                            errorView(message: errorMessage)
                        }
                        
                        // Register Button
                        registerButton
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 20)
                    .padding(.bottom, 40)
                }
            }
            .background(Color(.systemBackground))
            .navigationTitle("Create Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingAddChild) {
            AddChildView { child in
                children.append(child)
            }
        }
        .onAppear {
            authViewModel.clearError()
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(Color.purple.gradient)
                .frame(width: 60, height: 60)
                .overlay {
                    Image(systemName: "person.badge.plus")
                        .font(.title2)
                        .foregroundColor(.white)
                }
            
            Text("Join RDV today")
                .font(.title2)
                .fontWeight(.semibold)
        }
        .padding(.top, 20)
        .padding(.bottom, 10)
    }
    
    // MARK: - Personal Info Section
    private var personalInfoSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Personal Information")
                .font(.title3)
                .fontWeight(.semibold)
            
            // Name Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Full Name")
                    .font(.headline)
                
                TextField("Enter your full name", text: $name)
                    .textFieldStyle(CustomTextFieldStyle())
                    .autocapitalization(.words)
            }
            
            // Email Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Email")
                    .font(.headline)
                
                TextField("Enter your email", text: $email)
                    .textFieldStyle(CustomTextFieldStyle())
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
            }
            
            // Phone Field (Optional)
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Phone Number")
                        .font(.headline)
                    
                    Text("(Optional)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                TextField("Enter your phone number", text: $phone)
                    .textFieldStyle(CustomTextFieldStyle())
                    .keyboardType(.phonePad)
            }
            
            // Password Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Password")
                    .font(.headline)
                
                HStack {
                    if showPassword {
                        TextField("Create a password", text: $password)
                    } else {
                        SecureField("Create a password", text: $password)
                    }
                    
                    Button(action: { showPassword.toggle() }) {
                        Image(systemName: showPassword ? "eye.slash" : "eye")
                            .foregroundColor(.secondary)
                    }
                }
                .textFieldStyle(CustomTextFieldStyle())
                
                Text("Must be at least 6 characters")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Confirm Password Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Confirm Password")
                    .font(.headline)
                
                HStack {
                    if showConfirmPassword {
                        TextField("Confirm your password", text: $confirmPassword)
                    } else {
                        SecureField("Confirm your password", text: $confirmPassword)
                    }
                    
                    Button(action: { showConfirmPassword.toggle() }) {
                        Image(systemName: showConfirmPassword ? "eye.slash" : "eye")
                            .foregroundColor(.secondary)
                    }
                }
                .textFieldStyle(CustomTextFieldStyle())
            }
        }
    }
    
    // MARK: - Children Section
    private var childrenSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Children")
                    .font(.title3)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button(action: { showingAddChild = true }) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(.purple)
                        .font(.title2)
                }
            }
            
            if children.isEmpty {
                Text("Add your children to schedule appointments for them")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .italic()
            } else {
                ForEach(Array(children.enumerated()), id: \.offset) { index, child in
                    ChildRow(child: child) {
                        children.remove(at: index)
                    }
                }
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
    
    // MARK: - Register Button
    private var registerButton: some View {
        Button(action: performRegistration) {
            HStack {
                if authViewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                }
                
                Text(authViewModel.isLoading ? "Creating Account..." : "Create Account")
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
    
    // MARK: - Helper Properties
    private var isFormValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !password.isEmpty &&
        password.count >= 6 &&
        password == confirmPassword
    }
    
    // MARK: - Actions
    private func performRegistration() {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedPhone = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        
        authViewModel.register(
            email: trimmedEmail,
            password: password,
            confirmPassword: confirmPassword,
            name: trimmedName,
            phone: trimmedPhone.isEmpty ? nil : trimmedPhone,
            children: children
        )
    }
}

// MARK: - Child Row
struct ChildRow: View {
    let child: ChildRegistration
    let onDelete: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(child.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text("Age \(child.age)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: onDelete) {
                Image(systemName: "minus.circle.fill")
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Add Child View
struct AddChildView: View {
    let onAdd: (ChildRegistration) -> Void
    @Environment(\.dismiss) private var dismiss
    
    @State private var childName = ""
    @State private var childAge = 5
    
    var body: some View {
        NavigationView {
            Form {
                Section("Child Information") {
                    TextField("Child's Name", text: $childName)
                        .autocapitalization(.words)
                    
                    Stepper(value: $childAge, in: 1...18) {
                        Text("Age: \(childAge)")
                    }
                }
            }
            .navigationTitle("Add Child")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        let child = ChildRegistration(
                            name: childName.trimmingCharacters(in: .whitespacesAndNewlines),
                            age: childAge
                        )
                        onAdd(child)
                        dismiss()
                    }
                    .disabled(childName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}

#Preview {
    RegisterView()
        .environmentObject(AuthViewModel())
}