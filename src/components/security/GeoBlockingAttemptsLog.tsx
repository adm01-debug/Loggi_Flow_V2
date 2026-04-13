import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GeoBlockedAttempt {
  id: string;
  ip_address: string;
  country_code: string | null;
  country_name: string | null;
  email: string | null;
  user_agent: string | null;
  created_at: string;
}

interface GeoBlockingAttemptsLogProps {
  attempts: GeoBlockedAttempt[];
}

export function GeoBlockingAttemptsLog({ attempts }: GeoBlockingAttemptsLogProps) {
  if (attempts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Tentativas Bloqueadas (Últimas 50)
        </CardTitle>
        <CardDescription>
          Tentativas de login de países não autorizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.map((attempt) => (
              <TableRow key={attempt.id}>
                <TableCell className="text-muted-foreground">
                  {format(new Date(attempt.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {attempt.ip_address}
                  </code>
                </TableCell>
                <TableCell>
                  {attempt.country_name ? (
                    <Badge variant="destructive">
                      {attempt.country_name} ({attempt.country_code})
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Desconhecido</span>
                  )}
                </TableCell>
                <TableCell>{attempt.email || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
