import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg p-8 max-w-md w-full text-center shadow-lg">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-3">
          Oops! Something went wrong
        </h2>
        <p className="text-text-secondary mb-6">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6 text-left">
          <p className="text-sm text-red-700 font-mono">
            {error.message}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetErrorBoundary}
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-all"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

function logError(error, errorInfo) {
  // In production, send to error tracking service
  console.error('Error caught by boundary:', error, errorInfo);
  
  // Example: Send to Sentry, LogRocket, etc.
  // Sentry.captureException(error, { contexts: { errorInfo } });
}

export default function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}
