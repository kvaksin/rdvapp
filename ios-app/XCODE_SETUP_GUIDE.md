# iOS App Setup Guide for Xcode

## 🎯 Complete Setup Instructions

### Prerequisites ✅
- ✅ Xcode 14.0+ installed
- ✅ iOS 15.0+ deployment target
- ✅ Backend server running on port 4000

### Step-by-Step Setup

## 1️⃣ Create Xcode Project

### Open Xcode and Create New Project:
```
File → New → Project
```

### Configure Project:
- **Platform:** iOS
- **Template:** App
- **Product Name:** RDVApp
- **Interface:** SwiftUI
- **Language:** Swift
- **Bundle Identifier:** com.yourdomain.rdvapp
- **Use Core Data:** ❌ (unchecked)
- **Include Tests:** ✅ (recommended)

### Save Location:
```
/Users/kvaksin/Documents/Documents - kvaksin M1 pro/GitHub/rdvapp/ios-xcode-project/
```

## 2️⃣ Add Source Files

### Delete Generated Files:
- Delete `ContentView.swift`
- Delete `RDVAppApp.swift`

### Add Our Implementation:
1. Right-click project name in Navigator
2. Select "Add Files to 'RDVApp'"
3. Navigate to: `/Users/kvaksin/Documents/Documents - kvaksin M1 pro/GitHub/rdvapp/ios-app/RDVApp/`
4. Select ALL files and folders:
   - ✅ `Models/` folder (User.swift, Class.swift, Message.swift)
   - ✅ `Services/` folder (APIService.swift, NotificationService.swift)
   - ✅ `ViewModels/` folder (AuthViewModel.swift, ScheduleViewModel.swift)
   - ✅ `Views/` folder (Auth/, Schedule/, Messages/, Profile/)
   - ✅ `ContentView.swift`
   - ✅ `TabBarView.swift`
   - ✅ `RDVAppApp.swift`
5. Click "Add"

## 3️⃣ Organize Project Structure

Create groups in Xcode Navigator to match this structure:
```
RDVApp/
├── App/
│   ├── RDVAppApp.swift
│   ├── ContentView.swift
│   └── TabBarView.swift
├── Models/
│   ├── User.swift
│   ├── Class.swift
│   └── Message.swift
├── Services/
│   ├── APIService.swift
│   └── NotificationService.swift
├── ViewModels/
│   ├── AuthViewModel.swift
│   └── ScheduleViewModel.swift
└── Views/
    ├── Auth/
    │   ├── LoginView.swift
    │   └── RegisterView.swift
    ├── Schedule/
    │   ├── ScheduleView.swift
    │   ├── BookingView.swift
    │   └── SlotCard.swift
    ├── Messages/
    │   ├── MessagesView.swift
    │   ├── MessageDetailView.swift
    │   └── ComposeMessageView.swift
    └── Profile/
        ├── ProfileView.swift
        └── NotificationSettingsView.swift
```

## 4️⃣ Configure Project Settings

### General Settings:
- Select project in Navigator
- Go to **General** tab
- **Deployment Target:** iOS 15.0
- **Supported Device Orientations:** Portrait only

### Signing & Capabilities:
- ✅ Enable "Automatically manage signing"
- Select your Team (Apple Developer account)
- Bundle Identifier: `com.yourdomain.rdvapp`

### Add Capabilities:
- Click **+ Capability**
- Add **Push Notifications**
- Add **Background Modes** → Enable **Remote notifications**

## 5️⃣ Configure Info.plist

Add these keys to your `Info.plist`:

### Network Security (for localhost development):
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### Privacy Permissions:
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take profile photos</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select profile photos</string>

<key>NSDocumentsFolderUsageDescription</key>
<string>This app needs access to documents to attach files to messages</string>
```

### Background Modes:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

## 6️⃣ Build and Run

### Select Target:
- Click device selector in Xcode toolbar
- Choose: **iPhone 15 Simulator** (or your preferred simulator)

### Build Project:
```
⌘+B (or Product → Build)
```

### Run App:
```
⌘+R (or Product → Run)
```

## 7️⃣ Test the App

### Backend Status: ✅ RUNNING
Your Express.js backend is already running on:
```
http://localhost:4000/api
```

### Test Features:
1. **Registration:** Create a new parent account with children
2. **Login:** Sign in with created credentials
3. **Schedule:** View and book appointments
4. **Messages:** Send messages between roles
5. **Profile:** Edit user profile and notification settings

## 🔧 Troubleshooting

### Common Issues & Solutions:

#### Build Errors:
```bash
# Clean build folder
⌘+Shift+K (Product → Clean Build Folder)

# Reset simulator
Device → Erase All Content and Settings
```

#### Network Connection Issues:
```swift
// Verify API endpoint in APIService.swift
private init() {
    #if DEBUG
    self.baseURL = "http://localhost:4000/api"  // ✅ Should match your backend
    #else
    self.baseURL = "https://your-production-api.com/api"
    #endif
}
```

#### Simulator Issues:
- Try different simulator models
- Restart Xcode if needed
- Check iOS version compatibility

#### File Organization:
- Make sure all Swift files are added to the target
- Check that groups match the file structure
- Verify no duplicate files exist

## 🚀 Ready to Test!

Once setup is complete, you should see:

1. **Login Screen** when app starts
2. **Registration Flow** for new users
3. **Tab Navigation** after successful login:
   - 📅 **Schedule** - Appointment booking
   - 💬 **Messages** - Communication system
   - 👤 **Profile** - User settings

### Test Credentials:
Create a new account through registration or use the API to create test users.

### API Documentation:
Your backend provides API documentation at:
```
http://localhost:4000/api/docs/ui
```

## 📱 Production Deployment

For App Store deployment:
1. Update Bundle Identifier to your domain
2. Configure proper signing certificates
3. Remove localhost network exceptions
4. Update production API endpoint
5. Test on physical device

---

**Need Help?** Check the comprehensive documentation in `/ios-app/README.md` for detailed feature descriptions and architecture information.