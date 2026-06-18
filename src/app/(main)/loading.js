import ProjectCardSkeleton from '@/components/ProjectCardSkeleton';

export default function MainLoading() {
  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div className="projects-masonry">
        {[...Array(12)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
