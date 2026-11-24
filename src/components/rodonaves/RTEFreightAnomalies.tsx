import { useMemo, useState } from "react";
import { AlertTriangle, Clock, Loader2, Search, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRodonavesTracking } from "@/hooks/logistics/useRodonavesTracking";
import {
  evaluateFreightBatch,
  summarizeFreightHealth,
  type FreightAnomaly,
  type FreightHealth,
} from "@/lib/rodonaves/freightHealth";
import { EXCEPTION_LABELS, PHASE_LABELS } from "@/lib/rodonaves/eventCodes";
import { snapshotsFromBatchPayload } from "@/lib/rodonaves/occurrencePhase";

const FILTERS: Array<{ id: string; label: string; anomaly?: FreightAnomaly; delivered?: boolean }> = [
  { id: "risco", label: "Só com anomalia" },
  { id: "atrasado", label: "Atrasados", anomaly: "atrasado" },
  { id: "parado", label: "Parados", anomaly: "parado" },
  { id: "excecao", label: "Com exceção", anomaly: "excecao" },
  { id: "entregue", label: "Entregues", delivered: true },
  { id: "todos", label: "Todos" },
];

const SEVERITY_TONE: Record<string, string> = {
  critico: "bg-destructive/10 text-destructive border-destructive/30",
  atencao: "bg-warning/10 text-warning border-warning/30",
  info: "bg-primary/10 text-primary border-primary/30",
};

const SEVERITY_ORDER: Record<string, number> = { critico: 0, atencao: 1, info: 2 };

const ANOMALY_LABELS: Record<FreightAnomaly, string> = {
  atrasado: "Atrasado",
  parado: "Parado",
  excecao: "Exceção",
};

function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${Math.floor(hours / 24)} d ${Math.round(hours % 24)} h`;
}

export function RTEFreightAnomalies() {
  const rte = useRodonavesTracking();
  const [cnpj, setCnpj] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expectedDays, setExpectedDays] = useState(5);
  const [stalledHours, setStalledHours] = useState(48);
  const [filter, setFilter] = useState("risco");
  const [results, setResults] = useState<FreightHealth[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const summary = useMemo(() => summarizeFreightHealth(results), [results]);

  const visible = useMemo(() => {
    const selected = FILTERS.find((item) => item.id === filter);
    const filtered = results.filter((item) => {
      if (!selected) return true;
      if (selected.anomaly) return item.anomalies.includes(selected.anomaly);
      if (selected.delivered !== undefined) return item.delivered === selected.delivered;
      if (selected.id === "risco") return item.anomalies.length > 0;
      return true;
    });
    return [...filtered].sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3) ||
        b.businessDaysOverdue - a.businessDaysOverdue,
    );
  }, [results, filter]);

  const handleAnalyze = async () => {
    if (!cnpj || !startDate || !endDate) return;
    setError(null);
    try {
      const payload = await rte.trackBatchAsync({
        cnpjRemetente: cnpj,
        startDate,
        endDate,
        page: 1,
      });
      const extracted = snapshotsFromBatchPayload(payload, {
        expectedDeliveryDays: expectedDays,
      });
      setResults(evaluateFreightBatch(extracted.snapshots, { stalledHours }));
      setSkipped(extracted.skipped);
      setLoaded(true);
    } catch (err) {
      setResults([]);
      setSkipped(0);
      setLoaded(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h3 className="font-semibold">Anomalias de Frete</h3>
        <span className="text-xs text-muted-foreground">
          Atraso, frete parado e exceção calculados sobre o rastreio em lote
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="anomaly-cnpj">CNPJ Remetente *</Label>
          <Input
            id="anomaly-cnpj"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div>
          <Label htmlFor="anomaly-start">Data Início *</Label>
          <Input
            id="anomaly-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="anomaly-end">Data Fim *</Label>
          <Input
            id="anomaly-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="anomaly-days">Prazo padrão</Label>
            <Input
              id="anomaly-days"
              type="number"
              min={1}
              value={expectedDays}
              onChange={(e) => setExpectedDays(Number(e.target.value) || 5)}
            />
            <p className="text-[10px] text-muted-foreground">dias úteis</p>
          </div>
          <div>
            <Label htmlFor="anomaly-stalled">Parado após</Label>
            <Input
              id="anomaly-stalled"
              type="number"
              min={1}
              value={stalledHours}
              onChange={(e) => setStalledHours(Number(e.target.value) || 48)}
            />
            <p className="text-[10px] text-muted-foreground">horas</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleAnalyze}
          disabled={!cnpj || !startDate || !endDate || rte.isTrackingBatch}
        >
          {rte.isTrackingBatch ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Analisar período
        </Button>
        <span className="text-xs text-muted-foreground">
          O prazo padrão vale para fretes sem prazo no retorno da RTE.
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          Não foi possível analisar: {error}
        </p>
      )}

      {loaded && (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Fretes", value: summary.total },
              { label: "Em andamento", value: summary.inProgress },
              { label: "Atrasados", value: summary.delayed },
              { label: "Parados", value: summary.stalled },
              { label: "Exceções", value: summary.withExceptions },
              { label: "Críticos", value: summary.critical },
            ].map((stat) => (
              <div key={stat.label} className="p-3 border rounded-lg bg-card">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {skipped > 0 && (
            <p className="text-xs text-muted-foreground">
              {skipped} frete(s) sem data de emissão ou de evento não puderam ser
              avaliados e ficaram fora dos totais.
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {FILTERS.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={filter === item.id ? "default" : "outline"}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {results.length === 0
                ? "Nenhum frete retornado para o período."
                : "Nenhum frete no filtro selecionado."}
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Frete</th>
                    <th className="text-left p-2">Situação</th>
                    <th className="text-left p-2">Último evento</th>
                    <th className="text-right p-2">Dias úteis</th>
                    <th className="text-right p-2">Atraso</th>
                    <th className="text-right p-2">Sem evento</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2 font-medium">{item.id}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {item.anomalies.length === 0 && !item.delivered && (
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              Em dia
                            </Badge>
                          )}
                          {item.delivered && (
                            <Badge variant="outline" className="bg-success/10 text-success">
                              Entregue
                            </Badge>
                          )}
                          {item.anomalies.map((anomaly) => (
                            <Badge
                              key={anomaly}
                              variant="outline"
                              className={SEVERITY_TONE[item.severity]}
                            >
                              {ANOMALY_LABELS[anomaly]}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        {item.lastEvent ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {item.lastEvent.label}
                            {item.lastEvent.exception && (
                              <span className="text-muted-foreground">
                                ({EXCEPTION_LABELS[item.lastEvent.exception]})
                              </span>
                            )}
                            {!item.lastEvent.exception &&
                              item.lastEvent.phase !== "desconhecido" && (
                                <span className="text-muted-foreground">
                                  · {PHASE_LABELS[item.lastEvent.phase]}
                                </span>
                              )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Sem evento</span>
                        )}
                      </td>
                      <td className="p-2 text-right">{item.businessDaysElapsed}</td>
                      <td className="p-2 text-right">
                        {item.businessDaysOverdue > 0 ? (
                          <span className="text-destructive font-semibold">
                            +{item.businessDaysOverdue}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {formatHours(item.hoursSinceLastEvent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Taxa sem anomalia: {summary.healthyRate}% · Fretes aguardando retirada no
            destino não contam como parados.
          </p>
        </>
      )}
    </div>
  );
}
