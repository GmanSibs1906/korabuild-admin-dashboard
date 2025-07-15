// 💰 Payment Utility Functions for KoraBuild Admin Dashboard
// Calculations and formatting for Next Payment Due functionality

import type { NextPaymentData, PaymentCalculation, PaymentUrgency, PaymentAlert } from '@/types/next-payment';

/**
 * Format currency amount using South African Rand
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date using South African locale
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculate days until payment due date
 */
export function getDaysUntilPayment(dateString: string): number | null {
  if (!dateString) return null;
  const today = new Date();
  const paymentDate = new Date(dateString);
  const diffTime = paymentDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determine payment urgency based on days until due
 */
export function getPaymentUrgency(daysUntil: number | null): PaymentUrgency {
  if (daysUntil === null) return 'no_date';
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 3) return 'due_soon';
  if (daysUntil <= 7) return 'due_this_week';
  return 'upcoming';
}

/**
 * Get urgency color class for styling
 */
export function getPaymentUrgencyColor(urgency: PaymentUrgency): string {
  switch (urgency) {
    case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
    case 'due_soon': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'due_this_week': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'upcoming': return 'bg-green-100 text-green-800 border-green-200';
    case 'no_date': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get urgency text description
 */
export function getPaymentUrgencyText(daysUntil: number | null): string {
  if (daysUntil === null) return 'No Date Set';
  if (daysUntil < 0) return 'Overdue';
  if (daysUntil === 0) return 'Due Today';
  if (daysUntil <= 3) return 'Due Soon';
  if (daysUntil <= 7) return 'Due This Week';
  return 'Upcoming';
}

/**
 * Generate payment calculation object
 */
export function calculatePaymentStatus(nextPaymentDate: string): PaymentCalculation {
  const daysUntil = getDaysUntilPayment(nextPaymentDate);
  const urgency = getPaymentUrgency(daysUntil);
  
  return {
    daysUntil,
    urgency,
    isOverdue: daysUntil !== null && daysUntil < 0,
    urgencyColor: getPaymentUrgencyColor(urgency),
    urgencyText: getPaymentUrgencyText(daysUntil),
  };
}

/**
 * Generate payment alerts based on payment data
 */
export function generatePaymentAlerts(paymentData: NextPaymentData): PaymentAlert[] {
  const alerts: PaymentAlert[] = [];
  
  if (!paymentData.next_payment_date) {
    alerts.push({
      type: 'info',
      title: 'No Payment Date Set',
      description: 'Set a payment due date to track upcoming payments',
      urgency: 'no_date',
    });
    return alerts;
  }

  const daysUntil = getDaysUntilPayment(paymentData.next_payment_date);
  
  if (daysUntil === null) return alerts;

  if (daysUntil < 0) {
    alerts.push({
      type: 'error',
      title: 'Payment Overdue',
      description: `Payment is ${Math.abs(daysUntil)} days overdue`,
      urgency: 'overdue',
      daysUntil,
    });
  } else if (daysUntil === 0) {
    alerts.push({
      type: 'warning',
      title: 'Payment Due Today',
      description: 'Payment is due today',
      urgency: 'due_soon',
      daysUntil,
    });
  } else if (daysUntil <= 3) {
    alerts.push({
      type: 'warning',
      title: 'Payment Due Soon',
      description: `Payment due in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`,
      urgency: 'due_soon',
      daysUntil,
    });
  } else if (daysUntil <= 7) {
    alerts.push({
      type: 'info',
      title: 'Upcoming Payment',
      description: `Payment due in ${daysUntil} days`,
      urgency: 'due_this_week',
      daysUntil,
    });
  }

  // Check credit status
  if (paymentData.credit_status === 'suspended') {
    alerts.push({
      type: 'error',
      title: 'Credit Account Suspended',
      description: 'Credit account is currently suspended',
      urgency: 'overdue',
    });
  } else if (paymentData.credit_status === 'pending') {
    alerts.push({
      type: 'warning',
      title: 'Credit Account Pending',
      description: 'Credit account approval is pending',
      urgency: 'due_soon',
    });
  }

  return alerts;
}

/**
 * Validate payment form data
 */
export function validatePaymentData(data: Partial<NextPaymentData>): string[] {
  const errors: string[] = [];

  if (!data.monthly_payment || data.monthly_payment <= 0) {
    errors.push('Monthly payment amount must be greater than 0');
  }

  if (!data.next_payment_date) {
    errors.push('Next payment date is required');
  } else {
    const paymentDate = new Date(data.next_payment_date);
    const today = new Date();
    if (paymentDate < today) {
      errors.push('Payment date cannot be in the past');
    }
  }

  if (!data.credit_terms) {
    errors.push('Credit terms are required');
  }

  if (!data.credit_status) {
    errors.push('Credit status is required');
  }

  return errors;
}

/**
 * Get status badge styling based on credit status
 */
export function getCreditStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'suspended':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Calculate next payment date based on current date and terms
 */
export function calculateNextPaymentDate(terms: string, lastPaymentDate?: string): string {
  const baseDate = lastPaymentDate ? new Date(lastPaymentDate) : new Date();
  const nextDate = new Date(baseDate);

  // Extract days from terms (e.g., "30 days net" -> 30)
  const daysMatch = terms.match(/(\d+)\s*days?/i);
  const days = daysMatch ? parseInt(daysMatch[1]) : 30; // Default to 30 days

  nextDate.setDate(nextDate.getDate() + days);
  
  return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

/**
 * Format relative time (e.g., "2 days ago", "in 5 days")
 */
export function getRelativeTimeText(daysUntil: number | null): string {
  if (daysUntil === null) return 'No date set';
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil === -1) return 'Yesterday';
  if (daysUntil > 0) return `In ${daysUntil} days`;
  return `${Math.abs(daysUntil)} days ago`;
} 