import { log } from "../_shared/logger.ts";
import { getCircuitBreaker } from "../_shared/circuitBreaker.ts";

export const handleExternalCall = async (serviceName: string, call: () => Promise<any>) => {
  const breaker = getCircuitBreaker(serviceName);
  
  try {
    return await breaker.execute(call);
  } catch (error) {
    log('ERROR', `Falha na chamada ao serviço ${serviceName}`, { error: error.message });
    throw error;
  }
};
