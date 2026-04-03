import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// ============================================================
// TEST SUITE: Design System Improvements Validation
// Covers: Contrast, Elevation, Sidebar, Splash, ResponsiveTable
// ============================================================

const INDEX_CSS = fs.readFileSync(
  path.resolve(__dirname, "../index.css"),
  "utf-8"
);

const TAILWIND_CONFIG = fs.readFileSync(
  path.resolve(__dirname, "../../tailwind.config.ts"),
  "utf-8"
);

const INDEX_HTML = fs.readFileSync(
  path.resolve(__dirname, "../../index.html"),
  "utf-8"
);

const SIDEBAR = fs.readFileSync(
  path.resolve(__dirname, "../components/layout/AppSidebar.tsx"),
  "utf-8"
);

const RESPONSIVE_TABLE = fs.readFileSync(
  path.resolve(__dirname, "../components/common/ResponsiveTable.tsx"),
  "utf-8"
);

const COMMON_INDEX = fs.readFileSync(
  path.resolve(__dirname, "../components/common/index.ts"),
  "utf-8"
);

// ============================================================
// 1. MUTED-FOREGROUND CONTRAST (WCAG AA)
// ============================================================
describe("Melhoria 1: Contraste muted-foreground", () => {
  describe("Dark theme", () => {
    // Extract dark theme muted-foreground value (root block, not inside .light)
    const rootBlock = INDEX_CSS.split(".light")[0];

    it("muted-foreground deve ter luminosidade >= 68% no dark theme", () => {
      const match = rootBlock.match(/--muted-foreground:\s*([\d]+)\s+([\d]+)%\s+([\d]+)%/);
      expect(match).toBeTruthy();
      const lightness = parseInt(match![3]);
      expect(lightness).toBeGreaterThanOrEqual(68);
    });

    it("muted-foreground dark deve usar hue ~215", () => {
      const match = rootBlock.match(/--muted-foreground:\s*([\d]+)/);
      expect(match).toBeTruthy();
      const hue = parseInt(match![1]);
      expect(hue).toBeGreaterThanOrEqual(210);
      expect(hue).toBeLessThanOrEqual(220);
    });

    it("high-contrast-muted-foreground deve ser mais claro que muted-foreground", () => {
      const mutedMatch = rootBlock.match(/--muted-foreground:\s*[\d]+\s+[\d]+%\s+([\d]+)%/);
      const hcMatch = rootBlock.match(/--high-contrast-muted-foreground:\s*[\d]+\s+[\d]+%\s+([\d]+)%/);
      expect(mutedMatch).toBeTruthy();
      expect(hcMatch).toBeTruthy();
      expect(parseInt(hcMatch![1])).toBeGreaterThan(parseInt(mutedMatch![1]));
    });
  });

  describe("Light theme", () => {
    const lightBlock = INDEX_CSS.split(".light")[1]?.split("}")[0] || "";

    it("muted-foreground deve ter luminosidade <= 42% no light theme", () => {
      const match = lightBlock.match(/--muted-foreground:\s*([\d]+)\s+([\d]+)%\s+([\d]+)%/);
      expect(match).toBeTruthy();
      const lightness = parseInt(match![3]);
      expect(lightness).toBeLessThanOrEqual(42);
    });

    it("muted-foreground light deve ter saturação adequada", () => {
      const match = lightBlock.match(/--muted-foreground:\s*[\d]+\s+([\d]+)%/);
      expect(match).toBeTruthy();
      const saturation = parseInt(match![1]);
      expect(saturation).toBeGreaterThanOrEqual(10);
    });
  });

  it("high contrast mode deve aplicar variável correta", () => {
    expect(INDEX_CSS).toContain(".high-contrast {");
    expect(INDEX_CSS).toContain("--muted-foreground: var(--high-contrast-muted-foreground)");
  });
});

