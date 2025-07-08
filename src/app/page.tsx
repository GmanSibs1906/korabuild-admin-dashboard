import { Suspense } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { AdminAuthProvider } from "@/components/auth/AdminAuthProvider";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AdminDashboardPage() {
  return (
    <AdminAuthProvider>
      <AdminLayout>
        <div className="p-6">
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardOverview />
          </Suspense>
        </div>
      </AdminLayout>
    </AdminAuthProvider>
  );
}
