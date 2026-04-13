import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Smartphone, Key, Activity, Globe, Lock, CheckCircle2, XCircle, TrendingDown, AlertTriangle, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SecurityStatsGridProps {
  totalSessions: number;
  activeSessions: number;
  knownDevices: number;
  trustedDevices: number;
  recentLoginAttempts: number;
  failedLoginAttempts: number;
  securityEventsToday: number;
  criticalEvents: number;
  blockedIPs: number;
  mfaEnabled: boolean;
  lastSecurityEvent: string | null;
}

export function SecurityStatsGrid(stats: SecurityStatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSessions}</div>
          <p className="text-xs text-muted-foreground">de {stats.totalSessions} total</p>
          <Progress value={stats.totalSessions > 0 ? (stats.activeSessions / stats.totalSessions) * 100 : 0} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Dispositivos</CardTitle><Smartphone className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.knownDevices}</div>
          <p className="text-xs text-muted-foreground">{stats.trustedDevices} confiável(is)</p>
          <div className="flex gap-1 mt-2">
            {[...Array(Math.min(stats.knownDevices, 5))].map((_, i) => (
              <div key={i} className={`h-2 w-2 rounded-full ${i < stats.trustedDevices ? 'bg-success' : 'bg-muted'}`} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tentativas de Login</CardTitle><Key className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentLoginAttempts}</div>
          <div className="flex items-center gap-1 text-xs">
            {stats.failedLoginAttempts > 0 ? <><TrendingDown className="h-3 w-3 text-destructive" /><span className="text-destructive">{stats.failedLoginAttempts} falharam</span></> : <><CheckCircle2 className="h-3 w-3 text-success" /><span className="text-success">Todas bem-sucedidas</span></>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">últimos 7 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Eventos de Segurança</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.securityEventsToday}</div>
          <div className="flex items-center gap-1 text-xs">
            {stats.criticalEvents > 0 ? <><AlertTriangle className="h-3 w-3 text-destructive" /><span className="text-destructive">{stats.criticalEvents} crítico(s)</span></> : <><CheckCircle2 className="h-3 w-3 text-success" /><span className="text-success">Nenhum crítico</span></>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">hoje</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">IPs Bloqueados</CardTitle><Globe className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.blockedIPs}</div>
          <p className="text-xs text-muted-foreground">nas últimas 24h</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Status MFA</CardTitle><Lock className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {stats.mfaEnabled ? <><CheckCircle2 className="h-6 w-6 text-success" /><span className="text-lg font-semibold text-success">Ativo</span></> : <><XCircle className="h-6 w-6 text-warning" /><span className="text-lg font-semibold text-warning">Inativo</span></>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{stats.mfaEnabled ? "Sua conta tem proteção extra" : "Recomendamos ativar"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Último Evento</CardTitle><Eye className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {stats.lastSecurityEvent ? formatDistanceToNow(new Date(stats.lastSecurityEvent), { addSuffix: true, locale: ptBR }) : "Nenhum"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">evento de segurança</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Dispositivos Confiáveis</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.trustedDevices}</div>
          <p className="text-xs text-muted-foreground">de {stats.knownDevices} conhecidos</p>
          <Progress value={stats.knownDevices > 0 ? (stats.trustedDevices / stats.knownDevices) * 100 : 0} className="mt-2 h-1" />
        </CardContent>
      </Card>
    </div>
  );
}
