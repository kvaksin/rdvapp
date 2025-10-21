# RDV iOS App - Native Swift/SwiftUI Application

A complete native iOS application for the RDV (Rendez-vous) booking system, built with Swift and SwiftUI. This app provides full functionality for appointment scheduling, messaging, and user management.

## 🚀 Features

### 🔐 Authentication System
- **Secure Login & Registration**: Token-based authentication with persistent sessions
- **Role-Based Access**: Support for Parents, Class Leads, and Administrators
- **Multi-Child Registration**: Parents can register multiple children during signup
- **Profile Management**: Users can update their personal information

### 📅 Schedule Management
- **Interactive Calendar**: Week-view calendar with date selection
- **Appointment Booking**: Book, reschedule, and cancel appointments
- **Real-Time Availability**: Live updates of available time slots
- **Booking History**: View past and upcoming appointments
- **Child Selection**: Parents can book appointments for specific children

### 💬 Communication System
- **Role-Based Messaging**: Different message types (Parent↔Class Lead, Admin→Class)
- **Message Threads**: Reply to messages with threaded conversations
- **File Attachments**: Support for uploading and downloading files (up to 5MB)
- **Real-Time Updates**: Live message synchronization

### 👤 Profile & Settings
- **User Profiles**: View and edit personal information
- **Children Management**: Parents can view and manage their children's information
- **Class Management**: Class leads can view managed classes
- **Settings & Preferences**: Comprehensive notification and privacy settings
- **Notification Center**: Test notifications and manage preferences

## 🏗️ Architecture

### Project Structure
```
ios-app/RDVApp/
├── Models/                    # Data models
│   ├── User.swift            # User, Child, and authentication models
│   ├── Class.swift           # Slot, Booking, and scheduling models
│   └── Message.swift         # Message, Attachment, and reply models
├── Services/                  # API and business logic
│   ├── APIService.swift      # Complete backend integration
│   └── NotificationService.swift # Push notification management
├── ViewModels/               # State management
│   ├── AuthViewModel.swift   # Authentication state
│   └── ScheduleViewModel.swift # Schedule management
├── Views/                    # SwiftUI views
│   ├── Auth/                 # Login and registration
│   │   ├── LoginView.swift
│   │   └── RegisterView.swift
│   ├── Schedule/             # Appointment management
│   │   ├── ScheduleView.swift
│   │   ├── BookingView.swift
│   │   └── SlotCard.swift
│   ├── Messages/             # Communication features
│   │   ├── MessagesView.swift
│   │   ├── MessageDetailView.swift
│   │   └── ComposeMessageView.swift
│   └── Profile/              # User management
│       ├── ProfileView.swift
│       └── NotificationSettingsView.swift
├── ContentView.swift         # Main app coordinator
├── TabBarView.swift          # Navigation controller
└── RDVAppApp.swift          # App entry point
```

### Key Design Patterns

#### MVVM Architecture
- **Models**: Pure data structures with Codable conformance
- **Views**: SwiftUI views with declarative UI
- **ViewModels**: ObservableObject classes managing state and business logic

#### Reactive Programming
- **Combine Framework**: Used for API calls and data flow
- **@Published Properties**: Automatic UI updates on state changes
- **Cancellables**: Proper memory management for async operations

#### API Integration
- **Centralized Service**: Single APIService class for all backend communication
- **Error Handling**: Comprehensive error types and user-friendly messages
- **Token Management**: Automatic token storage and refresh

## 📱 User Interface

### Design System
- **Color Scheme**: Purple primary color with semantic colors
- **Typography**: System fonts with clear hierarchy
- **Icons**: SF Symbols for consistent iconography
- **Layout**: Responsive design supporting all iPhone sizes

### Navigation Flow
1. **Authentication Flow**: Login → Registration (if needed) → Main App
2. **Main Navigation**: Tab-based navigation with 3 primary sections
3. **Modal Presentations**: Booking details, message composition, profile editing

### Accessibility
- **VoiceOver Support**: All UI elements are accessible
- **Dynamic Type**: Supports system font size preferences
- **High Contrast**: Respects system accessibility settings

## 🛠️ Development Setup

