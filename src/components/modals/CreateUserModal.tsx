'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  User, 
  X, 
  Save, 
  Info,
  AlertTriangle,
  CheckCircle,
  Key,
  MapPin
} from 'lucide-react';
import { Database } from '@/types/database';

type UserRole = Database['public']['Tables']['users']['Row']['role'];

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: any) => void;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  role: 'client' | 'admin' | 'contractor' | 'inspector';
  generatePassword: boolean;
  customPassword: string;
}

interface UserCreationResult {
  success: boolean;
  message: string;
  user: any;
  instructions: {
    next_steps: string[];
    admin_note: string;
  };
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    role: 'client',
    generatePassword: true,
    customPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<UserCreationResult | null>(null);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.generatePassword && !formData.customPassword.trim()) {
      setError('Please provide a custom password or enable auto-generation');
      return false;
    }
    
    if (!formData.generatePassword && formData.customPassword.length < 6) {
      setError('Custom password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('👤 Creating new user:', formData);

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || null,
          role: formData.role,
          temporary_password: formData.generatePassword ? null : formData.customPassword
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      console.log('✅ User created successfully:', result);
      setSuccess(result);
      
      // Call the success callback after a short delay to show the success message
      setTimeout(() => {
        onUserCreated(result.user);
        handleClose();
      }, 3000);
      
    } catch (err) {
      console.error('❌ Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'client',
        generatePassword: true,
        customPassword: ''
      });
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-500" />
            Create New User
          </DialogTitle>
        </DialogHeader>

        {success ? (
          // Success State
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Created Successfully!</h3>
              <p className="text-sm text-gray-600 mb-4">{success.message}</p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Next Steps for the User:</div>
                  <ul className="text-sm space-y-1 ml-4">
                    {success.instructions.next_steps.map((step, index) => (
                      <li key={index} className="list-disc">{step}</li>
                    ))}
                  </ul>
                  <div className="text-xs text-gray-500 mt-3 p-2 bg-gray-50 rounded">
                    <strong>Admin Note:</strong> {success.instructions.admin_note}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button onClick={handleClose} className="bg-orange-500 hover:bg-orange-600">
                Close
              </Button>
            </div>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Information Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Admin User Creation:</strong> You can create users without requiring them to provide an OTP. 
                The user will receive an email verification link and can complete setup at their convenience.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter user's full name"
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number (optional)"
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  User Role *
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange('role', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800">Client</Badge>
                        <span className="text-sm text-gray-500">- Project owner</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="contractor">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">Contractor</Badge>
                        <span className="text-sm text-gray-500">- Construction professional</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inspector">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Inspector</Badge>
                        <span className="text-sm text-gray-500">- Quality assurance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
                        <span className="text-sm text-gray-500">- System administrator</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Options */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Password Setup
                </Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="generate_password"
                      name="password_option"
                      checked={formData.generatePassword}
                      onChange={() => handleInputChange('generatePassword', true)}
                      disabled={loading}
                      className="text-orange-500"
                    />
                    <Label htmlFor="generate_password" className="text-sm font-normal">
                      Generate temporary password automatically (Recommended)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="custom_password"
                      name="password_option"
                      checked={!formData.generatePassword}
                      onChange={() => handleInputChange('generatePassword', false)}
                      disabled={loading}
                      className="text-orange-500"
                    />
                    <Label htmlFor="custom_password" className="text-sm font-normal">
                      Set custom temporary password
                    </Label>
                  </div>
                </div>

                {!formData.generatePassword && (
                  <Input
                    type="password"
                    value={formData.customPassword}
                    onChange={(e) => handleInputChange('customPassword', e.target.value)}
                    placeholder="Enter temporary password (min. 6 characters)"
                    className="mt-2"
                    disabled={loading}
                  />
                )}
                
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  <strong>Note:</strong> The user will be required to change this password on first login and verify their email address.
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        )}

        {!success && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
} 