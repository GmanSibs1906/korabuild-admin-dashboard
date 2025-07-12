'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  clientUsers: number;
  contractorUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

interface UseUsersReturn {
  users: User[];
  stats: UserStats;
  loading: boolean;
  error: string | null;
  count: number;
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    clientUsers: 0,
    contractorUsers: 0,
    adminUsers: 0,
    newUsersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching users using admin API with service role...');
      
      // Use admin API route to bypass RLS and get all users
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error fetching users from API:', errorData);
        setError(errorData.error || 'Failed to fetch users');
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          clientUsers: 0,
          contractorUsers: 0,
          adminUsers: 0,
          newUsersThisMonth: 0,
        });
        setUsers([]);
        return;
      }

      const { users: usersList, count } = await response.json();
      console.log('✅ Users fetched successfully from admin API:', usersList.length);

      // Calculate stats like mobile app does
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const calculatedStats: UserStats = {
        totalUsers: usersList.length,
        activeUsers: usersList.filter((u: User) => u.created_at).length, // All users with created_at are active
        clientUsers: usersList.filter((u: User) => u.role === 'client').length,
        contractorUsers: usersList.filter((u: User) => u.role === 'contractor').length,
        adminUsers: usersList.filter((u: User) => u.role === 'admin').length,
        newUsersThisMonth: usersList.filter((u: User) => {
          const userDate = new Date(u.created_at);
          return userDate >= thisMonth;
        }).length,
      };

      setUsers(usersList);
      setStats(calculatedStats);
      
      console.log('📊 User stats calculated:', calculatedStats);
    } catch (error: any) {
      console.error('❌ Error in fetchUsers:', error);
      setError(error.message || 'Failed to fetch users');
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        clientUsers: 0,
        contractorUsers: 0,
        adminUsers: 0,
        newUsersThisMonth: 0,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    stats,
    loading,
    error,
    count: users.length,
  };
} 