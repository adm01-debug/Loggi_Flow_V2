import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mail, MessageSquare } from "lucide-react";
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
import {
  useBreachDays,
  useDebouncedEffect,
  usePredictionAccuracySettings,
} from "@/hooks/logistics/usePredictionAccuracySettings";

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
  const [carrier, setCarrier] = useState<string>(ALL);
  const carrierKey = carrier === ALL ? null : carrier;

  const settings = usePredictionAccuracySettings(carrierKey);
  const target = settings.data?.target_pct ?? 80;
  const consecutiveAlert = settings.data?.consecutive_days_alert ?? 3;

  const [targetInput, setTargetInput] = useState<number>(target);
  const [daysInput, setDaysInput] = useState<number>(consecutiveAlert);

  useEffect(() => {
    setTargetInput(target);
    setDaysInput(consecutiveAlert);
  }, [target, consecutiveAlert]);

  useDebouncedEffect(
    () => {
      if (targetInput !== target || daysInput !== consecutiveAlert) {
        void settings.save({ target_pct: targetInput, consecutive_days_alert: daysInput });
      }
    },
    600,
    [targetInput, daysInput],
  );

  const daily = usePredictionAccuracyDaily();
  const carriers = useCarrierList();
  const carrierSeries = useCarrierDaily(carrier);
  const breach = useBreachDays(target, carrierKey);

  const rows = useMemo(
    () => (carrier === ALL ? daily.data ?? [] : carrierSeries.data ?? []),
    [carrier, daily.data, carrierSeries.data],
  );
  const isLoading = carrier === ALL ? daily.isLoading : carrierSeries.isLoading;

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

  const breachDays = breach.data ?? 0;
  const criticalStreak = breachDays >= consecutiveAlert && breachDays > 0;

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
          <div className="flex items-end gap-2 flex-wrap">
            <div className="w-56">
              <Label htmlFor="carrier-filter" className="text-xs">Transportadora</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger id="carrier-filter" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {(carriers.data ?? []).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label htmlFor="target-input" className="text-xs">Meta (%)</Label>
              <Input
                id="target-input"
                type="number"
                min={0}
                max={100}
                value={targetInput}
                onChange={(e) => setTargetInput(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="h-9"
              />
            </div>
            <div className="w-28">
              <Label htmlFor="days-input" className="text-xs">Alerta (dias)</Label>
              <Input
                id="days-input"
                type="number"
                min={1}
                max={30}
                value={daysInput}
                onChange={(e) => setDaysInput(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="h-9"
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="notify-email"
              checked={settings.data?.notify_email ?? false}
              onCheckedChange={(v) => void settings.save({ notify_email: v })}
            />
            <Label htmlFor="notify-email" className="text-xs">Email</Label>
            <Input
              type="email"
              placeholder="voce@empresa.com"
              defaultValue={settings.data?.email ?? ""}
              onBlur={(e) => {
                const v = e.target.value.trim() || null;
                if (v !== (settings.data?.email ?? null)) {
                  void settings.save({ email: v });
                }
              }}
              className="h-8 w-56"
              disabled={!(settings.data?.notify_email ?? false)}
            />
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="notify-wa"
              checked={settings.data?.notify_whatsapp ?? false}
              onCheckedChange={(v) => void settings.save({ notify_whatsapp: v })}
            />
            <Label htmlFor="notify-wa" className="text-xs">WhatsApp</Label>
            <Input
              type="tel"
              placeholder="11999998888"
              defaultValue={settings.data?.whatsapp_phone ?? ""}
              onBlur={(e) => {
                const v = e.target.value.trim() || null;
                if (v !== (settings.data?.whatsapp_phone ?? null)) {
                  void settings.save({ whatsapp_phone: v });
                }
              }}
              className="h-8 w-48"
              disabled={!(settings.data?.notify_whatsapp ?? false)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {criticalStreak && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Meta violada por {breachDays} dia(s) consecutivo(s)</AlertTitle>
            <AlertDescription>
              A acurácia está abaixo de {target}%{carrier !== ALL ? ` para ${carrier}` : ""} há {breachDays} dias seguidos
              (limite configurado: {consecutiveAlert}). Recomenda-se revisar tolerância calibrada ou fatores da IA.
            </AlertDescription>
          </Alert>
        )}
        {!criticalStreak && belowTarget && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acurácia abaixo da meta</AlertTitle>
            <AlertDescription>
              A acurácia no último dia disponível ({lastRow?.acuracia_pct}%) está abaixo da meta configurada
              ({target}%){carrier !== ALL ? ` para ${carrier}` : ""}.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2 flex-wrap text-xs">
          <Badge variant="outline">Meta: {target}%</Badge>
          <Badge variant="outline">Alerta a partir de: {consecutiveAlert} dias</Badge>
          <Badge variant={criticalStreak ? "destructive" : "secondary"}>
            Streak abaixo da meta: {breachDays} dia(s)
          </Badge>
        </div>
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
                  formatter={(value, name) =>
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
