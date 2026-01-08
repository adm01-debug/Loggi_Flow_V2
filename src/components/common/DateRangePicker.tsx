import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: "start" | "center" | "end";
  disabled?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Selecione o período",
  className,
  align = "start",
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
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
              "justify-start text-left font-normal h-10 min-h-[44px] text-xs sm:text-sm",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1.5 sm:mr-2 h-4 w-4 shrink-0" />
            {value?.from ? (
              value.to ? (
                <span className="truncate">
                  <span className="hidden sm:inline">
                    {format(value.from, "dd/MM/yyyy", { locale: ptBR })} - {format(value.to, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <span className="sm:hidden">
                    {format(value.from, "dd/MM", { locale: ptBR })} - {format(value.to, "dd/MM", { locale: ptBR })}
                  </span>
                </span>
              ) : (
                <span className="truncate">{format(value.from, "dd/MM/yyyy", { locale: ptBR })}</span>
              )
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
            {value && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100 shrink-0"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={(range) => {
              onChange(range);
              if (range?.from && range?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 2}
            locale={ptBR}
            className="text-sm"
          />
          <div className="flex justify-end gap-2 p-2 sm:p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
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
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Presets de períodos
export const dateRangePresets = {
  today: () => {
    const today = new Date();
    return { from: today, to: today };
  },
  yesterday: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday, to: yesterday };
  },
  last7Days: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return { from: start, to: end };
  },
  last30Days: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { from: start, to: end };
  },
  thisMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: start, to: end };
  },
  lastMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: start, to: end };
  },
};

export default DateRangePicker;
