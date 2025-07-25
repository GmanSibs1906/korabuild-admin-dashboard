-- Mission-Critical Admin Notifications Table
-- This table stores real-time actionable notifications for admin users

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification classification
  type TEXT NOT NULL CHECK (type IN (
    'system_critical', 'system_warning', 'system_maintenance',
    'payment_overdue', 'payment_failed', 'budget_exceeded', 'cash_flow_negative', 'payment_approval_required',
    'project_delayed', 'milestone_overdue', 'quality_issue', 'safety_incident', 'contractor_issue',
    'new_user_registration', 'user_verification_required', 'user_suspended',
    'document_approval_required', 'document_expired', 'compliance_deadline',
    'urgent_request', 'client_complaint', 'escalated_issue'
  )),
  category TEXT NOT NULL CHECK (category IN (
    'financial', 'operational', 'compliance', 'safety', 'quality', 'communication', 'system'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_required BOOLEAN DEFAULT FALSE,
  action_type TEXT CHECK (action_type IN (
    'approve_payment', 'review_document', 'verify_user', 'respond_to_request',
    'acknowledge_alert', 'assign_contractor', 'schedule_maintenance',
    'contact_client', 'investigate_issue'
  )),
  
  -- Context linking
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'project', 'user', 'contractor', 'payment', 'document', 'request', 'system'
  )),
  entity_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  
  -- Admin interaction tracking
  assigned_to_admin UUID REFERENCES users(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  read_by_admin UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Additional context data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread 
  ON admin_notifications (is_read, created_at DESC) 
  WHERE is_read = FALSE AND is_dismissed = FALSE;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority 
  ON admin_notifications (priority, created_at DESC) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_category 
  ON admin_notifications (category, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_action_required 
  ON admin_notifications (action_required, is_read, created_at DESC) 
  WHERE action_required = TRUE;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_project 
  ON admin_notifications (project_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_expires 
  ON admin_notifications (expires_at) 
  WHERE expires_at IS NOT NULL;

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_dashboard 
  ON admin_notifications (is_read, is_dismissed, priority, category, created_at DESC);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_admin_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_notifications_updated_at
  BEFORE UPDATE ON admin_notifications
  FOR EACH ROW EXECUTE FUNCTION update_admin_notifications_updated_at();

-- Row Level Security (RLS)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin users can view notifications
CREATE POLICY "Admin users can view all notifications" ON admin_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Only admin users can update notifications (mark as read, etc.)
CREATE POLICY "Admin users can update notifications" ON admin_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: System can insert notifications (service role)
CREATE POLICY "System can create notifications" ON admin_notifications
  FOR INSERT WITH CHECK (true);

-- Policy: Admin users can delete old notifications
CREATE POLICY "Admin users can delete notifications" ON admin_notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create a view for quick stats
CREATE OR REPLACE VIEW admin_notification_stats AS
SELECT 
  COUNT(*) FILTER (WHERE NOT is_read AND NOT is_dismissed) as total_unread,
  COUNT(*) FILTER (WHERE NOT is_read AND priority = 'critical') as critical_unread,
  COUNT(*) FILTER (WHERE NOT is_read AND priority = 'high') as high_unread,
  COUNT(*) FILTER (WHERE NOT is_read AND action_required) as action_required_count,
  COUNT(*) FILTER (WHERE NOT is_read AND expires_at < NOW()) as overdue_actions,
  COUNT(*) FILTER (WHERE NOT is_read AND category = 'financial') as financial_alerts,
  COUNT(*) FILTER (WHERE NOT is_read AND category = 'operational') as operational_alerts,
  COUNT(*) FILTER (WHERE NOT is_read AND category = 'compliance') as compliance_alerts,
  COUNT(*) FILTER (WHERE NOT is_read AND category = 'safety') as safety_alerts,
  COUNT(*) FILTER (WHERE NOT is_read AND category = 'quality') as quality_alerts,
  COUNT(*) FILTER (WHERE NOT is_read AND category = 'communication') as communication_alerts,
  COUNT(*) FILTER (WHERE NOT is_read AND category = 'system') as system_alerts
FROM admin_notifications;

-- Grant access to the view
GRANT SELECT ON admin_notification_stats TO authenticated;

-- Function to auto-dismiss expired notifications
CREATE OR REPLACE FUNCTION dismiss_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  dismissed_count INTEGER;
BEGIN
  UPDATE admin_notifications 
  SET 
    is_dismissed = TRUE,
    dismissed_at = NOW(),
    updated_at = NOW()
  WHERE 
    expires_at < NOW() 
    AND NOT is_dismissed;
  
  GET DIAGNOSTICS dismissed_count = ROW_COUNT;
  RETURN dismissed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule to run cleanup daily (requires pg_cron extension)
-- SELECT cron.schedule('dismiss-expired-notifications', '0 0 * * *', 'SELECT dismiss_expired_notifications();');

COMMENT ON TABLE admin_notifications IS 'Mission-critical admin notifications for real-time control center';
COMMENT ON COLUMN admin_notifications.type IS 'Specific notification type for categorization and routing';
COMMENT ON COLUMN admin_notifications.action_required IS 'Whether this notification requires admin action to resolve';
COMMENT ON COLUMN admin_notifications.entity_type IS 'Type of entity this notification refers to';
COMMENT ON COLUMN admin_notifications.metadata IS 'Additional context data as JSON';
COMMENT ON VIEW admin_notification_stats IS 'Real-time statistics for admin dashboard';

-- Insert initial system notification to test the table
INSERT INTO admin_notifications (
  type, category, priority, title, message, action_required, entity_type
) VALUES (
  'system_critical', 'system', 'medium', 'Admin Notification System Activated',
  'Real-time admin notification system is now active and monitoring all system events.',
  false, 'system'
); 