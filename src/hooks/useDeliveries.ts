'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Delivery {
  id: string;
  order_id: string;
  delivery_number: string;
  delivery_date: string;
  scheduled_time: string;
  actual_arrival_time: string;
  actual_departure_time: string;
  delivery_status: 'scheduled' | 'in_transit' | 'arrived' | 'unloading' | 'completed' | 'failed' | 'cancelled' | 'rescheduled';
  delivery_method: string;
  vehicle_info: string;
  driver_name: string;
  driver_phone: string;
  received_by: string;
  received_by_name: string;
  receiving_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  delivery_photos: string[];
  proof_of_delivery_url: string;
  delivery_receipt_url: string;
  temperature_controlled: boolean;
  special_handling_notes: string;
  discrepancies: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Related data
  order?: {
    order_number: string;
    project_id: string;
    supplier_id: string;
    total_amount: number;
    project?: {
      project_name: string;
      client_id: string;
    };
    supplier?: {
      supplier_name: string;
      contact_person: string;
      phone: string;
    };
  };
  receiver?: {
    full_name: string;
    email: string;
  };
}

export interface DeliveryStats {
  totalDeliveries: number;
  scheduledDeliveries: number;
  inTransitDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  upcomingDeliveries: number;
  urgentDeliveries: number;
  deliveriesByStatus: Record<string, number>;
  deliveriesByCondition: Record<string, number>;
  todaysDeliveries: number;
  thisWeeksDeliveries: number;
}

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    scheduledDeliveries: 0,
    inTransitDeliveries: 0,
    completedDeliveries: 0,
    failedDeliveries: 0,
    upcomingDeliveries: 0,
    urgentDeliveries: 0,
    deliveriesByStatus: {},
    deliveriesByCondition: {},
    todaysDeliveries: 0,
    thisWeeksDeliveries: 0
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch deliveries with related data
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:project_orders(
            order_number,
            project_id,
            supplier_id,
            total_amount,
            project:projects(project_name, client_id),
            supplier:suppliers(supplier_name, contact_person, phone)
          ),
          receiver:users!deliveries_received_by_fkey(full_name, email)
        `)
        .order('delivery_date', { ascending: true });

      if (deliveriesError) throw deliveriesError;

      const delivs = deliveriesData || [];
      setDeliveries(delivs);

      // Calculate statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const scheduledDeliveries = delivs.filter(d => d.delivery_status === 'scheduled').length;
      const inTransitDeliveries = delivs.filter(d => d.delivery_status === 'in_transit').length;
      const completedDeliveries = delivs.filter(d => d.delivery_status === 'completed').length;
      const failedDeliveries = delivs.filter(d => d.delivery_status === 'failed').length;

      // Upcoming deliveries (next 7 days)
      const upcomingDeliveries = delivs.filter(d => {
        const deliveryDate = new Date(d.delivery_date);
        return deliveryDate >= today && deliveryDate <= weekFromNow && 
               ['scheduled', 'in_transit'].includes(d.delivery_status);
      }).length;

      // Urgent deliveries (today and overdue)
      const urgentDeliveries = delivs.filter(d => {
        const deliveryDate = new Date(d.delivery_date);
        return deliveryDate <= today && ['scheduled', 'in_transit'].includes(d.delivery_status);
      }).length;

      // Today's deliveries
      const todaysDeliveries = delivs.filter(d => {
        const deliveryDate = new Date(d.delivery_date);
        return deliveryDate.toDateString() === today.toDateString();
      }).length;

      // This week's deliveries
      const thisWeeksDeliveries = delivs.filter(d => {
        const deliveryDate = new Date(d.delivery_date);
        return deliveryDate >= weekAgo && deliveryDate <= now;
      }).length;

      // Group by delivery status
      const deliveriesByStatus: Record<string, number> = {};
      delivs.forEach(d => {
        deliveriesByStatus[d.delivery_status] = (deliveriesByStatus[d.delivery_status] || 0) + 1;
      });

      // Group by receiving condition
      const deliveriesByCondition: Record<string, number> = {};
      delivs.forEach(d => {
        if (d.receiving_condition) {
          deliveriesByCondition[d.receiving_condition] = (deliveriesByCondition[d.receiving_condition] || 0) + 1;
        }
      });

      setStats({
        totalDeliveries: delivs.length,
        scheduledDeliveries,
        inTransitDeliveries,
        completedDeliveries,
        failedDeliveries,
        upcomingDeliveries,
        urgentDeliveries,
        deliveriesByStatus,
        deliveriesByCondition,
        todaysDeliveries,
        thisWeeksDeliveries
      });

    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();

    // Set up real-time subscription
    const subscription = supabase
      .channel('deliveries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries'
        },
        (payload) => {
          console.log('Delivery change detected:', payload);
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    deliveries,
    loading,
    error,
    stats,
    refetch: fetchDeliveries
  };
}