// ============================================================
// 2. CARD ELEVATION SYSTEM
// ============================================================
describe("Melhoria 2: Sistema de Elevação de Cards", () => {
  describe("CSS classes existem", () => {
    it("card-flat classe existe", () => {
      expect(INDEX_CSS).toContain(".card-flat");
    });

    it("card-base classe existe", () => {
      expect(INDEX_CSS).toContain(".card-base");
    });

    it("card-raised classe existe", () => {
      expect(INDEX_CSS).toContain(".card-raised");
    });

    it("card-raised:hover classe existe", () => {
      expect(INDEX_CSS).toContain(".card-raised:hover");
    });

    it("card-prominent classe existe", () => {
      expect(INDEX_CSS).toContain(".card-prominent");
    });

    it("card-prominent:hover classe existe", () => {
      expect(INDEX_CSS).toContain(".card-prominent:hover");
    });

    it("card-elevated classe existe", () => {
      expect(INDEX_CSS).toContain(".card-elevated");
    });

    it("card-interactive classe existe", () => {
      expect(INDEX_CSS).toContain(".card-interactive");
    });

    it("glass-card classe existe", () => {
      expect(INDEX_CSS).toContain(".glass-card");
    });

    it("stat-card classe existe", () => {
      expect(INDEX_CSS).toContain(".stat-card");
    });
  });

  describe("Hierarquia de elevação correta", () => {
    it("card-flat NÃO deve ter box-shadow", () => {
      // card-flat should only have transition-colors, no shadow
      const flatSection = INDEX_CSS.split(".card-flat")[1]?.split("}")[0] || "";
      expect(flatSection).not.toContain("shadow");
    });

    it("card-base deve usar shadow-xs", () => {
      const baseSection = INDEX_CSS.split(".card-base")[1]?.split("}")[0] || "";
      expect(baseSection).toContain("shadow-xs");
    });

    it("card-raised deve usar shadow-md", () => {
      const raisedSection = INDEX_CSS.split(".card-raised")[1]?.split("}")[0] || "";
      expect(raisedSection).toContain("shadow-md");
    });

    it("card-prominent deve usar shadow-lg", () => {
      const prominentSection = INDEX_CSS.split(".card-prominent")[1]?.split("}")[0] || "";
      expect(prominentSection).toContain("shadow-lg");
    });

    it("card-prominent deve ter borda primary", () => {
      const prominentSection = INDEX_CSS.split(".card-prominent")[1]?.split("}")[0] || "";
      expect(prominentSection).toContain("primary");
    });
  });

  describe("Tokens de sombra definidos", () => {
    it("shadow-xs está definido no root", () => {
      expect(INDEX_CSS).toContain("--shadow-xs:");
    });

    it("shadow-sm está definido no root", () => {
      expect(INDEX_CSS).toContain("--shadow-sm:");
    });

    it("shadow-md está definido no root", () => {
      expect(INDEX_CSS).toContain("--shadow-md:");
    });

    it("shadow-lg está definido no root", () => {
      expect(INDEX_CSS).toContain("--shadow-lg:");
    });

    it("shadow-xl está definido no root", () => {
      expect(INDEX_CSS).toContain("--shadow-xl:");
    });

    it("shadow-glow-primary está definido", () => {
      expect(INDEX_CSS).toContain("--shadow-glow-primary:");
    });

    it("shadow-glow-success está definido", () => {
      expect(INDEX_CSS).toContain("--shadow-glow-success:");
    });
  });

  describe("Tailwind config inclui sombras", () => {
    it("boxShadow xs está no tailwind config", () => {
      expect(TAILWIND_CONFIG).toContain("xs:");
    });

    it("boxShadow glow-primary está no tailwind config", () => {
      expect(TAILWIND_CONFIG).toContain('"glow-primary"');
    });

    it("boxShadow elevated está no tailwind config", () => {
      expect(TAILWIND_CONFIG).toContain("elevated:");
    });
  });
});

