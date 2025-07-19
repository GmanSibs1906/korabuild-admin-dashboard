# KoraBuild Request System Implementation Plan
*Phase-by-Phase Development Strategy for Mobile App & Admin Dashboard*

## 📋 Project Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │◄──►│    Supabase     │◄──►│ Admin Dashboard │
│  (React Native) │    │   (Database)    │    │   (Next.js)     │
│   TypeScript    │    │   PostgreSQL    │    │   TypeScript    │
│   NativeWind    │    │   Realtime      │    │   Tailwind CSS  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🆕 **Implemented Request System Design**

The request system now has **two main categories** with specific subcategories and a **two-stage submission flow**:

#### **1. 🏗️ REQUEST A SERVICE**
- **Plan** - Architectural plans, design services
- **BOQ** - Bill of Quantities, cost estimation
- **Project Management** - Timeline, coordination
- **Consultation** - Expert advice, technical support
- **Inspection** - Quality checks, compliance
- **Site Visit** - On-site assessment, evaluation

#### **2. 🧱 REQUEST MATERIALS**
- **Foundation** - Concrete, rebar, excavation materials
- **Super-Structure** - Framing, structural elements
- **Roofing** - Tiles, waterproofing, gutters
- **Finishes** - Paint, flooring, fixtures, trim

#### **🔄 Two-Stage Request Submission Flow** *(IMPLEMENTED)*
- **Stage 1**: Request form submission with option to upload documents
- **Stage 2**: Optional document upload via DocumentsScreen integration
- **Global FAB**: Floating Action Button accessible from all screens

#### **📝 Universal Fields for All Requests** *(IMPLEMENTED)*
- **Address** - Project/delivery location
- **Brief Description** - Client provides detailed requirements with auto-append for document uploads
- **Document Upload Option** - Checkbox to indicate supporting documents will be attached
- **Category Selection** - Service vs Materials via global FAB

---

## 🚀 Implementation Progress

### ✅ **Phase 1A: Database & API Foundation** *(COMPLETED)*
- [x] Extended requests table with new request types (7 types)
- [x] Added flexible JSONB data storage
- [x] Created request_comments and request_status_history tables
- [x] Implemented comprehensive RLS policies with timing fixes
- [x] Created TypeScript interfaces (src/types/requests.ts)
- [x] Built RTK Query API with security verification (src/store/api/requestsAPI.ts)
- [x] Added Redux integration to store configuration
- [x] Performance indexes and monitoring functions
- [x] Universal dynamic testing system for 1000+ users

### ✅ **Phase 1B: Enhanced Request System & Global FAB** *(COMPLETED)*
- [x] **Global Floating Action Button (FAB)** - Accessible from all screens in app
- [x] **RequestModalContext** - Global state management for request modal
- [x] **Two-stage request flow** - Form submission first, optional upload second
- [x] **Enhanced RequestForm** - Service/Materials categorization with upload checkbox
- [x] **RequestModal integration** - Pre-selection support and global context
- [x] **DocumentsScreen integration** - Second stage upload with auto-modal opening
- [x] **PIN session management** - Prevents logout during document uploads
- [x] **Global FAB visibility** - Added to all specified screens:
  - [x] Materials and Deliveries (OrdersScreen)
  - [x] View Payment Breakdown (PaymentBreakdownScreen)
  - [x] Contractors (TeamCoordinationScreen)
  - [x] Documents (DocumentsScreen)
  - [x] Project Calendar (ScheduleScreen)
  - [x] All bottom tab screens via BottomTabNavigator
- [x] **Navigation integration** - MainNavigator wrapped with RequestModalProvider
- [x] **TypeScript fixes** - Resolved all linter errors and type issues
- [x] **Error handling** - Defensive programming for RTK Query refetch issues

### ✅ **Phase 1C: Request System Architecture** *(COMPLETED)*
- [x] **Higher-Order Component (HOC)** - `withRequestFAB` for easy screen integration
- [x] **Context Architecture** - `RequestModalContext` for global state management
- [x] **Component Reusability** - `GlobalRequestProvider` for screen wrapping
- [x] **Critical Operation Management** - `criticalOperationInProgress` Redux state
- [x] **App State Handling** - Background/foreground PIN session management
- [x] **Request Modal Rendering** - Global modal renderer with context integration

