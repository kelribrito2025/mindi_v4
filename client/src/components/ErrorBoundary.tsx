import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const DYNAMIC_IMPORT_RELOAD_KEY = "mindi:last-dynamic-import-reload";
const DYNAMIC_IMPORT_RELOAD_COOLDOWN_MS = 30_000;

const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Failed to load module script/i,
  /dynamically imported module/i,
  /\/assets\/.*\.(?:js|mjs|css)/i,
];

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return [error.name, error.message, error.stack].filter(Boolean).join("\n");
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isDynamicImportError(error: unknown): boolean {
  const text = getErrorText(error);
  return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

function canReloadForDynamicImportError(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const lastReload = Number(window.sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) || "0");
    return !lastReload || Date.now() - lastReload > DYNAMIC_IMPORT_RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function reloadSilentlyForDynamicImportError(error: unknown): boolean {
  if (!isDynamicImportError(error) || !canReloadForDynamicImportError()) {
    return false;
  }

  try {
    window.sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, String(Date.now()));
  } catch {
    // Se o armazenamento estiver indisponível, ainda assim tentamos recuperar a página.
  }

  window.setTimeout(() => {
    window.location.reload();
  }, 50);

  return true;
}

class ErrorBoundary extends Component<Props, State> {
  private removeGlobalHandlers?: () => void;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (reloadSilentlyForDynamicImportError(event.reason)) {
        event.preventDefault();
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      const error = event.error || event.message;

      if (reloadSilentlyForDynamicImportError(error)) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);

    this.removeGlobalHandlers = () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
    };
  }

  componentDidCatch(error: Error) {
    reloadSilentlyForDynamicImportError(error);
  }

  componentWillUnmount() {
    this.removeGlobalHandlers?.();
  }

  render() {
    if (this.state.hasError) {
      const shouldReloadSilently =
        isDynamicImportError(this.state.error) && canReloadForDynamicImportError();

      if (shouldReloadSilently) {
        return null;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