// ============================================================
// 3. SIDEBAR ACCORDION EXCLUSIVO
// ============================================================
describe("Melhoria 3: Sidebar Accordion Exclusivo", () => {
  describe("Comportamento de estado único", () => {
    it("usa openSection (singular) ao invés de openSections (plural)", () => {
      expect(SIDEBAR).toContain("openSection");
      expect(SIDEBAR).not.toContain("openSections");
    });

    it("toggleSection alterna um único ID", () => {
      expect(SIDEBAR).toContain("setOpenSection");
    });

    it("Collapsible open compara com openSection ===", () => {
      expect(SIDEBAR).toContain("openSection === section.id");
    });

    it("ChevronDown rotação usa openSection ===", () => {
      const chevronMatch = SIDEBAR.match(/openSection === section\.id && "rotate-180"/);
      expect(chevronMatch).toBeTruthy();
    });
  });

  describe("Detecção automática de seção ativa", () => {
    it("getActiveSection função existe", () => {
      expect(SIDEBAR).toContain("getActiveSection");
    });

    it("getActiveSection verifica location.pathname", () => {
      expect(SIDEBAR).toContain("location.pathname");
    });

    it("fallback para 'overview' quando nenhuma rota bate", () => {
      expect(SIDEBAR).toContain('"overview"');
    });
  });

  describe("Indicador de item ativo (pill)", () => {
    it("active indicator pill existe", () => {
      expect(SIDEBAR).toContain("Active indicator pill");
    });

    it("pill usa rounded-r-full", () => {
      expect(SIDEBAR).toContain("rounded-r-full");
    });

    it("pill é condicionado a isActive e !collapsed", () => {
      expect(SIDEBAR).toContain("isActive(item.url) && !collapsed");
    });
  });

  describe("Badge de contagem de itens", () => {
    it("exibe section.items.length", () => {
      expect(SIDEBAR).toContain("section.items.length");
    });

    it("usa estilo tabular-nums", () => {
      expect(SIDEBAR).toContain("tabular-nums");
    });
  });

  describe("Seções de menu definidas", () => {
    it("possui seção overview", () => {
      expect(SIDEBAR).toContain('id: "overview"');
    });

    it("possui seção finance", () => {
      expect(SIDEBAR).toContain('id: "finance"');
    });

    it("possui seção operations", () => {
      expect(SIDEBAR).toContain('id: "operations"');
    });

    it("possui seção network", () => {
      expect(SIDEBAR).toContain('id: "network"');
    });

    it("possui seção entities", () => {
      expect(SIDEBAR).toContain('id: "entities"');
    });
  });

  describe("Scrollbar limpo", () => {
    it("usa scrollbar-none na nav", () => {
      expect(SIDEBAR).toContain("scrollbar-none");
    });
  });

  describe("Prefetch de rotas", () => {
    it("onMouseEnter chama prefetch", () => {
      expect(SIDEBAR).toContain("onMouseEnter={() => prefetch(item.url)}");
    });
  });

  describe("Componentes auxiliares", () => {
    it("usa Collapsible do radix", () => {
      expect(SIDEBAR).toContain("Collapsible");
    });

    it("usa CollapsibleContent", () => {
      expect(SIDEBAR).toContain("CollapsibleContent");
    });

    it("usa CollapsibleTrigger", () => {
      expect(SIDEBAR).toContain("CollapsibleTrigger");
    });

    it("usa NavLink do react-router", () => {
      expect(SIDEBAR).toContain("NavLink");
    });
  });

  describe("Seção de gamificação", () => {
    it("seção gamificação existe", () => {
      expect(SIDEBAR).toContain("Gamificação");
    });

    it("items de ranking", () => {
      expect(SIDEBAR).toContain('"Ranking"');
    });

    it("items de conquistas", () => {
      expect(SIDEBAR).toContain('"Conquistas"');
    });
  });

  describe("Seção admin condicionada", () => {
    it("admin section condicionada a isAdmin", () => {
      expect(SIDEBAR).toContain("{isAdmin &&");
    });

    it("contém itens de segurança", () => {
      expect(SIDEBAR).toContain('"Segurança"');
    });

    it("contém audit trail", () => {
      expect(SIDEBAR).toContain('"Audit Trail"');
    });
  });

  describe("Assistente IA", () => {
    it("AIAssistant é lazy-loaded", () => {
      expect(SIDEBAR).toContain('lazy(() => import("@/components/ai/AIAssistant")');
    });

    it("usa Sheet para o assistente", () => {
      expect(SIDEBAR).toContain("SheetContent");
    });
  });

  describe("Collapse toggle", () => {
    it("botão de collapse existe", () => {
      expect(SIDEBAR).toContain("setCollapsed(!collapsed)");
    });

    it("usa ChevronRight/Left para indicar direção", () => {
      expect(SIDEBAR).toContain("ChevronRight");
      expect(SIDEBAR).toContain("ChevronLeft");
    });
  });
});

