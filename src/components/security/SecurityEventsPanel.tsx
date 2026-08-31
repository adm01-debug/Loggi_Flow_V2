import { useSecurityEvents } from "@/hooks/security/useSecurityEvents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  RefreshCw,
  Search,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export function SecurityEventsPanel() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { events, isLoading, stats, eventTypes, refetch } = useSecurityEvents({
    severity: severityFilter !== "all" ? severityFilter : undefined,
    eventType: typeFilter !== "all" ? typeFilter : undefined,
    limit: 200,
  });

  const filteredEvents = events.filter((event) =>
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.event_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-warning text-warning">Aviso</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      login_success: "Login bem-sucedido",
      login_failed: "Login falhou",
      logout: "Logout",
      mfa_enabled: "2FA ativado",
      mfa_disabled: "2FA desativado",
      password_changed: "Senha alterada",
      password_reset: "Reset de senha",
      ip_blocked: "IP bloqueado",
      rate_limit: "Rate limit atingido",
      permission_denied: "Permissão negada",
      suspicious_activity: "Atividade suspeita",
    };
    return labels[type] || type;
  };

  const exportEvents = () => {
    const csvContent = [
      ["Data/Hora", "Tipo", "Severidade", "Descrição", "IP", "User Agent"].join(","),
      ...filteredEvents.map((e) =>
        [
          format(new Date(e.created_at), "dd/MM/yyyy HH:mm:ss"),
          e.event_type,
          e.severity,
          `"${e.description.replace(/"/g, '""')}"`,
          e.ip_address || "",
          `"${(e.user_agent || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-events-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Eventos de Segurança
            </CardTitle>
            <CardDescription>
              Monitore atividades de segurança em tempo real
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportEvents}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats.last24hCount}</p>
              <p className="text-sm text-muted-foreground">Últimas 24h</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="text-2xl font-bold text-destructive">{stats.criticalLast7d}</p>
              <p className="text-sm text-muted-foreground">Críticos (7d)</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10">
              <p className="text-2xl font-bold text-warning">{stats.warningsLast7d}</p>
              <p className="text-sm text-muted-foreground">Avisos (7d)</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Aviso</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getEventTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum evento encontrado</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5">{getSeverityIcon(event.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {getEventTypeLabel(event.event_type)}
                        </span>
                        {getSeverityBadge(event.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>
                          {format(new Date(event.created_at), "dd/MM/yyyy HH:mm:ss", {
                            locale: ptBR,
                          })}
                        </span>
                        {event.ip_address && (
                          <span>IP: {event.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
