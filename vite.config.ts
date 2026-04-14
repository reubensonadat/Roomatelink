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
        // NOTE: Runtime caching for Supabase API calls was removed.
        // Android Power Saving Mode freezes the Service Worker thread, which paralyzes API requests
        // and prevents React's AbortController from cancelling them, causing infinite spinners.
        // The app relies on the custom `timeoutFetch` wrapper in `src/lib/supabase.ts`
        // to handle fast-failing on the unfrozen main browser thread instead.
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
