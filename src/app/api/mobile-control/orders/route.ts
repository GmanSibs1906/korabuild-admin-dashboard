import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for elevated permissions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

// 🔧 GET - Fetch material orders data for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log('📦 Mobile Orders Control - GET:', { projectId });

    // Get project orders with supplier information
    const { data: projectOrders, error: ordersError } = await supabaseAdmin
      .from('project_orders')
      .select(`
        *,
        suppliers (
          id,
          supplier_name,
          contact_person,
          email,
          phone,
          specialty,
          rating,
          status
        ),
        order_items (
          id,
          line_number,
          item_description,
          quantity_ordered,
          quantity_delivered,
          quantity_remaining,
          unit_of_measure,
          unit_cost,
          line_total,
          delivery_status,
          notes
        )
      `)
      .eq('project_id', projectId)
      .order('order_date', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Get deliveries data - join through project_orders since deliveries doesn't have project_id
    const { data: deliveriesData, error: deliveriesError } = await supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        project_orders!inner (
          id,
          order_number,
          project_id,
          suppliers (
            supplier_name
          )
        )
      `)
      .eq('project_orders.project_id', projectId)
      .order('delivery_date', { ascending: false });

    if (deliveriesError) {
      console.error('❌ Error fetching deliveries:', deliveriesError);
    }

    // Get suppliers data
    const { data: suppliersData, error: suppliersError } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('status', 'active')
      .order('supplier_name');

    if (suppliersError) {
      console.error('❌ Error fetching suppliers:', suppliersError);
    }

    // Get inventory alerts - fix the column comparison issue
    // Use a numeric threshold instead of comparing columns
    const { data: inventoryData, error: inventoryError } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .lt('current_stock', 10)
      .eq('is_active', true)
      .order('item_name');

    if (inventoryError) {
      console.error('❌ Error fetching inventory:', inventoryError);
    }

    // Calculate statistics
    const orders = projectOrders || [];
    const deliveries = deliveriesData || [];
    const suppliers = suppliersData || [];
    const inventoryAlerts = inventoryData || [];

    const orderStats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending_approval').length,
      confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      totalOrderValue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orders.length : 0,
    };

    const deliveryStats = {
      totalDeliveries: deliveries.length,
      pendingDeliveries: deliveries.filter(d => d.delivery_status === 'scheduled').length,
      completedDeliveries: deliveries.filter(d => d.delivery_status === 'completed').length,
      deliverySuccessRate: deliveries.length > 0 ? (deliveries.filter(d => d.delivery_status === 'completed').length / deliveries.length) * 100 : 0,
    };

    const supplierStats = {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.status === 'active').length,
      averageRating: suppliers.length > 0 ? suppliers.reduce((sum, supplier) => sum + (supplier.rating || 0), 0) / suppliers.length : 0,
    };

    const inventoryAlertsData = {
      lowStockItems: inventoryAlerts.length,
      criticalItems: inventoryAlerts.filter(item => item.current_stock <= 5).length,
      items: inventoryAlerts,
    };

    // Format for mobile app compatibility
    const responseData = {
      orders: {
        data: orders,
        stats: orderStats,
      },
      deliveries: {
        data: deliveries,
        stats: deliveryStats,
      },
      suppliers: {
        data: suppliers,
        stats: supplierStats,
      },
      inventory: {
        alerts: inventoryAlertsData,
      },
      // Summary counts for dashboard
      ordersCount: orders.length,
      deliveriesCount: deliveries.length,
      suppliersCount: suppliers.length,
      inventoryAlertsCount: inventoryAlerts.length,
    };

    console.log('📦 Orders data compiled successfully:', {
      ordersCount: orders.length,
      deliveriesCount: deliveries.length,
      suppliersCount: suppliers.length,
      inventoryAlertsCount: inventoryAlerts.length,
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 🔧 POST - Handle creating, updating, and deleting orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, orderId, orderData } = body;

    console.log('📦 Mobile Orders Control - POST:', { action, projectId, orderId });

    switch (action) {
      case 'create':
        return await createOrder(projectId, orderData);
      case 'update':
        return await updateOrder(orderId, orderData);
      case 'delete':
        return await deleteOrder(orderId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ POST orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new order
async function createOrder(projectId: string, orderData: any) {
  try {
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Extract order items from the order data
    const { order_items, ...mainOrderData } = orderData;

    // Calculate order totals based on items
    let subtotal = 0;
    if (order_items && Array.isArray(order_items)) {
      subtotal = order_items.reduce((sum: number, item: any) => {
        const lineTotal = (item.quantity_ordered || 0) * (item.unit_cost || 0);
        return sum + lineTotal;
      }, 0);
    }

    const taxRate = 0.15; // 15% VAT
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Create the order with calculated totals
    const orderToCreate = {
      project_id: projectId,
      order_number: generateOrderNumber(),
      order_date: mainOrderData.order_date || new Date().toISOString().split('T')[0],
      supplier_id: mainOrderData.supplier_id,
      required_date: mainOrderData.required_date,
      expected_delivery_date: mainOrderData.expected_delivery_date,
      priority: mainOrderData.priority || 'medium',
      status: mainOrderData.status || 'draft',
      delivery_address: mainOrderData.delivery_address || '',
      delivery_instructions: mainOrderData.delivery_instructions || '',
      notes: mainOrderData.notes || '',
      subtotal: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: 'ZAR',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the order
    const { data: createdOrder, error: createError } = await supabaseAdmin
      .from('project_orders')
      .insert([orderToCreate])
      .select(`
        *,
        suppliers (
          id,
          supplier_name,
          contact_person,
          email,
          phone
        )
      `)
      .single();

    if (createError) {
      console.error('❌ Error creating order:', createError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Insert order items if provided
    if (order_items && Array.isArray(order_items) && order_items.length > 0) {
      const itemsToInsert = order_items.map((item: any, index: number) => ({
        order_id: createdOrder.id,
        line_number: index + 1,
        item_description: item.item_description,
        quantity_ordered: item.quantity_ordered,
        quantity_delivered: item.quantity_delivered || 0,
        unit_of_measure: item.unit_of_measure,
        unit_cost: item.unit_cost,
        // line_total is a generated column - removed from insertion
        delivery_status: item.delivery_status || 'pending',
        specifications: item.specifications || '',
        notes: item.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: insertItemsError } = await supabaseAdmin
        .from('order_items')
        .insert(itemsToInsert);

      if (insertItemsError) {
        console.error('❌ Error inserting order items:', insertItemsError);
        return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
      }
    }

    // Fetch the complete order with items
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('project_orders')
      .select(`
        *,
        suppliers (
          id,
          supplier_name,
          contact_person,
          email,
          phone,
          specialty,
          rating,
          status
        ),
        order_items (
          id,
          line_number,
          item_description,
          quantity_ordered,
          quantity_delivered,
          quantity_remaining,
          unit_of_measure,
          unit_cost,
          line_total,
          delivery_status,
          notes
        )
      `)
      .eq('id', createdOrder.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching created order:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch created order' }, { status: 500 });
    }

    console.log('✅ Order created successfully:', completeOrder.order_number);
    return NextResponse.json({ success: true, data: completeOrder });

  } catch (error) {
    console.error('❌ Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update an existing order
async function updateOrder(orderId: string, updates: any) {
  try {
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log('🔄 Updating order:', orderId, 'with data:', updates);

    // Extract order items from updates
    const { order_items, ...orderUpdates } = updates;

    // Calculate order totals if items are provided
    let calculatedTotals = {};
    if (order_items && Array.isArray(order_items)) {
      const subtotal = order_items.reduce((sum: number, item: any) => {
        const lineTotal = (parseFloat(item.quantity_ordered) || 0) * (parseFloat(item.unit_cost) || 0);
        return sum + lineTotal;
      }, 0);

      const taxRate = 0.15; // 15% VAT
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      calculatedTotals = {
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      };
    }

    // Update the order with calculated totals
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('project_orders')
      .update({
        ...orderUpdates,
        ...calculatedTotals,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select(`
        *,
        suppliers (
          id,
          supplier_name,
          contact_person,
          email,
          phone
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Error updating order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Handle order items if provided
    if (order_items && Array.isArray(order_items)) {
      // Delete existing items first
      const { error: deleteItemsError } = await supabaseAdmin
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteItemsError) {
        console.error('❌ Error deleting existing order items:', deleteItemsError);
        return NextResponse.json({ error: 'Failed to update order items' }, { status: 500 });
      }

      // Insert new/updated items with proper calculations
      if (order_items.length > 0) {
        const itemsToInsert = order_items.map((item: any, index: number) => {
          const quantityOrdered = parseFloat(item.quantity_ordered) || 0;
          const unitCost = parseFloat(item.unit_cost) || 0;
          const lineTotal = quantityOrdered * unitCost;

          return {
            order_id: orderId,
            line_number: index + 1,
            item_description: item.item_description || '',
            quantity_ordered: quantityOrdered,
            quantity_delivered: parseFloat(item.quantity_delivered) || 0,
            unit_of_measure: item.unit_of_measure || 'pieces',
            unit_cost: unitCost,
            // line_total is a generated column - removed from insertion
            delivery_status: item.delivery_status || 'pending',
            specifications: item.specifications || '',
            notes: item.notes || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        const { error: insertItemsError } = await supabaseAdmin
          .from('order_items')
          .insert(itemsToInsert);

        if (insertItemsError) {
          console.error('❌ Error inserting order items:', insertItemsError);
          return NextResponse.json({ error: 'Failed to update order items' }, { status: 500 });
        }
      }
    }

    // Fetch the complete updated order with items
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('project_orders')
      .select(`
        *,
        suppliers (
          id,
          supplier_name,
          contact_person,
          email,
          phone,
          specialty,
          rating,
          status
        ),
        order_items (
          id,
          line_number,
          item_description,
          quantity_ordered,
          quantity_delivered,
          quantity_remaining,
          unit_of_measure,
          unit_cost,
          line_total,
          delivery_status,
          notes
        )
      `)
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching updated order:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch updated order' }, { status: 500 });
    }

    console.log('✅ Order updated successfully:', completeOrder.order_number);
    return NextResponse.json({ success: true, data: completeOrder });

  } catch (error) {
    console.error('❌ Update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete order
async function deleteOrder(orderId: string) {
  try {
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // First delete order items
    const { error: deleteItemsError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (deleteItemsError) {
      console.error('❌ Error deleting order items:', deleteItemsError);
      return NextResponse.json({ error: 'Failed to delete order items' }, { status: 500 });
    }

    // Then delete the order
    const { error: deleteOrderError } = await supabaseAdmin
      .from('project_orders')
      .delete()
      .eq('id', orderId);

    if (deleteOrderError) {
      console.error('❌ Error deleting order:', deleteOrderError);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }

    console.log('✅ Order deleted successfully:', orderId);
    return NextResponse.json({ success: true, message: 'Order deleted successfully' });

  } catch (error) {
    console.error('❌ Delete order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}