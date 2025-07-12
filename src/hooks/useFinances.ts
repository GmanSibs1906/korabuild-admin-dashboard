'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Payment = Database['public']['Tables']['payments']['Row'];

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
}

export function useFinances() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0
  });

  const fetchFinances = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching payments:', fetchError);
        setError(fetchError.message);
        return;
      }

      const paymentsData = data || [];
      setPayments(paymentsData);

      // Calculate total revenue from completed payments
      const completedPayments = paymentsData.filter(p => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((sum, payment) => 
        sum + (payment.amount || 0), 0
      );

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = completedPayments
        .filter(p => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;

      setStats({
        totalRevenue,
        monthlyRevenue,
        totalPayments: paymentsData.length,
        pendingPayments,
        completedPayments: completedPayments.length
      });

    } catch (err) {
      console.error('Unexpected error fetching finances:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();

    // Set up real-time subscription
    const subscription = supabase
      .channel('payments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          fetchFinances();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    payments,
    loading,
    error,
    stats,
    refetch: fetchFinances
  };
} 