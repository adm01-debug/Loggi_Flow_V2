import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Smartphone, 
  Globe, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  Users,
  Key,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SecurityStats {
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
  securityScore: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export function SecurityOverviewPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SecurityStats>({
    totalSessions: 0,
    activeSessions: 0,
    knownDevices: 0,
    trustedDevices: 0,
    recentLoginAttempts: 0,
    failedLoginAttempts: 0,
    securityEventsToday: 0,
    criticalEvents: 0,
    blockedIPs: 0,
    mfaEnabled: false,
    lastSecurityEvent: null,
    securityScore: 0,
  });
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchSecurityStats();
    }
  }, [user?.id]);

  const fetchSecurityStats = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [
        sessionsResult,
        devicesResult,
        loginAttemptsResult,
        securityEventsResult,
        blockedIPsResult,
      ] = await Promise.all([
        supabase.from('user_sessions').select('*', { count: 'exact' }),
        supabase.from('known_devices').select('*', { count: 'exact' }),
        supabase.from('login_attempts').select('*').gte('created_at', last7d.toISOString()),
        supabase.from('security_events').select('*').gte('created_at', today.toISOString()),
        supabase.from('rate_limit_logs').select('*', { count: 'exact' }).eq('blocked', true).gte('created_at', last24h.toISOString()),
      ]);

      const sessions = sessionsResult.data || [];
      const devices = devicesResult.data || [];
      const loginAttempts = loginAttemptsResult.data || [];
      const securityEvents = securityEventsResult.data || [];

      const activeSessions = sessions.filter(s => s.is_current).length;
      const trustedDevices = devices.filter(d => d.is_trusted).length;
      const failedLogins = loginAttempts.filter(l => !l.success).length;
      const criticalEvents = securityEvents.filter(e => e.severity === 'critical' || e.severity === 'error').length;

      // Calculate security score
      let score = 50; // Base score
      
      // MFA check (placeholder - would need actual MFA status)
      const mfaEnabled = false; // This would come from actual MFA check
      if (mfaEnabled) score += 20;
      
      // Trusted devices ratio
      if (devices.length > 0) {
        const trustRatio = trustedDevices / devices.length;
        score += Math.round(trustRatio * 10);
      }
      
      // Failed login penalty
      if (failedLogins > 5) score -= 10;
      if (failedLogins > 10) score -= 10;
      
      // Critical events penalty
      if (criticalEvents > 0) score -= criticalEvents * 5;
      
      // Ensure score is between 0-100
      score = Math.max(0, Math.min(100, score));

      // Generate alerts based on data
      const newAlerts: SecurityAlert[] = [];
      
      if (failedLogins > 5) {
        newAlerts.push({
          id: 'failed-logins',
          type: 'login',
          message: `${failedLogins} tentativas de login falhadas nos últimos 7 dias`,
          severity: failedLogins > 10 ? 'critical' : 'warning',
          timestamp: new Date().toISOString(),
        });
      }
      
      if (criticalEvents > 0) {
        newAlerts.push({
          id: 'critical-events',
          type: 'security',
          message: `${criticalEvents} evento(s) crítico(s) de segurança hoje`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
        });
      }
      
      if (!mfaEnabled) {
        newAlerts.push({
          id: 'mfa-disabled',
          type: 'mfa',
          message: 'Autenticação de dois fatores não está ativada',
          severity: 'warning',
          timestamp: new Date().toISOString(),
        });
      }
      
      if (devices.length > 0 && trustedDevices === 0) {
        newAlerts.push({
          id: 'no-trusted',
          type: 'device',
          message: 'Nenhum dispositivo marcado como confiável',
          severity: 'info',
          timestamp: new Date().toISOString(),
        });
      }

      const lastEvent = securityEvents.length > 0 
        ? securityEvents[0].created_at 
        : null;

      setStats({
        totalSessions: sessions.length,
        activeSessions,
        knownDevices: devices.length,
        trustedDevices,
        recentLoginAttempts: loginAttempts.length,
        failedLoginAttempts: failedLogins,
        securityEventsToday: securityEvents.length,
        criticalEvents,
        blockedIPs: blockedIPsResult.count || 0,
        mfaEnabled,
        lastSecurityEvent: lastEvent,
        securityScore: score,
      });

      setAlerts(newAlerts);
    } catch {
      // Silent fail on security stats fetch
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-info/10 text-info border-info/20';
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Pontuação de Segurança
          </CardTitle>
          <CardDescription>
            Avaliação geral da segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${stats.securityScore * 2.83} 283`}
                  className={getScoreColor(stats.securityScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(stats.securityScore)}`}>
                  {stats.securityScore}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {stats.securityScore >= 60 ? (
                    <ShieldCheck className="h-5 w-5 text-success" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-warning" />
                  )}
                  <span className="font-medium">{getScoreLabel(stats.securityScore)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.securityScore >= 80 
                    ? 'Sua conta está bem protegida.' 
                    : stats.securityScore >= 60
                    ? 'Algumas melhorias são recomendadas.'
                    : 'Ação necessária para melhorar a segurança.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.mfaEnabled ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <Lock className="h-3 w-3 mr-1" />
                    MFA Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    <Unlock className="h-3 w-3 mr-1" />
                    MFA Inativo
                  </Badge>
                )}
                <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                  <Smartphone className="h-3 w-3 mr-1" />
                  {stats.knownDevices} dispositivo(s)
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <Users className="h-3 w-3 mr-1" />
                  {stats.activeSessions} sessão(ões) ativa(s)
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  {alert.severity === 'critical' ? (
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                  ) : alert.severity === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <Activity className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className="text-sm flex-1">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Sessions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalSessions} total
            </p>
            <Progress 
              value={stats.totalSessions > 0 ? (stats.activeSessions / stats.totalSessions) * 100 : 0} 
              className="mt-2 h-1" 
            />
          </CardContent>
        </Card>

        {/* Devices Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivos</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.knownDevices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.trustedDevices} confiável(is)
            </p>
            <div className="flex gap-1 mt-2">
              {[...Array(Math.min(stats.knownDevices, 5))].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i < stats.trustedDevices ? 'bg-success' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Login Attempts Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentativas de Login</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentLoginAttempts}</div>
            <div className="flex items-center gap-1 text-xs">
              {stats.failedLoginAttempts > 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">{stats.failedLoginAttempts} falharam</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  <span className="text-success">Todas bem-sucedidas</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">últimos 7 dias</p>
          </CardContent>
        </Card>

        {/* Security Events Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos de Segurança</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securityEventsToday}</div>
            <div className="flex items-center gap-1 text-xs">
              {stats.criticalEvents > 0 ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">{stats.criticalEvents} crítico(s)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  <span className="text-success">Nenhum crítico</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">hoje</p>
          </CardContent>
        </Card>

        {/* Blocked IPs Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs Bloqueados</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">
              nas últimas 24h
            </p>
          </CardContent>
        </Card>

        {/* MFA Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status MFA</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.mfaEnabled ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <span className="text-lg font-semibold text-success">Ativo</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-warning" />
                  <span className="text-lg font-semibold text-warning">Inativo</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.mfaEnabled ? 'Conta protegida' : 'Recomendado ativar'}
            </p>
          </CardContent>
        </Card>

        {/* Last Event Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Evento de Segurança</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.lastSecurityEvent ? (
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">
                  {formatDistanceToNow(new Date(stats.lastSecurityEvent), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum evento hoje</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as configurações de segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Lock className="h-4 w-4" />
              Configurar MFA
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Gerenciar Dispositivos
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              Regras de IP
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />
              Ver Eventos
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Key className="h-4 w-4" />
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
