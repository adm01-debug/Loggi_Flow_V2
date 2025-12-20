import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Smartphone,
  Monitor,
  Zap,
  TestTube
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { motion } from 'framer-motion';

export function PushNotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  } = usePushNotifications();

  const handleTestNotification = () => {
    sendLocalNotification('Teste de Notificação LogiFlow', {
      body: 'Esta é uma notificação de teste! As notificações push estão funcionando corretamente.',
      data: { url: '/' },
    });
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Notificações Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu navegador não suporta notificações push. 
              Tente usar Chrome, Firefox, Edge ou Safari em suas versões mais recentes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba alertas em tempo real mesmo quando o app está fechado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="p-2 rounded-full bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            ) : permission === 'denied' ? (
              <div className="p-2 rounded-full bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            )}
            <div>
              <p className="font-medium">
                {isSubscribed 
                  ? 'Notificações Ativas' 
                  : permission === 'denied' 
                    ? 'Permissão Negada' 
                    : 'Notificações Desativadas'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed 
                  ? 'Você receberá alertas em tempo real' 
                  : permission === 'denied'
                    ? 'Altere nas configurações do navegador'
                    : 'Ative para receber alertas importantes'
                }
              </p>
            </div>
          </div>
          <Badge variant={isSubscribed ? 'default' : 'secondary'}>
            {isSubscribed ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Permission Denied Alert */}
        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você bloqueou as notificações. Para ativá-las, clique no ícone de cadeado na barra de endereços 
              do navegador e altere a permissão de notificações para "Permitir".
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isSubscribed && permission !== 'denied' && (
            <Button 
              onClick={subscribe} 
              disabled={isLoading}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              {isLoading ? 'Ativando...' : 'Ativar Notificações'}
            </Button>
          )}

          {isSubscribed && (
            <>
              <Button 
                onClick={handleTestNotification}
                variant="outline"
                className="gap-2"
              >
                <TestTube className="h-4 w-4" />
                Testar Notificação
              </Button>
              <Button 
                onClick={unsubscribe}
                variant="destructive"
                disabled={isLoading}
                className="gap-2"
              >
                <BellOff className="h-4 w-4" />
                Desativar
              </Button>
            </>
          )}
        </div>

        {/* Features Section */}
        {isSubscribed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-4 border-t"
          >
            <h4 className="font-medium text-sm">Tipos de Notificação</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="push-entregas">Atualizações de Entregas</Label>
                </div>
                <Switch id="push-entregas" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="push-coletas">Alertas de Coletas</Label>
                </div>
                <Switch id="push-coletas" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="push-ocorrencias">Ocorrências Críticas</Label>
                </div>
                <Switch id="push-ocorrencias" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="push-sla">Alertas de SLA</Label>
                </div>
                <Switch id="push-sla" defaultChecked />
              </div>
            </div>
          </motion.div>
        )}

        {/* PWA Hint */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Dica: Instale o LogiFlow como app (PWA) para receber notificações mesmo com o navegador fechado.
            Clique em "Instalar" no menu do navegador ou no botão de instalação na barra de endereços.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
