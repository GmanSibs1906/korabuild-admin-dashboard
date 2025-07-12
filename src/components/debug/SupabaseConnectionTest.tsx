'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState('Testing connection...');
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Testing Supabase connection...');
        
        // Test basic connection and auth
        const { data: authData, error: authError } = await supabase.auth.getSession();
        console.log('Auth Session:', { authData, authError });

        // Check current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Current User:', { user, userError });

        // Test users table with different approaches
        console.log('🔍 Testing USERS table...');
        
        // First try: Regular query
        const { data: usersData, error: usersError, count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact' });
        
        console.log('Users Query Result:', { 
          count: usersCount, 
          dataLength: usersData?.length, 
          error: usersError,
          sampleData: usersData?.slice(0, 2) 
        });

        // Second try: Simple count query
        const { count: usersCountOnly, error: usersCountError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        console.log('Users Count-Only Result:', { 
          count: usersCountOnly, 
          error: usersCountError 
        });

        // Third try: Check if table exists at all
        const { data: usersSchema, error: schemaError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        console.log('Users Schema Test:', { 
          canQuery: !schemaError, 
          error: schemaError?.message 
        });

        // Test projects table
        console.log('🔍 Testing PROJECTS table...');
        
        const { data: projectsData, error: projectsError, count: projectsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact' });
        
        console.log('Projects Query Result:', { 
          count: projectsCount, 
          dataLength: projectsData?.length, 
          error: projectsError,
          sampleData: projectsData?.slice(0, 2) 
        });

        // Test if we can query specific user roles
        const { data: clientUsers, error: clientError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'client');
        
        console.log('Client Users Query:', { 
          count: clientUsers?.length, 
          error: clientError?.message 
        });

        // Test payments table (which is working)
        const { data: paymentsData, error: paymentsError, count: paymentsCount } = await supabase
          .from('payments')
          .select('*', { count: 'exact' });
        
        console.log('Payments Query Result:', { 
          count: paymentsCount, 
          dataLength: paymentsData?.length, 
          error: paymentsError 
        });

        // Test conversations table (which is working)
        const { data: conversationsData, error: conversationsError, count: conversationsCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact' });
        
        console.log('Conversations Query Result:', { 
          count: conversationsCount, 
          dataLength: conversationsData?.length, 
          error: conversationsError 
        });

        setResults({
          auth: {
            hasSession: !!authData?.session,
            user: user ? `${user.email} (${user.id})` : 'No user',
            error: authError?.message || userError?.message
          },
          users: { 
            count: usersCount, 
            countOnly: usersCountOnly,
            error: usersError?.message || usersCountError?.message,
            schemaError: schemaError?.message
          },
          projects: { 
            count: projectsCount, 
            error: projectsError?.message 
          },
          payments: { 
            count: paymentsCount, 
            error: paymentsError?.message 
          },
          conversations: { 
            count: conversationsCount, 
            error: conversationsError?.message 
          }
        });

        if (usersCount === 0 && !usersError) {
          console.warn('⚠️ Users table returned 0 results but no error - likely RLS policy blocking access');
        }
        
        if (projectsCount === 0 && !projectsError) {
          console.warn('⚠️ Projects table returned 0 results but no error - likely RLS policy blocking access');
        }

        setStatus('✅ Connection test completed - check console for details');

      } catch (error) {
        console.error('Connection test failed:', error);
        setStatus(`❌ Connection failed: ${error}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Supabase Connection Debug</h3>
      <p className="text-sm text-yellow-700 mb-3">{status}</p>
      
      {/* Authentication Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded border">
        <h4 className="font-semibold text-blue-800 mb-2">🔐 Authentication</h4>
        <div className="text-sm space-y-1">
          <div><strong>Session:</strong> {results.auth?.hasSession ? '✅ Active' : '❌ None'}</div>
          <div><strong>User:</strong> {results.auth?.user || 'Not authenticated'}</div>
          {results.auth?.error && <div className="text-red-600"><strong>Error:</strong> {results.auth.error}</div>}
        </div>
      </div>
      
      {/* Table Access Status */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className={`p-2 rounded ${results.users?.count === 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <strong>👥 Users:</strong> {results.users?.count ?? 'Loading...'} 
          {results.users?.countOnly !== undefined && results.users?.countOnly !== results.users?.count && (
            <span className="text-blue-600"> (Count-only: {results.users.countOnly})</span>
          )}
          {results.users?.error && <div className="text-red-600 text-xs mt-1">Error: {results.users.error}</div>}
          {results.users?.schemaError && <div className="text-red-600 text-xs mt-1">Schema: {results.users.schemaError}</div>}
        </div>
        
        <div className={`p-2 rounded ${results.projects?.count === 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <strong>🏗️ Projects:</strong> {results.projects?.count ?? 'Loading...'} 
          {results.projects?.error && <div className="text-red-600 text-xs mt-1">Error: {results.projects.error}</div>}
        </div>
        
        <div className="p-2 bg-green-50 border border-green-200 rounded">
          <strong>💰 Payments:</strong> {results.payments?.count ?? 'Loading...'} 
          {results.payments?.error && <div className="text-red-600 text-xs mt-1">Error: {results.payments.error}</div>}
        </div>
        
        <div className="p-2 bg-green-50 border border-green-200 rounded">
          <strong>💬 Conversations:</strong> {results.conversations?.count ?? 'Loading...'} 
          {results.conversations?.error && <div className="text-red-600 text-xs mt-1">Error: {results.conversations.error}</div>}
        </div>
      </div>
      
      {(results.users?.count === 0 || results.projects?.count === 0) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-semibold text-red-800 mb-2">🚨 Likely Issue: Row Level Security (RLS)</h4>
          <p className="text-sm text-red-700">
            The users/projects tables likely have RLS policies that are blocking admin access. 
            We may need to authenticate as an admin user or disable RLS for admin dashboard access.
          </p>
        </div>
      )}
      
      <p className="text-xs text-yellow-600 mt-3">
        📝 Check the browser console for detailed logs. This component will be removed after debugging.
      </p>
    </div>
  );
} 