import { useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";

export interface FavoriteMetric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  color: string;
  category: string;
}

export const AVAILABLE_METRICS: Omit<FavoriteMetric, "value" | "change" | "changeType">[] = [
  {
    id: "coletas-pendentes",
    label: "Coletas Pendentes",
    icon: "Package",
    color: "text-amber-500",
    category: "coletas",
  },
  {
    id: "coletas-transito",
    label: "Coletas em Trânsito",
    icon: "Truck",
    color: "text-blue-500",
    category: "coletas",
  },
  {
    id: "coletas-finalizadas",
    label: "Coletas Finalizadas",
    icon: "CheckCircle",
    color: "text-green-500",
    category: "coletas",
  },
  {
    id: "entregas-pendentes",
    label: "Entregas Pendentes",
    icon: "Clock",
    color: "text-orange-500",
    category: "entregas",
  },
  {
    id: "entregas-transito",
    label: "Entregas em Trânsito",
    icon: "Navigation",
    color: "text-indigo-500",
    category: "entregas",
  },
  {
    id: "entregas-finalizadas",
    label: "Entregas Finalizadas",
    icon: "CheckSquare",
    color: "text-emerald-500",
    category: "entregas",
  },
  {
    id: "ocorrencias-abertas",
    label: "Ocorrências Abertas",
    icon: "AlertTriangle",
    color: "text-red-500",
    category: "ocorrencias",
  },
  {
    id: "sla-cumprido",
    label: "SLA Cumprido (%)",
    icon: "Target",
    color: "text-purple-500",
    category: "performance",
  },
  {
    id: "custo-mensal",
    label: "Custo Mensal (R$)",
    icon: "DollarSign",
    color: "text-cyan-500",
    category: "financeiro",
  },
  {
    id: "economia-mes",
    label: "Economia do Mês",
    icon: "TrendingDown",
    color: "text-teal-500",
    category: "financeiro",
  },
  {
    id: "xp-total",
    label: "XP Total",
    icon: "Star",
    color: "text-yellow-500",
    category: "gamificacao",
  },
  {
    id: "nivel-atual",
    label: "Nível Atual",
    icon: "Award",
    color: "text-pink-500",
    category: "gamificacao",
  },
];

const DEFAULT_FAVORITES = ["coletas-pendentes", "entregas-transito", "sla-cumprido"];

export function useFavoriteMetrics() {
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    "favorite-metrics",
    DEFAULT_FAVORITES
  );
  const [isEditMode, setIsEditMode] = useState(false);

  const addFavorite = useCallback(
    (metricId: string) => {
      if (!favorites.includes(metricId)) {
        setFavorites([...favorites, metricId]);
      }
    },
    [favorites, setFavorites]
  );

  const removeFavorite = useCallback(
    (metricId: string) => {
      setFavorites(favorites.filter((id) => id !== metricId));
    },
    [favorites, setFavorites]
  );

  const toggleFavorite = useCallback(
    (metricId: string) => {
      if (favorites.includes(metricId)) {
        removeFavorite(metricId);
      } else {
        addFavorite(metricId);
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  const reorderFavorites = useCallback(
    (newOrder: string[]) => {
      setFavorites(newOrder);
    },
    [setFavorites]
  );

  const resetFavorites = useCallback(() => {
    setFavorites(DEFAULT_FAVORITES);
  }, [setFavorites]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const getFavoriteMetrics = useCallback(() => {
    return favorites
      .map((id) => AVAILABLE_METRICS.find((m) => m.id === id))
      .filter(Boolean) as typeof AVAILABLE_METRICS;
  }, [favorites]);

  const getAvailableToAdd = useCallback(() => {
    return AVAILABLE_METRICS.filter((m) => !favorites.includes(m.id));
  }, [favorites]);

  const getMetricsByCategory = useCallback(() => {
    const categories: Record<string, typeof AVAILABLE_METRICS> = {};
    AVAILABLE_METRICS.forEach((metric) => {
      if (!categories[metric.category]) {
        categories[metric.category] = [];
      }
      categories[metric.category].push(metric);
    });
    return categories;
  }, []);

  return {
    favorites,
    isEditMode,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    reorderFavorites,
    resetFavorites,
    toggleEditMode,
    getFavoriteMetrics,
    getAvailableToAdd,
    getMetricsByCategory,
    availableMetrics: AVAILABLE_METRICS,
  };
}
