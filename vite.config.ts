import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
        // Runtime caching for Supabase API calls
        // NOTE: Runtime caching WILL NOT WORK in Vite dev mode, only in production/staging builds
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/rest\/v1\//,
            handler: 'NetworkFirst',
            options: {
              networkTimeoutSeconds: 5, // Fast-fail on mobile TCP hangs instead of waiting for OS timeout
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60, // Cache for 1 minute
              },
              cacheableResponse: {
                statuses: [0, 200], // Cache successful responses
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/auth\/v1\//,
            handler: 'NetworkFirst',
            options: {
              networkTimeoutSeconds: 5, // Fast-fail on mobile TCP hangs
              cacheName: 'supabase-auth-cache',
              // Do NOT cache auth responses - only want fast-fail behavior
              cacheableResponse: {
                statuses: [], // Empty array = no caching for auth
              },
            },
          },
        ],
      },
      manifest: {
        name: 'RoommateLink | Avoid the Roommate Gamble',
        short_name: 'RoommateLink',
        description: 'Connect with highly compatible university students using our proprietary behavioral matching engine. Pure science, zero guess work.',
        theme_color: '#4f46e5',
        background_color: '#4f46e5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/dashboard',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: false,
    minify: true
  }
})
