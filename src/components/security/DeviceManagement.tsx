import { useDeviceSessions } from "@/hooks/useDeviceSessions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Smartphone, 
  Monitor, 
  Tablet, 
  LogOut, 
  MapPin,
  Clock,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeviceManagement() {
  const {
    sessions,
    currentSession,
    otherSessions,
    isLoading,
    revokeSession,
    revokeAllOtherSessions,
    isRevoking,
    isRevokingAll,
  } = useDeviceSessions();

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Dispositivos e Sessões
        </CardTitle>
        <CardDescription>
          Gerencie os dispositivos conectados à sua conta. Você pode encerrar sessões suspeitas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Session */}
        {currentSession && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Sessão Atual</h4>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-primary/10">
                  {getDeviceIcon(currentSession.device_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentSession.device_name}</span>
                    <Badge variant="default" className="text-xs">Atual</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    {currentSession.ip_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {currentSession.ip_address}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Ativo agora
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Outras Sessões ({otherSessions.length})
              </h4>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isRevokingAll}>
                    {isRevokingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Encerrar Todas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Encerrar Todas as Sessões?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá desconectar todos os outros dispositivos da sua conta. 
                      Você precisará fazer login novamente nesses dispositivos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => revokeAllOtherSessions()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Encerrar Todas
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-2">
              {otherSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted">
                      {getDeviceIcon(session.device_type)}
                    </div>
                    <div>
                      <span className="font-medium">{session.device_name}</span>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {session.ip_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.ip_address}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.last_active_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isRevoking}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Encerrar Esta Sessão?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O dispositivo será desconectado e precisará fazer login novamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeSession(session.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Encerrar Sessão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma sessão ativa encontrada.</p>
          </div>
        )}

        {/* Security Tips */}
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">
                Dica de Segurança
              </p>
              <p className="text-muted-foreground mt-1">
                Se você não reconhece algum dispositivo, encerre a sessão imediatamente 
                e altere sua senha. Considere ativar a autenticação de dois fatores.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
