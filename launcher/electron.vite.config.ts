import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

// electron-vite builds three parts: main process, preload script and renderer (UI).
// Entry points follow the default layout: src/main, src/preload, src/renderer.
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [react()]
  }
});
