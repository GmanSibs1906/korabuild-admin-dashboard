'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Calendar, 
  X, 
  ChevronDown,
  Users,
  Building2,
  Tag,
  Clock,
  Flag,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface RequestFiltersProps {
  onFiltersChange: (filters: RequestFilterState) => void;
  stats?: {
    totalProjects: number;
    totalClients: number;
    statusCounts?: Record<string, number>;
    priorityCounts?: Record<string, number>;
    categoryCounts?: Record<string, number>;
  };
}

export interface RequestFilterState {
  search: string;
  status: string[];
  priority: string[];
  category: string[];
  dateRange: {
    from: string;
    to: string;
  };
  projectId: string;
  clientId: string;
}

const initialFilters: RequestFilterState = {
  search: '',
  status: [],
  priority: [],
  category: [],
  dateRange: { from: '', to: '' },
  projectId: '',
  clientId: '',
};

export function RequestFilters({ onFiltersChange, stats }: RequestFiltersProps) {
  const [filters, setFilters] = useState<RequestFilterState>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Dynamic status options from props
  const statusOptions: FilterOption[] = [
    { label: 'Submitted', value: 'submitted', count: stats?.statusCounts?.submitted || 0 },
    { label: 'Reviewing', value: 'reviewing', count: stats?.statusCounts?.reviewing || 0 },
    { label: 'In Progress', value: 'in_progress', count: stats?.statusCounts?.in_progress || 0 },
    { label: 'Completed', value: 'completed', count: stats?.statusCounts?.completed || 0 },
    { label: 'Cancelled', value: 'cancelled', count: stats?.statusCounts?.cancelled || 0 },
  ].filter(option => option.count > 0); // Only show options with data

  // Dynamic priority options from props
  const priorityOptions: FilterOption[] = [
    { label: 'Low', value: 'low', count: stats?.priorityCounts?.low || 0 },
    { label: 'Medium', value: 'medium', count: stats?.priorityCounts?.medium || 0 },
    { label: 'High', value: 'high', count: stats?.priorityCounts?.high || 0 },
    { label: 'Urgent', value: 'urgent', count: stats?.priorityCounts?.urgent || 0 },
  ].filter(option => option.count > 0); // Only show options with data

  // Dynamic category options from database categories
  const categoryOptions: FilterOption[] = stats?.categoryCounts ? 
    Object.entries(stats.categoryCounts).map(([key, count]) => ({
      label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: key,
      count
    })).filter(option => option.count > 0) : [];

  const updateFilters = (newFilters: Partial<RequestFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const toggleMultiSelectFilter = (
    filterType: 'status' | 'priority' | 'category',
    value: string
  ) => {
    const currentValues = filters[filterType];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateFilters({ [filterType]: newValues });
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    onFiltersChange(initialFilters);
  };

  const hasActiveFilters = 
    filters.search ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.category.length > 0 ||
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.projectId ||
    filters.clientId;

  const activeFilterCount = 
    (filters.search ? 1 : 0) +
    filters.status.length +
    filters.priority.length +
    filters.category.length +
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
    (filters.projectId ? 1 : 0) +
    (filters.clientId ? 1 : 0);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2 text-orange-600" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2 bg-orange-500">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search requests by title, description, or client name..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.slice(0, 3).map((option) => (
            <Button
              key={option.value}
              variant={filters.status.includes(option.value) ? "primary" : "outline"}
              size="sm"
              onClick={() => toggleMultiSelectFilter('status', option.value)}
              className={cn(
                "text-xs",
                filters.status.includes(option.value) && "bg-orange-500 hover:bg-orange-600"
              )}
            >
              {option.label}
              {option.count && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {option.count}
                </Badge>
              )}
            </Button>
          ))}
          
          {priorityOptions.slice(-2).map((option) => (
            <Button
              key={option.value}
              variant={filters.priority.includes(option.value) ? "primary" : "outline"}
              size="sm"
              onClick={() => toggleMultiSelectFilter('priority', option.value)}
              className={cn(
                "text-xs",
                filters.priority.includes(option.value) && 
                (option.value === 'urgent' ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600")
              )}
            >
              {option.label}
              {option.count && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {option.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Advanced Filters (Expandable) */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Status
              </label>
              <div className="space-y-1">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => toggleMultiSelectFilter('status', option.value)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                    {option.count && (
                      <Badge variant="outline" className="text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Flag className="h-4 w-4 mr-1" />
                Priority
              </label>
              <div className="space-y-1">
                {priorityOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(option.value)}
                      onChange={() => toggleMultiSelectFilter('priority', option.value)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                    {option.count && (
                      <Badge variant="outline" className="text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Category
              </label>
              <div className="space-y-1">
                {categoryOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(option.value)}
                      onChange={() => toggleMultiSelectFilter('category', option.value)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                    {option.count && (
                      <Badge variant="outline" className="text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Date Range
              </label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={filters.dateRange.from}
                  onChange={(e) => updateFilters({ 
                    dateRange: { ...filters.dateRange, from: e.target.value }
                  })}
                  className="text-sm"
                />
                <Input
                  type="date"
                  value={filters.dateRange.to}
                  onChange={(e) => updateFilters({ 
                    dateRange: { ...filters.dateRange, to: e.target.value }
                  })}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Project Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                Project
              </label>
              <Select 
                value={filters.projectId} 
                onValueChange={(value) => updateFilters({ projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All projects</SelectItem>
                  <SelectItem value="1">Sam Jones's Construction Project</SelectItem>
                  <SelectItem value="2">Downtown Office Building</SelectItem>
                  <SelectItem value="3">Residential Complex Phase 1</SelectItem>
                  <SelectItem value="4">Shopping Mall Renovation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Client
              </label>
              <Select 
                value={filters.clientId} 
                onValueChange={(value) => updateFilters({ clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All clients</SelectItem>
                  <SelectItem value="1">Sam Jones</SelectItem>
                  <SelectItem value="2">Maria Garcia</SelectItem>
                  <SelectItem value="3">John Smith</SelectItem>
                  <SelectItem value="4">Lisa Chen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {filters.search && (
              <Badge variant="secondary" className="flex items-center">
                Search: "{filters.search}"
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilters({ search: '' })}
                />
              </Badge>
            )}
            
            {filters.status.map((status) => (
              <Badge key={status} variant="secondary" className="flex items-center">
                Status: {statusOptions.find(o => o.value === status)?.label}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleMultiSelectFilter('status', status)}
                />
              </Badge>
            ))}
            
            {filters.priority.map((priority) => (
              <Badge key={priority} variant="secondary" className="flex items-center">
                Priority: {priorityOptions.find(o => o.value === priority)?.label}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleMultiSelectFilter('priority', priority)}
                />
              </Badge>
            ))}
            
            {filters.category.map((category) => (
              <Badge key={category} variant="secondary" className="flex items-center">
                Category: {categoryOptions.find(o => o.value === category)?.label}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleMultiSelectFilter('category', category)}
                />
              </Badge>
            ))}
            
            {(filters.dateRange.from || filters.dateRange.to) && (
              <Badge variant="secondary" className="flex items-center">
                Date: {filters.dateRange.from || 'Start'} - {filters.dateRange.to || 'End'}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilters({ dateRange: { from: '', to: '' } })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 