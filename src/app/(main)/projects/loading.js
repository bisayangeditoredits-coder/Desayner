import ProjectCardSkeleton from '@/components/ProjectCardSkeleton';

export default function ProjectsLoading() {
  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {/* Title placeholder */}
      <div style={{ width: 200, height: 28, borderRadius: 8, background: '#e2e8f0', marginBottom: '1.5rem', animation: 'lightweight-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="projects-masonry">
        {[...Array(12)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
