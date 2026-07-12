import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Database, Play } from "lucide-react";
import { useIndexProposals, useApplyIndexProposal, useRejectIndexProposal } from "../hooks/useIndexProposals";

const statusColor: Record<string, string> = {
  proposed: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  approved: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  applied: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-muted text-muted-foreground",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabel: Record<string, string> = {
  proposed: "Proposto",
  approved: "Aprovado",
  applied: "Aplicado",
  rejected: "Rejeitado",
  failed: "Falhou",
};

export function IndexProposalsCard() {
  const { data, isLoading, error } = useIndexProposals();
  const apply = useApplyIndexProposal();
  const reject = useRejectIndexProposal();

  return (
    <Card className="card-raised">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Propostas de Índice
        </CardTitle>
        <CardDescription>
          Sugestões automáticas com aprovação humana. Apenas <code>CREATE INDEX IF NOT EXISTS</code> passa na whitelist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-40 w-full" />}
        {error && <p className="text-sm text-destructive">Erro ao carregar propostas.</p>}
        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma proposta ainda. Abra os detalhes de uma query no Top Queries para gerar uma.
          </p>
        )}
        {data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DDL</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-md">
                    <code className="text-xs font-mono block truncate">{p.ddl}</code>
                    {p.error_message && (
                      <p className="text-xs text-destructive mt-1">{p.error_message}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{p.target_table ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[p.status]}>
                      {statusLabel[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {(p.status === "proposed" || p.status === "approved") && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => apply.mutate(p.id)}
                          disabled={apply.isPending}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Aplicar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reject.mutate({ id: p.id })}
                          disabled={reject.isPending}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {p.status === "applied" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
