import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { differenceInHours, parseISO, isPast } from "date-fns";

export interface SLAAlertItem {
  id: string;
  numero_entrega: string;
  status: string;
  previsao_entrega: string;
  transportadora_nome: string | null;
  cliente_nome: string | null;
  horas_restantes: number;
  risco: "critico" | "alto" | "medio" | "baixo";
  previsao_atraso: boolean;
}

export const useSLAAlerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  

  const { data: entregas, isLoading } = useQuery({
    queryKey: ["sla-alerts-entregas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(
          `
          id, numero_entrega, status, previsao_entrega, data_despacho,
          transportadora:transportadoras (nome_fantasia),
          cliente:clientes (razao_social)
        `,
        )
        .is("deleted_at", null)
        .in("status", ["despachado", "em_transito", "saiu_entrega"])
        .not("previsao_entrega", "is", null)
        .order("previsao_entrega", { ascending: true })
        .limit(500);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const alerts = useMemo((): SLAAlertItem[] => {
    if (!entregas) return [];

    return (entregas as unknown as Array<{
      id: string;
      numero_entrega: string;
      status: string;
      previsao_entrega: string | null;
      transportadora: { nome_fantasia: string } | null;
      cliente: { razao_social: string } | null;
    }>)
      .map((e) => {
        const transportadora = e.transportadora as {
          nome_fantasia: string;
        } | null;
        const cliente = e.cliente as { razao_social: string } | null;
        const previsao = parseISO(e.previsao_entrega || "");
        const now = new Date();
        const horasRestantes = differenceInHours(previsao, now);
        const atrasado = isPast(previsao);

        let risco: SLAAlertItem["risco"] = "baixo";
        if (atrasado) risco = "critico";
        else if (horasRestantes <= 4) risco = "critico";
        else if (horasRestantes <= 12) risco = "alto";
        else if (horasRestantes <= 24) risco = "medio";

        return {
          id: e.id,
          numero_entrega: e.numero_entrega,
          status: e.status,
          previsao_entrega: e.previsao_entrega || "",
          transportadora_nome: transportadora?.nome_fantasia || null,
          cliente_nome: cliente?.razao_social || null,
          horas_restantes: horasRestantes,
          risco,
          previsao_atraso: atrasado,
        };
      })
      .filter((a) => a.risco !== "baixo");
  }, [entregas]);

  const criticos = alerts.filter((a) => a.risco === "critico");
  const altos = alerts.filter((a) => a.risco === "alto");
  const medios = alerts.filter((a) => a.risco === "medio");

  // Auto-notify on critical alerts
  const createNotification = useMutation({
    mutationFn: async (alert: SLAAlertItem) => {
      const { error } = await supabase.from("notifications").insert({
        user_id: user?.id || "",
        title: alert.previsao_atraso
          ? "🚨 Entrega ATRASADA!"
          : "⚠️ SLA em risco!",
        message: `${alert.numero_entrega} — ${alert.transportadora_nome || "N/A"} — ${
          alert.previsao_atraso
            ? "Prazo estourado!"
            : `Faltam ${alert.horas_restantes}h para o prazo`
        }`,
        type: alert.previsao_atraso ? "error" : "warning",
        action_url: "/envios",
        metadata: {
          entrega_id: alert.id,
          numero_entrega: alert.numero_entrega,
          event: "sla_alert",
          risco: alert.risco,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Send alerts for critical items (once per session)
  useEffect(() => {
    if (criticos.length === 0) return;
    const notified = sessionStorage.getItem("sla-notified") || "";
    const notifiedIds = new Set(notified.split(","));

    const pendentes: SLAAlertItem[] = [];

    criticos.forEach((alert) => {
      if (!notifiedIds.has(alert.id)) {
        toast.error(
          `🚨 ${alert.numero_entrega} — ${alert.previsao_atraso ? "ATRASADA" : "Prazo em risco"}`,
          {
            description: `${alert.transportadora_nome || ""} — ${alert.horas_restantes}h restantes`,
            duration: 10000,
          },
        );
        pendentes.push(alert);
        notifiedIds.add(alert.id);
      }
    });

    sessionStorage.setItem("sla-notified", Array.from(notifiedIds).join(","));

    if (pendentes.length === 0) return;

    // Um aviso para o lote inteiro: o efeito dispara sozinho, toast por item entupiria a tela.
    void Promise.allSettled(pendentes.map((alert) => createNotification.mutateAsync(alert))).then(
      (resultados) => {
        if (resultados.some((r) => r.status === "rejected")) {
          toast.error("Não foi possível registrar os alertas de SLA");
        }
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criticos]);

  return {
    alerts,
    criticos,
    altos,
    medios,
    isLoading,
    totalAlertas: alerts.length,
  };
};
