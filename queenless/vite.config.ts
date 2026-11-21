/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Each -80 game gets its own fixed port so several can run at once.
const DEV_PORT = 8087;

export default defineConfig({
  // Relative asset paths, so the build works from any folder or subpath
  // (itch.io, GitHub Pages, a USB stick in an arcade cabinet...).
  base: './',
  server: { port: DEV_PORT, strictPort: true },
  preview: { port: DEV_PORT + 1000, strictPort: true },
  build: {
    // Phaser itself is ~1.2 MB minified; silence the default 500 kB warning.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
