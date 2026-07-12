import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScanSearch } from "lucide-react";
import { useSeqScanHotspots } from "../hooks/useSeqScanHotspots";

const severityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function SeqScanHotspotsCard() {
  const { data, isLoading, error } = useSeqScanHotspots();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScanSearch className="h-5 w-5 text-primary" />
          Hotspots de Seq Scan
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tabelas grandes onde o Postgres continua fazendo varreduras sequenciais — candidatas prioritárias a índices.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Erro ao carregar hotspots: {(error as Error).message}
          </p>
        )}
        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum hotspot detectado — todas as tabelas grandes estão bem indexadas. 🎉
          </p>
        )}
        {!isLoading && data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Tabela</th>
                  <th className="py-2 pr-4">Linhas</th>
                  <th className="py-2 pr-4">Tamanho</th>
                  <th className="py-2 pr-4">Seq Scans</th>
                  <th className="py-2 pr-4">Idx Scans</th>
                  <th className="py-2 pr-4">% Seq</th>
                  <th className="py-2 pr-4">Média/scan</th>
                  <th className="py-2">Severidade</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={`${row.schema_name}.${row.table_name}`}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2 pr-4 font-mono text-xs">{row.table_name}</td>
                    <td className="py-2 pr-4">{row.live_tuples.toLocaleString("pt-BR")}</td>
                    <td className="py-2 pr-4">{formatBytes(row.table_size_bytes)}</td>
                    <td className="py-2 pr-4">{row.seq_scan.toLocaleString("pt-BR")}</td>
                    <td className="py-2 pr-4">{row.idx_scan.toLocaleString("pt-BR")}</td>
                    <td className="py-2 pr-4 font-semibold">{row.seq_ratio}%</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {row.avg_tuples_per_scan.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2">
                      <Badge variant={severityVariant[row.severity]} className="uppercase text-[10px]">
                        {row.severity}
                      </Badge>
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
