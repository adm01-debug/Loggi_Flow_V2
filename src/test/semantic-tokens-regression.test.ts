import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// ─── Helpers ─────────────────────────────────────────────────

const HARDCODED_COLOR_REGEX =
  /(?:text|bg|border|ring|from|to|via)-(red|green|blue|yellow|orange|emerald|amber|indigo|violet|pink|rose|lime|sky|cyan|teal|purple)-\d{2,3}/g;

const EXCLUDED_DIRS = ["node_modules", ".git", "dist", "test"];
const INCLUDED_EXTENSIONS = [".tsx"];

function collectFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (EXCLUDED_DIRS.some((d) => full.includes(`/${d}/`) || full.endsWith(`/${d}`))) continue;
    if (statSync(full).isDirectory()) {
      collectFiles(full, files);
    } else if (INCLUDED_EXTENSIONS.some((ext) => full.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

// These files are specifically refactored — zero hardcoded colors expected
const ZERO_TOLERANCE_FILES = [
  "src/components/common/Timeline.tsx",
  "src/components/common/EmptyState.tsx",
  "src/components/auth/PasswordStrengthIndicator.tsx",
  "src/components/onboarding/OnboardingTooltip.tsx",
  "src/components/automation/BusinessRulesManager.tsx",
  "src/components/predictions/DelayPredictionPanel.tsx",
  "src/components/security/SecurityEventsPanel.tsx",
  "src/components/security/DeviceManagement.tsx",
  "src/components/security/GeoBlockingPanel.tsx",
  "src/components/security/RateLimitDashboardPanel.tsx",
  "src/components/security/SessionTimeoutWarning.tsx",
  "src/components/security/SecurityNotificationSettings.tsx",
  "src/components/audit/AuditTrailViewer.tsx",
  "src/components/ui/avatar.tsx",
  "src/components/ui/table.tsx",
  "src/components/transportadoras/RotaResultsList.tsx",
  "src/components/rodonaves/RTETrackingPanel.tsx",
  "src/components/achievements/AchievementNotification.tsx",
  "src/pages/KanbanEntregas.tsx",
  "src/pages/Auth.tsx",
  "src/pages/Conquistas.tsx",
  "src/pages/Ranking.tsx",
  "src/pages/CalendarioLogistico.tsx",
  "src/pages/GestaoBox.tsx",
  "src/pages/RastreamentoMotorista.tsx",
  "src/pages/AlertasCusto.tsx",
  "src/pages/SLADashboard.tsx",
  "src/pages/APIDocumentation.tsx",
  "src/pages/Profile.tsx",
  "src/pages/Configuracoes.tsx",
  "src/pages/LojaRecompensas.tsx",
  "src/pages/Despachos.tsx",
  "src/pages/CotacaoFrete.tsx",
  "src/pages/RelatorioPDF.tsx",
];

// ─── Tests ───────────────────────────────────────────────────

describe("Semantic Token Regression", () => {
  describe("Zero-tolerance files have no hardcoded colors", () => {
    for (const file of ZERO_TOLERANCE_FILES) {
      it(`${file} uses only semantic tokens`, () => {
        const content = readFileSync(file, "utf-8");
        const matches = content.match(HARDCODED_COLOR_REGEX) || [];
        expect(
          matches,
          `Found hardcoded colors: ${matches.join(", ")}`
        ).toHaveLength(0);
      });
    }
  });

  describe("No any types in production code", () => {
    const criticalFiles = [
      "src/pages/RelatorioPDF.tsx",
      "src/pages/ImportacaoMassa.tsx",
      "src/pages/Despachos.tsx",
      "src/hooks/useQuotationFlow.tsx",
      "src/hooks/useFreightIntelligence.tsx",
    ];

    for (const file of criticalFiles) {
      it(`${file} has no \`: any\` declarations`, () => {
        const content = readFileSync(file, "utf-8");
        const anyMatches = content.match(/:\s*any\b/g) || [];
        expect(
          anyMatches,
          `Found ${anyMatches.length} \`: any\` in ${file}`
        ).toHaveLength(0);
      });
    }
  });

  describe("Console hygiene", () => {
    it("No console statements in src (excluding tests)", () => {
      const files = collectFiles("src").filter((f) => !f.includes("/test/"));
      const violations: string[] = [];

      for (const file of files) {
        const content = readFileSync(file, "utf-8");
        // Only error if it's not a commented out console log
        const matches = content.match(/^(?!\s*\/\/).*(console\.(log|warn|error)\b)/gm);
        if (matches) {
          violations.push(`${file}: ${matches.length} console statement(s) [${matches.join(' | ')}]`);
        }
      }

      expect(violations, violations.join("\n")).toHaveLength(0);
    });
  });

  describe("Design system consistency", () => {
    it("index.css defines required semantic tokens", () => {
      const css = readFileSync("src/index.css", "utf-8");
      const requiredTokens = [
        "--background",
        "--foreground",
        "--primary",
        "--destructive",
        "--muted",
        "--accent",
        "--border",
      ];
      for (const token of requiredTokens) {
        expect(css, `Missing token ${token}`).toContain(token);
      }
    });
  });
});
