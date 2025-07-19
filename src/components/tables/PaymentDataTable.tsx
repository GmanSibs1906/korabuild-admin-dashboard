'use client';

import React, { useState, useMemo } from 'react';
import { 
  Payment, 
  PaymentFilters, 
  PaymentPagination,
  PAYMENT_STATUSES,
  PAYMENT_CATEGORIES,
  PAYMENT_METHODS 
} from '@/types/payments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentDataTableProps {
  payments: Payment[];
  loading?: boolean;
  pagination: PaymentPagination | null;
  filters: PaymentFilters;
  onFiltersChange: (filters: Partial<PaymentFilters>) => void;
  onPaymentEdit: (payment: Payment) => void;
  onPaymentDelete: (payment: Payment) => void;
  onPaymentView: (payment: Payment) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
}

export function PaymentDataTable({
  payments,
  loading = false,
  pagination,
  filters,
  onFiltersChange,
  onPaymentEdit,
  onPaymentDelete,
  onPaymentView,
  onRefresh,
  onExport,
  className
}: PaymentDataTableProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const categoryConfig = PAYMENT_CATEGORIES.find(c => c.value === category);
    return categoryConfig?.icon || 'MoreHorizontal';
  };

  // Handle search
  const handleSearch = () => {
    onFiltersChange({ search: localSearch, page: 1 });
  };

  // Handle sort
  const handleSort = (field: string) => {
    const newSortOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
    onFiltersChange({ 
      sort_by: field, 
      sort_order: newSortOrder,
      page: 1 
    });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    onFiltersChange({ page: newPage });
  };

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (filters.sort_by !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return filters.sort_order === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Render pagination info
  const renderPaginationInfo = () => {
    if (!pagination) return null;
    
    const start = (pagination.current_page - 1) * pagination.per_page + 1;
    const end = Math.min(start + pagination.per_page - 1, pagination.total_count);
    
    return (
      <span className="text-sm text-gray-700">
        Showing {start} to {end} of {pagination.total_count} payments
      </span>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Search and Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Payment History</CardTitle>
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              )}
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search payments by description or reference..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-gray-50 rounded-lg">
              <Select
                value={filters.status || ''}
                onValueChange={(value) => onFiltersChange({ status: value || undefined, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.payment_category || ''}
                onValueChange={(value) => onFiltersChange({ payment_category: value || undefined, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {PAYMENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Start Date"
                value={filters.start_date || ''}
                onChange={(e) => onFiltersChange({ start_date: e.target.value || undefined, page: 1 })}
              />

              <Input
                type="date"
                placeholder="End Date"
                value={filters.end_date || ''}
                onChange={(e) => onFiltersChange({ end_date: e.target.value || undefined, page: 1 })}
              />

              <Input
                type="number"
                placeholder="Min Amount"
                value={filters.min_amount || ''}
                onChange={(e) => onFiltersChange({ min_amount: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 })}
              />

              <Input
                type="number"
                placeholder="Max Amount"
                value={filters.max_amount || ''}
                onChange={(e) => onFiltersChange({ max_amount: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 })}
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Data Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('payment_date')}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Date
                      {renderSortIcon('payment_date')}
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Amount
                      {renderSortIcon('amount')}
                    </div>
                  </TableHead>
                  
                  <TableHead>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Description
                    </div>
                  </TableHead>
                  
                  <TableHead>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Project
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('payment_category')}
                  >
                    <div className="flex items-center">
                      Category
                      {renderSortIcon('payment_category')}
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {renderSortIcon('status')}
                    </div>
                  </TableHead>
                  
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading payments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No payments found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {formatDate(payment.payment_date)}
                      </TableCell>
                      
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-xs truncate" title={payment.description}>
                          {payment.description}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="font-medium text-sm">
                              {payment.projects?.project_name}
                            </div>
                            {payment.projects?.users && (
                              <div className="text-xs text-gray-500">
                                {payment.projects.users.full_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs text-orange-500">
                            {PAYMENT_CATEGORIES.find(c => c.value === payment.payment_category)?.label || payment.payment_category}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                          {PAYMENT_STATUSES.find(s => s.value === payment.status)?.label || payment.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="font-mono text-sm">
                        {payment.reference}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onPaymentView(payment)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPaymentEdit(payment)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onPaymentDelete(payment)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Payment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center space-x-2">
                {renderPaginationInfo()}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.current_page === pageNum ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {pagination.total_pages > 5 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <Button
                        variant={pagination.current_page === pagination.total_pages ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pagination.total_pages)}
                        className="w-8 h-8 p-0"
                      >
                        {pagination.total_pages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.total_pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 