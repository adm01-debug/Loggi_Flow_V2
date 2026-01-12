/**
 * Error Boundary Premium com Recovery e Retry
 * 
 * @module components/common/ErrorBoundaryPremium
 */

import { Component, ErrorInfo, ReactNode, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, RefreshCw, Home, Bug, Copy, Check, 
  ChevronDown, ChevronUp, Wifi, WifiOff, Database, Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  maxRetries?: number;
  retryDelay?: number;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

type ErrorType = 'network' | 'database' | 'server' | 'client' | 'unknown';

// ============================================
// Error Type Detection
// ============================================

function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
    return 'network';
  }
  if (message.includes('database') || message.includes('supabase') || message.includes('postgres')) {
    return 'database';
  }
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return 'server';
  }
  if (message.includes('undefined') || message.includes('null') || message.includes('cannot read')) {
    return 'client';
  }
  return 'unknown';
}

const errorTypeConfig: Record<ErrorType, {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  network: {
    icon: WifiOff,
    title: 'Erro de Conexão',
    description: 'Parece que há um problema com sua conexão. Verifique sua internet e tente novamente.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  database: {
    icon: Database,
    title: 'Erro de Banco de Dados',
    description: 'Ocorreu um problema ao acessar os dados. Nossa equipe foi notificada.',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  server: {
    icon: Server,
    title: 'Erro do Servidor',
    description: 'O servidor está com problemas temporários. Tente novamente em alguns instantes.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  client: {
    icon: Bug,
    title: 'Erro da Aplicação',
    description: 'Algo deu errado na aplicação. Tente recarregar a página.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  unknown: {
    icon: AlertTriangle,
    title: 'Erro Inesperado',
    description: 'Ocorreu um erro inesperado. Nossa equipe foi notificada.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
};

// ============================================
// Error Details Component
// ============================================

function ErrorDetails({ 
  error, 
  errorInfo,
  className 
}: { 
  error: Error; 
  errorInfo: ErrorInfo | null;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyErrorDetails = useCallback(() => {
    const details = `
Error: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack || 'N/A'}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();
    
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [error, errorInfo]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={cn("mt-4", className)}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Bug className="w-4 h-4" />
          Detalhes técnicos
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <div className="bg-muted rounded-lg p-4 text-left overflow-auto max-h-48 relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyErrorDetails}
                className="absolute top-2 right-2 h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              
              <p className="font-mono text-xs text-destructive mb-2">
                {error.message}
              </p>
              {error.stack && (
                <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Error Fallback UI
// ============================================

function ErrorFallbackUI({
  error,
  errorInfo,
  onReset,
  onRetry,
  isRetrying,
  retryCount,
  maxRetries,
  showDetails,
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onRetry: () => void;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  showDetails: boolean;
}) {
  const errorType = detectErrorType(error);
  const config = errorTypeConfig[errorType];
  const Icon = config.icon;
  const canRetry = retryCount < maxRetries;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={cn(
                "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                config.bgColor
              )}
            >
              <Icon className={cn("w-8 h-8", config.color)} />
            </motion.div>
            
            <CardTitle className="text-xl">{config.title}</CardTitle>
            <CardDescription className="mt-2">
              {config.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Retry Progress */}
            {canRetry && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Tentativa {retryCount + 1} de {maxRetries}</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onRetry}
                disabled={isRetrying || !canRetry}
                className="flex-1 gap-2"
                variant={canRetry ? "default" : "secondary"}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Tentando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {canRetry ? 'Tentar Novamente' : 'Limite de Tentativas'}
                  </>
                )}
              </Button>
              
              <Button
                onClick={onReset}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Home className="w-4 h-4" />
                Ir para Início
              </Button>
            </div>

            {/* Error Details */}
            {showDetails && process.env.NODE_ENV === 'development' && (
              <ErrorDetails error={error} errorInfo={errorInfo} />
            )}
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-xs text-muted-foreground text-center">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================
// Main Error Boundary Class
// ============================================

export class ErrorBoundaryPremium extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call external error handler
    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });
    this.props.onReset?.();
    window.location.href = "/";
  };

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) return;

    this.setState({ isRetrying: true });

    this.retryTimeout = setTimeout(() => {
      this.setState(prev => ({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        retryCount: prev.retryCount + 1,
        isRetrying: false,
      }));
    }, retryDelay);
  };

  render() {
    const { hasError, error, errorInfo, retryCount, isRetrying } = this.state;
    const { children, fallback, maxRetries = 3, showDetails = true } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallbackUI
          error={error}
          errorInfo={errorInfo}
          onReset={this.handleReset}
          onRetry={this.handleRetry}
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={maxRetries}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

// ============================================
// Inline Error Fallback (Functional)
// ============================================

interface InlineErrorFallbackProps {
  error: Error;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export function InlineErrorFallback({ 
  error, 
  onRetry, 
  compact = false,
  className 
}: InlineErrorFallbackProps) {
  const errorType = detectErrorType(error);
  const config = errorTypeConfig[errorType];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        config.bgColor,
        className
      )}>
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", config.color)} />
          <span className="text-sm">{config.title}</span>
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border text-center",
        config.bgColor,
        className
      )}
    >
      <Icon className={cn("w-8 h-8 mx-auto mb-2", config.color)} />
      <p className="font-medium text-sm">{config.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 gap-2">
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </Button>
      )}
    </motion.div>
  );
}

export default ErrorBoundaryPremium;
