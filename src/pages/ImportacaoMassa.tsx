/* eslint-disable max-lines */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Stepper } from "@/components/ui/stepper";
import { Progress } from "@/components/ui/progress";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Package,
  Truck,
  Users,
  Building2,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { CSVImporter } from "@/components/common/CSVImporter";
import { ExcelImporter } from "@/components/common/ExcelImporter";
import { supabase } from "@/integrations/supabase/client";
import { useExport } from "@/hooks/common/useExport";
import { toast } from "sonner";
import { z } from "zod";

const entregaSchema = z.object({
  numero_entrega: z.string().min(1, "Número obrigatório"),
  endereco_entrega: z.string().min(1, "Endereço obrigatório"),
  nf_remessa: z.string().optional(),
  valor_frete: z.coerce.number().optional(),
  previsao_entrega: z.string().optional(),
  observacoes: z.string().optional(),
});

const coletaSchema = z.object({
  numero_coleta: z.string().min(1, "Número obrigatório"),
  endereco_coleta: z.string().min(1, "Endereço obrigatório"),
  contato_coleta: z.string().optional(),
  peso_estimado_kg: z.coerce.number().optional(),
  qtd_volumes: z.coerce.number().optional(),
  observacoes: z.string().optional(),
});

const fornecedorSchema = z.object({
  razao_social: z.string().min(1, "Razão social obrigatória"),
  endereco_completo: z.string().min(1, "Endereço obrigatório"),
  cnpj: z.string().optional(),
  nome_fantasia: z.string().optional(),
  contato_nome: z.string().optional(),
  contato_email: z.string().email().optional().or(z.literal("")),
  contato_telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
});

const clienteSchema = z.object({
  razao_social: z.string().min(1, "Razão social obrigatória"),
  endereco_completo: z.string().min(1, "Endereço obrigatório"),
  cnpj: z.string().optional(),
  nome_fantasia: z.string().optional(),
  contato_nome: z.string().optional(),
  contato_email: z.string().email().optional().or(z.literal("")),
  contato_telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
});

const entregaCols = [
  { key: "numero_entrega", label: "Número", example: "ENT-001" },
  { key: "endereco_entrega", label: "Endereço", example: "Rua A, 123" },
  { key: "nf_remessa", label: "NF", example: "NF-12345" },
  { key: "valor_frete", label: "Valor Frete", example: "150.00" },
  { key: "previsao_entrega", label: "Previsão", example: "2026-04-01" },
  { key: "observacoes", label: "Observações", example: "" },
];

const coletaCols = [
  { key: "numero_coleta", label: "Número", example: "COL-001" },
  { key: "endereco_coleta", label: "Endereço", example: "Rua B, 456" },
  { key: "contato_coleta", label: "Contato", example: "João" },
  { key: "peso_estimado_kg", label: "Peso (kg)", example: "50" },
  { key: "qtd_volumes", label: "Volumes", example: "3" },
  { key: "observacoes", label: "Observações", example: "" },
];

const fornecedorCols = [
  { key: "razao_social", label: "Razão Social", example: "Fornecedor LTDA" },
  { key: "endereco_completo", label: "Endereço", example: "Rua C, 789" },
  { key: "cnpj", label: "CNPJ", example: "12.345.678/0001-90" },
  { key: "nome_fantasia", label: "Nome Fantasia", example: "Fornecedor" },
  { key: "contato_nome", label: "Contato", example: "Maria" },
  { key: "contato_email", label: "Email", example: "email@fornecedor.com" },
  { key: "contato_telefone", label: "Telefone", example: "(11) 99999-9999" },
  { key: "cidade", label: "Cidade", example: "São Paulo" },
  { key: "estado", label: "Estado", example: "SP" },
  { key: "cep", label: "CEP", example: "01001-000" },
];

