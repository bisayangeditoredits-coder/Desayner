import React from 'react';

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];

export default function CategoryFilter({ currentCategory, setFeedState }) {
  return (
    <div className="feed-category-filter">
      <span className="feed-category-filter__label">Popular:</span>
      <div className="feed-category-filter__list">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFeedState({ category: cat, sort: 'popular' })}
            className={`feed-category-filter__btn ${currentCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
