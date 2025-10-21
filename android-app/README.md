# RDV Android App

A modern Android application for the RDV (Rendez-vous) booking system, built with Kotlin, Jetpack Compose, and following Material Design 3 principles.

## 🚀 Features

### 🔐 Authentication System
- **Secure Login & Registration**: Token-based authentication with encrypted storage
- **Role-Based Access Control**: Support for Parents, Class Leads, and Administrators
- **Multi-Child Registration**: Parents can register multiple children during signup
- **Profile Management**: Update personal information and profile photos

### 📅 Schedule Management
- **Interactive Date Picker**: Swipe through dates with visual selection
- **Real-Time Slot Availability**: Live updates of available appointment times
- **Appointment Booking**: Book, reschedule, and cancel appointments
- **Booking History**: View past and upcoming appointments with details
- **Child Selection**: Parents can book appointments for specific children

### 💬 Communication System
- **Role-Based Messaging**: Different message types based on user roles
- **Message Threads**: Reply to messages with threaded conversations
- **File Attachments**: Upload and download files up to 5MB
- **Real-Time Updates**: Live message synchronization with push notifications

### 🔔 Push Notifications
- **Firebase Cloud Messaging**: Real-time push notifications
- **Appointment Reminders**: Customizable notification timing
- **Message Alerts**: Instant notifications for new messages
- **System Announcements**: Important updates and maintenance notices
- **Notification Preferences**: Granular control over notification types

### 👤 Profile & Settings
- **User Profile Management**: View and edit personal information
- **Children Management**: Add, edit, and manage children's information
- **Notification Settings**: Configure notification preferences and quiet hours
- **Account Settings**: Privacy controls and app preferences

## 🏗️ Architecture

### Project Structure
```
android-app/app/src/main/java/com/rdvapp/
├── data/                          # Data layer
│   ├── model/                     # Data models (User, Booking, Message, etc.)
│   ├── network/                   # API service and network configuration
│   └── repository/                # Repository pattern implementation
├── presentation/                  # UI layer
│   ├── auth/                      # Authentication screens and ViewModels
│   ├── schedule/                  # Appointment scheduling UI
│   ├── messages/                  # Messaging system UI
│   ├── profile/                   # Profile management UI
│   ├── components/                # Reusable UI components
│   └── navigation/                # Navigation configuration
├── services/                      # Background services
│   ├── NotificationService.kt     # Local notification management
│   └── RDVFirebaseMessagingService.kt # FCM integration
├── utils/                         # Utility classes
├── ui/theme/                      # App theming and design system
├── MainActivity.kt                # Main activity
└── RDVApplication.kt              # Application class
```

### Architecture Patterns

#### Clean Architecture
- **Data Layer**: Repositories, API services, and data models
- **Domain Layer**: Use cases and business logic
- **Presentation Layer**: ViewModels, UI state, and Compose screens

#### MVVM Pattern
- **Model**: Data classes with kotlinx.serialization
- **View**: Jetpack Compose UI with declarative approach
- **ViewModel**: State management with StateFlow and LiveData

#### Dependency Injection
- **Hilt**: Compile-time dependency injection
- **Module-based**: Network, Repository, and Service modules
- **Scoped Dependencies**: Singleton and ViewModelScoped

## 📱 Technical Stack

### Core Technologies
- **Kotlin**: 100% Kotlin codebase with coroutines
- **Jetpack Compose**: Modern declarative UI toolkit
- **Material Design 3**: Latest Material Design components
- **Android Architecture Components**: ViewModel, LiveData, Navigation

### Networking & Data
- **Retrofit**: Type-safe HTTP client with kotlinx.serialization
- **OkHttp**: HTTP/2 support with connection pooling
- **DataStore**: Encrypted preferences storage
- **Kotlinx Serialization**: JSON serialization/deserialization

### Push Notifications
- **Firebase Cloud Messaging**: Cross-platform push notifications
- **Notification Channels**: Android notification management
- **Background Processing**: WorkManager for notification handling

### Development Tools
- **Hilt**: Dependency injection framework
- **Navigation Compose**: Type-safe navigation
- **Coil**: Image loading and caching
- **Accompanist**: Jetpack Compose utilities

## 🛠️ Development Setup

