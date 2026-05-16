import { BaseService } from "@/services/base/BaseService";
import { supabase } from "@/integrations/supabase/client";

export class LogisticsService extends BaseService {
  static async getDeliveries(limit: number = 100) {
    return this.call(
      () => supabase.from('entregas').select('*').limit(limit),
      { category: 'logistics_fetch', message: 'Busca de entregas' }
    );
  }

  static async updateStatus(id: string, status: string) {
    return this.call(
      () => supabase.from('entregas').update({ status }).eq('id', id),
      { category: 'logistics_update', message: `Atualização status entrega ${id}` }
    );
  }
}
