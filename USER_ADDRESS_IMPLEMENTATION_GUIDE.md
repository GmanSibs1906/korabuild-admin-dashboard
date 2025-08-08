# 🏠 User Address Implementation Guide

## 📋 **Overview**
This implementation adds address collection and display functionality to the KoraBuild Admin Dashboard, allowing addresses collected during mobile app signup to be stored and displayed in user profiles.

## 🔧 **Changes Made**

### **1. Database Schema Update**
**File**: `add_user_address_field.sql`
- Added `address` field to `public.users` table
- Added comment for clarity
- Created search index for address field

### **2. TypeScript Types Update**
**File**: `src/types/database.ts`
- Added `address: string | null` to users table Row, Insert, and Update types
- Maintains consistency with mobile app types

### **3. User Profile Interface Update**
**File**: `src/hooks/useUserProfile.ts`
- Added `address?: string` to `UserInfo` interface
- Ensures proper typing for address field in UI components

### **4. API Endpoints Updated**

#### **User Profile API**
**File**: `src/app/api/users/[userId]/profile/route.ts`
- Added `address: user.address` to userInfo response
- Displays collected address in profile data

#### **User Creation API**
**File**: `src/app/api/users/create/route.ts`
- Added `address` parameter to request body destructuring
- Includes address in user creation logs
- Stores address in both auth metadata and users table

#### **User Update API**
**File**: `src/app/api/users/route.ts`
- Added `address: updateData.address` to update operation
- Allows editing user addresses via admin panel

### **5. UI Components Updated**

#### **Create User Modal**
**File**: `src/components/modals/CreateUserModal.tsx`
- Added `address: string` to FormData interface
- Added address field to form with MapPin icon
- Includes address in API call body
- Added proper form validation and reset

#### **Edit User Modal**
**File**: `src/components/modals/EditUserModal.tsx`
- Added `address` to form state
- Added address input field with MapPin icon
- Added Textarea import for multi-line address input
- Includes address in update API call

#### **User Profile Dashboard**
**File**: `src/components/dashboard/UserProfileDashboard.tsx`
- Added conditional address display with MapPin icon
- Shows address alongside email and phone in user info section
- Proper responsive layout maintained

## 🚀 **Implementation Steps**

### **Step 1: Run Database Migration**
```sql
-- Execute this in your Supabase SQL editor
ALTER TABLE public.users 
ADD COLUMN address text;

COMMENT ON COLUMN public.users.address IS 'User address collected during signup from mobile app';

CREATE INDEX IF NOT EXISTS idx_users_address ON public.users USING gin(to_tsvector('english', address));
```

### **Step 2: Test Admin User Creation**
1. Go to `/users` in admin dashboard
2. Click "Add User" button
3. Fill out the form including the new Address field
4. Verify user is created with address stored

### **Step 3: Test User Profile Display**
1. Go to any user's profile page
2. Verify address is displayed below phone number
3. Check that address shows with MapPin icon
4. Confirm proper layout and styling

### **Step 4: Test User Editing**
1. Click "Edit" on any user in the users table
2. Verify address field is populated and editable
3. Update address and save
4. Confirm changes are reflected in profile

## 📱 **Mobile App Integration**

### **For Mobile App Developers**
The mobile app should send user addresses during signup to match this schema:

```typescript
// Mobile app signup payload should include:
{
  email: string,
  full_name: string,
  phone?: string,
  address?: string,  // NEW: Include this field
  // ... other fields
}
```

### **API Endpoint for Mobile**
```typescript
// POST /api/users/create
{
  "full_name": "John Doe",
  "email": "john@example.com", 
  "phone": "+27123456789",
  "address": "123 Main Street, Cape Town, Western Cape, 8001", // NEW
  "role": "client"
}
```

## 🔍 **Testing Checklist**

### **Admin Dashboard Testing**
- [ ] ✅ Run database migration successfully
- [ ] ✅ Create new user with address via admin panel
- [ ] ✅ Edit existing user address via admin panel
- [ ] ✅ View user profile shows address with MapPin icon
- [ ] ✅ Address field is optional (can be left empty)
- [ ] ✅ Address displays properly on all screen sizes

### **Data Validation Testing**
- [ ] ✅ Address can be empty/null without errors
- [ ] ✅ Long addresses display correctly
- [ ] ✅ Special characters in addresses work
- [ ] ✅ Address updates save properly to database

### **UI/UX Testing**
- [ ] ✅ MapPin icon shows consistently
- [ ] ✅ Address field uses Textarea for multi-line input
- [ ] ✅ Form validation works properly
- [ ] ✅ Loading states work during save operations

## 📊 **Expected Results**

### **Before Implementation**
```typescript
// User profile only showed:
{
  userInfo: {
    name: "John Doe",
    email: "john@example.com", 
    phone: "+27123456789"
    // No address field
  }
}
```

### **After Implementation**
```typescript
// User profile now shows:
{
  userInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+27123456789",
    address: "123 Main Street, Cape Town, Western Cape, 8001" // NEW
  }
}
```

### **Visual Changes**
```
User Profile Display:
📧 john@example.com
📞 +27123456789  
📍 123 Main Street, Cape Town, Western Cape, 8001  ← NEW

Create/Edit User Forms:
[Name Field]
[Email Field] 
[Phone Field]
[Address Field] ← NEW (with MapPin icon)
[Role Dropdown]
```

## 🎯 **Benefits**

### **1. Complete User Profiles**
- ✅ **Comprehensive Data**: Store all user information in one place
- ✅ **Consistent with Mobile**: Match data collected in mobile app
- ✅ **Better Support**: Support team can see user locations

### **2. Enhanced Admin Features**
- ✅ **Location-Based Features**: Future geo-filtering capabilities
- ✅ **Service Areas**: Better contractor matching by location
- ✅ **Delivery Management**: Accurate delivery addresses

### **3. Data Integrity**
- ✅ **Single Source**: Address stored in admin database
- ✅ **Search Capability**: Full-text search on addresses
- ✅ **Data Validation**: Proper TypeScript typing

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Database Migration Fails**
```sql
-- If column already exists, check with:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'address';

-- If exists, skip ALTER TABLE step
```

#### **TypeScript Errors**
```bash
# Clear Next.js cache and restart
rm -rf .next
npm run dev
```

#### **Address Not Showing**
1. Check database has address data: `SELECT id, email, address FROM users LIMIT 5;`
2. Verify API includes address: Check browser network tab
3. Confirm UI component receives address: Check React DevTools

#### **Form Validation Issues**
- Address field is optional - no validation errors should occur
- Check console for any form submission errors
- Verify all imports are correct

## 📝 **Next Steps**

### **Optional Enhancements**
1. **Address Validation**: Add Google Maps API for address validation
2. **Geolocation**: Auto-detect user location during signup
3. **Service Areas**: Filter contractors by user address proximity
4. **Delivery Zones**: Calculate delivery costs based on address
5. **Analytics**: Track user distribution by geographic area

### **Mobile App Updates Required**
1. Update mobile signup form to include address field
2. Modify user registration API calls to include address
3. Test address collection and storage flow
4. Update user profile editing in mobile app

## ✅ **Verification**

After implementation, verify:
1. **Database**: Address column exists in users table
2. **API**: Address included in all user CRUD operations  
3. **UI**: Address displays in profiles and forms
4. **Types**: No TypeScript errors related to address field
5. **Mobile**: Address can be collected during signup

The user address feature is now fully integrated into the KoraBuild Admin Dashboard! 🎉 