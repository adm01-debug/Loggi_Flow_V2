import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PreviewResponse {
  ok: boolean;
  preview: boolean;
  empty: boolean;
  subject: string | null;
  html: string | null;
  report: {
    windowStart: string;
    windowEnd: string;
    totalAlerts: number;
    carriers: Array<{ carrier: string; breaches: number; maxStreak: number }>;
    isEmpty: boolean;
  } | null;
  error?: string;
}

export function DigestPreviewPanel() {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async (): Promise<PreviewResponse> => {
      const { data, error } = await supabase.functions.invoke("accuracy-weekly-digest", {
        body: { preview: true },
      });
      if (error) throw new Error(error.message);
      return data as PreviewResponse;
    },
    onSuccess: (data) => {
      setPreview(data);
      if (data.empty) toast.info("Nenhum alerta na semana — digest ficaria vazio");
      else toast.success(`Preview gerado: ${data.report?.totalAlerts ?? 0} alerta(s)`);
    },
    onError: (err: Error) => toast.error(`Falha ao gerar preview: ${err.message}`),
  });

  return (
    <Card className="card-raised">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Preview do Digest Semanal</CardTitle>
        </div>
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…</>
          ) : (
            <><Eye className="mr-2 h-4 w-4" /> Gerar preview</>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Visualiza o email que seria enviado na próxima segunda 09:00 UTC com base nas notificações
          da última semana. Não envia nada e não gera auditoria.
        </p>

        {preview?.empty && (
          <Alert>
            <AlertDescription>
              Sem alertas na janela dos últimos 7 dias — nenhum email seria enviado.
            </AlertDescription>
          </Alert>
        )}

        {preview && !preview.empty && preview.report && (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {preview.report.totalAlerts} alerta(s)
              </Badge>
              <Badge variant="outline">
                {preview.report.carriers.length} transportadora(s)
              </Badge>
              <Badge variant="outline">
                Janela: {new Date(preview.report.windowStart).toLocaleDateString("pt-BR")} —{" "}
                {new Date(preview.report.windowEnd).toLocaleDateString("pt-BR")}
              </Badge>
            </div>
            <div className="rounded-md border bg-card">
              <div className="border-b bg-muted/40 px-4 py-2 text-sm font-medium">
                Assunto: {preview.subject}
              </div>
              <iframe
                title="Preview do digest"
                srcDoc={preview.html ?? ""}
                className="h-[520px] w-full rounded-b-md bg-white"
                sandbox=""
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
