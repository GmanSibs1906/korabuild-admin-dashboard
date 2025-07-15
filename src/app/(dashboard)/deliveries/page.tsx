'use client';

import React, { useState } from 'react';
import { useDeliveries } from '@/hooks/useDeliveries';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Truck, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Package,
  Search,
  
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
    in_transit: { color: 'bg-yellow-100 text-yellow-800', icon: Truck },
    arrived: { color: 'bg-green-100 text-green-800', icon: MapPin },
    unloading: { color: 'bg-orange-100 text-orange-800', icon: Package },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
    cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    rescheduled: { color: 'bg-purple-100 text-purple-800', icon: Calendar }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
  const Icon = config.icon;
  
  return (
    <Badge className={cn("flex items-center gap-1", config.color)}>
      <Icon className="w-3 h-3" />
      {status.replace('_', ' ')}
    </Badge>
  );
};

const ConditionBadge = ({ condition }: { condition: string }) => {
  const conditionConfig = {
    excellent: { color: 'bg-green-100 text-green-800' },
    good: { color: 'bg-blue-100 text-blue-800' },
    fair: { color: 'bg-yellow-100 text-yellow-800' },
    poor: { color: 'bg-orange-100 text-orange-800' },
    damaged: { color: 'bg-red-100 text-red-800' }
  };
  
  const config = conditionConfig[condition as keyof typeof conditionConfig] || conditionConfig.good;
  
  return (
    <Badge className={cn("capitalize", config.color)}>
      {condition}
    </Badge>
  );
};

export default function DeliveriesPage() {
  const { deliveries, loading, error, stats } = useDeliveries();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.delivery_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.order?.project?.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.driver_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || delivery.delivery_status === selectedStatus;
    
    let matchesTimeframe = true;
    if (selectedTimeframe !== 'all') {
      const deliveryDate = new Date(delivery.delivery_date);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      switch (selectedTimeframe) {
        case 'today':
          matchesTimeframe = deliveryDate.toDateString() === today.toDateString();
          break;
        case 'tomorrow':
          matchesTimeframe = deliveryDate.toDateString() === tomorrow.toDateString();
          break;
        case 'week':
          matchesTimeframe = deliveryDate >= today && deliveryDate <= weekFromNow;
          break;
        case 'overdue':
          matchesTimeframe = deliveryDate < today && ['scheduled', 'in_transit'].includes(delivery.delivery_status);
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesTimeframe;
  });

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not set';
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2">Loading deliveries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Deliveries</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-600 mt-1">Track and manage all project deliveries</p>
        </div>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Schedule Delivery
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingDeliveries}</p>
              <p className="text-xs text-gray-500">Next 7 days</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inTransitDeliveries}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Navigation className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgentDeliveries}</p>
              <p className="text-xs text-gray-500">Today & overdue</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search deliveries..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {Object.keys(stats.deliveriesByStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')} ({stats.deliveriesByStatus[status]})
                </option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.delivery_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Order: {delivery.order?.order_number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {delivery.order?.project?.project_name || 'No Project'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {delivery.order?.supplier?.supplier_name || 'No Supplier'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(delivery.delivery_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime(delivery.scheduled_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {delivery.driver_name || 'Not assigned'}
                    </div>
                    {delivery.driver_phone && (
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-1" />
                        {delivery.driver_phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={delivery.delivery_status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {delivery.receiving_condition ? (
                      <ConditionBadge condition={delivery.receiving_condition} />
                    ) : (
                      <span className="text-gray-400">Not received</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDeliveries.length === 0 && (
          <div className="text-center py-8">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedStatus !== 'all' || selectedTimeframe !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Schedule your first delivery to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
