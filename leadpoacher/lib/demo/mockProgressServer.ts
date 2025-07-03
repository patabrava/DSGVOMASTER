// Mock Progress WebSocket Server for Development
// Following MONOCODE Observable Implementation principles

import { ProgressEvent, PROGRESS_PHASES } from '../types/progress'

// Observable Implementation: Structured logging for mock server
const logMockServer = (operation: string, data: any, success: boolean) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `mock_server_${operation}`,
    data: data,
    success,
    mock: true
  }))
}

// Mock progress data generator
export class MockProgressServer {
  private static instance: MockProgressServer | null = null
  private connections: Map<string, WebSocket> = new Map()
  private activeJobs: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): MockProgressServer {
    if (!MockProgressServer.instance) {
      MockProgressServer.instance = new MockProgressServer()
    }
    return MockProgressServer.instance
  }

  // Simulate progress events for a job
  simulateJobProgress(jobId: string, competitor: string) {
    if (this.activeJobs.has(jobId)) {
      logMockServer('job_already_running', { jobId }, false)
      return
    }

    logMockServer('job_simulation_started', { jobId, competitor }, true)

    const phases = [
      { phase: 'init', duration: 2000, operations: ['job_validation', 'system_initialization'] },
      { phase: 'domain_discovery', duration: 8000, operations: ['static_domains', 'api_discovery', 'crawl_discovery'] },
      { phase: 'privacy_crawl', duration: 12000, operations: ['privacy_page_detection', 'content_analysis'] },
      { phase: 'lead_extraction', duration: 6000, operations: ['email_extraction', 'contact_discovery'] },
      { phase: 'storage', duration: 3000, operations: ['data_validation', 'database_storage'] }
    ]

    let currentPhaseIndex = 0
    let overallProgress = 0

    const runPhase = () => {
      if (currentPhaseIndex >= phases.length) {
        // Job completion
        this.broadcastEvent(jobId, {
          jobId,
          type: 'complete',
          phase: 'complete',
          operation: 'job_completed',
          progress: 1.0,
          timestamp: new Date().toISOString(),
          details: {
            domainsChecked: 487,
            privacyPagesFound: 142,
            competitorMentionsFound: 28,
            leadsFound: 34,
            savedLeads: 34,
            companiesFound: 28,
            savedCompanies: 28,
            totalTime: phases.reduce((sum, p) => sum + p.duration, 0)
          }
        })

        this.activeJobs.delete(jobId)
        logMockServer('job_simulation_completed', { jobId }, true)
        return
      }

      const currentPhase = phases[currentPhaseIndex]
      const phaseStartTime = Date.now()
      
      // Start phase
      this.broadcastEvent(jobId, {
        jobId,
        type: 'progress',
        phase: currentPhase.phase as any,
        operation: `${currentPhase.phase}_start`,
        progress: 0,
        timestamp: new Date().toISOString(),
        details: {
          phase: currentPhase.phase,
          estimatedDuration: currentPhase.duration
        }
      })

      // Simulate progress within phase
      const progressInterval = 500 // Update every 500ms
      const progressSteps = Math.floor(currentPhase.duration / progressInterval)
      let currentStep = 0

      const stepInterval = setInterval(() => {
        currentStep++
        const phaseProgress = Math.min(currentStep / progressSteps, 1.0)
        overallProgress = (currentPhaseIndex + phaseProgress) / phases.length

        // Generate realistic metrics based on phase
        const details = this.generatePhaseDetails(currentPhase.phase as any, phaseProgress, competitor)

        this.broadcastEvent(jobId, {
          jobId,
          type: 'progress',
          phase: currentPhase.phase as any,
          operation: `${currentPhase.phase}_progress`,
          progress: phaseProgress,
          timestamp: new Date().toISOString(),
          details: {
            ...details,
            overallProgress,
            currentPhase: currentPhaseIndex + 1,
            totalPhases: phases.length
          }
        })

        if (phaseProgress >= 1.0) {
          clearInterval(stepInterval)
          
          // Phase completion
          this.broadcastEvent(jobId, {
            jobId,
            type: 'progress',
            phase: currentPhase.phase as any,
            operation: `${currentPhase.phase}_complete`,
            progress: 1.0,
            timestamp: new Date().toISOString(),
            details: {
              ...details,
              phaseDuration: Date.now() - phaseStartTime,
              completed: true
            }
          })

          currentPhaseIndex++
          setTimeout(runPhase, 1000) // Delay between phases
        }
      }, progressInterval)

      // Store the interval reference for cleanup
      if (!this.activeJobs.has(jobId)) {
        this.activeJobs.set(jobId, stepInterval)
      }
    }

    runPhase()
  }

  private generatePhaseDetails(phase: string, progress: number, competitor: string) {
    const baseMultiplier = Math.floor(progress * 100) / 100 // Smooth progression

    switch (phase) {
      case 'init':
        return {
          operation: 'Initializing system',
          maxDomains: 500,
          competitor
        }

      case 'domain_discovery':
        return {
          domainsChecked: Math.floor(500 * baseMultiplier),
          domainsFound: Math.floor(450 * baseMultiplier),
          totalExpected: 500,
          apiSources: ['static', 'opencorporates', 'commoncrawl'],
          processingSpeed: 12.5 + Math.random() * 5
        }

      case 'privacy_crawl':
        return {
          domainsChecked: Math.floor(450 * Math.min(progress + 0.1, 1.0)),
          privacyPagesFound: Math.floor(142 * baseMultiplier),
          privacyPagesChecked: Math.floor(380 * baseMultiplier),
          avgResponseTime: 850 + Math.random() * 300
        }

      case 'lead_extraction':
        return {
          privacyPagesAnalyzed: Math.floor(142 * Math.min(progress + 0.2, 1.0)),
          competitorMentionsFound: Math.floor(28 * baseMultiplier),
          leadsExtracted: Math.floor(34 * baseMultiplier),
          emailsFound: Math.floor(42 * baseMultiplier)
        }

      case 'storage':
        return {
          leadsProcessed: Math.floor(34 * baseMultiplier),
          leadsStored: Math.floor(34 * baseMultiplier),
          companiesProcessed: Math.floor(28 * baseMultiplier),
          companiesStored: Math.floor(28 * baseMultiplier)
        }

      default:
        return {}
    }
  }

  private broadcastEvent(jobId: string, event: ProgressEvent) {
    const connection = this.connections.get(jobId)
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(event))
      logMockServer('event_broadcast', { jobId, operation: event.operation }, true)
    }
  }

  // Register a WebSocket connection for a job
  registerConnection(jobId: string, websocket: WebSocket) {
    this.connections.set(jobId, websocket)
    logMockServer('connection_registered', { jobId }, true)

    websocket.onclose = () => {
      this.connections.delete(jobId)
      const interval = this.activeJobs.get(jobId)
      if (interval) {
        clearInterval(interval)
        this.activeJobs.delete(jobId)
      }
      logMockServer('connection_closed', { jobId }, true)
    }
  }

  // Stop simulation for a job
  stopJobSimulation(jobId: string) {
    const interval = this.activeJobs.get(jobId)
    if (interval) {
      clearInterval(interval)
      this.activeJobs.delete(jobId)
      logMockServer('job_simulation_stopped', { jobId }, true)
    }
  }

  // Simulate an error during processing
  simulateError(jobId: string, phase: string, errorMessage: string) {
    this.broadcastEvent(jobId, {
      jobId,
      type: 'error',
      phase: phase as any,
      operation: `${phase}_error`,
      progress: 0,
      timestamp: new Date().toISOString(),
      details: { errorMessage },
      errors: [errorMessage]
    })
    
    this.stopJobSimulation(jobId)
    logMockServer('error_simulated', { jobId, phase, errorMessage }, true)
  }
}