### 📅 **Phase 2: Admin Dashboard Integration** *(READY FOR DEVELOPMENT)*
- [ ] **Admin Dashboard Request Management** - Display service/material requests
- [ ] **Request Status Updates** - Admin workflow for processing requests
- [ ] **Document Review System** - Admin review of uploaded plans and documents
- [ ] **Request Analytics** - Dashboard metrics and reporting
- [ ] **Real-time Notifications** - Admin alerts for new requests
- [ ] **Bulk Request Operations** - Mass status updates and actions

---

## 🎨 Implemented Request Flow UX

### **Global FAB Access Pattern** *(IMPLEMENTED)*
```
┌─────────────────────────────────────┐
│           ANY SCREEN                │
│                                     │
│                           ┌─────┐   │
│                           │ FAB │ ◄─── Always visible
│                           │ +   │     bottom right
│                           └─────┘   │
└─────────────────────────────────────┘
```

### **Step 1: Category Selection via FAB** *(IMPLEMENTED)*
```
┌─────────────────────────────────────┐
│          FAB OPTIONS MODAL          │
├─────────────────────────────────────┤
│                                     │
│  🏗️  [  REQUEST A SERVICE  ]       │
│      Plans, BOQ, Consultation       │
│                                     │
│  🧱  [  REQUEST MATERIALS  ]       │
│      Foundation, Roofing, etc.      │
│                                     │
└─────────────────────────────────────┘
```

### **Step 2: Request Details Form** *(IMPLEMENTED)*
```
┌─────────────────────────────────────┐
│    [SERVICE/MATERIAL] REQUEST       │
├─────────────────────────────────────┤
│  📍 Address                         │
│  [                              ]   │
│                                     │
│  📝 Brief Description               │
│  [                              ]   │
│  [                              ]   │
│  [                              ]   │
│                                     │
│  ☑️ Upload supporting documents     │
│                                     │
│  [          NEXT          ]        │
└─────────────────────────────────────┘
```

### **Step 3: Success & Optional Upload** *(IMPLEMENTED)*
```
┌─────────────────────────────────────┐
│         FORM SUBMITTED!             │
├─────────────────────────────────────┤
│                                     │
│  ✅ Your request has been submitted │
│                                     │
│  [    UPLOAD DOCUMENTS    ]         │
│                                     │
│  [         DONE         ]           │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### **1. Global FAB Architecture** *(IMPLEMENTED)*

```typescript
// RequestModalContext for global state management
export const RequestModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [initialCategory, setInitialCategory] = useState<RequestCategory | undefined>();

  const showRequestModal = (category?: RequestCategory) => {
    setInitialCategory(category);
    setIsVisible(true);
  };

  const hideRequestModal = () => {
    setIsVisible(false);
    setInitialCategory(undefined);
  };

  return (
    <RequestModalContext.Provider value={{ isVisible, initialCategory, showRequestModal, hideRequestModal }}>
      {children}
    </RequestModalContext.Provider>
  );
};

// FloatingActionButton component with beautiful animations
export const FloatingActionButton: React.FC = () => {
  const [showOptions, setShowOptions] = useState(false);
  const { showRequestModal } = useRequestModal();
  // ... animated overlay implementation
};
```

### **2. Two-Stage Request Flow** *(IMPLEMENTED)*

```typescript
// Stage 1: Form submission with optional upload checkbox
const [wantsToUploadDocuments, setWantsToUploadDocuments] = useState(false);

const handleSubmit = async () => {
  let description = briefDescription.trim();
  if (wantsToUploadDocuments) {
    description += "\n\n📎 Supporting documents will be attached.";
  }
  
  const result = await createRequest({ /* form data */ }).unwrap();
  
  if (wantsToUploadDocuments) {
    setShowSuccessModal(true); // Show upload option
  } else {
    // Close modal, show success toast
  }
};

