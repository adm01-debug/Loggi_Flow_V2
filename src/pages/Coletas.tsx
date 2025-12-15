import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  MapPin,
  Phone,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ColetaStatus = 'aguardando_liberacao' | 'solicitada' | 'em_transito' | 'chegou_expedicao' | 'conferencia_ok' | 'divergencia' | 'finalizada';
type ColetaTipo = 'lalamove' | 'transportadora';

interface Coleta {
  id: string;
  numero_coleta: string;
  fornecedor_id: string | null;
  endereco_coleta: string;
  contato_coleta: string | null;
  tipo_coleta: ColetaTipo;
  transportadora_id: string | null;
  data_prevista_coleta: string | null;
  data_efetiva_coleta: string | null;
  qtd_volumes: number | null;
  peso_estimado_kg: number | null;
  codigo_rastreamento: string | null;
  status: ColetaStatus;
  observacoes: string | null;
  created_at: string;
  fornecedores?: { razao_social: string; nome_fantasia: string | null } | null;
  transportadoras?: { nome_fantasia: string } | null;
}

interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  endereco_completo: string;
  contato_nome: string | null;
  contato_telefone: string | null;
}

interface Transportadora {
  id: string;
  nome_fantasia: string;
  razao_social: string;
}

const statusConfig: Record<ColetaStatus, { label: string; color: string; icon: React.ElementType }> = {
  aguardando_liberacao: { label: "Aguardando Liberação", color: "bg-muted text-muted-foreground", icon: Clock },
  solicitada: { label: "Coleta Solicitada", color: "bg-blue-500/20 text-blue-400", icon: Truck },
  em_transito: { label: "Em Trânsito", color: "bg-primary/20 text-primary", icon: Truck },
  chegou_expedicao: { label: "Chegou Expedição", color: "bg-info/20 text-info", icon: Package },
  conferencia_ok: { label: "Conferência OK", color: "bg-success/20 text-success", icon: CheckCircle2 },
  divergencia: { label: "Divergência", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
  finalizada: { label: "Finalizada", color: "bg-success/20 text-success", icon: CheckCircle2 },
};

const pipelineStages: ColetaStatus[] = [
  'aguardando_liberacao',
  'solicitada',
  'em_transito',
  'chegou_expedicao',
  'conferencia_ok',
  'divergencia',
  'finalizada'
];

function ColetaCard({ coleta, onStatusChange }: { coleta: Coleta; onStatusChange: () => void }) {
  const config = statusConfig[coleta.status];
  const Icon = config.icon;

  const handleStatusChange = async (newStatus: ColetaStatus) => {
    const { error } = await supabase
      .from('coletas')
      .update({ status: newStatus })
      .eq('id', coleta.id);
    
    if (!error) {
      onStatusChange();
    }
  };

  const nextStatus = pipelineStages[pipelineStages.indexOf(coleta.status) + 1];

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-sm text-primary font-semibold">{coleta.numero_coleta}</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {coleta.fornecedores?.nome_fantasia || coleta.fornecedores?.razao_social || "Fornecedor não definido"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {nextStatus && (
                <DropdownMenuItem onClick={() => handleStatusChange(nextStatus)}>
                  Avançar para: {statusConfig[nextStatus].label}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{coleta.endereco_coleta}</span>
        </div>

        {coleta.contato_coleta && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{coleta.contato_coleta}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge className={`${coleta.tipo_coleta === 'lalamove' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {coleta.tipo_coleta === 'lalamove' ? '🛵 Lalamove' : '🚚 Transportadora'}
          </Badge>
          {coleta.qtd_volumes && (
            <span className="text-xs text-muted-foreground">{coleta.qtd_volumes} vol.</span>
          )}
        </div>

        {coleta.data_prevista_coleta && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{new Date(coleta.data_prevista_coleta).toLocaleDateString('pt-BR')}</span>
          </div>
        )}

        {coleta.codigo_rastreamento && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              {coleta.codigo_rastreamento}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Coletas() {
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    fornecedor_id: "",
    endereco_coleta: "",
    contato_coleta: "",
    tipo_coleta: "lalamove" as ColetaTipo,
    transportadora_id: "",
    data_prevista_coleta: "",
    qtd_volumes: 1,
    peso_estimado_kg: "",
    observacoes: ""
  });

  const fetchData = async () => {
    setLoading(true);
    
    const [coletasRes, fornecedoresRes, transportadorasRes] = await Promise.all([
      supabase
        .from('coletas')
        .select('*, fornecedores(razao_social, nome_fantasia), transportadoras(nome_fantasia)')
        .order('created_at', { ascending: false }),
      supabase.from('fornecedores').select('*'),
      supabase.from('transportadoras').select('*').eq('homologada', true)
    ]);

    if (coletasRes.data) setColetas(coletasRes.data as Coleta[]);
    if (fornecedoresRes.data) setFornecedores(fornecedoresRes.data);
    if (transportadorasRes.data) setTransportadoras(transportadorasRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFornecedorChange = (fornecedorId: string) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    if (fornecedor) {
      setFormData({
        ...formData,
        fornecedor_id: fornecedorId,
        endereco_coleta: fornecedor.endereco_completo,
        contato_coleta: fornecedor.contato_nome && fornecedor.contato_telefone 
          ? `${fornecedor.contato_nome} - ${fornecedor.contato_telefone}` 
          : fornecedor.contato_nome || fornecedor.contato_telefone || ""
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // @ts-ignore - numero_coleta is auto-generated by database trigger
    const { error } = await supabase.from('coletas').insert([{
      endereco_coleta: formData.endereco_coleta,
      contato_coleta: formData.contato_coleta || null,
      tipo_coleta: formData.tipo_coleta,
      data_prevista_coleta: formData.data_prevista_coleta || null,
      qtd_volumes: formData.qtd_volumes,
      peso_estimado_kg: formData.peso_estimado_kg ? parseFloat(formData.peso_estimado_kg) : null,
      observacoes: formData.observacoes || null,
      fornecedor_id: formData.fornecedor_id || null,
      transportadora_id: formData.tipo_coleta === 'transportadora' ? formData.transportadora_id || null : null
    }]);

    if (error) {
      toast({
        title: "Erro ao criar coleta",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Coleta criada",
        description: "A coleta foi registrada com sucesso!"
      });
      setIsDialogOpen(false);
      setFormData({
        fornecedor_id: "",
        endereco_coleta: "",
        contato_coleta: "",
        tipo_coleta: "lalamove",
        transportadora_id: "",
        data_prevista_coleta: "",
        qtd_volumes: 1,
        peso_estimado_kg: "",
        observacoes: ""
      });
      fetchData();
    }
  };

  const filteredColetas = coletas.filter(c => 
    c.numero_coleta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.endereco_coleta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.fornecedores?.razao_social?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColetasByStatus = (status: ColetaStatus) => 
    filteredColetas.filter(c => c.status === status);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-7 h-7 text-primary" />
              Coletas de Compras
            </h1>
            <p className="text-muted-foreground">Gestão de coletas junto a fornecedores</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar coletas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Coleta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Coleta de Compras</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={formData.fornecedor_id} onValueChange={handleFornecedorChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome_fantasia || f.razao_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Endereço de Coleta *</Label>
                    <Input
                      value={formData.endereco_coleta}
                      onChange={(e) => setFormData({ ...formData, endereco_coleta: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contato para Coleta</Label>
                    <Input
                      value={formData.contato_coleta}
                      onChange={(e) => setFormData({ ...formData, contato_coleta: e.target.value })}
                      placeholder="Nome - Telefone"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Coleta *</Label>
                      <Select 
                        value={formData.tipo_coleta} 
                        onValueChange={(v: ColetaTipo) => setFormData({ ...formData, tipo_coleta: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lalamove">🛵 Lalamove (SP)</SelectItem>
                          <SelectItem value="transportadora">🚚 Transportadora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.tipo_coleta === 'transportadora' && (
                      <div className="space-y-2">
                        <Label>Transportadora</Label>
                        <Select 
                          value={formData.transportadora_id} 
                          onValueChange={(v) => setFormData({ ...formData, transportadora_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {transportadoras.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.nome_fantasia}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Data Prevista</Label>
                      <Input
                        type="date"
                        value={formData.data_prevista_coleta}
                        onChange={(e) => setFormData({ ...formData, data_prevista_coleta: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Volumes</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.qtd_volumes}
                        onChange={(e) => setFormData({ ...formData, qtd_volumes: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.peso_estimado_kg}
                        onChange={(e) => setFormData({ ...formData, peso_estimado_kg: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Criar Coleta
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineStages.map(status => {
            const config = statusConfig[status];
            const count = getColetasByStatus(status).length;
            return (
              <Card key={status} className={`${config.color} border-0`}>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs truncate">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Kanban */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {pipelineStages.map(status => {
              const config = statusConfig[status];
              const Icon = config.icon;
              const stageColetas = getColetasByStatus(status);
              
              return (
                <div key={status} className="w-72 flex-shrink-0">
                  <div className={`rounded-lg p-3 mb-3 ${config.color}`}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold text-sm">{config.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {stageColetas.length}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3 min-h-[200px]">
                    {stageColetas.map(coleta => (
                      <ColetaCard 
                        key={coleta.id} 
                        coleta={coleta} 
                        onStatusChange={fetchData}
                      />
                    ))}
                    {stageColetas.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-8 border border-dashed border-border rounded-lg">
                        Nenhuma coleta
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
