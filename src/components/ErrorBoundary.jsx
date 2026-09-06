import React from "react";
import { AlertTriangle } from "lucide-react";
import { captureError } from "@/lib/diagnosticService";

// Global render-error fallback so a crashing screen shows a recoverable card
// instead of a blank white page. Crashes are also fed to the diagnostic
// collector so the AI assistant's diagnostic mode can report on them.
export default class ErrorBoundary extends React.Component {
  state = { hasError: false, message: "", errorId: "" };

  static getDerivedStateFromError(err) {
    return {
      hasError: true,
      message: err?.message || "Something went wrong",
      errorId: `PF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    };
  }

  componentDidCatch(err, info) {
    try {
      captureError({
        type: "render_error",
        message: err?.message || "Render error",
        source: info?.componentStack ? String(info.componentStack).slice(0, 300) : "",
      });
    } catch { /* ignore */ }
  }

  reload = () => window.location.reload();
  reset = () => this.setState({ hasError: false, message: "", errorId: "" });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background" role="alert">
          <div className="max-w-md w-full rounded-2xl border border-clinical-red/30 bg-card p-6 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-clinical-red/10 text-clinical-red grid place-items-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">This screen hit an error</h2>
            <p className="mt-1 text-sm text-muted-foreground">{this.state.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">Reference: {this.state.errorId}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              The Pathfinder AI assistant has logged this. Reloading usually fixes it — open the assistant&apos;s diagnostic mode for a full report.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={this.reset} className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold">
                Try again
              </button>
              <button type="button" onClick={this.reload} className="px-4 py-2.5 rounded-xl bg-clinical-teal text-white text-sm font-semibold">
                Reload app
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}