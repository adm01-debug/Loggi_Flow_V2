import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Data-driven vendor chunk mapping keeps `manualChunks` cognitive complexity low.
// Order matters: first match wins.
const VENDOR_CHUNKS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['vendor-router', ['react-router']],
  ['vendor-react', ['react-dom', '/react/']],
  ['vendor-query', ['@tanstack/react-query']],
  ['vendor-supabase', ['@supabase']],
  ['vendor-ui', ['@radix-ui']],
  ['vendor-charts', ['recharts', 'd3-']],
  ['vendor-motion', ['framer-motion']],
  ['vendor-maplibre', ['maplibre-gl']],
  ['vendor-pdf', ['jspdf', 'jspdf-autotable']],
  ['vendor-html2canvas', ['html2canvas']],
  ['vendor-xlsx', ['xlsx']],
  ['vendor-purify', ['dompurify', 'purify']],
  ['vendor-dates', ['date-fns']],
  ['vendor-carousel', ['embla-carousel']],
  ['vendor-dnd', ['@dnd-kit']],
  ['vendor-markdown', ['react-markdown', 'remark', 'rehype', 'unified', 'mdast', 'hast', 'micromark']],
  ['vendor-cmdk', ['cmdk']],
  ['vendor-forms', ['zod', 'react-hook-form', '@hookform']],
];

function resolveVendorChunk(id: string): string | undefined {
  for (const [chunk, needles] of VENDOR_CHUNKS) {
    for (const needle of needles) {
      if (id.includes(needle)) return chunk;
    }
  }
  return undefined;
}


export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'LogiFlow - Gestão Logística',
        short_name: 'LogiFlow',
        description: 'Sistema avançado de gestão logística e rastreamento',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return resolveVendorChunk(id);
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: true,
    // Vendor chunks like maplibre are large but lazy-loaded; suppress warnings
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