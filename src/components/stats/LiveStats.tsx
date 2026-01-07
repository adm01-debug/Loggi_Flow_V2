import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, Activity, 
  Users, Package, Truck, Clock, DollarSign,
  BarChart3, PieChart, Zap, RefreshCw, Wifi, WifiOff,
  ArrowUpRight, ArrowDownRight, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================
// ANIMATED COUNTER WITH SPRING
// ============================================
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1,
  prefix = '',
  suffix = '',
  decimals = 0,
  className
}) => {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => 
    `${prefix}${current.toFixed(decimals)}${suffix}`
  );
  const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`);
  
  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return () => unsubscribe();
  }, [value, spring, display]);

  return (
    <motion.span 
      className={className}
      key={value}
    >
      {displayValue}
    </motion.span>
  );
};

// ============================================
// LIVE STAT CARD
// ============================================
interface LiveStatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent' | 'time';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  isLive?: boolean;
  lastUpdate?: Date;
  loading?: boolean;
  onClick?: () => void;
  compact?: boolean;
  pulse?: boolean;
}

export const LiveStatCard: React.FC<LiveStatCardProps> = ({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  trend,
  isLive = false,
  lastUpdate,
  loading,
  onClick,
  compact = false,
  pulse = false
}) => {
  const [hasUpdated, setHasUpdated] = useState(false);
  
  // Calculate trend if not provided
  const calculatedTrend = trend || (previousValue !== undefined 
    ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
    : 'neutral'
  );
  
  const percentChange = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  // Format value based on type
  const formatValue = useCallback((val: number) => {
    switch (format) {
      case 'currency':
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'time':
        const hours = Math.floor(val / 60);
        const minutes = Math.round(val % 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      default:
        return val.toLocaleString('pt-BR');
    }
  }, [format]);

  // Flash effect when value changes
  useEffect(() => {
    setHasUpdated(true);
    const timer = setTimeout(() => setHasUpdated(false), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  const TrendIcon = calculatedTrend === 'up' 
    ? TrendingUp 
    : calculatedTrend === 'down' 
    ? TrendingDown 
    : Minus;

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1, y: onClick ? -2 : 0 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer")}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        hasUpdated && "ring-2 ring-primary/50",
        compact ? "p-3" : "p-4"
      )}>
        {/* Live indicator */}
        {isLive && (
          <motion.div 
            className="absolute top-2 right-2 flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-green-500 font-medium">LIVE</span>
          </motion.div>
        )}
        
        {/* Pulse effect */}
        {pulse && (
          <motion.div
            className="absolute inset-0 bg-primary/5"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <CardContent className={cn("p-0", compact && "space-y-1")}>
          <div className="flex items-center justify-between">
            <p className={cn(
              "text-muted-foreground font-medium",
              compact ? "text-xs" : "text-sm"
            )}>
              {title}
            </p>
            {icon && (
              <motion.div 
                className={cn(
                  "text-muted-foreground",
                  hasUpdated && "text-primary"
                )}
                animate={hasUpdated ? { rotate: [0, -10, 10, 0] } : undefined}
              >
                {icon}
              </motion.div>
            )}
          </div>
          
          <div className="flex items-end gap-2 mt-1">
            <AnimatedCounter
              value={value}
              className={cn(
                "font-bold text-foreground",
                compact ? "text-xl" : "text-3xl"
              )}
              decimals={format === 'percent' ? 1 : 0}
              prefix={format === 'currency' ? 'R$ ' : ''}
              suffix={format === 'percent' ? '%' : ''}
            />
            
            {previousValue !== undefined && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center text-xs font-medium pb-1",
                  calculatedTrend === 'up' && "text-green-500",
                  calculatedTrend === 'down' && "text-red-500",
                  calculatedTrend === 'neutral' && "text-muted-foreground"
                )}
              >
                <TrendIcon className="h-3 w-3 mr-0.5" />
                <span>{Math.abs(percentChange).toFixed(1)}%</span>
              </motion.div>
            )}
          </div>
          
          {lastUpdate && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Atualizado {lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </CardContent>

        {/* Update flash overlay */}
        <AnimatePresence>
          {hasUpdated && (
            <motion.div
              className="absolute inset-0 bg-primary/10 pointer-events-none"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// ============================================
// LIVE STATS GRID
// ============================================
interface Stat {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent' | 'time';
  icon?: React.ReactNode;
}

interface LiveStatsGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
  isLive?: boolean;
  compact?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const LiveStatsGrid: React.FC<LiveStatsGridProps> = ({
  stats,
  columns = 4,
  isLive = false,
  compact = false,
  onRefresh,
  refreshing
}) => {
  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      {onRefresh && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {isLive ? 'Dados em tempo real' : 'Dados offline'}
            </span>
          </div>
          
          <motion.button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            <span>Atualizar</span>
          </motion.button>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      )}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <LiveStatCard
              {...stat}
              isLive={isLive}
              compact={compact}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// SPARKLINE CHART
// ============================================
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  animated?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = 'hsl(var(--primary))',
  showArea = true,
  animated = true
}) => {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height
  }));
  
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <motion.path
          d={areaPath}
          fill={`url(#gradient-${color.replace(/[()]/g, '')})`}
          initial={animated ? { opacity: 0 } : undefined}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.5 }}
        />
      )}
      
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      
      {/* End point */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={color}
        initial={animated ? { scale: 0 } : undefined}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient 
          id={`gradient-${color.replace(/[()]/g, '')}`} 
          x1="0" y1="0" x2="0" y2="1"
        >
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ============================================
// STAT CARD WITH SPARKLINE
// ============================================
interface StatWithSparklineProps extends LiveStatCardProps {
  sparklineData?: number[];
}

export const StatWithSparkline: React.FC<StatWithSparklineProps> = ({
  sparklineData,
  ...props
}) => {
  const trendColor = props.trend === 'up' 
    ? 'hsl(var(--chart-2))' 
    : props.trend === 'down' 
    ? 'hsl(var(--destructive))' 
    : 'hsl(var(--muted-foreground))';

  return (
    <Card className="p-4 relative overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{props.title}</p>
            <AnimatedCounter
              value={props.value}
              className="text-2xl font-bold"
              prefix={props.format === 'currency' ? 'R$ ' : ''}
              suffix={props.format === 'percent' ? '%' : ''}
            />
            
            {props.previousValue !== undefined && (
              <div className={cn(
                "flex items-center text-xs",
                props.trend === 'up' && "text-green-500",
                props.trend === 'down' && "text-red-500"
              )}>
                {props.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : props.trend === 'down' ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : null}
                <span>
                  {Math.abs(((props.value - props.previousValue) / props.previousValue) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          
          {props.icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {props.icon}
            </div>
          )}
        </div>
        
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4">
            <Sparkline 
              data={sparklineData} 
              width={200} 
              height={40}
              color={trendColor}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// REAL-TIME ACTIVITY INDICATOR
// ============================================
interface ActivityIndicatorProps {
  activities: { id: string; label: string; timestamp: Date }[];
  maxItems?: number;
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  activities,
  maxItems = 5
}) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card className="p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Atividade em Tempo Real
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 space-y-2">
        <AnimatePresence mode="popLayout">
          {displayActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0"
            >
              <span className={cn(
                "text-foreground",
                index === 0 && "font-medium"
              )}>
                {activity.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {activity.timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade recente
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// METRIC COMPARISON CARD
// ============================================
interface MetricComparisonProps {
  title: string;
  current: number;
  target: number;
  format?: 'number' | 'currency' | 'percent';
  showAlert?: boolean;
}

export const MetricComparison: React.FC<MetricComparisonProps> = ({
  title,
  current,
  target,
  format = 'number',
  showAlert = true
}) => {
  const percentage = (current / target) * 100;
  const isOnTrack = percentage >= 80;
  const isWarning = percentage >= 50 && percentage < 80;
  const isCritical = percentage < 50;

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString('pt-BR');
    }
  };

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {showAlert && isCritical && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </motion.div>
          )}
        </div>
        
        <div className="flex items-end gap-2">
          <AnimatedCounter
            value={current}
            className="text-2xl font-bold"
            prefix={format === 'currency' ? 'R$ ' : ''}
            suffix={format === 'percent' ? '%' : ''}
          />
          <span className="text-sm text-muted-foreground pb-1">
            / {formatValue(target)}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              isOnTrack && "bg-green-500",
              isWarning && "bg-yellow-500",
              isCritical && "bg-destructive"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        <p className={cn(
          "text-xs font-medium",
          isOnTrack && "text-green-500",
          isWarning && "text-yellow-500",
          isCritical && "text-destructive"
        )}>
          {percentage.toFixed(0)}% da meta
        </p>
      </CardContent>
    </Card>
  );
};

// ============================================
// PRESET STAT ICONS
// ============================================
export const StatIcons = {
  users: <Users className="h-5 w-5" />,
  packages: <Package className="h-5 w-5" />,
  trucks: <Truck className="h-5 w-5" />,
  time: <Clock className="h-5 w-5" />,
  money: <DollarSign className="h-5 w-5" />,
  chart: <BarChart3 className="h-5 w-5" />,
  pie: <PieChart className="h-5 w-5" />,
  activity: <Activity className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
};

export default {
  AnimatedCounter,
  LiveStatCard,
  LiveStatsGrid,
  Sparkline,
  StatWithSparkline,
  ActivityIndicator,
  MetricComparison,
  StatIcons
};
