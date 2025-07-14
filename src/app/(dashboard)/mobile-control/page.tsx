'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressControlPanel } from '@/components/mobile-control/ProgressControlPanel';
import { FinancialControlPanel } from '@/components/mobile-control/FinancialControlPanel';
import { CommunicationControlPanel } from '@/components/mobile-control/CommunicationControlPanel';
import { MaterialOrdersControlPanel } from '@/components/mobile-control/MaterialOrdersControlPanel';

// Project selection component
interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
}

function ProjectSelector({ selectedProjectId, onProjectSelect }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const result = await response.json();
        
        if (result.projects) {
          setProjects(result.projects);
        } else {
          setError('Failed to load projects');
        }
      } catch (err) {
        setError('Network error loading projects');
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading projects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
            selectedProjectId === project.id
              ? 'ring-2 ring-orange-500 border-orange-500'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onProjectSelect(project.id)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{project.project_name}</h3>
            <Badge
              className={`${
                project.status === 'in_progress'
                  ? 'bg-orange-500'
                  : project.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-gray-400'
              } text-white`}
            >
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-2">{project.project_address}</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{project.current_phase}</span>
            <span>{project.progress_percentage}% Complete</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function MobileControlPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'financial' | 'communication' | 'team' | 'materials'>('progress');
  const [syncData, setSyncData] = useState<any>(null);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleDataSync = (data: any) => {
    setSyncData(data);
  };

  const tabs = [
    { id: 'progress', label: 'Progress Control', description: 'Control building progress and timeline data' },
    { id: 'financial', label: 'Financial Control', description: 'Control financial data and payment information' },
    { id: 'communication', label: 'Communication Control', description: 'Manage messages and notifications' },
    { id: 'team', label: 'Team Control', description: 'Control contractor and team information' },
    { id: 'materials', label: 'Materials Control', description: 'Control material orders and deliveries' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mobile App Data Control</h1>
          <p className="mt-2 text-lg text-gray-600">
            Control all data that users see in their mobile app. Changes made here will instantly reflect in the mobile app.
          </p>
        </div>

        {/* Critical Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Critical System Control</h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  This system provides direct control over mobile app user experience. All changes made here will immediately
                  reflect in the mobile app within 2 seconds. Exercise caution when making changes as they directly affect
                  user experience.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        {!selectedProjectId ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Project</h2>
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onProjectSelect={handleProjectSelect}
            />
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Project Selected</h2>
              <Button
                onClick={() => setSelectedProjectId(null)}
                variant="outline"
                size="sm"
              >
                Change Project
              </Button>
            </div>
          </div>
        )}

        {/* Control Tabs */}
        {selectedProjectId && (
          <>
            <div className="mb-8">
              <nav className="flex space-x-8 border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'progress' && (
                <ProgressControlPanel
                  projectId={selectedProjectId}
                  onDataSync={handleDataSync}
                />
              )}
              
              {activeTab === 'financial' && (
                <FinancialControlPanel
                  projectId={selectedProjectId}
                  onDataSync={handleDataSync}
                />
              )}

              {activeTab === 'communication' && (
                <CommunicationControlPanel
                  projectId={selectedProjectId}
                  onDataSync={handleDataSync}
                />
              )}

              {activeTab === 'team' && (
                <Card className="p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Team Control Panel</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Coming soon - Control contractor assignments, team information, and performance data
                    </p>
                  </div>
                </Card>
              )}

              {activeTab === 'materials' && (
                <MaterialOrdersControlPanel
                  projectId={selectedProjectId}
                  onClose={() => setActiveTab('progress')}
                />
              )}
            </div>
          </>
        )}

        {/* Real-time Sync Status */}
        {selectedProjectId && syncData && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">Real-time Sync Active</h3>
                <p className="text-sm text-green-700">
                  Mobile app data is synchronized and up-to-date. Changes will reflect instantly in user devices.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700">Live</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 