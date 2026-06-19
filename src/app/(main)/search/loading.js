import ProjectCardSkeleton from '@/components/projects/ProjectCardSkeleton';

export default function SearchLoading() {
  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div style={{ width: 280, height: 20, borderRadius: 6, background: '#e2e8f0', marginBottom: '1.5rem', animation: 'lightweight-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="projects-masonry">
        {[...Array(12)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
