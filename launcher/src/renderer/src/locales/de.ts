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
  common: {
    cancel: 'Abbrechen',
    save: 'Speichern',
    create: 'Erstellen',
    delete: 'Löschen',
    retry: 'Erneut versuchen'
  },
  instances: {
    newInstance: 'Neue Instanz',
    emptyTitle: 'Noch keine Instanzen',
    emptyHint: 'Erstelle eine Instanz, um eine Minecraft-Version zu wählen und loszulegen.',
    version: 'Version {{version}}',
    snapshot: 'Snapshot',
    rename: 'Umbenennen',
    openFolder: 'Ordner öffnen',
    delete: 'Löschen',
    createTitle: 'Neue Instanz',
    nameLabel: 'Name',
    versionLabel: 'Version',
    showSnapshots: 'Snapshots anzeigen',
    loadingVersions: 'Versionen werden geladen …',
    versionsError: 'Die Versionsliste konnte nicht geladen werden. Prüfe deine Internetverbindung und versuche es erneut.',
    offline: 'Offline: Es wird die zuletzt gespeicherte Versionsliste angezeigt.',
    renameTitle: 'Instanz umbenennen',
    deleteTitle: 'Instanz löschen',
    deleteText: '«{{name}}» löschen? Der Ordner mit Welten, Screenshots und Einstellungen wird endgültig gelöscht.',
    actionFailed: 'Die Aktion ist fehlgeschlagen: {{message}}',
    install: 'Installieren',
    stageMetadata: 'Wird vorbereitet …',
    stageGame: 'Spieldateien werden geladen …',
    stageJava: 'Java wird geladen …',
    progress: '{{done}} von {{total}} MB',
    cancelInstall: 'Installation abbrechen',
    installed: 'Installiert',
    failedDiskSpace: 'Nicht genug Speicherplatz.',
    failedNetwork: 'Download fehlgeschlagen. Prüfe deine Internetverbindung.',
    failedOther: 'Installation fehlgeschlagen.'
  },
  home: {
    characterPreview: 'Figurenvorschau',
    notSignedIn: 'Nicht angemeldet'
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