### Prerequisites
- **Android Studio**: Flamingo (2022.2.1) or later
- **Kotlin**: 1.9.10 or later
- **Gradle**: 8.1.4 or later
- **Android SDK**: API 24 (Android 7.0) minimum, API 34 target

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/rdvapp.git
   cd rdvapp/android-app
   ```

2. **Open in Android Studio**
   - Open Android Studio
   - Select "Open an existing project"
   - Navigate to `rdvapp/android-app`
   - Wait for Gradle sync to complete

3. **Configure Backend API**
   
   Update the base URL in `app/build.gradle`:
   ```kotlin
   buildTypes {
       debug {
           buildConfigField "String", "BASE_URL", '"http://10.0.2.2:4000/api/"'
       }
       release {
           buildConfigField "String", "BASE_URL", '"https://your-production-api.com/api/"'
       }
   }
   ```

4. **Firebase Setup**
   
   a. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Add Android app with package name `com.rdvapp`
   
   b. **Download Configuration**:
   - Download `google-services.json`
   - Place in `android-app/app/` directory
   
   c. **Enable Services**:
   - Enable Firebase Cloud Messaging
   - Configure notification settings

5. **Build and Run**
   ```bash
   # Debug build
   ./gradlew assembleDebug
   
   # Run on connected device/emulator
   ./gradlew installDebug
   ```

### Environment Configuration

#### Development Environment
```kotlin
// NetworkModule.kt
private const val BASE_URL = "http://10.0.2.2:4000/api/" // For emulator
// For physical device, use your computer's IP:
// private const val BASE_URL = "http://192.168.1.100:4000/api/"
```

#### Production Environment
```kotlin
// build.gradle
buildTypes {
    release {
        buildConfigField "String", "BASE_URL", '"https://api.rdvapp.com/api/"'
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## 🔧 Configuration

### API Integration
The app integrates with the Express.js backend using these endpoints:

#### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile

#### Scheduling
- `GET /slots` - Get available time slots
- `POST /slots/timeframe` - Create time slots (admin/class lead)
- `GET /bookings` - Get user bookings
- `POST /bookings` - Create new booking
- `PUT /bookings/:id` - Reschedule booking
- `DELETE /bookings/:id` - Cancel booking

#### Messaging
- `GET /messages` - Get user messages
- `POST /messages` - Send new message
- `POST /messages/:id/reply` - Reply to message
- `PUT /messages/:id/read` - Mark message as read
- `POST /uploads` - Upload file attachments

#### Notifications
- `PUT /user/device-token` - Register FCM token
- `GET /user/notification-preferences` - Get notification settings
- `PUT /user/notification-preferences` - Update notification settings

### Security Configuration

#### Network Security
```xml
<!-- network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain> <!-- Emulator -->
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

#### Data Storage
```kotlin
// Secure token storage with DataStore
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "auth_preferences"
)
```

### Push Notification Setup

#### Firebase Configuration
1. **Add Firebase to your project**:
   - Follow the [Firebase setup guide](https://firebase.google.com/docs/android/setup)
   - Add `google-services.json` to the app directory

2. **Configure notification channels**:
   ```kotlin
   // NotificationService.kt
   private fun createNotificationChannels() {
       val channels = listOf(
           NotificationChannel("appointments", "Appointments", IMPORTANCE_HIGH),
           NotificationChannel("messages", "Messages", IMPORTANCE_DEFAULT),
           NotificationChannel("system", "System", IMPORTANCE_LOW)
       )
       // Register channels with NotificationManager
   }
   ```

3. **Handle FCM tokens**:
   ```kotlin
   // RDVFirebaseMessagingService.kt
   override fun onNewToken(token: String) {
       // Send token to backend
       updateDeviceToken(token)
   }
   ```

## 📦 Building & Deployment

### Debug Build
```bash
# Build debug APK
./gradlew assembleDebug

# Install on connected device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Release Build
```bash
# Generate signed APK
./gradlew assembleRelease

# Generate AAB for Play Store
./gradlew bundleRelease
```

### Code Signing
1. **Create keystore**:
   ```bash
   keytool -genkey -v -keystore rdvapp-release-key.keystore -alias rdvapp -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing**:
   ```kotlin
   // app/build.gradle
   android {
       signingConfigs {
           release {
               storeFile file('rdvapp-release-key.keystore')
               storePassword 'your-store-password'
               keyAlias 'rdvapp'
               keyPassword 'your-key-password'
           }
       }
   }
   ```

### Play Store Deployment
1. **Prepare for release**:
   - Update version code and name
   - Test on multiple devices and API levels
   - Generate signed AAB
   - Prepare store listing materials

2. **Upload to Play Console**:
   - Create app listing
   - Upload AAB file
   - Configure release management
   - Submit for review

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
./gradlew test

# Run with coverage
./gradlew testDebugUnitTestCoverage
```

### UI Tests
```bash
# Run instrumented tests
./gradlew connectedAndroidTest

# Run specific test class
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.rdvapp.AuthenticationTest
```

### Testing Strategy
- **Unit Tests**: ViewModels, Repositories, Utilities
- **Integration Tests**: API service, Database operations
- **UI Tests**: Critical user flows, Navigation
- **End-to-End Tests**: Complete booking and messaging flows

## 🔍 Debugging

### Network Debugging
```kotlin
// Enable network logging in debug builds
val loggingInterceptor = HttpLoggingInterceptor().apply {
    level = if (BuildConfig.DEBUG) {
        HttpLoggingInterceptor.Level.BODY
    } else {
        HttpLoggingInterceptor.Level.NONE
    }
}
```

### UI Debugging
```kotlin
// Enable Compose debugging
@Composable
fun DebugContent() {
    if (BuildConfig.DEBUG) {
        // Debug-only UI elements
    }
}
```

### Common Issues

1. **Network connectivity**:
   - Verify emulator can reach backend
   - Check for cleartext traffic configuration
   - Validate API endpoint URLs

2. **Authentication issues**:
   - Clear app data to reset auth state
   - Check token storage and retrieval
   - Verify API token format

3. **Build issues**:
   - Clean and rebuild project
   - Invalidate caches and restart
   - Check Gradle and dependency versions

## 📖 Development Guidelines

### Code Style
- Follow [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Use [ktlint](https://ktlint.github.io/) for formatting
- Write meaningful commit messages
- Add KDoc comments for public APIs

### Compose Best Practices
```kotlin
// State hoisting
@Composable
fun BookingScreen(
    uiState: BookingUiState,
    onEvent: (BookingEvent) -> Unit
) {
    // UI implementation
}

// Preview for design iteration
@Preview
@Composable
fun BookingScreenPreview() {
    RDVAppTheme {
        BookingScreen(
            uiState = BookingUiState(),
            onEvent = {}
        )
    }
}
```

### Performance Optimization
- Use `remember` for expensive calculations
- Implement lazy loading for large lists
- Optimize image loading with Coil
- Use proper lifecycle management

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Follow coding standards**:
   - Write unit tests for new features
   - Update documentation
   - Test on multiple screen sizes
4. **Submit pull request**

### Pull Request Guidelines
- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

### Technical Support
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check inline code documentation
- **Email**: support@rdvapp.com

### Development Resources
- **Android Developer Guide**: https://developer.android.com/
- **Jetpack Compose**: https://developer.android.com/jetpack/compose
- **Material Design 3**: https://m3.material.io/
- **Firebase Documentation**: https://firebase.google.com/docs

## 🗺️ Roadmap

### Current Status
- [x] **Authentication System**: Complete login/register flow
- [x] **Schedule Management**: Basic booking functionality
- [x] **API Integration**: Full backend communication
- [x] **Push Notifications**: Firebase Cloud Messaging setup
- [x] **Navigation**: Bottom navigation with proper state management

### Upcoming Features
- [ ] **Enhanced Messaging**: Rich text and media messages
- [ ] **Offline Support**: Local database with sync
- [ ] **Calendar Integration**: Export to system calendar
- [ ] **Dark Theme**: Complete dark mode support
- [ ] **Widgets**: Home screen appointment widgets
- [ ] **Accessibility**: Enhanced screen reader support

### Future Enhancements
- [ ] **Biometric Authentication**: Fingerprint/Face unlock
- [ ] **Multi-language Support**: Internationalization
- [ ] **Voice Messages**: Audio message recording
- [ ] **Video Calls**: Integration with calling services
- [ ] **Analytics**: Usage insights and crash reporting
- [ ] **Wear OS**: Android smartwatch companion

---

**Ready to develop?** Follow the setup instructions above to get started with the RDV Android app development. For questions or support, please create an issue in the GitHub repository.