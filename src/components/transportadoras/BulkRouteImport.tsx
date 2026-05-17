import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function BulkRouteImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV para importar");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const rows = text.split("\n").slice(1); // Skip header
        
        const routesToInsert = [];
        for (const row of rows) {
          const [transportadora_id, origem_estado, destino_estado, origem_cidade, destino_cidade, prazo_dias, preco_por_kg, taxa_fixa] = row.split(",").map(s => s.trim());
          
          if (transportadora_id && origem_estado && destino_estado) {
            routesToInsert.push({
              transportadora_id,
              origem_estado,
              destino_estado,
              origem_cidade: origem_cidade || null,
              destino_cidade: destino_cidade || null,
              prazo_dias: parseInt(prazo_dias) || 5,
              preco_por_kg: parseFloat(preco_por_kg) || 0,
              taxa_fixa: parseFloat(taxa_fixa) || 0,
              ativo: true
            });
          }
        }

        if (routesToInsert.length === 0) {
          toast.error("Nenhuma rota válida encontrada no arquivo");
          return;
        }

        const { error } = await supabase.from("transportadora_rotas").insert(routesToInsert);
        
        if (error) throw error;

        toast.success(`${routesToInsert.length} rotas importadas com sucesso!`);
        queryClient.invalidateQueries({ queryKey: ["transportadora-rotas"] });
        setFile(null);
      };
      reader.readAsText(file);
    } catch (error: any) {
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "transportadora_id,origem_estado,destino_estado,origem_cidade,destino_cidade,prazo_dias,preco_por_kg,taxa_fixa\nuuid-da-transportadora,SP,RJ,Sao Paulo,Rio de Janeiro,3,1.50,25.00";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_rotas.csv";
    a.click();
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Upload className="w-4 h-4" /> Importação de Malha em Massa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="csv-upload" className="text-xs">Arquivo CSV</Label>
          <Input 
            id="csv-upload" 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="text-xs cursor-pointer"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="flex-1 gap-2 text-xs" 
            onClick={handleImport} 
            disabled={isUploading || !file}
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Processar Malha
          </Button>
          <Button variant="outline" className="gap-2 text-xs" onClick={downloadTemplate}>
            <Download className="w-3 h-3" /> Template
          </Button>
        </div>
        
        <p className="text-[10px] text-muted-foreground">
          Importe milhares de rotas e praças de uma só vez via arquivo CSV. Use o template para garantir o formato correto.
        </p>
      </CardContent>
    </Card>
  );
}
