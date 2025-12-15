import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Webhook, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Shield,
  Zap,
  Play,
  Loader2,
  MapPin,
  Truck,
  AlertTriangle,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WEBHOOK_URL = 'https://uwbpzfcysppwikfpnzok.supabase.co/functions/v1/lalamove-webhook';

interface TestPayload {
  eventType: string;
  label: string;
  icon: React.ReactNode;
  data: object;
}

const testPayloads: TestPayload[] = [
  {
    eventType: 'ORDER_STATUS_CHANGED',
    label: 'Status do Pedido Alterado',
    icon: <Truck className="h-4 w-4" />,
    data: {
      eventType: 'ORDER_STATUS_CHANGED',
      data: {
        orderId: 'TEST-ORDER-001',
        status: 'ON_GOING',
        timestamp: new Date().toISOString(),
        location: {
          lat: -23.5505,
          lng: -46.6333,
        },
      },
    },
  },
  {
    eventType: 'DRIVER_LOCATION_UPDATED',
    label: 'Localização do Motorista',
    icon: <MapPin className="h-4 w-4" />,
    data: {
      eventType: 'DRIVER_LOCATION_UPDATED',
      data: {
        orderId: 'TEST-ORDER-001',
        driverId: 'DRIVER-TEST-001',
        location: {
          lat: -23.5605 + (Math.random() * 0.01),
          lng: -46.6433 + (Math.random() * 0.01),
        },
        timestamp: new Date().toISOString(),
      },
    },
  },
  {
    eventType: 'DRIVER_ASSIGNED',
    label: 'Motorista Atribuído',
    icon: <User className="h-4 w-4" />,
    data: {
      eventType: 'DRIVER_ASSIGNED',
      data: {
        orderId: 'TEST-ORDER-001',
        driver: {
          driverId: 'DRIVER-TEST-001',
          name: 'João Silva (Teste)',
          phone: '+5511999999999',
          plateNumber: 'ABC-1234',
          location: {
            lat: -23.5505,
            lng: -46.6333,
          },
        },
      },
    },
  },
  {
    eventType: 'ORDER_CANCELED',
    label: 'Pedido Cancelado',
    icon: <AlertTriangle className="h-4 w-4" />,
    data: {
      eventType: 'ORDER_CANCELED',
      data: {
        orderId: 'TEST-ORDER-001',
        reason: 'Teste de cancelamento via interface',
      },
    },
  },
];