// ============================================================
// 4. BRANDED SPLASH SCREEN
// ============================================================
describe("Melhoria 4: Branded Splash Screen", () => {
  describe("Estrutura HTML", () => {
    it("splash-screen div existe no index.html", () => {
      expect(INDEX_HTML).toContain('id="splash-screen"');
    });

    it("está dentro do div#root", () => {
      const rootStart = INDEX_HTML.indexOf('id="root"');
      const splashStart = INDEX_HTML.indexOf('id="splash-screen"');
      expect(splashStart).toBeGreaterThan(rootStart);
    });

    it("splash será automaticamente removido pelo React", () => {
      // React replaces innerHTML of #root, removing the splash
      expect(INDEX_HTML).toContain('id="root"');
    });
  });

  describe("Branding", () => {
    it("contém nome LogiFlow", () => {
      const splashSection = INDEX_HTML.split("splash-screen")[1] || "";
      expect(splashSection).toContain("LogiFlow");
    });

    it("contém subtítulo Logística Gamificada", () => {
      expect(INDEX_HTML).toContain("Logística Gamificada");
    });

    it("contém SVG de ícone (box)", () => {
      const splashSection = INDEX_HTML.split("splash-screen")[1] || "";
      expect(splashSection).toContain("<svg");
    });
  });

  describe("Visual do splash", () => {
    it("usa cor de fundo dark (hsl 220 20% 7%)", () => {
      expect(INDEX_HTML).toContain("hsl(220 20% 7%)");
    });

    it("usa gradiente primário (laranja)", () => {
      expect(INDEX_HTML).toContain("hsl(25 95% 53%)");
    });

    it("usa fonte Outfit", () => {
      expect(INDEX_HTML).toContain("Outfit");
    });

    it("centralizado verticalmente (min-height: 100vh)", () => {
      expect(INDEX_HTML).toContain("min-height: 100vh");
    });

    it("usa flexbox centrado", () => {
      expect(INDEX_HTML).toContain("justify-content: center");
      expect(INDEX_HTML).toContain("align-items: center");
    });
  });

  describe("Animações do splash", () => {
    it("keyframe splash-pulse existe", () => {
      expect(INDEX_HTML).toContain("@keyframes splash-pulse");
    });

    it("keyframe splash-loading existe", () => {
      expect(INDEX_HTML).toContain("@keyframes splash-loading");
    });

    it("barra de carregamento animada existe", () => {
      expect(INDEX_HTML).toContain("splash-loading");
    });

    it("ícone tem animação de pulse", () => {
      expect(INDEX_HTML).toContain("splash-pulse");
    });
  });

  describe("Acessibilidade do splash", () => {
    it("usa cores de texto legíveis", () => {
      expect(INDEX_HTML).toContain("hsl(210 40% 98%)");
    });

    it("barra de loading tem border-radius", () => {
      const loadingSection = INDEX_HTML.split("splash-loading")[0]?.slice(-200) || "";
      expect(loadingSection).toContain("border-radius");
    });
  });
});

// ============================================================
// 5. RESPONSIVE TABLE COMPONENT
// ============================================================
describe("Melhoria 5: ResponsiveTable Component", () => {
  describe("Interface de Column", () => {
    it("suporta propriedade key", () => {
      expect(RESPONSIVE_TABLE).toContain("key: string");
    });

    it("suporta propriedade header", () => {
      expect(RESPONSIVE_TABLE).toContain("header: string");
    });

    it("suporta propriedade priority (1 | 2 | 3)", () => {
      expect(RESPONSIVE_TABLE).toContain("priority?: 1 | 2 | 3");
    });

    it("suporta propriedade render", () => {
      expect(RESPONSIVE_TABLE).toContain("render: (item: T) => ReactNode");
    });

    it("suporta propriedade mobileLabel", () => {
      expect(RESPONSIVE_TABLE).toContain("mobileLabel?: string");
    });
  });

  describe("Props do componente", () => {
    it("aceita data array", () => {
      expect(RESPONSIVE_TABLE).toContain("data: T[]");
    });

    it("aceita columns array", () => {
      expect(RESPONSIVE_TABLE).toContain("columns: Column<T>[]");
    });

    it("aceita keyExtractor", () => {
      expect(RESPONSIVE_TABLE).toContain("keyExtractor: (item: T) => string");
    });

    it("aceita onRowClick opcional", () => {
      expect(RESPONSIVE_TABLE).toContain("onRowClick?: (item: T) => void");
    });

    it("aceita className opcional", () => {
      expect(RESPONSIVE_TABLE).toContain("className?: string");
    });

    it("aceita emptyState opcional", () => {
      expect(RESPONSIVE_TABLE).toContain("emptyState?: ReactNode");
    });
  });

  describe("Responsividade mobile", () => {
    it("usa useMediaQuery para detectar mobile", () => {
      expect(RESPONSIVE_TABLE).toContain("useMediaQuery");
    });

    it("breakpoint é 768px", () => {
      expect(RESPONSIVE_TABLE).toContain("max-width: 768px");
    });

    it("filtra colunas por priority === 1 no mobile", () => {
      expect(RESPONSIVE_TABLE).toContain("priority === 1");
    });

    it("colunas priority 2 aparecem como seção secundária", () => {
      expect(RESPONSIVE_TABLE).toContain("priority === 2");
    });

    it("mobile usa card layout (card-base)", () => {
      expect(RESPONSIVE_TABLE).toContain("card-base");
    });
  });

  describe("Desktop table", () => {
    it("usa componentes Table do shadcn", () => {
      expect(RESPONSIVE_TABLE).toContain("Table");
      expect(RESPONSIVE_TABLE).toContain("TableBody");
      expect(RESPONSIVE_TABLE).toContain("TableCell");
      expect(RESPONSIVE_TABLE).toContain("TableHead");
      expect(RESPONSIVE_TABLE).toContain("TableHeader");
      expect(RESPONSIVE_TABLE).toContain("TableRow");
    });

    it("desktop mostra colunas priority 1 e 2", () => {
      expect(RESPONSIVE_TABLE).toContain("priority <= 2");
    });

    it("header com estilo uppercase tracking-wider", () => {
      expect(RESPONSIVE_TABLE).toContain("uppercase tracking-wider");
    });

    it("header com fundo muted/50", () => {
      expect(RESPONSIVE_TABLE).toContain("bg-muted/50");
    });
  });

  describe("Estados e interatividade", () => {
    it("suporta empty state", () => {
      expect(RESPONSIVE_TABLE).toContain("data.length === 0 && emptyState");
    });

    it("rows são clicáveis quando onRowClick fornecido", () => {
      expect(RESPONSIVE_TABLE).toContain("onRowClick && \"cursor-pointer");
    });

    it("cards mobile têm transição de scale no active", () => {
      expect(RESPONSIVE_TABLE).toContain("active:scale-[0.99]");
    });
  });

  describe("Exportação", () => {
    it("exporta ResponsiveTable no common/index.ts", () => {
      expect(COMMON_INDEX).toContain("ResponsiveTable");
    });

    it("export path correto", () => {
      expect(COMMON_INDEX).toContain("'./ResponsiveTable'");
    });
  });
});

