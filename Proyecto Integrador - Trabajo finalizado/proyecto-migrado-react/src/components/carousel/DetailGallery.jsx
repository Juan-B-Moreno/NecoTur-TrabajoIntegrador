import { useEffect, useState } from 'react';

export default function DetailGallery({ images = [], alt }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const showNav = count > 1;

  useEffect(() => {
    setIndex(0);
  }, [images]);

  const go = (n) => {
    if (count === 0) return;
    setIndex(((n % count) + count) % count);
  };

  return (
    <div className="detail-carousel" id="detailCarousel">
      <div className="detail-carousel-inner">
        <div
          className="detail-slides"
          id="detailSlides"
          style={count > 0 ? { transform: `translate3d(-${index * 100}%, 0, 0)` } : undefined}
        >
          {count > 0 ? (
            images.map((url) => (
              <div key={url} className="detail-slide">
                <img
                  src={url}
                  alt={alt || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))
          ) : (
            <div className="detail-slide">
              <div style={{ width: '100%', height: 280, background: '#e8e8e8' }} aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="detail-arrows" hidden={!showNav}>
          <button
            type="button"
            className="detail-arrow"
            onClick={() => go(index - 1)}
            aria-label="Foto anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="detail-arrow"
            onClick={() => go(index + 1)}
            aria-label="Foto siguiente"
          >
            ›
          </button>
        </div>
        <div className="detail-dots" role="tablist" aria-label="Seleccionar foto" hidden={!showNav}>
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              className={`detail-dot${i === index ? ' active' : ''}`}
              onClick={() => go(i)}
              aria-label={`Foto ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
