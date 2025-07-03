'use client'

import { ConnectionState } from '../lib/types/progress'
import { formatRelativeTime } from '../lib/utils/progressUtils'

interface ConnectionStatusProps {
  connectionState: ConnectionState
  onReconnect: () => void
  className?: string
}

export default function ConnectionStatus({ 
  connectionState, 
  onReconnect,
  className = ''
}: ConnectionStatusProps) {
  const { status, lastUpdate, latency, reconnectAttempts, error } = connectionState

  // Explicit Error Handling: Safe status determination
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          bgColor: 'bg-secondary',
          textColor: 'text-light',
          indicatorColor: 'bg-green-400',
          icon: '🟢',
          label: 'Live Updates Active'
        }
      case 'connecting':
        return {
          bgColor: 'bg-primary',
          textColor: 'text-dark',
          indicatorColor: 'bg-yellow-400 animate-pulse',
          icon: '🔄',
          label: 'Connecting...'
        }
      case 'disconnected':
        return {
          bgColor: 'bg-neutral',
          textColor: 'text-dark',
          indicatorColor: 'bg-gray-400',
          icon: '⚪',
          label: 'Connection Lost'
        }
      case 'error':
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-light',
          indicatorColor: 'bg-red-400',
          icon: '🔴',
          label: 'Connection Error'
        }
      default:
        return {
          bgColor: 'bg-neutral',
          textColor: 'text-dark',
          indicatorColor: 'bg-gray-400',
          icon: '⚪',
          label: 'Unknown Status'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const showReconnectButton = status === 'disconnected' || status === 'error'

  return (
    <div className={`flex items-center justify-between p-3 border-2 border-dark shadow-hard ${statusConfig.bgColor} ${statusConfig.textColor} ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${statusConfig.indicatorColor}`} />
          <span className="font-mono text-sm font-bold">
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>

        {/* Connection Details */}
        <div className="hidden md:flex items-center space-x-4 text-xs font-mono">
          {latency !== undefined && status === 'connected' && (
            <span className="opacity-75">
              {latency}ms latency
            </span>
          )}
          
          {lastUpdate && (
            <span className="opacity-75">
              Last: {formatRelativeTime(lastUpdate)}
            </span>
          )}
          
          {reconnectAttempts > 0 && (
            <span className="opacity-75">
              Attempt: {reconnectAttempts}/5
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Error Message */}
        {error && (
          <div className="hidden md:block max-w-xs">
            <span className="text-xs font-mono opacity-75 truncate">
              {error}
            </span>
          </div>
        )}

        {/* Reconnect Button */}
        {showReconnectButton && (
          <button 
            onClick={onReconnect}
            className="bg-light text-dark border-2 border-dark px-3 py-1 text-xs font-bold shadow-hard hover:bg-neutral active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all duration-150"
          >
            🔄 Reconnect
          </button>
        )}

        {/* Status Badge for Mobile */}
        <div className="md:hidden">
          <span className={`inline-block w-2 h-2 rounded-full ${statusConfig.indicatorColor}`} />
        </div>
      </div>

      {/* Mobile Error Details */}
      {error && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-1 p-2 bg-dark text-light border-2 border-dark shadow-hard text-xs font-mono z-10">
          {error}
        </div>
      )}
    </div>
  )
} 