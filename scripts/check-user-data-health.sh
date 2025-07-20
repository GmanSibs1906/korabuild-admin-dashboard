#!/bin/bash

# KoraBuild User Data Health Check Script
# Usage: ./check-user-data-health.sh [--auto-fix]

set -e

# Configuration
API_BASE_URL="http://localhost:3000"
LOG_FILE="user-data-health.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Function to check API availability
check_api() {
    log "${BLUE}🔍 Checking API availability...${NC}"
    
    if ! curl -sf "$API_BASE_URL/api/users" > /dev/null 2>&1; then
        log "${RED}❌ API is not accessible at $API_BASE_URL${NC}"
        exit 1
    fi
    
    log "${GREEN}✅ API is accessible${NC}"
}

# Function to check for orphaned data
check_orphaned_data() {
    log "${BLUE}🔍 Checking for orphaned user data...${NC}"
    
    ORPHANED_RESPONSE=$(curl -s "$API_BASE_URL/api/users/orphaned")
    STATUS=$(echo "$ORPHANED_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    COUNT=$(echo "$ORPHANED_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    
    if [ "$STATUS" = "clean" ]; then
        log "${GREEN}✅ No orphaned user data found${NC}"
        return 0
    else
        log "${YELLOW}⚠️  Found $COUNT orphaned users${NC}"
        echo "$ORPHANED_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ORPHANED_RESPONSE"
        return 1
    fi
}

# Function to get system health summary
get_health_summary() {
    log "${BLUE}📊 Getting system health summary...${NC}"
    
    AUTH_RESPONSE=$(curl -s "$API_BASE_URL/api/debug/auth-users")
    
    # Extract comparison data
    AUTH_COUNT=$(echo "$AUTH_RESPONSE" | grep -o '"authCount":[0-9]*' | cut -d':' -f2)
    PUBLIC_COUNT=$(echo "$AUTH_RESPONSE" | grep -o '"publicCount":[0-9]*' | cut -d':' -f2)
    ORPHANED_AUTH=$(echo "$AUTH_RESPONSE" | grep -o '"orphanedInAuth":[0-9]*' | cut -d':' -f2)
    ORPHANED_PUBLIC=$(echo "$AUTH_RESPONSE" | grep -o '"orphanedInPublic":[0-9]*' | cut -d':' -f2)
    
    log "📈 System Health Summary:"
    log "   • Auth users: $AUTH_COUNT"
    log "   • Public users: $PUBLIC_COUNT"
    log "   • Orphaned in auth: $ORPHANED_AUTH"
    log "   • Orphaned in public: $ORPHANED_PUBLIC"
    
    # Check for discrepancies
    if [ "$ORPHANED_AUTH" -gt 0 ] || [ "$ORPHANED_PUBLIC" -gt 0 ]; then
        log "${YELLOW}⚠️  Data synchronization issues detected${NC}"
        return 1
    else
        log "${GREEN}✅ All user data is properly synchronized${NC}"
        return 0
    fi
}

# Function to auto-fix issues
auto_fix() {
    log "${BLUE}🛠️  Attempting automatic cleanup...${NC}"
    
    # Fix orphaned public users
    log "Cleaning orphaned public users..."
    CLEANUP_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/users/force-cleanup" \
        -H "Content-Type: application/json" \
        -d '{"confirm": "CLEANUP_ORPHANED_DATA"}')
    
    if echo "$CLEANUP_RESPONSE" | grep -q '"message"'; then
        log "${GREEN}✅ Public database cleanup completed${NC}"
        echo "$CLEANUP_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CLEANUP_RESPONSE"
    else
        log "${RED}❌ Public database cleanup failed${NC}"
        echo "$CLEANUP_RESPONSE"
    fi
    
    # Check for orphaned auth users and clean them
    AUTH_RESPONSE=$(curl -s "$API_BASE_URL/api/debug/auth-users")
    ORPHANED_AUTH_USERS=$(echo "$AUTH_RESPONSE" | grep -o '"has_public_profile":false' | wc -l)
    
    if [ "$ORPHANED_AUTH_USERS" -gt 0 ]; then
        log "${YELLOW}Found $ORPHANED_AUTH_USERS orphaned auth users${NC}"
        log "${BLUE}Note: Auth user cleanup requires manual review of specific emails${NC}"
        log "Use: curl -X POST '$API_BASE_URL/api/debug/delete-auth-user' -d '{\"email\":\"EMAIL\",\"confirm\":\"DELETE_AUTH_USER\"}'"
    fi
}

# Function to test user creation
test_user_creation() {
    log "${BLUE}🧪 Testing user creation functionality...${NC}"
    
    TEST_EMAIL="health-check-test-$(date +%s)@example.com"
    
    CREATE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/users/create" \
        -H "Content-Type: application/json" \
        -d "{
            \"full_name\": \"Health Check Test User\",
            \"email\": \"$TEST_EMAIL\",
            \"phone\": \"555-TEST\",
            \"role\": \"client\"
        }")
    
    if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
        log "${GREEN}✅ User creation test passed${NC}"
        
        # Clean up test user
        USER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$USER_ID" ]; then
            curl -s -X DELETE "$API_BASE_URL/api/users/$USER_ID" \
                -H "Content-Type: application/json" \
                -d '{"confirmationText": "DELETE"}' > /dev/null
            log "🧹 Cleaned up test user"
        fi
    else
        log "${RED}❌ User creation test failed${NC}"
        echo "$CREATE_RESPONSE"
        return 1
    fi
}

# Function to generate report
generate_report() {
    log "${BLUE}📋 Generating health report...${NC}"
    
    REPORT_FILE="user-data-health-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat << EOF > "$REPORT_FILE"
KoraBuild User Data Health Report
Generated: $TIMESTAMP

=== SYSTEM STATUS ===
$(curl -s "$API_BASE_URL/api/users/orphaned" | python3 -m json.tool 2>/dev/null || echo "Failed to get orphaned data")

=== DETAILED ANALYSIS ===
$(curl -s "$API_BASE_URL/api/debug/auth-users" | python3 -m json.tool 2>/dev/null || echo "Failed to get auth analysis")

=== RECOMMENDATIONS ===
EOF

    if check_orphaned_data > /dev/null 2>&1; then
        echo "✅ No action required - system is healthy" >> "$REPORT_FILE"
    else
        echo "⚠️  Action required - run cleanup procedures" >> "$REPORT_FILE"
        echo "Cleanup command: curl -X POST '$API_BASE_URL/api/users/force-cleanup' -d '{\"confirm\": \"CLEANUP_ORPHANED_DATA\"}'" >> "$REPORT_FILE"
    fi
    
    log "${GREEN}📄 Report saved to: $REPORT_FILE${NC}"
}

# Main execution
main() {
    log "${BLUE}🚀 Starting KoraBuild User Data Health Check${NC}"
    log "Time: $TIMESTAMP"
    
    # Check if auto-fix is requested
    AUTO_FIX=false
    if [ "$1" = "--auto-fix" ]; then
        AUTO_FIX=true
        log "${YELLOW}🔧 Auto-fix mode enabled${NC}"
    fi
    
    # Run checks
    check_api
    
    ISSUES_FOUND=false
    
    if ! check_orphaned_data; then
        ISSUES_FOUND=true
    fi
    
    if ! get_health_summary; then
        ISSUES_FOUND=true
    fi
    
    # Test functionality
    if ! test_user_creation; then
        ISSUES_FOUND=true
    fi
    
    # Handle issues
    if [ "$ISSUES_FOUND" = true ]; then
        if [ "$AUTO_FIX" = true ]; then
            auto_fix
            
            # Re-check after auto-fix
            log "${BLUE}🔍 Re-checking after auto-fix...${NC}"
            check_orphaned_data
            get_health_summary
        else
            log "${YELLOW}⚠️  Issues found. Run with --auto-fix to attempt automatic resolution${NC}"
        fi
    else
        log "${GREEN}🎉 All checks passed - system is healthy!${NC}"
    fi
    
    # Generate report
    generate_report
    
    log "${BLUE}✅ Health check completed${NC}"
}

# Run the script
main "$@" 