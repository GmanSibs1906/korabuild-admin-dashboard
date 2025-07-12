'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">Loading KoraBuild Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
