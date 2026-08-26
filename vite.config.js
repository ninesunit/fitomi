import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Bandwidth is the scarce resource on the Firebase Spark plan (360 MB/day of
// hosting transfer), so the build is tuned to ship as few bytes as possible:
// aggressive minification, no sourcemaps in prod, and manual chunks so that a
// return visitor only re-downloads the chunk that actually changed.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true, passes: 2 },
    },
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Only the big, independently-cacheable libraries are split out.
        // There is deliberately no `vendor` catch-all: a bucket holding React's
        // own transitive helpers makes vendor and react mutually dependent, and
        // Rollup then emits a circular-chunk warning. Anything not named here
        // stays in the entry chunk, where Rollup can order it correctly.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
          if (id.includes('/framer-motion/') || id.includes('/motion-dom/') || id.includes('/motion-utils/')) {
            return 'motion';
          }
          if (id.includes('/react-router')) return 'router';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/use-sync-external-store/')
          ) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
});
