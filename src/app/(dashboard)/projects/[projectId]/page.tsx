import { ProjectDetailsView } from '@/components/dashboard/project-details-view';

interface ProjectDetailsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { projectId } = await params;
  
  return (
    <div className="space-y-6">
      <ProjectDetailsView projectId={projectId} />
    </div>
  );
} 