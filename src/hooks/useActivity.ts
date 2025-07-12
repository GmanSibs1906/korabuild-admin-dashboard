'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface ActivityItem {
  id: string;
  type: 'user_joined' | 'project_created' | 'payment_made' | 'message_sent';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  createdAt: Date;
}

export function useActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const activities: ActivityItem[] = [];

      // Fetch recent users (last 10)
      const { data: recentUsers, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!usersError && recentUsers) {
        recentUsers.forEach(user => {
          activities.push({
            id: `user_${user.id}`,
            type: 'user_joined',
            title: 'New user registered',
            description: `${user.full_name} joined as a client`,
            timestamp: formatTimestamp(user.created_at),
            user: user.full_name,
            createdAt: new Date(user.created_at)
          });
        });
      }

      // Fetch recent projects (last 5)
      const { data: recentProjects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, 
          project_name, 
          created_at,
          client_id,
          users!projects_client_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!projectsError && recentProjects) {
        recentProjects.forEach(project => {
          const user = (project.users as any)?.full_name || 'Unknown User';
          activities.push({
            id: `project_${project.id}`,
            type: 'project_created',
            title: 'Project created',
            description: `${project.project_name} was started`,
            timestamp: formatTimestamp(project.created_at),
            user,
            createdAt: new Date(project.created_at)
          });
        });
      }

      // Fetch recent payments (last 5)
      const { data: recentPayments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id, 
          amount, 
          payment_date,
          description,
          projects!payments_project_id_fkey(
            project_name,
            client_id,
            users!projects_client_id_fkey(full_name)
          )
        `)
        .order('payment_date', { ascending: false })
        .limit(5);

      if (!paymentsError && recentPayments) {
        recentPayments.forEach(payment => {
          const project = payment.projects as any;
          const user = project?.users?.full_name || 'Unknown User';
          activities.push({
            id: `payment_${payment.id}`,
            type: 'payment_made',
            title: 'Payment received',
            description: `R${payment.amount?.toLocaleString()} payment for ${project?.project_name || 'project'}`,
            timestamp: formatTimestamp(payment.payment_date),
            user,
            createdAt: new Date(payment.payment_date)
          });
        });
      }

      // Fetch recent messages (last 5)
      const { data: recentMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          message_text,
          created_at,
          sender_id,
          users!messages_sender_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!messagesError && recentMessages) {
        recentMessages.forEach(message => {
          const user = (message.users as any)?.full_name || 'Unknown User';
          activities.push({
            id: `message_${message.id}`,
            type: 'message_sent',
            title: 'New message',
            description: message.message_text?.substring(0, 60) + '...' || 'Message sent',
            timestamp: formatTimestamp(message.created_at),
            user,
            createdAt: new Date(message.created_at)
          });
        });
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Take only the most recent 10 activities
      setActivities(activities.slice(0, 10));

    } catch (err) {
      console.error('Unexpected error fetching activity:', err);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    fetchActivity();

    // Set up real-time subscriptions for activity updates
    const usersSubscription = supabase
      .channel('users_activity')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'users' },
        () => fetchActivity()
      )
      .subscribe();

    const projectsSubscription = supabase
      .channel('projects_activity')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'projects' },
        () => fetchActivity()
      )
      .subscribe();

    const paymentsSubscription = supabase
      .channel('payments_activity')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'payments' },
        () => fetchActivity()
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages_activity')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchActivity()
      )
      .subscribe();

    return () => {
      usersSubscription.unsubscribe();
      projectsSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, []);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivity
  };
} 