const clienteCols = [
  { key: "razao_social", label: "Razão Social", example: "Cliente LTDA" },
  { key: "endereco_completo", label: "Endereço", example: "Av. D, 321" },
  { key: "cnpj", label: "CNPJ", example: "98.765.432/0001-10" },
  { key: "nome_fantasia", label: "Nome Fantasia", example: "Cliente" },
  { key: "contato_nome", label: "Contato", example: "João" },
  { key: "contato_email", label: "Email", example: "email@cliente.com" },
  { key: "contato_telefone", label: "Telefone", example: "(21) 88888-8888" },
  { key: "cidade", label: "Cidade", example: "Rio de Janeiro" },
  { key: "estado", label: "Estado", example: "RJ" },
  { key: "cep", label: "CEP", example: "20040-020" },
];

type ImportEntity = "entregas" | "coletas" | "fornecedores" | "clientes";

interface ImportFailure {
  registro: number;
  motivo: string;
}

interface ImportStats {
  entity: string;
  total: number;
  success: number;
  errors: number;
  timestamp: Date;
  falhas: ImportFailure[];
}

// A mensagem do PostgREST pode carregar os valores da linha no campo `details`
// (ex.: "Key (cnpj)=(123) already exists."). Guardamos apenas `message`, que
// descreve a regra violada sem expor dado da planilha (LGPD).
function motivoDoErro(error: { message: string; code?: string }): string {
  if (error.code === "23505") {
    return "Registro duplicado: já existe um registro com esse identificador";
  }
  return error.message;
}

// Reprocessa um lote condenado linha a linha. O Postgres aborta a instrução
// inteira na primeira violação, então nenhuma linha do lote entrou e
// reprocessar é seguro — sem isso, 1 linha ruim condena as outras 49.
async function inserirLoteIndividualmente(
  entity: ImportEntity,
  batch: Record<string, unknown>[],
  offset: number,
  falhas: ImportFailure[],
): Promise<{ ok: number; comErro: number }> {
  let ok = 0;
  let comErro = 0;
  for (let j = 0; j < batch.length; j++) {
    const { error: rowError } = await supabase
      .from(entity)
      .insert([batch[j]] as never[]);
    if (rowError) {
      comErro++;
      falhas.push({ registro: offset + j + 1, motivo: motivoDoErro(rowError) });
    } else {
      ok++;
    }
  }
  return { ok, comErro };
}

