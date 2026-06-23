import React, { useState } from 'react';

export default function ImageGallery({ images, title }) {
  const [lightbox, setLightbox] = useState(null);

  if (!images || !images.length) return null;

  return (
    <>
      <div className="project-detail__gallery">
        {images.map((img, i) => (
          <button
            key={i}
            className="project-detail__gallery-item"
            onClick={() => setLightbox(i)}
          >
            <img src={img} alt={`${title} — image ${i + 1}`} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div
          className="lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button className="lightbox__close" onClick={() => setLightbox(null)}>✕</button>
          <button
            className="lightbox__nav lightbox__nav--prev"
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.max(0, i - 1)); }}
            disabled={lightbox === 0}
          >‹</button>
          <img
            src={images[lightbox]}
            alt={`${title} — image ${lightbox + 1}`}
            className="lightbox__img"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="lightbox__nav lightbox__nav--next"
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.min(images.length - 1, i + 1)); }}
            disabled={lightbox === images.length - 1}
          >›</button>
          <p className="lightbox__counter">{lightbox + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
