-- Sample Communications Data for KoraBuild Admin Dashboard Testing
-- This script populates the communications tables with realistic construction project data

-- First, let's ensure we have some basic project data
INSERT INTO projects (id, client_id, project_name, project_address, contract_value, start_date, expected_completion, current_phase, progress_percentage, status, description) VALUES
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Riverside Villa Construction', '123 Riverside Drive, Cape Town', 2500000, '2024-01-15', '2024-08-15', 'Foundation', 35, 'in_progress', 'Luxury villa construction with modern amenities'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Sandton Office Complex', '456 Sandton City, Johannesburg', 15000000, '2024-02-01', '2024-12-31', 'Structural', 45, 'in_progress', 'Modern office complex with sustainable design')
ON CONFLICT (id) DO NOTHING;

-- Insert some users if they don't exist
INSERT INTO users (id, email, full_name, phone, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'client1@example.com', 'Sarah Johnson', '+27 82 123 4567', 'client'),
('550e8400-e29b-41d4-a716-446655440003', 'client2@example.com', 'Michael Chen', '+27 83 234 5678', 'client'),
('550e8400-e29b-41d4-a716-446655440004', 'admin@korabuild.com', 'Admin User', '+27 84 345 6789', 'admin'),
('550e8400-e29b-41d4-a716-446655440005', 'contractor1@example.com', 'James Smith', '+27 85 456 7890', 'contractor'),
('550e8400-e29b-41d4-a716-446655440006', 'inspector@example.com', 'Lisa Williams', '+27 86 567 8901', 'inspector')
ON CONFLICT (id) DO NOTHING;

-- Insert conversations
INSERT INTO conversations (id, project_id, conversation_name, conversation_type, description, is_private, participants, created_by, last_message_at, message_count, is_archived, priority_level) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Foundation Progress Discussion', 'milestone_specific', 'Discussion about foundation work progress and any issues', false, ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005'], '550e8400-e29b-41d4-a716-446655440001', '2024-01-20 14:30:00+00', 12, false, 'high'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Office Complex Planning', 'project_general', 'General project planning and coordination', false, ARRAY['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'], '550e8400-e29b-41d4-a716-446655440003', '2024-01-19 16:45:00+00', 8, false, 'medium'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Client-Contractor Direct', 'client_contractor', 'Direct communication between client and contractor', false, ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005'], '550e8400-e29b-41d4-a716-446655440001', '2024-01-18 10:15:00+00', 5, false, 'normal'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Quality Inspection Updates', 'inspection', 'Quality control and inspection discussions', false, ARRAY['550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006'], '550e8400-e29b-41d4-a716-446655440006', '2024-01-17 09:20:00+00', 3, false, 'high'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Emergency Communication', 'emergency', 'Urgent matters requiring immediate attention', false, ARRAY['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'], '550e8400-e29b-41d4-a716-446655440004', '2024-01-21 08:30:00+00', 2, false, 'urgent')
ON CONFLICT (id) DO NOTHING;

