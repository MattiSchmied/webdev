const android = file => ({ platform: 'Android', format: 'APK', file, symbol: 'android' });
const ios = file => ({ platform: 'iPhone & iPad', format: 'IPA', file, symbol: 'apps' });

export const apps = [
  {
    slug: 'sequvia',
    name: 'Sequvia',
    release: { version: '1.0.0', updated: '2026-11-06' },
    description: 'Ein Stadtspiel in München, bei dem zwei Teams gegeneinander antreten und Missionen lösen.',
    icon: 'sequvia.svg',
    downloads: [
      android('Sequvia_apk.zip'),
      ios('Sequvia_ipa.zip'),
    ],
  },
  {
    slug: 'notin',
    name: 'Notin',
    release: { version: '1.4.2', updated: '2026-11-13' },
    description: 'Schulnoten, Durchschnitte und Stundenplan im Blick. Mit eigenen Berechnungsprofilen für die bayerische Oberstufe und Abiturplanung.',
    icon: 'notin.png',
    downloads: [android('Notin_apk.zip'), { ...ios('Notin_ipa.zip'), previous: true }],
  },
  {
    slug: 'negotia',
    name: 'Negotia',
    release: { version: '1.30.4', updated: '2026-11-13' },
    description: 'To-do-App für Aufgabenlisten, Unteraufgaben und Fälligkeiten, mit Erinnerungen und optionaler Synchronisierung.',
    icon: 'negotia.png',
    downloads: [android('Negotia_apk.zip'), { ...ios('Negotia_ipa.zip'), previous: true }],
  },
];

export const appRoute = app => 'apps/' + app.slug + '/';
export const downloadUrl = route => 'https://raw.githubusercontent.com/MattiSchmied/webdev/main/' + route;
export const downloads = apps.flatMap(app =>
  app.downloads.map(({ file }) => appRoute(app) + 'downloads/' + file),
);
