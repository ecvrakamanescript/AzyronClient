import type { Translation } from './en';

// German translation of en.ts (Swiss spelling: ss instead of ß).
const de: Translation = {
  nav: {
    label: 'Hauptnavigation',
    home: 'Start',
    instances: 'Instanzen',
    servers: 'Server',
    settings: 'Einstellungen',
    about: 'Über'
  },
  titleBar: {
    minimize: 'Minimieren',
    maximize: 'Maximieren',
    restore: 'Wiederherstellen',
    close: 'Schliessen'
  },
  about: {
    version: 'Version {{version}}',
    contact: 'Kontakt',
    license: 'Lizenz',
    runtime: 'Laufzeit'
  },
  settings: {
    themeHeading: 'Design',
    themeHint: 'Das gewählte Design wird sofort angewendet und gespeichert.',
    languageHeading: 'Sprache',
    languageHint: 'Die gewählte Sprache wird sofort angewendet und gespeichert.'
  },
  themes: {
    dark: {
      label: 'Dunkel',
      description: 'Dunkles Design mit violetter Akzentfarbe (Standard)'
    },
    light: {
      label: 'Hell',
      description: 'Helle Flächen mit dunkler Schrift'
    },
    amoled: {
      label: 'AMOLED-Schwarz',
      description: 'Rein schwarzer Hintergrund für OLED-Bildschirme'
    }
  }
};

export default de;
