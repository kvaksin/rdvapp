//
//  AuthViewModel.swift
//  RDVApp
//
//  Authentication view model
//

import Foundation
import Combine

class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    private let apiService = APIService.shared
    
    init() {
        // Check if user is already authenticated
        checkAuthenticationStatus()
        
        // Listen to API service auth token changes
        apiService.$authToken
            .sink { [weak self] token in
                self?.isAuthenticated = token != nil
                if token == nil {
                    self?.user = nil
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Authentication Check
    func checkAuthenticationStatus() {
        guard apiService.authToken != nil else {
            isAuthenticated = false
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        apiService.getCurrentUser()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                        self?.logout() // Clear invalid token
                    }
                },
                receiveValue: { [weak self] user in
                    self?.user = user
                    self?.isAuthenticated = true
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Login
    func login(email: String, password: String) {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please enter both email and password"
            return
        }
        
        guard isValidEmail(email) else {
            errorMessage = "Please enter a valid email address"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        apiService.login(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = self?.formatErrorMessage(error) ?? error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.user = response.user
                    self?.isAuthenticated = true
                    self?.errorMessage = nil
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Register
    func register(
        email: String,
        password: String,
        confirmPassword: String,
        name: String,
        phone: String?,
        children: [ChildRegistration] = []
    ) {
        // Validation
        guard !email.isEmpty, !password.isEmpty, !name.isEmpty else {
            errorMessage = "Please fill in all required fields"
            return
        }
        
        guard isValidEmail(email) else {
            errorMessage = "Please enter a valid email address"
            return
        }
        
        guard password.count >= 6 else {
            errorMessage = "Password must be at least 6 characters long"
            return
        }
        
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        let request = RegisterRequest(
            email: email,
            password: password,
            name: name,
            phone: phone?.isEmpty == true ? nil : phone,
            children: children.isEmpty ? nil : children
        )
        
        apiService.register(request: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = self?.formatErrorMessage(error) ?? error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.user = response.user
                    self?.isAuthenticated = true
                    self?.errorMessage = nil
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Logout
    func logout() {
        apiService.logout()
        user = nil
        isAuthenticated = false
        errorMessage = nil
    }
    
    // MARK: - Profile Update
    func updateProfile(name: String, phone: String?) {
        guard !name.isEmpty else {
            errorMessage = "Name cannot be empty"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        let request = UpdateProfileRequest(
            name: name,
            phone: phone?.isEmpty == true ? nil : phone
        )
        
        apiService.updateProfile(request: request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] updatedUser in
                    self?.user = updatedUser
                    self?.errorMessage = nil
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Helper Methods
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    private func formatErrorMessage(_ error: Error) -> String? {
        if let apiError = error as? APIError {
            switch apiError {
            case .unauthorized:
                return "Invalid email or password"
            case .serverError(let code, let message):
                if code == 409 {
                    return "An account with this email already exists"
                }
                return message ?? "Server error occurred"
            case .networkError(_):
                return "Please check your internet connection"
            default:
                return apiError.localizedDescription
            }
        }
        return nil
    }
    
    // MARK: - Clear Error
    func clearError() {
        errorMessage = nil
    }
}