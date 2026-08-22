import { useCallback, useEffect, useRef, useState } from 'react';
import { siteConfig } from '../../config/siteConfig';

const HERO_INTERVAL = 10000;

const SLIDES = [
  { src: '/img/Fondos/Playa_Necochea.jpg', alt: 'Playa de Necochea' },
  { src: '/img/Fondos/Parque_Miguelillo.jpg', alt: 'Parque Miguelillo' },
  { src: '/img/Fondos/lago_cisnes.JPG', alt: 'Lago de los Cisnes' },
  { src: '/img/Fondos/Playa_Quequen.jpg', alt: 'Playa de Quequen' },
  { src: '/img/Fondos/cartel_neco.jpg', alt: 'Cartel de Necochea' },
  { src: '/img/Fondos/escollera.png', alt: 'Escollera de Necochea' },
  { src: '/img/Fondos/jardin_japones.jpeg', alt: 'Jardin Japones de Necochea' },
  { src: '/img/Fondos/puente_colgante.jpg', alt: 'Puente colgante de Necochea' },
];

export default function HeroCarousel() {
  const videoId = (siteConfig.heroYoutubeVideoId || '').trim();
  const hasVideo = !!videoId;
  const total = (hasVideo ? 1 : 0) + SLIDES.length;

  const [index, setIndex] = useState(0);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const indexRef = useRef(0);

  const isVideoIndex = hasVideo && index === 0;

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const go = useCallback(
    (n) => {
      if (total <= 0) return;
      const next = ((n % total) + total) % total;
      if (isVideoIndex && playerRef.current?.pauseVideo) {
        try {
          playerRef.current.pauseVideo();
        } catch {
          /* noop */
        }
      }
      setIndex(next);
    },
    [total, isVideoIndex]
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (total <= 1 || isVideoIndex) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, HERO_INTERVAL);
  }, [stopTimer, total, isVideoIndex]);

  useEffect(() => {
    if (!hasVideo) return undefined;

    const initPlayer = () => {
      if (!window.YT?.Player || playerRef.current) return;
      playerRef.current = new window.YT.Player('heroYoutubePlayer', {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (indexRef.current === 0) {
              try {
                playerRef.current?.mute?.();
                playerRef.current?.playVideo?.();
              } catch {
                /* noop */
              }
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              setIndex((current) => (current + 1) % total);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    return () => {
      stopTimer();
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
  }, [hasVideo, videoId, stopTimer, total]);

  useEffect(() => {
    if (isVideoIndex) {
      stopTimer();
      try {
        playerRef.current?.mute?.();
        playerRef.current?.playVideo?.();
      } catch {
        /* noop */
      }
    } else {
      startTimer();
    }
    return stopTimer;
  }, [index, isVideoIndex, startTimer, stopTimer]);

  return (
    <section className="hero" id="hero">
      <div
        className="hero-slides"
        id="heroSlides"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {hasVideo && (
          <div className="hero-slide hero-slide-video" id="heroVideoSlide">
            <div id="heroYoutubePlayer" className="hero-video-player" aria-label="Video promocional" />
          </div>
        )}
        {SLIDES.map((slide) => (
          <div key={slide.src} className="hero-slide">
            <img className="hero-slide-img" src={slide.src} alt={slide.alt} />
          </div>
        ))}
      </div>
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">Bienvenido a Necochea</div>
        <div className="hero-title">Descubrí Necochea</div>
        <div className="hero-sub">Mar, naturaleza y aventura en la costa atlántica bonaerense</div>
      </div>
      <div className="hero-arrows">
        <button type="button" className="hero-arrow" onClick={() => go(index - 1)} aria-label="Anterior">
          ‹
        </button>
        <button type="button" className="hero-arrow" onClick={() => go(index + 1)} aria-label="Siguiente">
          ›
        </button>
      </div>
      <div className="hero-dots" id="heroDots">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={`hero-dot${index === i ? ' active' : ''}`}
            onClick={() => go(i)}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