// Stage 2: Navigate to DocumentsScreen for upload
const handleUploadDocuments = () => {
  setShowSuccessModal(false);
  onClose();
  navigation.navigate('Documents', { openUploadModal: true });
};
```

### **3. Navigation Integration** *(IMPLEMENTED)*

```typescript
// MainNavigator.tsx - Global context provider
export const MainNavigator: React.FC = () => {
  return (
    <RequestModalProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/* All screens have access to RequestModalContext */}
        </Stack.Navigator>
      </NavigationContainer>
    </RequestModalProvider>
  );
};

// BottomTabNavigator.tsx - FAB on tab screens
const GlobalRequestModal = () => {
  const { isVisible, initialCategory, hideRequestModal } = useRequestModal();
  return <RequestModal visible={isVisible} onClose={hideRequestModal} initialCategory={initialCategory} />;
};

export const BottomTabNavigator: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator>
        {/* Tab screens */}
      </Tab.Navigator>
      <FloatingActionButton />
      <GlobalRequestModal />
    </View>
  );
};
```

### **4. Critical Operation Management** *(IMPLEMENTED)*

```typescript
// Redux slice for critical operations
export const appSlice = createSlice({
  name: 'app',
  initialState: {
    criticalOperationInProgress: false,
  },
  reducers: {
    setCriticalOperationInProgress: (state, action) => {
      state.criticalOperationInProgress = action.payload;
    },
  },
});

// App state handler prevents logout during uploads
const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
  if (nextAppState === 'active' && appState.current === 'background') {
    if (criticalOperationInProgress) {
      PinService.extendPinSession(); // Prevent logout
    } else {
      // Normal session validation
    }
  }
}, [criticalOperationInProgress]);
```

---

## 📊 Request Data Structure for Admin Dashboard

### **Enhanced Request Object** *(READY FOR ADMIN CONSUMPTION)*

```typescript
interface Request {
  id: string;
  user_id: string;
  project_id?: string;
  
  // New category system
  category: 'service' | 'material';
  subcategory: string; // plan, boq, foundation, etc.
  
  // Core request data
  brief_description: string;
  address: string;
  
  // Status and metadata
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Document tracking
  has_documents: boolean;
  document_urls?: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Admin workflow
  assigned_to?: string;
  admin_notes?: string;
  estimated_completion?: string;
}
```

### **Request Categories Configuration** *(FOR ADMIN DASHBOARD)*

```typescript
export const requestConfig = {
  service: {
    icon: '🏗️',
    title: 'Service Requests',
    color: '#fe6700',
    subcategories: {
      plan: { title: 'Architectural Plans', icon: '📐' },
      boq: { title: 'Bill of Quantities', icon: '📊' },
      project_management: { title: 'Project Management', icon: '🎯' },
      consultation: { title: 'Consultation', icon: '💬' },
      inspection: { title: 'Inspection', icon: '🔍' },
      site_visit: { title: 'Site Visit', icon: '📍' }
    }
  },
  material: {
    icon: '🧱',
    title: 'Material Requests', 
    color: '#28a745',
    subcategories: {
      foundation: { title: 'Foundation Materials', icon: '🏗️' },
      super_structure: { title: 'Super-Structure', icon: '🏢' },
      roofing: { title: 'Roofing Materials', icon: '🏠' },
      finishes: { title: 'Finishing Materials', icon: '✨' }
    }
  }
};
```

---

## 🎯 Admin Dashboard Development Guide

### **Ready-to-Use API Endpoints** *(IMPLEMENTED)*

```typescript
// All these endpoints are ready for admin dashboard consumption:

// 1. Get all requests with filtering
const { data: requests } = useGetRequestsQuery({
  status: 'pending',
  category: 'service',
  limit: 50
});

// 2. Get request details with documents
const { data: requestDetails } = useGetRequestDetailsQuery(requestId);

// 3. Update request status
const [updateRequestStatus] = useUpdateRequestStatusMutation();

// 4. Add admin comments
const [addRequestComment] = useAddRequestCommentMutation();