### Prerequisites
- **Xcode 14.0+**: Latest Xcode with iOS 15.0+ deployment target
- **Swift 5.7+**: Modern Swift language features
- **iOS Device/Simulator**: iPhone running iOS 15.0 or later

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/rdvapp.git
   cd rdvapp/ios-app
   ```

2. **Open in Xcode**
   ```bash
   open RDVApp.xcodeproj
   ```
   *Note: You'll need to create the Xcode project file - see "Creating Xcode Project" below*

3. **Configure Backend Endpoint**
   
   Edit `Services/APIService.swift`:
   ```swift
   private init() {
       #if DEBUG
       self.baseURL = "http://localhost:4000/api"  // Development
       #else
       self.baseURL = "https://your-production-api.com/api"  // Production
       #endif
   }
   ```

4. **Build and Run**
   - Select your target device or simulator
   - Press `⌘+R` to build and run

### Creating Xcode Project

Since the Swift files are ready, you need to create an Xcode project:

1. **Create New Project**
   - Open Xcode → File → New → Project
   - Choose "iOS" → "App"
   - Product Name: "RDVApp"
   - Interface: SwiftUI
   - Language: Swift

2. **Replace Default Files**
   - Delete the generated ContentView.swift and RDVAppApp.swift
   - Add all the Swift files from the ios-app/RDVApp directory
   - Organize files into groups matching the folder structure

3. **Configure Project Settings**
   - Bundle Identifier: `com.yourcompany.rdvapp`
   - Deployment Target: iOS 15.0
   - Supported Orientations: Portrait only

## 🔧 Configuration

### Environment Variables
Configure different environments in `APIService.swift`:

```swift
private let baseURL: String

private init() {
    #if DEBUG
    self.baseURL = "http://localhost:4000/api"
    #elseif STAGING
    self.baseURL = "https://staging-api.rdvapp.com/api"
    #else
    self.baseURL = "https://api.rdvapp.com/api"
    #endif
}
```

### Backend Integration
The app integrates with the existing Express.js backend using these endpoints:

#### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration  
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update user profile

#### Scheduling
- `GET /slots` - Get available time slots
- `POST /slots/timeframe` - Create time slots (admin/class lead)
- `GET /bookings` - Get user bookings
- `POST /bookings` - Create new booking
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Cancel booking

#### Messaging
- `GET /messages` - Get user messages
- `POST /messages` - Send new message
- `POST /messages/:id/reply` - Reply to message
- `POST /uploads` - Upload file attachments

### Security Configuration

#### API Security
- **Token Storage**: Currently uses UserDefaults (development)
- **HTTPS**: All API calls use secure connections
- **Input Validation**: Client-side validation for all forms

#### Production Security Recommendations
```swift
// Use Keychain for secure token storage
import Security

class KeychainService {
    static func save(token: String) {
        // Implement keychain storage
    }
    
    static func retrieve() -> String? {
        // Implement keychain retrieval
    }
}
```

## 📦 Deployment

### App Store Deployment

1. **Code Signing**
   - Configure your Apple Developer account
   - Set up provisioning profiles
   - Configure signing certificates

2. **Build Configuration**
   ```bash
   # Archive for distribution
   xcodebuild -scheme RDVApp archive -archivePath RDVApp.xcarchive
   
   # Export for App Store
   xcodebuild -exportArchive -archivePath RDVApp.xcarchive -exportPath ./
   ```

3. **App Store Connect**
   - Upload IPA using Xcode or Transporter
   - Configure app metadata
   - Submit for review

### TestFlight Distribution

1. **Upload Build**
   ```bash
   # Using Xcode
   Product → Archive → Upload to App Store Connect
   ```

2. **Configure TestFlight**
   - Add external testers
   - Set up testing notes
   - Enable automatic distribution

### Enterprise Distribution

For internal enterprise apps:

```swift
// Configure enterprise distribution
let config = AppConfiguration()
config.distributionType = .enterprise
config.baseURL = "https://internal-api.company.com/api"
```

## 🧪 Testing

### Unit Testing
```swift
// Example test for AuthViewModel
import XCTest
@testable import RDVApp

class AuthViewModelTests: XCTestCase {
    func testLoginValidation() {
        let viewModel = AuthViewModel()
        // Test login validation logic
    }
}
```

### UI Testing
```swift
// Example UI test
import XCTest

class RDVAppUITests: XCTestCase {
    func testLoginFlow() {
        let app = XCUIApplication()
        app.launch()
        
        // Test login flow
        app.textFields["email"].tap()
        app.textFields["email"].typeText("test@example.com")
        // Continue testing...
    }
}
```

### Running Tests
```bash
# Run all tests
xcodebuild test -scheme RDVApp -destination 'platform=iOS Simulator,name=iPhone 14'

# Run specific test
xcodebuild test -scheme RDVApp -only-testing:RDVAppTests/AuthViewModelTests
```

## 🚀 Performance Optimization

### Image Loading
```swift
// Async image loading for profile pictures
AsyncImage(url: URL(string: user.profileImageURL)) { image in
    image.resizable()
} placeholder: {
    ProgressView()
}
```

### Data Caching
```swift
// Cache user data
class DataCache: ObservableObject {
    @Published var cachedUser: User?
    
