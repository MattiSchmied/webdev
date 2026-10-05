(() => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) return;
  const toggleButton = toggle;
  const navigation = menu;
  const setOpen = (open         ) => {
    toggleButton.setAttribute('aria-expanded', String(open));
    toggleButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    toggleButton.querySelector('[data-menu-label]')?.replaceChildren(document.createTextNode(open ? 'Schließen' : 'Menü'));
    navigation.classList.toggle('is-open', open);
  };
  toggleButton.hidden = false;
  document.documentElement.classList.add('has-js');
  toggleButton.addEventListener('click', () => setOpen(toggleButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggleButton.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggleButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (event.target instanceof Node && !navigation.contains(event.target) && !toggleButton.contains(event.target)) setOpen(false);
  });
  window.matchMedia('(min-width: 841px)').addEventListener('change', () => setOpen(false));
})();

(() => {
  const input = document.querySelector('#price-query');
  const control = document.querySelector('[data-price-search]');
  const status = document.querySelector('#search-status');
  if (!(input instanceof HTMLInputElement) || !(control instanceof HTMLElement) || !(status instanceof HTMLElement)) return;
  const sections = [...document.querySelectorAll             ('.price-section')];
  const normalize = (text        ) => text.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('ß', 'ss');
  control.hidden = false;
  const filter = () => {
    const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const section of sections) {
      for (const group of section.querySelectorAll             ('.price-group')) {
        const context = section.id + ' ' + (group.querySelector('h3')?.textContent ?? '') + ' ' + (group.querySelector('.price-description')?.textContent ?? '');
        let groupCount = 0;
        for (const row of group.querySelectorAll                     ('[data-price-id]')) {
          const text = normalize(context + ' ' + row.textContent);
          row.hidden = !terms.every(term => text.includes(term));
          if (!row.hidden) groupCount++;
        }
        group.hidden = groupCount === 0;
        count += groupCount;
      }
      section.hidden = [...section.querySelectorAll             ('.price-group')].every(group => group.hidden);
    }
    status.hidden = terms.length === 0;
    status.textContent = count ? `${count} Preisposition${count === 1 ? '' : 'en'} gefunden.` : 'Keine passende Leistung gefunden. Versuchen Sie einen anderen Begriff oder rufen Sie uns an.';
  };
  input.addEventListener('input', filter);
  input.addEventListener('search', filter);
  document.querySelector('.price-jump')?.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a')) { input.value = ''; filter(); }
  });
})();

(() => {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-arrived');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: .08 });
  for (const element of document.querySelectorAll('.service-row, .about-folio, .about-copy, .price-preview .section-head, .faq-section .section-intro, .contact-intro')) {
    if (element.getBoundingClientRect().top < window.innerHeight) continue;
    element.classList.add('reveal');
    observer.observe(element);
  }
})();

(() => {
  const card = document.querySelector             ('[data-map]');
  if (!card) return;
  const load = card.querySelector                   ('[data-map-load]');
  const revoke = card.querySelector                   ('[data-map-revoke]');
  const placeholder = card.querySelector             ('[data-map-placeholder]');
  const host = card.querySelector             ('[data-map-frame]');
  const status = card.querySelector             ('[data-map-status]');
  if (!load || !revoke || !placeholder || !host || !status) return;
  const source = new URL(card.dataset.mapSrc ?? '', location.href);
  if (source.origin !== 'https://www.google.com' || source.pathname !== '/maps/embed') return;
  load.hidden = false;
  load.addEventListener('click', () => {
    if (host.childElementCount) return;
    // The iframe is created only after clicking the explicit consent button.
    // Consent stays in memory for this page view; it is never persisted.
    const frame = document.createElement('iframe');
    frame.title = 'Google Maps – Goerdelerstraße 49, 82008 Unterhaching';
    frame.referrerPolicy = 'no-referrer';
    frame.allowFullscreen = true;
    frame.addEventListener('load', () => {
      if (frame.isConnected) status.textContent = 'Google Maps ist aktiviert. Alternativ können Sie die Anfahrt separat öffnen.';
    }, { once: true });
    frame.src = source.href;
    host.replaceChildren(frame);
    host.hidden = false;
    placeholder.hidden = true;
    revoke.hidden = false;
    status.textContent = 'Google Maps wird geladen. Alternativ können Sie die Anfahrt separat öffnen.';
    revoke.focus({ preventScroll: true });
  });
  revoke.addEventListener('click', () => {
    host.replaceChildren();
    host.hidden = true;
    placeholder.hidden = false;
    revoke.hidden = true;
    status.textContent = 'Die Karte ist geschlossen. Erneutes Laden erfordert Ihre Zustimmung.';
    load.focus({ preventScroll: true });
  });
})();
