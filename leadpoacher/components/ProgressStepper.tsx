'use client'

import { ProgressStep } from '../lib/types/progress'
import { formatDuration } from '../lib/utils/progressUtils'

interface ProgressStepperProps {
  steps: ProgressStep[]
  currentStep: number
  className?: string
}

export default function ProgressStepper({ 
  steps, 
  currentStep,
  className = '' 
}: ProgressStepperProps) {
  // Explicit Error Handling: Safe array operations
  if (!steps || steps.length === 0) {
    return (
      <div className={`bg-light border-2 border-dark shadow-hard p-6 ${className}`}>
        <h3 className="font-heading text-xl mb-4">Research Progress</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-sm font-mono">Initializing progress tracking...</p>
        </div>
      </div>
    )
  }

  const getStepIcon = (step: ProgressStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return '✅'
      case 'in_progress':
        return '🔄'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return index + 1 // Show step number for pending steps
    }
  }

  const getStepStyles = (step: ProgressStep, index: number) => {
    const isActive = index === currentStep
    const baseClasses = 'flex items-center p-4 border-2 border-dark mb-3 shadow-hard transition-all duration-300'
    
    switch (step.status) {
      case 'completed':
        return `${baseClasses} bg-secondary text-light`
      case 'in_progress':
        return `${baseClasses} bg-primary text-dark ${isActive ? 'shadow-hard-lg' : ''}`
      case 'error':
        return `${baseClasses} bg-red-500 text-light`
      case 'warning':
        return `${baseClasses} bg-yellow-500 text-dark`
      default:
        return `${baseClasses} bg-neutral text-dark opacity-75`
    }
  }

  const getProgressBarStyles = (step: ProgressStep) => {
    if (step.status === 'completed') return 'bg-light'
    if (step.status === 'error') return 'bg-red-300'
    if (step.status === 'warning') return 'bg-yellow-300'
    if (step.status === 'in_progress') return 'bg-dark'
    return 'bg-gray-300'
  }

  return (
    <div className={`bg-light border-2 border-dark shadow-hard p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-heading text-xl">Research Progress</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono bg-neutral px-2 py-1 border border-dark">
            {steps.filter(s => s.status === 'completed').length}/{steps.length} Complete
          </span>
          {steps.some(s => s.status === 'error') && (
            <span className="text-xs font-mono bg-red-500 text-light px-2 py-1 border border-dark">
              {steps.filter(s => s.status === 'error').length} Error{steps.filter(s => s.status === 'error').length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={step.name} className="relative">
            {/* Step Container */}
            <div className={getStepStyles(step, index)}>
              <div className="flex items-center justify-between w-full">
                {/* Left Side: Icon and Name */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 border-2 border-dark bg-light text-dark font-bold text-sm">
                    {getStepIcon(step, index)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{step.name}</h4>
                    {step.status === 'in_progress' && step.progress !== undefined && (
                      <p className="text-xs font-mono mt-1">
                        {Math.round(step.progress * 100)}% complete
                      </p>
                    )}
                    {step.status === 'completed' && step.duration && (
                      <p className="text-xs font-mono mt-1 opacity-75">
                        Completed in {formatDuration(step.duration)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Details */}
                <div className="text-right">
                  {step.details && Object.keys(step.details).length > 0 && (
                    <div className="text-xs font-mono space-y-1">
                      {step.details.domainsChecked && (
                        <div>{step.details.domainsChecked} domains checked</div>
                      )}
                      {step.details.privacyPagesFound && (
                        <div>{step.details.privacyPagesFound} privacy pages found</div>
                      )}
                      {step.details.leadsExtracted && (
                        <div>{step.details.leadsExtracted} leads extracted</div>
                      )}
                      {step.details.companiesFound && (
                        <div>{step.details.companiesFound} companies found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar for Active Steps */}
              {step.status === 'in_progress' && step.progress !== undefined && (
                <div className="mt-3">
                  <div className="w-full bg-neutral border-2 border-dark h-3">
                    <div 
                      className={`h-full ${getProgressBarStyles(step)} transition-all duration-500 ease-out border-r-2 border-dark`}
                      style={{ width: `${Math.max(step.progress * 100, 5)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Connector Line (except for last item) */}
            {index < steps.length - 1 && (
              <div className="flex justify-center">
                <div className={`w-0.5 h-3 ${
                  step.status === 'completed' ? 'bg-secondary' :
                  step.status === 'in_progress' ? 'bg-primary' :
                  step.status === 'error' ? 'bg-red-500' :
                  'bg-neutral'
                }`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Progress Summary */}
      <div className="mt-6 pt-4 border-t-2 border-dark">
        <div className="flex justify-between items-center text-xs font-mono">
          <span>Overall Progress</span>
          <span>
            {Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-neutral border-2 border-dark h-2">
          <div 
            className="h-full bg-secondary transition-all duration-500 ease-out"
            style={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  )
} 