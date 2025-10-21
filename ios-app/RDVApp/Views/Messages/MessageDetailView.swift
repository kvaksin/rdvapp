//
//  MessageDetailView.swift
//  RDVApp
//
//  Message detail view
//

import SwiftUI

struct MessageDetailView: View {
    let message: Message
    
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var replyText = ""
    @State private var isReplying = false
    @State private var showingReplyComposer = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Message Header
                messageHeader
                
                // Message Content
                messageContent
                
                // Attachments (if any)
                if !message.attachments.isEmpty {
                    attachmentsSection
                }
                
                // Replies
                if !message.replies.isEmpty {
                    repliesSection
                }
                
                Spacer(minLength: 20)
            }
            .padding()
        }
        .navigationTitle("Message")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if canReply {
                    Button(action: { showingReplyComposer = true }) {
                        Image(systemName: "arrowshape.turn.up.left")
                    }
                }
            }
        }
        .sheet(isPresented: $showingReplyComposer) {
            replyComposerSheet
        }
    }
    
    // MARK: - Message Header
    private var messageHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            // From/To info
            HStack {
                VStack(alignment: .leading) {
                    Text("From: \(message.senderName)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    if let recipientInfo = recipientDescription {
                        Text("To: \(recipientInfo)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Text(message.createdAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Subject (if present)
            if let subject = message.subject, !subject.isEmpty {
                Text(subject)
                    .font(.title2)
                    .fontWeight(.semibold)
            }
            
            Divider()
        }
    }
    
    // MARK: - Message Content
    private var messageContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(message.message)
                .font(.body)
                .lineSpacing(4)
            
            // Message type indicator
            HStack {
                Image(systemName: message.type.iconName)
                    .foregroundColor(.purple)
                Text(message.type.displayName)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
            }
        }
    }
    
    // MARK: - Attachments Section
    private var attachmentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Attachments")
                .font(.headline)
            
            ForEach(message.attachments, id: \.id) { attachment in
                AttachmentRow(attachment: attachment)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Replies Section
    private var repliesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Replies (\(message.replies.count))")
                .font(.headline)
            
            ForEach(message.replies.sorted(by: { $0.createdAt < $1.createdAt }), id: \.id) { reply in
                ReplyRow(reply: reply)
            }
        }
    }
    
    // MARK: - Reply Composer Sheet
    private var replyComposerSheet: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Reply info
                VStack(alignment: .leading, spacing: 8) {
                    Text("Replying to:")
                        .font(.headline)
                    
                    Text(message.subject?.isEmpty == false ? message.subject! : "Message")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                // Reply text
                VStack(alignment: .leading, spacing: 8) {
                    Text("Your Reply")
                        .font(.headline)
                    
                    TextEditor(text: $replyText)
                        .frame(minHeight: 120)
                        .padding(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                }
                
                Spacer()
                
                // Send button
                Button(action: sendReply) {
                    HStack {
                        if isReplying {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        }
                        
                        Text(isReplying ? "Sending..." : "Send Reply")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.purple)
                    .cornerRadius(12)
                }
                .disabled(isReplying || replyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .opacity((isReplying || replyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) ? 0.6 : 1.0)
            }
            .padding()
            .navigationTitle("Reply")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        showingReplyComposer = false
                        replyText = ""
                    }
                }
            }
        }
    }
    
    // MARK: - Helper Properties
    private var canReply: Bool {
        guard let user = authViewModel.user else { return false }
        
        switch message.type {
        case .classLeadToParents:
            return user.isParent
        case .parentToClassLead:
            return user.isClassLead || user.isAdmin
        case .adminToClass:
            return user.isClassLead
        }
    }
    
    private var recipientDescription: String? {
        switch message.type {
        case .classLeadToParents:
            return "Parents"
        case .parentToClassLead:
            return "Class Lead"
        case .adminToClass:
            return "Class"
        }
    }
    
    // MARK: - Send Reply
    private func sendReply() {
        let trimmedReply = replyText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedReply.isEmpty else { return }
        
        isReplying = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isReplying = false
            showingReplyComposer = false
            replyText = ""
        }
    }
}

// MARK: - Attachment Row
struct AttachmentRow: View {
    let attachment: MessageAttachment
    
    var body: some View {
        HStack {
            Image(systemName: attachment.iconName)
                .foregroundColor(.purple)
                .frame(width: 20)
            
            VStack(alignment: .leading) {
                Text(attachment.filename)
                    .font(.subheadline)
                
                Text(attachment.formattedSize)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: downloadAttachment) {
                Image(systemName: "arrow.down.circle")
                    .foregroundColor(.purple)
            }
        }
        .padding(.vertical, 4)
    }
    
    private func downloadAttachment() {
        // TODO: Implement attachment download
        print("Download attachment: \(attachment.filename)")
    }
}

// MARK: - Reply Row
struct ReplyRow: View {
    let reply: MessageReply
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(reply.senderName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Spacer()
                
                Text(reply.createdAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text(reply.reply)
                .font(.body)
                .lineSpacing(2)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

#Preview {
    let sampleMessage = Message(
        id: "1",
        type: .classLeadToParents,
        subject: "Class Update",
        message: "Please remember that class is canceled this Friday due to the holiday.",
        senderName: "John Smith",
        senderId: "teacher1",
        createdAt: Date(),
        attachments: [],
        replies: []
    )
    
    return NavigationView {
        MessageDetailView(message: sampleMessage)
            .environmentObject(AuthViewModel())
    }
}