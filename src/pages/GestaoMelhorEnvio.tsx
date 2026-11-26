import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MECotacaoPanel, MECarrinhoPanel, MEEtiquetasPanel, MERastreamentoPanel, METransportadorasPanel, MEUsuarioPanel, MELojasPanel } from '@/components/melhorenvio';
import { MEWebhookPanel } from '@/components/melhorenvio/MEWebhookPanel';
import { Calculator, ShoppingCart, Tag, MapPin, Truck, User, Store, Package2, Webhook } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useKeyboardShortcut } from "@/hooks/common/useKeyboardShortcuts";
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AMBIENTE_BADGE = {
  producao: '🚀 Produção',
  sandbox: '🧪 Ambiente de Testes',
  desconhecido: '⚠️ Ambiente não confirmado',
} as const;

export default function GestaoMelhorEnvio() {
  const [activeTab, setActiveTab] = useState<string>('cotacao');
  // Etapa 008: o ambiente e do servidor. Este selo so mostra o que a acao `ambiente` responde - o
  // interruptor que existia aqui era mentira, porque o campo do corpo era ignorado.
  const [ambiente, setAmbiente] = useState<'producao' | 'sandbox' | 'desconhecido'>('desconhecido');

  useEffect(() => {
    let ativo = true;
    supabase.functions
      .invoke('melhor-envio-api', { body: { action: 'ambiente' } })
      .then(({ data, error }) => {
        if (!ativo) return;
        const valor = (data as { ambiente?: string } | null)?.ambiente;
        setAmbiente(
          !error && (valor === 'producao' || valor === 'sandbox') ? valor : 'desconhecido',
        );
      })
      .catch(() => {
        if (ativo) setAmbiente('desconhecido');
      });
    return () => {
      ativo = false;
    };
  }, []);

  // Keyboard shortcuts for tab switching
  useKeyboardShortcut('1', useCallback(() => setActiveTab('cotacao'), []), { alt: true });
  useKeyboardShortcut('2', useCallback(() => setActiveTab('carrinho'), []), { alt: true });
  useKeyboardShortcut('3', useCallback(() => setActiveTab('etiquetas'), []), { alt: true });
  useKeyboardShortcut('4', useCallback(() => setActiveTab('rastreamento'), []), { alt: true });
  useKeyboardShortcut('5', useCallback(() => setActiveTab('transportadoras'), []), { alt: true });
  useKeyboardShortcut('6', useCallback(() => setActiveTab('usuario'), []), { alt: true });
  useKeyboardShortcut('7', useCallback(() => setActiveTab('lojas'), []), { alt: true });
  useKeyboardShortcut('8', useCallback(() => setActiveTab('webhooks'), []), { alt: true });

  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Integrações' },
            { label: 'Melhor Envio' },
          ]}
        />

        <PageHeader
          title="Melhor Envio"
          description="Integração completa com a plataforma Melhor Envio — Cotação, Etiquetas, Rastreamento e mais"
          icon={Package2}
        />

        <div className="flex items-center gap-3 mb-2">
          <Badge
            variant={ambiente === 'producao' ? 'default' : 'outline'}
            className="text-xs"
            title="Definido no servidor (MELHOR_ENVIO_SANDBOX)"
          >
            {AMBIENTE_BADGE[ambiente]}
          </Badge>
          {ambiente === 'producao' && (
            <span className="text-xs text-destructive font-medium">Ações terão efeito real!</span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">💡 Dica: Use Alt+1 a Alt+8 para alternar abas rapidamente</p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="cotacao"><Calculator className="w-4 h-4 mr-1" />Cotação</TabsTrigger>
            <TabsTrigger value="carrinho"><ShoppingCart className="w-4 h-4 mr-1" />Carrinho</TabsTrigger>
            <TabsTrigger value="etiquetas"><Tag className="w-4 h-4 mr-1" />Etiquetas</TabsTrigger>
            <TabsTrigger value="rastreamento"><MapPin className="w-4 h-4 mr-1" />Rastreamento</TabsTrigger>
            <TabsTrigger value="transportadoras"><Truck className="w-4 h-4 mr-1" />Transportadoras</TabsTrigger>
            <TabsTrigger value="usuario"><User className="w-4 h-4 mr-1" />Minha Conta</TabsTrigger>
            <TabsTrigger value="lojas"><Store className="w-4 h-4 mr-1" />Lojas</TabsTrigger>
            <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-1" />Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="cotacao"><MECotacaoPanel /></TabsContent>
          <TabsContent value="carrinho"><MECarrinhoPanel /></TabsContent>
          <TabsContent value="etiquetas"><MEEtiquetasPanel /></TabsContent>
          <TabsContent value="rastreamento"><MERastreamentoPanel /></TabsContent>
          <TabsContent value="transportadoras"><METransportadorasPanel /></TabsContent>
          <TabsContent value="usuario"><MEUsuarioPanel /></TabsContent>
          <TabsContent value="lojas"><MELojasPanel /></TabsContent>
          <TabsContent value="webhooks"><MEWebhookPanel /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
