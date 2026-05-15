import * as React from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";

// Presets de períodos
export const dateRangePresets = {
  today: () => {
    const today = new Date();
    return { from: today, to: today };
  },
  yesterday: () => {
    const yesterday = subDays(new Date(), 1);
    return { from: yesterday, to: yesterday };
  },
  last7Days: () => {
    const end = new Date();
    const start = subDays(end, 6);
    return { from: start, to: end };
  },
  last14Days: () => {
    const end = new Date();
    const start = subDays(end, 13);
    return { from: start, to: end };
  },
  last30Days: () => {
    const end = new Date();
    const start = subDays(end, 29);
    return { from: start, to: end };
  },
  thisWeek: () => {
    const now = new Date();
    return { from: startOfWeek(now, { locale: ptBR }), to: endOfWeek(now, { locale: ptBR }) };
  },
  lastWeek: () => {
    const lastWeekStart = startOfWeek(subDays(new Date(), 7), { locale: ptBR });
    const lastWeekEnd = endOfWeek(subDays(new Date(), 7), { locale: ptBR });
    return { from: lastWeekStart, to: lastWeekEnd };
  },
  thisMonth: () => {
    const now = new Date();
    return { from: startOfMonth(now), to: endOfMonth(now) };
  },
  lastMonth: () => {
    const lastMonth = subMonths(new Date(), 1);
    return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
  },
  thisQuarter: () => {
    const now = new Date();
    return { from: startOfQuarter(now), to: endOfQuarter(now) };
  },
  last90Days: () => {
    const end = new Date();
    const start = subDays(end, 89);
    return { from: start, to: end };
  },
};

interface PresetButton {
  label: string;
  value: keyof typeof dateRangePresets;
}

const presetButtons: PresetButton[] = [
  { label: "Hoje", value: "today" },
  { label: "Ontem", value: "yesterday" },
  { label: "Últimos 7 dias", value: "last7Days" },
  { label: "Últimos 14 dias", value: "last14Days" },
  { label: "Últimos 30 dias", value: "last30Days" },
  { label: "Esta semana", value: "thisWeek" },
  { label: "Semana passada", value: "lastWeek" },
  { label: "Este mês", value: "thisMonth" },
  { label: "Mês passado", value: "lastMonth" },
  { label: "Este trimestre", value: "thisQuarter" },
  { label: "Últimos 90 dias", value: "last90Days" },
];

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: "start" | "center" | "end";
  disabled?: boolean;
  showPresets?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Selecione o período",
  className,
  align = "start",
  disabled = false,
  showPresets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSelectedPreset(null);
  };

  const handlePresetClick = (preset: keyof typeof dateRangePresets, label: string) => {
    const range = dateRangePresets[preset]();
    onChange(range);
    setSelectedPreset(label);
    setOpen(false);
  };

  const handleCustomSelect = (range: DateRange | undefined) => {
    onChange(range);
    setSelectedPreset(null);
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-start text-left font-normal h-10 min-h-[44px] text-xs sm:text-sm group",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1.5 sm:mr-2 h-4 w-4 shrink-0 group-hover:text-primary transition-colors" />
            {value?.from ? (
              value.to ? (
                <span className="truncate">
                  {selectedPreset ? (
                    <span className="font-medium text-primary">{selectedPreset}</span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">
                        {format(value.from, "dd/MM/yyyy", { locale: ptBR })} - {format(value.to, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="sm:hidden">
                        {format(value.from, "dd/MM", { locale: ptBR })} - {format(value.to, "dd/MM", { locale: ptBR })}
                      </span>
                    </>
                  )}
                </span>
              ) : (
                <span className="truncate">{format(value.from, "dd/MM/yyyy", { locale: ptBR })}</span>
              )
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
            {value ? (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100 shrink-0 hover:text-destructive transition-colors"
                onClick={handleClear}
              />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4 opacity-50 shrink-0" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex flex-col sm:flex-row">
            {/* Presets sidebar */}
            {showPresets && (
              <div className="border-b sm:border-b-0 sm:border-r border-border p-2 sm:p-3 sm:w-44 flex-shrink-0">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Atalhos</p>
                <div className="flex flex-wrap sm:flex-col gap-1">
                  {presetButtons.map((preset) => (
                    <motion.button
                      key={preset.value}
                      onClick={() => handlePresetClick(preset.value, preset.label)}
                      className={cn(
                        "text-left text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        selectedPreset === preset.label && "bg-primary/10 text-primary font-medium"
                      )}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {preset.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar */}
            <div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={handleCustomSelect}
                numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 2}
                locale={ptBR}
                className="text-sm p-3"
              />
              <div className="flex justify-between items-center gap-2 p-2 sm:p-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {value?.from && value?.to && (
                    <>
                      {Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} dias selecionados
                    </>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onChange(undefined);
                      setSelectedPreset(null);
                    }}
                    className="h-8 text-xs sm:text-sm"
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="h-8 text-xs sm:text-sm"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateRangePicker;
