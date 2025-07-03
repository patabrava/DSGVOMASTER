'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ProgressEvent, ConnectionState, PerformanceMetrics } from '../lib/types/progress'

// Observable Implementation: Structured logging for WebSocket operations
const logWebSocketOperation = (operation: string, data: any, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `websocket_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

interface UseProgressWebSocketReturn {
  connectionState: ConnectionState
  progressEvents: ProgressEvent[]
  currentProgress: ProgressEvent | null
  performanceMetrics: PerformanceMetrics
  reconnect: () => void
  clearEvents: () => void
}

export function useProgressWebSocket(jobId: string | null): UseProgressWebSocketReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0
  })
  
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([])
  const [currentProgress, setCurrentProgress] = useState<ProgressEvent | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    wsLatency: 0,
    updateRate: 0,
    memoryUsage: 0,
    eventCount: 0,
    connectionUptime: 0
  })
  
  const websocketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionStartTimeRef = useRef<number>(0)
  const lastUpdateTimeRef = useRef<number>(0)
  const updateCountRef = useRef<number>(0)
  const maxEventsInMemory = 500 // Prevent memory leaks

  // Explicit Error Handling: Connection management
  const connect = useCallback(() => {
    if (!jobId) {
      logWebSocketOperation('connect_skipped', { reason: 'no_job_id' }, false)
      return
    }

    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      logWebSocketOperation('connect_skipped', { reason: 'already_connected' }, false)
      return
    }

    try {
      setConnectionState(prev => ({ 
        ...prev, 
        status: 'connecting',
        error: undefined
      }))
      
      connectionStartTimeRef.current = Date.now()
      
      // Use Server-Sent Events for real-time progress updates
      const sseUrl = `/api/progress/${jobId}`
      const eventSource = new EventSource(sseUrl)
      logWebSocketOperation('using_sse', { jobId, url: sseUrl }, true)
      
      websocketRef.current = eventSource as any // Type compatibility

      eventSource.onopen = () => {
        const latency = Date.now() - connectionStartTimeRef.current
        setConnectionState(prev => ({
          ...prev,
          status: 'connected',
          lastUpdate: new Date().toISOString(),
          latency,
          reconnectAttempts: 0,
          error: undefined
        }))
        
        logWebSocketOperation('connected', { jobId, latency }, true)
      }

      eventSource.onmessage = (event) => {
        try {
          const progressEvent: ProgressEvent = JSON.parse(event.data)
          
          // Update performance metrics
          const now = Date.now()
          const timeSinceLastUpdate = now - lastUpdateTimeRef.current
          lastUpdateTimeRef.current = now
          updateCountRef.current++
          
          setPerformanceMetrics(prev => ({
            ...prev,
            wsLatency: prev.wsLatency * 0.9 + timeSinceLastUpdate * 0.1, // Moving average
            updateRate: updateCountRef.current / ((now - connectionStartTimeRef.current) / 1000),
            eventCount: updateCountRef.current,
            connectionUptime: now - connectionStartTimeRef.current
          }))

          // Add progress event with memory management
          setProgressEvents(prev => {
            const updated = [...prev, progressEvent]
            return updated.length > maxEventsInMemory 
              ? updated.slice(-maxEventsInMemory) 
              : updated
          })
          
          setCurrentProgress(progressEvent)
          setConnectionState(prev => ({ 
            ...prev, 
            lastUpdate: progressEvent.timestamp 
          }))
          
          logWebSocketOperation('message_received', { 
            operation: progressEvent.operation,
            phase: progressEvent.phase,
            progress: progressEvent.progress
          }, true)
          
        } catch (error) {
          logWebSocketOperation('message_parse_error', { error: error instanceof Error ? error.message : 'Unknown error' }, false)
        }
      }

      eventSource.onerror = (error: any) => {
        setConnectionState(prev => ({
          ...prev,
          status: 'error',
          error: 'Server-Sent Events connection error'
        }))
        
        logWebSocketOperation('error', { error: error.toString() }, false)
        
        // Attempt reconnection for SSE errors
        if (connectionState.reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, connectionState.reconnectAttempts), 30000)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionState(prev => ({ 
              ...prev, 
              reconnectAttempts: prev.reconnectAttempts + 1 
            }))
            connect()
          }, delay)
          
          logWebSocketOperation('reconnect_scheduled', { 
            attempt: connectionState.reconnectAttempts + 1,
            delay 
          }, true)
        }
      }

    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed'
      }))
      
      logWebSocketOperation('connect_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, false)
    }
  }, [jobId, connectionState.reconnectAttempts])

  // Dependency Transparency: Clear cleanup function
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (websocketRef.current) {
      (websocketRef.current as any).close() // EventSource close method
      websocketRef.current = null
    }
    
    logWebSocketOperation('disconnect', { jobId }, true)
  }, [jobId])

  const reconnect = useCallback(() => {
    disconnect()
    setConnectionState(prev => ({ ...prev, reconnectAttempts: 0 }))
    setTimeout(connect, 100)
  }, [connect, disconnect])

  const clearEvents = useCallback(() => {
    setProgressEvents([])
    setCurrentProgress(null)
    updateCountRef.current = 0
    logWebSocketOperation('events_cleared', { jobId }, true)
  }, [jobId])

  // Progressive Construction: Connect when jobId is available
  useEffect(() => {
    if (jobId) {
      connect()
    } else {
      disconnect()
    }

    return disconnect
  }, [jobId, connect, disconnect])

  // Memory usage monitoring
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory
        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memInfo.usedJSHeapSize / 1048576) // Convert to MB
        }))
      }
    }

    const interval = setInterval(updateMemoryUsage, 5000)
    return () => clearInterval(interval)
  }, [])

  return {
    connectionState,
    progressEvents,
    currentProgress,
    performanceMetrics,
    reconnect,
    clearEvents
  }
} 