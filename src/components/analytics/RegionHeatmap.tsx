import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Clock } from 'lucide-react';

interface HeatmapData {
  hour: number;
  region: string;
  count: number;
  intensity: number;
}

interface Props {
  data: HeatmapData[];
}

export function RegionHeatmap({ data }: Props) {
  const { regions, hours, matrix, peakInfo } = useMemo(() => {
    // Get unique regions and hours
    const regionSet = new Set(data.map(d => d.region));
    const hourSet = new Set(data.map(d => d.hour));
    
    const regions = Array.from(regionSet).sort();
    const hours = Array.from(hourSet).sort((a, b) => a - b);
    
    // Create matrix
    const matrix: Record<string, Record<number, HeatmapData>> = {};
    let peak = { region: '', hour: 0, count: 0 };
    
    data.forEach(d => {
      if (!matrix[d.region]) matrix[d.region] = {};
      matrix[d.region][d.hour] = d;
      
      if (d.count > peak.count) {
        peak = { region: d.region, hour: d.hour, count: d.count };
      }
    });
    
    return { regions, hours, matrix, peakInfo: peak };
  }, [data]);

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/30';
    if (intensity < 0.2) return 'bg-success/20';
    if (intensity < 0.4) return 'bg-success/40';
    if (intensity < 0.6) return 'bg-warning/40';
    if (intensity < 0.8) return 'bg-warning/70';
    return 'bg-destructive/80';
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}h`;
  };

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗺️ Heatmap de Horários por Região
        </CardTitle>
        <CardDescription>
          Concentração de operações por horário e estado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Peak info */}
        {peakInfo.count > 0 && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">{peakInfo.region}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{formatHour(peakInfo.hour)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              = Pico ({peakInfo.count} operações)
            </span>
          </div>
        )}

        {/* Heatmap grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Hours header */}
            <div className="flex items-center mb-2">
              <div className="w-12 flex-shrink-0" />
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="flex-1 text-center text-xs text-muted-foreground font-medium"
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Region rows */}
            {regions.map(region => (
              <div key={region} className="flex items-center mb-1">
                <div className="w-12 flex-shrink-0 text-sm font-medium text-foreground">
                  {region}
                </div>
                {hours.map(hour => {
                  const cell = matrix[region]?.[hour];
                  const intensity = cell?.intensity || 0;
                  const count = cell?.count || 0;
                  
                  return (
                    <div 
                      key={`${region}-${hour}`}
                      className={cn(
                        "flex-1 h-8 mx-0.5 rounded transition-all duration-200 hover:scale-105 cursor-pointer",
                        "flex items-center justify-center text-xs font-medium",
                        getIntensityColor(intensity),
                        intensity > 0.5 && "text-white"
                      )}
                      title={`${region} às ${formatHour(hour)}: ${count} operações`}
                    >
                      {count > 0 && count}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Baixo</span>
          <div className="flex gap-1">
            <div className="w-6 h-4 rounded bg-success/20" />
            <div className="w-6 h-4 rounded bg-success/40" />
            <div className="w-6 h-4 rounded bg-warning/40" />
            <div className="w-6 h-4 rounded bg-warning/70" />
            <div className="w-6 h-4 rounded bg-destructive/80" />
          </div>
          <span className="text-xs text-muted-foreground">Alto</span>
        </div>
      </CardContent>
    </Card>
  );
}
