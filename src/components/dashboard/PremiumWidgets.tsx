import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { 
  GripVertical, X, Maximize2, Minimize2, MoreHorizontal,
  RefreshCw, Settings, Eye, EyeOff, Pin, PinOff,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  BarChart3, PieChart, LineChart, Activity, Zap,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================
// BASE WIDGET COMPONENT
// ============================================
interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onRemove?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  onExpand?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isExpanded?: boolean;
  loading?: boolean;
  error?: string;
  lastUpdated?: Date;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'error';
  collapsible?: boolean;
  draggable?: boolean;
}

export const Widget: React.FC<WidgetProps> = ({
  id,
  title,
  children,
  icon,
  className,
  onRemove,
  onRefresh,
  onSettings,
  onExpand,
  isPinned,
  onTogglePin,
  isExpanded,
  loading,
  error,
  lastUpdated,
  badge,
  badgeVariant = 'default',
  collapsible = false,
  draggable = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragControls = useDragControls();

  const badgeColors = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    error: 'bg-destructive/10 text-destructive'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn("group", className)}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200",
        isHovered && "shadow-lg ring-1 ring-primary/20",
        isPinned && "ring-2 ring-primary/30",
        error && "border-destructive/50"
      )}>
        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center"
            >
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Drag Handle */}
              {draggable && (
                <motion.div
                  className={cn(
                    "cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors",
                    "opacity-0 group-hover:opacity-100"
                  )}
                  onPointerDown={(e) => dragControls.start(e)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              )}

              {/* Icon */}
              {icon && (
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  {icon}
                </div>
              )}

              {/* Title */}
              <CardTitle className="text-sm font-medium truncate flex-1">
                {title}
              </CardTitle>

              {/* Badge */}
              {badge !== undefined && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    badgeColors[badgeVariant]
                  )}
                >
                  {badge}
                </motion.span>
              )}
            </div>

            {/* Actions */}
            <div className={cn(
              "flex items-center gap-1 transition-opacity",
              "opacity-0 group-hover:opacity-100"
            )}>
              {collapsible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onRefresh && (
                    <DropdownMenuItem onClick={onRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </DropdownMenuItem>
                  )}
                  {onExpand && (
                    <DropdownMenuItem onClick={onExpand}>
                      {isExpanded ? (
                        <>
                          <Minimize2 className="h-4 w-4 mr-2" />
                          Minimizar
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4 mr-2" />
                          Expandir
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onTogglePin && (
                    <DropdownMenuItem onClick={onTogglePin}>
                      {isPinned ? (
                        <>
                          <PinOff className="h-4 w-4 mr-2" />
                          Desafixar
                        </>
                      ) : (
                        <>
                          <Pin className="h-4 w-4 mr-2" />
                          Fixar
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onSettings && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onSettings}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </DropdownMenuItem>
                    </>
                  )}
                  {onRemove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={onRemove}
                        className="text-destructive focus:text-destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="p-3 pt-0">
                {error ? (
                  <div className="flex flex-col items-center justify-center py-4 text-destructive">
                    <AlertTriangle className="h-8 w-8 mb-2" />
                    <p className="text-sm text-center">{error}</p>
                    {onRefresh && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={onRefresh}
                      >
                        Tentar novamente
                      </Button>
                    )}
                  </div>
                ) : (
                  children
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer - Last updated */}
        {lastUpdated && !isCollapsed && (
          <div className="px-3 pb-2">
            <p className="text-[10px] text-muted-foreground">
              Atualizado {lastUpdated.toLocaleTimeString('pt-BR')}
            </p>
          </div>
        )}

        {/* Pin indicator */}
        {isPinned && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2"
          >
            <Pin className="h-3 w-3 text-primary" />
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

// ============================================
// METRIC WIDGET
// ============================================
interface MetricWidgetProps extends Omit<WidgetProps, 'children'> {
  value: number | string;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent';
  trend?: 'up' | 'down' | 'neutral';
  target?: number;
  sparklineData?: number[];
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  value,
  previousValue,
  format = 'number',
  trend,
  target,
  sparklineData,
  ...props
}) => {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  
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

  const calculatedTrend = trend || (previousValue !== undefined 
    ? numValue > previousValue ? 'up' : numValue < previousValue ? 'down' : 'neutral'
    : 'neutral'
  );

  const percentChange = previousValue !== undefined && previousValue !== 0
    ? ((numValue - previousValue) / previousValue) * 100
    : 0;

  return (
    <Widget {...props}>
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <motion.span
            className="text-3xl font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={value}
          >
            {formatValue(numValue)}
          </motion.span>
          
          {previousValue !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center text-sm font-medium",
                calculatedTrend === 'up' && "text-green-500",
                calculatedTrend === 'down' && "text-red-500",
                calculatedTrend === 'neutral' && "text-muted-foreground"
              )}
            >
              {calculatedTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : calculatedTrend === 'down' ? (
                <TrendingDown className="h-4 w-4 mr-1" />
              ) : null}
              <span>{Math.abs(percentChange).toFixed(1)}%</span>
            </motion.div>
          )}
        </div>

        {/* Target progress */}
        {target && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Meta</span>
              <span>{formatValue(target)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  numValue >= target ? "bg-green-500" : "bg-primary"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((numValue / target) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Mini sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="h-12">
            <MiniSparkline data={sparklineData} trend={calculatedTrend} />
          </div>
        )}
      </div>
    </Widget>
  );
};

// ============================================
// MINI SPARKLINE
// ============================================
const MiniSparkline: React.FC<{ data: number[]; trend: string }> = ({ data, trend }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((value - min) / range) * 100
  }));
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;
  
  const color = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={`grad-${trend}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaD}
        fill={`url(#grad-${trend})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
    </svg>
  );
};

// ============================================
// STATUS WIDGET
// ============================================
interface StatusItem {
  id: string;
  label: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  value?: string | number;
}

interface StatusWidgetProps extends Omit<WidgetProps, 'children'> {
  items: StatusItem[];
}

export const StatusWidget: React.FC<StatusWidgetProps> = ({ items, ...props }) => {
  const statusIcons = {
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    error: <X className="h-4 w-4 text-red-500" />,
    pending: <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
  };

  const statusColors = {
    success: 'bg-green-500/10',
    warning: 'bg-yellow-500/10',
    error: 'bg-red-500/10',
    pending: 'bg-muted'
  };

  return (
    <Widget {...props}>
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg",
              statusColors[item.status]
            )}
          >
            <div className="flex items-center gap-2">
              {statusIcons[item.status]}
              <span className="text-sm">{item.label}</span>
            </div>
            {item.value && (
              <span className="text-sm font-medium">{item.value}</span>
            )}
          </motion.div>
        ))}
      </div>
    </Widget>
  );
};

