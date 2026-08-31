import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, AlertTriangle, FileWarning } from "lucide-react";

interface RuleTotal { rule: string; warnings: number; errors: number }
interface FileEntry {
  file: string;
  warnings: number;
  errors: number;
  tsErrors: number;
  rules: RuleTotal[];
}
interface Report {
  generatedAt: string;
  budget: { lintWarnings: number | null; lintErrors: number; tsErrors: number };
  totals: { files: number; warnings: number; errors: number };
  rules: RuleTotal[];
  files: FileEntry[];
}

const QualityGate = () => {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/quality-gate-report.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Report>;
      })
      .then(setReport)
      .catch((err) => setError((err as Error).message));
  }, []);

  const filteredFiles = useMemo(() => {
    if (!report) return [];
    const q = query.trim().toLowerCase();
    if (!q) return report.files.slice(0, 100);
    return report.files.filter((f) => f.file.toLowerCase().includes(q)).slice(0, 200);
  }, [report, query]);

  const budgetPct = useMemo(() => {
    if (!report?.budget.lintWarnings) return 0;
    return Math.min(100, (report.totals.warnings / report.budget.lintWarnings) * 100);
  }, [report]);

  const budgetOk = report ? report.totals.warnings <= (report.budget.lintWarnings ?? Infinity)
    && report.totals.errors <= report.budget.lintErrors + report.budget.tsErrors : true;

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <header className="flex items-center gap-3">
          {budgetOk ? (
            <ShieldCheck className="h-7 w-7 text-primary" aria-hidden />
          ) : (
            <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden />
          )}
          <div>
            <h1 className="text-2xl font-bold">Quality Gate</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhamento de warnings e erros de lint/TypeScript por arquivo.
            </p>
          </div>
        </header>

        {error && (
          <Card>
            <CardContent className="pt-6 text-sm text-destructive">
              Falha ao carregar relatório: {error}. Rode <code>npm run quality:report</code>.
            </CardContent>
          </Card>
        )}

        {report && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardDescription>Warnings</CardDescription></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{report.totals.warnings}</div>
                  <div className="text-xs text-muted-foreground">
                    Orçamento: {report.budget.lintWarnings ?? "—"}
                  </div>
                  {report.budget.lintWarnings != null && (
                    <Progress value={budgetPct} className="mt-3" />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Erros</CardDescription></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{report.totals.errors}</div>
                  <div className="text-xs text-muted-foreground">
                    Orçamento: {report.budget.lintErrors + report.budget.tsErrors}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Arquivos afetados</CardDescription></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{report.totals.files}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Última varredura</CardDescription></CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {new Date(report.generatedAt).toLocaleString("pt-BR")}
                  </div>
                  <Badge variant={budgetOk ? "secondary" : "destructive"} className="mt-2">
                    {budgetOk ? "Dentro do orçamento" : "Orçamento excedido"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" aria-hidden /> Top categorias
                </CardTitle>
                <CardDescription>Regras que mais contribuem para o débito.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Regra</TableHead>
                        <TableHead className="w-24 text-right">Warnings</TableHead>
                        <TableHead className="w-20 text-right">Erros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.rules.slice(0, 40).map((r) => (
                        <TableRow key={r.rule}>
                          <TableCell className="font-mono text-xs">{r.rule}</TableCell>
                          <TableCell className="text-right">{r.warnings}</TableCell>
                          <TableCell className="text-right">
                            {r.errors > 0 ? (
                              <span className="text-destructive font-medium">{r.errors}</span>
                            ) : r.errors}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5" aria-hidden /> Arquivos com mais achados
                </CardTitle>
                <CardDescription>
                  Ordenado por total (warnings + erros). Mostrando até 200 resultados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Filtrar por caminho…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <ScrollArea className="h-[520px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arquivo</TableHead>
                        <TableHead className="w-24 text-right">Warnings</TableHead>
                        <TableHead className="w-20 text-right">Erros</TableHead>
                        <TableHead>Top regras</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((f) => (
                        <TableRow key={f.file}>
                          <TableCell className="font-mono text-xs break-all">{f.file}</TableCell>
                          <TableCell className="text-right">{f.warnings}</TableCell>
                          <TableCell className="text-right">
                            {f.errors > 0 ? (
                              <span className="text-destructive font-medium">{f.errors}</span>
                            ) : f.errors}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {f.rules.slice(0, 3).map((r) => (
                                <Badge key={r.rule} variant="outline" className="text-[10px] font-mono">
                                  {r.rule} · {r.warnings + r.errors}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default QualityGate;
