import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Package, Truck, Users, Building2, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { CSVImporter } from "@/components/common/CSVImporter";
import { ExcelImporter } from "@/components/common/ExcelImporter";
import { supabase } from "@/integrations/supabase/client";
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
  { key: "razao_social", label: "Razão Social", example: "Empresa LTDA" },
  { key: "endereco_completo", label: "Endereço", example: "Rua C, 789" },
  { key: "cnpj", label: "CNPJ", example: "12.345.678/0001-90" },
  { key: "nome_fantasia", label: "Nome Fantasia", example: "Empresa" },
  { key: "contato_nome", label: "Contato", example: "Maria" },
  { key: "contato_email", label: "Email", example: "email@empresa.com" },
  { key: "contato_telefone", label: "Telefone", example: "(11) 99999-9999" },
  { key: "cidade", label: "Cidade", example: "São Paulo" },
  { key: "estado", label: "Estado", example: "SP" },
  { key: "cep", label: "CEP", example: "01001-000" },
];

type ImportEntity = "entregas" | "coletas" | "fornecedores" | "clientes";

interface ImportStats {
  entity: string;
  total: number;
  success: number;
  errors: number;
  timestamp: Date;
}

export default function ImportacaoMassa() {
  const [history, setHistory] = useState<ImportStats[]>([]);

  const handleImport = async (entity: ImportEntity, data: any[]) => {
    const { error } = await supabase.from(entity).insert(data);
    if (error) throw error;
    
    const stat: ImportStats = {
      entity,
      total: data.length,
      success: data.length,
      errors: 0,
      timestamp: new Date(),
    };
    setHistory((h) => [stat, ...h]);
    toast.success(`${data.length} registros importados com sucesso!`);
  };

  const entities: { id: ImportEntity; label: string; icon: React.ElementType }[] = [
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
          <p className="text-muted-foreground mt-1">Importe dados via CSV ou Excel com validação automática</p>
        </div>

        <Tabs defaultValue="entregas">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            {entities.map((e) => (
              <TabsTrigger key={e.id} value={e.id} className="flex items-center gap-2">
                <e.icon className="w-4 h-4" />{e.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="entregas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Importar CSV</CardTitle></CardHeader>
                <CardContent>
                  <CSVImporter schema={entregaSchema} columns={entregaCols} templateName="entregas" onImport={(data) => handleImport("entregas", data)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />Importar Excel</CardTitle></CardHeader>
                <CardContent>
                  <ExcelImporter schema={entregaSchema} templateName="entregas" onImport={(data) => handleImport("entregas", data)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coletas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Importar CSV</CardTitle></CardHeader>
                <CardContent>
                  <CSVImporter schema={coletaSchema} columns={coletaCols} templateName="coletas" onImport={(data) => handleImport("coletas", data)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />Importar Excel</CardTitle></CardHeader>
                <CardContent>
                  <ExcelImporter schema={coletaSchema} templateName="coletas" onImport={(data) => handleImport("coletas", data)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fornecedores" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Importar CSV</CardTitle></CardHeader>
                <CardContent>
                  <CSVImporter schema={fornecedorSchema} columns={fornecedorCols} templateName="fornecedores" onImport={(data) => handleImport("fornecedores", data)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />Importar Excel</CardTitle></CardHeader>
                <CardContent>
                  <ExcelImporter schema={fornecedorSchema} templateName="fornecedores" onImport={(data) => handleImport("fornecedores", data)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clientes" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Importar CSV</CardTitle></CardHeader>
                <CardContent>
                  <CSVImporter schema={clienteSchema} columns={fornecedorCols} templateName="clientes" onImport={(data) => handleImport("clientes", data)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />Importar Excel</CardTitle></CardHeader>
                <CardContent>
                  <ExcelImporter schema={clienteSchema} templateName="clientes" onImport={(data) => handleImport("clientes", data)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Import History */}
        {history.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Histórico de Importações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {h.errors === 0 ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                    <div>
                      <p className="font-medium capitalize">{h.entity}</p>
                      <p className="text-xs text-muted-foreground">{h.timestamp.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{h.success} importados</Badge>
                    {h.errors > 0 && <Badge variant="destructive">{h.errors} erros</Badge>}
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
