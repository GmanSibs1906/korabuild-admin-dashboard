import { ProjectDetailsView } from '@/components/dashboard/project-details-view';

interface ProjectDetailsPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  return (
    <div className="space-y-6">
      <ProjectDetailsView projectId={params.projectId} />
    </div>
  );
} 