import React from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { captureError } from "@/lib/diagnosticService";

// localStorage/sessionStorage keys that hold session/cache state. Clearing
// these recovers from corrupted local state without wiping user data.
const RECOVER_KEYS = [
  "pathfinder-unlocked",
  "pathfinder-welcomed",
  "anatomy_admin_overrides",
  "anatomy_admin_hidden",
  "anatomy_admin_clipped",
  "anatomy_admin_custom",
  "anatomy_core_system_version",
  "anatomy_animations",
  "wardLayout_ward",
  "clinicaledge-auto-listen",
  "pathfinder-ai-panel-position",
  "pathfinder-ai-panel-transparency",
  "theory_progress",
  "esp-case-state",
  "ehr_read_*",
];

// Global render-error fallback so a crashing screen shows a recoverable card
// instead of a blank white page. Crashes are also fed to the diagnostic
// collector so the AI assistant's diagnostic mode can report on them.
export default class ErrorBoundary extends React.Component {
  state = { hasError: false, message: "", recovering: false };

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || "Something went wrong" };
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

  clearAndRecover = () => {
    this.setState({ recovering: true });
    try {
      // Clear all known session/cache keys from both stores.
      RECOVER_KEYS.forEach((key) => {
        if (key.includes("*")) {
          const prefix = key.replace("*", "");
          for (let i = localStorage.length - 1; i >= 0; i -= 1) {
            const k = localStorage.key(i);
            if (k && k.startsWith(prefix)) localStorage.removeItem(k);
          }
        } else {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }
      });
    } catch { /* ignore */ }
    // Hard reload to re-initialise the app from a clean state.
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full rounded-2xl border border-clinical-red/30 bg-card p-6 text-center shadow-lg">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-clinical-red/10 text-clinical-red grid place-items-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">This screen hit an error</h2>
            <p className="mt-1 text-sm text-muted-foreground">{this.state.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              The T-SIM Health assistant has logged this. Try clearing corrupted state and recovering, or reload the app.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={this.clearAndRecover}
                disabled={this.state.recovering}
                className="px-4 py-2.5 rounded-xl bg-clinical-teal text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {this.state.recovering ? "Recovering…" : "Clear corrupted state & recover"}
              </button>
              <button
                onClick={this.reload}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
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