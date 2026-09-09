import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
    // Only active for `npm run analyze` — writes dist/bundle-stats.html and
    // never runs during normal dev/build so it has no effect on shipped output.
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/bundle-stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Group large, slow-changing vendor libraries into their own cacheable
        // chunks so a routine app-code change doesn't force users to
        // re-download React, the 3D engine, or the charting library.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]three[\\/]/.test(id)) return 'vendor-three';
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (/react-router|react-dom|[\\/]react[\\/]/.test(id)) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
});
