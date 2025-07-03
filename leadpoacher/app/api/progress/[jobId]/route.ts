// Server-Sent Events endpoint for real-time progress tracking
// Connects working scraper logs to frontend progress system

import { NextRequest } from 'next/server'

interface ProgressEvent {
  jobId: string
  type: 'progress' | 'error' | 'complete' | 'warning'
  phase: 'init' | 'domain_discovery' | 'privacy_crawl' | 'lead_extraction' | 'storage' | 'complete'
  operation: string
  progress: number
  timestamp: string
  details: Record<string, any>
  errors?: string[]
}

// Global progress event emitter for job tracking
const progressEmitters = new Map<string, (event: ProgressEvent) => void>()

// Function to emit progress events (called from scraper)
export function emitProgressEvent(jobId: string, event: ProgressEvent) {
  const emitter = progressEmitters.get(jobId)
  if (emitter) {
    emitter(event)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId

  // Set up Server-Sent Events
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectionEvent = {
        jobId,
        type: 'progress' as const,
        phase: 'init' as const,
        operation: 'connection_established',
        progress: 0,
        timestamp: new Date().toISOString(),
        details: { connected: true }
      }
      
      const data = `data: ${JSON.stringify(connectionEvent)}\n\n`
      controller.enqueue(encoder.encode(data))

      // Set up progress event listener
      const emitter = (event: ProgressEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch (error) {
          console.error('Error sending SSE event:', error)
        }
      }

      // Register emitter for this job
      progressEmitters.set(jobId, emitter)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        progressEmitters.delete(jobId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
} 