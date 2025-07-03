'use client'

import { useState, useMemo } from 'react'
import { LogEntry } from '../lib/types/progress'
import { 
  formatTimestamp, 
  filterLogsByLevel, 
  filterLogsBySearch, 
  getErrorCount, 
  getWarningCount 
} from '../lib/utils/progressUtils'

interface LogViewerProps {
  logs: LogEntry[]
  isExpanded: boolean
  onToggleExpanded: () => void
  className?: string
}

export default function LogViewer({ 
  logs, 
  isExpanded, 
  onToggleExpanded,
  className = '' 
}: LogViewerProps) {
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'success' | 'debug'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Observable Implementation: Deterministic filtering
  const filteredLogs = useMemo(() => {
    let filtered = filterLogsByLevel(logs, filter)
    filtered = filterLogsBySearch(filtered, searchTerm)
    return filtered.slice().reverse() // Show newest first
  }, [logs, filter, searchTerm])

  const errorCount = getErrorCount(logs)
  const warningCount = getWarningCount(logs)

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      case 'success': return '✅'
      case 'debug': return '🔧'
      default: return 'ℹ️'
    }
  }

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'error':
        return 'border-red-500 bg-red-50 text-red-900'
      case 'warn':
        return 'border-yellow-500 bg-yellow-50 text-yellow-900'
      case 'success':
        return 'border-green-500 bg-green-50 text-green-900'
      case 'debug':
        return 'border-purple-500 bg-purple-50 text-purple-900'
      default:
        return 'border-secondary bg-blue-50 text-blue-900'
    }
  }

  const FilterButton = ({ 
    level, 
    label, 
    count 
  }: { 
    level: string
    label: string
    count?: number 
  }) => (
    <button
      onClick={() => setFilter(level as any)}
      className={`px-3 py-1 text-xs font-bold border-2 border-dark transition-all duration-150 ${
        filter === level
          ? 'bg-primary text-dark shadow-hard'
          : 'bg-light text-dark hover:bg-neutral'
      } active:shadow-none active:translate-x-0.5 active:translate-y-0.5`}
    >
      {label} {count !== undefined && count > 0 && `(${count})`}
    </button>
  )

  // Explicit Error Handling: Safe array operations
  if (!logs || logs.length === 0) {
    return (
      <div className={`bg-light border-2 border-dark shadow-hard ${className}`}>
        <div className="p-4 border-b-2 border-dark flex justify-between items-center">
          <h3 className="font-heading text-lg">Operation Logs</h3>
          <span className="text-xs font-mono bg-neutral px-2 py-1 border border-dark">
            0 entries
          </span>
        </div>
        <div className="p-8 text-center">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm font-mono">No logs available yet</p>
          <p className="text-xs mt-1 opacity-75">Logs will appear as operations begin</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-light border-2 border-dark shadow-hard transition-all duration-300 ${
      isExpanded ? 'max-h-none' : 'max-h-20'
    } overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b-2 border-dark">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-lg">Operation Logs</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-neutral px-2 py-1 border border-dark">
              {logs.length} entries
            </span>
            {errorCount > 0 && (
              <span className="text-xs font-mono bg-red-500 text-light px-2 py-1 border border-dark">
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs font-mono bg-yellow-500 text-dark px-2 py-1 border border-dark">
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={onToggleExpanded}
          className="w-full bg-dark text-light border-2 border-dark font-bold py-2 px-4 shadow-hard hover:bg-secondary active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150 mb-3"
        >
          {isExpanded ? '📋 Hide Detailed Logs' : '📋 Show Detailed Logs'} 
          <span className="ml-2 bg-primary text-dark px-2 py-1 text-xs">
            {filteredLogs.length} shown
          </span>
        </button>

        {/* Filters and Search - Only show when expanded */}
        {isExpanded && (
          <div className="space-y-3">
            {/* Level Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold mr-2">Filter:</span>
              <FilterButton level="all" label="All" />
              <FilterButton level="info" label="Info" />
              <FilterButton level="success" label="Success" />
              <FilterButton level="warn" label="Warnings" count={warningCount} />
              <FilterButton level="error" label="Errors" count={errorCount} />
              <FilterButton level="debug" label="Debug" />
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold">Search:</span>
              <input
                type="text"
                placeholder="Search operations, messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-2 bg-light border-2 border-dark focus:outline-none focus:ring-4 focus:ring-primary focus:border-dark transition-all duration-150 text-xs font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-neutral border-2 border-dark px-2 py-2 text-xs font-bold hover:bg-primary transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Log Entries - Only show when expanded */}
      {isExpanded && (
        <div className="overflow-y-auto max-h-80 p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm font-mono">No logs match your filters</p>
              <button
                onClick={() => {
                  setFilter('all')
                  setSearchTerm('')
                }}
                className="mt-2 bg-primary border-2 border-dark font-bold px-3 py-1 text-xs hover:bg-dark hover:text-primary transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <LogEntryComponent key={`${log.timestamp}-${index}`} log={log} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Separate component for individual log entries
function LogEntryComponent({ log }: { log: LogEntry }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className={`p-3 border-l-4 ${log.level === 'error' ? 'border-red-500 bg-red-50' :
      log.level === 'warn' ? 'border-yellow-500 bg-yellow-50' :
      log.level === 'success' ? 'border-green-500 bg-green-50' :
      'border-secondary bg-blue-50'
    } font-mono text-sm border-2 border-dark shadow-hard`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-2 flex-1">
          <span className="text-lg leading-none">
            {log.level === 'error' ? '❌' :
             log.level === 'warn' ? '⚠️' :
             log.level === 'success' ? '✅' :
             'ℹ️'}
          </span>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-dark">{log.operation}</span>
              {log.phase && (
                <span className="bg-neutral text-dark px-1 py-0.5 text-xs border border-dark">
                  {log.phase}
                </span>
              )}
              {log.duration && (
                <span className="text-xs opacity-75">
                  ({log.duration}ms)
                </span>
              )}
            </div>
            <p className="mt-1 text-dark">{log.message}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <span className="text-xs opacity-75 whitespace-nowrap">
            {formatTimestamp(log.timestamp)}
          </span>
          {log.details && Object.keys(log.details).length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="bg-dark text-light px-2 py-1 text-xs font-bold border border-dark hover:bg-secondary transition-colors"
            >
              {showDetails ? '▼' : '▶'} Details
            </button>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && log.details && (
        <div className="mt-3 pt-3 border-t border-dark">
          <div className="bg-dark text-light p-3 overflow-x-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
} 