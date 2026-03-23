import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Lightweight error boundary for individual widgets/sections.
 * Catches errors without crashing the entire page.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Widget error captured — handled by getDerivedStateFromError
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-destructive/20 bg-destructive/5 min-h-[120px]">
          <AlertTriangle className="w-6 h-6 text-destructive/60 mb-2" />
          <p className="text-sm text-destructive/80 mb-1 font-medium">
            {this.props.widgetName || "Widget"} — erro ao carregar
          </p>
          {import.meta.env.DEV && this.state.error && (
            <p className="text-xs text-muted-foreground mb-2 max-w-xs truncate">
              {this.state.error.message}
            </p>
          )}
          <Button variant="ghost" size="sm" onClick={this.handleRetry} className="gap-1">
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