// 5. Get request analytics
const { data: analytics } = useGetRequestAnalyticsQuery();
```

### **Admin Dashboard Features to Implement**

#### **1. Request Management Dashboard**
- [ ] **Request List View** - Filterable by category, status, priority
- [ ] **Request Detail View** - Full request information with documents
- [ ] **Status Workflow** - Drag-and-drop status updates
- [ ] **Bulk Operations** - Select multiple requests for batch actions
- [ ] **Search & Filter** - Advanced filtering by date, user, category

#### **2. Document Management**
- [ ] **Document Viewer** - PDF/image preview in browser
- [ ] **Document Approval** - Approve/reject uploaded plans
- [ ] **Document Comments** - Add notes and feedback on documents
- [ ] **Document Versioning** - Track document revisions

#### **3. Analytics & Reporting**
- [ ] **Request Metrics** - Volume, completion rates, response times
- [ ] **Category Analysis** - Most requested services/materials
- [ ] **Performance Tracking** - Admin efficiency metrics
- [ ] **Client Insights** - Request patterns per client

#### **4. Real-time Features**
- [ ] **Live Updates** - Real-time request notifications
- [ ] **Admin Chat** - Communication with clients
- [ ] **Status Broadcasting** - Auto-notify clients of updates

---

## 🚀 Next Steps for Admin Dashboard

### **Immediate Actions** *(READY TO START)*

1. ✅ **Mobile App Request System** - COMPLETED
2. 🔄 **Admin Dashboard Setup** - Use Next.js with TypeScript
3. 🔄 **Supabase Integration** - Connect to existing database
4. 🔄 **Request List Component** - Display requests with filters
5. 🔄 **Request Detail Component** - Show full request information
6. 🔄 **Status Update System** - Admin workflow for processing
7. 🔄 **Document Integration** - Display and manage uploaded documents
8. 🔄 **Analytics Dashboard** - Request metrics and insights

### **Database Schema Ready** *(NO CHANGES NEEDED)*
- ✅ Requests table with proper categorization
- ✅ Request comments and status history
- ✅ Document storage integration
- ✅ RLS policies for admin access
- ✅ Performance indexes and monitoring

### **API Endpoints Ready** *(ALL IMPLEMENTED)*
- ✅ `useGetRequestsQuery` - List requests with filters
- ✅ `useGetRequestDetailsQuery` - Request details
- ✅ `useUpdateRequestStatusMutation` - Status updates
- ✅ `useAddRequestCommentMutation` - Admin comments
- ✅ `useGetRequestAnalyticsQuery` - Analytics data

---

## 🎉 **System Status: READY FOR ADMIN DASHBOARD DEVELOPMENT**

The mobile app request system is **fully implemented** with:

✅ **Two-stage request flow** (form → optional upload)  
✅ **Global FAB** accessible from all screens  
✅ **Service/Material categorization** with subcategories  
✅ **Document upload integration** with DocumentsScreen  
✅ **PIN session management** preventing logout during uploads  
✅ **Global state management** via RequestModalContext  
✅ **TypeScript strict compliance** with all errors resolved  
✅ **Error handling** for all edge cases  
✅ **Database schema** optimized for admin consumption  
✅ **API endpoints** ready for admin dashboard integration  

**The admin dashboard can now be built using the existing API endpoints and database structure with no further mobile app changes required.**

---

## 📋 Admin Dashboard Development Checklist

### **Phase 2A: Dashboard Foundation**
- [ ] Setup Next.js 14 with TypeScript and Tailwind CSS
- [ ] Configure Supabase client for admin access
- [ ] Create admin authentication system
- [ ] Setup project structure and routing

### **Phase 2B: Request Management**
- [ ] Create request list component with filtering
- [ ] Build request detail view with document preview
- [ ] Implement status update workflow
- [ ] Add admin comment system

### **Phase 2C: Analytics & Reporting**
- [ ] Create analytics dashboard with charts
- [ ] Build request metrics and insights
- [ ] Add performance tracking for admin efficiency
- [ ] Implement client request pattern analysis

### **Phase 2D: Real-time Features**
- [ ] Setup real-time request notifications
- [ ] Add live status updates
- [ ] Create admin-client communication system
- [ ] Implement automated client notifications

**This implementation plan provides a complete roadmap for admin dashboard development with all mobile app foundations already in place.** 