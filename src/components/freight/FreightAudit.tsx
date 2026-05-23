import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileCheck, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useFreightQuotation } from "@/hooks/logistics/useFreightQuotation";
import { toast } from 'sonner';
import { Decimal } from 'decimal.js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface AuditResult {
  status: 'success' | 'warning' | 'error';
  message?: string;
  expected?: number;
  charged?: number;
  diff?: number;
  diffPercent?: number;
  transportadora?: string;
}

interface AuditLogRecord {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Json;
  new_data: Json;
  user_email: string;
  created_at: string;
}

export function FreightAudit() {
  const { transportadoras, calculateQuotations } = useFreightQuotation();
  const [form, setForm] = useState({
    transportadora_id: '',
    estado_destino: '',
    peso_kg: '',
    valor_cobrado: '',
  });
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const { data: auditLogs } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as AuditLogRecord[];
    },
    staleTime: 30000,
  });

  const ESTADOS_BRASIL = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  const handleAudit = async () => {
    if (!form.transportadora_id || !form.estado_destino || !form.peso_kg || !form.valor_cobrado) {
      toast.error('Preencha todos os campos para auditoria');
      return;
    }

    const weight = new Decimal(form.peso_kg || 0).toNumber();
    const charged = new Decimal(form.valor_cobrado || 0);
    
    // Use the existing calculation logic
    const quotations = await calculateQuotations({
      estado_destino: form.estado_destino,
      peso_kg: weight,
    });

    const expectedQuotation = (quotations || []).find((q: any) => q.transportadora_id === form.transportadora_id);

    if (!expectedQuotation) {
      setAuditResult({
        status: 'error',
        message: 'Nenhuma tabela de frete encontrada para este trecho/transportadora.',
      });
      return;
    }

    const expectedValue = new Decimal(expectedQuotation.valor_total);
    const diff = charged.minus(expectedValue);
    const diffPercent = diff.dividedBy(expectedValue).times(100);

    setAuditResult({
      status: diff.abs().lessThan(0.01) ? 'success' : 'warning',
      expected: expectedValue.toNumber(),
      charged: charged.toNumber(),
      diff: diff.toNumber(),
      diffPercent: diffPercent.toNumber(),
      transportadora: expectedQuotation.transportadora_nome,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            Auditoria Manual de Frete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Transportadora</Label>
              <Select value={form.transportadora_id} onValueChange={v => setForm({ ...form, transportadora_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {transportadoras?.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome_fantasia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado Destino</Label>
              <Select value={form.estado_destino} onValueChange={v => setForm({ ...form, estado_destino: v })}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input 
                type="number" 
                value={form.peso_kg} 
                onChange={e => setForm({ ...form, peso_kg: e.target.value })} 
                placeholder="Ex: 10"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Cobrado (R$)</Label>
              <Input 
                type="number" 
                value={form.valor_cobrado} 
                onChange={e => setForm({ ...form, valor_cobrado: e.target.value })} 
                placeholder="Ex: 150.00"
              />
            </div>
          </div>
          <Button onClick={handleAudit} className="w-full md:w-auto">
            <Search className="w-4 h-4 mr-2" /> Auditar Lançamento
          </Button>
        </CardContent>
      </Card>

      {auditResult && (
        <Card className={auditResult.status === 'success' ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {auditResult.status === 'success' ? (
                <CheckCircle2 className="w-10 h-10 text-success shrink-0" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-warning shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold">
                  {auditResult.status === 'success' ? 'Valor Correto' : 'Divergência Detectada'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comparativo entre valor cobrado pela {auditResult.transportadora} e tabela registrada.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold">Valor em Tabela</p>
                    <p className="text-xl font-bold">{formatCurrency(auditResult.expected)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold">Valor Cobrado</p>
                    <p className="text-xl font-bold">{formatCurrency(auditResult.charged)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold">Diferença</p>
                    <p className={`text-xl font-bold ${(auditResult.diff ?? 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                      {formatCurrency(auditResult.diff ?? 0)} ({(auditResult.diffPercent ?? 0).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Últimas Alterações (Audit Trail)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs?.map((log) => (
              <div key={log.id} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded border border-border/50">
                <div className="flex flex-col">
                  <span className="font-bold">{log.table_name.toUpperCase()} - {log.action}</span>
                  <span className="text-muted-foreground">{log.user_email || 'Sistema'}</span>
                </div>
                <div className="text-right">
                  <span className="block font-medium">ID: {log.record_id.slice(0, 8)}...</span>
                  <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
