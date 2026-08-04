import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Keep slow-moving dependencies in their own long-lived chunks so a
        // module change does not invalidate the whole vendor bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react'
          if (/node_modules\/react-router\//.test(id)) return 'vendor-router'
          if (/node_modules\/(radix-ui|@radix-ui)\//.test(id)) return 'vendor-radix'
          if (/node_modules\/lucide-react\//.test(id)) return 'vendor-icons'
        },
      },
    },
  },
})
