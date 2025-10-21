//
//  MessagesView.swift
//  RDVApp
//
//  Messages list view
//

import SwiftUI
import Combine

struct MessagesView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var messagesViewModel = MessagesViewModel()
    @StateObject private var notificationService = NotificationService.shared
    @State private var showingComposer = false
    @State private var selectedMessageType: MessageType?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Filter Tabs
                if canSendMultipleTypes {
                    messageTypeFilter
                }
                
                // Messages List
                if messagesViewModel.isLoading && messagesViewModel.messages.isEmpty {
                    loadingView
                } else if messagesViewModel.messages.isEmpty {
                    emptyStateView
                } else {
                    messagesList
                }
            }
            .navigationTitle("Messages")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingComposer = true }) {
                        Image(systemName: "square.and.pencil")
                    }
                }
            }
        }
        .sheet(isPresented: $showingComposer) {
            ComposeMessageView { success in
                if success {
                    messagesViewModel.loadMessages()
                }
                showingComposer = false
            }
            .environmentObject(authViewModel)
        }
        .refreshable {
            messagesViewModel.loadMessages()
        }
        .onAppear {
            messagesViewModel.loadMessages()
        }
        .onReceive(NotificationCenter.default.publisher(for: .messageReceived)) { notification in
            if let messageId = notification.userInfo?["messageId"] as? String {
                // Reload messages when notification received
                messagesViewModel.loadMessages()
                
                // Mark message as read when viewed
                if let message = messagesViewModel.messages.first(where: { $0.id == messageId }) {
                    markMessageAsRead(message)
                }
            }
        }
    }
    
    // MARK: - Message Type Filter
    private var messageTypeFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                FilterChip(
                    title: "All",
                    isSelected: selectedMessageType == nil,
                    action: { selectedMessageType = nil }
                )
                
                ForEach(availableMessageTypes, id: \.self) { type in
                    FilterChip(
                        title: type.shortDisplayName,
                        isSelected: selectedMessageType == type,
                        action: { selectedMessageType = type }
                    )
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }
    
    // MARK: - Messages List
    private var messagesList: some View {
        List {
            ForEach(filteredMessages.groupedByDate(), id: \.date) { group in
                Section(header: Text(group.formattedDate)) {
                    ForEach(group.messages, id: \.id) { message in
                        NavigationLink(destination: MessageDetailView(message: message).environmentObject(authViewModel)) {
                            MessageRow(message: message)
                        }
                    }
                }
            }
        }
        .listStyle(PlainListStyle())
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Loading messages...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "envelope")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No messages yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("When you receive messages from class leads or send messages, they'll appear here.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: { showingComposer = true }) {
                Text("Send Your First Message")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.purple)
                    .cornerRadius(12)
            }
        }
        .padding()
    }
    
    // MARK: - Helper Properties
    private var canSendMultipleTypes: Bool {
        guard let user = authViewModel.user else { return false }
        return user.isAdmin || user.isClassLead
    }
    
    private var availableMessageTypes: [MessageType] {
        guard let user = authViewModel.user else { return [] }
        
        var types: [MessageType] = []
        
        if user.isAdmin {
            types.append(.adminToClass)
        }
        
        if user.isClassLead {
            types.append(.classLeadToParents)
        }
        
        if user.isParent {
            types.append(.parentToClassLead)
        }
        
        return types
    }
    
    private var filteredMessages: [Message] {
        messagesViewModel.messages.filtered(by: selectedMessageType)
    }
    
    // MARK: - Helper Methods
    private func markMessageAsRead(_ message: Message) {
        // Cancel any pending notifications for this message
        notificationService.cancelMessageNotifications(for: message.id)
        
        // Update message read status via API
        // This would typically be handled by the MessagesViewModel
        messagesViewModel.markMessageAsRead(message)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : .purple)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.purple : Color.purple.opacity(0.1))
                .cornerRadius(20)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Message Row
struct MessageRow: View {
    let message: Message
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Text(message.senderName)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                HStack(spacing: 4) {
                    Image(systemName: message.type.iconName)
                        .font(.caption)
                        .foregroundColor(.purple)
                    
                    Text(message.createdAt.formatted(date: .omitted, time: .shortened))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Subject and Preview
            if let subject = message.subject, !subject.isEmpty {
                Text(subject)
                    .font(.headline)
                    .lineLimit(1)
            }
            
            Text(message.message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            // Footer
            HStack {
                // Message Type Badge
                Text(message.type.shortDisplayName)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.purple)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.purple.opacity(0.1))
                    .cornerRadius(8)
                
                Spacer()
                
                // Indicators
                HStack(spacing: 8) {
                    if message.hasAttachments {
                        Image(systemName: "paperclip")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    if message.hasReplies {
                        HStack(spacing: 2) {
                            Image(systemName: "arrowshape.turn.up.left")
                                .font(.caption)
                            Text("\(message.replies.count)")
                                .font(.caption)
                        }
                        .foregroundColor(.secondary)
                    }
                    
                    if message.isUnread {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 8, height: 8)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Messages View Model
class MessagesViewModel: ObservableObject {
    @Published var messages: [Message] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    private let apiService = APIService.shared
    private let notificationService = NotificationService.shared
    
    func loadMessages() {
        isLoading = true
        errorMessage = nil
        
        apiService.getMessages()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.messages = response.messages
                }
            )
            .store(in: &cancellables)
    }
    
    func markMessageAsRead(_ message: Message) {
        // Update local state
        if let index = messages.firstIndex(where: { $0.id == message.id }) {
            messages[index].isUnread = false
        }
        
        // Update on server
        apiService.markMessageAsRead(messageId: message.id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Failed to mark message as read: \(error)")
                    }
                },
                receiveValue: { _ in
                    // Success - local state already updated
                }
            )
            .store(in: &cancellables)
    }
    
    func scheduleMessageNotification(for message: Message) {
        // Schedule notification for new message
        notificationService.scheduleMessageNotification(
            messageId: message.id,
            title: "New Message from \(message.senderName)",
            body: message.subject?.isEmpty == false ? message.subject! : String(message.message.prefix(100)),
            userInfo: ["messageId": message.id, "type": "message"]
        )
    }
}

// MARK: - Notification Extensions
extension Notification.Name {
    static let messageReceived = Notification.Name("messageReceived")
}

#Preview {
    MessagesView()
        .environmentObject(AuthViewModel())
}