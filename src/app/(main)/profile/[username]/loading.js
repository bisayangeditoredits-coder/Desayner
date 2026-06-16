export default function ProfileLoading() {
  return (
    <div style={{ padding: '0 0 2rem' }}>
      <div style={{ height: 200, background: '#e8e8e8' }} className="shimmer-box" />
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '-3rem', marginBottom: '2rem' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#e0e0e0', border: '4px solid white' }} className="shimmer-box" />
          <div style={{ flex: 1 }}>
            <div style={{ width: 180, height: 24, borderRadius: 6, background: '#e0e0e0', marginBottom: '0.5rem' }} className="shimmer-box" />
            <div style={{ width: 120, height: 14, borderRadius: 6, background: '#e8e8e8' }} className="shimmer-box" />
          </div>
        </div>
        <div className="projects-masonry">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="masonry-item shimmer-box"
              style={{ aspectRatio: '4/3', borderRadius: '8px' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
