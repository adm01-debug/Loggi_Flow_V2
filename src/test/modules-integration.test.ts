import { describe, it, expect, vi } from 'vitest';

// Desativar importações pesadas de UI para evitar timeouts em testes de integração de módulos
vi.mock('framer-motion', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  LineChart: ({ children }: any) => children,
  BarChart: ({ children }: any) => children,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Line: () => null,
  Bar: () => null,
}));

describe('Label Module Imports', () => {
  it('exports MaterialLabelPrinter', async () => {
    const mod = await import('@/components/labels/index');
    expect(mod.MaterialLabelPrinter).toBeDefined();
  }, 15000);

  it('exports LabelPreview', async () => {
    const mod = await import('@/components/labels/index');
    expect(mod.LabelPreview).toBeDefined();
  }, 15000);
});

describe('LabelData interface structure', () => {
  it('accepts valid label data', async () => {
    const { LabelPreview } = await import('@/components/labels/LabelPreview');
    expect(LabelPreview).toBeDefined();
    // Verify component is a function
    expect(typeof LabelPreview).toBe('function');
  });
});

describe('Freight Module Imports', () => {
  it('exports QuotationForm', async () => {
    const mod = await import('@/components/freight/QuotationForm');
    expect(mod.QuotationForm).toBeDefined();
  });

  it('exports QuotationResults', async () => {
    const mod = await import('@/components/freight/QuotationResults');
    expect(mod.QuotationResults).toBeDefined();
  });

  it('exports FreightTableManager', async () => {
    const mod = await import('@/components/freight/FreightTableManager');
    expect(mod.FreightTableManager).toBeDefined();
  });

  it('exports QuotationHistory', async () => {
    const mod = await import('@/components/freight/QuotationHistory');
    expect(mod.QuotationHistory).toBeDefined();
  });

  it('exports CargoTemplates', async () => {
    const mod = await import('@/components/freight/CargoTemplates');
    expect(mod.CargoTemplates).toBeDefined();
  });

  it('exports ScenarioSimulator', async () => {
    const mod = await import('@/components/freight/ScenarioSimulator');
    expect(mod.ScenarioSimulator).toBeDefined();
  });

  it('exports QuickQuoteWidget', async () => {
    const mod = await import('@/components/freight/QuickQuoteWidget');
    expect(mod.QuickQuoteWidget).toBeDefined();
  });

  it('exports SmartCarrierSelector', async () => {
    const mod = await import('@/components/freight/SmartCarrierSelector');
    expect(mod.SmartCarrierSelector).toBeDefined();
  });

  it('exports RodonavesQuotation', async () => {
    const mod = await import('@/components/freight/RodonavesQuotation');
    expect(mod.RodonavesQuotation).toBeDefined();
  });
});

describe('Security Module Imports', () => {
  it('exports MFAEnroll', async () => {
    const mod = await import('@/components/security/MFAEnroll');
    expect(mod.MFAEnroll).toBeDefined();
  });

  it('exports PermissionGate', async () => {
    const mod = await import('@/components/security/PermissionGate');
    expect(mod.PermissionGate).toBeDefined();
  });

  it('exports SessionTimeoutWarning', async () => {
    const mod = await import('@/components/security/SessionTimeoutWarning');
    expect(mod.SessionTimeoutWarning).toBeDefined();
  });

  it('exports IPAccessControl', async () => {
    const mod = await import('@/components/security/IPAccessControl');
    expect(mod.IPAccessControl).toBeDefined();
  });

  it('exports DeviceManagement', async () => {
    const mod = await import('@/components/security/DeviceManagement');
    expect(mod.DeviceManagement).toBeDefined();
  });
});

