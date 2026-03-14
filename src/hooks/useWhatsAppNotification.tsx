import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type WhatsAppTemplate =
  | "delivery_dispatched"
  | "delivery_in_transit"
  | "delivery_out"
  | "delivery_completed"
  | "delay_alert"
  | "collection_scheduled";

interface SendWhatsAppParams {
  phone: string;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}

/**
 * Hook for sending WhatsApp notifications via A-Ticket integration.
 */
export function useWhatsAppNotification() {
  const [isSending, setIsSending] = useState(false);

  const send = useCallback(async (params: SendWhatsAppParams) => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-notification", {
        body: params,
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Falha ao enviar WhatsApp");

      toast.success("WhatsApp enviado com sucesso!");
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar WhatsApp";
      toast.error(message);
      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  /**
   * Send delivery status notification to customer.
   */
  const notifyDeliveryStatus = useCallback(
    async (
      phone: string,
      entrega: { numero: string; nome_cliente: string; transportadora?: string; previsao?: string; link?: string },
      status: "despachado" | "em_transito" | "saiu_entrega" | "entregue"
    ) => {
      const templateMap: Record<string, WhatsAppTemplate> = {
        despachado: "delivery_dispatched",
        em_transito: "delivery_in_transit",
        saiu_entrega: "delivery_out",
        entregue: "delivery_completed",
      };

      return send({
        phone,
        template: templateMap[status],
        variables: {
          nome: entrega.nome_cliente,
          numero: entrega.numero,
          transportadora: entrega.transportadora || "—",
          previsao: entrega.previsao || "em breve",
          link: entrega.link || "",
        },
      });
    },
    [send]
  );

  /**
   * Notify supplier of scheduled collection.
   */
  const notifyCollectionScheduled = useCallback(
    async (phone: string, coleta: { numero: string; nome_contato: string; data: string; endereco: string }) => {
      return send({
        phone,
        template: "collection_scheduled",
        variables: {
          nome: coleta.nome_contato,
          numero: coleta.numero,
          data: coleta.data,
          endereco: coleta.endereco,
        },
      });
    },
    [send]
  );

  return { send, notifyDeliveryStatus, notifyCollectionScheduled, isSending };
}
