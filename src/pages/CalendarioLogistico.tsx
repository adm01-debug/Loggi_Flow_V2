import { useState, useMemo } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  Loader2,
} from "lucide-react";
import { useLogisticsCalendar } from "@/hooks/logistics/useLogisticsCalendar";
import { cn } from "@/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalendarioLogistico() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Use proper filter format
  const calendarResult = useLogisticsCalendar({
    status: [],
    transportadoraId: null,
    type: "all",
    from: startOfMonth(currentMonth),
    to: endOfMonth(currentMonth),
  });

  const events = calendarResult.data || [];
  const isLoading = calendarResult.isLoading;
  const isError = calendarResult.isError;
  const error = calendarResult.error;

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => isSameDay(new Date(e.date), date));
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const getEventCountForDay = (date: Date) => getEventsForDate(date).length;

  if (isError) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar calendário logístico"
            description={
              error?.message ||
              "Não foi possível carregar os eventos. Tente novamente."
            }
            action={{
              label: "Tentar novamente",
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-accent-foreground animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Agenda Logística</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                    <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    <span className="text-[10px] font-black text-accent-foreground uppercase tracking-[0.3em]">
                      Master_Scheduler
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    CONTROLE TEMPORAL • SLA FOCUS
                  </span>
                </div>
              </div>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div
                  key={d}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto my-12" />
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({
                  length: new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    1,
                  ).getDay(),
                }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const count = getEventCountForDay(day);
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "p-2 rounded-lg text-center transition-all min-h-[60px]",
                        isToday(day) && "ring-2 ring-primary",
                        isSelected && "bg-primary text-primary-foreground",
                        !isSelected && "hover:bg-muted",
                        count > 0 && !isSelected && "bg-primary/10",
                      )}
                    >
                      <span className="text-sm">{format(day, "d")}</span>
                      {count > 0 && (
                        <div className="flex justify-center mt-1">
                          <Badge
                            variant={isSelected ? "secondary" : "default"}
                            className="text-xs px-1"
                          >
                            {count}
                          </Badge>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-base p-4">
            <h3 className="font-semibold mb-4">
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : "Selecione uma data"}
            </h3>
            {selectedDate ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedEvents.length > 0 ? (
                  selectedEvents.map((e, i) => (
                    <div
                      key={i}
                      className="card-interactive flex items-center gap-3"
                    >
                      {e.type === "entrega" ? (
                        <Truck className="w-5 h-5 text-info" />
                      ) : (
                        <Package className="w-5 h-5 text-success" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.details.endereco}
                        </p>
                      </div>
                      <Badge
                        variant={(():
                          "secondary" | "default" | "destructive" => {
                          if (e.status === "pendente") return "secondary";
                          if (
                            e.status === "finalizada" ||
                            e.status === "entregue"
                          )
                            return "default";
                          return "destructive";
                        })()}
                      >
                        {e.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum evento nesta data
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Clique em uma data para ver os eventos
              </p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