// ============================================================
// 6. DESIGN SYSTEM - TOKENS E VARIÁVEIS
// ============================================================
describe("Melhoria 6: Design System Tokens Integridade", () => {
  describe("Fontes", () => {
    it("font-sans definido", () => {
      expect(INDEX_CSS).toContain("--font-sans:");
    });

    it("font-display definido", () => {
      expect(INDEX_CSS).toContain("--font-display:");
    });

    it("Plus Jakarta Sans como font-sans", () => {
      expect(INDEX_CSS).toContain("Plus Jakarta Sans");
    });

    it("Outfit como font-display", () => {
      expect(INDEX_CSS).toContain("Outfit");
    });

    it("tailwind config registra font families", () => {
      expect(TAILWIND_CONFIG).toContain("fontFamily");
      expect(TAILWIND_CONFIG).toContain("var(--font-sans)");
      expect(TAILWIND_CONFIG).toContain("var(--font-display)");
    });
  });

  describe("Cores primárias", () => {
    it("--primary definido no dark theme", () => {
      expect(INDEX_CSS).toContain("--primary: 25 95%");
    });

    it("--primary-foreground definido", () => {
      expect(INDEX_CSS).toContain("--primary-foreground:");
    });

    it("--primary-glow definido", () => {
      expect(INDEX_CSS).toContain("--primary-glow:");
    });
  });

  describe("Estados semânticos", () => {
    const states = ["success", "warning", "info", "destructive"];
    states.forEach((state) => {
      it(`--${state} está definido`, () => {
        expect(INDEX_CSS).toContain(`--${state}:`);
      });

      it(`--${state}-foreground está definido`, () => {
        expect(INDEX_CSS).toContain(`--${state}-foreground:`);
      });
    });
  });

  describe("Gamificação tokens", () => {
    const tokens = ["xp", "coins", "streak"];
    tokens.forEach((token) => {
      it(`--${token} está definido`, () => {
        expect(INDEX_CSS).toContain(`--${token}:`);
      });

      it(`--${token}-foreground está definido`, () => {
        expect(INDEX_CSS).toContain(`--${token}-foreground:`);
      });

      it(`${token} registrado no tailwind config`, () => {
        expect(TAILWIND_CONFIG).toContain(`var(--${token})`);
      });
    });
  });

  describe("Logística tokens", () => {
    const freight = ["freight-internal", "freight-supplier", "freight-customer", "freight-pending"];
    freight.forEach((token) => {
      it(`--${token} está definido`, () => {
        expect(INDEX_CSS).toContain(`--${token}:`);
      });
    });
  });

  describe("Rank tokens", () => {
    const ranks = ["rank-gold", "rank-silver", "rank-bronze"];
    ranks.forEach((rank) => {
      it(`--${rank} está definido`, () => {
        expect(INDEX_CSS).toContain(`--${rank}:`);
      });

      it(`--${rank}-foreground está definido`, () => {
        expect(INDEX_CSS).toContain(`--${rank}-foreground:`);
      });
    });
  });

  describe("Gradientes", () => {
    const gradients = [
      "gradient-primary",
      "gradient-secondary",
      "gradient-success",
      "gradient-xp",
      "gradient-gold",
      "gradient-surface",
    ];
    gradients.forEach((g) => {
      it(`--${g} está definido`, () => {
        expect(INDEX_CSS).toContain(`--${g}:`);
      });
    });
  });

  describe("Chart colors", () => {
    for (let i = 1; i <= 5; i++) {
      it(`--chart-${i} está definido`, () => {
        expect(INDEX_CSS).toContain(`--chart-${i}:`);
      });
    }
  });

  describe("Spacing tokens", () => {
    const spacings = ["spacing-card", "spacing-card-sm", "spacing-card-lg", "spacing-section", "spacing-section-lg"];
    spacings.forEach((s) => {
      it(`--${s} está definido`, () => {
        expect(INDEX_CSS).toContain(`--${s}:`);
      });
    });
  });

  describe("Z-index scale", () => {
    const layers = ["z-base", "z-dropdown", "z-sticky", "z-fixed", "z-modal-backdrop", "z-modal", "z-popover", "z-tooltip", "z-toast", "z-max"];
    layers.forEach((z) => {
      it(`--${z} está definido`, () => {
        expect(INDEX_CSS).toContain(`--${z}:`);
      });
    });
  });

  describe("Glass tokens", () => {
    it("--glass-bg está definido", () => {
      expect(INDEX_CSS).toContain("--glass-bg:");
    });

    it("--glass-border está definido", () => {
      expect(INDEX_CSS).toContain("--glass-border:");
    });
  });

  describe("Sidebar tokens", () => {
    const sidebarTokens = [
      "sidebar-background",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ];
    sidebarTokens.forEach((t) => {
      it(`--${t} está definido`, () => {
        expect(INDEX_CSS).toContain(`--${t}:`);
      });
    });
  });
});

