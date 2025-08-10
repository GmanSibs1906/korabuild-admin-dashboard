# 🔔 KoraBuild Notification Triggers Schema & Mobile App Compatibility Guide

## 📋 Overview

This document provides the complete SQL schema for KoraBuild Admin Dashboard notification triggers and serves as a reference guide for mobile app developers to ensure compatibility when implementing their own notification triggers.

## 🚨 CRITICAL COMPATIBILITY RULES

### ⚠️ DO NOT MODIFY EXISTING TRIGGERS
- **NEVER** drop or modify existing admin dashboard triggers
- **NEVER** change the `notifications` table structure without coordination
- **ALWAYS** test mobile app triggers in a separate environment first

### ✅ SAFE PRACTICES FOR MOBILE APP TRIGGERS
1. **Use unique trigger names** (prefix with `mobile_` or `app_`)
2. **Use conditional logic** to avoid conflicts
3. **Test thoroughly** before production deployment
4. **Document all changes** in this file

---

## 📊 Database Tables Schema

### 1. **notifications** Table (Core Structure)
```sql
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,                                    -- FK to users table
  project_id uuid,                                 -- FK to projects table
  notification_type character varying NOT NULL 
    CHECK (notification_type::text = ANY (ARRAY[
      'message'::character varying, 
      'project_update'::character varying, 
      'payment_due'::character varying, 
      'milestone_complete'::character varying, 
      'document_upload'::character varying, 
      'emergency'::character varying, 
      'general'::character varying, 
      'system'::character varying
    ]::text[])),
  title character varying NOT NULL,
  message text NOT NULL,
  entity_id uuid,                                  -- References the specific entity (document, request, etc.)
  entity_type character varying,                   -- 'document', 'request', 'order', 'contractor_assignment'
  priority_level character varying DEFAULT 'normal'::character varying 
    CHECK (priority_level::text = ANY (ARRAY[
      'low'::character varying, 
      'normal'::character varying, 
      'high'::character varying, 
      'urgent'::character varying
    ]::text[])),
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  action_url text,                                 -- Deep link URL for navigation
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,              -- Flexible data storage
  created_at timestamp with time zone DEFAULT now(),
  priority text NOT NULL DEFAULT 'normal'::text   -- Duplicate of priority_level (legacy)
    CHECK (priority = ANY (ARRAY[
      'low'::text, 
      'normal'::text, 
      'high'::text, 
      'urgent'::text
    ])),
  is_pushed boolean DEFAULT false,                 -- For push notification tracking
  conversation_id uuid,                            -- For message notifications
  is_sent boolean DEFAULT false,                   -- Delivery status
  sent_at timestamp with time zone,
  error_message text,                              -- Error tracking
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT notifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
```

### 2. **documents** Table (Trigger Source)
```sql
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,                                 -- FK to projects
  document_name character varying NOT NULL,
  document_type character varying NOT NULL 
    CHECK (document_type::text = ANY (ARRAY[
      'contract'::character varying, 
      'plan'::character varying, 
      'permit'::character varying, 
      'invoice'::character varying, 
      'receipt'::character varying, 
      'report'::character varying, 
      'specification'::character varying, 
      'change_order'::character varying, 
      'inspection'::character varying, 
      'certificate'::character varying, 
      'warranty'::character varying, 
      'manual'::character varying, 
      'photo'::character varying, 
      'other'::character varying
    ]::text[])),
  category character varying NOT NULL DEFAULT 'general'::character varying,
  file_url text NOT NULL,
  file_size_bytes integer,
  file_type character varying,
  version_number numeric DEFAULT 1.0,
  is_current_version boolean DEFAULT true,
  description text,
  tags ARRAY DEFAULT ARRAY[]::text[],
  uploaded_by uuid,                                -- FK to users (who uploaded)
  approved_by uuid,                                -- FK to users (who approved)
  approval_status character varying DEFAULT 'pending'::character varying 
    CHECK (approval_status::text = ANY (ARRAY[
      'pending'::character varying, 
      'approved'::character varying, 
      'rejected'::character varying, 
      'revision_required'::character varying, 
      'archived'::character varying
    ]::text[])),
  approval_date timestamp with time zone,
  is_public boolean DEFAULT false,
  download_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  expiry_date date,
  checksum character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id),
  CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT documents_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
```

