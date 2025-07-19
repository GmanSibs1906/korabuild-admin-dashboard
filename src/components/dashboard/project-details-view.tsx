'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { useFinances } from '@/hooks/useFinances';
import { useActivity } from '@/hooks/useActivity';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  Eye,
  Edit,
  Phone,
  Mail,
  FileText,
  Target,
  Zap,
  Activity,
  BarChart3,
  Wallet,
  CreditCard,
  Receipt,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectDetailsViewProps {
  projectId: string;
}

interface TabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function ProjectDetailsView({ projectId }: ProjectDetailsViewProps) {
  const router = useRouter();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { financialData, isLoading: financesLoading, error: financesError } = useFinances({ projectId });
  const { activities, loading: activitiesLoading } = useActivity();
  
  const [activeTab, setActiveTab] = useState('overview');

  // Find the specific project
  const project = projects.find(p => p.id === projectId);

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading project details...</span>
      </div>
    );
  }

  if (projectsError || !project) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading project</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{projectsError || 'Project not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Calendar className="h-5 w-5" />;
      case 'in_progress':
        return <PlayCircle className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'on_hold':
        return <PauseCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 70) return <TrendingUp className="h-5 w-5 text-orange-600" />;
    if (score >= 50) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateToLocal = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const financialOverview = financialData?.overview;
  const projectPayments = financialData?.payments || [];
  const projectBudgets = financialData?.budgets || [];
  const projectCreditAccounts = financialData?.creditAccounts || [];

  const formatCurrencyLocal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Projects
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 text-orange-600 mr-2" />
              {project.project_name}
            </h1>
            <p className="text-gray-600 flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {project.project_address}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
            getStatusColor(project.status)
          )}>
            {getStatusIcon(project.status)}
            <span className="ml-1 capitalize">{project.status.replace('_', ' ')}</span>
          </Badge>
          <button
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{project.progress_percentage || 0}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${project.progress_percentage || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contract Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.contract_value || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {project.stats?.activeContractors || 0} active contractors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Score</p>
                <div className="flex items-center">
                  <p className={cn("text-2xl font-bold", getHealthColor(project.stats?.healthScore || 0))}>
                    {project.stats?.healthScore || 0}
                  </p>
                  <span className="text-sm text-gray-500 ml-1">/100</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                {getHealthIcon(project.stats?.healthScore || 0)}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {project.stats?.completedMilestones || 0}/{project.stats?.totalMilestones || 0} milestones completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Days Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.ceil((new Date(project.expected_completion).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Due {formatDate(project.expected_completion)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'finances', label: 'Finances', icon: Wallet },
            { id: 'milestones', label: 'Milestones', icon: Target },
            { id: 'activity', label: 'Activity', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center py-4 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <OverviewTab project={project} />
        )}
        {activeTab === 'finances' && (
          <FinancesTab 
            project={project}
            financialData={financialData}
            loading={financesLoading}
            error={financesError}
          />
        )}
        {activeTab === 'milestones' && (
          <MilestonesTab project={project} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab 
            activities={activities}
            loading={activitiesLoading}
            projectId={projectId}
          />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ project }: { project: any }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Project Information */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Project Name</label>
              <p className="text-sm text-gray-900">{project.project_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Current Phase</label>
              <p className="text-sm text-gray-900">{project.current_phase}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Project Type</label>
              <p className="text-sm text-gray-900">{project.project_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <p className="text-sm text-gray-900">{formatDate(project.start_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Expected Completion</label>
              <p className="text-sm text-gray-900">{formatDate(project.expected_completion)}</p>
            </div>
            {project.actual_completion && (
              <div>
                <label className="text-sm font-medium text-gray-500">Actual Completion</label>
                <p className="text-sm text-green-600">{formatDate(project.actual_completion)}</p>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="text-sm text-gray-900">{project.project_address}</p>
          </div>
          {project.description && (
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-sm text-gray-900">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.client ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-sm text-gray-900">{project.client.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {project.client.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-sm text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {project.client.phone}
                </p>
              </div>
              {project.client.company_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Company</label>
                  <p className="text-sm text-gray-900">{project.client.company_name}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No client information available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Finances Tab Component
function FinancesTab({ project, financialData, loading, error }: { 
  project: any; 
  financialData: any; 
  loading: boolean; 
  error: any; 
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading financial data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading financial data</h3>
            <p className="text-sm text-red-700 mt-1">{error.error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const financialOverview = financialData?.overview;
  const payments = financialData?.payments || [];
  const budgets = financialData?.budgets || [];
  const creditAccounts = financialData?.creditAccounts || [];

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(financialOverview?.totalPayments || 0)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(financialOverview?.totalBudget || 0)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget Variance</p>
                <p className={cn(
                  "text-xl font-bold",
                  (financialOverview?.budgetVariance || 0) >= 0 ? "text-red-600" : "text-green-600"
                )}>
                  {(financialOverview?.budgetVariance || 0) >= 0 ? "+" : ""}
                  {(financialOverview?.budgetVariance || 0).toFixed(1)}%
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Available</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency((financialOverview?.totalCreditLimit || 0) - (financialOverview?.totalCreditUsed || 0))}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.slice(0, 5).map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.description}</p>
                    <p className="text-sm text-gray-500">
                      {payment.milestone?.milestone_name} • {payment.payment_method}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                    <Badge className={cn(
                      "text-xs",
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    )}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No payments found for this project</p>
          )}
        </CardContent>
      </Card>

      {/* Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map((budget: any) => (
                <div key={budget.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{budget.budget_name}</p>
                    <p className="text-sm text-gray-500">
                      {budget.milestone?.milestone_name} • {budget.category?.category_name}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">
                        Budgeted: {formatCurrency(budget.budgeted_amount)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Actual: {formatCurrency(budget.actual_amount)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      budget.variance_percentage >= 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {budget.variance_percentage >= 0 ? "+" : ""}
                      {budget.variance_percentage.toFixed(1)}%
                    </p>
                    <Badge className={cn(
                      "text-xs",
                      budget.status === 'exceeded' ? 'bg-red-100 text-red-800' : 
                      budget.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      'bg-blue-100 text-blue-800'
                    )}>
                      {budget.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No budget information available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Milestones Tab Component
function MilestonesTab({ project }: { project: any }) {
  // This would typically fetch milestone data from the database
  // For now, we'll show basic project milestone information
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Site Preparation</p>
                <p className="text-sm text-gray-500">Foundation and groundwork</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Foundation Work</p>
                <p className="text-sm text-gray-500">Concrete foundation and structural base</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
                <PlayCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Framing & Structure</p>
                <p className="text-sm text-gray-500">Building frame and structural elements</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Activity Tab Component
function ActivityTab({ activities, loading, projectId }: { activities: any[]; loading: boolean; projectId: string }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading activity...</span>
      </div>
    );
  }

  // Filter activities related to this project (for now showing all activities)
  // In a real implementation, you would filter by project_id or related entities
  const projectActivities = activities.slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <p className="text-sm text-gray-500">
            Project-related activities and system updates
          </p>
        </CardHeader>
        <CardContent>
          {projectActivities.length > 0 ? (
            <div className="space-y-4">
              {projectActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">{activity.timestamp}</p>
                      {activity.user && (
                        <p className="text-xs text-gray-600">by {activity.user}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Activity will appear here as the project progresses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 