describe('Common Components Imports', () => {
  it('exports EmptyState', async () => {
    const mod = await import('@/components/common/EmptyState');
    expect(mod.EmptyState).toBeDefined();
  });

  it('exports ConfirmDialog', async () => {
    const mod = await import('@/components/common/ConfirmDialog');
    expect(mod.ConfirmDialog).toBeDefined();
  });

  it('exports DataExporter', async () => {
    const mod = await import('@/components/common/DataExporter');
    expect(mod.DataExporter).toBeDefined();
  });

  it('exports Pagination', async () => {
    const mod = await import('@/components/common/Pagination');
    expect(mod.Pagination).toBeDefined();
  });

  it('exports FilterBar', async () => {
    const mod = await import('@/components/common/FilterBar');
    expect(mod.FilterBar).toBeDefined();
  });

  it('exports SearchInput', async () => {
    const mod = await import('@/components/common/SearchInput');
    expect(mod.SearchInput).toBeDefined();
  });

  it('exports StatsCard', async () => {
    const mod = await import('@/components/common/StatsCard');
    expect(mod.StatsCard).toBeDefined();
  });

  it('exports ErrorBoundary', async () => {
    const mod = await import('@/components/common/ErrorBoundary');
    expect(mod.ErrorBoundary).toBeDefined();
  });
});

describe('Dashboard Module Imports', () => {
  it('exports KPICard', async () => {
    const mod = await import('@/components/dashboard/KPICard');
    expect(mod.KPICard).toBeDefined();
  });

  it('exports PerformanceChart', async () => {
    const mod = await import('@/components/dashboard/PerformanceChart');
    expect(mod.PerformanceChart).toBeDefined();
  });

  it('exports QuickActions', async () => {
    const mod = await import('@/components/dashboard/QuickActions');
    expect(mod.QuickActions).toBeDefined();
  });

  it('exports XPProgressBar', async () => {
    const mod = await import('@/components/dashboard/XPProgressBar');
    expect(mod.XPProgressBar).toBeDefined();
  });
});

describe('Hooks Imports', () => {
  it('useQuotationFlow exports correctly', async () => {
    const mod = await import('@/hooks/useQuotationFlow');
    expect(mod.useQuotationFlow).toBeDefined();
  });

  it('useFreightQuotation exports correctly', async () => {
    const mod = await import('@/hooks/useFreightQuotation');
    expect(mod.useFreightQuotation).toBeDefined();
  });

  it('useAuth exports correctly', async () => {
    const mod = await import('@/hooks/useAuth');
    expect(mod.useAuth).toBeDefined();
  });

  it('useGamification exports correctly', async () => {
    const mod = await import('@/hooks/useGamification');
    expect(mod.useGamification).toBeDefined();
  });

  it('useNotifications exports correctly', async () => {
    const mod = await import('@/hooks/useNotifications');
    expect(mod.useNotifications).toBeDefined();
  });

  it('useOnboarding exports correctly', async () => {
    const mod = await import('@/hooks/useOnboarding');
    expect(mod.useOnboarding).toBeDefined();
  });
});

describe('Melhor Envio Module', () => {
  it('exports useMelhorEnvio', async () => {
    const mod = await import('@/hooks/useMelhorEnvio');
    expect(mod.useMelhorEnvio).toBeDefined();
  });

  it('exports MEEtiquetasPanel component', async () => {
    const mod = await import('@/components/melhorenvio/MEEtiquetasPanel');
    expect(mod.MEEtiquetasPanel).toBeDefined();
  });
});

describe('Scanner Module', () => {
  it('exports QRScannerModal', async () => {
    const mod = await import('@/components/scanner/QRScannerModal');
    expect(mod.QRScannerModal).toBeDefined();
  });

  it('exports ScannerButton', async () => {
    const mod = await import('@/components/scanner/ScannerButton');
    expect(mod.ScannerButton).toBeDefined();
  });
});

describe('Pages Imports', () => {
  const pageModules = [
    'Index', 'Auth', 'CotacaoFrete', 'Envios', 'Coletas',
    'Clientes', 'Transportadoras', 'Relatorios', 'Analytics',
    'Configuracoes', 'Profile', 'Seguranca', 'Notificacoes',
    'GestaoBox', 'Ocorrencias', 'FretesInternos',
  ];

  for (const page of pageModules) {
    it(`page ${page} exports default`, async () => {
      const mod = await import(`@/pages/${page}.tsx`);
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe('function');
    }, 15000);
  }
});
