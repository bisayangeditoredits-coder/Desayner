import ProjectModalWrapper from '@/components/projects/ProjectModalWrapper';
import ProjectDetailClient from '@/app/(main)/projects/[id]/ProjectDetailClient';

export default async function InterceptedProjectPage({ params }) {
  const { id } = await params;
  return (
    <ProjectModalWrapper>
      <ProjectDetailClient isModal={true} projectId={id} />
    </ProjectModalWrapper>
  );
}
