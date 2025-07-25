'use client';

import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useContractors } from '@/hooks/useContractors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Users, 
  UserCheck, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Eye,
  RefreshCw,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Project {
  id: string;
  project_name: string;
  project_address: string;
  status: string;
  client?: {
    full_name: string;
  };
}

interface Contractor {
  id: string;
  contractor_name: string;
  company_name: string;
  email: string;
  phone: string;
  trade_specialization: string;
  verification_status: string;
  contractor_source: string;
}

const TRADE_SPECIALIZATIONS = [
  'general_contractor',
  'electrical',
  'plumbing',
  'hvac',
  'roofing',
  'painting',
  'flooring',
  'tiling',
  'carpentry',
  'masonry',
  'landscaping',
  'excavation',
  'concrete',
  'steel_work',
  'glazing',
  'drywall',
  'insulation',
  'waterproofing',
  'solar',
  'security'
];

export default function ContractorsPage() {
  const { projects, refreshProjects } = useProjects();
  const { 
    projectContractors, 
    stats, 
    projectStats, 
    loading, 
    error, 
    fetchProjectContractors,
    addContractor,
    updateContractor,
    assignContractorToProject,
    updateProjectAssignment
  } = useContractors();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [isAddContractorOpen, setIsAddContractorOpen] = useState(false);
  const [isAssignContractorOpen, setIsAssignContractorOpen] = useState(false);
  const [isEditContractorOpen, setIsEditContractorOpen] = useState(false);
  const [contractorToEdit, setContractorToEdit] = useState<any>(null);
  const [isContractorDetailsOpen, setIsContractorDetailsOpen] = useState(false);
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'projects' | 'all_contractors'>('projects');
  
  // All contractors view states
  const [allContractors, setAllContractors] = useState<any[]>([]);
  const [contractorSearchTerm, setContractorSearchTerm] = useState('');
  const [selectedTradeFilter, setSelectedTradeFilter] = useState<string>('all');
  const [filteredContractors, setFilteredContractors] = useState<any[]>([]);
  const [loadingAllContractors, setLoadingAllContractors] = useState(false);

  // Filter projects based on search
  useEffect(() => {
    if (!projects) return;
    
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

  // Load project contractors when project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchProjectContractors(selectedProject.id);
    }
  }, [selectedProject, fetchProjectContractors]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'verified':
      case 'on_site':
      case 'completed':
      case 'user_approved':
        return 'default';
      case 'draft':  
      case 'pending':
      case 'scheduled':
      case 'pending_approval':
        return 'secondary';
      case 'draft':
        return 'outline';
      case 'suspended':
      case 'terminated':
      case 'rejected':
      case 'not_started':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'verified':
      case 'on_site':
      case 'completed':
      case 'user_approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'scheduled':
      case 'pending_approval':
        return <Clock className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'suspended':
      case 'terminated':
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Helper function to determine who added the contractor
  const getContractorAddedBy = (contractor: any) => {
    // Check if contractor has created_by_user information
    if (contractor.created_by_user) {
      return {
        type: 'mobile_user',
        name: contractor.created_by_user.full_name || contractor.created_by_user.email,
        label: 'Mobile App User'
      };
    }
    
    // Check verification status and other indicators
    if (contractor.verification_status === 'korabuild_verified') {
      return {
        type: 'korabuild',
        name: 'KoraBuild',
        label: 'KoraBuild Verified'
      };
    }
    
    // Default to admin dashboard
    return {
      type: 'admin',
      name: 'Admin Dashboard',
      label: 'Admin Added'
    };
  };

  const getAddedByBadgeVariant = (type: string) => {
    switch (type) {
      case 'mobile_user':
        return 'secondary';
      case 'korabuild':
        return 'default';
      case 'admin':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Fetch all contractors for the all contractors tab
  const fetchAllContractors = async () => {
    try {
      setLoadingAllContractors(true);
      const response = await fetch('/api/contractors');
      if (!response.ok) {
        throw new Error('Failed to fetch contractors');
      }
      const { data } = await response.json();
      setAllContractors(data.contractors || []);
    } catch (error) {
      console.error('Error fetching all contractors:', error);
    } finally {
      setLoadingAllContractors(false);
    }
  };

  // Filter contractors based on search term and trade
  useEffect(() => {
    if (!allContractors) return;
    
    let filtered = allContractors;
    
    // Filter by trade
    if (selectedTradeFilter !== 'all') {
      filtered = filtered.filter(contractor => 
        contractor.trade_specialization === selectedTradeFilter
      );
    }
    
    // Filter by search term
    if (contractorSearchTerm.trim() !== '') {
      filtered = filtered.filter(contractor => 
        contractor.contractor_name.toLowerCase().includes(contractorSearchTerm.toLowerCase()) ||
        contractor.company_name.toLowerCase().includes(contractorSearchTerm.toLowerCase()) ||
        contractor.email.toLowerCase().includes(contractorSearchTerm.toLowerCase()) ||
        contractor.phone.toLowerCase().includes(contractorSearchTerm.toLowerCase())
      );
    }
    
    setFilteredContractors(filtered);
  }, [allContractors, contractorSearchTerm, selectedTradeFilter]);

  // Fetch all contractors when tab changes
  useEffect(() => {
    if (activeTab === 'all_contractors' && allContractors.length === 0) {
      fetchAllContractors();
    }
  }, [activeTab, allContractors.length]);

  const AddContractorForm = () => {
    const [formData, setFormData] = useState({
      contractor_name: '',
      company_name: '',
      primary_contact_name: '',
      email: '',
      phone: '',
      emergency_contact: '',
      trade_specialization: '',
      secondary_specializations: [],
      physical_address: '',
      postal_address: '',
      license_number: '',
      license_type: '',
      insurance_provider: '',
      insurance_policy_number: '',
      years_in_business: '',
      number_of_employees: '',
      hourly_rate: '',
      daily_rate: '',
      minimum_project_value: '',
      service_areas: [],
      travel_radius_km: '50',
      payment_terms: '30 days',
      tax_number: '',
      website_url: '',
      notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        await addContractor({
          ...formData,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
          minimum_project_value: formData.minimum_project_value ? parseFloat(formData.minimum_project_value) : null,
          years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : 0,
          number_of_employees: formData.number_of_employees ? parseInt(formData.number_of_employees) : 1,
          travel_radius_km: formData.travel_radius_km ? parseInt(formData.travel_radius_km) : 50,
          secondary_specializations: formData.secondary_specializations,
          service_areas: formData.service_areas,
          contractor_source: 'user_added',
          verification_status: 'pending',
        });
        
        setIsAddContractorOpen(false);
        
        // Reset form
        setFormData({
          contractor_name: '',
          company_name: '',
          primary_contact_name: '',
          email: '',
          phone: '',
          emergency_contact: '',
          trade_specialization: '',
          secondary_specializations: [],
          physical_address: '',
          postal_address: '',
          license_number: '',
          license_type: '',
          insurance_provider: '',
          insurance_policy_number: '',
          years_in_business: '',
          number_of_employees: '',
          hourly_rate: '',
          daily_rate: '',
          minimum_project_value: '',
          service_areas: [],
          travel_radius_km: '50',
          payment_terms: '30 days',
          tax_number: '',
          website_url: '',
          notes: '',
        });
        
        console.log('✅ Contractor added successfully');
        
      } catch (error) {
        console.error('❌ Error adding contractor:', error);
        // You might want to show a toast notification here
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contractor_name">Contractor Name *</Label>
              <Input
                id="contractor_name"
                value={formData.contractor_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contractor_name: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_contact_name">Primary Contact Name *</Label>
              <Input
                id="primary_contact_name"
                value={formData.primary_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                placeholder="Emergency contact person and number"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Trade Specialization */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Trade Specialization</h4>
          <div>
            <Label htmlFor="trade_specialization">Primary Trade Specialization *</Label>
            <Select 
              value={formData.trade_specialization} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, trade_specialization: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select primary trade specialization" />
              </SelectTrigger>
              <SelectContent>
                {TRADE_SPECIALIZATIONS.map((trade) => (
                  <SelectItem key={trade} value={trade}>
                    {trade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Address Information</h4>
          <div>
            <Label htmlFor="physical_address">Physical Address</Label>
            <Textarea
              id="physical_address"
              value={formData.physical_address}
              onChange={(e) => setFormData(prev => ({ ...prev, physical_address: e.target.value }))}
              rows={2}
              placeholder="Street address, city, province"
              disabled={isSubmitting}
              className="text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>
          <div>
            <Label htmlFor="postal_address">Postal Address</Label>
            <Textarea
              id="postal_address"
              value={formData.postal_address}
              onChange={(e) => setFormData(prev => ({ ...prev, postal_address: e.target.value }))}
              rows={2}
              placeholder="Postal address if different from physical"
              disabled={isSubmitting}
              className="text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>
        </div>

        {/* Business Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Business Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="years_in_business">Years in Business</Label>
              <Input
                id="years_in_business"
                type="number"
                value={formData.years_in_business}
                onChange={(e) => setFormData(prev => ({ ...prev, years_in_business: e.target.value }))}
                min="0"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="number_of_employees">Number of Employees</Label>
              <Input
                id="number_of_employees"
                type="number"
                value={formData.number_of_employees}
                onChange={(e) => setFormData(prev => ({ ...prev, number_of_employees: e.target.value }))}
                min="1"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="license_type">License Type</Label>
              <Input
                id="license_type"
                value={formData.license_type}
                onChange={(e) => setFormData(prev => ({ ...prev, license_type: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax_number">Tax Number</Label>
              <Input
                id="tax_number"
                value={formData.tax_number}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Insurance Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insurance_provider">Insurance Provider</Label>
              <Input
                id="insurance_provider"
                value={formData.insurance_provider}
                onChange={(e) => setFormData(prev => ({ ...prev, insurance_provider: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="insurance_policy_number">Policy Number</Label>
              <Input
                id="insurance_policy_number"
                value={formData.insurance_policy_number}
                onChange={(e) => setFormData(prev => ({ ...prev, insurance_policy_number: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Rates and Terms */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Rates and Terms</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                min="0"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="daily_rate">Daily Rate (USD)</Label>
              <Input
                id="daily_rate"
                type="number"
                value={formData.daily_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, daily_rate: e.target.value }))}
                min="0"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="minimum_project_value">Minimum Project Value (USD)</Label>
              <Input
                id="minimum_project_value"
                type="number"
                value={formData.minimum_project_value}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_project_value: e.target.value }))}
                min="0"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Select 
                value={formData.payment_terms} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="7 days">7 days</SelectItem>
                  <SelectItem value="14 days">14 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                  <SelectItem value="45 days">45 days</SelectItem>
                  <SelectItem value="60 days">60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="travel_radius_km">Travel Radius (km)</Label>
              <Input
                id="travel_radius_km"
                type="number"
                value={formData.travel_radius_km}
                onChange={(e) => setFormData(prev => ({ ...prev, travel_radius_km: e.target.value }))}
                min="1"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Additional Information</h4>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Additional notes about this contractor..."
              className="text-gray-900 placeholder-gray-400 bg-white"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAddContractorOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Adding Contractor...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Contractor
              </>
            )}
          </Button>
        </div>
      </form>
    );
  };

  // Assign Contractor Form Component
  const AssignContractorForm = ({ projectId, onSuccess }: { projectId?: string; onSuccess: () => void }) => {
    const [selectedContractorId, setSelectedContractorId] = useState('');
    const [selectedTradeForAssignment, setSelectedTradeForAssignment] = useState('');
    const [formData, setFormData] = useState({
      contract_status: 'pending_approval',
      on_site_status: 'not_started',
      contract_value: '',
      scope_of_work: '',
      work_completion_percentage: '0',
      start_date: '',
      planned_end_date: '',
      project_manager_notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableContractors, setAvailableContractors] = useState<any[]>([]);
    const [filteredContractorsForAssignment, setFilteredContractorsForAssignment] = useState<any[]>([]);
    const [loadingContractors, setLoadingContractors] = useState(true);

    // Fetch available contractors
    useEffect(() => {
      const fetchAvailableContractors = async () => {
        try {
          setLoadingContractors(true);
          
          const response = await fetch('/api/contractors');
          if (!response.ok) {
            throw new Error('Failed to fetch contractors');
          }
          
          const { data } = await response.json();
          setAvailableContractors(data.contractors || []);
        } catch (error) {
          console.error('Error fetching contractors:', error);
        } finally {
          setLoadingContractors(false);
        }
      };

      fetchAvailableContractors();
    }, []);

    // Filter contractors by selected trade
    useEffect(() => {
      if (!availableContractors) return;
      
      if (selectedTradeForAssignment) {
        const filtered = availableContractors.filter(contractor =>
          contractor.trade_specialization === selectedTradeForAssignment &&
          contractor.status === 'active'
        );
        setFilteredContractorsForAssignment(filtered);
      } else {
        setFilteredContractorsForAssignment([]);
      }
      
      // Reset contractor selection when trade changes
      setSelectedContractorId('');
    }, [availableContractors, selectedTradeForAssignment]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!selectedContractorId || !projectId) {
        console.error('Missing contractor ID or project ID');
        return;
      }

      if (!formData.scope_of_work.trim()) {
        console.error('Scope of work is required');
        alert('Please enter the scope of work for this contractor assignment.');
        return;
      }

      if (!formData.start_date) {
        console.error('Start date is required');
        alert('Please select a start date for this contractor assignment.');
        return;
      }

      setIsSubmitting(true);
      
      try {
        await assignContractorToProject({
          project_id: projectId,
          contractor_id: selectedContractorId,
          scope_of_work: formData.scope_of_work,
          contract_value: formData.contract_value ? parseFloat(formData.contract_value) : 0,
          start_date: formData.start_date,
          planned_end_date: formData.planned_end_date || null,
          contract_status: formData.contract_status,
          on_site_status: formData.on_site_status,
          work_completion_percentage: formData.work_completion_percentage ? parseInt(formData.work_completion_percentage) : 0,
          project_manager_notes: formData.project_manager_notes || null,
        });
        
        console.log('✅ Contractor assigned successfully');
        onSuccess();
      } catch (error) {
        console.error('❌ Error assigning contractor:', error);
        alert('Failed to assign contractor. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (loadingContractors) {
      return (
        <div className="flex items-center justify-center p-8">
          <Clock className="h-6 w-6 animate-spin mr-2 text-orange-500" />
          <span className="text-gray-700">Loading contractors...</span>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="trade_filter" className="text-gray-700">Select Trade First *</Label>
          <Select value={selectedTradeForAssignment} onValueChange={setSelectedTradeForAssignment}>
            <SelectTrigger>
              <SelectValue placeholder="Choose trade specialization to filter contractors" />
            </SelectTrigger>
            <SelectContent>
              {TRADE_SPECIALIZATIONS.map((trade) => (
                <SelectItem key={trade} value={trade}>
                  {trade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">Select a trade to see available contractors in that specialization</p>
        </div>

        <div>
          <Label htmlFor="contractor_select" className="text-gray-700">Select Contractor *</Label>
          <Select 
            value={selectedContractorId} 
            onValueChange={setSelectedContractorId}
            disabled={!selectedTradeForAssignment}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                selectedTradeForAssignment 
                  ? "Choose a contractor to assign" 
                  : "Select a trade first"
              } />
            </SelectTrigger>
            <SelectContent>
              {filteredContractorsForAssignment.map((contractor) => (
                <SelectItem key={contractor.id} value={contractor.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contractor.contractor_name}</span>
                    <span className="text-sm text-gray-500">- {contractor.company_name}</span>
                    {contractor.overall_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{contractor.overall_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTradeForAssignment && filteredContractorsForAssignment.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              No active contractors found for {selectedTradeForAssignment.replace('_', ' ')}. 
              <Button variant="ghost" className="p-0 h-auto text-orange-600 hover:text-orange-700" onClick={() => setIsAddContractorOpen(true)}>
                Add a new contractor
              </Button> for this trade.
            </p>
          )}
          {!selectedTradeForAssignment && (
            <p className="text-sm text-gray-500 mt-1">
              Please select a trade specialization first to see available contractors.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="scope_of_work" className="text-gray-700">Scope of Work *</Label>
          <Textarea
            id="scope_of_work"
            value={formData.scope_of_work}
            onChange={(e) => setFormData(prev => ({ ...prev, scope_of_work: e.target.value }))}
            rows={3}
            placeholder="Describe the work this contractor will perform on this project..."
            required
            disabled={isSubmitting}
            className="text-gray-900 placeholder-gray-400 bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date" className="text-gray-700">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              required
              disabled={isSubmitting}
              className="text-gray-900"
            />
          </div>
          <div>
            <Label htmlFor="planned_end_date" className="text-gray-700">Planned End Date</Label>
            <Input
              id="planned_end_date"
              type="date"
              value={formData.planned_end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, planned_end_date: e.target.value }))}
              disabled={isSubmitting}
              className="text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contract_value" className="text-gray-700">Contract Value (USD)</Label>
            <Input
              id="contract_value"
              type="number"
              step="0.01"
              min="0"
              value={formData.contract_value}
              onChange={(e) => setFormData(prev => ({ ...prev, contract_value: e.target.value }))}
              placeholder="0.00"
              disabled={isSubmitting}
              className="text-gray-900 placeholder-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="work_completion_percentage" className="text-gray-700">Work Completion (%)</Label>
            <Input
              id="work_completion_percentage"
              type="number"
              min="0"
              max="100"
              value={formData.work_completion_percentage}
              onChange={(e) => setFormData(prev => ({ ...prev, work_completion_percentage: e.target.value }))}
              disabled={isSubmitting}
              className="text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contract_status" className="text-gray-700">Contract Status</Label>
            <Select value={formData.contract_status} onValueChange={(value) => setFormData(prev => ({ ...prev, contract_status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="on_site_status" className="text-gray-700">On-Site Status</Label>
            <Select value={formData.on_site_status} onValueChange={(value) => setFormData(prev => ({ ...prev, on_site_status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select on-site status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="on_site">On Site</SelectItem>
                <SelectItem value="temporarily_off_site">Temporarily Off Site</SelectItem>
                <SelectItem value="work_completed">Work Completed</SelectItem>
                <SelectItem value="standby">Standby</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="project_manager_notes" className="text-gray-700">Project Manager Notes</Label>
          <Textarea
            id="project_manager_notes"
            value={formData.project_manager_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, project_manager_notes: e.target.value }))}
            rows={3}
            placeholder="Notes about this contractor assignment..."
            className="text-gray-900 placeholder-gray-400 bg-white"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAssignContractorOpen(false)}
            disabled={isSubmitting}
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !selectedContractorId || !formData.scope_of_work.trim() || !formData.start_date}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Assign Contractor
              </>
            )}
          </Button>
        </div>
      </form>
    );
  };

  if (loading && !selectedProject) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contractors Management</h1>
          <p className="text-gray-600">Manage contractors and project assignments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddContractorOpen} onOpenChange={setIsAddContractorOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New Contractor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Add New Contractor</DialogTitle>
                <DialogDescription>
                  Add a new contractor to the system. They can then be assigned to projects and manage work.
                </DialogDescription>
              </DialogHeader>
              <AddContractorForm />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Project Assignments
          </button>
          <button
            onClick={() => setActiveTab('all_contractors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all_contractors'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Contractors
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'projects' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Contractors</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalContractors}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Contractors</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeContractors}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verified Contractors</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.verifiedContractors}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Project Search</CardTitle>
              <CardDescription>
                Search and select a project to view and manage its contractors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects by name, owner, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* All Contractors Tab */}
      {activeTab === 'all_contractors' && (
        <>
          {/* Search and Filter Bar */}
          <Card>
            <CardHeader>
              <CardTitle>All Contractors</CardTitle>
              <CardDescription>
                View and manage all contractors in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contractors by name, company, email, or phone..."
                    value={contractorSearchTerm}
                    onChange={(e) => setContractorSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedTradeFilter} onValueChange={setSelectedTradeFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filter by trade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    {TRADE_SPECIALIZATIONS.map((trade) => (
                      <SelectItem key={trade} value={trade}>
                        {trade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contractors Grid */}
          {loadingAllContractors ? (
            <div className="flex items-center justify-center p-12">
              <Clock className="h-8 w-8 animate-spin mr-3 text-orange-500" />
              <span className="text-lg text-gray-600">Loading contractors...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContractors.map((contractor) => (
                <Card key={contractor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {contractor.contractor_name}
                          </h3>
                          <p className="text-sm text-gray-600">{contractor.company_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedContractor({ contractor });
                              setIsContractorDetailsOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{contractor.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{contractor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Trade:</span>
                          <span className="text-sm text-gray-600 capitalize">
                            {contractor.trade_specialization?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(contractor.status)}>
                            {getStatusIcon(contractor.status)}
                            <span className="ml-1 capitalize">{contractor.status?.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        {contractor.overall_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{contractor.overall_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Added by:</span>
                        <Badge variant={getAddedByBadgeVariant(getContractorAddedBy(contractor).type)} className="text-xs">
                          {getContractorAddedBy(contractor).label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loadingAllContractors && filteredContractors.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contractors Found</h3>
                <p className="text-gray-600 mb-6">
                  {contractorSearchTerm || selectedTradeFilter !== 'all' 
                    ? 'No contractors match your search criteria. Try adjusting your filters.'
                    : 'No contractors have been added yet.'
                  }
                </p>
                {!contractorSearchTerm && selectedTradeFilter === 'all' && (
                  <Button 
                    onClick={() => setIsAddContractorOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Contractor
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Projects List */}
      {!selectedProject && (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.project_name}</h3>
                    <p className="text-sm text-gray-600">{project.project_address}</p>
                    {project.client && (
                      <p className="text-sm text-gray-500">Client: {project.client.full_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-orange-500">
                    <Badge className="text-orange-500" variant={getStatusBadgeVariant(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProjectSelect(project)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Contractors
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Project Contractors */}
      {selectedProject && (
        <div className="space-y-6">
          {/* Project Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedProject.project_name}</h2>
                  <p className="text-gray-600">{selectedProject.project_address}</p>
                  {selectedProject.client && (
                    <p className="text-sm text-gray-500">Client: {selectedProject.client.full_name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProject(null)}
                  >
                    Back to Projects
                  </Button>
                  <Button
                    onClick={() => setIsAssignContractorOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Contractor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Contractors</p>
                    <p className="text-2xl font-bold text-gray-900">{projectStats.totalContractors}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">On Site</p>
                    <p className="text-2xl font-bold text-green-600">{projectStats.onSiteContractors}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contract Value</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(projectStats.totalContractValue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-purple-600">{projectStats.averageProgress}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contractors List */}
          <div className="grid grid-cols-1 gap-4">
            {projectContractors.map((projectContractor: any) => (
              <Card key={projectContractor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {projectContractor.contractor?.contractor_name}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(projectContractor.contract_status)}>
                          {getStatusIcon(projectContractor.contract_status)}
                          <span className="ml-1">{projectContractor.contract_status.replace('_', ' ')}</span>
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(projectContractor.on_site_status)}>
                          {getStatusIcon(projectContractor.on_site_status)}
                          <span className="ml-1">{projectContractor.on_site_status.replace('_', ' ')}</span>
                        </Badge>
                        {/* Added By Badge */}
                        {(() => {
                          const addedBy = getContractorAddedBy(projectContractor.contractor);
                          return (
                            <Badge variant={getAddedByBadgeVariant(addedBy.type)} className="text-xs text-black">
                              {addedBy.label}
                            </Badge>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Company</p>
                          <p className="font-medium">{projectContractor.contractor?.company_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Trade</p>
                          <p className="font-medium">{projectContractor.contractor?.trade_specialization?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Contract Value</p>
                          <p className="font-medium">{formatCurrency(projectContractor.contract_value)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Progress</p>
                          <p className="font-medium">{projectContractor.work_completion_percentage}%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {projectContractor.contractor?.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {projectContractor.contractor?.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Started: {formatDate(projectContractor.start_date)}
                        </div>
                        {projectContractor.contractor?.overall_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {projectContractor.contractor.overall_rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContractor(projectContractor);
                          setIsContractorDetailsOpen(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setContractorToEdit(projectContractor);
                          setIsEditContractorOpen(true);
                        }}
                        title="Edit Contractor"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {projectContractors.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contractors Assigned</h3>
                <p className="text-gray-600 mb-6">This project doesn't have any contractors assigned yet. You can assign existing contractors or add new ones.</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setIsAssignContractorOpen(true)} variant="outline">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign Existing Contractor
                  </Button>
                  <Button 
                    onClick={() => setIsAddContractorOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Contractor
                  </Button>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Need help? <span className="text-orange-500 cursor-pointer hover:underline">Learn about contractor management</span></p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Assign Contractor Modal */}
      <Dialog open={isAssignContractorOpen} onOpenChange={setIsAssignContractorOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Assign Contractor to Project</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedProject ? `Assign a contractor to ${selectedProject.project_name}` : 'Select a contractor to assign to this project'}
            </DialogDescription>
          </DialogHeader>
          <AssignContractorForm 
            projectId={selectedProject?.id}
            onSuccess={() => {
              setIsAssignContractorOpen(false);
              if (selectedProject) {
                fetchProjectContractors(selectedProject.id);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Contractor Modal */}
      {contractorToEdit && (
        <Dialog open={isEditContractorOpen} onOpenChange={setIsEditContractorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Contractor</DialogTitle>
              <DialogDescription>
                Update both project assignment details and contractor profile for {contractorToEdit.contractor?.contractor_name}
              </DialogDescription>
            </DialogHeader>
            <EditContractorForm 
              contractor={contractorToEdit} 
              onSuccess={() => {
                setIsEditContractorOpen(false);
                setContractorToEdit(null);
                if (selectedProject) {
                  fetchProjectContractors(selectedProject.id);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Contractor Details Modal */}
      {selectedContractor && (
        <Dialog open={isContractorDetailsOpen} onOpenChange={setIsContractorDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-orange-50 border-orange-200">
            <DialogHeader className="bg-orange-100 -m-6 mb-4 p-6 rounded-t-lg">
              <DialogTitle className="text-gray-900">Contractor Details</DialogTitle>
              <DialogDescription className="text-gray-700">
                Complete profile and assignment information for {selectedContractor.contractor?.contractor_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
              {/* Profile Information Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Profile Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Contractor Name</Label>
                    <p className="text-gray-900 font-medium">{selectedContractor.contractor?.contractor_name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Company Name</Label>
                    <p className="text-gray-900 font-medium">{selectedContractor.contractor?.company_name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Email</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Phone</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Trade Specialization</Label>
                    <p className="text-gray-900 capitalize">{selectedContractor.contractor?.trade_specialization?.replace('_', ' ')}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Overall Rating</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < Math.floor(selectedContractor.contractor?.overall_rating || 0) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-gray-900 font-medium">
                        {selectedContractor.contractor?.overall_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Status</Label>
                    <Badge variant={getStatusBadgeVariant(selectedContractor.contractor?.status)} className="text-white">
                      {getStatusIcon(selectedContractor.contractor?.status)}
                      <span className="ml-1 capitalize">{selectedContractor.contractor?.status?.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Added By</Label>
                    <Badge variant={getAddedByBadgeVariant(getContractorAddedBy(selectedContractor.contractor).type)} className="text-black">
                      {getContractorAddedBy(selectedContractor.contractor).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Business Information Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Business Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Physical Address</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.physical_address || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Postal Address</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.postal_address || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">License Number</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.license_number || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">License Type</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.license_type || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Tax Number</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.tax_number || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Website URL</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.website_url || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Insurance Provider</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.insurance_provider || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Insurance Policy Number</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.insurance_policy_number || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Years in Business</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.years_in_business || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Number of Employees</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.number_of_employees || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Financial Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Hourly Rate</Label>
                    <p className="text-gray-900 font-semibold">{selectedContractor.contractor?.hourly_rate ? formatCurrency(selectedContractor.contractor.hourly_rate) : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Daily Rate</Label>
                    <p className="text-gray-900 font-semibold">{selectedContractor.contractor?.daily_rate ? formatCurrency(selectedContractor.contractor.daily_rate) : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Minimum Project Value</Label>
                    <p className="text-gray-900 font-semibold">{selectedContractor.contractor?.minimum_project_value ? formatCurrency(selectedContractor.contractor.minimum_project_value) : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Payment Terms</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.payment_terms || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Travel Radius</Label>
                    <p className="text-gray-900">{selectedContractor.contractor?.travel_radius_km ? `${selectedContractor.contractor.travel_radius_km} km` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Project Assignment Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Current Project Assignment</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Contract Status</Label>
                    <Badge variant={getStatusBadgeVariant(selectedContractor.contract_status)} className="text-white">
                      {getStatusIcon(selectedContractor.contract_status)}
                      <span className="ml-1 capitalize">{selectedContractor.contract_status?.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">On-Site Status</Label>
                    <Badge variant={getStatusBadgeVariant(selectedContractor.on_site_status)} className="text-white">
                      {getStatusIcon(selectedContractor.on_site_status)}
                      <span className="ml-1 capitalize">{selectedContractor.on_site_status?.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Contract Value</Label>
                    <p className="text-gray-900 font-semibold">{formatCurrency(selectedContractor.contract_value || 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Work Completion</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${selectedContractor.work_completion_percentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium">{selectedContractor.work_completion_percentage || 0}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Start Date</Label>
                    <p className="text-gray-900">{selectedContractor.start_date ? formatDate(selectedContractor.start_date) : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Planned End Date</Label>
                    <p className="text-gray-900">{selectedContractor.planned_end_date ? formatDate(selectedContractor.planned_end_date) : 'N/A'}</p>
                  </div>
                </div>
                
                {selectedContractor.project_manager_notes && (
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Project Manager Notes</Label>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-900">{selectedContractor.project_manager_notes}</p>
                    </div>
                  </div>
                )}

                {selectedContractor.contractor?.notes && (
                  <div className="space-y-1">
                    <Label className="text-gray-600 font-medium">Additional Notes</Label>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-900">{selectedContractor.contractor.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-orange-200">
              <Button
                variant="outline"
                onClick={() => {
                  setContractorToEdit(selectedContractor);
                  setIsContractorDetailsOpen(false);
                  setIsEditContractorOpen(true);
                }}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Contractor
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsContractorDetailsOpen(false)}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // Merged Edit Contractor Form Component (Assignment + Profile)
  function EditContractorForm({ contractor, onSuccess }: { contractor: any; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
      // Assignment fields
      contract_status: contractor.contract_status || '',
      on_site_status: contractor.on_site_status || '',
      contract_value: contractor.contract_value?.toString() || '',
      work_completion_percentage: contractor.work_completion_percentage?.toString() || '',
      start_date: contractor.start_date || '',
      planned_end_date: contractor.planned_end_date || '',
      project_manager_notes: contractor.project_manager_notes || '',
      
      // Profile fields
      overall_rating: contractor.contractor?.overall_rating?.toString() || '0',
      contractor_source: contractor.contractor?.contractor_source || 'user_added',
      status: contractor.contractor?.status || 'active',
      contractor_name: contractor.contractor?.contractor_name || '',
      company_name: contractor.contractor?.company_name || '',
      email: contractor.contractor?.email || '',
      phone: contractor.contractor?.phone || '',
      trade_specialization: contractor.contractor?.trade_specialization || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        // Update project assignment
        await updateProjectAssignment(contractor.id, {
          contract_status: formData.contract_status,
          on_site_status: formData.on_site_status,
          contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
          work_completion_percentage: formData.work_completion_percentage ? parseInt(formData.work_completion_percentage) : null,
          start_date: formData.start_date || null,
          planned_end_date: formData.planned_end_date || null,
          project_manager_notes: formData.project_manager_notes || null,
        });

        // Update contractor profile
        await updateContractor(contractor.contractor.id, {
          overall_rating: formData.overall_rating ? parseFloat(formData.overall_rating) : 0,
          contractor_source: formData.contractor_source,
          status: formData.status,
          contractor_name: formData.contractor_name,
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
          trade_specialization: formData.trade_specialization,
        });
        
        console.log('✅ Contractor updated successfully');
        onSuccess();
      } catch (error) {
        console.error('❌ Error updating contractor:', error);
        alert('Failed to update contractor. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contractor Profile Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-orange-500 border-b pb-2">Contractor Profile</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contractor_name">Contractor Name</Label>
              <Input
                id="contractor_name"
                value={formData.contractor_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contractor_name: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="trade_specialization">Trade Specialization</Label>
            <Select 
              value={formData.trade_specialization} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, trade_specialization: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trade specialization" />
              </SelectTrigger>
              <SelectContent>
                {TRADE_SPECIALIZATIONS.map((trade) => (
                  <SelectItem key={trade} value={trade}>
                    {trade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="overall_rating">Overall Rating (0-5)</Label>
              <Input
                id="overall_rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.overall_rating}
                onChange={(e) => setFormData(prev => ({ ...prev, overall_rating: e.target.value }))}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Rating out of 5 stars</p>
            </div>
            
            <div>
              <Label htmlFor="contractor_source">Verification Source</Label>
              <Select 
                value={formData.contractor_source} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, contractor_source: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_added">User Added</SelectItem>
                  <SelectItem value="korabuild_verified">KoraBuild Verified</SelectItem>
                  <SelectItem value="platform_recommended">Platform Recommended</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="contractor_status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Project Assignment Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-orange-500 border-b pb-2">Project Assignment</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_status">Contract Status</Label>
              <Select value={formData.contract_status} onValueChange={(value) => setFormData(prev => ({ ...prev, contract_status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="on_site_status">On-Site Status</Label>
              <Select value={formData.on_site_status} onValueChange={(value) => setFormData(prev => ({ ...prev, on_site_status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select on-site status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="on_site">On Site</SelectItem>
                  <SelectItem value="temporarily_off_site">Temporarily Off Site</SelectItem>
                  <SelectItem value="work_completed">Work Completed</SelectItem>
                  <SelectItem value="standby">Standby</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_value" className="text-gray-700">Contract Value (USD)</Label>
              <Input
                id="contract_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.contract_value}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_value: e.target.value }))}
                placeholder="0.00"
                disabled={isSubmitting}
                className="text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="work_completion_percentage" className="text-gray-700">Work Completion (%)</Label>
              <Input
                id="work_completion_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.work_completion_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, work_completion_percentage: e.target.value }))}
                disabled={isSubmitting}
                className="text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="planned_end_date">Planned End Date</Label>
              <Input
                id="planned_end_date"
                type="date"
                value={formData.planned_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_end_date: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="project_manager_notes">Project Manager Notes</Label>
            <Textarea
              id="project_manager_notes"
              value={formData.project_manager_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, project_manager_notes: e.target.value }))}
              rows={3}
              placeholder="Additional notes about this contractor assignment..."
              className="text-gray-900 placeholder-gray-400 bg-white"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditContractorOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Update Contractor
              </>
            )}
          </Button>
        </div>
      </form>
    );
  }
} 