import { createClient } from '@supabase/supabase-js';
import { CreateNotificationData, NotificationType, NotificationCategory, NotificationPriority } from '@/types/notifications';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class NotificationService {
  
  // Create a new admin notification
  static async createNotification(data: CreateNotificationData): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
          ...data,
          is_read: false,
          is_dismissed: false,
          is_acknowledged: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log('🔔 Admin notification created:', data.title);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  // Financial notifications
  static async createPaymentOverdueNotification(paymentId: string, projectId: string, amount: number): Promise<void> {
    await this.createNotification({
      type: 'payment_overdue',
      category: 'financial',
      priority: 'high',
      title: 'Payment Overdue',
      message: `Payment of $${amount.toLocaleString()} is overdue and requires immediate attention`,
      action_required: true,
      action_type: 'approve_payment',
      entity_type: 'payment',
      entity_id: paymentId,
      project_id: projectId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
  }

  static async createBudgetExceededNotification(projectId: string, budgetAmount: number, actualAmount: number): Promise<void> {
    const overagePercent = ((actualAmount - budgetAmount) / budgetAmount * 100).toFixed(1);
    
    await this.createNotification({
      type: 'budget_exceeded',
      category: 'financial',
      priority: 'critical',
      title: 'Budget Exceeded',
      message: `Project budget exceeded by ${overagePercent}%. Immediate review required.`,
      action_required: true,
      action_type: 'investigate_issue',
      entity_type: 'project',
      entity_id: projectId,
      project_id: projectId,
      metadata: { budget: budgetAmount, actual: actualAmount, overage: overagePercent },
    });
  }

  static async createCashFlowNegativeNotification(projectId: string, deficit: number): Promise<void> {
    await this.createNotification({
      type: 'cash_flow_negative',
      category: 'financial',
      priority: 'critical',
      title: 'Negative Cash Flow Alert',
      message: `Project has negative cash flow of $${Math.abs(deficit).toLocaleString()}. Urgent financial review needed.`,
      action_required: true,
      action_type: 'investigate_issue',
      entity_type: 'project',
      entity_id: projectId,
      project_id: projectId,
    });
  }

  // Project notifications
  static async createProjectDelayedNotification(projectId: string, projectName: string, daysDelayed: number): Promise<void> {
    await this.createNotification({
      type: 'project_delayed',
      category: 'operational',
      priority: daysDelayed > 14 ? 'critical' : 'high',
      title: 'Project Behind Schedule',
      message: `${projectName} is ${daysDelayed} days behind schedule. Intervention required.`,
      action_required: true,
      action_type: 'investigate_issue',
      entity_type: 'project',
      entity_id: projectId,
      project_id: projectId,
    });
  }

  static async createMilestoneOverdueNotification(milestoneId: string, projectId: string, milestoneName: string): Promise<void> {
    await this.createNotification({
      type: 'milestone_overdue',
      category: 'operational',
      priority: 'high',
      title: 'Milestone Overdue',
      message: `Milestone "${milestoneName}" is overdue and needs immediate attention`,
      action_required: true,
      action_type: 'investigate_issue',
      entity_type: 'project',
      entity_id: milestoneId,
      project_id: projectId,
    });
  }

  // User management notifications
  static async createNewUserRegistrationNotification(userId: string, userType: string, fullName: string): Promise<void> {
    await this.createNotification({
      type: 'new_user_registration',
      category: 'operational',
      priority: 'medium',
      title: 'New User Registration',
      message: `New ${userType} "${fullName}" has registered and requires verification`,
      action_required: true,
      action_type: 'verify_user',
      entity_type: 'user',
      entity_id: userId,
      user_id: userId,
    });
  }

  static async createUserVerificationRequiredNotification(userId: string, fullName: string, reason: string): Promise<void> {
    await this.createNotification({
      type: 'user_verification_required',
      category: 'compliance',
      priority: 'high',
      title: 'User Verification Required',
      message: `User "${fullName}" requires verification: ${reason}`,
      action_required: true,
      action_type: 'verify_user',
      entity_type: 'user',
      entity_id: userId,
      user_id: userId,
    });
  }

  // Document notifications
  static async createDocumentApprovalRequiredNotification(documentId: string, projectId: string, documentType: string): Promise<void> {
    await this.createNotification({
      type: 'document_approval_required',
      category: 'compliance',
      priority: 'medium',
      title: 'Document Approval Required',
      message: `${documentType} document requires admin approval before proceeding`,
      action_required: true,
      action_type: 'review_document',
      entity_type: 'document',
      entity_id: documentId,
      project_id: projectId,
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    });
  }

  static async createDocumentExpiredNotification(documentId: string, projectId: string, documentType: string): Promise<void> {
    await this.createNotification({
      type: 'document_expired',
      category: 'compliance',
      priority: 'critical',
      title: 'Document Expired',
      message: `${documentType} document has expired and must be renewed immediately`,
      action_required: true,
      action_type: 'review_document',
      entity_type: 'document',
      entity_id: documentId,
      project_id: projectId,
    });
  }

  // Communication notifications
  static async createUrgentRequestNotification(requestId: string, projectId: string, clientName: string, requestTitle: string): Promise<void> {
    await this.createNotification({
      type: 'urgent_request',
      category: 'communication',
      priority: 'high',
      title: 'Urgent Client Request',
      message: `Urgent request from ${clientName}: "${requestTitle}"`,
      action_required: true,
      action_type: 'respond_to_request',
      entity_type: 'request',
      entity_id: requestId,
      project_id: projectId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });
  }

  static async createClientComplaintNotification(requestId: string, projectId: string, clientName: string, issue: string): Promise<void> {
    await this.createNotification({
      type: 'client_complaint',
      category: 'communication',
      priority: 'critical',
      title: 'Client Complaint',
      message: `Complaint from ${clientName}: ${issue}. Immediate response required.`,
      action_required: true,
      action_type: 'contact_client',
      entity_type: 'request',
      entity_id: requestId,
      project_id: projectId,
    });
  }

  // System notifications
  static async createSystemCriticalNotification(title: string, message: string, actionType?: string): Promise<void> {
    await this.createNotification({
      type: 'system_critical',
      category: 'system',
      priority: 'critical',
      title,
      message,
      action_required: !!actionType,
      action_type: actionType as any,
      entity_type: 'system',
    });
  }

  // Batch notification cleanup (remove old read notifications)
  static async cleanupOldNotifications(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      console.log(`🧹 Cleaned up old notifications older than ${daysOld} days`);
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
    }
  }

  // Mark expired notifications as dismissed
  static async dismissExpiredNotifications(): Promise<void> {
    try {
      const now = new Date().toISOString();

      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .update({
          is_dismissed: true,
          dismissed_at: now,
          updated_at: now,
        })
        .lt('expires_at', now)
        .eq('is_dismissed', false);

      if (error) throw error;

      console.log('🧹 Dismissed expired notifications');
    } catch (error) {
      console.error('❌ Error dismissing expired notifications:', error);
    }
  }
} 