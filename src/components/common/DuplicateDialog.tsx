import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Loader2 } from 'lucide-react';

interface DuplicateDialogProps<T> { item: T; nameField: keyof T; onDuplicate: (item: T, options: { newName: string; copyRelated: boolean }) => Promise<void>; relatedLabel?: string; trigger?: React.ReactNode; }

export function DuplicateDialog<T>({ item, nameField, onDuplicate, relatedLabel = 'itens relacionados', trigger }: DuplicateDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(`${item[nameField]} (Cópia)`);
  const [copyRelated, setCopyRelated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDuplicate = async () => {
    setIsLoading(true);
    try { await onDuplicate(item, { newName, copyRelated }); setOpen(false); }
    catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setNewName(`${item[nameField]} (Cópia)`); }}>
      <DialogTrigger asChild>{trigger || <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Duplicar Registro</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label>Nome da cópia</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1" /></div>
          <div className="flex items-center gap-2"><Checkbox id="copyRelated" checked={copyRelated} onCheckedChange={(c) => setCopyRelated(!!c)} /><Label htmlFor="copyRelated" className="text-sm">Copiar {relatedLabel}</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleDuplicate} disabled={isLoading || !newName.trim()}>{isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}Duplicar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
