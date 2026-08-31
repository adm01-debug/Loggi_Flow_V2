import { useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";

export interface WidgetConfig {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  category: "kpi" | "chart" | "list" | "action";
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: "kpi-pendentes",
    title: "Pendentes",
    description: "Coletas e entregas pendentes",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    category: "kpi",
  },
  {
    id: "kpi-transito",
    title: "Em Trânsito",
    description: "Itens em trânsito",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    category: "kpi",
  },
  {
    id: "kpi-finalizadas",
    title: "Finalizadas",
    description: "Itens finalizados com sucesso",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    category: "kpi",
  },
  {
    id: "kpi-problemas",
    title: "Problemas",
    description: "Ocorrências e divergências",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    category: "kpi",
  },
  {
    id: "chart-performance",
    title: "Gráfico de Performance",
    description: "Movimentação de coletas e entregas",
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 4, h: 3 },
    category: "chart",
  },
  {
    id: "alerts-panel",
    title: "Alertas",
    description: "Alertas e notificações recentes",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    category: "list",
  },
  {
    id: "transportadora-ranking",
    title: "Ranking Transportadoras",
    description: "Performance das transportadoras",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    category: "list",
  },
  {
    id: "quick-actions",
    title: "Ações Rápidas",
    description: "Atalhos para ações frequentes",
    defaultSize: { w: 12, h: 2 },
    minSize: { w: 6, h: 2 },
    category: "action",
  },
  {
    id: "xp-progress",
    title: "Progresso XP",
    description: "Seu nível e experiência",
    defaultSize: { w: 12, h: 2 },
    minSize: { w: 6, h: 1 },
    category: "kpi",
  },
  {
    id: "delay-prediction",
    title: "Previsões IA",
    description: "Previsão de atrasos com IA",
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 6, h: 3 },
    category: "chart",
  },
  {
    id: "intelligence-widget",
    title: "Inteligência Operacional",
    description: "Saúde operacional e otimizações IA",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 4 },
    category: "action",
  },
  {
    id: "logistics-map",
    title: "Mapa Logístico Nexus",
    description: "Monitoramento global de frota em tempo real",
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 6, h: 4 },
    category: "chart",
  },
];

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { i: "xp-progress", x: 0, y: 0, w: 12, h: 2 },
  { i: "logistics-map", x: 0, y: 2, w: 12, h: 6 },
  { i: "kpi-pendentes", x: 0, y: 8, w: 3, h: 2 },
  { i: "kpi-transito", x: 3, y: 8, w: 3, h: 2 },
  { i: "kpi-finalizadas", x: 6, y: 8, w: 3, h: 2 },
  { i: "kpi-problemas", x: 9, y: 8, w: 3, h: 2 },
  { i: "intelligence-widget", x: 0, y: 10, w: 6, h: 4 },
  { i: "alerts-panel", x: 6, y: 10, w: 6, h: 4 },
  { i: "chart-performance", x: 0, y: 14, w: 12, h: 4 },
  { i: "quick-actions", x: 0, y: 18, w: 12, h: 2 },
];

export function useDashboardWidgets() {
  const [layout, setLayout] = useLocalStorage<WidgetConfig[]>(
    "dashboard-layout",
    DEFAULT_LAYOUT,
  );
  const [activeWidgets, setActiveWidgets] = useLocalStorage<string[]>(
    "dashboard-active-widgets",
    DEFAULT_LAYOUT.map((w) => w.i),
  );
  const [isEditMode, setIsEditMode] = useState(false);

  const handleLayoutChange = useCallback(
    (newLayout: WidgetConfig[]) => {
      setLayout(newLayout);
    },
    [setLayout],
  );

  const addWidget = useCallback(
    (widgetId: string) => {
      if (activeWidgets.includes(widgetId)) return;

      const widgetDef = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
      if (!widgetDef) return;

      const maxY = layout.reduce(
        (max, item) => Math.max(max, item.y + item.h),
        0,
      );

      const newWidget: WidgetConfig = {
        i: widgetId,
        x: 0,
        y: maxY,
        w: widgetDef.defaultSize.w,
        h: widgetDef.defaultSize.h,
        minW: widgetDef.minSize?.w,
        minH: widgetDef.minSize?.h,
        maxW: widgetDef.maxSize?.w,
        maxH: widgetDef.maxSize?.h,
      };

      setLayout([...layout, newWidget]);
      setActiveWidgets([...activeWidgets, widgetId]);
    },
    [layout, activeWidgets, setLayout, setActiveWidgets],
  );

  const removeWidget = useCallback(
    (widgetId: string) => {
      setLayout(layout.filter((w) => w.i !== widgetId));
      setActiveWidgets(activeWidgets.filter((id) => id !== widgetId));
    },
    [layout, activeWidgets, setLayout, setActiveWidgets],
  );

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    setActiveWidgets(DEFAULT_LAYOUT.map((w) => w.i));
  }, [setLayout, setActiveWidgets]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const getAvailableWidgetsToAdd = useCallback(() => {
    return AVAILABLE_WIDGETS.filter((w) => !activeWidgets.includes(w.id));
  }, [activeWidgets]);

  return {
    layout,
    activeWidgets,
    isEditMode,
    handleLayoutChange,
    addWidget,
    removeWidget,
    resetLayout,
    toggleEditMode,
    getAvailableWidgetsToAdd,
    availableWidgets: AVAILABLE_WIDGETS,
  };
}
