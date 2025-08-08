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
  status: 'draft' | 'pending_approval' | 'approved' | 'sent_to_supplier' | 'confirmed' | 'in_transit' | 'partially_delivered' | 'delivered' | 'cancelled' | 'returned';
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

export interface Delivery {
  id: string;
  order_id: string;
  delivery_number: string;
  delivery_date: string;
  scheduled_time?: string;
  actual_arrival_time?: string;
  actual_departure_time?: string;
  delivery_status: 'pending' | 'in_transit' | 'completed' | 'failed';
  delivery_method?: string;
  vehicle_info?: string;
  driver_name?: string;
  driver_phone?: string;
  received_by?: string;
  received_by_name?: string;
  receiving_condition?: string;
  delivery_photos?: string[];
  proof_of_delivery_url?: string;
  delivery_receipt_url?: string;
  temperature_controlled?: boolean;
  special_handling_notes?: string;
  discrepancies?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  project_orders?: {
    id: string;
    order_number: string;
    project_id: string;
    suppliers?: {
      supplier_name: string;
    };
  };
}

export interface UseOrdersResult {
  orders: Order[];
  suppliers: Supplier[];
  deliveries: Delivery[];
  stats: OrdersStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
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
      console.log('📦 [useOrders] Projects API Response:', projectsResult);
      
      // Fix: Extract projects from {projects: [...]} structure
      const projects = projectsResult.projects || [];
      console.log('📦 [useOrders] Extracted projects:', projects.length);

      let allOrders: Order[] = [];
      let allSuppliers: Supplier[] = [];
      let allDeliveries: Delivery[] = [];

      // Fetch orders for each project
      for (const project of projects) {
        try {
          console.log(`📦 [useOrders] Fetching orders for project: ${project.project_name} (${project.id})`);
          const params = new URLSearchParams({ projectId: project.id });
          const ordersResponse = await fetch(`/api/mobile-control/orders?${params.toString()}`);
          
          if (ordersResponse.ok) {
            const ordersResult = await ordersResponse.json();
            console.log('📦 [useOrders] API Response for project', project.id, ':', ordersResult);
            
            // Fix: Extract orders from nested structure {orders: {data: [...]}}
            if (ordersResult.orders?.data && Array.isArray(ordersResult.orders.data)) {
              console.log(`📦 [useOrders] Found ${ordersResult.orders.data.length} orders for project ${project.project_name}`);
              // Add project info to each order
              const ordersWithProject = ordersResult.orders.data.map((order: any) => ({
                ...order,
                project: {
                  id: project.id,
                  project_name: project.project_name,
                  project_address: project.project_address,
                  status: project.status
                }
              }));
              allOrders = [...allOrders, ...ordersWithProject];
            } else {
              console.log(`📦 [useOrders] No orders found for project ${project.project_name}`);
            }
            
            // Fix: Extract suppliers from nested structure {suppliers: {data: [...]}}
            if (ordersResult.suppliers?.data && Array.isArray(ordersResult.suppliers.data)) {
              allSuppliers = [...allSuppliers, ...ordersResult.suppliers.data];
            }
            
            // Process deliveries to update order statuses and collect delivery data
            if (ordersResult.deliveries?.data && Array.isArray(ordersResult.deliveries.data)) {
              const deliveries = ordersResult.deliveries.data;
              allDeliveries = [...allDeliveries, ...deliveries];
              
              // Update orders with actual delivery dates from deliveries
              allOrders.forEach(order => {
                const orderDeliveries = deliveries.filter((delivery: any) => delivery.order_id === order.id);
                if (orderDeliveries.length > 0) {
                  const completedDelivery = orderDeliveries.find((d: any) => d.delivery_status === 'completed');
                  if (completedDelivery) {
                    order.status = 'delivered';
                    order.actual_delivery_date = completedDelivery.delivery_date;
                  }
                }
              });
            }
          } else {
            console.warn(`📦 [useOrders] Failed to fetch orders for project ${project.project_name}: ${ordersResponse.status}`);
          }
        } catch (projectError) {
          console.warn(`Failed to fetch orders for project ${project.id}:`, projectError);
        }
      }

      console.log('📦 [useOrders] Total orders found:', allOrders.length);
      console.log('📦 [useOrders] Total suppliers found:', allSuppliers.length);
      console.log('📦 [useOrders] Total deliveries found:', allDeliveries.length);

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
      setDeliveries(allDeliveries);

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
          pendingOrders: allOrders.filter(order => order.status === 'pending_approval' || order.status === 'confirmed' || order.status === 'approved').length,
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

        console.log('📊 [useOrders] Calculated stats:', stats);
        setStats(stats);
      }

    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOrders([]);
      setSuppliers([]);
      setDeliveries([]);
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
      console.log('📦 [useOrders] Single project API response:', result);
      
      // Fix: Extract orders from nested structure {orders: {data: [...]}}
      const orders = result.orders?.data || [];
      const suppliers = result.suppliers?.data || [];
      let deliveries: Delivery[] = [];
      
      // Process deliveries to update order statuses and collect delivery data
      if (result.deliveries?.data && Array.isArray(result.deliveries.data)) {
        deliveries = result.deliveries.data;
      }
      
      setOrders(orders);
      setSuppliers(suppliers);
      setDeliveries(deliveries);
      
      // For single project, stats would be limited
      if (options.includeStats && orders.length > 0) {
        const stats: OrdersStats = {
          totalOrders: orders.length,
          pendingOrders: orders.filter((order: any) => order.status === 'pending_approval' || order.status === 'confirmed' || order.status === 'approved').length,
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
        console.log('📊 [useOrders] Single project stats:', stats);
        setStats(stats);
      }

    } catch (err) {
      console.error('Failed to fetch project orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOrders([]);
      setSuppliers([]);
      setDeliveries([]);
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
    deliveries,
    stats,
    loading,
    error,
    refetch
  };
} 