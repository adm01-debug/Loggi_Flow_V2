import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, XCircle, Activity } from 'lucide-react';
import { SecurityScoreCard } from './SecurityScoreCard';
import { SecurityStatsGrid } from './SecurityStatsGrid';

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
    totalSessions: 0, activeSessions: 0, knownDevices: 0, trustedDevices: 0,
    recentLoginAttempts: 0, failedLoginAttempts: 0, securityEventsToday: 0,
    criticalEvents: 0, blockedIPs: 0, mfaEnabled: false, lastSecurityEvent: null, securityScore: 0,
  });
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSecurityStats = useCallback(async () => {

    setIsLoading(true);
    try {
      if (!user?.id) return;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const currentUserId = user.id;

      const sb = supabase as any;
      const sessionsResult = await sb.from('user_sessions').select('*', { count: 'exact' }).eq('user_id', currentUserId);
      const devicesResult = await sb.from('known_devices').select('*', { count: 'exact' }).eq('user_id', currentUserId);
      const loginAttemptsResult = await sb.from('login_attempts').select('*').eq('user_id', currentUserId).gte('created_at', last7d.toISOString());
      const securityEventsResult = await sb.from('security_events').select('*').eq('user_id', currentUserId).gte('created_at', today.toISOString());
      const blockedIPsResult = await sb.from('rate_limit_logs').select('*', { count: 'exact' }).eq('user_id', currentUserId).eq('blocked', true).gte('created_at', last24h.toISOString());

      const sessions = (sessionsResult.data ?? []) as Array<{ is_current?: boolean }>;
      const devices = (devicesResult.data ?? []) as Array<{ is_trusted?: boolean }>;
      const loginAttempts = (loginAttemptsResult.data ?? []) as Array<{ success?: boolean }>;
      const securityEvents = (securityEventsResult.data ?? []) as Array<{ severity?: string; created_at?: string }>;
      const activeSessions = sessions.filter(s => s.is_current).length;
      const trustedDevices = devices.filter(d => d.is_trusted).length;
      const failedLogins = loginAttempts.filter(l => !l.success).length;
      const criticalEvents = securityEvents.filter(e => e.severity === 'critical' || e.severity === 'error').length;

      let score = 50;
      const mfaEnabled = false;
      if (mfaEnabled) score += 20;
      if (devices.length > 0) score += Math.round((trustedDevices / devices.length) * 10);
      if (failedLogins > 5) score -= 10;
      if (failedLogins > 10) score -= 10;
      if (criticalEvents > 0) score -= criticalEvents * 5;
      score = Math.max(0, Math.min(100, score));

      const newAlerts: SecurityAlert[] = [];
      if (failedLogins > 5) newAlerts.push({ id: 'failed-logins', type: 'login', message: `${failedLogins} tentativas de login falhadas nos últimos 7 dias`, severity: failedLogins > 10 ? 'critical' : 'warning', timestamp: new Date().toISOString() });
      if (criticalEvents > 0) newAlerts.push({ id: 'critical-events', type: 'security', message: `${criticalEvents} evento(s) crítico(s) de segurança hoje`, severity: 'critical', timestamp: new Date().toISOString() });
      if (!mfaEnabled) newAlerts.push({ id: 'mfa-disabled', type: 'mfa', message: 'Autenticação de dois fatores não está ativada', severity: 'warning', timestamp: new Date().toISOString() });
      if (devices.length > 0 && trustedDevices === 0) newAlerts.push({ id: 'no-trusted', type: 'device', message: 'Nenhum dispositivo marcado como confiável', severity: 'info', timestamp: new Date().toISOString() });

      setStats({
        totalSessions: sessions.length, activeSessions, knownDevices: devices.length, trustedDevices,
        recentLoginAttempts: loginAttempts.length, failedLoginAttempts: failedLogins,
        securityEventsToday: securityEvents.length, criticalEvents, blockedIPs: blockedIPsResult.count || 0,
        mfaEnabled, lastSecurityEvent: securityEvents.length > 0 ? (securityEvents[0].created_at ?? null) : null, securityScore: score,
      });
      setAlerts(newAlerts);
    } catch {
      // silencia falha de leitura de estatísticas de segurança
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchSecurityStats();
  }, [user?.id, fetchSecurityStats]);



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
          <Card key={i} className="animate-pulse"><CardHeader className="pb-2"><div className="h-4 bg-muted rounded w-1/2" /></CardHeader><CardContent><div className="h-8 bg-muted rounded w-1/3" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SecurityScoreCard securityScore={stats.securityScore} mfaEnabled={stats.mfaEnabled} knownDevices={stats.knownDevices} activeSessions={stats.activeSessions} />

      {alerts.length > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-warning" />Alertas de Segurança</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                  {alert.severity === 'critical' ? <XCircle className="h-5 w-5 flex-shrink-0" /> : alert.severity === 'warning' ? <AlertTriangle className="h-5 w-5 flex-shrink-0" /> : <Activity className="h-5 w-5 flex-shrink-0" />}
                  <span className="text-sm flex-1">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <SecurityStatsGrid {...stats} />
    </div>
  );
}
