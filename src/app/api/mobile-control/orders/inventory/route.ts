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

// 🔧 GET - Fetch inventory items for order creation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log('📦 Inventory API - GET:', { projectId });

    // Get all active inventory items (inventory_items table doesn't have project_id)
    const { data: inventoryItems, error: inventoryError } = await supabaseAdmin
      .from('inventory_items')
      .select(`
        id,
        item_code,
        item_name,
        description,
        category,
        subcategory,
        unit_of_measure,
        current_stock,
        min_stock_level,
        standard_cost,
        last_cost,
        supplier_id,
        suppliers (
          id,
          supplier_name
        )
      `)
      .eq('is_active', true)
      .order('item_name');

    if (inventoryError) {
      console.error('❌ Error fetching inventory items:', inventoryError);
      return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
    }

    // Format the data for the order creation modal
    const formattedItems = (inventoryItems || []).map((item: any) => ({
      id: item.id,
      item_code: item.item_code,
      item_name: item.item_name,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      unit_of_measure: item.unit_of_measure,
      current_stock: item.current_stock,
      min_stock_level: item.min_stock_level,
      suggested_cost: item.standard_cost || item.last_cost || 0,
      supplier_name: item.suppliers?.supplier_name || 'Unknown',
      display_name: `${item.item_name} (${item.item_code})`,
      stock_status: item.current_stock <= item.min_stock_level ? 'low' : 'normal'
    }));

    console.log('📦 Inventory items fetched successfully:', {
      itemsCount: formattedItems.length,
      lowStockCount: formattedItems.filter(item => item.stock_status === 'low').length
    });

    return NextResponse.json({ 
      success: true, 
      data: formattedItems
    });

  } catch (error) {
    console.error('❌ Error in inventory API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 