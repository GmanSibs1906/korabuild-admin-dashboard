import { ProjectsTable } from '@/components/tables/ProjectsTable';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Project Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          Comprehensive oversight and control of all construction projects across the platform.
        </p>
      </div>

      {/* Projects Table */}
      <ProjectsTable />
    </div>
  );
} 