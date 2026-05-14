import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IntegrationStatus {
  name: string;
  status: 'connected' | 'configured' | 'not_configured' | 'error';
  lastCheck?: Date;
  message?: string;
}

export function useIntegrationValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    { name: 'Lalamove', status: 'not_configured' },
    { name: 'Mapbox', status: 'not_configured' },
    { name: 'Bitrix24', status: 'not_configured' },
    { name: 'Rodonaves', status: 'not_configured' },
    { name: 'Melhor Envio', status: 'not_configured' },
  ]);

  const validateLalamove = useCallback(async (): Promise<IntegrationStatus> => {
    try {
      const { data, error } = await supabase.functions.invoke('lalamove-tracking', {
        body: { action: 'test' },
      });
      
      if (error) {
        return { name: 'Lalamove', status: 'error', message: error.message };
      }
      
      if (data?.circuitOpen) {
        return { name: 'Lalamove', status: 'error', message: 'Circuit Breaker Ativo: Serviço temporariamente suspenso' };
      }
      
      return { name: 'Lalamove', status: 'connected', lastCheck: new Date() };
    } catch (e) {
      return { name: 'Lalamove', status: 'error', message: (e as Error).message };
    }
  }, []);

  const validateMapbox = useCallback(async (): Promise<IntegrationStatus> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error || !data?.token) {
        return { name: 'Mapbox', status: 'not_configured', message: 'Token não encontrado' };
      }
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${data.token}&limit=1`
      );
      
      if (!response.ok) {
        return { name: 'Mapbox', status: 'error', message: 'Token inválido' };
      }
      
      return { name: 'Mapbox', status: 'connected', lastCheck: new Date() };
    } catch (e) {
      return { name: 'Mapbox', status: 'error', message: (e as Error).message };
    }
  }, []);

  const validateBitrix24 = useCallback(async (): Promise<IntegrationStatus> => {
    try {
      const { data, error } = await supabase.functions.invoke('bitrix24-integration', {
        body: { action: 'test-connection' },
      });
      if (error) return { name: 'Bitrix24', status: 'error', message: error.message };
      return { name: 'Bitrix24', status: 'connected', lastCheck: new Date() };
    } catch (e) {
      return { name: 'Bitrix24', status: 'error', message: (e as Error).message };
    }
  }, []);

  const validateRodonaves = useCallback(async (): Promise<IntegrationStatus> => {
    try {
      const { data, error } = await supabase.functions.invoke('rodonaves-api', {
        body: { action: 'cubage-factor', cnpjRemetente: 'test' }, // cubage is a safe test call
      });
      if (error) return { name: 'Rodonaves', status: 'error', message: error.message };
      return { name: 'Rodonaves', status: 'connected', lastCheck: new Date() };
    } catch (e) {
      return { name: 'Rodonaves', status: 'error', message: (e as Error).message };
    }
  }, []);

  const validateMelhorEnvio = useCallback(async (): Promise<IntegrationStatus> => {
    try {
      const { data, error } = await supabase.functions.invoke('melhor-envio-api', {
        body: { action: 'infoUsuario', useSandbox: true },
      });
      if (error) return { name: 'Melhor Envio', status: 'error', message: error.message };
      return { name: 'Melhor Envio', status: 'connected', lastCheck: new Date() };
    } catch (e) {
      return { name: 'Melhor Envio', status: 'error', message: (e as Error).message };
    }
  }, []);

  const validateAll = useCallback(async () => {
    setIsValidating(true);
    
    try {
      const results = await Promise.all([
        validateLalamove(),
        validateMapbox(),
        validateBitrix24(),
        validateRodonaves(),
        validateMelhorEnvio(),
      ]);
      
      setIntegrations(results);
      
      const connected = results.filter(r => r.status === 'connected').length;
      const errors = results.filter(r => r.status === 'error').length;
      
      if (errors > 0) {
        toast.warning(`${errors} integração(ões) com erro`);
      } else if (connected > 0) {
        toast.success(`${connected} integração(ões) conectada(s)`);
      }
      
      return results;
    } finally {
      setIsValidating(false);
    }
  }, [validateLalamove, validateMapbox, validateBitrix24, validateRodonaves, validateMelhorEnvio]);

  const validateSingle = useCallback(async (name: string) => {
    setIsValidating(true);
    
    try {
      let result: IntegrationStatus;
      
      switch (name.toLowerCase()) {
        case 'lalamove':
          result = await validateLalamove();
          break;
        case 'mapbox':
          result = await validateMapbox();
          break;
        case 'bitrix24':
          result = await validateBitrix24();
          break;
        case 'rodonaves':
          result = await validateRodonaves();
          break;
        case 'melhorenvio':
        case 'melhor envio':
          result = await validateMelhorEnvio();
          break;
        default:
          throw new Error(`Unknown integration: ${name}`);
      }
      
      setIntegrations(prev => 
        prev.map(i => i.name.toLowerCase() === name.toLowerCase() ? result : i)
      );
      
      if (result.status === 'connected') {
        toast.success(`${result.name} conectado com sucesso!`);
      } else if (result.status === 'error') {
        toast.error(`Erro ao conectar ${result.name}: ${result.message}`);
      }
      
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [validateLalamove, validateMapbox]);

  return {
    integrations,
    isValidating,
    validateAll,
    validateSingle,
  };
}

export function getStatusColor(status: IntegrationStatus['status']): string {
  switch (status) {
    case 'connected':
      return 'bg-success';
    case 'configured':
      return 'bg-info';
    case 'error':
      return 'bg-destructive';
    default:
      return 'bg-muted';
  }
}

export function getStatusLabel(status: IntegrationStatus['status']): string {
  switch (status) {
    case 'connected':
      return 'Conectado';
    case 'configured':
      return 'Configurado';
    case 'error':
      return 'Erro';
    default:
      return 'Não configurado';
  }
}