const WebhookConfigInstructions: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [selectedEvent, setSelectedEvent] = useState<string>('ORDER_STATUS_CHANGED');
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      toast.success('URL copiada para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar URL');
    }
  };

  const sendTestWebhook = async () => {
    const payload = testPayloads.find(p => p.eventType === selectedEvent);
    if (!payload) return;

    setIsTesting(true);
    setLastTestResult(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-mode': 'true', // Skip signature verification for testing
        },
        body: JSON.stringify(payload.data),
      });

      const result = await response.json();

      if (response.ok) {
        setLastTestResult({ success: true, message: `Evento ${selectedEvent} enviado com sucesso!` });
        toast.success(`Webhook de teste enviado: ${payload.label}`);
      } else {
        setLastTestResult({ success: false, message: result.error || 'Erro ao enviar webhook' });
        toast.error(`Erro: ${result.error || 'Falha ao enviar webhook'}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setLastTestResult({ success: false, message });
      toast.error(`Erro ao enviar webhook: ${message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Acesse o Painel do Desenvolvedor Lalamove',
      description: 'Entre na sua conta Lalamove e acesse o painel de desenvolvedor.',
      content: (
        <div className="space-y-3 text-sm">
          <p>1. Acesse <a href="https://developers.lalamove.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">developers.lalamove.com <ExternalLink className="h-3 w-3" /></a></p>
          <p>2. Faça login com suas credenciais de desenvolvedor</p>
          <p>3. Selecione o ambiente correto (Sandbox ou Produção)</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              Sandbox: Para testes
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Produção: Para uso real
            </Badge>
          </div>
        </div>
      ),
    },
    {
      number: 2,
      title: 'Navegue até Configurações de Webhook',
      description: 'Encontre a seção de webhooks nas configurações da sua aplicação.',
      content: (
        <div className="space-y-3 text-sm">
          <p>1. No menu lateral, clique em <strong>"Applications"</strong></p>
          <p>2. Selecione sua aplicação ativa</p>
          <p>3. Navegue até a aba <strong>"Webhooks"</strong> ou <strong>"Callbacks"</strong></p>
          <p>4. Clique em <strong>"Add Webhook"</strong> ou <strong>"Configure Callback URL"</strong></p>
        </div>
      ),
    },
    {
      number: 3,
      title: 'Configure a URL do Webhook',
      description: 'Cole a URL do seu endpoint de webhook.',
      content: (
        <div className="space-y-4 text-sm">
          <p>Cole a seguinte URL no campo de Webhook/Callback URL:</p>
          <div className="flex items-center gap-2">
            <Input 
              value={WEBHOOK_URL} 
              readOnly 
              className="font-mono text-xs bg-muted"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary">
              <strong>Importante:</strong> Certifique-se de copiar a URL completa, incluindo "https://"
            </p>
          </div>
        </div>
      ),
    },
    {
      number: 4,
      title: 'Selecione os Eventos',
      description: 'Escolha quais eventos você deseja receber notificações.',
      content: (
        <div className="space-y-3 text-sm">
          <p>Marque os seguintes eventos para receber atualizações em tempo real:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs">ORDER_STATUS_CHANGED</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs">DRIVER_LOCATION_UPDATED</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs">DRIVER_ASSIGNED</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs">ORDER_CANCELED</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs">ORDER_EXPIRED</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: 5,
      title: 'Salve e Teste a Configuração',
      description: 'Salve as configurações e envie um webhook de teste.',
      content: (
        <div className="space-y-3 text-sm">
          <p>1. Clique em <strong>"Save"</strong> ou <strong>"Update"</strong></p>
          <p>2. Use o botão <strong>"Send Test Webhook"</strong> se disponível</p>
          <p>3. Verifique se o teste foi recebido no painel de monitoramento</p>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mt-3">
            <p className="text-xs text-green-500 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Após configurar, as atualizações aparecerão automaticamente no painel "Monitor em Tempo Real"
            </p>
          </div>
        </div>
      ),
    },
  ];

  const supportedEvents = [
    { event: 'ORDER_STATUS_CHANGED', description: 'Quando o status do pedido muda' },
    { event: 'DRIVER_LOCATION_UPDATED', description: 'Atualização de localização do motorista' },
    { event: 'DRIVER_ASSIGNED', description: 'Motorista aceita o pedido' },
    { event: 'ORDER_CANCELED', description: 'Pedido é cancelado' },
    { event: 'ORDER_EXPIRED', description: 'Pedido expira sem motorista' },
  ];

  const selectedPayload = testPayloads.find(p => p.eventType === selectedEvent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" />
          Configurar Webhook Lalamove
        </CardTitle>
        <CardDescription>
          Configure o webhook para receber atualizações em tempo real diretamente da Lalamove
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Display */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">URL do Webhook</span>
            <Badge variant="secondary">POST</Badge>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 rounded bg-background text-xs font-mono overflow-x-auto">
              {WEBHOOK_URL}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="gap-1 flex-shrink-0"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>

        {/* Test Webhook Section */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Testar Webhook
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Envie um payload de teste para verificar se o webhook está funcionando corretamente.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione o tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                {testPayloads.map((payload) => (
                  <SelectItem key={payload.eventType} value={payload.eventType}>
                    <div className="flex items-center gap-2">
                      {payload.icon}
                      <span>{payload.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={sendTestWebhook}
              disabled={isTesting}
              className="gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Enviar Teste
                </>
              )}
            </Button>
          </div>

          {/* Payload Preview */}
          {selectedPayload && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Payload que será enviado:</p>
              <pre className="p-3 rounded bg-background text-xs font-mono overflow-x-auto max-h-32">
                {JSON.stringify(selectedPayload.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Test Result */}
          {lastTestResult && (
            <div className={cn(
              "mt-4 p-3 rounded-lg border",
              lastTestResult.success 
                ? "bg-green-500/10 border-green-500/20" 
                : "bg-destructive/10 border-destructive/20"
            )}>
              <div className="flex items-center gap-2">
                {lastTestResult.success ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className={cn(
                  "text-sm",
                  lastTestResult.success ? "text-green-500" : "text-destructive"
                )}>
                  {lastTestResult.message}
                </span>
              </div>
              {lastTestResult.success && (
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique o painel "Monitor em Tempo Real" para ver a atualização.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Shield className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500">Segurança</p>
            <p className="text-xs text-muted-foreground">
              O webhook valida a assinatura HMAC-SHA256 usando seu API Secret da Lalamove. 
              Certifique-se de que o secret está configurado corretamente nas variáveis de ambiente.
            </p>
          </div>
        </div>

        <Separator />

        {/* Step by Step Instructions */}
        <div>
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Passo a Passo
          </h3>
          <div className="space-y-3">
            {steps.map((step) => (
              <Collapsible
                key={step.number}
                open={expandedStep === step.number}
                onOpenChange={() => setExpandedStep(expandedStep === step.number ? null : step.number)}
              >
                <CollapsibleTrigger asChild>
                  <button className={cn(
                    "w-full p-3 rounded-lg border text-left transition-colors",
                    expandedStep === step.number 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
                          expandedStep === step.number 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {step.number}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                      {expandedStep === step.number ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pt-3 pb-1">
                  <div className="pl-10 pb-3">
                    {step.content}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        <Separator />

        {/* Supported Events */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Eventos Suportados
          </h3>
          <div className="grid gap-2">
            {supportedEvents.map((item) => (
              <div 
                key={item.event}
                className="flex items-center justify-between p-2 rounded bg-muted/30"
              >
                <code className="text-xs font-mono text-primary">{item.event}</code>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Help Link */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Precisa de ajuda?</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => window.open('https://developers.lalamove.com/docs', '_blank')}
          >
            Documentação Lalamove
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookConfigInstructions;
