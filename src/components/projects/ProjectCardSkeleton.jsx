export default function ProjectCardSkeleton() {
  return (
    <div className="project-card-wrapper skeleton-wrapper">
      <div className="project-card">
        {/* Thumbnail Skeleton */}
        <div className="project-card__thumb project-card__thumb--loading" />

        {/* Footer Skeleton */}
        <div className="project-card__footer">
          <div className="project-card__author">
            <div className="skeleton-avatar" />
            <div className="skeleton-text skeleton-text--short" />
          </div>
          <div className="project-card__actions">
            <div className="skeleton-icon" />
            <div className="skeleton-icon" />
            <div className="skeleton-icon" />
          </div>
        </div>
      </div>
    </div>
  );
}
