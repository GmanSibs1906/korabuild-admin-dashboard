# 🔧 **Orphaned User Data - Troubleshooting Guide**

## 🚨 **When This Issue Occurs**

### **Symptoms to Watch For**
- ❌ **"Email is already taken"** error when creating users from admin panel
- ❌ **User not visible** in admin dashboard but email shows as taken
- ❌ **Account creation fails** for emails that "should" be available
- ❌ **Mismatched user counts** between different parts of the system

### **Common Causes**
1. **Failed Registration Process**: User signup interrupted midway
2. **Network Issues**: Connection lost during account creation
3. **Server Errors**: API failures during user profile creation
4. **Manual Data Manipulation**: Direct database changes without proper cleanup
5. **Import/Migration Issues**: Bulk user imports that partially failed

## 🔍 **Step 1: Diagnose the Issue**

### **Quick Health Check**
Run this command to get an overview of system health:

```bash
# Check for orphaned data
curl "http://localhost:3000/api/users/orphaned"
```

**Expected Response**:
- ✅ **Clean System**: `{"status": "clean", "count": 0}`
- ❌ **Issues Found**: `{"status": "needs_cleanup", "count": X}`

### **Detailed Analysis**
Get comprehensive comparison between auth and public users:

```bash
# Compare auth vs public user data
curl "http://localhost:3000/api/debug/auth-users"
```

**Look for**:
- `"orphanedInAuth"`: Users in Supabase Auth but not in public.users
- `"orphanedInPublic"`: Users in public.users but not in Supabase Auth
- `"has_public_profile": false`: Auth users without public profiles

## 🛠 **Step 2: Choose Resolution Strategy**

### **Strategy A: Clean Public Database (Most Common)**
**Use when**: Users exist in public.users but not in auth.users

```bash
# Safe cleanup of orphaned public users
curl -X POST "http://localhost:3000/api/users/force-cleanup" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "CLEANUP_ORPHANED_DATA"}'
```

**What it does**:
- ✅ Removes users from public.users who have no auth records
- ✅ Cleans all related data (projects, payments, documents, etc.)
- ✅ Handles foreign key constraints properly
- ✅ Provides detailed cleanup report

### **Strategy B: Clean Auth System (Less Common)**
**Use when**: Users exist in auth.users but not in public.users

```bash
# Remove specific orphaned auth user
curl -X POST "http://localhost:3000/api/debug/delete-auth-user" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "confirm": "DELETE_AUTH_USER"}'
```

**What it does**:
- ✅ Removes user from Supabase Auth
- ✅ Also cleans public.users if exists
- ✅ Targeted removal by email address

### **Strategy C: Create Missing Profiles (Alternative)**
**Use when**: You want to keep auth users and create missing profiles

*Note: This approach requires custom implementation based on your needs*

## 📋 **Step 3: Execute Resolution**

### **Pre-Resolution Checklist**
- [ ] **Backup Current Data**: Take database snapshot if in production
- [ ] **Identify Affected Users**: Note which emails are problematic
- [ ] **Check for Dependencies**: Verify if users have important related data
- [ ] **Notify Stakeholders**: Inform relevant parties about cleanup

### **Resolution Execution**

#### **For Public Database Cleanup**
```bash
# 1. First, check what will be cleaned
curl "http://localhost:3000/api/users/orphaned"

# 2. Review the orphaned users list carefully
# 3. If safe to proceed, run cleanup
curl -X POST "http://localhost:3000/api/users/force-cleanup" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "CLEANUP_ORPHANED_DATA"}'

# 4. Verify cleanup was successful
curl "http://localhost:3000/api/users/orphaned"
```

#### **For Auth System Cleanup**
```bash
# 1. Get list of auth users
curl "http://localhost:3000/api/debug/auth-users"

# 2. Identify orphaned auth users (has_public_profile: false)
# 3. Remove each orphaned auth user
curl -X POST "http://localhost:3000/api/debug/delete-auth-user" \
  -H "Content-Type: application/json" \
  -d '{"email": "PROBLEMATIC_EMAIL", "confirm": "DELETE_AUTH_USER"}'

# 4. Verify removal
curl "http://localhost:3000/api/debug/auth-users"
```

## ✅ **Step 4: Verify Resolution**

### **Test Account Creation**
Try creating the user account that was previously failing:

```bash
# Test user creation (replace with actual values)
curl -X POST "http://localhost:3000/api/users/create" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "123-456-7890",
    "role": "client"
  }'
```

**Expected**: `{"success": true, "message": "User created successfully"}`

