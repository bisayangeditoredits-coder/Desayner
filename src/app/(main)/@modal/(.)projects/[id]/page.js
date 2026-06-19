import ProjectModalWrapper from '@/components/projects/ProjectModalWrapper';
import ProjectDetailClient from '@/app/(main)/projects/[id]/ProjectDetailClient';

export default async function InterceptedProjectPage({ params }) {
  // We can just render the ProjectDetailClient inside our Modal Wrapper!
  // Note: params are available directly here in Next 14/15 server components.
  return (
    <ProjectModalWrapper>
      <ProjectDetailClient isModal={true} />
    </ProjectModalWrapper>
  );
}
