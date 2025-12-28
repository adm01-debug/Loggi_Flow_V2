import { useState } from 'react';
import { Plus, Trash2, Clock, Mail, Calendar, BarChart3, Truck, Package, DollarSign, Target, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScheduledReports, ScheduledReportFormData } from '@/hooks/useScheduledReports';
import { toast } from 'sonner';

const REPORT_TYPES = [
  { value: 'entregas', label: 'Entregas', icon: Package },
  { value: 'coletas', label: 'Coletas', icon: Truck },
  { value: 'custos', label: 'Custos Logísticos', icon: DollarSign },
  { value: 'sla', label: 'SLA Performance', icon: Target },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export function ScheduledReportsManager() {
  const { reports, isLoading, createReport, deleteReport, generateReport, updateReport } = useScheduledReports();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ScheduledReportFormData>({
    name: '',
    report_type: 'entregas',
    frequency: 'weekly',
    day_of_week: 1,
    time_of_day: '08:00',
    recipients: [''],
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRecipients = formData.recipients.filter(r => r.trim());
    if (validRecipients.length === 0) {
      toast.error('Adicione pelo menos um destinatário');
      return;
    }
    await createReport.mutateAsync({ ...formData, recipients: validRecipients });
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      report_type: 'entregas',
      frequency: 'weekly',
      day_of_week: 1,
      time_of_day: '08:00',
      recipients: [''],
      is_active: true,
    });
  };

  const addRecipient = () => {
    setFormData(prev => ({ ...prev, recipients: [...prev.recipients, ''] }));
  };

  const updateRecipient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r),
    }));
  };

  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const handleGenerateNow = async (reportType: string) => {
    toast.loading('Gerando relatório...');
    try {
      const result = await generateReport.mutateAsync({ report_type: reportType });
      toast.dismiss();
      toast.success('Relatório gerado! Verifique o console.');
      console.log('Report data:', result);
    } catch {
      toast.dismiss();
      toast.error('Erro ao gerar relatório');
    }
  };

  const getReportIcon = (type: string) => {
    const report = REPORT_TYPES.find(r => r.value === type);
    return report?.icon || BarChart3;
  };

  const getFrequencyLabel = (freq: string) => {
    return FREQUENCIES.find(f => f.value === freq)?.label || freq;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Relatórios Agendados</h2>
          <p className="text-sm text-muted-foreground">Configure relatórios automáticos por email</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agendar Relatório</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Relatório</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Resumo semanal de entregas"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Relatório</Label>
                  <Select
                    value={formData.report_type}
                    onValueChange={v => setFormData(prev => ({ ...prev, report_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={v => setFormData(prev => ({ ...prev, frequency: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select
                    value={String(formData.day_of_week)}
                    onValueChange={v => setFormData(prev => ({ ...prev, day_of_week: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(d => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label>Dia do Mês</Label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={formData.day_of_month || 1}
                    onChange={e => setFormData(prev => ({ ...prev, day_of_month: parseInt(e.target.value) }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time_of_day}
                  onChange={e => setFormData(prev => ({ ...prev, time_of_day: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Destinatários</Label>
                {formData.recipients.map((email, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={e => updateRecipient(i, e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                    {formData.recipients.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipient(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addRecipient} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createReport.isPending}>
                  Criar Agendamento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">Nenhum relatório agendado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie agendamentos para receber relatórios automáticos por email
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Agendamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map(report => {
            const Icon = getReportIcon(report.report_type);
            return (
              <Card key={report.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{report.name}</CardTitle>
                    </div>
                    <Badge variant={report.is_active ? 'default' : 'secondary'}>
                      {report.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{getFrequencyLabel(report.frequency)}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{report.time_of_day}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{report.recipients.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateNow(report.report_type)}
                      disabled={generateReport.isPending}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Gerar Agora
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReport.mutate(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
