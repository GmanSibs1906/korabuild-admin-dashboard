import { UserProfileDashboard } from '@/components/dashboard/UserProfileDashboard';

interface UserProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;
  console.log('🔍 UserProfilePage - Rendering with userId:', userId);
  console.log('🔍 UserProfilePage - About to render UserProfileDashboard');
  return <UserProfileDashboard userId={userId} />;
} 