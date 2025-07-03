// Progress Utilities - Observable Implementation
// Following MONOCODE principles for deterministic state processing

import { ProgressEvent, ProgressStep, ProgressStats, LogEntry, PROGRESS_PHASES, PhaseKey } from '../types/progress'

// Explicit Error Handling: Safe array operations with fallbacks
export function deriveStepsFromEvents(events: ProgressEvent[]): ProgressStep[] {
  if (!events || events.length === 0) {
    return Object.entries(PROGRESS_PHASES).map(([key, phase]) => ({
      name: phase.name,
      status: 'pending' as const
    }))
  }

  const stepMap = new Map<PhaseKey, ProgressStep>()
  
  // Initialize all phases as pending
  Object.entries(PROGRESS_PHASES).forEach(([key, phase]) => {
    stepMap.set(key as PhaseKey, {
      name: phase.name,
      status: 'pending' as const
    })
  })

  // Process events to update step states
  events.forEach(event => {
    const currentStep = stepMap.get(event.phase)
    if (!currentStep) return

    const updatedStep: ProgressStep = {
      ...currentStep,
      progress: event.progress,
      details: event.details
    }

    // Determine status based on event type and progress
    if (event.type === 'error') {
      updatedStep.status = 'error'
    } else if (event.type === 'warning') {
      updatedStep.status = 'warning'
    } else if (event.type === 'complete' || event.progress >= 1.0) {
      updatedStep.status = 'completed'
      updatedStep.endTime = event.timestamp
    } else if (event.progress > 0) {
      updatedStep.status = 'in_progress'
      if (!updatedStep.startTime) {
        updatedStep.startTime = event.timestamp
      }
    }

    // Calculate duration if both start and end times exist
    if (updatedStep.startTime && updatedStep.endTime) {
      const start = new Date(updatedStep.startTime).getTime()
      const end = new Date(updatedStep.endTime).getTime()
      updatedStep.duration = end - start
    }

    stepMap.set(event.phase, updatedStep)
  })

  // Return sorted by phase order
  return Array.from(stepMap.values()).sort((a, b) => {
    const aPhase = Object.entries(PROGRESS_PHASES).find(([, phase]) => phase.name === a.name)?.[0] as PhaseKey
    const bPhase = Object.entries(PROGRESS_PHASES).find(([, phase]) => phase.name === b.name)?.[0] as PhaseKey
    
    if (!aPhase || !bPhase) return 0
    return PROGRESS_PHASES[aPhase].order - PROGRESS_PHASES[bPhase].order
  })
}

export function getCurrentStep(currentProgress: ProgressEvent | null): number {
  if (!currentProgress) return 0
  
  const phaseOrder = PROGRESS_PHASES[currentProgress.phase]?.order ?? 0
  return phaseOrder
}

export function deriveStatsFromEvents(events: ProgressEvent[]): ProgressStats {
  if (!events || events.length === 0) {
    return {
      domainsChecked: 0,
      privacyPagesFound: 0,
      competitorMentionsFound: 0,
      leadsExtracted: 0,
      companiesFound: 0,
      totalExpected: 0,
      domainProgress: 0,
      overallProgress: 0,
      processingSpeed: 0
    }
  }

  // Get the latest event for each metric
  const latestEvent = events[events.length - 1]
  const details = latestEvent?.details || {}

  // Calculate processing speed (domains per second)
  const startTime = events[0]?.timestamp ? new Date(events[0].timestamp).getTime() : Date.now()
  const currentTime = latestEvent?.timestamp ? new Date(latestEvent.timestamp).getTime() : Date.now()
  const durationSeconds = Math.max((currentTime - startTime) / 1000, 1)
  const domainsChecked = details.domainsChecked || 0
  const processingSpeed = domainsChecked / durationSeconds

  // Calculate overall progress based on completed phases
  const completedPhases = events.filter(e => e.type === 'complete').length
  const totalPhases = Object.keys(PROGRESS_PHASES).length
  const overallProgress = completedPhases / totalPhases

  // Estimate time remaining
  const totalExpected = details.totalExpected || details.maxDomains || 500
  const remainingDomains = Math.max(totalExpected - domainsChecked, 0)
  const estimatedTimeRemaining = processingSpeed > 0 ? remainingDomains / processingSpeed : undefined

  return {
    domainsChecked,
    privacyPagesFound: details.privacyPagesFound || 0,
    competitorMentionsFound: details.competitorMentionsFound || 0,
    leadsExtracted: details.leadsExtracted || details.totalLeadsFound || 0,
    companiesFound: details.companiesFound || details.savedCompanies || 0,
    totalExpected,
    domainProgress: totalExpected > 0 ? domainsChecked / totalExpected : 0,
    overallProgress,
    processingSpeed: Math.round(processingSpeed * 100) / 100, // Round to 2 decimal places
    estimatedTimeRemaining: estimatedTimeRemaining ? Math.round(estimatedTimeRemaining) : undefined
  }
}

