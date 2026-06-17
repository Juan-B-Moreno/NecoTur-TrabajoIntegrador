
/*
    main.js — Carrusel hero (con video YouTube opcional), detalle, menú móvil.
    Requiere `js/site-config.js` antes de este archivo en index.html para el video.
*/

// ─── CARRUSEL HERO ───
let current = 0;
let heroTimer = null;
let heroPlayer = null;
const HERO_INTERVAL = 10000;

const heroSlidesEl = document.getElementById('heroSlides');
const heroDotsContainer = document.getElementById('heroDots');

function getHeroSlides() {
  return heroSlidesEl ? Array.from(heroSlidesEl.querySelectorAll('.hero-slide:not([hidden])')) : [];
}


function getTotal() {
  return getHeroSlides().length;
}

function currentSlideEl() {
  const slides = getHeroSlides();
  return slides[current] || null;
}

function isVideoSlide(slideEl) {
  return slideEl && slideEl.classList.contains('hero-slide-video');
}

function stopHeroTimer() {
  if (heroTimer) {
    clearInterval(heroTimer);
    heroTimer = null;
  }
}

function startHeroTimer() {
  stopHeroTimer();
  if (getTotal() <= 1) return;
  heroTimer = setInterval(() => {
    const slide = currentSlideEl();
    if (!isVideoSlide(slide)) nextSlide();
  }, HERO_INTERVAL);
}

function rebuildHeroDots() {
  if (!heroDotsContainer) return;
  heroDotsContainer.innerHTML = '';
  getHeroSlides().forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-dot' + (i === current ? ' active' : '');
    dot.setAttribute('aria-label', `Ir a slide ${i + 1}`);
    dot.onclick = () => goSlide(i);
    heroDotsContainer.appendChild(dot);
  });
}

function updateHeroDots() {
  document.querySelectorAll('#heroDots .hero-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === current);
  });
}

function goSlide(n) {
  const slides = getHeroSlides();
  const total = slides.length;
  if (!heroSlidesEl || total === 0) return;

  const prev = currentSlideEl();
  if (isVideoSlide(prev) && heroPlayer && heroPlayer.pauseVideo) {
    try { heroPlayer.pauseVideo(); } catch (e) { /* noop */ }
  }

  current = ((n % total) + total) % total;
  heroSlidesEl.style.transform = `translateX(-${current * 100}%)`;
  updateHeroDots();

  const slide = currentSlideEl();
  if (isVideoSlide(slide)) {
    stopHeroTimer();
    playHeroVideo();
  } else {
    startHeroTimer();
  }
}

function nextSlide() { goSlide(current + 1); }
function prevSlide() { goSlide(current - 1); }

function getHeroYoutubeId() {
  const cfg = window.SiteConfig || {};
  return (cfg.heroYoutubeVideoId || '').trim();
}

function setupHeroVideoSlide() {
  const videoId = getHeroYoutubeId();
  const slide = document.getElementById('heroVideoSlide');
  if (!slide) return false;

  if (!videoId) {
    slide.remove();
    return false;
  }

  slide.hidden = false;
  return true;
}

function loadYouTubeApi(callback) {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (prev) prev();
    callback();
  };
  if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }
}

function initHeroPlayer() {
  const videoId = getHeroYoutubeId();
  const el = document.getElementById('heroYoutubePlayer');
  if (!videoId || !el) return;

  heroPlayer = new YT.Player('heroYoutubePlayer', {
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
        if (isVideoSlide(currentSlideEl())) {
          playHeroVideo();
        }
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) {
          nextSlide();
        }
      },
    },
  });
}

function playHeroVideo() {
  if (!heroPlayer || typeof heroPlayer.playVideo !== 'function') return;
  try {
    if (typeof heroPlayer.mute === 'function') heroPlayer.mute();
    heroPlayer.playVideo();
  } catch (e) { /* noop */ }
}

function initHeroCarousel() {
  if (!heroSlidesEl || !heroDotsContainer) return;

  setupHeroVideoSlide();
  const slides = getHeroSlides();
  if (!slides.length) return;

  rebuildHeroDots();

  if (getHeroYoutubeId()) {
    loadYouTubeApi(() => {
      initHeroPlayer();
      current = 0;
      goSlide(0);
    });
  } else {
    current = 0;
    goSlide(0);
  }
}

// ─── CARRUSEL DETALLE ───
let detailCurrent = 0;

function getDetailCarouselRoot() {
  return document.getElementById('detailCarousel');
}

function getDetailSlidesEl() {
  const root = getDetailCarouselRoot();
  return root ? root.querySelector('#detailSlides') : document.getElementById('detailSlides');
}

function detailSlideCount() {
  const el = getDetailSlidesEl();
  return el ? el.querySelectorAll('.detail-slide').length : 0;
}

function detailGoSlide(n) {
  const detailSlidesEl = getDetailSlidesEl();
  const root = getDetailCarouselRoot();
  if (!detailSlidesEl) return;
  const count = detailSlideCount();
  if (count === 0) return;
  detailCurrent = ((n % count) + count) % count;
  detailSlidesEl.style.transform = `translate3d(-${detailCurrent * 100}%, 0, 0)`;
  const dots = root ? root.querySelectorAll('.detail-dot') : document.querySelectorAll('#detailCarousel .detail-dot');
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === detailCurrent);
  });
}

function detailNextSlide() { detailGoSlide(detailCurrent + 1); }
function detailPrevSlide() { detailGoSlide(detailCurrent - 1); }

(function initDetailCarousel() {
  const detailSlidesEl = getDetailSlidesEl();
  if (!detailSlidesEl || detailSlideCount() === 0) return;
  detailCurrent = 0;
  detailSlidesEl.style.transform = 'translate3d(0, 0, 0)';
  detailGoSlide(0);
})();

// ─── MENÚ MÓVIL ───
function toggleMenu() {
  const m = document.getElementById('mobMenu');
  if (!m) return;
  m.classList.toggle('open');
}

function setFilter(el) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.addEventListener('DOMContentLoaded', initHeroCarousel);
