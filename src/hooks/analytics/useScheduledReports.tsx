import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";

export interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  report_type: string;
  frequency: "daily" | "weekly" | "monthly";
  day_of_week?: number;
  day_of_month?: number;
  time_of_day: string;
  recipients: string[];
  filters: Record<string, unknown>;
  is_active: boolean;
  last_sent_at?: string;
  next_send_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReportFormData {
  name: string;
  report_type: string;
  frequency: "daily" | "weekly" | "monthly";
  day_of_week?: number;
  day_of_month?: number;
  time_of_day: string;
  recipients: string[];
  filters?: Record<string, unknown>;
  is_active?: boolean;
}

export const useScheduledReports = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const authHeaders = {
    Authorization: `Bearer ${session?.access_token ?? ""}`,
  };


  const { data: reports, isLoading } = useQuery({
    queryKey: ["scheduled-reports", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.functions.invoke(
        "scheduled-reports",
        {
          body: { action: "list" },
          headers: authHeaders,
        },
      );

      if (error) throw error;
      return (data?.reports || []) as ScheduledReport[];
    },
    enabled: !!user?.id,
  });

  const createReport = useMutation({
    mutationFn: async (reportData: ScheduledReportFormData) => {
      const { data, error } = await supabase.functions.invoke(
        "scheduled-reports",
        {
          body: { action: "create", reportData },
          headers: authHeaders,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      toast.success("Relatório agendado criado!");
    },
    onError: () => {
      toast.error("Erro ao criar relatório");
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({
      id,
      ...reportData
    }: ScheduledReportFormData & { id: string }) => {
      const { data, error } = await supabase.functions.invoke(
        "scheduled-reports",
        {
          body: {
            action: "update",
            reportId: id,
            reportData,
          },
          headers: authHeaders,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      toast.success("Relatório atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar relatório");
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "scheduled-reports",
        {
          body: { action: "delete", reportId },
          headers: authHeaders,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      toast.success("Relatório removido!");
    },
    onError: () => {
      toast.error("Erro ao remover relatório");
    },
  });

  const generateReport = useMutation({
    mutationFn: async (reportData: {
      report_type: string;
      filters?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "scheduled-reports",
        {
          body: { action: "generate", reportData },
          headers: authHeaders,
        },
      );
      if (error) throw error;
      return data;
    },
  });

  return {
    reports: reports || [],
    isLoading,
    createReport,
    updateReport,
    deleteReport,
    generateReport,
  };
};
