import React from 'react';

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a render error in any screen shows a friendly message
 * instead of a blank white page.
 */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Love Link screen crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-rose-50 text-rose-950">
        <h1 className="text-xl font-serif font-bold">Something went wrong on this screen</h1>
        <p className="text-sm text-rose-900/80 max-w-sm">
          Your data is safe. Try reloading, or go back to the home screen.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-11 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              window.location.assign('/');
            }}
            className="min-h-11 px-5 rounded-full bg-white border border-rose-200 text-rose-800 text-sm font-semibold"
          >
            Home
          </button>
        </div>
      </div>
    );
  }
}