// Browser-compatible mock WebSocket server
export function createMockWebSocketConnection(url: string): WebSocket {
  // Extract jobId from URL
  const jobId = url.split('/').pop() || 'unknown'
  
  // Create a mock WebSocket-like object
  const mockWS = new EventTarget() as any
  mockWS.readyState = WebSocket.CONNECTING
  mockWS.CONNECTING = WebSocket.CONNECTING
  mockWS.OPEN = WebSocket.OPEN
  mockWS.CLOSING = WebSocket.CLOSING
  mockWS.CLOSED = WebSocket.CLOSED

  // Mock WebSocket methods
  mockWS.send = (data: string) => {
    logMockServer('message_sent', { jobId, data }, true)
  }

  mockWS.close = (code?: number, reason?: string) => {
    mockWS.readyState = WebSocket.CLOSED
    if (mockWS.onclose) {
      mockWS.onclose({ code: code || 1000, reason: reason || 'Normal closure' })
    }
  }

  // Simulate connection opening
  setTimeout(() => {
    mockWS.readyState = WebSocket.OPEN
    if (mockWS.onopen) {
      mockWS.onopen({})
    }
    
    // Register with mock server and start simulation
    const server = MockProgressServer.getInstance()
    server.registerConnection(jobId, mockWS)
    
    // Simulate job progress with realistic competitor name
    const competitor = 'Demo Competitor'
    server.simulateJobProgress(jobId, competitor)
    
  }, 100)

  logMockServer('mock_connection_created', { url, jobId }, true)
  
  return mockWS as WebSocket
}

// Development helper: Check if we should use mock server
export function shouldUseMockServer(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_USE_MOCK_PROGRESS === 'true'
} 