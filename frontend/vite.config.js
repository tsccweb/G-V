import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'mask-icon.svg', 'screenshot-mobile.png', 'screenshot-desktop.png'],
      manifest: {
        id: 'com.psalms.worship',
        name: 'G>/\\V Worship PWA',
        short_name: 'G>/\\V',
        description: 'Modern worship ministry management and chord rendering.',
        start_url: '/',
        scope: '/',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        prefer_related_applications: false,
        categories: ['productivity'],
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshot-mobile.png',
            sizes: '500x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Worship Management on Mobile'
          },
          {
            src: '/screenshot-desktop.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Comprehensive Service Planning'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'classic',
        /* when using generateSW the purple is 'dev-sw.js' */
        navigateFallback: 'index.html',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      injectRegister: 'auto'
    })
  ],
})
