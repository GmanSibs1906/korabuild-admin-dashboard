# 📦 Material Orders Control Panel - Testing Guide

## 🎯 Overview
This testing guide covers the enhanced MaterialOrdersControlPanel with complete CRUD operations for orders, deliveries, and suppliers. The system integrates seamlessly with the mobile app KoraBuild and ensures all data is dynamic from the database.

## 🏗️ **Phase 9A: Orders Management CRUD - Testing Instructions**

### 📋 Prerequisites
1. ✅ KoraBuild Admin Dashboard running on `http://localhost:3000`
2. ✅ KoraBuild Mobile App database connected to same Supabase instance
3. ✅ Test project ID: `550e8400-e29b-41d4-a716-446655440001`
4. ✅ Sample suppliers and inventory data in database

### 🔧 **Test 1: Order Creation (OrderCreateModal)**

#### Step 1: Access Material Orders Control
1. Navigate to `http://localhost:3000/mobile-control`
2. Click "Material Orders Control" button
3. Verify the MaterialOrdersControlPanel opens with 4 tabs

#### Step 2: Create New Order
1. Click "Orders" tab
2. Click "New Order" button
3. **Expected Result**: OrderCreateModal opens with form fields

#### Step 3: Fill Order Form
```json
{
  "supplier_id": "Select from dropdown",
  "order_date": "2024-01-15",
  "expected_delivery_date": "2024-01-25",
  "priority": "medium",
  "order_items": [
    {
      "item_description": "Concrete blocks (8x8x16)",
      "quantity_ordered": 100,
      "unit_cost": 12.50,
      "line_total": 1250.00
    }
  ],
  "special_instructions": "Handle with care",
  "delivery_address": "123 Construction Site Ave"
}
```

#### Step 4: Verify Calculations
- **Subtotal**: Should auto-calculate: R1,250.00
- **Tax (15%)**: Should auto-calculate: R187.50
- **Total**: Should auto-calculate: R1,437.50

#### Step 5: Submit Order
1. Click "Create Order" button
2. **Expected Result**: Order created successfully
3. **Verify**: New order appears in Orders tab
4. **Verify**: Order has auto-generated order number (ORD-XXXXX format)

#### API Test:
```bash
# Test the API directly
curl -X POST "http://localhost:3000/api/mobile-control/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440001",
    "orderData": {
      "supplier_id": "supplier-uuid-here",
      "order_date": "2024-01-15",
      "expected_delivery_date": "2024-01-25",
      "priority": "medium",
      "order_items": [
        {
          "item_description": "Concrete blocks (8x8x16)",
          "quantity_ordered": 100,
          "unit_cost": 12.50,
          "line_total": 1250.00
        }
      ],
      "subtotal": 1250.00,
      "tax_amount": 187.50,
      "total_amount": 1437.50,
      "special_instructions": "Handle with care",
      "delivery_address": "123 Construction Site Ave"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-XXXXX",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "supplier_id": "supplier-uuid",
    "status": "draft",
    "total_amount": 1437.50,
    "suppliers": {
      "supplier_name": "ABC Construction Supplies"
    },
    "order_items": [...]
  },
  "message": "Order ORD-XXXXX created successfully"
}
```

### 🔧 **Test 2: Order Editing (OrderEditModal)**

#### Step 1: Edit Existing Order
1. Find the order created in Test 1
2. Click "Edit" button
3. **Expected Result**: OrderEditModal opens with pre-populated data

#### Step 2: Modify Order
- Change priority from "medium" to "high"
- Update delivery address
- Change status to "confirmed"

#### Step 3: Save Changes
1. Click "Update Order" button
2. **Expected Result**: Order updated successfully
3. **Verify**: Changes reflected in Orders tab
4. **Verify**: Priority badge shows "High" with red background

#### API Test:
```bash
# Test order update API
curl -X POST "http://localhost:3000/api/mobile-control/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update",
    "orderId": "order-uuid-here",
    "updates": {
      "priority": "high",
      "status": "confirmed",
      "delivery_address": "456 New Construction Site"
    }
  }'
```

### 🔧 **Test 3: Order Deletion**

#### Step 1: Delete Order
1. Find an order without deliveries
2. Click "Delete" button
3. **Expected Result**: Confirmation dialog appears

#### Step 2: Confirm Deletion
1. Click "OK" in confirmation dialog
2. **Expected Result**: Order deleted successfully
3. **Verify**: Order no longer appears in Orders tab

#### API Test:
```bash
# Test order deletion API
curl -X POST "http://localhost:3000/api/mobile-control/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "orderId": "order-uuid-here"
  }'
```

### 🔧 **Test 4: Mobile App Integration**

#### Step 1: Check Mobile App Data
1. Open KoraBuild Mobile App
2. Navigate to Orders/Materials section
3. **Expected Result**: New orders appear in mobile app
4. **Verify**: Order data matches admin dashboard

#### Step 2: Test Real-time Sync
1. Create order in admin dashboard
2. Check mobile app immediately
3. **Expected Result**: Order appears in mobile app within 5 seconds

#### Mobile API Test:
```bash
# Test mobile app endpoint
curl -X GET "http://localhost:3000/api/mobile-control/orders?projectId=550e8400-e29b-41d4-a716-446655440001"
```

