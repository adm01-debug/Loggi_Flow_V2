import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wand2, Save, FileJson, Hash, Calendar, MessageSquare, Play, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NormalizationMappingProps {
  carrierId: string;
  initialConfig?: any;
  onSave: (config: any) => void;
}

export function NormalizationMapping({ carrierId, initialConfig, onSave }: NormalizationMappingProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<{ price: number | null, days: number | null } | null>(null);
  const [config, setConfig] = useState(initialConfig || {
    price_pattern: "valor|preço|R\\$\\s*(\\d+[,.]\\d+)",
    term_pattern: "prazo|dias|(\\d+)\\s*dias",
    fallback_strategy: "ai_extraction", // ai_extraction, regex, manual
    ai_prompt: "Extraia o valor do frete e o prazo de entrega deste texto em formato JSON: { 'price': number, 'days': number }",
  });

  const handleTest = async () => {
    if (!testText) {
      toast.error("Insira um texto para testar");
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);

    try {
      // First, try local regex simulation for instant feedback
      let price = null;
      let days = null;

      if (config.price_pattern) {
        const pMatch = testText.match(new RegExp(config.price_pattern, "i"));
        if (pMatch && pMatch[1]) price = parseFloat(pMatch[1].replace(",", "."));
      }

      if (config.term_pattern) {
        const tMatch = testText.match(new RegExp(config.term_pattern, "i"));
        if (tMatch && tMatch[1]) days = parseInt(tMatch[1]);
      }

      // If missing data and AI enabled, call the edge function
      if ((!price || !days) && config.fallback_strategy !== "regex") {
        const { data, error } = await supabase.functions.invoke("normalize-freight-response", {
          body: { text: testText, transportadora_id: carrierId === "new" ? undefined : carrierId }
        });
        
        if (error) throw error;
        price = data.price;
        days = data.days;
      }

      setTestResult({ price, days });
      toast.success("Teste concluído!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar resposta");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(config);
    toast.success("Mapeamento de resposta salvo!");
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Mapeamento Inteligente de Respostas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              Padrão de Valor (Regex)
            </Label>
            <Input 
              placeholder="Ex: R\$\s*(\d+[,.]\d+)" 
              value={config.price_pattern}
              onChange={(e) => setConfig({ ...config, price_pattern: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground">Expressão regular para identificar o preço na resposta.</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Padrão de Prazo (Regex)
            </Label>
            <Input 
              placeholder="Ex: (\d+)\s*dias" 
              value={config.term_pattern}
              onChange={(e) => setConfig({ ...config, term_pattern: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground">Expressão regular para identificar o prazo (em dias).</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Estratégia de Extração
            </Label>
            <Select 
              value={config.fallback_strategy} 
              onValueChange={(v) => setConfig({ ...config, fallback_strategy: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regex">Somente Regex (Rápido)</SelectItem>
                <SelectItem value="ai_extraction">Inteligência Artificial (Preciso)</SelectItem>
                <SelectItem value="hybrid">Híbrido (Regex → IA)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.fallback_strategy !== "regex" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label>Instruções para IA (Prompt)</Label>
              <Textarea 
                value={config.ai_prompt}
                onChange={(e) => setConfig({ ...config, ai_prompt: e.target.value })}
                className="h-24 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">A IA usará estas instruções para normalizar respostas complexas de WhatsApp ou E-mail.</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="w-4 h-4" /> Salvar Parametrização
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