// ============================================================
// 7. ACESSIBILIDADE
// ============================================================
describe("Melhoria 7: Acessibilidade", () => {
  describe("Focus indicators", () => {
    it("focus-visible usa ring-2 ring-primary", () => {
      expect(INDEX_CSS).toContain("ring-2 ring-primary");
    });

    it("ring-offset usa background", () => {
      expect(INDEX_CSS).toContain("ring-offset-background");
    });
  });

  describe("Touch targets", () => {
    it("botões têm min-height 44px em mobile", () => {
      expect(INDEX_CSS).toContain("min-height: 44px");
    });

    it("min-width 44px para touch targets", () => {
      expect(INDEX_CSS).toContain("min-width: 44px");
    });
  });

  describe("Reduced motion", () => {
    it("prefers-reduced-motion media query existe", () => {
      expect(INDEX_CSS).toContain("prefers-reduced-motion: reduce");
    });

    it("reduced-motion classe manual existe", () => {
      expect(INDEX_CSS).toContain(".reduced-motion");
    });

    it("animation-duration forçada para 0.01ms", () => {
      expect(INDEX_CSS).toContain("animation-duration: 0.01ms !important");
    });
  });

  describe("Large text mode", () => {
    it("large-text classe existe", () => {
      expect(INDEX_CSS).toContain(".large-text");
    });

    it("font-size scale de 1.15", () => {
      expect(INDEX_CSS).toContain("calc(1rem * 1.15)");
    });
  });

  describe("Safe area insets", () => {
    it("safe-area-inset-top existe", () => {
      expect(INDEX_CSS).toContain("safe-area-inset-top");
    });

    it("safe-area-inset-bottom existe", () => {
      expect(INDEX_CSS).toContain("safe-area-inset-bottom");
    });
  });

  describe("Skip links", () => {
    it("skip-link classe existe", () => {
      expect(INDEX_CSS).toContain(".skip-link");
    });
  });

  describe("Selection colors", () => {
    it("::selection usa primary/30", () => {
      expect(INDEX_CSS).toContain("::selection");
      expect(INDEX_CSS).toContain("bg-primary/30");
    });
  });

  describe("Font accessibility variable", () => {
    it("--accessibility-font-scale existe", () => {
      expect(INDEX_CSS).toContain("--accessibility-font-scale:");
    });
  });
});

// ============================================================
// 8. ANIMAÇÕES E KEYFRAMES
// ============================================================
describe("Melhoria 8: Animações no Design System", () => {
  const expectedKeyframes = [
    "accordion-down",
    "accordion-up",
    "pulse-ring",
    "bounce-in",
    "slide-up",
    "slide-down",
    "slide-left",
    "slide-right",
    "fade-in",
    "fade-out",
    "scale-in",
    "shimmer",
    "float",
    "glow-pulse",
    "wiggle",
    "pop",
    "count-up",
    "shake",
    "spin-slow",
    "ripple",
    "slide-in-right",
    "slide-out-right",
    "gradient-x",
    "gradient-y",
    "sparkle",
    "ping-slow",
  ];

  expectedKeyframes.forEach((kf) => {
    it(`keyframe '${kf}' registrado no tailwind config`, () => {
      // Some keys use quotes, some don't — check for the key name followed by colon or in quotes
      const hasKey = TAILWIND_CONFIG.includes(`"${kf}"`) || TAILWIND_CONFIG.includes(`${kf}:`);
      expect(hasKey).toBe(true);
    });
  });

  describe("Transition utilities", () => {
    it("transitionTimingFunction bounce-in existe", () => {
      expect(TAILWIND_CONFIG).toContain('"bounce-in"');
    });

    it("transitionTimingFunction smooth existe", () => {
      expect(TAILWIND_CONFIG).toContain("smooth:");
    });

    it("transitionTimingFunction spring existe", () => {
      expect(TAILWIND_CONFIG).toContain("spring:");
    });
  });
});