-- Insert messages
INSERT INTO messages (id, conversation_id, sender_id, message_text, message_type, attachment_urls, reply_to_id, is_edited, is_pinned, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'The foundation work is progressing well. We have completed 70% of the excavation work.', 'text', ARRAY[]::text[], NULL, false, false, '2024-01-20 14:30:00+00'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'Great to hear! We are on track to complete the foundation by next Friday. Weather looks good for the rest of the week.', 'text', ARRAY[]::text[], '770e8400-e29b-41d4-a716-446655440001', false, false, '2024-01-20 14:35:00+00'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Please ensure all safety protocols are followed during the concrete pour. I will schedule an inspection for Monday.', 'text', ARRAY[]::text[], NULL, false, true, '2024-01-20 14:40:00+00'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Can we schedule a site visit for the office complex project? I would like to review the latest architectural plans.', 'text', ARRAY[]::text[], NULL, false, false, '2024-01-19 16:45:00+00'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'I have some concerns about the material quality. Can we discuss this further?', 'text', ARRAY[]::text[], NULL, false, false, '2024-01-18 10:15:00+00'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'URGENT: Heavy rain expected tomorrow. Please secure all materials and equipment immediately.', 'text', ARRAY[]::text[], NULL, false, true, '2024-01-21 08:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- Insert approval requests
INSERT INTO approval_requests (id, project_id, request_type, title, description, requested_by, assigned_to, priority_level, status, due_date, estimated_cost_impact, estimated_time_impact, supporting_documents, comments) VALUES
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'change_order', 'Foundation Design Modification', 'Request to modify foundation design due to unexpected soil conditions', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'high', 'pending', '2024-01-25', 75000, 5, ARRAY['foundation_report.pdf', 'soil_analysis.pdf'], 'Soil analysis reveals need for deeper foundation'),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'material_selection', 'Upgrade to Premium Glass Panels', 'Client requests upgrade to premium glass panels for better energy efficiency', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'medium', 'pending', '2024-01-28', 125000, 3, ARRAY['glass_specifications.pdf'], 'Premium glass will improve building energy rating'),
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'timeline_change', 'Extension Request for Weather Delays', 'Request 2-week extension due to unexpected weather delays', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'medium', 'in_review', '2024-01-22', 0, 14, ARRAY['weather_report.pdf'], 'Weather has caused significant delays'),
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'budget_change', 'Additional Security System', 'Request to add advanced security system to office complex', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'low', 'pending', '2024-02-01', 200000, 7, ARRAY['security_proposal.pdf'], 'Enhanced security for office complex'),
('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'plan_approval', 'Electrical Plan Revision', 'Electrical plan revision for villa project', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', 'urgent', 'pending', '2024-01-23', 15000, 2, ARRAY['electrical_plans_v2.pdf'], 'Updated electrical plans for approval')
ON CONFLICT (id) DO NOTHING;

