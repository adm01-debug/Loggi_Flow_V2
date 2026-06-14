import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RawResponse {
  id: string;
  source: "whatsapp" | "email";
  carrier_id: string;
  carrier_name: string;
  raw_text: string;
  processed: boolean;
  extracted_data?: any;
  created_at: string;
}

export function ResponseConsole() {
  const [responses, setResponses] = useState<RawResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchIncoming();
    const channel = supabase
      .channel("raw_responses")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "cotacoes_multicanal" },
        () => {
          fetchIncoming();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIncoming = async () => {
    // For demo/sim, we look at quotes that were responded to but might have raw logs
    const { data } = await supabase
      .from("cotacoes_multicanal")
      .select("*, transportadora:transportadoras(nome_fantasia)")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      const formatted = data.map((c) => ({
        id: c.id,
        source: c.canal as any,
        carrier_id: c.transportadora_id,
        carrier_name: c.transportadora?.nome_fantasia || "N/A",
        raw_text: c.observacoes || "Sem texto original",
        processed: c.status === "respondido",
        extracted_data: { price: c.valor_cotado, days: c.prazo_dias },
        created_at: c.created_at,
      }));
      setResponses(formatted);
    }
  };

  const handleNormalize = async (res: RawResponse) => {
    setIsProcessing(res.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "normalize-freight-response",
        {
          body: {
            text: res.raw_text,
            transportadora_id: res.carrier_id,
            cotacao_id: res.id,
          },
        },
      );

      if (error) throw error;
      toast.success("Normalização concluída com sucesso!");
      fetchIncoming();
    } catch (error: any) {
      toast.error(`Erro ao normalizar: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Central de Respostas & Normalização IA
          </div>
          <Badge
            variant="outline"
            className="animate-pulse bg-success/10 text-success border-success/20"
          >
            AUTO-SYNC ON
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {responses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground italic text-xs">
              Aguardando cotações multicanal...
            </div>
          ) : (
            <div className="divide-y">
              {responses.map((res) => (
                <div
                  key={res.id}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase"
                      >
                        {res.source}
                      </Badge>
                      <span className="text-xs font-bold">
                        {res.carrier_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(res.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="bg-black/5 p-2 rounded text-[11px] font-mono mb-3 border border-dashed border-primary/10 italic">
                    "{res.raw_text}"
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      {res.processed ? (
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 text-[10px] font-black text-success">
                            <CheckCircle2 className="w-3 h-3" /> R${" "}
                            {res.extracted_data?.price?.toFixed(2) || "—"}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black text-success">
                            <CheckCircle2 className="w-3 h-3" />{" "}
                            {res.extracted_data?.days || "—"} dias
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-warning italic">
                          <AlertTriangle className="w-3 h-3" /> Aguardando
                          normalização...
                        </div>
                      )}
                    </div>

                    {!res.processed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-2 text-[10px] hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleNormalize(res)}
                        disabled={isProcessing === res.id}
                      >
                        {isProcessing === res.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        Extrair com IA
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-3 bg-primary/5 border-t text-[10px] text-muted-foreground flex items-center gap-2">
          <Zap className="w-3 h-3 text-warning" />O sistema utiliza GPT-4o para
          processar respostas complexas de WhatsApp e E-mail automaticamente.
        </div>
      </CardContent>
    </Card>
  );
}
