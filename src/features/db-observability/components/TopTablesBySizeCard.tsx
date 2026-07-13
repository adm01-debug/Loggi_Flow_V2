import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HardDrive } from "lucide-react";
import { useTopTablesBySize } from "../hooks/useTopTablesBySize";

function formatBytes(n: number) {
  if (!n) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

const severityVariant = (s: string): "destructive" | "default" | "outline" | "secondary" => {
  if (s === "critical") return "destructive";
  if (s === "warning") return "default";
  if (s === "info") return "outline";
  return "secondary";
};


export function TopTablesBySizeCard() {
  const { data, isLoading, error } = useTopTablesBySize(30);
  const totalGb =
    data?.reduce((acc, r) => acc + Number(r.total_bytes), 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Maiores Tabelas
          </CardTitle>
          <Badge variant="outline">Total: {formatBytes(totalGb)}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Ranking por tamanho (dados + índices + toast) e recomendação de ação.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            Erro: {(error as Error).message}
          </p>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2">Tabela</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Dados</th>
                  <th className="p-2">Índices</th>
                  <th className="p-2">TOAST</th>
                  <th className="p-2">Linhas (est.)</th>
                  <th className="p-2">Severidade</th>
                  <th className="p-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={`${row.schema_name}.${row.table_name}`}
                    className="border-b"
                  >
                    <td className="p-2 font-mono text-xs">{row.table_name}</td>
                    <td className="p-2 tabular-nums font-medium">
                      {formatBytes(row.total_bytes)}
                    </td>
                    <td className="p-2 tabular-nums">
                      {formatBytes(row.table_bytes)}
                    </td>
                    <td className="p-2 tabular-nums">
                      {formatBytes(row.indexes_bytes)}
                    </td>
                    <td className="p-2 tabular-nums">
                      {formatBytes(row.toast_bytes)}
                    </td>
                    <td className="p-2 tabular-nums">
                      {row.estimated_rows.toLocaleString("pt-BR")}
                    </td>
                    <td className="p-2">
                      <Badge variant={severityVariant(row.severity)}>
                        {row.severity}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground max-w-xs">
                      {row.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