// ============================================================
// 9. UTILITY CLASSES
// ============================================================
describe("Melhoria 9: Utility Classes", () => {
  describe("Hover effects", () => {
    it("hover-lift existe", () => {
      expect(INDEX_CSS).toContain(".hover-lift");
    });

    it("hover-lift-sm existe", () => {
      expect(INDEX_CSS).toContain(".hover-lift-sm");
    });

    it("hover-scale existe", () => {
      expect(INDEX_CSS).toContain(".hover-scale");
    });

    it("hover-glow existe", () => {
      expect(INDEX_CSS).toContain(".hover-glow");
    });

    it("press-scale existe", () => {
      expect(INDEX_CSS).toContain(".press-scale");
    });
  });

  describe("Typography utilities", () => {
    it("text-display existe", () => {
      expect(INDEX_CSS).toContain(".text-display");
    });

    it("text-display-xl existe", () => {
      expect(INDEX_CSS).toContain(".text-display-xl");
    });

    it("gradient-text existe", () => {
      expect(INDEX_CSS).toContain(".gradient-text");
    });
  });

  describe("Responsive utilities", () => {
    it("text-responsive-sm existe", () => {
      expect(INDEX_CSS).toContain(".text-responsive-sm");
    });

    it("text-responsive-base existe", () => {
      expect(INDEX_CSS).toContain(".text-responsive-base");
    });

    it("text-responsive-lg existe", () => {
      expect(INDEX_CSS).toContain(".text-responsive-lg");
    });

    it("grid-responsive-cards existe", () => {
      expect(INDEX_CSS).toContain(".grid-responsive-cards");
    });

    it("grid-responsive-stats existe", () => {
      expect(INDEX_CSS).toContain(".grid-responsive-stats");
    });

    it("container-responsive existe", () => {
      expect(INDEX_CSS).toContain(".container-responsive");
    });

    it("p-responsive existe", () => {
      expect(INDEX_CSS).toContain(".p-responsive");
    });

    it("gap-responsive existe", () => {
      expect(INDEX_CSS).toContain(".gap-responsive");
    });
  });

  describe("Scrollbar utilities", () => {
    it("scrollbar-none classe existe", () => {
      expect(INDEX_CSS).toContain(".scrollbar-none");
    });

    it("scrollbar styling para webkit", () => {
      expect(INDEX_CSS).toContain("::-webkit-scrollbar");
    });

    it("scrollbar-width: thin para Firefox", () => {
      expect(INDEX_CSS).toContain("scrollbar-width: thin");
    });
  });

  describe("XP/Rank utilities", () => {
    it("xp-bar existe", () => {
      expect(INDEX_CSS).toContain(".xp-bar");
    });

    it("xp-bar-fill existe", () => {
      expect(INDEX_CSS).toContain(".xp-bar-fill");
    });

    it("rank-gold existe", () => {
      expect(INDEX_CSS).toContain(".rank-gold");
    });

    it("rank-silver existe", () => {
      expect(INDEX_CSS).toContain(".rank-silver");
    });

    it("rank-bronze existe", () => {
      expect(INDEX_CSS).toContain(".rank-bronze");
    });
  });
});

// ============================================================
// 10. LIGHT/DARK THEME PARITY
// ============================================================
describe("Melhoria 10: Paridade Light/Dark Theme", () => {
  const lightBlock = INDEX_CSS.split(".light")[1]?.split(":root")[0] || INDEX_CSS.split(".light")[1] || "";

  const requiredLightTokens = [
    "--background:",
    "--foreground:",
    "--card:",
    "--card-foreground:",
    "--primary:",
    "--primary-foreground:",
    "--secondary:",
    "--secondary-foreground:",
    "--muted:",
    "--muted-foreground:",
    "--accent:",
    "--accent-foreground:",
    "--destructive:",
    "--border:",
    "--input:",
    "--ring:",
    "--success:",
    "--warning:",
    "--info:",
    "--elevated:",
    "--glass-bg:",
    "--glass-border:",
    "--sidebar-background:",
    "--sidebar-foreground:",
  ];

  requiredLightTokens.forEach((token) => {
    it(`light theme define ${token.replace(":", "")}`, () => {
      expect(lightBlock).toContain(token);
    });
  });

  describe("Sombras são ajustadas para light theme", () => {
    it("shadow-xs existe no light theme", () => {
      expect(lightBlock).toContain("--shadow-xs:");
    });

    it("shadow-sm existe no light theme", () => {
      expect(lightBlock).toContain("--shadow-sm:");
    });

    it("sombras light são mais sutis (opacidade menor)", () => {
      // Light shadows should use lower opacity values
      const lightShadow = lightBlock.match(/--shadow-sm:.*?;/)?.[0] || "";
      expect(lightShadow).toContain("0.1");
    });
  });
});

