const menuButton = document.querySelector                   ('.menu-toggle');
const navigation = document.querySelector             ('#navigation');

if (menuButton && navigation) {
  menuButton.hidden = false;
  navigation.classList.add('enhanced');
  const closeMenu = (restoreFocus = false)       => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.addEventListener('click', (event            ) => {
    if ((event.target               ).closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event               ) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', (event            ) => {
    if (!(event.target               ).closest('.nav-shell')) closeMenu();
  });
  const desktop = window.matchMedia('(min-width: 981px)');
  desktop.addEventListener('change', () => closeMenu());
}

document.querySelectorAll             ('[data-map]').forEach((map) => {
  const placeholder = map.querySelector             ('[data-map-placeholder]');
  const frame = map.querySelector             ('[data-map-frame]');
  const load = map.querySelector                   ('[data-map-load]');
  const revoke = map.querySelector                   ('[data-map-revoke]');
  const controls = map.querySelector             ('[data-map-controls]');
  const status = map.querySelector             ('[data-map-status]');
  if (!placeholder || !frame || !load || !revoke || !controls || !status) return;
  load.hidden = false;
  load.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.title = 'Google Maps: Salonstandort';
    iframe.referrerPolicy = 'no-referrer';
    iframe.src = 'https://www.google.com/maps?q=' + encodeURIComponent(map.getAttribute('data-reta-map-query') || '') + '&output=embed&hl=de';
    iframe.setAttribute('allowfullscreen', '');
    frame.replaceChildren(iframe);
    placeholder.hidden = true;
    frame.hidden = false;
    controls.hidden = false;
    status.textContent = 'Google Maps wurde angefordert. Falls die Karte nicht erscheint, nutze den Routenlink oberhalb.';
    revoke.focus();
  });
  revoke.addEventListener('click', () => {
    frame.replaceChildren();
    frame.hidden = true;
    controls.hidden = true;
    placeholder.hidden = false;
    status.textContent = '';
    load.focus();
  });
});
