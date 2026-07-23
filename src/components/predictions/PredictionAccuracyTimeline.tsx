import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePredictionAccuracyDaily } from "@/hooks/logistics/usePredictionAccuracyDaily";

const TARGET_KEY = "prediction_accuracy_target";
const ALL = "__all__";

interface CarrierDailyRow {
  dia: string;
  transportadora: string;
  total_confirmadas: number;
  acertos: number;
  acuracia_pct: number | null;
}

function useCarrierDaily(carrier: string) {
  return useQuery({
    queryKey: ["prediction-accuracy-daily-carrier", carrier],
    enabled: carrier !== ALL,
    queryFn: async (): Promise<CarrierDailyRow[]> => {
      const { data, error } = await supabase
        .from("v_prediction_accuracy_daily_carrier" as never)
        .select("*")
        .eq("transportadora", carrier);
      if (error) throw error;
      return (data ?? []) as CarrierDailyRow[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

function useCarrierList() {
  return useQuery({
    queryKey: ["prediction-carriers-list"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("v_prediction_accuracy_daily_carrier" as never)
        .select("transportadora");
      if (error) throw error;
      const rows = (data ?? []) as Array<{ transportadora: string }>;
      return Array.from(new Set(rows.map((r) => r.transportadora))).sort();
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function PredictionAccuracyTimeline() {
  const [target, setTarget] = useState<number>(() => {
    const stored = Number(localStorage.getItem(TARGET_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : 80;
  });
  const [carrier, setCarrier] = useState<string>(ALL);

  const daily = usePredictionAccuracyDaily();
  const carriers = useCarrierList();
  const carrierSeries = useCarrierDaily(carrier);

  const rows = useMemo(
    () => (carrier === ALL ? daily.data ?? [] : carrierSeries.data ?? []),
    [carrier, daily.data, carrierSeries.data],
  );


  const chartData = useMemo(
    () =>
      rows.map((row) => ({
        dia: format(parseISO(row.dia), "dd/MM", { locale: ptBR }),
        acuracia: row.acuracia_pct ?? 0,
        confirmadas: row.total_confirmadas,
      })),
    [rows],
  );

  const lastRow = rows[rows.length - 1];
  const belowTarget =
    lastRow && lastRow.acuracia_pct !== null && lastRow.acuracia_pct < target;

  const handleTargetChange = (raw: string) => {
    const value = Math.max(0, Math.min(100, Number(raw) || 0));
    setTarget(value);
    localStorage.setItem(TARGET_KEY, String(value));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Acurácia das Predições (30d)</CardTitle>
              <CardDescription>Evolução diária da taxa de acerto da IA</CardDescription>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-56">
              <Label htmlFor="carrier-filter" className="text-xs">
                Transportadora
              </Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger id="carrier-filter" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {(carriers.data ?? []).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label htmlFor="target-input" className="text-xs">
                Meta (%)
              </Label>
              <Input
                id="target-input"
                type="number"
                min={0}
                max={100}
                value={target}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {belowTarget && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acurácia abaixo da meta</AlertTitle>
            <AlertDescription>
              A acurácia no último dia disponível ({lastRow.acuracia_pct}%) está abaixo da meta configurada
              ({target}%){carrier !== ALL ? ` para ${carrier}` : ""}. Revise fatores da IA ou tolerância calibrada.
            </AlertDescription>
          </Alert>
        )}
        {(() => {
          if (isLoading) {
            return <div className="h-[240px] w-full bg-muted/30 rounded animate-pulse" />;
          }
          if (chartData.length === 0) {
            return (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                Ainda não há predições confirmadas suficientes para exibir a série temporal.
              </div>
            );
          }
          return (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name) =>
                    name === "acuracia" ? [`${value}%`, "Acurácia"] : [value, "Confirmadas"]
                  }
                />
                <ReferenceLine
                  y={target}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="4 4"
                  label={{ value: `Meta ${target}%`, position: "insideTopRight", fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="acuracia"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
      </CardContent>
    </Card>
  );
}
