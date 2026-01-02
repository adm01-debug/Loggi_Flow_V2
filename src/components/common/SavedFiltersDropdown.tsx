import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Filter, Star, Trash2, Plus, Loader2 } from 'lucide-react';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { cn } from '@/lib/utils';

interface SavedFiltersDropdownProps {
  entityType: string;
  currentFilters: Record<string, any>;
  onApplyFilter: (filters: Record<string, any>) => void;
}

export function SavedFiltersDropdown({ entityType, currentFilters, onApplyFilter }: SavedFiltersDropdownProps) {
  const { filters, saveFilter, deleteFilter, setDefault, isSaving } = useSavedFilters(entityType);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleSave = () => {
    if (!filterName.trim()) return;
    saveFilter({ name: filterName.trim(), filters: currentFilters });
    setFilterName('');
    setShowSaveDialog(false);
  };

  const hasActiveFilters = Object.values(currentFilters).some(v => v !== undefined && v !== '' && v !== null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros Salvos
            {filters.length > 0 && <span className="bg-primary/20 text-primary px-1.5 rounded text-xs">{filters.length}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {hasActiveFilters && (
            <>
              <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Salvar Filtro Atual
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {filters.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Nenhum filtro salvo</div>
          ) : (
            filters.map((filter) => (
              <DropdownMenuItem key={filter.id} className="flex items-center justify-between group">
                <div className="flex-1 cursor-pointer" onClick={() => onApplyFilter(filter.filters)}>
                  <div className="flex items-center gap-2">
                    {filter.is_default && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                    <span className="truncate">{filter.name}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setDefault(filter.id); }}>
                    <Star className={cn("h-3 w-3", filter.is_default && "fill-yellow-500")} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFilter(filter.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Salvar Filtro</DialogTitle></DialogHeader>
          <Input placeholder="Nome do filtro..." value={filterName} onChange={(e) => setFilterName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!filterName.trim() || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
