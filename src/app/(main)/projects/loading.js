export default function ProjectsLoading() {
  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div style={{ width: 200, height: 28, borderRadius: 8, background: '#e8e8e8', marginBottom: '1.5rem' }} className="shimmer-box" />
      <div className="projects-masonry">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="masonry-item shimmer-box"
            style={{ aspectRatio: '4/3', borderRadius: '8px' }}
          />
        ))}
      </div>
    </div>
  );
}
