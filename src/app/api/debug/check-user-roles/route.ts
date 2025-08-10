import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all users and their roles
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    // Separate users by role
    const usersByRole = {
      admin: users?.filter(u => u.role === 'admin') || [],
      client: users?.filter(u => u.role === 'client') || [],
      contractor: users?.filter(u => u.role === 'contractor') || [],
      inspector: users?.filter(u => u.role === 'inspector') || []
    };

    // Check the specific users mentioned in notifications
    const currentAdminId = '9021dca2-2960-4bb5-b79a-dc3bb50247f4';
    const gladmanId = '8907e679-d31e-4418-a369-68205ab0e34f';
    
    const currentAdmin = users?.find(u => u.id === currentAdminId);
    const gladmanUser = users?.find(u => u.id === gladmanId);

    return NextResponse.json({
      success: true,
      totalUsers: users?.length || 0,
      usersByRole,
      specificUsers: {
        currentLoggedInUser: {
          id: currentAdminId,
          user: currentAdmin,
          isAdmin: currentAdmin?.role === 'admin'
        },
        mrGladman: {
          id: gladmanId,
          user: gladmanUser,
          isAdmin: gladmanUser?.role === 'admin'
        }
      },
      analysis: {
        message: gladmanUser?.role === 'admin' 
          ? "Mr Gladman is also an admin - these are admin-to-admin messages"
          : "Mr Gladman is a client/contractor - these are legitimate incoming messages",
        shouldFilter: gladmanUser?.role === 'admin' && String(gladmanId) !== String(currentAdminId)
          ? "If you want to filter messages from other admins too"
          : "These should NOT be filtered as they are legitimate incoming messages"
      }
    });

  } catch (error) {
    console.error('User roles check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 