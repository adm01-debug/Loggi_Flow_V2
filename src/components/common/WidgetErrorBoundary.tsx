import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reported: boolean;
}

/**
 * Enterprise-grade Error Boundary
 * Automatically reports production UI errors to central telemetry.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, reported: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, reported: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error logged to DB
    this.reportError(error, errorInfo);
  }

  async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('error_events').insert({
        user_id: user?.id,
        error_message: error.message,
        stack_trace: error.stack || 'No stack trace',
        component_name: this.props.widgetName || 'WidgetErrorBoundary',
        url: window.location.href,
        browser_info: navigator.userAgent,
        metadata: {
          componentStack: errorInfo.componentStack,
          version: '1.0.0'
        }
      });
      
      this.setState({ reported: true });
    } catch (reportErr) {
      // Fail silently
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, reported: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-destructive/20 bg-destructive/5 min-h-[120px] animate-in fade-in zoom-in duration-300">
          <AlertTriangle className="w-6 h-6 text-destructive/60 mb-2" />
          <p className="text-sm text-destructive/80 mb-1 font-medium">
            {this.props.widgetName || "Widget"} — erro de processamento
          </p>
          <p className="text-[10px] text-muted-foreground mb-4 text-center max-w-[200px]">
            O erro foi registrado automaticamente para nossa equipe técnica.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={this.handleRetry} className="h-8 gap-1.5 border-destructive/20 hover:bg-destructive/10">
              <RefreshCw className="w-3 h-3" />
              Tentar Recarregar
            </Button>
            {this.state.reported && (
              <span className="flex items-center gap-1 text-[9px] text-success font-semibold uppercase tracking-tighter">
                <Send className="w-2.5 h-2.5" />
                Reportado
              </span>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