### 3. **requests** Table (Trigger Source)
```sql
CREATE TABLE public.requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,                                 -- FK to projects
  client_id uuid,                                  -- FK to users (who submitted)
  request_type character varying NOT NULL 
    CHECK (request_type::text = ANY (ARRAY[
      'change_order'::character varying, 
      'additional_work'::character varying, 
      'material_upgrade'::character varying, 
      'timeline_extension'::character varying, 
      'technical_support'::character varying, 
      'site_visit'::character varying, 
      'bug_report'::character varying, 
      'service_plan'::character varying, 
      'service_boq'::character varying, 
      'service_project_management'::character varying, 
      'service_consultation'::character varying, 
      'service_inspection'::character varying, 
      'service_site_visit'::character varying, 
      'material_foundation'::character varying, 
      'material_super_structure'::character varying, 
      'material_roofing'::character varying, 
      'material_finishes'::character varying
    ]::text[])),
  category character varying NOT NULL,
  title character varying NOT NULL,
  description text NOT NULL,
  address text,
  plan_urls ARRAY,
  priority character varying DEFAULT 'medium'::character varying 
    CHECK (priority::text = ANY (ARRAY[
      'low'::character varying, 
      'medium'::character varying, 
      'high'::character varying, 
      'urgent'::character varying
    ]::text[])),
  status character varying DEFAULT 'submitted'::character varying 
    CHECK (status::text = ANY (ARRAY[
      'submitted'::character varying, 
      'reviewing'::character varying, 
      'approved'::character varying, 
      'rejected'::character varying, 
      'in_progress'::character varying, 
      'completed'::character varying
    ]::text[])),
  submitted_date date NOT NULL,
  response_date date,
  admin_response text,
  estimated_cost numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  request_data jsonb DEFAULT '{}'::jsonb,
  contact_preference character varying DEFAULT 'email'::character varying,
  preferred_response_time character varying DEFAULT 'within_24h'::character varying,
  admin_notes text,
  assigned_to_user_id uuid,
  resolved_at timestamp with time zone,
  client_satisfaction_rating integer 
    CHECK (client_satisfaction_rating >= 1 AND client_satisfaction_rating <= 5),
  request_category character varying 
    CHECK (request_category::text = ANY (ARRAY[
      'service'::character varying, 
      'material'::character varying
    ]::text[])),
  subcategory character varying,
  project_address text,
  brief_description text,
  
  CONSTRAINT requests_pkey PRIMARY KEY (id),
  CONSTRAINT requests_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(id)
);
```

### 4. **project_orders** Table (Trigger Source)
```sql
CREATE TABLE public.project_orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,                        -- FK to projects
  supplier_id uuid NOT NULL,                       -- FK to suppliers
  order_number character varying NOT NULL UNIQUE,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  required_date date,
  promised_date date,
  expected_delivery_date date,
  actual_delivery_date date,
  status character varying DEFAULT 'draft'::character varying 
    CHECK (status::text = ANY (ARRAY[
      'draft'::character varying, 
      'pending_approval'::character varying, 
      'approved'::character varying,           -- 🚨 TRIGGER FIRES ON THIS STATUS
      'sent_to_supplier'::character varying, 
      'confirmed'::character varying, 
      'in_transit'::character varying, 
      'partially_delivered'::character varying, 
      'delivered'::character varying, 
      'cancelled'::character varying, 
      'returned'::character varying
    ]::text[])),
  priority character varying DEFAULT 'medium'::character varying 
    CHECK (priority::text = ANY (ARRAY[
      'low'::character varying, 
      'medium'::character varying, 
      'high'::character varying, 
      'urgent'::character varying
    ]::text[])),
  order_type character varying DEFAULT 'purchase'::character varying 
    CHECK (order_type::text = ANY (ARRAY[
      'purchase'::character varying, 
      'rental'::character varying, 
      'service'::character varying
    ]::text[])),
  subtotal numeric DEFAULT 0.00,
  tax_amount numeric DEFAULT 0.00,
  shipping_cost numeric DEFAULT 0.00,
  discount_amount numeric DEFAULT 0.00,
  total_amount numeric DEFAULT 0.00,
  currency character varying DEFAULT 'USD'::character varying,  -- ⚠️ Changed from ZAR to USD
  payment_status character varying DEFAULT 'pending'::character varying 
    CHECK (payment_status::text = ANY (ARRAY[
      'pending'::character varying, 
      'partial'::character varying, 
      'paid'::character varying, 
      'overdue'::character varying
    ]::text[])),
  payment_terms character varying,
  delivery_address text,
  delivery_instructions text,
  ordered_by uuid,                                 -- FK to users (who ordered)
  approved_by uuid,                                -- FK to users (who approved)
  notes text,
  terms_and_conditions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT project_orders_pkey PRIMARY KEY (id),
  CONSTRAINT project_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
  CONSTRAINT project_orders_ordered_by_fkey FOREIGN KEY (ordered_by) REFERENCES public.users(id),
  CONSTRAINT project_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT project_orders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
```

