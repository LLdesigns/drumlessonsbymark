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

        manualChunks: undefined,

        assetFileNames: 'assets/[name].[ext]',

        chunkFileNames: 'assets/[name].js',

        entryFileNames: 'assets/[name].js',

      },

    },

  },

})


