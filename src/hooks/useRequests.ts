'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminRequest, RequestFilters, RequestStats } from '@/types/requests';

export interface UseRequestsOptions {
  filters?: RequestFilters;
  includeStats?: boolean;
  limit?: number;
  page?: number;
}

export interface UseRequestsResult {
  requests: AdminRequest[];
  stats: RequestStats | null;
  notifications: RequestNotification[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  refetch: () => void;
}

export interface RequestNotification {
  id: string;
  type: 'new_request' | 'status_update' | 'urgent_request';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  is_read: boolean;
  request_id: string;
  client_name?: string;
  project_name?: string;
}

export function useRequests(options: UseRequestsOptions = {}): UseRequestsResult {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [notifications, setNotifications] = useState<RequestNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Add pagination
      params.append('page', String(options.page || 1));
      params.append('limit', String(options.limit || 20));
      
      // Add filters
      if (options.filters?.status) {
        params.append('status', options.filters.status);
      }
      if (options.filters?.category) {
        params.append('category', options.filters.category);
      }
      if (options.filters?.priority) {
        params.append('priority', options.filters.priority);
      }
      if (options.filters?.project_id) {
        params.append('project_id', options.filters.project_id);
      }
      if (options.filters?.client_id) {
        params.append('client_id', options.filters.client_id);
      }
      if (options.filters?.search) {
        params.append('search', options.filters.search);
      }
      
      // Include stats for dashboard
      if (options.includeStats !== false) {
        params.append('include_stats', 'true');
      }

      const response = await fetch(`/api/admin/requests?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch requests: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch requests');
      }

      setRequests(result.data.requests || []);
      setStats(result.data.stats || null);
      setPagination(result.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });

      // Generate notifications from recent pending requests
      const recentRequests = result.data.requests?.filter((request: AdminRequest) => {
        const createdAt = new Date(request.created_at);
        const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated <= 7 && request.status === 'submitted';
      }) || [];

      const requestNotifications: RequestNotification[] = recentRequests.map((request: AdminRequest) => ({
        id: `request_${request.id}`,
        type: request.priority === 'urgent' ? 'urgent_request' : 'new_request',
        title: request.priority === 'urgent' ? 'Urgent Request Submitted' : 'New Request Submitted',
        message: `${request.title} - ${request.client?.full_name || 'Unknown Client'}`,
        priority: request.priority,
        created_at: request.created_at,
        is_read: false,
        request_id: request.id,
        client_name: request.client?.full_name,
        project_name: request.project?.project_name
      }));

      setNotifications(requestNotifications);

    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRequests([]);
      setStats(null);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [
    options.page,
    options.limit,
    options.filters?.status,
    options.filters?.category,
    options.filters?.priority,
    options.filters?.project_id,
    options.filters?.client_id,
    options.filters?.search,
    options.includeStats
  ]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const refetch = useCallback(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    stats: stats ? {
      ...stats,
      unreadNotifications: notifications.filter(n => !n.is_read).length
    } as RequestStats & { unreadNotifications: number } : null,
    notifications,
    loading,
    error,
    pagination,
    refetch
  };
}

export function useRequestDetail(requestId: string | null) {
  const [request, setRequest] = useState<AdminRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!requestId) {
      setRequest(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/requests/${requestId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch request: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch request');
      }

      setRequest(result.data.request);

    } catch (err) {
      console.error('Failed to fetch request:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const updateRequest = useCallback(async (updates: Partial<AdminRequest>) => {
    if (!requestId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update request: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update request');
      }

      setRequest(result.data);
      return result.data;

    } catch (err) {
      console.error('Failed to update request:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  return {
    request,
    loading,
    error,
    refetch: fetchRequest,
    updateRequest
  };
} 