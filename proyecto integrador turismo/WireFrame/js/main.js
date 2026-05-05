
// CARRUSEL
let current = 0;
const heroSlidesEl = document.getElementById('heroSlides');
const heroDots = document.querySelectorAll('.hero-dot');
const total = heroSlidesEl ? document.querySelectorAll('#heroSlides .hero-slide').length : 0;
function goSlide(n) {
    if (!heroSlidesEl || total === 0) return;
    current = n;
    heroSlidesEl.style.transform = `translateX(-${current * 100}%)`;
    heroDots.forEach((d, i) => d.classList.toggle('active', i === current));
}
function nextSlide() { if (total > 0) goSlide((current + 1) % total); }
function prevSlide() { if (total > 0) goSlide((current - 1 + total) % total); }
if (heroSlidesEl && total > 0) {
    setInterval(nextSlide, 10000);
}

// CARRUSEL PÁGINAS DETALLE (detalle-*.html)
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
function detailNextSlide() {
    detailGoSlide(detailCurrent + 1);
}
function detailPrevSlide() {
    detailGoSlide(detailCurrent - 1);
}
(function initDetailCarousel() {
    const detailSlidesEl = getDetailSlidesEl();
    if (!detailSlidesEl || detailSlideCount() === 0) return;
    detailCurrent = 0;
    detailSlidesEl.style.transform = 'translate3d(0, 0, 0)';
    detailGoSlide(0);
})();

// HAMBURGER
function toggleMenu() {
    const m = document.getElementById('mobMenu');
    if (!m) return;
    m.classList.toggle('open');
}

function setFilter(el) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
}

// CATS FILTER
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});
