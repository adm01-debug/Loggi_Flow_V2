import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle2, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// RFC 4180 quote-aware CSV field parser — handles commas inside quoted fields
function parseCSVRow(row: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '"') {
      if (inQuotes && row[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      cols.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  cols.push(cur.trim());
  return cols;
}

const BULK_BATCH_SIZE = 200;

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
      // Read file as Promise so loading state is correct
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });

      const lines = text.split(/\r?\n/);
      const rows = lines.slice(1).filter((r) => r.trim()); // skip header + blanks

      const routesToInsert = [];
      for (const row of rows) {
        const [
          transportadora_id,
          origem_estado,
          destino_estado,
          origem_cidade,
          destino_cidade,
          prazo_dias,
          preco_por_kg,
          taxa_fixa,
        ] = parseCSVRow(row);

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
            ativo: true,
          });
        }
      }

      if (routesToInsert.length === 0) {
        toast.error("Nenhuma rota válida encontrada no arquivo");
        return;
      }

      // Batch insert to avoid DB timeout on large imports
      let inserted = 0;
      for (let i = 0; i < routesToInsert.length; i += BULK_BATCH_SIZE) {
        const batch = routesToInsert.slice(i, i + BULK_BATCH_SIZE);
        const { error } = await supabase
          .from("transportadora_rotas")
          .insert(batch as never[]);
        if (error) throw error;
        inserted += batch.length;
      }

      toast.success(`${inserted} rotas importadas com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["transportadora-rotas"] });
      setFile(null);
    } catch (error: any) {
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "transportadora_id,origem_estado,destino_estado,origem_cidade,destino_cidade,prazo_dias,preco_por_kg,taxa_fixa\nuuid-da-transportadora,SP,RJ,Sao Paulo,Rio de Janeiro,3,1.50,25.00";
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
          <Label htmlFor="csv-upload" className="text-xs">
            Arquivo CSV
          </Label>
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
            {isUploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Processar Malha
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-xs"
            onClick={downloadTemplate}
          >
            <Download className="w-3 h-3" /> Template
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Importe milhares de rotas e praças de uma só vez via arquivo CSV. Use
          o template para garantir o formato correto.
        </p>
      </CardContent>
    </Card>
  );
}
