import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["node_modules", "dist", "tests/e2e"],
    // Timeout global aumentado para cobrir cold-start de Edge Functions (~8s)
    // e beforeAll de health-check com AbortSignal.timeout(4000).
    testTimeout: 10000,
    hookTimeout: 8000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types.ts",
      ],
      // Ratchet: piso medido em 2026-09-03 (73.2 li / 74.4 fn / 68.4 br / 71.9 st).
      // Só sobe conforme a dívida é paga; nunca desça sem aprovação em review.
      // Revisão 2026-11-24 (etapa 284, medidas sobre a main 37295911, depois das etapas 275-278,
      // 281 e 282): 78.05 li / 73.55 fn / 69.93 br / 75.9 st, estável em duas execuções.
      // Piso = medido − 1 ponto, para a oscilação do v8. `functions` fica em 73 porque o medido − 1
      // (72.55) cairia abaixo do piso atual, e baixar piso exige aprovação em review.
      thresholds: {
        lines: 77,
        functions: 73,
        branches: 68,
        statements: 74,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
