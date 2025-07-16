import AdminLayout from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  console.log('🔍 DashboardLayout - Rendering dashboard layout');
  
  // 🚨 TEMPORARY: Bypass authentication for testing
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
  
  // TODO: Re-enable authentication in production
  // return (
  //   <ProtectedRoute>
  //     <AdminLayout>
  //       {children}
  //     </AdminLayout>
  //   </ProtectedRoute>
  // );
} 