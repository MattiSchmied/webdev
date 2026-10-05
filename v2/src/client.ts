(() => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) return;
  const toggleButton = toggle;
  const navigation = menu;
  const setOpen = (open: boolean) => {
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
  const sections = [...document.querySelectorAll<HTMLElement>('.price-section')];
  const normalize = (text: string) => text.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('ß', 'ss');
  control.hidden = false;
  const filter = () => {
    const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const section of sections) {
      for (const group of section.querySelectorAll<HTMLElement>('.price-group')) {
        const context = section.id + ' ' + (group.querySelector('h3')?.textContent ?? '') + ' ' + (group.querySelector('.price-description')?.textContent ?? '');
        let groupCount = 0;
        for (const row of group.querySelectorAll<HTMLTableRowElement>('[data-price-id]')) {
          const text = normalize(context + ' ' + row.textContent);
          row.hidden = !terms.every(term => text.includes(term));
          if (!row.hidden) groupCount++;
        }
        group.hidden = groupCount === 0;
        count += groupCount;
      }
      section.hidden = [...section.querySelectorAll<HTMLElement>('.price-group')].every(group => group.hidden);
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
