import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <p className="text-sm font-semibold text-red-600">Algo salió mal</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">La página tuvo un error inesperado</h1>
          <p className="mt-3 text-gray-500 max-w-sm">Probá recargar. Si sigue pasando, avisanos.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-5 py-2.5 rounded-lg bg-brand-strong hover:bg-brand-strong-hover text-white font-semibold transition-colors"
          >
            Recargar
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-white border border-gray-200 rounded-lg text-left text-xs text-red-600 overflow-auto max-h-40 max-w-lg">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
