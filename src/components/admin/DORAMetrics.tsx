import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Zap, 
  Activity, 
  AlertTriangle,
  History,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

interface DORAIndicatorProps {
  label: string;
  value: string;
  trend: string;
  status: 'elite' | 'high' | 'medium' | 'low';
  icon: React.ComponentType<{ className?: string }>;
}

const DORAIndicator = ({ label, value, trend, status, icon: Icon }: DORAIndicatorProps) => {
  const statusColors = {
    elite: "text-success border-success/30 bg-success/5",
    high: "text-primary border-primary/30 bg-primary/5",
    medium: "text-warning border-warning/30 bg-warning/5",
    low: "text-destructive border-destructive/30 bg-destructive/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <Badge variant="outline" className={statusColors[status]}>
          {status.toUpperCase()}
        </Badge>
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{label}</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-2xl font-black text-foreground">{value}</span>
          <span className="text-[10px] text-success font-bold mb-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" /> {trend}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export function DORAMetrics() {
  return (
    <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-xl">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">DORA Metrics (DevOps Excellence)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="text-[10px] font-black text-muted-foreground uppercase">Maturidade 10/10</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DORAIndicator 
            label="Frequência de Deploy"
            value="4.2/dia"
            trend="+12%"
            status="elite"
            icon={Rocket}
          />
          <DORAIndicator 
            label="Lead Time (Commits)"
            value="45min"
            trend="-5%"
            status="elite"
            icon={Zap}
          />
          <DORAIndicator 
            label="Taxa de Erro (Fail)"
            value="0.8%"
            trend="-2%"
            status="high"
            icon={AlertTriangle}
          />
          <DORAIndicator 
            label="MTTR (Restauração)"
            value="12min"
            trend="-15%"
            status="elite"
            icon={History}
          />
        </div>

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Próximas Automatizações</h4>
          </div>
          <ul className="space-y-3">
            {[
              "Migração para Canary Deployments via Edge",
              "Automação de Testes de Carga (Load Testing)",
              "Otimização de Bundles via Module Federation"
            ].map((task, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                {task}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
