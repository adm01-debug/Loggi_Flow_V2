import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Filter, Plus, X, Search } from 'lucide-react';

export interface FilterConfig { 
  key: string; 
  label: string; 
  type: 'text' | 'select' | 'date' | 'number'; 
  options?: { value: string; label: string }[]; 
}

export interface FilterValue { 
  key: string; 
  operator: string; 
  value: unknown; 
}

interface FilterField { key: string; label: string; type: 'text' | 'select' | 'date' | 'number'; options?: { value: string; label: string }[]; }
interface FilterCondition { field: string; operator: string; value: string; }
export interface AdvancedFilterProps { 
  fields?: FilterField[]; 
  filters?: FilterConfig[];
  values?: FilterValue[];
  onApply?: (filters: FilterCondition[]) => void;
  onChange?: (values: FilterValue[]) => void;
}

const operators: Record<string, { value: string; label: string }[]> = {
  text: [{ value: 'contains', label: 'Contém' }, { value: 'equals', label: 'Igual a' }, { value: 'starts', label: 'Começa com' }],
  select: [{ value: 'equals', label: 'Igual a' }, { value: 'not_equals', label: 'Diferente de' }],
  number: [{ value: 'equals', label: '=' }, { value: 'gt', label: '>' }, { value: 'lt', label: '<' }, { value: 'gte', label: '>=' }, { value: 'lte', label: '<=' }],
  date: [{ value: 'equals', label: 'Em' }, { value: 'before', label: 'Antes de' }, { value: 'after', label: 'Após' }],
};

export function AdvancedFilter({ fields, filters, values, onApply, onChange }: AdvancedFilterProps) {
  // Support both old API (fields/onApply) and new API (filters/values/onChange)
  const actualFields = filters?.map(f => ({ key: f.key, label: f.label, type: f.type, options: f.options })) || fields || [];
  
  const [conditions, setConditions] = useState<FilterCondition[]>(() => 
    values?.map(v => ({ field: v.key, operator: v.operator, value: String(v.value) })) || []
  );
  const [open, setOpen] = useState(false);

  const addCondition = () => setConditions([...conditions, { field: actualFields[0]?.key || '', operator: 'contains', value: '' }]);
  const removeCondition = (index: number) => setConditions(conditions.filter((_, i) => i !== index));
  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  const handleApply = () => { 
    const validConditions = conditions.filter(c => c.value);
    if (onApply) {
      onApply(validConditions);
    }
    if (onChange) {
      onChange(validConditions.map(c => ({ key: c.field, operator: c.operator, value: c.value })));
    }
    setOpen(false); 
  };
  
  const handleClear = () => { 
    setConditions([]); 
    if (onApply) onApply([]); 
    if (onChange) onChange([]);
  };

  const activeCount = conditions.filter(c => c.value).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />Filtros Avançados
          {activeCount > 0 && <Badge variant="secondary" className="ml-1">{activeCount}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px]" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h4 className="font-semibold">Filtros Avançados</h4><Button variant="ghost" size="sm" onClick={addCondition}><Plus className="h-4 w-4 mr-1" />Adicionar</Button></div>
          {conditions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Clique em "Adicionar" para criar um filtro</p> : (
            <div className="space-y-2">
              {conditions.map((cond, i) => {
                const field = actualFields.find(f => f.key === cond.field);
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <Select value={cond.field} onValueChange={(v) => updateCondition(i, { field: v, operator: operators[actualFields.find(f => f.key === v)?.type || 'text'][0].value })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{actualFields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent></Select>
                    <Select value={cond.operator} onValueChange={(v) => updateCondition(i, { operator: v })}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{operators[field?.type || 'text'].map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                    {field?.type === 'select' ? (<Select value={cond.value} onValueChange={(v) => updateCondition(i, { value: v })}><SelectTrigger className="flex-1"><SelectValue placeholder="Valor" /></SelectTrigger><SelectContent>{field.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>) : (<Input type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'} value={cond.value} onChange={(e) => updateCondition(i, { value: e.target.value })} placeholder="Valor" className="flex-1" />)}
                    <Button variant="ghost" size="icon" onClick={() => removeCondition(i)}><X className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-between pt-2 border-t">{activeCount > 0 && <Button variant="ghost" size="sm" onClick={handleClear}>Limpar</Button>}<Button size="sm" onClick={handleApply} className="ml-auto"><Search className="h-4 w-4 mr-1" />Aplicar</Button></div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