### **Verify System Health**
```bash
# Final health check
curl "http://localhost:3000/api/users/orphaned"

# Check user counts match
curl "http://localhost:3000/api/users" | grep -o '"count":[0-9]*'
```

### **Admin Dashboard Verification**
1. Go to `/users` in the admin dashboard
2. Verify user counts are accurate
3. Test "Add User" functionality
4. Confirm no "email taken" errors for cleaned emails

## 🔄 **Step 5: Prevention Setup**

### **Automated Monitoring (Recommended)**
Create a monitoring script that runs daily:

```bash
#!/bin/bash
# daily-health-check.sh

echo "🔍 Daily KoraBuild User Data Health Check"
echo "Date: $(date)"

# Check for orphaned data
ORPHANED=$(curl -s "http://localhost:3000/api/users/orphaned")
STATUS=$(echo $ORPHANED | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$STATUS" = "needs_cleanup" ]; then
    echo "⚠️  ALERT: Orphaned user data detected!"
    echo "Run cleanup: curl -X POST '/api/users/force-cleanup' with confirmation"
    # Send email/Slack notification here
else
    echo "✅ User data is clean and synchronized"
fi

# Check auth vs public user counts
AUTH_DATA=$(curl -s "http://localhost:3000/api/debug/auth-users")
echo "📊 System Health Summary:"
echo $AUTH_DATA | grep -o '"comparison":{[^}]*}'
```

### **Improved Error Handling**
Enhance your user creation process to prevent orphaned data:

```typescript
// In your user creation API
export async function createUser(userData) {
  let authUser = null;
  
  try {
    // Step 1: Create auth user
    authUser = await supabaseAdmin.auth.admin.createUser({...});
    
    // Step 2: Create public profile
    const profile = await supabaseAdmin.from('users').insert({...});
    
    if (profile.error) {
      throw new Error('Failed to create user profile');
    }
    
    return { success: true, user: profile.data };
    
  } catch (error) {
    // Cleanup: Remove auth user if profile creation failed
    if (authUser?.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      console.log('🧹 Cleaned up auth user after profile creation failure');
    }
    
    throw error;
  }
}
```

## 🚨 **Emergency Procedures**

### **If You Can't Access APIs**
Direct database queries (use with caution):

```sql
-- Find orphaned users in public.users
SELECT u.id, u.email, u.full_name 
FROM users u
WHERE u.id NOT IN (
  SELECT id FROM auth.users
);

-- Find users with incomplete profiles
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

### **Manual Cleanup (Last Resort)**
If APIs are unavailable:

```sql
-- DANGER: Only use if APIs are down and you understand the risks

-- 1. First, identify orphaned users
SELECT * FROM users WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Clean related data (order matters!)
DELETE FROM contractors WHERE added_by_user_id IN (SELECT id FROM orphaned_users);
DELETE FROM projects WHERE client_id IN (SELECT id FROM orphaned_users);
-- ... repeat for all related tables

-- 3. Finally, delete orphaned users
DELETE FROM users WHERE id NOT IN (SELECT id FROM auth.users);
```

## 📊 **Regular Maintenance Schedule**

### **Daily** (Automated)
- [ ] Run orphaned data check
- [ ] Monitor user creation success rates
- [ ] Check error logs for user-related failures

### **Weekly**
- [ ] Review user creation metrics
- [ ] Analyze any failed registrations
- [ ] Update monitoring thresholds

### **Monthly**
- [ ] Full system health audit
- [ ] Review and update cleanup procedures
- [ ] Test disaster recovery procedures

## 🎯 **Quick Reference Commands**

### **Diagnosis**
```bash
# Check for issues
curl "http://localhost:3000/api/users/orphaned"

# Detailed analysis
curl "http://localhost:3000/api/debug/auth-users"
```

### **Resolution**
```bash
# Clean public database
curl -X POST "http://localhost:3000/api/users/force-cleanup" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "CLEANUP_ORPHANED_DATA"}'

# Clean specific auth user
curl -X POST "http://localhost:3000/api/debug/delete-auth-user" \
  -H "Content-Type: application/json" \
  -d '{"email": "EMAIL", "confirm": "DELETE_AUTH_USER"}'
```

### **Verification**
```bash
# Test user creation
curl -X POST "http://localhost:3000/api/users/create" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test", "email": "test@example.com", "role": "client"}'

# Final health check
curl "http://localhost:3000/api/users/orphaned"
```

---

## 🎉 **Success Criteria**

You'll know the issue is resolved when:
- ✅ No orphaned data detected
- ✅ User creation works without "email taken" errors
- ✅ Admin dashboard shows accurate user counts
- ✅ System health checks pass

**Remember**: Always test in a safe environment first, and backup your data before running cleanup operations in production! 