**Expected Mobile Response:**
```json
{
  "success": true,
  "data": {
    "mobileData": {
      "recentOrders": [
        {
          "id": "order-uuid",
          "order_number": "ORD-XXXXX",
          "supplier_name": "ABC Construction Supplies",
          "total_amount": 1437.50,
          "status": "confirmed",
          "order_date": "2024-01-15"
        }
      ],
      "ordersSummary": {
        "totalValue": 1437.50,
        "pendingCount": 0,
        "deliveredCount": 0
      }
    }
  }
}
```

### 🔧 **Test 5: Data Validation**

#### Step 1: Test Required Fields
1. Try to create order without supplier
2. **Expected Result**: Error "Please select a supplier"

#### Step 2: Test Order Items Validation
1. Try to create order with quantity = 0
2. **Expected Result**: Error "Quantity must be greater than 0"

#### Step 3: Test Negative Values
1. Try to enter negative unit cost
2. **Expected Result**: Error "Unit cost cannot be negative"

### 🔧 **Test 6: Performance Testing**

#### Step 1: Load Testing
1. Create 50 orders using API
2. **Expected Result**: All orders load within 2 seconds

#### Step 2: Modal Performance
1. Open OrderCreateModal
2. **Expected Result**: Modal opens within 500ms

#### Step 3: Calculation Performance
1. Add 20 order items
2. **Expected Result**: Calculations update within 100ms

### 🔧 **Test 7: Error Handling**

#### Step 1: Network Error
1. Disconnect internet
2. Try to create order
3. **Expected Result**: "Network error occurred" message

#### Step 2: Server Error
1. Stop Supabase service
2. Try to create order
3. **Expected Result**: Proper error message displayed

#### Step 3: Invalid Data
1. Send malformed JSON to API
2. **Expected Result**: 400 Bad Request response

### 🔧 **Test 8: Security Testing**

#### Step 1: Access Control
1. Test API without authentication
2. **Expected Result**: Proper authentication required

#### Step 2: Input Sanitization
1. Try to input SQL injection in form fields
2. **Expected Result**: Input properly sanitized

#### Step 3: Data Validation
1. Send invalid UUID as project ID
2. **Expected Result**: Proper validation error

### 📊 **Success Criteria**

#### ✅ Functional Requirements
- [ ] Order creation works with all fields
- [ ] Order editing pre-populates form correctly
- [ ] Order deletion works with confirmation
- [ ] All calculations are accurate
- [ ] Real-time mobile app sync works
- [ ] No hardcoded data anywhere

#### ✅ Performance Requirements
- [ ] Order creation < 2 seconds
- [ ] Modal opening < 500ms
- [ ] Calculations < 100ms
- [ ] List loading < 1 second

#### ✅ Security Requirements
- [ ] Authentication required
- [ ] Input validation works
- [ ] No SQL injection vulnerabilities
- [ ] Proper error handling

#### ✅ Mobile Integration
- [ ] Orders appear in mobile app
- [ ] Real-time sync works
- [ ] Data format matches mobile requirements
- [ ] Mobile API endpoints work

## 🐛 **Common Issues & Solutions**

### Issue 1: Modal Not Opening
**Problem**: OrderCreateModal doesn't open
**Solution**: Check console for JavaScript errors, verify UI components are properly imported

### Issue 2: Calculations Not Working
**Problem**: Totals don't update automatically
**Solution**: Verify useEffect dependencies are correct

### Issue 3: API Errors
**Problem**: 500 Internal Server Error
**Solution**: Check Supabase connection, verify database schema

### Issue 4: Mobile App Not Syncing
**Problem**: Orders don't appear in mobile app
**Solution**: Check API endpoint format, verify mobile app is calling correct endpoint

## 📈 **Monitoring & Debugging**

### Console Logging
```javascript
// Check browser console for these logs:
console.log('📦 New order created:', newOrder);
console.log('📦 Order updated:', updatedOrder);
console.log('📦 Orders data loaded successfully:', result.data);
```

### API Response Monitoring
```bash
# Monitor API responses
curl -X GET "http://localhost:3000/api/mobile-control/orders?projectId=550e8400-e29b-41d4-a716-446655440001" | jq '.'
```

### Database Verification
```sql
-- Check orders in database
SELECT * FROM project_orders WHERE project_id = '550e8400-e29b-41d4-a716-446655440001';

-- Check order items
SELECT * FROM order_items WHERE order_id IN (
  SELECT id FROM project_orders WHERE project_id = '550e8400-e29b-41d4-a716-446655440001'
);
```

## 🎯 **Next Steps**

After completing these tests successfully:

1. **✅ Mark Phase 9A as Complete** 
2. **➡️ Move to Phase 9B: Deliveries Management CRUD**
3. **🔄 Continue with Phase 9C: Suppliers Management CRUD**
4. **🏁 Complete Phase 9D: Integration & Testing**

## 🔗 **Related Documentation**

- [KoraBuild_Admin_Dashboard_Development_Prompt.md](./KoraBuild_Admin_Dashboard_Development_Prompt.md)
- [KoraBuild_Development_Prompt.md](./KoraBuild_Development_Prompt.md)
- [Supabase Database Schema](./sql_scema_from_superbase)

---

**🎉 Ready to Test!** Follow this guide step by step to ensure the MaterialOrdersControlPanel CRUD operations work perfectly with the mobile app integration. 