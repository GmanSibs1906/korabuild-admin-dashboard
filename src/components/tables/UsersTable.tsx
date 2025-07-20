'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/useUsers';
import { Database } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EditUserModal } from '@/components/modals/EditUserModal';
import { DeleteUserModal } from '@/components/modals/DeleteUserModal';
import { UserDeletionSummaryModal } from '@/components/modals/UserDeletionSummaryModal';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus, 
  Download,
  RefreshCw,
  Users,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

type User = Database['public']['Tables']['users']['Row'];

interface UsersTableProps {
  className?: string;
}

type SortField = 'full_name' | 'email' | 'role' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export function UsersTable({ className }: UsersTableProps) {
  const { users, loading, error, stats, refetch } = useUsers();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Summary modal state
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [deletionResult, setDeletionResult] = useState<any>(null);

  // Create user modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });

    // Sort users
    filtered.sort((a, b) => {
      if (sortField === 'created_at' || sortField === 'updated_at') {
        const aTime = new Date(a[sortField] as string).getTime();
        const bTime = new Date(b[sortField] as string).getTime();
        
        if (sortDirection === 'asc') {
          return aTime < bTime ? -1 : aTime > bTime ? 1 : 0;
        } else {
          return aTime > bTime ? -1 : aTime < bTime ? 1 : 0;
        }
      } else {
        const aValue = ((a[sortField] as string) || '').toLowerCase();
        const bValue = ((b[sortField] as string) || '').toLowerCase();
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      }
    });

    return filtered;
  }, [users, searchTerm, selectedRole, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleSaveUser = (updatedUser: User) => {
    // Refresh the users list to show updated data
    refetch();
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (confirmationText: string) => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      console.log('🗑️ Deleting user:', userToDelete.full_name, userToDelete.email);
      
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      const result = await response.json();
      console.log('✅ User deleted successfully:', result);
      
      // Refresh the users list
      refetch();
      
      // Close modal
      setDeleteModalOpen(false);
      setUserToDelete(null);
      
      // Show success summary modal instead of alert
      setDeletionResult(result);
      setSummaryModalOpen(true);
      
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateUser = (user: any) => {
    console.log('✅ User created successfully:', user);
    // Refresh the users list to show the new user
    refetch();
  };

  const refreshUsers = () => {
    // Use refetch instead of full page reload
    refetch();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'contractor':
        return 'bg-blue-100 text-blue-800';
      case 'inspector':
        return 'bg-green-100 text-green-800';
      case 'client':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(users.map(user => user.role).filter(Boolean))];
    return roles;
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">⚠️</div>
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Users</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={refreshUsers}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200", className)}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Users Management</h2>
              <p className="text-sm text-gray-500">
                Manage all platform users • {stats.totalUsers} total • {stats.activeUsers} active
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshUsers}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button 
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>
                  {role?.charAt(0).toUpperCase() + role?.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('full_name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>User</span>
                    {sortField === 'full_name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Role</span>
                    {sortField === 'role' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Joined</span>
                    {sortField === 'created_at' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-orange-500 text-white text-sm">
                          {getInitials(user.full_name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name provided'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={cn("text-xs", getRoleBadgeColor(user.role))}>
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      {user.phone && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          console.log('🔍 UsersTable - View Profile clicked for user:', user.id);
                          console.log('🔍 UsersTable - Navigating to URL:', `/users/${user.id}`);
                          router.push(`/users/${user.id}`);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredAndSortedUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedRole !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first user.'
              }
            </p>
          </div>
        )}

        {/* Results Summary */}
        {filteredAndSortedUsers.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {filteredAndSortedUsers.length} of {stats.totalUsers} users
              {(searchTerm || selectedRole !== 'all') && ' (filtered)'}
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        user={userToDelete}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />

      {/* User Deletion Summary Modal */}
      <UserDeletionSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        result={deletionResult}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onUserCreated={handleCreateUser}
      />
    </>
  );
}
