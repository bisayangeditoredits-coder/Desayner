'use client';

import ProjectCardSkeleton from '@/components/projects/ProjectCardSkeleton';

export default function MasonryGrid({ 
  items, 
  isLoading = false, 
  skeletonCount = 12, 
  renderItem,
}) {
  if (isLoading) {
    return (
      <div className="projects-grid">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div className="projects-grid__item" key={`skeleton-${index}`}>
            <ProjectCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="projects-grid">
      {(items || []).map((item, index) => renderItem(item, () => {}, index))}
    </div>
  );
}