export function convertEventsToLogs(events: ProgressEvent[]): LogEntry[] {
  return events.map(event => ({
    timestamp: event.timestamp,
    level: event.type === 'error' ? 'error' : 
           event.type === 'warning' ? 'warn' :
           event.type === 'complete' ? 'success' : 'info',
    operation: event.operation,
    message: generateLogMessage(event),
    details: event.details,
    phase: event.phase,
    duration: event.duration
  }))
}

function generateLogMessage(event: ProgressEvent): string {
  const { operation, phase, progress, details, type } = event
  
  switch (type) {
    case 'error':
      return `Error in ${operation}: ${event.errors?.join(', ') || 'Unknown error'}`
    
    case 'warning':
      return `Warning during ${operation}: ${details.warning || 'Check details'}`
    
    case 'complete':
      return `Completed ${operation} successfully`
    
    default:
      // Generate contextual progress message
      if (phase === 'domain_discovery') {
        const domains = details.domainsFound || details.domainsChecked || 0
        return `Discovering domains: ${domains} found (${Math.round(progress * 100)}%)`
      }
      
      if (phase === 'privacy_crawl') {
        const pages = details.privacyPagesFound || 0
        return `Analyzing privacy pages: ${pages} found (${Math.round(progress * 100)}%)`
      }
      
      if (phase === 'lead_extraction') {
        const leads = details.leadsExtracted || details.totalLeadsFound || 0
        return `Extracting leads: ${leads} found (${Math.round(progress * 100)}%)`
      }
      
      return `${operation}: ${Math.round(progress * 100)}% complete`
  }
}

export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return 'Invalid time'
  }
}

export function formatRelativeTime(timestamp: string): string {
  try {
    const now = Date.now()
    const eventTime = new Date(timestamp).getTime()
    const diffSeconds = Math.floor((now - eventTime) / 1000)
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`
    return `${Math.floor(diffSeconds / 86400)}d ago`
  } catch {
    return 'Unknown time'
  }
}

export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`
  if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`
  if (durationMs < 3600000) return `${Math.round(durationMs / 60000)}m`
  return `${Math.round(durationMs / 3600000)}h`
}

export function formatProcessingSpeed(speed: number): string {
  if (speed < 1) return `${Math.round(speed * 60)} domains/min`
  return `${Math.round(speed)} domains/sec`
}

// Deterministic State: Filter functions for log entries
export function filterLogsByLevel(logs: LogEntry[], level: string): LogEntry[] {
  if (level === 'all') return logs
  return logs.filter(log => log.level === level)
}

export function filterLogsBySearch(logs: LogEntry[], searchTerm: string): LogEntry[] {
  if (!searchTerm.trim()) return logs
  
  const term = searchTerm.toLowerCase()
  return logs.filter(log => 
    log.operation.toLowerCase().includes(term) ||
    log.message.toLowerCase().includes(term) ||
    log.phase?.toLowerCase().includes(term)
  )
}

export function getErrorCount(logs: LogEntry[]): number {
  return logs.filter(log => log.level === 'error').length
}

export function getWarningCount(logs: LogEntry[]): number {
  return logs.filter(log => log.level === 'warn').length
} 