/* eslint-disable max-lines */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

type Entidade = "entregas" | "cotacoes" | "fretes_internos";

interface Transportadora {
  id: string;
  nome_fantasia: string;
}

interface Row {
  id: string;
  numero: string;
  data: string | null;
  transportadora: string;
  status: string;
  origem_destino: string;
  valor: number | null;
  extra: string;
}

const ENTIDADE_LABEL: Record<Entidade, string> = {
  entregas: "Entregas",
  cotacoes: "Cotações de frete",
  fretes_internos: "Fretes internos",
};

export default function ExportacaoDados() {
  const { user } = useAuth();
  const hoje = new Date();
  const [entidade, setEntidade] = useState<Entidade>("entregas");
  const [dataInicio, setDataInicio] = useState<string>(
    format(startOfMonth(hoje), "yyyy-MM-dd"),
  );
  const [dataFim, setDataFim] = useState<string>(
    format(endOfMonth(hoje), "yyyy-MM-dd"),
  );
  const [transportadoraId, setTransportadoraId] = useState<string>("todas");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "Exportação de Dados | LogiFlow";
    return () => {
      document.title = prev;
    };
  }, []);

  const { data: transportadoras } = useQuery({
    queryKey: ["export-transportadoras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transportadoras")
        .select("id, nome_fantasia")
        .is("deleted_at", null)
        .order("nome_fantasia", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Transportadora[];
    },
    enabled: !!user?.id,
  });

  const {
    data: rows,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["export-rows", entidade, dataInicio, dataFim, transportadoraId],
    queryFn: async (): Promise<Row[]> => {
      const inicioIso = new Date(`${dataInicio}T00:00:00`).toISOString();
      const fimIso = new Date(`${dataFim}T23:59:59`).toISOString();

      if (entidade === "entregas") {
        let q = supabase
          .from("entregas")
          .select(
            `id, numero_entrega, status, created_at, endereco_entrega, valor_frete,
             transportadora:transportadoras (nome_fantasia),
             cliente:clientes (razao_social)`,
          )
          .is("deleted_at", null)
          .gte("created_at", inicioIso)
          .lte("created_at", fimIso)
          .order("created_at", { ascending: false })
          .limit(5000);
        if (transportadoraId !== "todas")
          q = q.eq("transportadora_id", transportadoraId);
        const { data, error } = await q;
        if (error) throw error;
        return (data ?? []).map((e) => {
          const t = e.transportadora as { nome_fantasia?: string } | null;
          const c = e.cliente as { razao_social?: string } | null;
          return {
            id: e.id,
            numero: e.numero_entrega,
            data: e.created_at,
            transportadora: t?.nome_fantasia || "—",
            status: e.status,
            origem_destino: `${c?.razao_social || "Cliente"} → ${e.endereco_entrega}`,
            valor: e.valor_frete !== null ? Number(e.valor_frete) : null,
            extra: "",
          };
        });
      }

      if (entidade === "cotacoes") {
        let q = supabase
          .from("cotacoes_frete")
          .select(
            `id, valor, prazo_dias, selecionada, created_at,
             transportadora:transportadoras (nome_fantasia),
             entrega:entregas (numero_entrega, endereco_entrega, status)`,
          )
          .gte("created_at", inicioIso)
          .lte("created_at", fimIso)
          .order("created_at", { ascending: false })
          .limit(5000);
        if (transportadoraId !== "todas")
          q = q.eq("transportadora_id", transportadoraId);
        const { data, error } = await q;
        if (error) throw error;
        return (data ?? []).map((c) => {
          const t = c.transportadora as { nome_fantasia?: string } | null;
          const en = c.entrega as {
            numero_entrega?: string;
            endereco_entrega?: string;
            status?: string;
          } | null;
          return {
            id: c.id,
            numero: en?.numero_entrega || c.id.slice(0, 8),
            data: c.created_at,
            transportadora: t?.nome_fantasia || "—",
            status: c.selecionada ? "selecionada" : "pendente",
            origem_destino: en?.endereco_entrega || "—",
            valor: c.valor !== null ? Number(c.valor) : null,
            extra: c.prazo_dias ? `${c.prazo_dias} dias` : "",
          };
        });
      }

      // fretes_internos (não possui transportadora); excluídos não entram no extrato
      const { data, error } = await supabase
        .from("fretes_internos")
        .select(
          "id, origem, destino, motorista, status, previsao_entrega, created_at, quantidade_itens",
        )
        .is("deleted_at", null)
        .gte("created_at", inicioIso)
        .lte("created_at", fimIso)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []).map((f) => ({
        id: f.id,
        numero: f.id.slice(0, 8).toUpperCase(),
        data: f.created_at,
        transportadora: f.motorista || "Interno",
        status: f.status,
        origem_destino: `${f.origem} → ${f.destino}`,
        valor: null,
        extra: `${f.quantidade_itens} item(ns)`,
      }));
    },
    enabled: !!user?.id,
  });

  const summary = useMemo(() => {
    const total = rows?.length ?? 0;
    const valor = (rows ?? []).reduce((sum, r) => sum + (r.valor ?? 0), 0);
    return { total, valor };
  }, [rows]);

  const buildFilename = () => {
    const t =
      transportadoraId === "todas"
        ? "todas"
        : (transportadoras
            ?.find((x) => x.id === transportadoraId)
            ?.nome_fantasia?.replace(/\s+/g, "_")
            .toLowerCase() ?? "carrier");
    return `${entidade}_${dataInicio}_a_${dataFim}_${t}`;
  };

  const buildExportRows = () => {
    return (rows ?? []).map((r) => ({
      Número: r.numero,
      Data: r.data ? format(parseISO(r.data), "dd/MM/yyyy HH:mm") : "—",
      Transportadora: r.transportadora,
      Status: r.status,
      "Origem → Destino": r.origem_destino,
      Valor: r.valor !== null ? `R$ ${r.valor.toFixed(2)}` : "—",
      Detalhes: r.extra,
    }));
  };

  const handleExportCSV = async () => {
    if (!rows || rows.length === 0) {
      toast.warning("Nenhum dado para exportar");
      return;
    }
    setExporting("csv");
    try {
      exportToCSV(buildExportRows(), buildFilename());
      toast.success(`${rows.length} registros exportados em CSV`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!rows || rows.length === 0) {
      toast.warning("Nenhum dado para exportar");
      return;
    }
    setExporting("pdf");
    try {
      const data = buildExportRows();
      exportToPDF(
        data,
        [
          "Número",
          "Data",
          "Transportadora",
          "Status",
          "Origem → Destino",
          "Valor",
          "Detalhes",
        ],
        buildFilename(),
      );
      toast.success(`${rows.length} registros exportados em PDF`);
    } finally {
      setExporting(null);
    }
  };

  if (isError) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <EmptyState
          variant="error"
          title="Erro ao carregar dados"
          description={
            error?.message ||
            "Não foi possível carregar os dados para exportação. Tente novamente."
          }
          action={{
            label: "Tentar novamente",
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Download className="h-8 w-8 text-primary" />
          Exportação de Dados
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere relatórios em CSV e PDF de fretes, cotações e entregas por
          período e transportadora.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Tipo de dado</Label>
            <Select
              value={entidade}
              onValueChange={(v) => setEntidade(v as Entidade)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entregas">Entregas</SelectItem>
                <SelectItem value="cotacoes">Cotações de frete</SelectItem>
                <SelectItem value="fretes_internos">Fretes internos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data inicial</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data final</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Transportadora</Label>
            <Select
              value={transportadoraId}
              onValueChange={setTransportadoraId}
              disabled={entidade === "fretes_internos"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {(transportadoras ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4 flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Filter className="h-4 w-4 mr-2" />
              )}
              Atualizar prévia
            </Button>
            <div className="flex-1" />
            <Button
              onClick={handleExportCSV}
              disabled={!rows || rows.length === 0 || exporting !== null}
              className="gap-2"
            >
              {exporting === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Exportar CSV
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportPDF}
              disabled={!rows || rows.length === 0 || exporting !== null}
              className="gap-2"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Prévia — {ENTIDADE_LABEL[entidade]}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {summary.total} registro(s)
            {summary.valor > 0 && (
              <span className="ml-4">
                Total: <strong>R$ {summary.valor.toFixed(2)}</strong>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            if (isLoading)
              return (
                <div className="p-8 text-center text-muted-foreground">
                  Carregando…
                </div>
              );
            if (!rows || rows.length === 0)
              return (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum registro encontrado para o filtro atual.
                </div>
              );
            return (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Transportadora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Origem → Destino</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 100).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">
                          {r.numero}
                        </TableCell>
                        <TableCell>
                          {r.data
                            ? format(parseISO(r.data), "dd/MM/yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>{r.transportadora}</TableCell>
                        <TableCell className="capitalize">
                          {r.status.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell
                          className="max-w-[300px] truncate"
                          title={r.origem_destino}
                        >
                          {r.origem_destino}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.valor !== null ? `R$ ${r.valor.toFixed(2)}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rows.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Exibindo 100 de {rows.length} registros. A exportação inclui
                    todos.
                  </p>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
