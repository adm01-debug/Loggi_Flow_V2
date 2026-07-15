import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { logisticsBreaker } from "@/services/resilience/CircuitBreaker";
import { useTelemetry } from "@/hooks/analytics/useTelemetry";
import { toast } from "sonner";

export function useResilientMutation<TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  const { logTelemetry } = useTelemetry();

  return useMutation({
    ...options,
    mutationFn: async (variables: TVariables) => {
      try {
        return await logisticsBreaker.execute(() => mutationFn(variables));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado";
        
        logTelemetry({
          severity: 'critical',
          category: 'resilience_failure',
          message: `Mutação falhou após retentativas e Circuit Breaker: ${message}. Estado: ${logisticsBreaker.getState()}`,
          metadata: { error, variables }
        });

        toast.error("Falha na Operação", {
          description: message,
        });

        throw error;
      }
    },
  });
}
