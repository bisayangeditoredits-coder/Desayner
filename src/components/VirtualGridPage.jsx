'use client';
import { useState, useRef, useEffect } from 'react';
import ProjectCard from './ProjectCard';

/**
 * VirtualGridPage renders a chunk of projects (e.g., 24 items).
 * When this chunk scrolls out of view, it unmounts the items and replaces them
 * with a blank placeholder of the exact same height, preserving the scroll position
 * while freeing up massive amounts of DOM nodes and GPU memory.
 */
export default function VirtualGridPage({ projects, currentUserId, isLastPage, lastElementRef }) {
  const [isVisible, setIsVisible] = useState(true);
  const [height, setHeight] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    // Only track height if it's currently visible
    if (isVisible && containerRef.current) {
      // Small timeout to allow images to load their intrinsic aspect ratios
      const timer = setTimeout(() => {
        if (containerRef.current) {
          setHeight(containerRef.current.offsetHeight);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, projects.length]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // We observe the container to see if it's far out of the viewport.
    // If it's more than 2000px away from the viewport, we unmount it.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Only trigger virtualization if we have a recorded height
        // and it's not the last page currently loading items.
        if (!isLastPage && height > 0) {
          setIsVisible(entry.isIntersecting);
        } else {
          // If it's the last page or no height recorded, always visible
          setIsVisible(true);
        }
      },
      {
        rootMargin: '2000px 0px', // Pre-render 2000px before it comes into view
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height, isLastPage]);

  // When not visible, render a placeholder with the EXACT height.
  if (!isVisible && height > 0) {
    return <div style={{ height: `${height}px`, width: '100%' }} />;
  }

  return (
    <div ref={containerRef} className="projects-masonry" style={{ marginBottom: '1rem' }}>
      {projects.map((project, index) => {
        // Attach the infinite scroll trigger to the very last element of this chunk
        // ONLY if this chunk is the last page.
        if (isLastPage && index === projects.length - 1 && lastElementRef) {
          return (
            <div ref={lastElementRef} key={project.id} style={{ width: '100%', minWidth: 0 }}>
              <ProjectCard project={project} currentUserId={currentUserId} />
            </div>
          );
        }
        return <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />;
      })}
    </div>
  );
}
