import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bookmark, Trash2, Play, Plus } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { CargoTemplate, CargoData } from '@/hooks/useQuotationFlow';

interface CargoTemplatesProps {
  templates: CargoTemplate[];
  currentData: CargoData | null;
  onSave: (nome: string, data: CargoData) => void;
  onDelete: (id: string) => void;
  onLoad: (template: CargoTemplate) => void;
}

export function CargoTemplates({ templates, currentData, onSave, onDelete, onLoad }: CargoTemplatesProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = () => {
    if (!currentData || !templateName) return;
    onSave(templateName, currentData);
    setSaveOpen(false);
    setTemplateName('');
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Templates de Carga</h3>
        {currentData && (
          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Salvar Atual</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Salvar Template</DialogTitle></DialogHeader>
              <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Nome do template (ex: Carga SP 50kg)" />
              <DialogFooter>
                <Button onClick={handleSave} disabled={!templateName}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={Bookmark} title="Sem templates" description="Salve cargas frequentes para reuso rápido" />
      ) : (
        <div className="grid gap-2">
          {templates.map(t => (
            <div key={t.id} className="card-interactive flex items-center gap-3">
              <Bookmark className="w-4 h-4 text-warning shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">{t.nome}</p>
                <p className="text-xs text-muted-foreground">{t.data.estado_destino} · {t.data.peso_kg}kg · {t.data.volumes} vol</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onLoad(t)}><Play className="w-4 h-4 text-success" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir template?"
        description="Este template será removido permanentemente."
        confirmText="Excluir"
        onConfirm={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}
        type="danger"
      />
    </div>
  );
}
