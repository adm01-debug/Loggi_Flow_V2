import { BaseService } from "@/services/base/BaseService";
import { supabase } from "@/integrations/supabase/client";

export class LogisticsService extends BaseService {
  static async getDeliveries(limit: number = 100) {
    return this.call(
      async () => {
        const result = await supabase.from('entregas').select('*').limit(limit);
        return { data: result.data, error: result.error };
      },
      { category: 'logistics_fetch', message: 'Busca de entregas' }
    );
  }

  static async updateStatus(
    id: string,
    status:
      | "aguardando_producao"
      | "cotacao_frete"
      | "despachado"
      | "em_transito"
      | "entregue"
      | "finalizado"
      | "nf_emitida"
      | "ocorrencia"
      | "pronto_despacho"
      | "saiu_entrega",
  ) {
    return this.call(
      async () => {
        const result = await supabase.from('entregas').update({ status }).eq('id', id);
        return { data: result.data, error: result.error };
      },
      { category: 'logistics_update', message: `Atualização status entrega ${id}` }
    );
  }
}
