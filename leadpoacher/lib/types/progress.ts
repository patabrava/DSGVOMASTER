// Progress Tracking Types - Observable Implementation
// Following MONOCODE principles for structured data flow

export interface ProgressEvent {
  jobId: string
  type: 'progress' | 'error' | 'complete' | 'warning'
  phase: 'init' | 'domain_discovery' | 'privacy_crawl' | 'lead_extraction' | 'storage' | 'complete'
  operation: string
  progress: number // 0.0 to 1.0
  timestamp: string
  details: Record<string, any>
  errors?: string[]
  duration?: number
}

export interface ProgressStep {
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'warning'
  progress?: number
  duration?: number
  details?: Record<string, any>
  startTime?: string
  endTime?: string
}

export interface ProgressStats {
  domainsChecked: number
  privacyPagesFound: number
  competitorMentionsFound: number
  leadsExtracted: number
  companiesFound: number
  totalExpected: number
  domainProgress: number
  overallProgress: number
  processingSpeed: number // domains per second
  estimatedTimeRemaining?: number
}

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug' | 'success'
  operation: string
  message: string
  details?: Record<string, any>
  phase?: string
  duration?: number
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastUpdate?: string
  latency?: number
  reconnectAttempts: number
  error?: string
}

export interface PerformanceMetrics {
  wsLatency: number
  updateRate: number
  memoryUsage: number
  eventCount: number
  connectionUptime: number
}

// Progress phase definitions
export const PROGRESS_PHASES = {
  init: { name: 'Initialization', order: 0, color: 'neutral' },
  domain_discovery: { name: 'Domain Discovery', order: 1, color: 'primary' },
  privacy_crawl: { name: 'Privacy Page Analysis', order: 2, color: 'secondary' },
  lead_extraction: { name: 'Lead Extraction', order: 3, color: 'primary' },
  storage: { name: 'Data Storage', order: 4, color: 'secondary' },
  complete: { name: 'Complete', order: 5, color: 'success' }
} as const

export type PhaseKey = keyof typeof PROGRESS_PHASES 