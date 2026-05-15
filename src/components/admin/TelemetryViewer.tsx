import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Bug, 
  Clock, 
  Filter, 
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function TelemetryViewer() {
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["telemetry-logs", severityFilter],
    queryFn: async () => {
      let query = supabase
        .from("telemetry_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (severityFilter) {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "error":
        return <Bug className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "error":
        return <Badge className="bg-red-500 hover:bg-red-600">Erro</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Aviso</Badge>;
      default:
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Info</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {severityFilter ? `Severidade: ${severityFilter}` : "Todas Severidades"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSeverityFilter(null)}>
                Todas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter("critical")}>
                Crítico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter("error")}>
                Erro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter("warning")}>
                Aviso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSeverityFilter("info")}>
                Info
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Exibindo os últimos 100 eventos
        </p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Data/Hora</TableHead>
              <TableHead className="w-[100px]">Severidade</TableHead>
              <TableHead className="w-[150px]">Categoria</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Carregando logs de telemetria...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && logs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && logs && logs.length > 0 && (
              logs?.map((log) => (
                <TableRow key={log.id} className="group">
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(log.severity)}
                      {getSeverityBadge(log.severity)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {log.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[400px] truncate font-medium text-sm">
                      {log.message}
                    </div>
                    {log.url && (
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <ExternalLink className="w-2.5 h-2.5" />
                        {log.url}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
