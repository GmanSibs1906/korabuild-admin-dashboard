'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Order {
  id: string;
  order_number: string;
  project_id: string;
  supplier_id: string;
  order_date: string;
  required_date?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  delivery_address?: string;
  delivery_instructions?: string;
  notes?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;

  // Populated relations
  supplier?: {
    id: string;
    supplier_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    rating?: number;
  };
  project?: {
    id: string;
    project_name: string;
    project_address: string;
    status: string;
  };
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  line_number: number;
  item_description: string;
  quantity_ordered: number;
  quantity_delivered: number;
  quantity_remaining: number;
  unit_of_measure: string;
  unit_cost: number;
  line_total: number;
  delivery_status: 'pending' | 'partial' | 'delivered';
  notes?: string;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  supplier_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  specialty?: string;
  rating?: number;
  status: 'active' | 'inactive';
  total_orders?: number;
  total_value?: number;
  on_time_delivery?: number;
}

export interface OrdersStats {
  totalOrders: number;
  pendingOrders: number;
  totalValue: number;
  deliveredThisMonth: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  monthlyTrend: number;
  valueGrowth: number;
}

export interface UseOrdersOptions {
  projectId?: string;
  includeStats?: boolean;
  limit?: number;
  status?: string;
  priority?: string;
}

export interface UseOrdersResult {
  orders: Order[];
  suppliers: Supplier[];
  stats: OrdersStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<OrdersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all projects first to get all orders
      const projectsResponse = await fetch('/api/projects');
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsResult = await projectsResponse.json();
      const projects = projectsResult.success ? projectsResult.data : [];

      let allOrders: Order[] = [];
      let allSuppliers: Supplier[] = [];

      // Fetch orders for each project
      for (const project of projects) {
        try {
          const params = new URLSearchParams({ projectId: project.id });
          const ordersResponse = await fetch(`/api/mobile-control/orders?${params.toString()}`);
          
          if (ordersResponse.ok) {
            const ordersResult = await ordersResponse.json();
            if (ordersResult.orders) {
              // Add project info to each order
              const ordersWithProject = ordersResult.orders.map((order: any) => ({
                ...order,
                project: {
                  id: project.id,
                  project_name: project.project_name,
                  project_address: project.project_address,
                  status: project.status
                }
              }));
              allOrders = [...allOrders, ...ordersWithProject];
            }
            
            if (ordersResult.suppliers) {
              allSuppliers = [...allSuppliers, ...ordersResult.suppliers];
            }
          }
        } catch (projectError) {
          console.warn(`Failed to fetch orders for project ${project.id}:`, projectError);
        }
      }

      // Remove duplicate suppliers
      const uniqueSuppliers = allSuppliers.filter((supplier, index, self) => 
        index === self.findIndex(s => s.id === supplier.id)
      );

      // Apply filters
      let filteredOrders = allOrders;
      if (options.status) {
        filteredOrders = filteredOrders.filter(order => order.status === options.status);
      }
      if (options.priority) {
        filteredOrders = filteredOrders.filter(order => order.priority === options.priority);
      }
      if (options.limit) {
        filteredOrders = filteredOrders.slice(0, options.limit);
      }

      setOrders(filteredOrders);
      setSuppliers(uniqueSuppliers);

      // Calculate statistics if requested
      if (options.includeStats) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const deliveredThisMonth = allOrders.filter(order => {
          if (order.status !== 'delivered' || !order.actual_delivery_date) return false;
          const deliveryDate = new Date(order.actual_delivery_date);
          return deliveryDate.getMonth() === currentMonth && deliveryDate.getFullYear() === currentYear;
        }).length;

        const stats: OrdersStats = {
          totalOrders: allOrders.length,
          pendingOrders: allOrders.filter(order => order.status === 'pending' || order.status === 'confirmed').length,
          totalValue: allOrders.reduce((sum, order) => sum + order.total_amount, 0),
          deliveredThisMonth,
          byStatus: allOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byPriority: allOrders.reduce((acc, order) => {
            acc[order.priority] = (acc[order.priority] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          monthlyTrend: 12, // Placeholder - would need historical data
          valueGrowth: 18   // Placeholder - would need historical data
        };

        setStats(stats);
      }

    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOrders([]);
      setSuppliers([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.priority, options.limit, options.includeStats]);

  const fetchProjectOrders = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ projectId });
      const response = await fetch(`/api/mobile-control/orders?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();
      
      setOrders(result.orders || []);
      setSuppliers(result.suppliers || []);
      
      // For single project, stats would be limited
      if (options.includeStats && result.orders) {
        const orders = result.orders;
        const stats: OrdersStats = {
          totalOrders: orders.length,
          pendingOrders: orders.filter((order: any) => order.status === 'pending' || order.status === 'confirmed').length,
          totalValue: orders.reduce((sum: number, order: any) => sum + order.total_amount, 0),
          deliveredThisMonth: orders.filter((order: any) => order.status === 'delivered').length,
          byStatus: orders.reduce((acc: Record<string, number>, order: any) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {}),
          byPriority: orders.reduce((acc: Record<string, number>, order: any) => {
            acc[order.priority] = (acc[order.priority] || 0) + 1;
            return acc;
          }, {}),
          monthlyTrend: 0,
          valueGrowth: 0
        };
        setStats(stats);
      }

    } catch (err) {
      console.error('Failed to fetch project orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOrders([]);
      setSuppliers([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [options.includeStats]);

  useEffect(() => {
    if (options.projectId) {
      fetchProjectOrders(options.projectId);
    } else {
      fetchAllOrders();
    }
  }, [options.projectId, fetchAllOrders, fetchProjectOrders]);

  const refetch = useCallback(() => {
    if (options.projectId) {
      fetchProjectOrders(options.projectId);
    } else {
      fetchAllOrders();
    }
  }, [options.projectId, fetchAllOrders, fetchProjectOrders]);

  return {
    orders,
    suppliers,
    stats,
    loading,
    error,
    refetch
  };
} 