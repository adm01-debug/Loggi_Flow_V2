import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle, XCircle, Clock, Loader2, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PasswordResetRequest {
  id: string;
  email: string;
  user_id: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

interface ResetRequestsTableProps {
  requests: PasswordResetRequest[] | undefined;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isLoading: boolean;
  onApprove: (request: PasswordResetRequest) => void;
  onReject: (request: PasswordResetRequest) => void;
}

export function ResetRequestsTable({ requests, searchTerm, onSearchChange, isLoading, onApprove, onReject }: ResetRequestsTableProps) {
  const filtered = requests?.filter((r) => r.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações</CardTitle>
        <CardDescription>Aprove ou rejeite as solicitações de reset de senha</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por email..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Revisado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma solicitação encontrada</TableCell>
                  </TableRow>
                ) : (
                  filtered?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{request.email}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>{request.reviewed_at ? format(new Date(request.reviewed_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}</TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          if (request.status === "pending") {
                            return (
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" className="text-success hover:text-success hover:bg-success/10" onClick={() => onApprove(request)}>
                                  <CheckCircle className="h-4 w-4 mr-1" />Aprovar
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onReject(request)}>
                                  <XCircle className="h-4 w-4 mr-1" />Rejeitar
                                </Button>
                              </div>
                            );
                          }
                          if (request.status === "rejected" && request.rejection_reason) {
                            return <span className="text-sm text-muted-foreground">{request.rejection_reason}</span>;
                          }
                          return <span className="text-sm text-muted-foreground">-</span>;
                        })()}
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
