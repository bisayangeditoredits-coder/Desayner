export default function MainLoading() {
  return (
    <div style={{ padding: '1.5rem 2rem' }}>
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
