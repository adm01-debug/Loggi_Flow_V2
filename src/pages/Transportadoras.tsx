import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Truck, 
  Search,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Globe,
  Building2,
  Clock,
  TrendingUp,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useExport } from "@/hooks/useExport";
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
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Transportadora {
  id: string;
  razao_social: string;
  cnpj: string;
  nome_fantasia: string;
  contato_comercial: string;
  email_comercial: string;
  whatsapp_operacional: string | null;
  regioes_atendidas: string[];
  prazo_medio_dias: number | null;
  api_disponivel: boolean;
  url_rastreamento: string | null;
  homologada: boolean;
  data_homologacao: string | null;
  score_performance: number;
  observacoes: string | null;
  created_at: string;
}

const regioesBrasil = [
  "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul",
  "SP Capital", "SP Interior", "RJ Capital", "RJ Interior",
  "MG", "PR", "SC", "RS", "BA", "PE", "CE", "GO", "DF"
];

const emptyForm = {
  razao_social: "",
  cnpj: "",
  nome_fantasia: "",
  contato_comercial: "",
  email_comercial: "",
  whatsapp_operacional: "",
  regioes_atendidas: [] as string[],
  prazo_medio_dias: "",
  api_disponivel: false,
  url_rastreamento: "",
  homologada: true,
  observacoes: ""
};

function ScoreBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-xp";
    if (score >= 40) return "bg-primary";
    return "bg-destructive";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-semibold ${score >= 80 ? 'text-success' : score >= 60 ? 'text-xp' : 'text-muted-foreground'}`}>
        {score}
      </span>
    </div>
  );
}

function TransportadoraCard({ transportadora, onEdit, onDelete, onRefresh }: { 
  transportadora: Transportadora; 
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const toggleHomologacao = async () => {
    await supabase
      .from('transportadoras')
      .update({ 
        homologada: !transportadora.homologada,
        data_homologacao: !transportadora.homologada ? new Date().toISOString() : null
      })
      .eq('id', transportadora.id);
    onRefresh();
  };

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${transportadora.homologada ? 'bg-success/20' : 'bg-muted'}`}>
              <Truck className={`w-6 h-6 ${transportadora.homologada ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{transportadora.nome_fantasia}</h3>
              <p className="text-xs text-muted-foreground">{transportadora.razao_social}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleHomologacao}>
                {transportadora.homologada ? (
                  <><XCircle className="w-4 h-4 mr-2" /> Desomologar</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Homologar</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={transportadora.homologada ? "default" : "secondary"} className={transportadora.homologada ? "bg-success/20 text-success border-success/30" : ""}>
              {transportadora.homologada ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Homologada</> : "Não Homologada"}
            </Badge>
            {transportadora.api_disponivel && (
              <Badge variant="outline" className="border-primary/50 text-primary">
                <Globe className="w-3 h-3 mr-1" /> API
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="truncate">{transportadora.contato_comercial}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{transportadora.email_comercial}</span>
            </div>
          </div>

          {transportadora.prazo_medio_dias && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Prazo médio: {transportadora.prazo_medio_dias} dias</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {transportadora.regioes_atendidas?.slice(0, 4).map(regiao => (
                <Badge key={regiao} variant="outline" className="text-xs">
                  {regiao}
                </Badge>
              ))}
              {transportadora.regioes_atendidas?.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{transportadora.regioes_atendidas.length - 4}
                </Badge>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-xp" />
              <span className="text-sm text-muted-foreground">Score:</span>
            </div>
            <ScoreBar score={transportadora.score_performance} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Transportadoras() {
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [filterHomologada, setFilterHomologada] = useState<"all" | "yes" | "no">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const { toast } = useToast();
  const { exportToExcel } = useExport();

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transportadoras')
      .select('*')
      .order('nome_fantasia');
    
    if (data) setTransportadoras(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      razao_social: formData.razao_social,
      cnpj: formData.cnpj,
      nome_fantasia: formData.nome_fantasia,
      contato_comercial: formData.contato_comercial,
      email_comercial: formData.email_comercial,
      whatsapp_operacional: formData.whatsapp_operacional || null,
      regioes_atendidas: formData.regioes_atendidas,
      prazo_medio_dias: formData.prazo_medio_dias ? parseInt(formData.prazo_medio_dias) : null,
      api_disponivel: formData.api_disponivel,
      url_rastreamento: formData.url_rastreamento || null,
      homologada: formData.homologada,
      data_homologacao: formData.homologada ? new Date().toISOString() : null,
      observacoes: formData.observacoes || null
    };

    let error;
    if (editingId) {
      const result = await supabase.from('transportadoras').update(payload).eq('id', editingId);
      error = result.error;
    } else {
      const result = await supabase.from('transportadoras').insert([payload]);
      error = result.error;
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Atualizada" : "Cadastrada", description: "Transportadora salva com sucesso!" });
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchData();
    }
  };

  const handleEdit = (t: Transportadora) => {
    setEditingId(t.id);
    setFormData({
      razao_social: t.razao_social,
      cnpj: t.cnpj,
      nome_fantasia: t.nome_fantasia,
      contato_comercial: t.contato_comercial,
      email_comercial: t.email_comercial,
      whatsapp_operacional: t.whatsapp_operacional || "",
      regioes_atendidas: t.regioes_atendidas || [],
      prazo_medio_dias: t.prazo_medio_dias?.toString() || "",
      api_disponivel: t.api_disponivel,
      url_rastreamento: t.url_rastreamento || "",
      homologada: t.homologada,
      observacoes: t.observacoes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transportadoras').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Excluída", description: "Transportadora removida." });
      fetchData();
    }
  };

  const toggleRegiao = (regiao: string) => {
    const current = formData.regioes_atendidas;
    if (current.includes(regiao)) {
      setFormData({ ...formData, regioes_atendidas: current.filter(r => r !== regiao) });
    } else {
      setFormData({ ...formData, regioes_atendidas: [...current, regiao] });
    }
  };

  const filtered = transportadoras.filter(t => {
    const matchesSearch = 
      t.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cnpj.includes(searchTerm);
    
    const matchesFilter = 
      filterHomologada === "all" ||
      (filterHomologada === "yes" && t.homologada) ||
      (filterHomologada === "no" && !t.homologada);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: transportadoras.length,
    homologadas: transportadoras.filter(t => t.homologada).length,
    comApi: transportadoras.filter(t => t.api_disponivel).length,
    mediaScore: transportadoras.length > 0 
      ? Math.round(transportadoras.reduce((acc, t) => acc + t.score_performance, 0) / transportadoras.length)
      : 0
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Truck className="w-7 h-7 text-primary" />
              Gestão de Transportadoras
            </h1>
            <p className="text-muted-foreground">Cadastro e homologação de transportadoras</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={filterHomologada} onValueChange={(v: "all" | "yes" | "no") => setFilterHomologada(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="yes">Homologadas</SelectItem>
                <SelectItem value="no">Não Homologadas</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => exportToExcel(transportadoras.map(t => ({ nome: t.nome, cnpj: t.cnpj, cidade: t.cidade, uf: t.uf, telefone: t.telefone, email: t.email, ativa: t.ativa ? 'Sim' : 'Não' })), { filename: 'transportadoras' })} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) { setEditingId(null); setFormData(emptyForm); }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transportadora
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Nova"} Transportadora</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Razão Social *</Label>
                      <Input value={formData.razao_social} onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ *</Label>
                      <Input value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nome Fantasia *</Label>
                    <Input value={formData.nome_fantasia} onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contato Comercial *</Label>
                      <Input value={formData.contato_comercial} onChange={(e) => setFormData({ ...formData, contato_comercial: e.target.value })} placeholder="Nome - Telefone" required />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail Comercial *</Label>
                      <Input type="email" value={formData.email_comercial} onChange={(e) => setFormData({ ...formData, email_comercial: e.target.value })} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>WhatsApp Operacional</Label>
                      <Input value={formData.whatsapp_operacional} onChange={(e) => setFormData({ ...formData, whatsapp_operacional: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Prazo Médio (dias)</Label>
                      <Input type="number" value={formData.prazo_medio_dias} onChange={(e) => setFormData({ ...formData, prazo_medio_dias: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Regiões Atendidas</Label>
                    <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-muted/50">
                      {regioesBrasil.map(regiao => (
                        <Badge 
                          key={regiao}
                          variant={formData.regioes_atendidas.includes(regiao) ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${formData.regioes_atendidas.includes(regiao) ? 'bg-primary' : 'hover:bg-primary/20'}`}
                          onClick={() => toggleRegiao(regiao)}
                        >
                          {regiao}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <Label className="cursor-pointer">API Disponível</Label>
                      </div>
                      <Switch checked={formData.api_disponivel} onCheckedChange={(v) => setFormData({ ...formData, api_disponivel: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                        <Label className="cursor-pointer">Homologada</Label>
                      </div>
                      <Switch checked={formData.homologada} onCheckedChange={(v) => setFormData({ ...formData, homologada: v })} />
                    </div>
                  </div>

                  {formData.api_disponivel && (
                    <div className="space-y-2">
                      <Label>URL de Rastreamento</Label>
                      <Input value={formData.url_rastreamento} onChange={(e) => setFormData({ ...formData, url_rastreamento: e.target.value })} placeholder="https://..." />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit">{editingId ? "Salvar" : "Cadastrar"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.homologadas}</p>
                <p className="text-sm text-muted-foreground">Homologadas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.comApi}</p>
                <p className="text-sm text-muted-foreground">Com API</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-xp/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-xp" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.mediaScore}</p>
                <p className="text-sm text-muted-foreground">Score Médio</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(t => (
                <TransportadoraCard 
                  key={t.id} 
                  transportadora={t} 
                  onEdit={() => handleEdit(t)}
                  onDelete={() => handleDelete(t.id)}
                  onRefresh={fetchData}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nenhuma transportadora encontrada
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Regiões</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.nome_fantasia}</p>
                          <p className="text-xs text-muted-foreground">{t.razao_social}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{t.cnpj}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{t.contato_comercial}</p>
                          <p className="text-muted-foreground">{t.email_comercial}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {t.regioes_atendidas?.slice(0, 3).map(r => (
                            <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                          ))}
                          {t.regioes_atendidas?.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{t.regioes_atendidas.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{t.prazo_medio_dias ? `${t.prazo_medio_dias}d` : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={t.homologada ? "default" : "secondary"} className={t.homologada ? "bg-success/20 text-success" : ""}>
                          {t.homologada ? "Homologada" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell><ScoreBar score={t.score_performance} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(t)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-destructive">Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
