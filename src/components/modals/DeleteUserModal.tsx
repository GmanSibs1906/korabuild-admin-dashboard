'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, User, Building2, CreditCard, MessageSquare, FileText, Shield } from 'lucide-react';
import { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];

interface DeleteUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmationText: string) => Promise<void>;
  loading: boolean;
}

export function DeleteUserModal({ user, isOpen, onClose, onConfirm, loading }: DeleteUserModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (confirmationText !== 'DELETE') {
      setError('You must type "DELETE" exactly to confirm deletion');
      return;
    }

    setError(null);
    try {
      await onConfirm(confirmationText);
      setConfirmationText('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmationText('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  const isConfirmationValid = confirmationText === 'DELETE';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Delete User Account</h3>
        </div>
        
        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <User className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <div className="font-medium text-gray-900">{user.full_name || 'No name'}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Role:</span> {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
          </div>
        </div>
        
        {/* Warning */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">This action cannot be undone!</h4>
              <p className="text-red-700 text-sm mt-1">
                You are about to permanently delete this user and ALL their associated data.
              </p>
            </div>
          </div>
        </div>
        
        {/* What will be deleted */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">This will permanently delete:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <User className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
              User account and profile information
            </li>
            <li className="flex items-center">
              <Building2 className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
              All user's projects and project data
            </li>
            <li className="flex items-center">
              <CreditCard className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
              Financial records and payment history
            </li>
            <li className="flex items-center">
              <MessageSquare className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
              Communication history and messages
            </li>
            <li className="flex items-center">
              <FileText className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
              Documents and uploaded files
            </li>
            <li className="flex items-center">
              <Shield className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
              Quality reports and safety records
            </li>
            <li className="text-red-600 font-medium">
              • All project milestones and progress data
            </li>
            <li className="text-red-600 font-medium">
              • All contractor assignments and work sessions
            </li>
            <li className="text-red-600 font-medium">
              • All material orders and deliveries
            </li>
            <li className="text-red-600 font-medium">
              • All photos and progress updates
            </li>
          </ul>
        </div>
        
        {/* Confirmation Input */}
        <div className="mb-6">
          <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
            To confirm deletion, type <span className="font-bold text-red-600">DELETE</span> in the box below:
          </label>
          <input
            id="confirmation"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={loading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !isConfirmationValid}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
              isConfirmationValid 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User & All Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 