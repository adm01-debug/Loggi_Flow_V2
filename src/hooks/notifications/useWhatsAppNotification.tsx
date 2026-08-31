import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type WhatsAppAction =
  | "send_status_update"
  | "send_delivery_notification"
  | "send_collection_alert"
  | "send_custom";

interface SendOptions {
  action: WhatsAppAction;
  phone: string;
  entrega_id?: string;
  coleta_id?: string;
  template?: string;
  variables?: Record<string, string>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function useWhatsAppNotification() {
  const [isSending, setIsSending] = useState(false);

  const sendNotification = async (options: SendOptions): Promise<SendResult> => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-notification", {
        body: options,
      });

      if (error) {
        toast.error("Erro ao enviar notificação WhatsApp");
        return { success: false, error: error.message };
      }

      if (data?.success) {
        toast.success("Notificação WhatsApp enviada!");
        return { success: true, messageId: data.messageId };
      }

      toast.error(data?.error || "Erro desconhecido");
      return { success: false, error: data?.error };
    } catch {
      toast.error("Erro ao enviar notificação WhatsApp");
      return { success: false, error: "Unexpected error" };
    } finally {
      setIsSending(false);
    }
  };

  const sendStatusUpdate = (phone: string, entregaId: string) =>
    sendNotification({ action: "send_status_update", phone, entrega_id: entregaId });

  const sendDeliveryConfirmation = (phone: string, entregaId: string) =>
    sendNotification({ action: "send_delivery_notification", phone, entrega_id: entregaId });

  const sendCollectionAlert = (phone: string, coletaId: string) =>
    sendNotification({ action: "send_collection_alert", phone, coleta_id: coletaId });

  const sendCustomMessage = (phone: string, template: string, variables?: Record<string, string>) =>
    sendNotification({ action: "send_custom", phone, template, variables });

  return {
    isSending,
    sendNotification,
    sendStatusUpdate,
    sendDeliveryConfirmation,
    sendCollectionAlert,
    sendCustomMessage,
  };
}
