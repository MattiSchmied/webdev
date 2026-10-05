/* ============================================================
   Friseur Imhof – UI-Verhalten
   ============================================================ */

'use strict';

const CONFIG = Object.freeze({
  scrolledThreshold: 16,
  activeNavOffset: 110,
  observerThreshold: 0.12,
  mobileBreakpoint: '(max-width: 760px)',
});

const body = document.body;
const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const mobileNavQuery = window.matchMedia(CONFIG.mobileBreakpoint);
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Mobile Navigation ------------------------------------------------ */
function setNavInert(isInert) {
  if (!nav) return;
  if (isInert) nav.setAttribute('inert', '');
  else nav.removeAttribute('inert');
}

function openNav() {
  if (!nav || !navToggle) return;
  nav.classList.add('is-open');
  body.classList.add('nav-open');
  setNavInert(false);
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Menü schließen');
}

function closeNav({ restoreFocus = false } = {}) {
  if (!nav || !navToggle) return;
  nav.classList.remove('is-open');
  body.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Menü öffnen');
  setNavInert(mobileNavQuery.matches);
  if (restoreFocus) navToggle.focus();
}

function syncNavToViewport() {
  if (!nav || !navToggle) return;
  if (mobileNavQuery.matches) {
    if (!nav.classList.contains('is-open')) setNavInert(true);
  } else {
    closeNav();
    setNavInert(false);
  }
}

if (nav && navToggle) {
  navToggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? closeNav() : openNav();
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeNav());
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNav({ restoreFocus: true });
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (
      nav.classList.contains('is-open') &&
      !nav.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeNav();
    }
  });

  mobileNavQuery.addEventListener('change', syncNavToViewport);
  syncNavToViewport();
}

/* Header und aktive Sektion ---------------------------------------- */
const navLinks = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > CONFIG.scrolledThreshold);
}

function updateActiveLink() {
  if (!sections.length) return;

  const currentY = window.scrollY + CONFIG.activeNavOffset;
  let currentSection = sections[0];

  sections.forEach((section) => {
    if (section.offsetTop <= currentY) currentSection = section;
  });

  navLinks.forEach((link) => {
    const isActive = link.hash === `#${currentSection.id}`;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

let scrollFrame = 0;
function handleScroll() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateHeader();
    updateActiveLink();
    scrollFrame = 0;
  });
}

updateHeader();
updateActiveLink();
window.addEventListener('scroll', handleScroll, { passive: true });

/* Scroll Reveal ---------------------------------------------------- */
const animatedElements = document.querySelectorAll(`
  .service-card,
  .price-card,
  .step,
  .kontakt-inner,
  .section-header,
  .ueber-photo-frame,
  .ueber-badge
`);

if (
  !reducedMotionQuery.matches &&
  'IntersectionObserver' in window
) {
  animatedElements.forEach((element) => element.classList.add('will-animate'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: CONFIG.observerThreshold }
  );

  animatedElements.forEach((element) => observer.observe(element));
}

/* Dezenter Karten-Tilt auf präzisen Zeigegeräten ------------------ */
if (
  !reducedMotionQuery.matches &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches
) {
  document.querySelectorAll('.service-card, .price-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 4;
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -4;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

/* Google Maps erst nach bewusster Freigabe laden ------------------ */
const mapContainer = document.querySelector('[data-map]');
const mapLoadButton = document.querySelector('[data-map-load]');

mapLoadButton?.addEventListener('click', () => {
  if (!mapContainer || mapContainer.querySelector('iframe')) return;

  const iframe = document.createElement('iframe');
  iframe.title = 'Google Maps: Friseur Imhof, Goerdelerstraße 49, Unterhaching';
  iframe.src = 'https://www.google.com/maps?q=Goerdelerstr.%2049%2C%2082008%20Unterhaching&output=embed';
  iframe.width = '600';
  iframe.height = '450';
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  mapContainer.querySelector('[data-map-consent]')?.remove();
  mapContainer.append(iframe);
  iframe.focus();
});

/* Lokale Bild-Fallbacks -------------------------------------------- */
document.querySelectorAll('.brand-logo-img').forEach((image) => {
  const showFallback = () => image.closest('.brand-logo-wrap')?.classList.add('fallback');
  image.addEventListener('error', showFallback);
  if (image.complete && image.naturalWidth === 0) showFallback();
});

document.querySelectorAll('.hero-salon-img').forEach((image) => {
  const showFallback = () => image.closest('.hero-image-frame')?.classList.add('is-missing');
  image.addEventListener('error', showFallback);
  if (image.complete && image.naturalWidth === 0) showFallback();
});
