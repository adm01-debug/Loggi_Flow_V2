import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity, 
  Loader2,
  CheckCircle,
  XCircle,
  Globe,
  Monitor
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export function LoginAttemptsLog() {
  const { isAdmin } = useAuth();

  const { data: attempts, isLoading } = useQuery({
    queryKey: ["login-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as LoginAttempt[];
    },
    enabled: isAdmin,
  });

  const successCount = attempts?.filter(a => a.success).length || 0;
  const failedCount = attempts?.filter(a => !a.success).length || 0;

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return "Desconhecido";
    
    // Simple browser detection
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Outro";
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Log de Tentativas de Login
        </CardTitle>
        <CardDescription>
          Últimas 50 tentativas de acesso ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sucesso</p>
              <p className="text-lg font-bold text-success">{successCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Falhas</p>
              <p className="text-lg font-bold text-destructive">{failedCount}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Navegador</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma tentativa de login registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  attempts?.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        {attempt.success ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sucesso
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                            <XCircle className="w-3 h-3 mr-1" />
                            Falha
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{attempt.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-mono">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {attempt.ip_address || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Monitor className="h-3 w-3 text-muted-foreground" />
                          {parseUserAgent(attempt.user_agent)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(attempt.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {attempt.failure_reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
