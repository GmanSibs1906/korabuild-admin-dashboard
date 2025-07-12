import React from 'react';
import { UsersTable } from '@/components/tables/UsersTable';

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all platform users, roles, and permissions across the KoraBuild ecosystem
          </p>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable />
    </div>
  );
} 