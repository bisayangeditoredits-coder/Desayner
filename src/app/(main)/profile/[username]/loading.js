import ProjectCardSkeleton from '@/components/ProjectCardSkeleton';

const pulse = { animation: 'lightweight-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', background: '#e2e8f0' };

export default function ProfileLoading() {
  return (
    <div style={{ padding: '0 0 2rem' }}>
      {/* Cover placeholder */}
      <div style={{ height: 200, borderRadius: '0 0 12px 12px', ...pulse }} />

      <div style={{ padding: '1.5rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        {/* Avatar + name placeholder */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '-3rem', marginBottom: '2rem' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: '4px solid white', flexShrink: 0, ...pulse }} />
          <div style={{ flex: 1, paddingTop: '3rem' }}>
            <div style={{ width: 180, height: 22, borderRadius: 6, marginBottom: '0.5rem', ...pulse }} />
            <div style={{ width: 120, height: 14, borderRadius: 6, ...pulse }} />
          </div>
        </div>

        {/* Project grid placeholder */}
        <div className="projects-masonry">
          {[...Array(8)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
