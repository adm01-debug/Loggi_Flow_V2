import { useState } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface Props {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  isExporting?: boolean;
}

const presets = [
  { label: 'Últimos 7 dias', value: '7d', getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Últimos 30 dias', value: '30d', getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Este mês', value: 'this-month', getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'Mês passado', value: 'last-month', getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Últimos 3 meses', value: '3m', getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: 'Últimos 6 meses', value: '6m', getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  { label: 'Este ano', value: 'this-year', getRange: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

export function AnalyticsFilters({ 
  dateRange, 
  onDateRangeChange, 
  onExportPDF, 
  onExportExcel,
  isExporting 
}: Props) {
  const [preset, setPreset] = useState<string>('6m');

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const selectedPreset = presets.find(p => p.value === value);
    if (selectedPreset) {
      onDateRangeChange(selectedPreset.getRange());
    }
  };

  const handleFromChange = (date: Date | undefined) => {
    if (date) {
      setPreset('custom');
      onDateRangeChange({ ...dateRange, from: date });
    }
  };

  const handleToChange = (date: Date | undefined) => {
    if (date) {
      setPreset('custom');
      onDateRangeChange({ ...dateRange, to: date });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Preset selector */}
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map(p => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
          {preset === 'custom' && (
            <SelectItem value="custom">Personalizado</SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* From date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "De"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateRange.from}
            onSelect={handleFromChange}
            locale={ptBR}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">até</span>

      {/* To date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !dateRange.to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Até"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateRange.to}
            onSelect={handleToChange}
            locale={ptBR}
            disabled={(date) => date < dateRange.from}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={isExporting}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4 text-destructive" />
            Exportar PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExportExcel} className="gap-2 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 text-success" />
            Exportar Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