-- Insert approval responses
INSERT INTO approval_responses (id, approval_request_id, responder_id, decision, comments, conditions, response_date) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'approved', 'Extension approved due to weather conditions. Please provide updated timeline.', 'Must provide detailed updated project timeline within 48 hours', '2024-01-19 11:00:00+00'),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'revision_required', 'Please provide more detailed cost breakdown for the security system.', 'Need itemized cost breakdown and vendor quotes', '2024-01-20 15:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- Insert notifications
INSERT INTO notifications (id, user_id, project_id, notification_type, title, message, entity_id, entity_type, priority_level, is_read, read_at, action_url, expires_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'approval_request', 'New Approval Request', 'Foundation Design Modification request needs your review', '880e8400-e29b-41d4-a716-446655440001', 'approval_request', 'high', false, NULL, '/approvals/880e8400-e29b-41d4-a716-446655440001', '2024-01-25 23:59:59+00'),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'milestone_update', 'Milestone Completed', 'Foundation work has been completed successfully', '550e8400-e29b-41d4-a716-446655440000', 'milestone', 'normal', true, '2024-01-19 14:20:00+00', '/projects/550e8400-e29b-41d4-a716-446655440000', NULL),
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'message', 'New Message', 'You have received a new message in Foundation Progress Discussion', '770e8400-e29b-41d4-a716-446655440001', 'message', 'normal', false, NULL, '/communications/660e8400-e29b-41d4-a716-446655440001', NULL),
('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'inspection', 'Inspection Scheduled', 'Quality inspection scheduled for Monday 9:00 AM', '550e8400-e29b-41d4-a716-446655440000', 'inspection', 'high', false, NULL, '/inspections/schedule', '2024-01-22 09:00:00+00'),
('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'emergency', 'Weather Alert', 'Heavy rain expected tomorrow. Secure all materials immediately.', NULL, 'weather', 'urgent', false, NULL, '/weather/alerts', '2024-01-22 00:00:00+00'),
('aa0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'system', 'Payment Processed', 'Milestone payment of R 250,000 has been processed successfully', '550e8400-e29b-41d4-a716-446655440000', 'payment', 'normal', true, '2024-01-18 12:00:00+00', '/payments/history', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert communication log entries
INSERT INTO communication_log (id, project_id, communication_type, subject, content, from_person, to_person, cc_persons, communication_date, priority, response_required, response_due_date, response_received, response_date, related_contract_id, related_assignment_id, attachments, follow_up_required, follow_up_date, status, created_by) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'email', 'Foundation Inspection Report', 'Foundation inspection completed successfully. All requirements met.', 'Lisa Williams', 'Sarah Johnson', ARRAY['Admin User'], '2024-01-18 09:30:00+00', 'high', false, NULL, false, NULL, NULL, NULL, ARRAY['foundation_inspection_report.pdf'], false, NULL, 'delivered', '550e8400-e29b-41d4-a716-446655440006'),
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'phone', 'Material Delivery Confirmation', 'Confirmed delivery of steel reinforcement bars for tomorrow morning', 'James Smith', 'Admin User', ARRAY[]::text[], '2024-01-19 15:45:00+00', 'medium', false, NULL, false, NULL, NULL, NULL, ARRAY[]::text[], false, NULL, 'delivered', '550e8400-e29b-41d4-a716-446655440005'),
('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'meeting', 'Project Kickoff Meeting', 'Initial project kickoff meeting with all stakeholders', 'Admin User', 'Michael Chen', ARRAY['Project Team'], '2024-01-15 10:00:00+00', 'high', true, '2024-01-16 17:00:00+00', true, '2024-01-16 14:30:00+00', NULL, NULL, ARRAY['meeting_minutes.pdf'], false, NULL, 'responded', '550e8400-e29b-41d4-a716-446655440004'),
('bb0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'site_visit', 'Site Inspection Visit', 'Routine site inspection and progress review', 'Admin User', 'All Project Team', ARRAY[]::text[], '2024-01-20 11:00:00+00', 'medium', false, NULL, false, NULL, NULL, NULL, ARRAY['site_inspection_photos.zip'], true, '2024-01-27 11:00:00+00', 'delivered', '550e8400-e29b-41d4-a716-446655440004'),
('bb0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'instruction', 'Safety Protocol Update', 'Updated safety protocols for office complex construction', 'Admin User', 'All Contractors', ARRAY[]::text[], '2024-01-17 08:00:00+00', 'urgent', true, '2024-01-17 17:00:00+00', true, '2024-01-17 16:45:00+00', NULL, NULL, ARRAY['safety_protocols_v2.pdf'], false, NULL, 'responded', '550e8400-e29b-41d4-a716-446655440004')
ON CONFLICT (id) DO NOTHING;

-- Update approval request status for responses
UPDATE approval_requests SET status = 'approved' WHERE id = '880e8400-e29b-41d4-a716-446655440003';
UPDATE approval_requests SET status = 'revision_required' WHERE id = '880e8400-e29b-41d4-a716-446655440004';

-- Update message read status for some messages
UPDATE messages SET read_by = jsonb_build_object('550e8400-e29b-41d4-a716-446655440004', now()) WHERE id = '770e8400-e29b-41d4-a716-446655440001';
UPDATE messages SET read_by = jsonb_build_object('550e8400-e29b-41d4-a716-446655440001', now()) WHERE id = '770e8400-e29b-41d4-a716-446655440002';

-- Add some reactions to messages
UPDATE messages SET reactions = jsonb_build_object('thumbs_up', 2, 'heart', 1) WHERE id = '770e8400-e29b-41d4-a716-446655440001';
UPDATE messages SET reactions = jsonb_build_object('thumbs_up', 1, 'check', 1) WHERE id = '770e8400-e29b-41d4-a716-446655440003';

COMMIT; 