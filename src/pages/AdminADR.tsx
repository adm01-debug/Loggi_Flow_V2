import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ADR {
  id: string;
  title: string;
  status: "proposed" | "accepted" | "rejected" | "deprecated";
  context: string;
  decision: string;
  consequences: string;
  created_at: string;
}

const statusColors = {
  proposed: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  deprecated: "bg-gray-100 text-gray-700",
};

export default function AdminADR() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newAdr, setNewAdr] = useState<Partial<ADR>>({ status: "proposed" });

  const {
    data: adrs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["architecture-decisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("architecture_decisions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ADR[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (adr: Partial<ADR>) => {
      if (!adr.title) throw new Error("Título obrigatório");
      const { error } = await supabase.from("architecture_decisions").insert({
        title: adr.title,
        status: adr.status,
        context: adr.context,
        decision: adr.decision,
        consequences: adr.consequences,
      });
      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["architecture-decisions"] });
      setIsAdding(false);
      setNewAdr({ status: "proposed" });
      toast({ title: "Sucesso", description: "ADR registrada com sucesso." });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("architecture_decisions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["architecture-decisions"] });
      toast({ title: "Sucesso", description: "ADR removida." });
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar ADRs"
            description={
              error?.message ||
              "Não foi possível carregar as decisões de arquitetura. Tente novamente."
            }
            action={{
              label: "Tentar novamente",
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              Decisões de Arquitetura (ADR)
            </h1>
            <p className="text-muted-foreground mt-1">
              Registro formal de decisões técnicas significativas do sistema.
            </p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? (
              "Cancelar"
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Nova Decisão
              </>
            )}
          </Button>
        </div>

        {isAdding && (
          <Card className="border-primary/50 shadow-lg animate-in fade-in slide-in-from-top-4">
            <CardHeader>
              <CardTitle>Registrar Nova Decisão</CardTitle>
              <CardDescription>
                Documente o contexto e a justificativa para esta mudança
                arquitetural.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Ex: Uso de TanStack Virtual para tabelas"
                    value={newAdr.title || ""}
                    onChange={(e) =>
                      setNewAdr({ ...newAdr, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newAdr.status}
                    onChange={(e) =>
                      setNewAdr({
                        ...newAdr,
                        status: e.target.value as ADR["status"],
                      })
                    }
                  >
                    <option value="proposed">Proposto</option>
                    <option value="accepted">Aceito</option>
                    <option value="rejected">Rejeitado</option>
                    <option value="deprecated">Obsoleto</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Contexto (O problema)
                </label>
                <Textarea
                  placeholder="Descreva o cenário técnico e os desafios encontrados..."
                  value={newAdr.context || ""}
                  onChange={(e) =>
                    setNewAdr({ ...newAdr, context: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Decisão (A solução)
                </label>
                <Textarea
                  placeholder="Qual foi a decisão tomada e por quê?"
                  value={newAdr.decision || ""}
                  onChange={(e) =>
                    setNewAdr({ ...newAdr, decision: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Consequências (Prós e Contras)
                </label>
                <Textarea
                  placeholder="O que ganhamos e o que perdemos com isso?"
                  value={newAdr.consequences || ""}
                  onChange={(e) =>
                    setNewAdr({ ...newAdr, consequences: e.target.value })
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate(newAdr)}
                disabled={
                  !newAdr.title || !newAdr.decision || createMutation.isPending
                }
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar ADR
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {adrs.map((adr) => (
            <Card
              key={adr.id}
              className="group hover:border-primary/30 transition-colors"
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{adr.title}</CardTitle>
                    <Badge className={statusColors[adr.status]}>
                      {adr.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Registrado em{" "}
                    {format(
                      new Date(adr.created_at),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => deleteMutation.mutate(adr.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <AlertCircle className="w-4 h-4" /> Contexto
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {adr.context}
                  </p>
                </div>
                <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <CheckCircle2 className="w-4 h-4" /> Decisão
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {adr.decision}
                  </p>
                </div>
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <AlertCircle className="w-4 h-4" /> Consequências
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {adr.consequences}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {adrs.length === 0 && !isLoading && (
            <div className="text-center py-20 bg-muted/10 rounded-xl border-2 border-dashed">
              <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma decisão de arquitetura registrada ainda.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
