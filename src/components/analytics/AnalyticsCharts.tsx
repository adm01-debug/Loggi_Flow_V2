import { memo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsChartsProps {
  data?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const PerformanceChart = memo(({ data }: AnalyticsChartsProps) => {
  const chartData = [
    { name: 'Seg', entregas: 400, onTime: 380 },
    { name: 'Ter', entregas: 300, onTime: 290 },
    { name: 'Qua', entregas: 200, onTime: 190 },
    { name: 'Qui', entregas: 278, onTime: 260 },
    { name: 'Sex', entregas: 189, onTime: 180 },
    { name: 'Sáb', entregas: 239, onTime: 230 },
    { name: 'Dom', entregas: 349, onTime: 340 },
  ];

  return (
    <Card className="card-base">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Performance de Entregas</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="entregas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="onTime" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
          </BarChart>
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
