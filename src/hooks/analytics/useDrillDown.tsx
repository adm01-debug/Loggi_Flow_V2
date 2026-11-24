/* eslint-disable sonarjs/cognitive-complexity */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DrillDownData {
  title: string;
  category: string;
  value: string | number;
  items: Array<{
    id: string;
    numero?: string;
    status: string;
    created_at: string;
    endereco?: string;
    [key: string]: unknown;
  }>;
}

export interface DrillDownParams {
  category: "coletas" | "entregas" | "fretes_internos";
  filter?: {
    status?: string;
    dateRange?: { start: string; end: string };
    day?: string;
    transportadora_id?: string;
  };
  title: string;
  value: string | number;
}

export function useDrillDown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<DrillDownData | null>(null);

  const openDrillDown = useCallback(async (params: DrillDownParams) => {
    setIsOpen(true);
    setIsLoading(true);
    setData({
      title: params.title,
      category: params.category,
      value: params.value,
      items: [],
    });

    try {
      let dateStart: string | undefined;
      let dateEnd: string | undefined;

      if (params.filter?.dateRange) {
        dateStart = params.filter.dateRange.start;
        dateEnd = params.filter.dateRange.end;
      }

      if (params.filter?.day) {
        const dayStartDate = new Date(params.filter.day);
        dayStartDate.setHours(0, 0, 0, 0);
        const dayEndDate = new Date(params.filter.day);
        dayEndDate.setHours(23, 59, 59, 999);
        dateStart = dayStartDate.toISOString();
        dateEnd = dayEndDate.toISOString();
      }

      let rawItems: Record<string, unknown>[] = [];

      if (params.category === "coletas") {
        let query = supabase
          .from("coletas")
          .select(
            "id, numero_coleta, status, created_at, endereco_coleta, transportadora_id",
          )
          .is("deleted_at", null);
        if (dateStart) query = query.gte("created_at", dateStart);
        if (dateEnd) query = query.lte("created_at", dateEnd);
        if (params.filter?.transportadora_id)
          query = query.eq(
            "transportadora_id",
            params.filter.transportadora_id,
          );
        const { data: result, error } = await query
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        rawItems = (result || []) as Record<string, unknown>[];
      } else if (params.category === "entregas") {
        let query = supabase
          .from("entregas")
          .select(
            "id, numero_entrega, status, created_at, endereco_entrega, transportadora_id",
          )
          .is("deleted_at", null);
        if (dateStart) query = query.gte("created_at", dateStart);
        if (dateEnd) query = query.lte("created_at", dateEnd);
        if (params.filter?.transportadora_id)
          query = query.eq(
            "transportadora_id",
            params.filter.transportadora_id,
          );
        const { data: result, error } = await query
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        rawItems = (result || []) as Record<string, unknown>[];
      } else {
        let query = supabase
          .from("fretes_internos")
          .select("id, destino, status, created_at")
          .is("deleted_at", null);
        if (dateStart) query = query.gte("created_at", dateStart);
        if (dateEnd) query = query.lte("created_at", dateEnd);
        const { data: result, error } = await query
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        rawItems = (result || []) as Record<string, unknown>[];
      }

      // Filter by status in memory if provided
      if (params.filter?.status) {
        rawItems = rawItems.filter(
          (item) => item.status === params.filter?.status,
        );
      }

      // Map items to common format
      const mappedItems = rawItems.map((item) => ({
        id: item.id as string,
        numero: (item.numero_coleta ||
          item.numero_entrega ||
          item.id) as string,
        status: item.status as string,
        created_at: item.created_at as string,
        endereco: (item.endereco_coleta ||
          item.endereco_entrega ||
          item.destino) as string,
        ...item,
      }));

      setData({
        title: params.title,
        category: params.category,
        value: params.value,
        items: mappedItems,
      });
    } catch {
      setData({
        title: params.title,
        category: params.category,
        value: params.value,
        items: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeDrillDown = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return {
    isOpen,
    isLoading,
    data,
    openDrillDown,
    closeDrillDown,
    setIsOpen,
  };
}