// ============================================
// QUICK ACTIONS WIDGET
// ============================================
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

interface QuickActionsWidgetProps extends Omit<WidgetProps, 'children'> {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  actions,
  columns = 3,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-muted hover:bg-muted/80 text-foreground',
    primary: 'bg-primary/10 hover:bg-primary/20 text-primary',
    success: 'bg-green-500/10 hover:bg-green-500/20 text-green-600',
    warning: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600'
  };

  return (
    <Widget {...props}>
      <div className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4"
      )}>
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl transition-colors",
              variantStyles[action.variant || 'default']
            )}
          >
            {action.icon}
            <span className="text-xs mt-1 font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </Widget>
  );
};

// ============================================
// LIST WIDGET
// ============================================
interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface ListWidgetProps extends Omit<WidgetProps, 'children'> {
  items: ListItem[];
  maxItems?: number;
  onViewAll?: () => void;
}

export const ListWidget: React.FC<ListWidgetProps> = ({
  items,
  maxItems = 5,
  onViewAll,
  ...props
}) => {
  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <Widget {...props}>
      <div className="space-y-1">
        {displayItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={item.onClick}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg",
              item.onClick && "cursor-pointer hover:bg-muted transition-colors"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {item.icon && (
                <div className="p-1.5 rounded-md bg-muted">
                  {item.icon}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                )}
              </div>
            </div>
            
            {item.value !== undefined && (
              <span className="text-sm font-semibold ml-2">{item.value}</span>
            )}
            
            {item.onClick && (
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
            )}
          </motion.div>
        ))}

        {hasMore && onViewAll && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onViewAll}
            className="w-full py-2 text-sm text-primary hover:underline"
          >
            Ver todos ({items.length})
          </motion.button>
        )}
      </div>
    </Widget>
  );
};

// ============================================
// WIDGET GRID (Drag & Drop)
// ============================================
interface WidgetGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  onReorder?: (newOrder: string[]) => void;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  onReorder
}) => {
  const gapSizes = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' };

  return (
    <div className={cn(
      "grid",
      columns === 1 && "grid-cols-1",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      gapSizes[gap]
    )}>
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// WIDGET ICONS
// ============================================
export const WidgetIcons = {
  chart: <BarChart3 className="h-4 w-4" />,
  pie: <PieChart className="h-4 w-4" />,
  line: <LineChart className="h-4 w-4" />,
  activity: <Activity className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  trending: <TrendingUp className="h-4 w-4" />,
};

export default {
  Widget,
  MetricWidget,
  StatusWidget,
  QuickActionsWidget,
  ListWidget,
  WidgetGrid,
  WidgetIcons
};
