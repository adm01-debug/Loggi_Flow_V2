import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw, Loader2, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrashBinProps {
  table: string;
  queryKey: string[];
  displayField: string;
  deletedAtColumn?: string;
}

export function TrashBin({ table, queryKey, displayField, deletedAtColumn = 'deleted_at' }: TrashBinProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: trashedItems = [], isLoading } = useQuery({
    queryKey: [...queryKey, 'trash'],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select('*').not(deletedAtColumn, 'is', null).order(deletedAtColumn, { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).update({ [deletedAtColumn]: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [...queryKey, 'trash'] });
      toast.success('Item restaurado');
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKey, 'trash'] });
      toast.success('Item excluído permanentemente');
    },
  });

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table).delete().not(deletedAtColumn, 'is', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKey, 'trash'] });
      toast.success('Lixeira esvaziada');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />Lixeira
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5" />Lixeira<Badge variant="secondary">{trashedItems.length}</Badge></DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : trashedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Lixeira vazia</div>
        ) : (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {trashedItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div><p className="font-medium">{item[displayField]}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Excluído em {format(new Date(item[deletedAtColumn]), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p></div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(item.id)} disabled={restoreMutation.isPending}><RotateCcw className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => permanentDeleteMutation.mutate(item.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
            {trashedItems.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" className="w-full">Esvaziar Lixeira</Button></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Esvaziar lixeira?</AlertDialogTitle><AlertDialogDescription>Todos os {trashedItems.length} itens serão excluídos permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => emptyTrashMutation.mutate()}>Esvaziar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
