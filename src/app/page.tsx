import { Suspense } from "react";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <AdminDashboard />
      </Suspense>
    </div>
  );
}
