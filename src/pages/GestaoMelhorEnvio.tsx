import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MECotacaoPanel, MECarrinhoPanel, MEEtiquetasPanel, MERastreamentoPanel, METransportadorasPanel, MEUsuarioPanel, MELojasPanel } from '@/components/melhorenvio';
import { Calculator, ShoppingCart, Tag, MapPin, Truck, User, Store, Package2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function GestaoMelhorEnvio() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Melhor Envio"
          description="Integração completa com a plataforma Melhor Envio — Cotação, Etiquetas, Rastreamento e mais"
          icon={Package2}
        />

        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">Sandbox</Badge>
          <span className="text-xs text-muted-foreground">Ambiente de testes ativo</span>
        </div>

        <Tabs defaultValue="cotacao" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="cotacao"><Calculator className="w-4 h-4 mr-1" />Cotação</TabsTrigger>
            <TabsTrigger value="carrinho"><ShoppingCart className="w-4 h-4 mr-1" />Carrinho</TabsTrigger>
            <TabsTrigger value="etiquetas"><Tag className="w-4 h-4 mr-1" />Etiquetas</TabsTrigger>
            <TabsTrigger value="rastreamento"><MapPin className="w-4 h-4 mr-1" />Rastreamento</TabsTrigger>
            <TabsTrigger value="transportadoras"><Truck className="w-4 h-4 mr-1" />Transportadoras</TabsTrigger>
            <TabsTrigger value="usuario"><User className="w-4 h-4 mr-1" />Minha Conta</TabsTrigger>
            <TabsTrigger value="lojas"><Store className="w-4 h-4 mr-1" />Lojas</TabsTrigger>
          </TabsList>

          <TabsContent value="cotacao"><MECotacaoPanel /></TabsContent>
          <TabsContent value="carrinho"><MECarrinhoPanel /></TabsContent>
          <TabsContent value="etiquetas"><MEEtiquetasPanel /></TabsContent>
          <TabsContent value="rastreamento"><MERastreamentoPanel /></TabsContent>
          <TabsContent value="transportadoras"><METransportadorasPanel /></TabsContent>
          <TabsContent value="usuario"><MEUsuarioPanel /></TabsContent>
          <TabsContent value="lojas"><MELojasPanel /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
