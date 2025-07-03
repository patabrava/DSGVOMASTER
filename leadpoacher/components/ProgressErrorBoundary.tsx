'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ProgressErrorBoundaryProps {
  children: ReactNode
  jobId?: string
  onRetry?: () => void
  fallbackComponent?: ReactNode
}

// Observable Implementation: Structured logging for error boundary
const logErrorBoundary = (operation: string, data: any, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `error_boundary_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

export default class ProgressErrorBoundary extends Component<ProgressErrorBoundaryProps, ErrorState> {
  constructor(props: ProgressErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    // Explicit Error Handling: Capture error state
    logErrorBoundary('error_caught', { error: error.message }, false, error.message)
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Observable Implementation: Log detailed error information
    logErrorBoundary('error_details', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      jobId: this.props.jobId
    }, false, error.message)
  }

  handleRetry = () => {
    // Graceful Fallbacks: Reset error state and attempt recovery
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    
    if (this.props.onRetry) {
      this.props.onRetry()
    }
    
    logErrorBoundary('retry_attempted', { jobId: this.props.jobId }, true)
  }

  handleReload = () => {
    logErrorBoundary('page_reload_triggered', { jobId: this.props.jobId }, true)
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Dependency Transparency: Clear fallback UI structure
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent
      }

      return (
        <div className="bg-light border-2 border-dark shadow-hard p-6">
          <div className="flex items-start p-4 border-2 border-dark bg-red-500 text-light shadow-hard mb-6">
            <div className="text-4xl mr-4">💥</div>
            <div className="flex-1">
              <h4 className="font-heading text-xl mb-2">Progress Tracking Error</h4>
              <p className="text-sm mb-4">
                The progress tracking system encountered an unexpected error. This usually happens due to network issues or browser compatibility problems.
              </p>
              
              {/* Error Details */}
              {this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-bold hover:text-primary transition-colors">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-dark text-light font-mono text-xs border-2 border-light overflow-x-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
          
          {/* Recovery Actions */}
          <div className="space-y-4">
            <h5 className="font-heading text-lg">Recovery Options</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Retry Current Operation */}
              {this.props.onRetry && (
                <button 
                  onClick={this.handleRetry}
                  className="bg-primary text-dark border-2 border-dark font-bold py-3 px-6 shadow-hard hover:bg-dark hover:text-primary active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150"
                >
                  🔄 Retry Progress Tracking
                </button>
              )}
              
              {/* Reload Page */}
              <button 
                onClick={this.handleReload}
                className="bg-secondary text-light border-2 border-dark font-bold py-3 px-6 shadow-hard hover:bg-dark active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150"
              >
                🔃 Reload Page
              </button>
            </div>
            
            {/* Alternative Actions */}
            <div className="mt-6 p-4 bg-neutral border-l-4 border-secondary">
              <h6 className="font-bold text-sm mb-2">Alternative Actions:</h6>
              <ul className="text-sm space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Clear browser cache and cookies</li>
                <li>• Try using a different browser</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
          
          {/* Debug Information */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-dark text-light border-2 border-light">
              <h6 className="font-bold text-sm mb-2">Debug Information:</h6>
              <div className="font-mono text-xs space-y-1">
                <div>Job ID: {this.props.jobId || 'Not available'}</div>
                <div>Timestamp: {new Date().toISOString()}</div>
                <div>User Agent: {navigator.userAgent}</div>
                <div>WebSocket Support: {typeof WebSocket !== 'undefined' ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
} 