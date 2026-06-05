import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'



// https://vite.dev/config/

export default defineConfig({

  plugins: [

    react(),

    VitePWA({

      registerType: 'autoUpdate',

      injectRegister: 'auto',

      strategies: 'injectManifest',

      srcDir: 'src',

      filename: 'pwa-sw.ts',

      includeAssets: ['logoMP.svg', 'backgroundImage.png'],

      manifest: {

        name: "Mark's Drum Studio Portal",

        short_name: "Mark's Studio",

        description:

          'Private drum studio portal — lessons, practice, and messages with Mark.',

        theme_color: '#0a071a',

        background_color: '#0a071a',

        display: 'standalone',

        orientation: 'portrait-primary',

        scope: '/',

        start_url: '/app',

        categories: ['education', 'music'],

        icons: [

          {

            src: '/logoMP.svg',

            sizes: '512x512',

            type: 'image/svg+xml',

            purpose: 'any',

          },

          {

            src: '/logoMP.svg',

            sizes: '512x512',

            type: 'image/svg+xml',

            purpose: 'maskable',

          },

        ],

      },

      injectManifest: {

        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

      },

      devOptions: {
        enabled: true,
        type: 'module',
      },

    }),

  ],

  base: '/',

  server: {

    port: 5288,

    host: '127.0.0.1',

    strictPort: true,

    fs: {

      strict: true,

    },

  },

  preview: {

    port: 5288,

  },

  build: {

    outDir: 'dist',

    assetsDir: 'assets',

    rollupOptions: {

      output: {

        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react/')
          ) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase'
          if (id.includes('node_modules/@tanstack')) return 'vendor-query'
          if (id.includes('node_modules/recharts') || id.includes('node_modules/wavesurfer')) {
            return 'vendor-media'
          }
          return 'vendor'
        },

        chunkFileNames: 'assets/[name]-[hash].js',

        entryFileNames: 'assets/[name]-[hash].js',

        assetFileNames: 'assets/[name]-[hash][extname]',

      },

    },

  },

})


