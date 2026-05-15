import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime
          if (id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-router'))) {
            return 'vendor-react';
          }
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          // Query layer
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'vendor-ui';
          }
          // Heavy libs - lazy loaded
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('mapbox-gl')) {
            return 'vendor-mapbox';
          }
          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'vendor-pdf';
          }
          if (id.includes('html2canvas')) {
            return 'vendor-html2canvas';
          }
          if (id.includes('xlsx')) {
            return 'vendor-xlsx';
          }
          if (id.includes('dompurify') || id.includes('purify')) {
            return 'vendor-purify';
          }
          if (id.includes('date-fns')) {
            return 'vendor-dates';
          }
          // Embla carousel - used by few pages
          if (id.includes('embla-carousel')) {
            return 'vendor-carousel';
          }
          // DnD kit - used by dashboard
          if (id.includes('@dnd-kit')) {
            return 'vendor-dnd';
          }
          // React markdown - used by AI assistant
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('unified') || id.includes('mdast') || id.includes('hast') || id.includes('micromark')) {
            return 'vendor-markdown';
          }
          // cmdk - command palette
          if (id.includes('cmdk')) {
            return 'vendor-cmdk';
          }
          // Zod + react-hook-form
          if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'vendor-forms';
          }
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: true,
    // Vendor chunks like mapbox are large but lazy-loaded; suppress warnings
    chunkSizeWarningLimit: 700,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
  test: {
    globals: true,
    testTimeout: 60000,
    environment: 'jsdom',
    setupFiles: './tests/test-utils.tsx',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
}));