### 5. **project_contractors** Table (Trigger Source)
```sql
CREATE TABLE public.project_contractors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,                        -- FK to projects
  contractor_id uuid NOT NULL,                     -- FK to contractors
  contract_number character varying UNIQUE,
  contract_type character varying DEFAULT 'service_contract'::character varying 
    CHECK (contract_type::text = ANY (ARRAY[
      'main_contract'::character varying, 
      'subcontract'::character varying, 
      'service_contract'::character varying, 
      'consultation'::character varying, 
      'maintenance'::character varying
    ]::text[])),
  contract_status character varying DEFAULT 'active'::character varying 
    CHECK (contract_status::text = ANY (ARRAY[
      'draft'::character varying, 
      'pending_approval'::character varying, 
      'active'::character varying,           -- 🚨 TRIGGER FIRES ON THIS STATUS (user accepted)
      'completed'::character varying, 
      'terminated'::character varying, 
      'suspended'::character varying, 
      'on_hold'::character varying, 
      'expired'::character varying
    ]::text[])),
  signed_date date,
  start_date date NOT NULL,
  planned_end_date date,
  actual_end_date date,
  contract_value numeric NOT NULL DEFAULT 0,
  payment_schedule character varying DEFAULT 'milestone_based'::character varying,
  payment_terms character varying DEFAULT '30 days'::character varying,
  retention_percentage numeric DEFAULT 10.0,
  retention_amount numeric DEFAULT 0,
  scope_of_work text NOT NULL,
  deliverables ARRAY DEFAULT ARRAY[]::text[],
  work_phases ARRAY DEFAULT ARRAY[]::character varying[],
  on_site_status character varying DEFAULT 'scheduled'::character varying 
    CHECK (on_site_status::text = ANY (ARRAY[
      'not_started'::character varying, 
      'scheduled'::character varying, 
      'on_site'::character varying, 
      'temporarily_off_site'::character varying, 
      'work_completed'::character varying, 
      'standby'::character varying
    ]::text[])),
  -- ... other fields omitted for brevity
  assigned_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT project_contractors_pkey PRIMARY KEY (id),
  CONSTRAINT project_contractors_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id),
  CONSTRAINT project_contractors_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_contractors_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
```

---

## 🔧 Admin Dashboard Notification Triggers

### **Central Notification Function**
```sql
-- ========================================================================
-- CENTRAL ADMIN NOTIFICATION FUNCTION
-- ========================================================================
-- This function creates notifications for ALL admin users
-- Mobile apps should NOT modify this function

CREATE OR REPLACE FUNCTION create_admin_notifications(
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_project_id UUID DEFAULT NULL,
    p_priority_level TEXT DEFAULT 'normal',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Get all admin users and create notifications for each
    FOR admin_user IN 
        SELECT id FROM users WHERE role = 'admin'
    LOOP
        INSERT INTO notifications (
            user_id,
            project_id,
            notification_type,
            title,
            message,
            entity_id,
            entity_type,
            priority_level,
            is_read,
            action_url,
            metadata,
            priority,           -- Legacy field
            is_pushed,
            is_sent,
            created_at
        ) VALUES (
            admin_user.id,
            p_project_id,
            p_notification_type,
            p_title,
            p_message,
            p_entity_id,
            p_entity_type,
            p_priority_level,
            false,
            CASE 
                WHEN p_entity_type = 'document' THEN '/documents'
                WHEN p_entity_type = 'request' THEN '/requests'
                WHEN p_entity_type = 'order' THEN '/orders'
                WHEN p_entity_type = 'contractor_assignment' THEN '/contractors'
                ELSE '/dashboard'
            END,
            p_metadata,
            p_priority_level,   -- Legacy field
            false,
            false,
            now()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### **1. Document Upload Notifications**
```sql
-- ========================================================================
-- DOCUMENT UPLOAD NOTIFICATION TRIGGER
-- ========================================================================
-- Fires when: INSERT on documents table
-- Purpose: Notify admins when users upload new documents

