'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Payment,
  PaymentCreateData,
  PaymentUpdateData,
  PAYMENT_CATEGORIES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} from '@/types/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  CreditCard,
  Building,
  Target,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation schema
const paymentFormSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  milestone_id: z.string().optional(),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.string().min(1, 'Payment method is required'),
  reference: z.string().min(1, 'Reference is required'),
  description: z.string().min(1, 'Description is required'),
  receipt_url: z.string().optional(),
  payment_category: z.enum(['milestone', 'materials', 'labor', 'permits', 'other']),
  status: z.enum(['pending', 'completed', 'failed', 'refunded'])
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  mode: 'create' | 'edit';
  payment?: Payment;
  defaultProjectId?: string;
  defaultMilestoneId?: string;
  onSubmit: (data: PaymentCreateData | PaymentUpdateData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

interface Project {
  id: string;
  project_name: string;
  client_id: string;
  users?: {
    full_name: string;
  };
}

interface Milestone {
  id: string;
  milestone_name: string;
  phase_category: string;
  project_id: string;
}

export function PaymentForm({
  mode,
  payment,
  defaultProjectId,
  defaultMilestoneId,
  onSubmit,
  onCancel,
  loading = false,
  className
}: PaymentFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      project_id: payment?.project_id || defaultProjectId || '',
      milestone_id: payment?.milestone_id || defaultMilestoneId || '',
      amount: payment?.amount?.toString() || '',
      payment_date: payment?.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: payment?.payment_method || 'EFT',
      reference: payment?.reference || '',
      description: payment?.description || '',
      receipt_url: payment?.receipt_url || '',
      payment_category: payment?.payment_category || 'other',
      status: payment?.status || 'pending'
    }
  });

  const selectedProjectId = form.watch('project_id');

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await fetch('/api/projects?select=id,project_name,client_id,users(full_name)');
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch milestones for selected project
  const fetchMilestones = async (projectId: string) => {
    try {
      setLoadingMilestones(true);
      const response = await fetch(`/api/projects/${projectId}/milestones`);
      const result = await response.json();
      
      if (result.success) {
        setMilestones(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoadingMilestones(false);
    }
  };

  // Handle receipt upload
  const handleReceiptUpload = async (file: File) => {
    try {
      setUploadingReceipt(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'receipt');
      formData.append('project_id', selectedProjectId);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        form.setValue('receipt_url', result.data.url);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error uploading receipt:', error);
      // You might want to show a toast notification here
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values: PaymentFormValues) => {
    try {
      const submitData: PaymentCreateData | PaymentUpdateData = {
        project_id: values.project_id,
        milestone_id: values.milestone_id || undefined,
        amount: parseFloat(values.amount),
        payment_date: values.payment_date,
        payment_method: values.payment_method,
        reference: values.reference,
        description: values.description,
        receipt_url: values.receipt_url || undefined,
        payment_category: values.payment_category,
        status: values.status
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting payment form:', error);
    }
  };

  // Generate reference number
  const generateReference = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reference = `PAY-${date}-${random}`;
    form.setValue('reference', reference);
  };

  // Load initial data
  useEffect(() => {
    fetchProjects();
  }, []);

  // Load milestones when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchMilestones(selectedProjectId);
    } else {
      setMilestones([]);
    }
  }, [selectedProjectId]);

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-orange-500" />
          <span>{mode === 'create' ? 'Create New Payment' : 'Edit Payment'}</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Project Selection */}
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Project</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingProjects ? (
                        <SelectItem value="">
                          <div className="flex items-center space-x-2">
                            <LoadingSpinner size="sm" />
                            <span>Loading projects...</span>
                          </div>
                        </SelectItem>
                      ) : (
                        projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div>
                              <div className="font-medium">{project.project_name}</div>
                              {project.users?.full_name && (
                                <div className="text-xs text-gray-500">{project.users.full_name}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Milestone Selection (Optional) */}
            <FormField
              control={form.control}
              name="milestone_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Milestone (Optional)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a milestone (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No milestone</SelectItem>
                      {loadingMilestones ? (
                        <SelectItem value="">
                          <div className="flex items-center space-x-2">
                            <LoadingSpinner size="sm" />
                            <span>Loading milestones...</span>
                          </div>
                        </SelectItem>
                      ) : (
                        milestones.map((milestone) => (
                          <SelectItem key={milestone.id} value={milestone.id}>
                            <div>
                              <div className="font-medium">{milestone.milestone_name}</div>
                              <div className="text-xs text-gray-500 capitalize">
                                {milestone.phase_category.replace('_', ' ')}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount and Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Amount</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Payment Date</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Method and Category Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment Method</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reference */}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Reference Number</span>
                  </FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input placeholder="Enter reference number" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateReference}
                      disabled={loading}
                    >
                      Generate
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter payment description..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt Upload */}
            {/* <FormField
              control={form.control}
              name="receipt_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Receipt (Optional)</span>
                  </FormLabel>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleReceiptUpload(file);
                        }
                      }}
                      disabled={uploadingReceipt}
                    />
                    {uploadingReceipt && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <LoadingSpinner size="sm" />
                        <span>Uploading receipt...</span>
                      </div>
                    )}
                    {field.value && (
                      <div className="text-sm text-green-600">
                        ✅ Receipt uploaded successfully
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingReceipt}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>{mode === 'create' ? 'Creating...' : 'Updating...'}</span>
                  </div>
                ) : (
                  <span>{mode === 'create' ? 'Create Payment' : 'Update Payment'}</span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 