import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, RefreshCw, Truck, MapPin } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { SavedFiltersDropdown } from '@/components/SavedFiltersDropdown';
import { AdvancedFilters, FilterValue, FilterConfig } from '@/components/AdvancedFilters';
import { DataImporter } from '@/components/DataImporter';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { entregaSchema, loggiImportTemplates, loggiFilterConfigs } from '@/lib/loggiSchemas';
import { exportToExcel } from '@/lib/excelImporter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EntregasToolbarProps {
  onSearch: (term: string) => void;
  onFiltersChange: (filters: FilterValue[]) => void;
  onRefresh: () => void;
  onNewClick: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDespachar: () => void;
  onBulkFinalizar: () => void;
  currentFilters: Record<string, unknown>;
  data?: unknown[];
}

export const EntregasToolbar = memo(function EntregasToolbar({ onSearch, onFiltersChange, onRefresh, onNewClick, selectedCount, onClearSelection, onBulkDespachar, onBulkFinalizar, currentFilters, data = [] }: EntregasToolbarProps) {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);

  const handleImport = async (entregas: unknown[]) => {
    const { error } = await supabase.from('entregas').insert(entregas);
    if (error) throw error;
    toast.success(`${entregas.length} entregas importadas!`);
    onRefresh();
  };

  const handleExport = () => {
    if (data.length === 0) { toast.warning('Nenhum dado'); return; }
    exportToExcel(data as Record<string, unknown>[], [
      { key: 'codigo' as const, label: 'Código' },
      { key: 'destinatario_nome' as const, label: 'Destinatário' },
      { key: 'destinatario_endereco' as const, label: 'Endereço' },
      { key: 'status' as const, label: 'Status' },
      { key: 'motorista_nome' as const, label: 'Motorista' },
    ], 'entregas', 'Entregas');
    toast.success('Exportado!');
  };

  const bulkActions = [
    { key: 'despachar', label: 'Despachar', icon: <Truck className="h-4 w-4" />, onClick: onBulkDespachar },
    { key: 'finalizar', label: 'Finalizar', icon: <MapPin className="h-4 w-4" />, onClick: onBulkFinalizar },
  ];

  return (
    <div className="space-y-3">
      {selectedCount > 0 && <BulkActionsBar selectedCount={selectedCount} onClearSelection={onClearSelection} actions={bulkActions} />}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <SearchInput onSearch={onSearch} placeholder="Buscar entrega..." className="w-64" />
          <AdvancedFilters filters={loggiFilterConfigs.entregas as FilterConfig[]} values={filterValues} onChange={(v) => { setFilterValues(v); onFiltersChange(v); }} />
          <SavedFiltersDropdown entityType="entregas" currentFilters={currentFilters} onApplyFilter={(f) => { const values = Object.entries(f).map(([k,v]) => ({ key: k, operator: 'eq' as const, value: v })); setFilterValues(values); onFiltersChange(values); }} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="h-4 w-4" /></Button>
          <DataImporter schema={entregaSchema} columns={loggiImportTemplates.entregas} onImport={handleImport} templateName="entregas" title="Importar Entregas" trigger={<Button variant="outline" size="sm"><Upload className="h-4 w-4" /></Button>} onSuccess={onRefresh} />
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4" /></Button>
          <Button size="sm" onClick={onNewClick}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
});
export default EntregasToolbar;
