import { memo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyData } from "@/hooks/analytics/useAnalytics";

interface AnalyticsChartsProps {
  data?: MonthlyData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const PerformanceChart = memo(({ data }: AnalyticsChartsProps) => {
  // Use real data if available, otherwise mock it for visual stability
  const chartData = data && data.length > 0 ? data : [
    { month: 'Jan', entregas: 0, slaAtingido: 0 },
    { month: 'Fev', entregas: 0, slaAtingido: 0 },
  ];

  return (
    <Card className="card-base border-primary/10 bg-black/40 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-primary">Volume vs Performance</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="month" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              stroke="rgba(255,255,255,0.3)"
              className="font-black uppercase"
            />
            <YAxis 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              stroke="rgba(255,255,255,0.3)"
              className="font-black"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
              itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
            />
            <Area 
              type="monotone" 
              dataKey="entregas" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorEntregas)" 
              name="Entregas"
            />
            <Line 
              type="monotone" 
              dataKey="slaAtingido" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              name="SLA (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

PerformanceChart.displayName = "PerformanceChart";

export const DistributionChart = memo(({ data }: AnalyticsChartsProps) => {
  const chartData = [
    { name: 'Norte', value: 400 },
    { name: 'Sul', value: 300 },
    { name: 'Leste', value: 300 },
    { name: 'Oeste', value: 200 },
  ];

  return (
    <Card className="card-base">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Distribuição Regional</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

DistributionChart.displayName = "DistributionChart";
