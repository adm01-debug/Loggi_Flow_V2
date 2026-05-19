import { useRateLimitLogs } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Gauge, 
  Ban, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Globe
} from "lucide-react";
import { format } from "date-fns";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RateLimitDashboardPanel() {
  const {
    logs,
    isLoading,
    stats,
    clearOldLogs,
    isClearing,
    blockIP,
    isBlocking,
  } = useRateLimitLogs();

  const blockedPercentage = stats.totalRequests > 0
    ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
                <p className="text-sm text-muted-foreground">Total de Requisições</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.blockedRequests}</p>
                <p className="text-sm text-muted-foreground">Bloqueadas ({blockedPercentage}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Globe className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueIPs}</p>
                <p className="text-sm text-muted-foreground">IPs Únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-info/10">
                <Gauge className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.topEndpoints.length}</p>
                <p className="text-sm text-muted-foreground">Endpoints Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Blocked IPs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              IPs Mais Bloqueados
            </CardTitle>
            <CardDescription>
              IPs com maior número de requisições bloqueadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topBlockedIPs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum IP bloqueado recentemente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topBlockedIPs.map((item) => (
                  <div
                    key={item.ip}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <code className="text-sm font-mono">{item.ip}</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.count} bloqueios
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => blockIP(item.ip)}
                      disabled={isBlocking}
                    >
                      {isBlocking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Blacklist
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Endpoints Mais Acessados
            </CardTitle>
            <CardDescription>
              Endpoints com maior número de requisições
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topEndpoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gauge className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum endpoint registrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topEndpoints.map((item) => (
                  <div
                    key={item.endpoint}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <code className="text-sm font-mono truncate max-w-[250px]">
                      {item.endpoint}
                    </code>
                    <Badge variant="secondary">{item.count} req</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Logs de Rate Limiting
              </CardTitle>
              <CardDescription>
                Últimas requisições monitoradas pelo rate limiter
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isClearing}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Antigos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar Logs Antigos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá remover todos os logs com mais de 7 dias. 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearOldLogs(7)}>
                      Limpar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Requisições</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 50).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.blocked ? (
                          <Badge variant="destructive">Bloqueado</Badge>
                        ) : (
                          <Badge variant="secondary">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{log.ip_address}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs truncate max-w-[200px] block">
                          {log.endpoint}
                        </code>
                      </TableCell>
                      <TableCell>{log.request_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
