'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  DollarSign,
  MessageCircle,
  UserCheck,
  ShieldCheck,
  Calendar,
  BarChart3,
  FileText,
  Wrench,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermissions?: Array<{
    resource: string;
    action: string;
  }>;
  badge?: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    requiredPermissions: [{ resource: 'users', action: 'view' }],
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    requiredPermissions: [{ resource: 'projects', action: 'view' }],
  },
  {
    name: 'Finances',
    href: '/finances',
    icon: DollarSign,
    requiredPermissions: [{ resource: 'finances', action: 'view' }],
  },
  {
    name: 'Communications',
    href: '/communications',
    icon: MessageCircle,
    requiredPermissions: [{ resource: 'communications', action: 'view_all' }],
    badge: '3', // Example unread count
  },
  {
    name: 'Contractors',
    href: '/contractors',
    icon: UserCheck,
    requiredPermissions: [{ resource: 'contractors', action: 'view' }],
  },
  {
    name: 'Quality',
    href: '/quality',
    icon: ShieldCheck,
    requiredPermissions: [{ resource: 'quality', action: 'view_inspections' }],
  },
  {
    name: 'Schedule',
    href: '/schedule',
    icon: Calendar,
    requiredPermissions: [{ resource: 'projects', action: 'view' }],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    name: 'Safety',
    href: '/safety',
    icon: Wrench,
    requiredPermissions: [{ resource: 'safety', action: 'view_incidents' }],
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: Wrench,
  },
];

const systemNavigation: NavigationItem[] = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermissions: [{ resource: 'system', action: 'manage_settings' }],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  console.log('🔍 AdminLayout - Rendering with pathname:', usePathname());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAdminAuth();

  const handleSignOut = async () => {
    try {
      await auth.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isNavigationItemVisible = (item: NavigationItem): boolean => {
    if (!item.requiredPermissions) return true;
    
    return item.requiredPermissions.every(perm =>
      auth.hasPermission(perm.resource as any, perm.action)
    );
  };

  const userInitials = auth.user ? getInitials(auth.user.full_name) : 'AD';
  const roleBadgeColor = {
    super_admin: 'bg-purple-100 text-purple-800',
    project_manager: 'bg-blue-100 text-blue-800',
    finance_admin: 'bg-green-100 text-green-800',
    support_admin: 'bg-yellow-100 text-yellow-800',
  };

  // Show loading state while authenticating
  if (auth.loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KB</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">KoraBuild</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.filter(isNavigationItemVisible).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-orange-50 text-orange-700 border-r-2 border-orange-500"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-orange-500" : "text-gray-400"
                    )} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 px-2 py-1 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}

            {/* System Navigation */}
            <div className="pt-6 mt-6 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                System
              </h3>
              <div className="mt-2 space-y-1">
                {systemNavigation.filter(isNavigationItemVisible).map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-orange-50 text-orange-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 mr-3",
                        isActive ? "text-orange-500" : "text-gray-400"
                      )} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={auth.user?.profile_photo_url} />
                <AvatarFallback className="bg-orange-500 text-white text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {auth.user?.full_name}
                </p>
                <Badge className={cn("text-xs", roleBadgeColor[auth.user?.admin_role || 'support_admin'])}>
                  {auth.user?.admin_role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Help */}
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={auth.user?.profile_photo_url} />
                    <AvatarFallback className="bg-orange-500 text-white text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{auth.user?.full_name}</p>
                      <p className="text-xs text-gray-500">{auth.user?.email}</p>
                      <Badge className={cn("text-xs w-fit", roleBadgeColor[auth.user?.admin_role || 'support_admin'])}>
                        {auth.user?.admin_role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 