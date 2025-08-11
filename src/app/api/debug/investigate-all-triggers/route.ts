import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    console.log('🔍 [Investigate Triggers] Starting comprehensive trigger analysis...');

    // 1. Get all triggers on project_contractors table
    const { data: triggers, error: triggersError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            t.trigger_name,
            t.event_manipulation,
            t.action_timing,
            t.action_statement,
            t.action_condition,
            t.action_orientation,
            t.action_reference_old_table,
            t.action_reference_new_table
          FROM information_schema.triggers t
          WHERE t.event_object_table = 'project_contractors'
          ORDER BY t.trigger_name;
        `
      });

    // 2. Get all functions that might be related to contractor operations
    const { data: functions, error: functionsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            r.routine_name,
            r.routine_type,
            r.routine_definition
          FROM information_schema.routines r
          WHERE r.routine_name LIKE '%contractor%' 
             OR r.routine_name LIKE '%project%'
             OR r.routine_definition LIKE '%contractor_name%'
             OR r.routine_definition LIKE '%project_contractors%'
          ORDER BY r.routine_name;
        `
      });

    // 3. Check for any RLS policies on project_contractors
    const { data: policies, error: policiesError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'project_contractors';
        `
      });

    // 4. Get the exact table structure to understand column names
    const { data: columns, error: columnsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default
          FROM information_schema.columns c
          WHERE c.table_name = 'project_contractors'
          ORDER BY c.ordinal_position;
        `
      });

    // 5. Look for any views that might be affecting the query
    const { data: views, error: viewsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            table_name,
            view_definition
          FROM information_schema.views
          WHERE view_definition LIKE '%project_contractors%'
             OR view_definition LIKE '%contractor_name%';
        `
      });

    // 6. Check for any foreign key constraints that might have triggers
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.table_name = 'project_contractors' 
            AND tc.constraint_type = 'FOREIGN KEY';
        `
      });

    console.log('📊 [Investigate Triggers] Analysis complete');

    return NextResponse.json({
      success: true,
      message: 'Comprehensive trigger analysis complete',
      data: {
        triggers: triggers || [],
        functions: functions || [],
        policies: policies || [],
        columns: columns || [],
        views: views || [],
        constraints: constraints || []
      },
      errors: {
        triggers: triggersError?.message,
        functions: functionsError?.message,
        policies: policiesError?.message,
        columns: columnsError?.message,
        views: viewsError?.message,
        constraints: constraintsError?.message
      },
      analysis: {
        triggerCount: triggers?.length || 0,
        functionCount: functions?.length || 0,
        policyCount: policies?.length || 0,
        columnCount: columns?.length || 0,
        viewCount: views?.length || 0,
        constraintCount: constraints?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Investigate triggers error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 