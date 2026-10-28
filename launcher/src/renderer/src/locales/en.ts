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
  home: {
    characterPreview: 'Character preview',
    notSignedIn: 'Not signed in'
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
