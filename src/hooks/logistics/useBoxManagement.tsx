import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";
import { uniqueChannelName } from "@/lib/realtimeChannel";
import { assertAtualizou } from "@/lib/conflitoVersao";

export interface DeliveryWithRelations {
  id: string;
  numero_entrega: string;
  endereco_entrega: string;
  status: string;
  previsao_entrega: string | null;
  box_alocado: string | null;
  is_cross_docking: boolean;
  version: number;
  cliente: {
    razao_social: string;
  } | null;
  transportadora: {
    nome_fantasia: string;
  } | null;
  isUrgent?: boolean;
}

export interface BoxData {
  number: number;
  isOccupied: boolean;
  isUrgent: boolean;
  isCrossDocking: boolean;
  delivery: DeliveryWithRelations | null;
}

const TOTAL_BOXES = 16;

export function useBoxManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: deliveries = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["box-deliveries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(
          `
          id,
          numero_entrega,
          endereco_entrega,
          status,
          previsao_entrega,
          box_alocado,
          is_cross_docking,
          version,
          updated_at,
          cliente:clientes(razao_social),
          transportadora:transportadoras(nome_fantasia)
        `,
        )
        .is("deleted_at", null)
        .in("status", ["pronto_despacho", "nf_emitida", "cotacao_frete"])
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Add urgency flag based on deadline
      return (data || []).map((d) => ({
        ...d,
        isUrgent: d.previsao_entrega
          ? differenceInDays(new Date(d.previsao_entrega), new Date()) <= 1
          : false,
      }));
    },
    staleTime: QUERY_STALE_TIME.DYNAMIC,
    enabled: !!user?.id,
  });

  // Sufixo por instancia: duas montagens com o mesmo topico fazem a segunda
  // parar de receber atualizacao em silencio (achado R-09).
  const [canalBoxes] = useState(() => uniqueChannelName("box-realtime"));

  // Enable realtime for boxes
  useEffect(() => {
    const channel = supabase
      .channel(canalBoxes)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entregas" },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, canalBoxes]);

  // Build box data
  const boxes: BoxData[] = Array.from({ length: TOTAL_BOXES }, (_, i) => {
    const boxNumber = i + 1;
    const boxId = boxNumber.toString().padStart(2, "0");
    const delivery = deliveries.find((d) => d.box_alocado === boxId) || null;

    return {
      number: boxNumber,
      isOccupied: !!delivery,
      isUrgent: delivery?.isUrgent || false,
      isCrossDocking: delivery?.is_cross_docking || false,
      delivery: delivery as DeliveryWithRelations | null,
    };
  });

  // Pending deliveries (not allocated to any box)
  const pendingDeliveries = deliveries.filter((d) => !d.box_alocado);

  // Allocate delivery to box
  const allocateMutation = useMutation({
    mutationFn: async ({
      boxNumber,
      deliveryId,
      version,
    }: {
      boxNumber: number;
      deliveryId: string;
      version: number;
    }) => {
      const boxId = boxNumber.toString().padStart(2, "0");

      const { data: currentDelivery } = await supabase
        .from("entregas")
        .select("status")
        .eq("id", deliveryId)
        .single();

      const { error, count } = await supabase
        .from("entregas")
        .update({ box_alocado: boxId }, { count: "exact" })
        .eq("id", deliveryId)
        .eq("version", version);

      if (error) throw error;
      assertAtualizou(count);

      // Record history
      const { error: histError } = await supabase
        .from("kanban_history")
        .insert({
          delivery_id: deliveryId,
          from_status: currentDelivery?.status || null,
          to_status: currentDelivery?.status || "desconhecido",
          action_by: user?.id,
          notes: `Alocado ao BOX ${boxId}`,
        });
      if (histError) console.warn("kanban_history insert:", histError.message);
    },
    onSuccess: (_, { boxNumber }) => {
      queryClient.invalidateQueries({ queryKey: ["box-deliveries"] });
      toast.success(
        `Entrega alocada no BOX ${boxNumber.toString().padStart(2, "0")}`,
      );
    },
    onError: (err: Error) => {
      toast.error("Erro ao alocar entrega no box", {
        description: err.message,
      });
    },
  });

  // Toggle Cross-docking
  const toggleCrossDockingMutation = useMutation({
    mutationFn: async ({
      deliveryId,
      isCrossDocking,
    }: {
      deliveryId: string;
      isCrossDocking: boolean;
    }) => {
      const { error } = await supabase
        .from("entregas")
        .update({ is_cross_docking: isCrossDocking })
        .eq("id", deliveryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["box-deliveries"] });
      toast.success("Status de Cross-docking atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar Cross-docking");
    },
  });

  // Remove delivery from box
  const removeMutation = useMutation({
    mutationFn: async (boxNumber: number) => {
      const boxId = boxNumber.toString().padStart(2, "0");
      const { data: delivery } = await supabase
        .from("entregas")
        .select("id, status")
        .eq("box_alocado", boxId)
        .single();

      const { error } = await supabase
        .from("entregas")
        .update({ box_alocado: null })
        .eq("box_alocado", boxId);

      if (error) throw error;

      if (delivery) {
        await supabase.from("kanban_history").insert({
          delivery_id: delivery.id,
          from_status: delivery.status,
          to_status: delivery.status,
          action_by: user?.id,
          notes: `Removido do BOX ${boxId}`,
        });
      }
    },
    onSuccess: (_, boxNumber) => {
      queryClient.invalidateQueries({ queryKey: ["box-deliveries"] });
      toast.success(`BOX ${boxNumber.toString().padStart(2, "0")} liberado`);
    },
    onError: () => {
      toast.error("Erro ao liberar box");
    },
  });

  const allocateToBox = (
    boxNumber: number,
    deliveryId: string,
    version: number,
  ) => {
    return allocateMutation.mutateAsync({ boxNumber, deliveryId, version });
  };

  const removeFromBox = (boxNumber: number) => {
    return removeMutation.mutateAsync(boxNumber);
  };

  const toggleCrossDocking = (deliveryId: string, isCrossDocking: boolean) => {
    return toggleCrossDockingMutation.mutateAsync({
      deliveryId,
      isCrossDocking,
    });
  };

  return {
    boxes,
    pendingDeliveries: pendingDeliveries as DeliveryWithRelations[],
    isLoading,
    allocateToBox,
    removeFromBox,
    toggleCrossDocking,
  };
}
