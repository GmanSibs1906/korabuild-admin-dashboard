 import { useState, useEffect } from 'react';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  profile_photo_url?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        console.log('🔍 Getting current authenticated user...');
        
        const response = await fetch('/api/auth/current-user');
        const result = await response.json();
        
        if (result.success && result.user) {
          console.log('✅ Authenticated user loaded:', result.user.email);
          setUser(result.user);
        } else {
          console.error('❌ No authenticated user found:', result.message);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error getting current user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  return { user, loading, isAuthenticated: !!user };
} 