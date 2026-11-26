import { Component, ErrorInfo, ReactNode, useCallback, useState } from "react";
import { RefreshCw, Home, ChevronLeft, ShieldAlert, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";

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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Sem isto o crash de render só aparecia no console do navegador do usuário.
    // Sem DSN configurado o Sentry não inicializa e a chamada é no-op.
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
    this.registrarCrashEmTelemetria(error, errorInfo);
  }

  /**
   * Etapa 285 do censo: crash de render passa a existir no banco, não só no
   * console de quem caiu. Best-effort: a policy de INSERT de `telemetry_logs`
   * exige sessão (`auth.uid() IS NOT NULL`), então erro em tela pública é
   * recusado pelo RLS e sobra o Sentry/console — nunca quebra a tela de erro.
   */
  private registrarCrashEmTelemetria(error: Error, errorInfo: ErrorInfo) {
    void supabase
      .from("telemetry_logs")
      .insert({
        severity: "error",
        category: "ui_crash",
        message: error.message || error.name,
        stack_trace: error.stack ?? null,
        metadata: { componentStack: errorInfo.componentStack },
        url: window.location.href,
        device_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
      })
      .then(
        ({ error: insertError }) => {
          if (insertError) {
            console.warn("Falha ao registrar crash em telemetry_logs:", insertError.message);
          }
        },
        (falha: unknown) => {
          console.warn(
            "Falha ao registrar crash em telemetry_logs:",
            falha instanceof Error ? falha.message : String(falha),
          );
        },
      );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
    setTimeout(() => {
      this.handleReset();
    }, 100);
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
        <div className="min-h-[80vh] flex items-center justify-center bg-background/50 backdrop-blur-sm p-6 rounded-2xl border border-destructive/20 shadow-2xl shadow-destructive/5 m-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-xl w-full text-center"
          >
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center mx-auto border border-destructive/30 shadow-inner">
                <ShieldAlert className="w-12 h-12 text-destructive" />
              </div>
            </div>
            
            <h1 className="text-3xl font-black text-foreground mb-4 tracking-tight">
              Recuperação de Falha Crítica
            </h1>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
              O LogiFlow encontrou uma instabilidade nesta página. Não se preocupe, seus dados estão seguros.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <Button 
                onClick={this.handleReset} 
                variant="outline" 
                className="h-14 gap-3 text-base border-primary/20 hover:bg-primary/5 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Tentar Restaurar</span>
              </Button>
              <Button 
                onClick={this.handleGoBack} 
                variant="outline" 
                className="h-14 gap-3 text-base"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Voltar ao Seguro</span>
              </Button>
            </div>

            <div className="flex flex-col items-center gap-6">
              <Button onClick={this.handleGoHome} className="h-12 px-10 gap-2 rounded-full shadow-lg shadow-primary/25">
                <Home className="w-4 h-4" />
                Painel Principal
              </Button>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-6 border-t w-full justify-center">
                <div className="flex items-center gap-1">
                  <LifeBuoy className="w-3 h-3" />
                  <span>Suporte Notificado</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span>ID do Erro: {crypto.randomUUID().split('-')[0].toUpperCase()}</span>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 bg-zinc-950 rounded-xl p-6 text-left border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-3 text-destructive font-mono text-xs uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                  <span>Debug Console</span>
                </div>
                <div className="overflow-auto max-h-60 scrollbar-hide">
                  <p className="font-mono text-sm text-destructive-foreground/90 mb-4 font-bold">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="font-mono text-[11px] text-zinc-500 whitespace-pre-wrap leading-relaxed">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}



// eslint-disable-next-line react-refresh/only-export-components
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