CREATE OR REPLACE FUNCTION notify_admin_document_upload()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    uploader_name TEXT;
BEGIN
    -- Get project name
    SELECT projects.project_name INTO project_name
    FROM projects WHERE projects.id = NEW.project_id;
    
    -- Get uploader name
    SELECT users.full_name INTO uploader_name
    FROM users WHERE users.id = NEW.uploaded_by;

    -- Create notification for all admins
    PERFORM create_admin_notifications(
        'document_upload',                                    -- notification_type
        '📄 New Document Uploaded',                          -- title
        CASE 
            WHEN project_name IS NOT NULL THEN 
                uploader_name || ' uploaded "' || NEW.document_name || '" to ' || project_name
            ELSE 
                uploader_name || ' uploaded "' || NEW.document_name || '"'
        END,                                                 -- message
        'document',                                          -- entity_type
        NEW.id,                                             -- entity_id
        NEW.project_id,                                     -- project_id
        'normal',                                           -- priority_level
        jsonb_build_object(
            'document_name', NEW.document_name,
            'document_type', NEW.document_type,
            'uploader_id', NEW.uploaded_by,
            'uploader_name', uploader_name,
            'project_name', project_name,
            'source', 'database_trigger',
            'notification_subtype', 'document_uploaded'
        )                                                   -- metadata
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_document_upload_notification ON documents;
CREATE TRIGGER trigger_document_upload_notification
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_document_upload();
```

### **2. New Request Notifications**
```sql
-- ========================================================================
-- NEW REQUEST NOTIFICATION TRIGGER
-- ========================================================================
-- Fires when: INSERT on requests table
-- Purpose: Notify admins when users submit new requests

CREATE OR REPLACE FUNCTION notify_admin_new_request()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    client_name TEXT;
BEGIN
    -- Get project name
    SELECT projects.project_name INTO project_name
    FROM projects WHERE projects.id = NEW.project_id;
    
    -- Get client name
    SELECT users.full_name INTO client_name
    FROM users WHERE users.id = NEW.client_id;

    -- Create notification for all admins
    PERFORM create_admin_notifications(
        'system',                                           -- notification_type
        '🔔 New Request Submitted',                         -- title
        CASE 
            WHEN project_name IS NOT NULL THEN 
                client_name || ' submitted a ' || NEW.request_type || ' request for ' || project_name
            ELSE 
                client_name || ' submitted a ' || NEW.request_type || ' request: ' || NEW.title
        END,                                               -- message
        'request',                                         -- entity_type
        NEW.id,                                           -- entity_id
        NEW.project_id,                                   -- project_id
        CASE 
            WHEN NEW.priority = 'urgent' THEN 'urgent'
            WHEN NEW.priority = 'high' THEN 'high'
            ELSE 'normal'
        END,                                              -- priority_level
        jsonb_build_object(
            'request_type', NEW.request_type,
            'request_title', NEW.title,
            'client_id', NEW.client_id,
            'client_name', client_name,
            'project_name', project_name,
            'priority', NEW.priority,
            'source', 'database_trigger',
            'notification_subtype', 'new_request'
        )                                                 -- metadata
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_new_request_notification ON requests;
CREATE TRIGGER trigger_new_request_notification
    AFTER INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_request();
```

### **3. Order Approval Notifications**
```sql
-- ========================================================================
-- ORDER APPROVAL NOTIFICATION TRIGGER
-- ========================================================================
-- Fires when: UPDATE on project_orders table (status changes to 'approved')
-- Purpose: Notify admins when clients approve orders

CREATE OR REPLACE FUNCTION notify_admin_order_approval()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    approver_name TEXT;
BEGIN
    -- Only trigger on status change to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Get project name
        SELECT projects.project_name INTO project_name
        FROM projects WHERE projects.id = NEW.project_id;
        
        -- Get approver name
        SELECT users.full_name INTO approver_name
        FROM users WHERE users.id = NEW.approved_by;

        -- Create notification for all admins
        PERFORM create_admin_notifications(
            'system',                                      -- notification_type
            '✅ Order Approved',                          -- title
            CASE 
                WHEN project_name IS NOT NULL THEN 
                    'Order #' || NEW.order_number || ' was approved for ' || project_name || ' ($' || NEW.total_amount || ')'
                ELSE 
                    'Order #' || NEW.order_number || ' was approved ($' || NEW.total_amount || ')'
            END,                                          -- message
            'order',                                      -- entity_type
            NEW.id,                                      -- entity_id
            NEW.project_id,                              -- project_id
            'normal',                                    -- priority_level
            jsonb_build_object(
                'order_number', NEW.order_number,
                'total_amount', NEW.total_amount,
                'approved_by', NEW.approved_by,
                'approver_name', approver_name,
                'project_name', project_name,
                'previous_status', OLD.status,
                'new_status', NEW.status,
                'source', 'database_trigger',
                'notification_subtype', 'order_approved'
            )                                            -- metadata
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_order_approval_notification ON project_orders;
CREATE TRIGGER trigger_order_approval_notification
    AFTER UPDATE ON project_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_order_approval();
```

### **4. Contractor Assignment Acceptance Notifications**
```sql
-- ========================================================================
-- CONTRACTOR ASSIGNMENT ACCEPTANCE NOTIFICATION TRIGGER
-- ========================================================================
-- Fires when: UPDATE on project_contractors table (contract_status changes to 'active')
-- Purpose: Notify admins when users accept contractor assignments

CREATE OR REPLACE FUNCTION notify_admin_contractor_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    contractor_name TEXT;
BEGIN
    -- Only trigger when contract status changes to 'active' (user accepted)
    IF NEW.contract_status = 'active' AND (OLD.contract_status IS NULL OR OLD.contract_status != 'active') THEN
        -- Get project name
        SELECT projects.project_name INTO project_name
        FROM projects WHERE projects.id = NEW.project_id;
        
        -- Get contractor name
        SELECT contractors.contractor_name INTO contractor_name
        FROM contractors WHERE contractors.id = NEW.contractor_id;

        -- Create notification for all admins
        PERFORM create_admin_notifications(
            'system',                                      -- notification_type
            '🤝 Contractor Assignment Accepted',          -- title
            CASE 
                WHEN project_name IS NOT NULL THEN 
                    contractor_name || ' accepted assignment to ' || project_name
                ELSE 
                    contractor_name || ' accepted contractor assignment'
            END,                                          -- message
            'contractor_assignment',                      -- entity_type
            NEW.id,                                      -- entity_id
            NEW.project_id,                              -- project_id
            'normal',                                    -- priority_level
            jsonb_build_object(
                'contractor_id', NEW.contractor_id,
                'contractor_name', contractor_name,
                'project_name', project_name,
                'contract_type', NEW.contract_type,
                'contract_value', NEW.contract_value,
                'previous_status', OLD.contract_status,
                'new_status', NEW.contract_status,
                'source', 'database_trigger',
                'notification_subtype', 'contractor_accepted'
            )                                            -- metadata
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_contractor_acceptance_notification ON project_contractors;
CREATE TRIGGER trigger_contractor_acceptance_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_acceptance();
```

### **5. Document Approval Status Change Notifications**
```sql
-- ========================================================================
-- DOCUMENT APPROVAL STATUS CHANGE NOTIFICATION TRIGGER
-- ========================================================================
-- Fires when: UPDATE on documents table (approval_status changes)
-- Purpose: Notify admins when document approval status changes

CREATE OR REPLACE FUNCTION notify_admin_document_approval()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    approver_name TEXT;
BEGIN
    -- Only trigger on approval status changes (not initial creation)
    IF NEW.approval_status != OLD.approval_status AND OLD.approval_status IS NOT NULL THEN
        -- Get project name
        SELECT projects.project_name INTO project_name
        FROM projects WHERE projects.id = NEW.project_id;
        
        -- Get approver name
        SELECT users.full_name INTO approver_name
        FROM users WHERE users.id = NEW.approved_by;

        -- Create notification for all admins based on status
        PERFORM create_admin_notifications(
            'document_update',                            -- notification_type
            CASE 
                WHEN NEW.approval_status = 'approved' THEN '✅ Document Approved'
                WHEN NEW.approval_status = 'rejected' THEN '❌ Document Rejected'
                WHEN NEW.approval_status = 'revision_required' THEN '📝 Document Needs Revision'
                ELSE '📄 Document Status Updated'
            END,                                         -- title
            CASE 
                WHEN project_name IS NOT NULL THEN 
                    '"' || NEW.document_name || '" in ' || project_name || ' is now ' || NEW.approval_status
                ELSE 
                    '"' || NEW.document_name || '" is now ' || NEW.approval_status
            END,                                         -- message
            'document',                                  -- entity_type
            NEW.id,                                     -- entity_id
            NEW.project_id,                             -- project_id
            CASE 
                WHEN NEW.approval_status = 'rejected' THEN 'high'
                WHEN NEW.approval_status = 'revision_required' THEN 'high'
                ELSE 'normal'
            END,                                        -- priority_level
            jsonb_build_object(
                'document_name', NEW.document_name,
                'document_type', NEW.document_type,
                'approved_by', NEW.approved_by,
                'approver_name', approver_name,
                'project_name', project_name,
                'previous_status', OLD.approval_status,
                'new_status', NEW.approval_status,
                'source', 'database_trigger',
                'notification_subtype', 'document_status_changed'
            )                                           -- metadata
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_document_approval_notification ON documents;
CREATE TRIGGER trigger_document_approval_notification
    AFTER UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_document_approval();
```

---

## 📱 Mobile App Notification Guidelines

### **🚨 CRITICAL: Before Creating Mobile App Triggers**

1. **Always use unique naming** to avoid conflicts:
   ```sql
   -- ✅ GOOD - Mobile app specific naming
   CREATE FUNCTION mobile_notify_user_message()
   CREATE TRIGGER mobile_trigger_user_message_notification
   
   -- ❌ BAD - Conflicts with admin triggers
   CREATE FUNCTION notify_admin_document_upload()
   CREATE TRIGGER trigger_document_upload_notification
   ```

2. **Use conditional logic** to target specific users:
   ```sql
   -- Example: Only create notifications for non-admin users
   IF EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id AND role != 'admin') THEN
       -- Create mobile notification
   END IF;
   ```

3. **Test in isolation** before production:
   ```sql
   -- Create test functions first
   CREATE OR REPLACE FUNCTION mobile_test_notification()
   ```

### **✅ Safe Mobile App Trigger Patterns**

#### **Pattern 1: User-Specific Notifications**
```sql
-- Example: Notify specific user about their project updates
CREATE OR REPLACE FUNCTION mobile_notify_project_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify the project owner (not admins)
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (
            user_id,
            project_id,
            notification_type,
            title,
            message,
            entity_id,
            entity_type,
            priority_level,
            metadata
        )
        SELECT 
            p.client_id,                    -- Target: project owner only
            NEW.project_id,
            'project_update',
            'Project Status Updated',
            'Your project status changed to: ' || NEW.status,
            NEW.id,
            'project',
            'normal',
            jsonb_build_object(
                'source', 'mobile_app',
                'notification_subtype', 'status_change',
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        FROM projects p
        WHERE p.id = NEW.project_id
        AND p.client_id IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### **Pattern 2: Role-Based Filtering**
```sql
-- Example: Notify contractors (not admins)
CREATE OR REPLACE FUNCTION mobile_notify_contractors()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for contractors only
    INSERT INTO notifications (user_id, title, message, metadata)
    SELECT 
        u.id,
        'New Assignment Available',
        'A new assignment is available in your area.',
        jsonb_build_object('source', 'mobile_contractor_app')
    FROM users u
    WHERE u.role = 'contractor'
    AND u.id != NEW.assigned_by;  -- Don't notify the admin who assigned
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### **Pattern 3: Conditional Triggers**
```sql
-- Example: Only trigger for specific conditions
CREATE OR REPLACE FUNCTION mobile_notify_milestone_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when milestone is completed AND by a non-admin user
    IF NEW.status = 'completed' 
       AND OLD.status != 'completed' 
       AND EXISTS (
           SELECT 1 FROM users 
           WHERE id = NEW.updated_by 
           AND role != 'admin'
       ) THEN
        
        -- Notify the project owner
        INSERT INTO notifications (
            user_id,
            project_id,
            notification_type,
            title,
            message,
            entity_id,
            metadata
        )
        SELECT 
            p.client_id,
            NEW.project_id,
            'milestone_complete',
            'Milestone Completed! 🎉',
            'Milestone "' || NEW.milestone_name || '" has been completed.',
            NEW.id,
            jsonb_build_object(
                'source', 'mobile_app',
                'milestone_name', NEW.milestone_name,
                'completion_date', NEW.actual_end
            )
        FROM projects p
        WHERE p.id = NEW.project_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **🔍 Metadata Standards for Mobile Apps**

Always include source identification in metadata:
```sql
jsonb_build_object(
    'source', 'mobile_app',                    -- Identifies mobile app origin
    'app_version', '1.2.3',                   -- App version for debugging
    'notification_subtype', 'specific_event', -- Specific event type
    'created_by_user_role', 'client',         -- Role of triggering user
    'platform', 'ios'                         -- Platform information
)
```

---

## 🧪 Testing & Verification

### **Verify Admin Triggers Are Installed**
```sql
-- Check that all admin triggers exist
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_document_upload_notification',
    'trigger_new_request_notification', 
    'trigger_order_approval_notification',
    'trigger_contractor_acceptance_notification',
    'trigger_document_approval_notification'
)
ORDER BY event_object_table, trigger_name;
```

### **Test Mobile App Trigger Compatibility**
```sql
-- Before creating mobile triggers, test this query
-- Should return no conflicts
SELECT 
    t1.trigger_name as existing_trigger,
    t2.trigger_name as proposed_trigger
FROM information_schema.triggers t1, information_schema.triggers t2
WHERE t1.event_object_table = t2.event_object_table
AND t1.trigger_name LIKE 'trigger_%'  -- Admin triggers
AND t2.trigger_name LIKE 'mobile_%'   -- Your mobile triggers
AND t1.trigger_name != t2.trigger_name;
```

### **Monitor Notification Creation**
```sql
-- Monitor notifications being created in real-time
SELECT 
    n.created_at,
    n.notification_type,
    n.title,
    n.metadata->>'source' as source,
    u.role as target_user_role,
    p.project_name
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN projects p ON n.project_id = p.id
WHERE n.created_at > NOW() - INTERVAL '1 hour'
ORDER BY n.created_at DESC;
```

---

## 📋 Change Log & Version Control

### **Admin Dashboard Trigger Versions**
| Version | Date | Changes | Impact |
|---------|------|---------|---------|
| 1.0.0 | 2024-12-15 | Initial admin triggers | ✅ No mobile impact |
| 1.1.0 | 2024-12-16 | Added contractor acceptance | ✅ No mobile impact |

### **Mobile App Trigger Guidelines Checklist**

Before deploying mobile app triggers:

- [ ] **Naming**: Used unique `mobile_` prefix for all functions and triggers
- [ ] **Testing**: Tested in development environment first
- [ ] **Documentation**: Updated this file with your changes
- [ ] **Metadata**: Included `source: 'mobile_app'` in all notifications
- [ ] **Conflict Check**: Verified no naming conflicts with admin triggers
- [ ] **Role Filtering**: Ensured notifications target appropriate user roles
- [ ] **Backup**: Created backup of database before deployment

---

## 🚨 Emergency Procedures

### **If Mobile App Triggers Break Admin Dashboard**

1. **Immediate Rollback**:
   ```sql
   -- Disable all mobile triggers immediately
   DROP TRIGGER IF EXISTS mobile_trigger_name ON table_name;
   DROP FUNCTION IF EXISTS mobile_function_name();
   ```

2. **Identify Conflicts**:
   ```sql
   -- Find conflicting triggers
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table IN ('documents', 'requests', 'project_orders', 'project_contractors')
   ORDER BY trigger_name;
   ```

3. **Restore Admin Functionality**:
   ```sql
   -- Re-run admin trigger installation if needed
   -- (Copy from admin setup SQL)
   ```

### **Contact Information**
- **Admin Dashboard Team**: [Insert contact]
- **Database Administrator**: [Insert contact]
- **Emergency Escalation**: [Insert contact]

---

## 📚 Additional Resources

- **Supabase Triggers Documentation**: https://supabase.com/docs/guides/database/postgres/triggers
- **PostgreSQL Trigger Documentation**: https://www.postgresql.org/docs/current/sql-createtrigger.html
- **KoraBuild API Documentation**: [Insert link]

---

*Last Updated: December 15, 2024*  
*Version: 1.0.0*  
*Contact: KoraBuild Development Team* 