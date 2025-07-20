# 🛡️ **Future Issue Prevention - Quick Reference**

## 🚨 **If This Issue Happens Again**

### **Step 1: Quick Diagnosis (30 seconds)**
```bash
# Check for orphaned data
curl "http://localhost:3000/api/users/orphaned"

# If count > 0, you have orphaned data to clean
```

### **Step 2: One-Command Fix (Most Cases)**
```bash
# Clean orphaned public database users
curl -X POST "http://localhost:3000/api/users/force-cleanup" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "CLEANUP_ORPHANED_DATA"}'
```

### **Step 3: Fix Auth Issues (If Needed)**
```bash
# Get list of auth users without profiles
curl "http://localhost:3000/api/debug/auth-users"

# Remove specific orphaned auth user
curl -X POST "http://localhost:3000/api/debug/delete-auth-user" \
  -H "Content-Type: application/json" \
  -d '{"email": "PROBLEMATIC_EMAIL", "confirm": "DELETE_AUTH_USER"}'
```

### **Step 4: Verify Fix**
```bash
# Should return: {"status": "clean", "count": 0}
curl "http://localhost:3000/api/users/orphaned"

# Test user creation works
curl -X POST "http://localhost:3000/api/users/create" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test User", "email": "test@example.com", "role": "client"}'
```

## 🔄 **Automated Monitoring Setup**

### **Run Health Check Script**
```bash
# Manual check
./scripts/check-user-data-health.sh

# Auto-fix mode
./scripts/check-user-data-health.sh --auto-fix
```

### **Set Up Daily Monitoring (Recommended)**
Add to your crontab for daily checks:

```bash
# Edit crontab
crontab -e

# Add this line for daily 9 AM checks
0 9 * * * cd /path/to/korabuild-admin-dashboard && ./scripts/check-user-data-health.sh --auto-fix >> logs/daily-health.log 2>&1
```

### **Set Up Alerts**
Create alert script (`scripts/alert-on-issues.sh`):

```bash
#!/bin/bash
ISSUES=$(curl -s "http://localhost:3000/api/users/orphaned" | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ "$ISSUES" -gt 0 ]; then
    # Send email/Slack notification
    echo "🚨 KoraBuild Alert: $ISSUES orphaned users detected" | mail -s "User Data Issue" admin@yourcompany.com
fi
```

## 🔧 **Improved Error Handling**

### **Update User Creation API**
Add this cleanup logic to your user creation process:

```typescript
// src/app/api/users/create/route.ts - Enhanced version
export async function POST(request: Request) {
  let authUser = null;
  
  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({...});
    
    if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
    
    // Create public profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({...})
      .select('*')
      .single();
    
    if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);
    
    return NextResponse.json({ success: true, user: userProfile });
    
  } catch (error) {
    // CRITICAL: Cleanup auth user if profile creation failed
    if (authUser?.user?.id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log('🧹 Cleaned up orphaned auth user:', authUser.user.email);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
        // Log this for manual cleanup later
      }
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## 📊 **Regular Maintenance**

### **Weekly Health Check**
```bash
# Run comprehensive check
./scripts/check-user-data-health.sh

# Review logs
tail -f logs/daily-health.log
```

### **Monthly Deep Clean**
```bash
# Full system audit
curl "http://localhost:3000/api/debug/auth-users" > monthly-audit.json

# Check for any patterns in failures
grep "ERROR" logs/*.log | tail -20
```

## 🚨 **Emergency Procedures**

### **If APIs Are Down**
Direct database access (use with extreme caution):

```sql
-- Check for orphaned users
SELECT 
    'auth_only' as type, 
    au.email, 
    au.created_at 
FROM auth.users au 
LEFT JOIN public.users pu ON au.id = pu.id 
WHERE pu.id IS NULL

UNION ALL

SELECT 
    'public_only' as type, 
    pu.email, 
    pu.created_at 
FROM public.users pu 
LEFT JOIN auth.users au ON pu.id = au.id 
WHERE au.id IS NULL;
```

### **Emergency Contact Info**
- **Database Admin**: [Your DB admin contact]
- **System Admin**: [Your system admin contact]  
- **Escalation**: [Emergency escalation contact]

## 📋 **Prevention Checklist**

### **Before Major Changes**
- [ ] Backup user data
- [ ] Run health check
- [ ] Test user creation in staging
- [ ] Verify cleanup procedures work

### **After User Import/Migration**
- [ ] Run full health check
- [ ] Verify all users have complete profiles
- [ ] Test random user login
- [ ] Check for any orphaned data

### **Monthly Maintenance**
- [ ] Review health check logs
- [ ] Update monitoring thresholds
- [ ] Test emergency procedures
- [ ] Update documentation

## 🎯 **Success Indicators**

You'll know prevention is working when:
- ✅ Daily health checks pass consistently
- ✅ Zero "email taken" errors for legitimate requests
- ✅ User creation success rate > 99%
- ✅ Auth and public user counts always match
- ✅ No manual intervention needed for user issues

## 📞 **Quick Help Commands**

```bash
# Check system health
curl "http://localhost:3000/api/users/orphaned"

# Get user counts
curl "http://localhost:3000/api/users" | grep '"count"'

# Run automated fix
./scripts/check-user-data-health.sh --auto-fix

# View recent health logs
tail -20 user-data-health.log
```

---

**Remember**: The key to preventing future issues is **automated monitoring** and **improved error handling** in the user creation process. Set up the daily health check and you'll catch issues before they become problems! 