import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-danger-500/10 border border-danger-500/30 flex items-center justify-center mb-4 text-2xl text-danger-400">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-dark-400 text-sm max-w-md mb-6 font-mono text-xs bg-dark-900 p-3 rounded-xl border border-dark-800">
            {this.state.error?.toString() || 'Unknown rendering error.'}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-5 py-2.5 rounded-xl bg-primary-500 text-dark-950 font-semibold text-sm hover:bg-primary-400 transition"
            >
              Reset Session & Go to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl border border-dark-700 text-white font-semibold text-sm hover:bg-dark-800 transition"
            >
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
