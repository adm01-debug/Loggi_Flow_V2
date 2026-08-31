import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, AlertCircle, DollarSign, Globe, MessageCircle, Mail, Star } from "lucide-react";
import type { CotacaoManual } from "./types";

function canalBadge(canal: string) {
  switch (canal) {
    case 'api': return <Badge className="bg-success/10 text-success border-success/20"><Globe className="w-3 h-3 mr-1" />API</Badge>;
    case 'whatsapp': return <Badge className="bg-success/10 text-success border-success/20"><MessageCircle className="w-3 h-3 mr-1" />WhatsApp</Badge>;
    case 'email': return <Badge className="bg-primary/10 text-primary border-primary/20"><Mail className="w-3 h-3 mr-1" />Email</Badge>;
    default: return null;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'respondido': return <Badge variant="default" className="bg-success"><CheckCircle2 className="w-3 h-3 mr-1" />Respondido</Badge>;
    case 'pendente': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    case 'expirado': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
    default: return null;
  }
}

interface CotacaoResultsTableProps {
  cotacoes: CotacaoManual[];
  melhorCotacao: CotacaoManual | null;
  onRegistrar: (transportadoraId: string) => void;
}

export function CotacaoResultsTable({ cotacoes, melhorCotacao, onRegistrar }: CotacaoResultsTableProps) {
  if (cotacoes.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-5 h-5 text-success" />
          Cotações Recebidas ({cotacoes.length})
        </CardTitle>
        {melhorCotacao && (
          <CardDescription>
            🏆 Melhor cotação: <strong>{melhorCotacao.transportadora_nome}</strong> — R$ {melhorCotacao.valor?.toFixed(2)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transportadora</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Obs</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...cotacoes].sort((a, b) => {
              if (a.valor === null) return 1;
              if (b.valor === null) return -1;
              return a.valor - b.valor;
            }).map((cot) => (
              <TableRow key={cot.id} className={melhorCotacao?.id === cot.id ? 'bg-success/5' : ''}>
                <TableCell className="font-medium">
                  {melhorCotacao?.id === cot.id && <Star className="w-4 h-4 text-warning inline mr-1" />}
                  {cot.transportadora_nome}
                </TableCell>
                <TableCell>{canalBadge(cot.canal)}</TableCell>
                <TableCell className="font-semibold">
                  {cot.valor !== null ? `R$ ${cot.valor.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>{cot.prazo_dias !== null ? `${cot.prazo_dias} dias` : '-'}</TableCell>
                <TableCell>{statusBadge(cot.status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{cot.observacoes}</TableCell>
                <TableCell>
                  {cot.status === 'pendente' && (
                    <Button size="sm" variant="outline" onClick={() => onRegistrar(cot.transportadora_id)}>
                      Registrar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
