/* ============================================================
   Friseur Imhof – Premium Salon Script
   ============================================================ */

const CONFIG = {
  scrolledThreshold: 16,
  activeNavOffset: 110,
  observerThreshold: 0.12,
};

/* ----------------------------------------------------------
   Elemente
---------------------------------------------------------- */
const body      = document.body;
const header    = document.querySelector('[data-header]');
const nav       = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');

/* ----------------------------------------------------------
   Mobile Navigation
---------------------------------------------------------- */
function openNav() {
  nav.classList.add('is-open');
  body.classList.add('nav-open');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Menü schließen');
}

function closeNav() {
  nav.classList.remove('is-open');
  body.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Menü öffnen');
}

if (nav && navToggle) {

  navToggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? closeNav() : openNav();
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNav();
    }
  });

  document.addEventListener('pointerdown', (e) => {
    if (
      nav.classList.contains('is-open') &&
      !nav.contains(e.target) &&
      !navToggle.contains(e.target)
    ) {
      closeNav();
    }
  });

}

/* ----------------------------------------------------------
   Header Scroll-Zustand
---------------------------------------------------------- */
function updateHeader() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > CONFIG.scrolledThreshold);
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

/* ----------------------------------------------------------
   Aktiver Navigationspunkt
---------------------------------------------------------- */
const navLinks = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateActiveLink() {
  if (!sections.length) return;

  const currentY = window.scrollY + CONFIG.activeNavOffset;
  let currentSection = sections[0];

  sections.forEach((section) => {
    if (section.offsetTop <= currentY) currentSection = section;
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${currentSection.id}`;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

updateActiveLink();
window.addEventListener('scroll', updateActiveLink, { passive: true });

/* ----------------------------------------------------------
   Scroll Reveal
---------------------------------------------------------- */
const animatedElements = document.querySelectorAll(`
  .service-card,
  .price-card,
  .step,
  .kontakt-inner,
  .section-header,
  .ueber-photo-frame,
  .ueber-badge
`);

animatedElements.forEach((el) => el.classList.add('will-animate'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: CONFIG.observerThreshold }
);

animatedElements.forEach((el) => observer.observe(el));

/* ----------------------------------------------------------
   Smooth Tilt Hover (Desktop only)
---------------------------------------------------------- */
if (!window.matchMedia('(hover: none)').matches) {

  const hoverCards = document.querySelectorAll('.service-card, .price-card');

  hoverCards.forEach((card) => {

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 4;
      const rotateX = ((y / rect.height) - 0.5) * -4;

      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-8px)
      `;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });

  });

}

/* ----------------------------------------------------------
   Telefonnummer formatieren (Non-breaking spaces)
---------------------------------------------------------- */
document.querySelectorAll('a[href="tel:+49896112683"]').forEach((link) => {
  if (link.textContent.trim().startsWith('089')) {
    link.textContent = '089\u00A0/\u00A0611\u00A026\u00A083';
  }
});

/* ----------------------------------------------------------
   Reduced Motion
---------------------------------------------------------- */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (reducedMotion.matches) {
  document.documentElement.classList.add('reduced-motion');
}

/* ----------------------------------------------------------
   Hero Parallax – entfernt (kein Foto mehr im Hero-Bereich)
---------------------------------------------------------- */

/* ----------------------------------------------------------
   Logo Fallback (onerror handler backup)
---------------------------------------------------------- */
document.querySelectorAll('.brand-logo-img').forEach((img) => {
  img.addEventListener('error', () => {
    const wrap = img.closest('.brand-logo-wrap');
    if (wrap) wrap.classList.add('fallback');
  });
});
