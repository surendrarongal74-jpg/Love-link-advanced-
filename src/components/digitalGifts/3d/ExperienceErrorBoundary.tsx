import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTo2D?: () => void;
  experienceName?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ExperienceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || '3D WebGL render fault' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Loveverse 3D Experience caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 text-white backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-rose-200">
                {this.props.experienceName ? `${this.props.experienceName} 3D Notice` : '3D Environment Notice'}
              </h3>
              <p className="text-sm text-slate-300 mt-2">
                Your device or browser encountered a graphical constraint rendering this 3D scene.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              {this.props.fallbackTo2D && (
                <button
                  type="button"
                  onClick={this.props.fallbackTo2D}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Layers className="w-4 h-4" />
                  Switch to Lightweight 2D Mode
                </button>
              )}
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Retry 3D Scene
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