// ============================================================
// 11. PRINT STYLES
// ============================================================
describe("Melhoria 11: Print Styles", () => {
  it("@media print existe", () => {
    expect(INDEX_CSS).toContain("@media print");
  });

  it("print-labels classe é visível na impressão", () => {
    expect(INDEX_CSS).toContain(".print-labels");
  });

  it("tamanho de página 10x15cm definido", () => {
    expect(INDEX_CSS).toContain("size: 10cm 15cm");
  });
});

// ============================================================
// 12. SEO E META TAGS
// ============================================================
describe("Melhoria 12: SEO e Meta Tags", () => {
  it("lang=pt-BR definido", () => {
    expect(INDEX_HTML).toContain('lang="pt-BR"');
  });

  it("viewport meta tag presente", () => {
    expect(INDEX_HTML).toContain("viewport");
  });

  it("viewport-fit=cover para notch", () => {
    expect(INDEX_HTML).toContain("viewport-fit=cover");
  });

  it("title tag presente", () => {
    expect(INDEX_HTML).toContain("<title>");
  });

  it("meta description presente", () => {
    expect(INDEX_HTML).toContain('name="description"');
  });

  it("Open Graph tags presentes", () => {
    expect(INDEX_HTML).toContain('property="og:title"');
    expect(INDEX_HTML).toContain('property="og:description"');
    expect(INDEX_HTML).toContain('property="og:type"');
  });

  it("Twitter Card tags presentes", () => {
    expect(INDEX_HTML).toContain('name="twitter:card"');
  });

  it("canonical link presente", () => {
    expect(INDEX_HTML).toContain('rel="canonical"');
  });

  it("PWA manifest link presente", () => {
    expect(INDEX_HTML).toContain('rel="manifest"');
  });

  it("theme-color meta tag presente", () => {
    expect(INDEX_HTML).toContain('name="theme-color"');
  });

  it("apple-mobile-web-app-capable presente", () => {
    expect(INDEX_HTML).toContain("apple-mobile-web-app-capable");
  });

  it("dns-prefetch para backend", () => {
    expect(INDEX_HTML).toContain("dns-prefetch");
  });

  it("preconnect para fonts.googleapis", () => {
    expect(INDEX_HTML).toContain('rel="preconnect"');
    expect(INDEX_HTML).toContain("fonts.googleapis.com");
  });

  it("font preload strategy", () => {
    expect(INDEX_HTML).toContain('rel="preload"');
  });
});

// ============================================================
// 13. TAILWIND CONFIG COMPLETENESS
// ============================================================
describe("Melhoria 13: Tailwind Config Completude", () => {
  it("darkMode configurado como class", () => {
    expect(TAILWIND_CONFIG).toContain('darkMode: ["class"]');
  });

  it("borderRadius custom definidos", () => {
    expect(TAILWIND_CONFIG).toContain("borderRadius:");
    expect(TAILWIND_CONFIG).toContain('"2xl"');
    expect(TAILWIND_CONFIG).toContain('"3xl"');
  });

  it("spacing custom definidos", () => {
    expect(TAILWIND_CONFIG).toContain("card:");
    expect(TAILWIND_CONFIG).toContain('"card-sm"');
    expect(TAILWIND_CONFIG).toContain('"card-lg"');
    expect(TAILWIND_CONFIG).toContain("section:");
    expect(TAILWIND_CONFIG).toContain('"section-lg"');
  });

  it("tailwindcss-animate plugin registrado", () => {
    expect(TAILWIND_CONFIG).toContain("tailwindcss-animate");
  });

  it("container center e padding configurados", () => {
    expect(TAILWIND_CONFIG).toContain("center: true");
    expect(TAILWIND_CONFIG).toContain('"2rem"');
  });

  it("2xl breakpoint configurado", () => {
    expect(TAILWIND_CONFIG).toContain('"2xl": "1400px"');
  });
});
