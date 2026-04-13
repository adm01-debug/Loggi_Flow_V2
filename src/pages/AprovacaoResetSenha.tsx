import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { KeyRound, CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";
import { ResetRequestsTable } from "./aprovacao-reset/ResetRequestsTable";

interface PasswordResetRequest {
  id: string; email: string; user_id: string | null; status: string;
  requested_at: string; reviewed_at: string | null; reviewed_by: string | null;
  rejection_reason: string | null; created_at: string;
}

export default function AprovacaoResetSenha() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();
  const { isAdmin, session } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["password-reset-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("password_reset_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as PasswordResetRequest[];
    },
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.functions.invoke("send-password-reset", { body: { requestId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["password-reset-requests"] }); toast({ title: "Solicitação aprovada!", description: "Email de reset enviado com sucesso." }); setIsApproveDialogOpen(false); setSelectedRequest(null); },
    onError: (error) => toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase.from("password_reset_requests").update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: session?.user?.id, rejection_reason: reason }).eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["password-reset-requests"] }); toast({ title: "Solicitação rejeitada" }); setIsRejectDialogOpen(false); setSelectedRequest(null); setRejectionReason(""); },
    onError: (error) => toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" }),
  });

  const pendingCount = requests?.filter(r => r.status === "pending").length || 0;
  const approvedCount = requests?.filter(r => r.status === "approved").length || 0;
  const rejectedCount = requests?.filter(r => r.status === "rejected").length || 0;

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive" /><h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2"><KeyRound className="h-8 w-8 text-primary" />Aprovação de Reset de Senha</h1>
          <p className="text-muted-foreground mt-1">Gerencie as solicitações de recuperação de senha</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pendentes</CardTitle><Clock className="h-4 w-4 text-warning" /></CardHeader><CardContent><div className="text-2xl font-bold text-warning">{pendingCount}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Aprovadas</CardTitle><CheckCircle className="h-4 w-4 text-success" /></CardHeader><CardContent><div className="text-2xl font-bold text-success">{approvedCount}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Rejeitadas</CardTitle><XCircle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{rejectedCount}</div></CardContent></Card>
        </div>

        <ResetRequestsTable requests={requests} searchTerm={searchTerm} onSearchChange={setSearchTerm} isLoading={isLoading} onApprove={(r) => { setSelectedRequest(r); setIsApproveDialogOpen(true); }} onReject={(r) => { setSelectedRequest(r); setIsRejectDialogOpen(true); }} />

        <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Aprovar Reset de Senha</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja aprovar o reset de senha para <strong>{selectedRequest?.email}</strong>?<br /><br />Um email será enviado para o usuário com instruções para redefinir a senha.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedRequest && approveMutation.mutate(selectedRequest.id)} disabled={approveMutation.isPending} className="bg-success hover:bg-success/90">
                {approveMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Aprovando...</> : <><CheckCircle className="mr-2 h-4 w-4" />Aprovar</>}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Rejeitar Reset de Senha</DialogTitle><DialogDescription>Informe o motivo da rejeição para {selectedRequest?.email}</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4"><div className="space-y-2"><Label>Motivo da Rejeição</Label><Textarea placeholder="Descreva o motivo da rejeição..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} /></div></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => selectedRequest && rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectionReason })} disabled={rejectMutation.isPending || !rejectionReason.trim()}>
                {rejectMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejeitando...</> : <><XCircle className="mr-2 h-4 w-4" />Rejeitar</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
