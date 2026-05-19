import { supabase } from "@/integrations/supabase/client";

export interface CotacaoFrete {
  id: string;
  entrega_id: string;
  transportadora_id: string;
  valor: number;
  prazo_dias: number | null;
  observacoes: string | null;
  selecionada: boolean | null;
  created_at: string;
  transportadora?: { nome_fantasia: string | null };
  entrega?: { numero_entrega: string; endereco_entrega: string };
}

export const logisticsService = {
  async fetchCotacoes(): Promise<CotacaoFrete[]> {
    const { data, error } = await supabase
      .from('cotacoes_frete')
      .select(`
        *,
        transportadora:transportadoras(nome_fantasia),
        entrega:entregas(numero_entrega, endereco_entrega)
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (error) throw error;
    return data as CotacaoFrete[];
  },

  async selectCotacao(id: string, entregaId: string): Promise<void> {
    // Deselect all others for same entrega
    await supabase
      .from('cotacoes_frete')
      .update({ selecionada: false })
      .eq('entrega_id', entregaId);

    // Select this one
    const { error } = await supabase
      .from('cotacoes_frete')
      .update({ selecionada: true })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteCotacao(id: string): Promise<void> {
    const { error } = await supabase
      .from('cotacoes_frete')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
