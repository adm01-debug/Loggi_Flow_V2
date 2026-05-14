import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

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

  const { data: deliveries = [], isLoading, refetch } = useQuery({
    queryKey: ["box-deliveries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(`
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
        `)
        .in("status", ["pronto_despacho", "nf_emitida", "cotacao_frete"])
        .order("created_at", { ascending: false });

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

  // Enable realtime for boxes
  useEffect(() => {
    const channel = supabase
      .channel('box-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entregas' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

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
    mutationFn: async ({ boxNumber, deliveryId, version }: { boxNumber: number; deliveryId: string; version: number }) => {
      const boxId = boxNumber.toString().padStart(2, "0");

      const { error } = await supabase
        .from("entregas")
        .update({ box_alocado: boxId })
        .eq("id", deliveryId)
        .eq("version", version);

      if (error) throw error;
    },
    onSuccess: (_, { boxNumber }) => {
      queryClient.invalidateQueries({ queryKey: ["box-deliveries"] });
      toast.success(`Entrega alocada no BOX ${boxNumber.toString().padStart(2, "0")}`);
    },
    onError: () => {
      toast.error("Erro ao alocar entrega no box");
    },
  });

  // Toggle Cross-docking
  const toggleCrossDockingMutation = useMutation({
    mutationFn: async ({ deliveryId, isCrossDocking }: { deliveryId: string, isCrossDocking: boolean }) => {
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

      const { error } = await supabase
        .from("entregas")
        .update({ box_alocado: null })
        .eq("box_alocado", boxId);

      if (error) throw error;
    },
    onSuccess: (_, boxNumber) => {
      queryClient.invalidateQueries({ queryKey: ["box-deliveries"] });
      toast.success(`BOX ${boxNumber.toString().padStart(2, "0")} liberado`);
    },
    onError: () => {
      toast.error("Erro ao liberar box");
    },
  });

  const allocateToBox = (boxNumber: number, deliveryId: string, version: number) => {
    return allocateMutation.mutateAsync({ boxNumber, deliveryId, version });
  };

  const removeFromBox = (boxNumber: number) => {
    return removeMutation.mutateAsync(boxNumber);
  };

  const toggleCrossDocking = (deliveryId: string, isCrossDocking: boolean) => {
    return toggleCrossDockingMutation.mutateAsync({ deliveryId, isCrossDocking });
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
