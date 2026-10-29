// English UI texts: the source of all translations.
// Not translated anywhere: the product name "Azyron Client", the disclaimer on the About page
// (required wording) and the language names on the settings page (always in their own language).
const en = {
  nav: {
    label: 'Main navigation',
    home: 'Home',
    instances: 'Instances',
    servers: 'Servers',
    settings: 'Settings',
    about: 'About'
  },
  titleBar: {
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    close: 'Close'
  },
  common: {
    cancel: 'Cancel',
    save: 'Save',
    create: 'Create',
    delete: 'Delete',
    retry: 'Try again'
  },
  instances: {
    newInstance: 'New instance',
    emptyTitle: 'No instances yet',
    emptyHint: 'Create an instance to choose a Minecraft version and get started.',
    version: 'Version {{version}}',
    snapshot: 'Snapshot',
    rename: 'Rename',
    openFolder: 'Open folder',
    delete: 'Delete',
    createTitle: 'New instance',
    nameLabel: 'Name',
    versionLabel: 'Version',
    showSnapshots: 'Show snapshots',
    loadingVersions: 'Loading versions …',
    versionsError: 'The version list could not be loaded. Check your internet connection and try again.',
    offline: 'Offline: showing the last saved version list.',
    renameTitle: 'Rename instance',
    deleteTitle: 'Delete instance',
    deleteText: 'Delete “{{name}}”? Its folder with worlds, screenshots and settings will be deleted permanently.',
    actionFailed: 'The action failed: {{message}}',
    install: 'Install',
    stageMetadata: 'Preparing …',
    stageGame: 'Downloading game files …',
    stageJava: 'Downloading Java …',
    progress: '{{done}} of {{total}} MB',
    cancelInstall: 'Cancel installation',
    installed: 'Installed',
    failedDiskSpace: 'Not enough disk space.',
    failedNetwork: 'Download failed. Check your internet connection.',
    failedOther: 'Installation failed.',
    play: 'Play',
    signInToPlay: 'Sign in to play'
  },
  home: {
    characterPreview: 'Character preview',
    notSignedIn: 'Not signed in',
    signIn: 'Sign in',
    signInSoon: 'Microsoft sign-in will be available soon.'
  },
  about: {
    version: 'Version {{version}}',
    contact: 'Contact',
    license: 'License',
    runtime: 'Runtime'
  },
  settings: {
    themeHeading: 'Theme',
    themeHint: 'The selected theme is applied and saved immediately.',
    languageHeading: 'Language',
    languageHint: 'The selected language is applied and saved immediately.'
  },
  themes: {
    dark: {
      label: 'Dark',
      description: 'Dark theme with violet accent (default)'
    },
    light: {
      label: 'Light',
      description: 'Light surfaces with dark text'
    },
    amoled: {
      label: 'AMOLED Black',
      description: 'Pure black background for OLED screens'
    }
  }
};

/** Structure every translation must have; a missing or extra key is a type error. */
export type Translation = typeof en;

export default en;
