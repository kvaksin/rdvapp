//
//  ComposeMessageView.swift
//  RDVApp
//
//  Message composer view
//

import SwiftUI

struct ComposeMessageView: View {
    let onComplete: (Bool) -> Void
    
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var messageType: MessageType = .parentToClassLead
    @State private var subject = ""
    @State private var messageBody = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Message Type Picker (if user has multiple roles)
                if canSendMultipleTypes {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Message Type")
                            .font(.headline)
                        
                        Picker("Message Type", selection: $messageType) {
                            ForEach(availableMessageTypes, id: \.self) { type in
                                Text(type.displayName).tag(type)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                }
                
                // Subject Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Subject (Optional)")
                        .font(.headline)
                    
                    TextField("Enter subject", text: $subject)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                // Message Body
                VStack(alignment: .leading, spacing: 8) {
                    Text("Message")
                        .font(.headline)
                    
                    TextEditor(text: $messageBody)
                        .frame(minHeight: 120)
                        .padding(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                }
                
                // Error Message
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                }
                
                Spacer()
                
                // Send Button
                Button(action: sendMessage) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        }
                        
                        Text(isLoading ? "Sending..." : "Send Message")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.purple)
                    .cornerRadius(12)
                }
                .disabled(isLoading || messageBody.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .opacity((isLoading || messageBody.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) ? 0.6 : 1.0)
            }
            .padding()
            .navigationTitle("New Message")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        onComplete(false)
                    }
                }
            }
        }
    }
    
    // MARK: - Helper Properties
    private var canSendMultipleTypes: Bool {
        guard let user = authViewModel.user else { return false }
        return user.isAdmin || user.isClassLead
    }
    
    private var availableMessageTypes: [MessageType] {
        guard let user = authViewModel.user else { return [.parentToClassLead] }
        
        var types: [MessageType] = []
        
        if user.isAdmin {
            types.append(.adminToClass)
            types.append(.classLeadToParents)
        }
        
        if user.isClassLead {
            types.append(.classLeadToParents)
        }
        
        if user.isParent {
            types.append(.parentToClassLead)
        }
        
        return types
    }
    
    // MARK: - Send Message
    private func sendMessage() {
        let trimmedMessage = messageBody.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedMessage.isEmpty else {
            errorMessage = "Please enter a message"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isLoading = false
            onComplete(true)
        }
    }
}

#Preview {
    ComposeMessageView { _ in }
        .environmentObject(AuthViewModel())
}