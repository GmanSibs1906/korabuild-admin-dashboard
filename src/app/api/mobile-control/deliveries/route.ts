import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Generate unique delivery number
function generateDeliveryNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `DEL-${timestamp.slice(-6)}${random}`;
}

// 🔧 GET - Fetch delivery data for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const deliveryId = searchParams.get('deliveryId');

    if (!projectId && !deliveryId) {
      return NextResponse.json({ error: 'Project ID or Delivery ID is required' }, { status: 400 });
    }

    console.log('🚚 Mobile Deliveries Control - GET:', { projectId, deliveryId });

    if (deliveryId) {
      // Get specific delivery
      const { data: delivery, error } = await supabaseAdmin
        .from('deliveries')
        .select(`
          *,
          project_orders (
            id,
            order_number,
            project_id,
            total_amount,
            delivery_address,
            delivery_instructions,
            suppliers (
              supplier_name,
              contact_person,
              email,
              phone
            )
          )
        `)
        .eq('id', deliveryId)
        .single();

      if (error) {
        console.error('❌ Error fetching delivery:', error);
        return NextResponse.json({ error: 'Failed to fetch delivery' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: delivery,
      });
    }

    // Get all deliveries for project
    const { data: deliveries, error: deliveriesError } = await supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        project_orders!inner (
          id,
          order_number,
          project_id,
          total_amount,
          suppliers (
            supplier_name,
            contact_person,
            email,
            phone
          )
        )
      `)
      .eq('project_orders.project_id', projectId)
      .order('delivery_date', { ascending: false });

    if (deliveriesError) {
      console.error('❌ Error fetching deliveries:', deliveriesError);
      return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
    }

    // Calculate delivery statistics
    const deliveryStats = {
      totalDeliveries: deliveries?.length || 0,
      scheduledDeliveries: deliveries?.filter(d => d.delivery_status === 'scheduled').length || 0,
      inTransitDeliveries: deliveries?.filter(d => d.delivery_status === 'in_transit').length || 0,
      completedDeliveries: deliveries?.filter(d => d.delivery_status === 'completed').length || 0,
      cancelledDeliveries: deliveries?.filter(d => d.delivery_status === 'cancelled').length || 0,
      avgCompletionPercentage: deliveries?.length > 0 
        ? Math.round(deliveries.filter(d => d.delivery_status === 'completed').length / deliveries.length * 100)
        : 0,
      onTimeDeliveries: deliveries?.filter(d => 
        d.delivery_status === 'completed' && 
        new Date(d.actual_arrival_time) <= new Date(d.delivery_date)
      ).length || 0,
    };

    console.log('✅ Deliveries data fetched successfully:', {
      deliveriesCount: deliveries?.length,
      stats: deliveryStats,
    });

    return NextResponse.json({
      success: true,
      data: {
        deliveries: deliveries || [],
        deliveryStats,
      },
    });

  } catch (error) {
    console.error('❌ Error in deliveries GET API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 🔧 POST - Handle delivery creation, updates, and operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, deliveryData, deliveryId, updates } = body;

    console.log('🚚 Mobile Deliveries Control - POST:', { action, projectId, deliveryId });

    // Handle different actions
    switch (action) {
      case 'create':
        return await createDelivery(projectId, deliveryData);
      case 'update':
        return await updateDelivery(deliveryId, deliveryData);
      case 'updateStatus':
        return await updateDeliveryStatus(deliveryId, updates);
      case 'confirm':
        return await confirmDelivery(deliveryId, updates);
      case 'delete':
        return await deleteDelivery(deliveryId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in deliveries POST API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create new delivery
async function createDelivery(projectId: string, deliveryData: any) {
  try {
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!deliveryData.order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log('🚚 Creating delivery for project:', projectId, 'with data:', {
      order_id: deliveryData.order_id,
      delivery_date: deliveryData.delivery_date,
      driver_name: deliveryData.driver_name,
      itemsCount: deliveryData.delivery_items?.length || 0
    });

    // Generate delivery number
    const deliveryNumber = generateDeliveryNumber();

    // Create the delivery
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .insert({
        order_id: deliveryData.order_id,
        delivery_number: deliveryNumber,
        delivery_date: deliveryData.delivery_date,
        scheduled_time: deliveryData.delivery_time,
        delivery_status: deliveryData.delivery_status || 'scheduled',
        driver_name: deliveryData.driver_name,
        driver_phone: deliveryData.driver_phone,
        vehicle_info: `${deliveryData.vehicle_type} - ${deliveryData.vehicle_registration}`,
        delivery_method: deliveryData.delivery_method,
        received_by_name: deliveryData.recipient_name,
        special_handling_notes: deliveryData.delivery_instructions || deliveryData.special_requirements,
        notes: deliveryData.notes,
        delivery_photos: deliveryData.delivery_photos || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (deliveryError) {
      console.error('❌ Error creating delivery:', deliveryError);
      return NextResponse.json({ error: 'Failed to create delivery' }, { status: 500 });
    }

    // Create delivery items if provided
    if (deliveryData.delivery_items && deliveryData.delivery_items.length > 0) {
      const deliveryItems = deliveryData.delivery_items.map((item: any) => ({
        delivery_id: delivery.id,
        order_item_id: item.order_item_id,
        quantity_delivered: item.quantity_to_deliver,
        quantity_accepted: item.quantity_to_deliver, // Initially set to delivered quantity
        quantity_rejected: 0,
        condition_on_arrival: 'good',
        quality_check_passed: true,
        quality_notes: item.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: deliveryItemsError } = await supabaseAdmin
        .from('delivery_items')
        .insert(deliveryItems);

      if (deliveryItemsError) {
        console.error('❌ Error creating delivery items:', deliveryItemsError);
        // Delete the delivery if items creation failed
        await supabaseAdmin
          .from('deliveries')
          .delete()
          .eq('id', delivery.id);
        return NextResponse.json({ error: 'Failed to create delivery items' }, { status: 500 });
      }
    }

    // Create delivery tracking entry (if delivery_tracking table exists)
    // await supabaseAdmin
    //   .from('delivery_tracking')
    //   .insert({
    //     delivery_id: delivery.id,
    //     status_update: 'scheduled',
    //     timestamp: new Date().toISOString(),
    //     notes: `Delivery ${deliveryNumber} scheduled`,
    //     updated_by: 'abefe861-97da-4556-8b39-18c5ddbce22c', // Use actual user ID
    //   });

    // Fetch complete delivery with relations
    const { data: completeDelivery, error: fetchError } = await supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        project_orders (
          id,
          order_number,
          project_id,
          total_amount,
          suppliers (
            supplier_name,
            contact_person,
            email,
            phone
          )
        )
      `)
      .eq('id', delivery.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching complete delivery:', fetchError);
      return NextResponse.json({ error: 'Delivery created but failed to fetch complete data' }, { status: 500 });
    }

    console.log('✅ Delivery created successfully:', completeDelivery.delivery_number);

    return NextResponse.json({
      success: true,
      data: completeDelivery,
      message: `Delivery ${completeDelivery.delivery_number} created successfully`,
    });

  } catch (error) {
    console.error('❌ Error in createDelivery:', error);
    return NextResponse.json({ 
      error: 'Failed to create delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update existing delivery
async function updateDelivery(deliveryId: string, deliveryData: any) {
  try {
    if (!deliveryId) {
      return NextResponse.json({ error: 'Delivery ID is required' }, { status: 400 });
    }

    console.log('🚚 Updating delivery:', deliveryId, 'with data:', deliveryData);

    // Update the delivery
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .update({
        ...deliveryData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
      .select(`
        *,
        project_orders (
          id,
          order_number,
          project_id,
          total_amount,
          suppliers (
            supplier_name,
            contact_person,
            email,
            phone
          )
        )
      `)
      .single();

    if (deliveryError) {
      console.error('❌ Error updating delivery:', deliveryError);
      return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 });
    }

    console.log('✅ Delivery updated successfully:', delivery.delivery_number);

    // Create delivery tracking entry (if delivery_tracking table exists)
    // await supabaseAdmin
    //   .from('delivery_tracking')
    //   .insert({
    //     delivery_id: deliveryId,
    //     status_update: deliveryData.delivery_status || 'updated',
    //     timestamp: new Date().toISOString(),
    //     notes: `Delivery ${delivery.delivery_number} updated`,
    //     updated_by: 'abefe861-97da-4556-8b39-18c5ddbce22c', // Use actual user ID
    //   });

    return NextResponse.json({
      success: true,
      data: delivery,
      message: `Delivery ${delivery.delivery_number} updated successfully`,
    });

  } catch (error) {
    console.error('❌ Error in updateDelivery:', error);
    return NextResponse.json({ 
      error: 'Failed to update delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update delivery status
async function updateDeliveryStatus(deliveryId: string, updates: any) {
  try {
    if (!deliveryId) {
      return NextResponse.json({ error: 'Delivery ID is required' }, { status: 400 });
    }

    const { status, notes, location } = updates;

    // Update delivery status
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .update({
        delivery_status: status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' && { 
          actual_arrival_time: new Date().toISOString(),
        }),
      })
      .eq('id', deliveryId)
      .select()
      .single();

    if (deliveryError) {
      console.error('❌ Error updating delivery status:', deliveryError);
      return NextResponse.json({ error: 'Failed to update delivery status' }, { status: 500 });
    }

    // Create delivery tracking entry (if delivery_tracking table exists)
    // await supabaseAdmin
    //   .from('delivery_tracking')
    //   .insert({
    //     delivery_id: deliveryId,
    //     status_update: status,
    //     timestamp: new Date().toISOString(),
    //     notes: notes || `Status updated to ${status}`,
    //     location_address: location || null,
    //     updated_by: 'abefe861-97da-4556-8b39-18c5ddbce22c', // Use actual user ID
    //   });

    console.log('✅ Delivery status updated successfully:', status);

    return NextResponse.json({
      success: true,
      data: delivery,
      message: `Delivery status updated to ${status}`,
    });

  } catch (error) {
    console.error('❌ Error in updateDeliveryStatus:', error);
    return NextResponse.json({ 
      error: 'Failed to update delivery status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Confirm delivery
async function confirmDelivery(deliveryId: string, confirmationData: any) {
  try {
    if (!deliveryId) {
      return NextResponse.json({ error: 'Delivery ID is required' }, { status: 400 });
    }

    const { 
      recipient_name,
      recipient_signature,
      delivery_confirmation_code,
      delivery_photos,
      actual_duration,
      notes 
    } = confirmationData;

    // Update delivery with confirmation data
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .update({
        delivery_status: 'completed',
        received_by_name: recipient_name,
        actual_arrival_time: new Date().toISOString(),
        delivery_photos: delivery_photos || [],
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
      .select()
      .single();

    if (deliveryError) {
      console.error('❌ Error confirming delivery:', deliveryError);
      return NextResponse.json({ error: 'Failed to confirm delivery' }, { status: 500 });
    }

    // Create delivery tracking entry (if delivery_tracking table exists)
    // await supabaseAdmin
    //   .from('delivery_tracking')
    //   .insert({
    //     delivery_id: deliveryId,
    //     status_update: 'completed',
    //     timestamp: new Date().toISOString(),
    //     notes: notes || `Delivery confirmed by ${recipient_name}`,
    //     updated_by: 'abefe861-97da-4556-8b39-18c5ddbce22c', // Use actual user ID
    //   });

    console.log('✅ Delivery confirmed successfully:', delivery.delivery_number);

    return NextResponse.json({
      success: true,
      data: delivery,
      message: `Delivery ${delivery.delivery_number} confirmed successfully`,
    });

  } catch (error) {
    console.error('❌ Error in confirmDelivery:', error);
    return NextResponse.json({ 
      error: 'Failed to confirm delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete delivery
async function deleteDelivery(deliveryId: string) {
  try {
    if (!deliveryId) {
      return NextResponse.json({ error: 'Delivery ID is required' }, { status: 400 });
    }

    // First delete delivery tracking records (if delivery_tracking table exists)
    // await supabaseAdmin
    //   .from('delivery_tracking')
    //   .delete()
    //   .eq('delivery_id', deliveryId);

    // Then delete the delivery
    const { error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .delete()
      .eq('id', deliveryId);

    if (deliveryError) {
      console.error('❌ Error deleting delivery:', deliveryError);
      return NextResponse.json({ error: 'Failed to delete delivery' }, { status: 500 });
    }

    console.log('✅ Delivery deleted successfully:', deliveryId);

    return NextResponse.json({
      success: true,
      message: 'Delivery deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error in deleteDelivery:', error);
    return NextResponse.json({ 
      error: 'Failed to delete delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 