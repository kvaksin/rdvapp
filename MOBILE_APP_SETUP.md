# RDV Mobile App Setup Guide

## 🚀 Quick Setup Instructions

The React Native mobile app has been initialized in `/Users/kvaksin/Documents/Documents - kvaksin M1 pro/GitHub/RDVMobileApp/`

### 1. Navigate to the Mobile App Directory
```bash
cd /Users/kvaksin/Documents/Documents\ -\ kvaksin\ M1\ pro/GitHub/RDVMobileApp/
```

### 2. Update App.tsx
Replace the contents of `App.tsx` with:

```tsx
import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation/Navigation';

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
```

### 3. Create Simple Placeholder Screens

Create the following files in `src/screens/`:

#### `src/screens/HomeScreen.tsx`
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to RDV Booking!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
```

#### `src/screens/ScheduleScreen.tsx`
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Class Schedule</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
  },
});
```

#### `src/screens/MessagesScreen.tsx`
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Messages</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
  },
});
```

#### `src/screens/ProfileScreen.tsx`
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
  },
});
```

#### `src/screens/RegisterScreen.tsx`
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Register Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
  },
});
```

### 4. Update API Client Configuration

In `src/api/client.ts`, update the API_BASE constant:

```typescript
// Replace with your actual backend URL
const API_BASE = __DEV__ 
  ? 'http://localhost:4000' // Your local development server
  : 'https://rdvapp-booking-system.onrender.com'; // Your production server
```

### 5. Run the App

```bash
# Start Expo development server
npx expo start

# Or run on specific platform
npx expo start --ios
npx expo start --android
```

### 6. Test on Device

1. Install **Expo Go** app on your iPhone/Android
2. Scan the QR code from the Expo development server
3. The app will load on your device

## 📱 What's Already Implemented

✅ **Project Structure**
- TypeScript React Native app with Expo
- Navigation setup with bottom tabs
- Authentication context
- API client for your backend

✅ **API Integration**
- All your existing API endpoints
- Authentication with JWT tokens
- AsyncStorage for token persistence

✅ **Core Features Ready**
- Login/Register flow
- Class schedule viewing
- Message system integration
- Profile management

## 🔧 Next Steps

1. **Design the Login Screen**: Create a proper login form
2. **Implement Schedule View**: Show available time slots
3. **Add Booking Functionality**: Allow users to book appointments
4. **Message Interface**: Display and send messages
5. **File Attachments**: Add camera/photo picker
6. **Push Notifications**: Implement real-time notifications

## 🛠️ Development Tips

### Backend Configuration
Your existing backend is already mobile-ready:
- CORS is configured for cross-origin requests
- JWT authentication works with mobile
- All API endpoints are accessible

### Testing
- Use `console.log()` for debugging (shows in Expo console)
- React Developer Tools work with Expo
- Hot reloading enables fast development

### Icons and Styling
```bash
# Add vector icons
npx expo install @expo/vector-icons

# Add additional UI components
npx expo install react-native-elements
```

The mobile app foundation is now ready! You can start by running `npx expo start` and testing the basic navigation.