    func cacheUser(_ user: User) {
        cachedUser = user
        // Persist to UserDefaults or Core Data
    }
}
```

### Memory Management
- Use `weak self` in closures
- Properly cancel Combine subscriptions
- Implement proper image caching

## 🔍 Debugging

### Network Debugging
```swift
// Enable network logging
URLSession.shared.configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
```

### Console Logging
```swift
// Custom logging
struct Logger {
    static func log(_ message: String, level: LogLevel = .info) {
        print("[\(level.rawValue)] \(message)")
    }
}
```

### Common Issues

1. **Network Connection**
   - Verify backend is running
   - Check API endpoint configuration
   - Ensure proper network permissions

2. **Authentication Issues**
   - Clear stored tokens
   - Verify token format
   - Check token expiration

3. **Build Issues**
   - Clean build folder (⌘+Shift+K)
   - Reset simulator
   - Update Xcode and dependencies

## 📖 API Documentation

### Authentication Flow
```swift
// Login example
authViewModel.login(email: "user@example.com", password: "password")

// Registration example
let children = [ChildRegistration(name: "Alice", age: 8)]
authViewModel.register(
    email: "parent@example.com",
    password: "securepassword",
    confirmPassword: "securepassword",
    name: "John Doe",
    phone: "+1234567890",
    children: children
)
```

### Booking Example
```swift
// Create booking
let request = CreateBookingRequest(
    slotId: "slot-123",
    childId: "child-456",
    notes: "Please remind Emma to bring art supplies"
)
scheduleViewModel.createBooking(for: slot, childId: childId, notes: notes)
```

### Messaging Example
```swift
// Send message
let request = SendMessageRequest(
    type: "parent_to_class_lead",
    subject: "Question about homework",
    message: "Could you clarify the math assignment?",
    classIds: nil,
    childIds: ["child-456"],
    attachments: nil
)
```

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Follow Swift Style Guidelines**
   - Use proper naming conventions
   - Add comprehensive documentation
   - Include unit tests
4. **Submit Pull Request**

### Code Style Guidelines
- Use SwiftLint for consistent formatting
- Follow Apple's Swift API Design Guidelines
- Add documentation comments for public APIs
- Use meaningful variable and function names

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

### Technical Support
- **GitHub Issues**: Report bugs and feature requests
- **Email**: support@rdvapp.com
- **Documentation**: Check the API documentation

### Community
- **Discussions**: GitHub Discussions for questions
- **Discord**: Community chat (if available)
- **Stack Overflow**: Tag questions with `rdvapp`

## 🗺️ Roadmap

### Recently Completed
- [x] **Push Notifications**: Real-time appointment and message notifications
- [x] **Notification Preferences**: Granular control over notification types
- [x] **Local Notifications**: Appointment reminders and confirmations
- [x] **Device Token Management**: Backend integration for push notifications
- [x] **Notification Settings UI**: Comprehensive preference management interface

### Upcoming Features
- [ ] **Offline Mode**: Core functionality without internet connection
- [ ] **Calendar Integration**: Export appointments to system calendar
- [ ] **Dark Mode**: Full dark theme support
- [ ] **Widgets**: Home screen widgets for quick appointment viewing
- [ ] **Apple Watch**: Companion watch app for notifications
- [ ] **Accessibility**: Enhanced VoiceOver and accessibility features

### Future Enhancements
- [ ] **Biometric Authentication**: Face ID/Touch ID login
- [ ] **Rich Messaging**: Image and video messages
- [ ] **Group Messaging**: Class-wide communication channels
- [ ] **Analytics Dashboard**: Usage insights for class leads
- [ ] **Multi-language Support**: Internationalization
- [ ] **Siri Shortcuts**: Voice commands for common actions

## 📊 Monitoring & Analytics

### Crash Reporting
```swift
// Integrate crash reporting (e.g., Firebase Crashlytics)
import FirebaseCrashlytics

// Log crashes
Crashlytics.crashlytics().log("Custom log message")
```

### Analytics
```swift
// Track user interactions
Analytics.logEvent("booking_created", parameters: [
    "user_type": user.isParent ? "parent" : "class_lead",
    "booking_date": slot.startTime
])
```

### Performance Monitoring
- Monitor app launch time
- Track API response times
- Monitor memory usage
- Track user engagement metrics

---

**Ready to build?** Follow the setup instructions above to get started with the RDV iOS app development. For questions or support, please create an issue in the GitHub repository.