export default function ImportacaoMassa() {
  const queryClient = useQueryClient();
  const [history, setHistory] = useState<ImportStats[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [ultimaImportacao, setUltimaImportacao] = useState<ImportStats | null>(
    null,
  );
  const { exportToCSV } = useExport();

  const importSteps = [
    { title: "Seleção", description: "Escolha o tipo de dados" },
    { title: "Upload", description: "Envie seu arquivo" },
    { title: "Processamento", description: "Importando para o sistema" },
    { title: "Finalizado", description: "Veja os resultados" },
  ];

  const handleImport = async (
    entity: ImportEntity,
    data: Record<string, unknown>[],
  ) => {
    setIsImporting(true);
    setImportProgress(0);
    setCurrentStep(2); // Processamento

    setUltimaImportacao(null);
    let successCount = 0;
    let errorCount = 0;
    const falhas: ImportFailure[] = [];
    const batchSize = 50;

    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const { error } = await supabase.from(entity).insert(batch as never[]);

        if (error) {
          const r = await inserirLoteIndividualmente(entity, batch, i, falhas);
          successCount += r.ok;
          errorCount += r.comErro;
        } else {
          successCount += batch.length;
        }

        const progress = Math.min(((i + batchSize) / data.length) * 100, 100);
        setImportProgress(progress);
      }

      const stat: ImportStats = {
        entity,
        total: data.length,
        success: successCount,
        errors: errorCount,
        timestamp: new Date(),
        falhas,
      };
      setHistory((h) => [stat, ...h]);
      setUltimaImportacao(stat);
      setImportProgress(100);
      setCurrentStep(3); // Finalizado

      if (errorCount === 0) {
        toast.success(`${successCount} registros importados com sucesso!`);
      } else if (successCount > 0) {
        toast.warning(`${successCount} importados, ${errorCount} falharam`);
      } else {
        toast.error(`Falha ao importar ${errorCount} registros`);
      }

      // Invalidate related caches so list pages reflect the new data
      queryClient.invalidateQueries({ queryKey: [entity] });

      // Reset step after some time
      setTimeout(() => setCurrentStep(0), 5000);
    } catch {
      toast.error("Erro inesperado durante a importação");
      setCurrentStep(0);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportFalhas = () => {
    if (!ultimaImportacao) return;
    exportToCSV(
      ultimaImportacao.falhas.map((f) => ({
        Registro: f.registro,
        Motivo: f.motivo,
      })),
      { filename: `falhas_${ultimaImportacao.entity}` },
    );
  };

  const entities: {
    id: ImportEntity;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "entregas", label: "Entregas", icon: Package },
    { id: "coletas", label: "Coletas", icon: Truck },
    { id: "fornecedores", label: "Fornecedores", icon: Building2 },
    { id: "clientes", label: "Clientes", icon: Users },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-display flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            Importação em Massa
          </h1>
          <p className="text-muted-foreground mt-1">
            Importe dados via CSV ou Excel com validação automática
          </p>
        </div>

        <Card className="mb-6 overflow-hidden border-primary/20">
          <CardContent className="p-0">
            <Stepper
              steps={importSteps}
              currentStep={currentStep}
              className="px-6 py-8"
            />

            {isImporting && (
              <div className="px-6 pb-6 animate-in fade-in duration-500">
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-primary">Processando registros...</span>
                  <span>{importProgress.toFixed(0)}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="entregas" onValueChange={() => setCurrentStep(1)}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            {entities.map((e) => (
              <TabsTrigger
                key={e.id}
                value={e.id}
                className="flex items-center gap-2"
              >
                <e.icon className="w-4 h-4" />
                {e.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="entregas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Importar CSV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CSVImporter
                    schema={entregaSchema}
                    columns={entregaCols}
                    templateName="entregas"
                    onImport={(data) => handleImport("entregas", data)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Excel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExcelImporter
                    schema={entregaSchema}
                    templateName="entregas"
                    onImport={(data) => handleImport("entregas", data)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coletas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Importar CSV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CSVImporter
                    schema={coletaSchema}
                    columns={coletaCols}
                    templateName="coletas"
                    onImport={(data) => handleImport("coletas", data)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Excel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExcelImporter
                    schema={coletaSchema}
                    templateName="coletas"
                    onImport={(data) => handleImport("coletas", data)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fornecedores" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Importar CSV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CSVImporter
                    schema={fornecedorSchema}
                    columns={fornecedorCols}
                    templateName="fornecedores"
                    onImport={(data) => handleImport("fornecedores", data)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Excel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExcelImporter
                    schema={fornecedorSchema}
                    templateName="fornecedores"
                    onImport={(data) => handleImport("fornecedores", data)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clientes" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Importar CSV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CSVImporter
                    schema={clienteSchema}
                    columns={clienteCols}
                    templateName="clientes"
                    onImport={(data) => handleImport("clientes", data)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Excel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExcelImporter
                    schema={clienteSchema}
                    templateName="clientes"
                    onImport={(data) => handleImport("clientes", data)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Falhas da última importação */}
        {ultimaImportacao && ultimaImportacao.falhas.length > 0 && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                {ultimaImportacao.falhas.length} registro(s) não importado(s)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                O número indica a posição do registro entre os{" "}
                {ultimaImportacao.total} registros válidos enviados. Linhas com
                erro de formato são recusadas antes desta etapa.
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {ultimaImportacao.falhas.slice(0, 50).map((f) => (
                  <p
                    key={`${f.registro}-${f.motivo}`}
                    className="text-xs border-b border-destructive/10 py-1 last:border-0"
                  >
                    <span className="font-semibold">
                      Registro {f.registro}:
                    </span>{" "}
                    <span className="text-muted-foreground">{f.motivo}</span>
                  </p>
                ))}
                {ultimaImportacao.falhas.length > 50 && (
                  <p className="text-xs text-muted-foreground italic">
                    + {ultimaImportacao.falhas.length - 50} registro(s)
                    oculto(s) — baixe o CSV para ver todos.
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleExportFalhas}>
                <Download className="w-4 h-4 mr-2" />
                Baixar CSV das falhas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Import History */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Histórico de Importações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {h.errors === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{h.entity}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{h.success} importados</Badge>
                    {h.errors > 0 && (
                      <Badge variant="destructive">{h.errors} erros</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
