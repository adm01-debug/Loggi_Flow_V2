import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, BellRing, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useSecurityPushNotifications } from '@/hooks/useSecurityPushNotifications';

export function SecurityNotificationSettings() {
  const { isEnabled, permission, requestPermission } = useSecurityPushNotifications();

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          text: 'Ativadas',
          color: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
      case 'denied':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          text: 'Bloqueadas',
          color: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          text: 'Não configurado',
          color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        };
    }
  };

  const status = getPermissionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          Notificações Push de Segurança
        </CardTitle>
        <CardDescription>
          Receba alertas em tempo real sobre eventos de segurança importantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <Bell className="h-8 w-8 text-primary" />
            ) : (
              <BellOff className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Status das Notificações</p>
              <Badge variant="outline" className={status.color}>
                {status.icon}
                <span className="ml-1">{status.text}</span>
              </Badge>
            </div>
          </div>
          {permission !== 'granted' && permission !== 'denied' && (
            <Button onClick={requestPermission}>
              Ativar Notificações
            </Button>
          )}
          {permission === 'denied' && (
            <p className="text-sm text-muted-foreground max-w-xs">
              As notificações foram bloqueadas. Para ativá-las, acesse as configurações do seu navegador.
            </p>
          )}
        </div>

        {/* Event Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Tipos de Alertas</h4>
          <div className="space-y-3">
            {[
              { id: 'new_device', label: 'Novo dispositivo detectado', description: 'Quando um login ocorre de um dispositivo desconhecido', enabled: true },
              { id: 'failed_login', label: 'Tentativas de login falhadas', description: 'Quando há tentativas de login mal-sucedidas', enabled: true },
              { id: 'password_change', label: 'Alteração de senha', description: 'Quando sua senha é alterada', enabled: true },
              { id: 'mfa_change', label: 'Alteração de MFA', description: 'Quando o MFA é ativado ou desativado', enabled: true },
              { id: 'suspicious', label: 'Atividade suspeita', description: 'Quando comportamento incomum é detectado', enabled: true },
              { id: 'rate_limit', label: 'Rate limit excedido', description: 'Quando um IP é bloqueado por excesso de requisições', enabled: true },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="space-y-0.5">
                  <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={item.enabled && isEnabled}
                  disabled={!isEnabled}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
          <div className="flex gap-3">
            <Bell className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-500">
                Notificações em Tempo Real
              </p>
              <p className="text-xs text-muted-foreground">
                As notificações push são enviadas instantaneamente quando eventos de segurança
                são detectados. Mantenha a aba aberta para receber alertas em tempo real,
                mesmo quando estiver em outra aba ou aplicativo.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
