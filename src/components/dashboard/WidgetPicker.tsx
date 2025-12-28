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
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Widget
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {Object.entries(groupedWidgets).map(([category, widgets], index) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          return (
            <div key={category}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </DropdownMenuLabel>
              {widgets.map((widget) => (
                <DropdownMenuItem
                  key={widget.id}
                  onClick={() => onAddWidget(widget.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{widget.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {widget.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
