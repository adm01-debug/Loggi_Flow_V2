import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Webhook, Plus, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
}

const AVAILABLE_EVENTS = [
  { value: "shipment.created", label: "Envio criado" },
  { value: "shipment.paid", label: "Envio pago" },
  { value: "shipment.generated", label: "Etiqueta gerada" },
  { value: "shipment.tracking", label: "Atualização rastreio" },
  { value: "shipment.delivered", label: "Entregue" },
  { value: "shipment.canceled", label: "Cancelado" },
];

export function MEWebhookPanel() {
  const [webhooks, setWebhooks] = useLocalStorage<WebhookConfig[]>("me-webhooks", []);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newUrl.trim()) {
      toast.error("URL é obrigatória");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }
    try {
      new URL(newUrl);
    } catch {
      toast.error("URL inválida");
      return;
    }

    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      url: newUrl.trim(),
      events: selectedEvents,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setWebhooks([...webhooks, webhook]);
    setNewUrl("");
    setSelectedEvents([]);
    setShowAdd(false);
    toast.success("Webhook configurado!");
  };

  const handleToggle = (id: string) => {
    setWebhooks(webhooks.map(w => w.id === id ? { ...w, active: !w.active } : w));
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setWebhooks(webhooks.filter(w => w.id !== deleteId));
    setDeleteId(null);
    toast.success("Webhook removido");
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Webhooks</h3>
          <Badge variant="outline" className="text-xs">{webhooks.length} configurados</Badge>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} variant={showAdd ? "secondary" : "default"}>
          <Plus className="w-4 h-4 mr-1" />
          {showAdd ? "Cancelar" : "Novo Webhook"}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <Input
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://seu-servidor.com/webhook"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label>Eventos</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENTS.map(event => (
                  <Badge
                    key={event.value}
                    variant={selectedEvents.includes(event.value) ? "default" : "outline"}
                    className="cursor-pointer transition-all"
                    onClick={() => toggleEvent(event.value)}
                  >
                    {event.label}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={handleAdd} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 && !showAdd ? (
        <EmptyState
          title="Nenhum webhook configurado"
          description="Configure webhooks para receber notificações automáticas sobre eventos de envio."
          icon={Webhook}
        />
      ) : (
        <div className="space-y-2">
          {webhooks.map(webhook => (
            <Card key={webhook.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      {webhook.active ? (
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <code className="text-sm font-mono truncate block">{webhook.url}</code>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="secondary" className="text-[10px]">
                          {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(webhook.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={webhook.active} onCheckedChange={() => handleToggle(webhook.id)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteId(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remover Webhook"
        description="Tem certeza que deseja remover este webhook? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
