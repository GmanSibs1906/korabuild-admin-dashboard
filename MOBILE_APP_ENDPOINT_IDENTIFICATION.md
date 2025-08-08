# Mobile App Endpoint Identification Guide

## 🎯 **Problem**: Mobile app messages don't trigger notifications

**Issue**: Test notifications work, but real mobile app messages don't create notifications in the control center.

## 🕵️ **Step 1: Identify Which Endpoint Your Mobile App Uses**

### **Enhanced Logging Added**
I've added enhanced logging to identify which endpoint your mobile app is calling:

- `[Messages API] *** MOBILE APP MIGHT BE USING THIS ENDPOINT ***`
- `[Communications API] *** MOBILE APP MIGHT BE USING THIS ENDPOINT ***`  
- `[Direct Insert] *** MOBILE APP MIGHT BE USING THIS ENDPOINT ***`

### **How to Identify the Endpoint**

1. **Open your terminal** where the Next.js dev server is running
2. **Send a message from your mobile app**
3. **Watch the console logs** for these specific messages:

**Look for logs like:**
```
📱 [Messages API] *** MOBILE APP MIGHT BE USING THIS ENDPOINT ***
📋 [Messages API] Request body: {...}
```

OR

```
📱 [Communications API] *** MOBILE APP MIGHT BE USING THIS ENDPOINT ***
🔧 [Communications API] Action: send_message
```

OR

```
📱 [Direct Insert] *** MOBILE APP MIGHT BE USING THIS ENDPOINT ***
🔧 [Direct Insert] Starting direct message insert bypass...
```

## 🔧 **Step 2: Notification Status by Endpoint**

### **✅ Fixed Endpoints (Should Create Notifications)**
1. **`/api/communications`** - ✅ **FIXED** - Now creates notifications
2. **`/api/communications/messages`** - ✅ **ALREADY HAD** notifications  
3. **`/api/direct-message-insert`** - ✅ **FIXED** - Now creates notifications

### **❓ Other Possible Endpoints**
- `/api/mobile-control/communication` - Has notification logic
- Custom RPC calls or other endpoints

## 🧪 **Step 3: Test Each Endpoint**

You can test each endpoint manually to see which one works:

### **Test Communications API:**
```bash
curl -X POST "http://localhost:3000/api/communications" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send_message",
    "data": {
      "conversation_id": "b98aa067-e406-4030-83e6-00c773dd7115",
      "sender_id": "35e45d18-1745-4ab0-a4c2-f85f970f6af8",
      "message_text": "Test message via communications API",
      "message_type": "text"
    }
  }'
```

### **Test Messages API:**
```bash
curl -X POST "http://localhost:3000/api/communications/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send_message",
    "conversationId": "b98aa067-e406-4030-83e6-00c773dd7115",
    "content": "Test message via messages API",
    "messageType": "text"
  }'
```

### **Test Direct Insert API:**
```bash
curl -X POST "http://localhost:3000/api/direct-message-insert" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "b98aa067-e406-4030-83e6-00c773dd7115",
    "senderId": "35e45d18-1745-4ab0-a4c2-f85f970f6af8",
    "content": "Test message via direct insert API",
    "messageType": "text"
  }'
```

## 🎯 **Step 4: Instructions for You**

1. **Send a message from your mobile app**
2. **Immediately check your terminal/console** for the enhanced logs
3. **Tell me which endpoint shows the logs** - this will identify exactly which API your mobile app uses
4. **I'll ensure that specific endpoint creates notifications properly**

## 📋 **Current Status**

- ✅ **Test notifications work** (real-time system is functional)
- ✅ **Three main endpoints now have notification creation**
- ⏳ **Need to identify which endpoint your mobile app actually uses**
- ⏳ **Ensure that specific endpoint is working correctly**

## 🚀 **Expected Result**

Once we identify the correct endpoint, your mobile app messages should:
1. **Create the message** in the database
2. **Create notifications** for all admin users  
3. **Trigger real-time updates** in the control center
4. **Show toast notifications** with sound
5. **Display proper action buttons** (View/Reply)

The real-time notification system is working (proven by test notifications), we just need to ensure your mobile app is calling an endpoint that creates notifications. 