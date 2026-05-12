import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLogisticaReversaReal, LogisticaReversa } from "@/hooks/useLogisticaReversaReal";
import { 
  RotateCcw, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LogisticaReversa() {
  const { list, updateStatus } = useLogisticaReversaReal();
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: LogisticaReversa['status']) => {
    const variants: Record<LogisticaReversa['status'], { label: string, color: string, icon: any }> = {
      pendente: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
      aprovado: { label: "Aprovado", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CheckCircle2 },
      em_transito: { label: "Em Trânsito", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Truck },
      recebido: { label: "Recebido", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: Package },
      cancelado: { label: "Cancelado", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
    };

    const config = variants[status] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1 px-2 py-0.5`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredData = list.data?.filter(item => 
    item.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.clientes?.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo_rastreio_reverso?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <RotateCcw className="w-8 h-8 text-primary" />
              Logística Reversa
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão inteligente de devoluções, estornos e retornos de mercadorias.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Pendentes</CardTitle>
              <CardTitle className="text-2xl">{list.data?.filter(i => i.status === 'pendente').length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Em Trânsito</CardTitle>
              <CardTitle className="text-2xl">{list.data?.filter(i => i.status === 'em_transito').length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Resolvidos</CardTitle>
              <CardTitle className="text-2xl text-green-500">{list.data?.filter(i => i.status === 'recebido').length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Taxa de Devolução</CardTitle>
              <CardTitle className="text-2xl text-primary">4.2%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar por motivo, cliente ou rastreio..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
                <Button variant="outline" size="sm">Exportar</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Cliente / Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data Solicitação</TableHead>
                    <TableHead>Rastreio Reverso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        Nenhuma solicitação de logística reversa encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData?.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{item.id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.clientes?.razao_social || "Cliente não identificado"}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{item.motivo}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={item.prioridade === 'alta' ? 'border-red-500 text-red-500' : ''}>
                            {item.prioridade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.codigo_rastreio_reverso || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem className="gap-2">
                                <Search className="w-4 h-4" /> Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="gap-2 text-blue-500"
                                onClick={() => updateStatus.mutate({ id: item.id, status: 'aprovado' })}
                              >
                                <CheckCircle2 className="w-4 h-4" /> Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2 text-purple-500"
                                onClick={() => updateStatus.mutate({ id: item.id, status: 'em_transito' })}
                              >
                                <Truck className="w-4 h-4" /> Em Trânsito
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2 text-green-500"
                                onClick={() => updateStatus.mutate({ id: item.id, status: 'recebido' })}
                              >
                                <Package className="w-4 h-4" /> Recebido
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="gap-2 text-red-500"
                                onClick={() => updateStatus.mutate({ id: item.id, status: 'cancelado' })}
                              >
                                <XCircle className="w-4 h-4" /> Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
