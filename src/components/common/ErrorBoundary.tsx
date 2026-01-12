import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Here you could send to an error tracking service like Sentry
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Ops! Algo deu errado
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-muted rounded-lg p-4 mb-6 text-left overflow-auto max-h-40">
                <p className="font-mono text-xs text-destructive mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
              <Button onClick={this.handleGoHome} className="gap-2">
                <Home className="w-4 h-4" />
                Ir para Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { useCallback, useState } from "react";

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const throwError = useCallback(() => {
    if (error) throw error;
  }, [error]);

  return { error, handleError, resetError, throwError };
}

// Async error boundary wrapper
interface AsyncBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export function AsyncErrorBoundary({ children, onError }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-center">
          <p className="text-destructive">Erro ao carregar conteúdo</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
