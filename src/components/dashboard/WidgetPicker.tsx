import { Plus, BarChart3, List, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WidgetDefinition } from "@/hooks/useDashboardWidgets";

interface WidgetPickerProps {
  availableWidgets: WidgetDefinition[];
  onAddWidget: (widgetId: string) => void;
}

const categoryIcons = {
  kpi: Activity,
  chart: BarChart3,
  list: List,
  action: Zap,
};

const categoryLabels = {
  kpi: "KPIs",
  chart: "Gráficos",
  list: "Listas",
  action: "Ações",
};

export function WidgetPicker({ availableWidgets, onAddWidget }: WidgetPickerProps) {
  const groupedWidgets = availableWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetDefinition[]>);

  if (availableWidgets.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Plus className="w-4 h-4 mr-2" />
        Todos widgets ativos
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 px-6 text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 border-white/10 hover:bg-primary hover:text-white hover:border-primary rounded-full transition-all shadow-xl group">
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          CUSTOMIZAR NEXUS
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-black/95 backdrop-blur-3xl border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {Object.entries(groupedWidgets).map(([category, widgets], index) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          return (
            <div key={category} className="p-1">
              {index > 0 && <DropdownMenuSeparator className="bg-white/5 my-2" />}
              <DropdownMenuLabel className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 px-3 py-2">
                <Icon className="w-4 h-4" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </DropdownMenuLabel>
              <div className="grid gap-1">
                {widgets.map((widget) => (
                  <DropdownMenuItem
                    key={widget.id}
                    onClick={() => onAddWidget(widget.id)}
                    className="cursor-pointer rounded-xl hover:bg-white/10 focus:bg-white/10 p-3 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-black italic tracking-tighter text-sm text-white uppercase">{widget.title}</span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter leading-tight">
                        {widget.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
