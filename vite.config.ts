import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this project from https://<user>.github.io/cards-stickers/,
// not the domain root. GITHUB_ACTIONS is set by every GH Actions run, so local
// dev/build/preview stay at "/" and only the CI-built deploy gets the subpath.
// (Kept as a plain object, not defineConfig(({ command }) => ...): vitest.config.ts
// feeds this into mergeConfig(), which needs a resolved UserConfig, not a function.)
const base = process.env.GITHUB_ACTIONS ? '/cards-stickers/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Sticker Tracker WC26',
        short_name: 'WC26 Stickers',
        description: 'Panini World Cup 2026 sticker album tracker',
        theme_color: '#101114',
        background_color: '#101114',
        display: 'standalone',
        // Relative (no leading "/"): vite-plugin-pwa resolves these against
        // the resolved `base` above, so they still work under a subpath.
        start_url: '.',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
