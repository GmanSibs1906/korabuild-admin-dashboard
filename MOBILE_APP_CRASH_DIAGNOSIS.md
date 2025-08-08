# 🚨 KoraBuild Mobile App Crash Fix Guide

## Problem Analysis
Your React Native/Expo app:
- ✅ **Works perfectly** in development (Expo CLI + emulator/device)
- ❌ **Crashes immediately** when built as APK/AAB for production
- ❌ **Rejected by Google Play** due to "Broken Functionality - Crashes for users"

This is a **classic production build configuration issue**. Here's how to fix it:

## 🔍 **IMMEDIATE CRASH DIAGNOSIS**

### Step 1: Get Crash Logs
**Most Important**: You need to see the actual error logs to identify the root cause.

#### **Option A: ADB Logcat (Recommended)**
```bash
# Connect your device via USB with USB debugging enabled
adb devices
adb logcat | grep -i "ReactNativeJS\|KoraBuild\|FATAL\|AndroidRuntime"

# Install and immediately run the APK while monitoring logs
adb install your-app.apk
adb logcat -c  # Clear logs
# Launch the app, then immediately check logs
adb logcat | grep -E "(FATAL|AndroidRuntime|ReactNative)"
```

#### **Option B: Flipper/React Native Debugger**
```bash
# If you have Flipper installed
npx flipper
# Monitor crashes in the Flipper interface
```

#### **Option C: Expo Crashlytics (If using EAS)**
```bash
# Add crashlytics to your app.json
expo install expo-firebase-analytics
# Check Firebase console for crash reports
```

### Step 2: Common Root Causes & Fixes

## 🔧 **MOST LIKELY FIXES**

### **1. Environment Variables Missing**
**Problem**: Production builds don't have access to development environment variables.

**Check your mobile app for**:
```javascript
// ❌ WRONG - These will be undefined in production
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

// If these are undefined, all API calls will fail and crash the app
```

**Fix in `app.json` or `app.config.js`**:
```json
{
  "expo": {
    "name": "KoraBuild",
    "extra": {
      "supabaseUrl": "https://zzycggpcojissnllcucs.supabase.co",
      "supabaseAnonKey": "your-anon-key-here",
      "apiUrl": "https://your-admin-dashboard.vercel.app"
    }
  }
}
```

**Update your app code**:
```javascript
// ✅ CORRECT - Use Constants.expoConfig
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

// Add safety checks
if (!API_URL || !SUPABASE_URL) {
  console.error('Missing environment configuration');
  // Show user-friendly error instead of crashing
}
```

### **2. Network Security Policy (Android)**
**Problem**: Android production builds block HTTP requests by default.

**Fix**: Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true,
      "networkSecurityConfig": {
        "domain-config": [
          {
            "domain": "your-api-domain.com",
            "includeSubdomains": true,
            "cleartextTrafficPermitted": true
          }
        ]
      }
    }
  }
}
```

### **3. Bundle Size/Memory Issues**
**Problem**: Production builds have different memory constraints.

**Check bundle size**:
```bash
# Analyze your bundle
npx expo export --platform android
# Check the size of the output

# If bundle is too large, optimize:
npx expo install expo-updates
```

**Fix large bundles**:
```javascript
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Use dynamic imports for large libraries
const loadChart = async () => {
  const Chart = await import('react-native-chart-kit');
  return Chart;
};
```

### **4. Missing Permissions**
**Fix in `app.json`**:
```json
{
  "expo": {
    "android": {
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### **5. Supabase Configuration Issues**
**Problem**: Supabase client not properly initialized in production.

**Fix your Supabase initialization**:
```javascript
// supabase.js
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### **6. Metro Configuration**
**Add/update `metro.config.js`**:
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve modules for production
config.resolver.sourceExts.push('jsx', 'tsx');

// Fix potential transformation issues
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
```

## 🔨 **STEP-BY-STEP REBUILD PROCESS**

### Step 1: Clean Everything
```bash
# Clear all caches
npm start -- --clear
expo start --clear
npx expo install --fix

# Clear Expo cache
expo r -c
```

### Step 2: Update Configuration
```bash
# Update your app.json with proper environment variables
# Add all the fixes mentioned above
```

### Step 3: Test Locally First
```bash
# Test production build locally
npx expo export --platform android
npx expo export --platform ios

# Verify no errors in the export process
```

### Step 4: Build with EAS (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Initialize EAS
eas build:configure

# Build for Android
eas build --platform android
```

### Step 5: Test APK Before Store Upload
```bash
# Install the built APK on a physical device
adb install your-app.apk

# Monitor for crashes immediately
adb logcat | grep -i "fatal\|crash\|error"
```

## 🎯 **SPECIFIC CHECKS FOR YOUR APP**

### Check These Files in Your Mobile App:
1. **`app.json`** - Environment variables and permissions
2. **`supabase.js`** - Client initialization 
3. **API calls** - Error handling for network requests
4. **Navigation** - Deep linking configuration
5. **Assets** - Large images or files

### Common Code Patterns That Cause Crashes:
```javascript
// ❌ WILL CRASH IN PRODUCTION
const data = JSON.parse(response); // If response is null
const user = auth.user.name; // If auth.user is null
fetch(undefined_url); // If URL is undefined

// ✅ SAFE PRODUCTION CODE
const data = response ? JSON.parse(response) : null;
const user = auth?.user?.name || 'Unknown';
if (url) fetch(url);
```

## 📱 **GOOGLE PLAY STORE REQUIREMENTS**

### For Resubmission:
1. **Fix the crash** using the steps above
2. **Test thoroughly** on multiple devices
3. **Use Android App Bundle** (AAB) instead of APK
4. **Add crash reporting** (Firebase Crashlytics)
5. **Test with internal testing track** first

### Build AAB for Play Store:
```bash
# Using EAS (recommended)
eas build --platform android --type app-bundle

# Or with Expo build (deprecated)
expo build:android --type app-bundle
```

## 🚨 **EMERGENCY QUICK FIX**

If you need to fix this immediately:

1. **Add error boundaries** to catch crashes:
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <Text>Something went wrong. Please restart the app.</Text>;
    }
    return this.props.children;
  }
}

// Wrap your main App component
export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
```

2. **Add environment checks**:
```javascript
// At the top of App.js
import Constants from 'expo-constants';

console.log('Environment:', __DEV__ ? 'development' : 'production');
console.log('Constants:', Constants.expoConfig?.extra);

if (!Constants.expoConfig?.extra?.supabaseUrl) {
  console.error('Missing Supabase configuration!');
}
```

## 📋 **NEXT STEPS**

1. **Get the crash logs** first (most important)
2. **Apply the environment variable fixes** 
3. **Rebuild and test locally**
4. **Use EAS build** for better reliability
5. **Test on internal track** before public release

The crash is almost certainly related to missing environment variables or network configuration. Once you implement these fixes, your app should work in production just as well as it does in development.

Let me know what the crash logs show and I can provide more specific fixes! 