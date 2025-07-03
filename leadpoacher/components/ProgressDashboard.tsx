'use client'

import { useState, useEffect } from 'react'
import { useProgressWebSocket } from '../hooks/useProgressWebSocket'
import { deriveStepsFromEvents, getCurrentStep, deriveStatsFromEvents, convertEventsToLogs } from '../lib/utils/progressUtils'
import ConnectionStatus from './ConnectionStatus'
import ProgressStepper from './ProgressStepper'
import RealTimeStats from './RealTimeStats'
import LogViewer from './LogViewer'
import ProgressErrorBoundary from './ProgressErrorBoundary'

interface ProgressDashboardProps {
  jobId: string
  competitor: string
  onComplete?: (success: boolean, results?: any) => void
  className?: string
}

// Observable Implementation: Structured logging for dashboard operations
const logDashboardOperation = (operation: string, data: any, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `dashboard_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

export default function ProgressDashboard({ 
  jobId, 
  competitor, 
  onComplete,
  className = '' 
}: ProgressDashboardProps) {
  const {
    connectionState,
    progressEvents,
    currentProgress,
    performanceMetrics,
    reconnect,
    clearEvents
  } = useProgressWebSocket(jobId)

  const [showDetailedLogs, setShowDetailedLogs] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completionResults, setCompletionResults] = useState<any>(null)

  // Explicit Error Handling: Safe data derivation
  const steps = deriveStepsFromEvents(progressEvents)
  const currentStep = getCurrentStep(currentProgress)
  const stats = deriveStatsFromEvents(progressEvents)
  const logs = convertEventsToLogs(progressEvents)

  // Progressive Construction: Handle completion logic
  useEffect(() => {
    if (!isCompleted && currentProgress?.type === 'complete') {
      setIsCompleted(true)
      setCompletionResults(currentProgress.details)
      
      logDashboardOperation('job_completed', {
        jobId,
        competitor,
        results: currentProgress.details
      }, true)

      if (onComplete) {
        onComplete(true, currentProgress.details)
      }
    }
  }, [currentProgress, isCompleted, jobId, competitor, onComplete])

  // Error handling for failed jobs
  useEffect(() => {
    const hasErrors = progressEvents.some(event => event.type === 'error')
    const lastEvent = progressEvents[progressEvents.length - 1]
    
    if (hasErrors && lastEvent?.type === 'error' && !isCompleted) {
      logDashboardOperation('job_failed', {
        jobId,
        competitor,
        error: lastEvent.errors?.join(', ') || 'Unknown error'
      }, false)

      if (onComplete) {
        onComplete(false, { error: lastEvent.errors?.join(', ') || 'Job failed' })
      }
    }
  }, [progressEvents, isCompleted, jobId, competitor, onComplete])

  const handleRestart = () => {
    clearEvents()
    setIsCompleted(false)
    setCompletionResults(null)
    logDashboardOperation('job_restarted', { jobId, competitor }, true)
  }

  const handleClearLogs = () => {
    clearEvents()
    logDashboardOperation('logs_cleared', { jobId }, true)
  }

  // Dependency Transparency: Clear component structure
  return (
    <ProgressErrorBoundary jobId={jobId} onRetry={reconnect}>
      <div className={`space-y-6 ${className}`}>
        {/* Connection Status */}
        <ConnectionStatus 
          connectionState={connectionState}
          onReconnect={reconnect}
        />

        {/* Progress Stepper */}
        <ProgressStepper 
          steps={steps}
          currentStep={currentStep}
        />

        {/* Real-time Statistics */}
        <RealTimeStats stats={stats} />

        {/* Completion Results */}
        {isCompleted && completionResults && (
        <div className="bg-secondary text-light border-2 border-dark shadow-hard-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <h3 className="font-heading text-xl mb-2">Research Complete!</h3>
              <p className="mb-4">
                Successfully completed research for competitor "{competitor}". 
                Found {completionResults.leadsFound || completionResults.savedLeads || 0} leads 
                from {completionResults.companiesFound || completionResults.savedCompanies || 0} companies.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="font-heading text-2xl">
                    {(completionResults.domainsChecked || 0).toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75">Domains Checked</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-2xl">
                    {(completionResults.privacyPagesFound || 0).toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75">Privacy Pages</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-2xl">
                    {(completionResults.competitorMentionsFound || 0).toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75">Mentions Found</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-2xl">
                    {(completionResults.leadsFound || completionResults.savedLeads || 0).toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75">Leads Extracted</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleRestart}
                  className="bg-primary text-dark border-2 border-dark font-bold py-2 px-4 shadow-hard hover:bg-light active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150"
                >
                  🔄 Start New Research
                </button>
                <button
                  onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                  className="bg-light text-dark border-2 border-dark font-bold py-2 px-4 shadow-hard hover:bg-neutral active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150"
                >
                  📋 {showDetailedLogs ? 'Hide' : 'View'} Process Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isCompleted && progressEvents.some(e => e.type === 'error') && (
        <div className="bg-red-500 text-light border-2 border-dark shadow-hard p-6">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">❌</div>
            <div className="flex-1">
              <h3 className="font-heading text-xl mb-2">Research Failed</h3>
              <p className="mb-4">
                The research process for "{competitor}" encountered errors and could not complete successfully.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleRestart}
                  className="bg-light text-dark border-2 border-dark font-bold py-2 px-4 shadow-hard hover:bg-neutral active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150"
                >
                  🔄 Retry Research
                </button>
                <button
                  onClick={() => setShowDetailedLogs(true)}
                  className="bg-primary text-dark border-2 border-dark font-bold py-2 px-4 shadow-hard hover:bg-dark hover:text-primary active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150"
                >
                  📋 View Error Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Viewer */}
      <LogViewer 
        logs={logs}
        isExpanded={showDetailedLogs}
        onToggleExpanded={() => setShowDetailedLogs(!showDetailedLogs)}
      />

      {/* Development Tools (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-dark text-light border-2 border-light shadow-hard p-4">
          <h3 className="font-heading text-sm mb-3">Development Tools</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <div className="font-bold">Connection:</div>
              <div>{connectionState.status}</div>
            </div>
            <div>
              <div className="font-bold">Events:</div>
              <div>{progressEvents.length}</div>
            </div>
            <div>
              <div className="font-bold">Latency:</div>
              <div>{connectionState.latency || 0}ms</div>
            </div>
            <div>
              <div className="font-bold">Memory:</div>
              <div>{performanceMetrics.memoryUsage}MB</div>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleClearLogs}
              className="bg-red-500 text-light border border-light px-2 py-1 text-xs font-bold hover:bg-red-400 transition-colors"
            >
              Clear Logs
            </button>
            <button
              onClick={reconnect}
              className="bg-primary text-dark border border-dark px-2 py-1 text-xs font-bold hover:bg-yellow-300 transition-colors"
            >
              Force Reconnect
            </button>
          </div>
        </div>
      )}
      </div>
    </ProgressErrorBoundary>
  )
} 