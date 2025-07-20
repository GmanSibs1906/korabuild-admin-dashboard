'use client';

import React from 'react';
import { CheckCircle, User, Building2, AlertTriangle, X } from 'lucide-react';

interface UserDeletionResult {
  deletedUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  deletedProjects: number;
  message: string;
}

interface UserDeletionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: UserDeletionResult | null;
}

export function UserDeletionSummaryModal({ isOpen, onClose, result }: UserDeletionSummaryModalProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">User Deleted Successfully</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Success Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <User className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="font-medium text-green-900">{result.deletedUser.name}</div>
              <div className="text-sm text-green-700">{result.deletedUser.email}</div>
            </div>
          </div>
          <div className="text-sm text-green-700">
            <span className="font-medium">Role:</span> {result.deletedUser.role?.charAt(0).toUpperCase() + result.deletedUser.role?.slice(1)}
          </div>
        </div>
        
        {/* Deletion Details */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">What was deleted:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              User account and authentication credentials
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Profile information and settings
            </li>
            {result.deletedProjects > 0 ? (
              <li className="flex items-center">
                <Building2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                {result.deletedProjects} project{result.deletedProjects > 1 ? 's' : ''} and all project data
              </li>
            ) : (
              <li className="flex items-center">
                <Building2 className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                No projects to delete
              </li>
            )}
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              All communication history and messages
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Financial records and payment history
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Documents and uploaded files
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Quality reports and safety records
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              All contractor assignments and work logs
            </li>
          </ul>
        </div>
        
        {/* Important Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-800 font-medium">Important</h4>
              <p className="text-yellow-700 text-sm mt-1">
                This action was permanent and cannot be undone. All data associated with this user has been completely removed from the system.
              </p>
            </div>
          </div>
        </div>
        
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 