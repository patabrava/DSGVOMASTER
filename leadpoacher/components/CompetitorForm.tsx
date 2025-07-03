'use client'

import { useState } from 'react'
import { createScrapeJob } from '../lib/actions'
import ProgressDashboard from './ProgressDashboard'

interface CompetitorFormProps {
  onSubmit?: (competitorName: string) => void
}

export default function CompetitorForm({ onSubmit }: CompetitorFormProps) {
  const [competitorName, setCompetitorName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)

  const validateCompetitorName = (name: string): string => {
    if (!name.trim()) {
      return 'Competitor name is required'
    }
    
    if (name.trim().length < 2) {
      return 'Please enter at least 2 characters'
    }
    
    if (name.trim().length > 100) {
      return 'Competitor name too long (max 100 characters)'
    }
    
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateCompetitorName(competitorName)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setError('')
    setSuccessMessage('')
    setIsLoading(true)
    
    try {
      // Create scrape job using server action
      const result = await createScrapeJob({
        competitor: competitorName.trim()
      })
      
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        // Show progress dashboard
        setJobId(result.data.id)
        setShowProgress(true)
        
        // Start scraping process in background
        // The progress will be tracked via WebSocket
        fetch('/api/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: result.data.id,
            competitor: competitorName.trim()
          })
        }).catch(error => {
          console.error('Failed to start scraping process:', error)
          setError('Failed to start the research process')
          setShowProgress(false)
        })
        
        // Call optional onSubmit prop for compatibility
        if (onSubmit) {
          await onSubmit(competitorName.trim())
        }
      }
    } catch {
      setError('Failed to start competitor research. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProgressComplete = (success: boolean, results?: any) => {
    if (success && results) {
      setSuccessMessage(`✅ Research complete! Found ${results.leadsFound || results.savedLeads || 0} leads from ${results.companiesFound || results.savedCompanies || 0} companies mentioning "${competitorName.trim()}"`)
      setCompetitorName('')
    } else {
      setError(results?.error || 'Research failed to complete')
    }
  }

  const handleNewResearch = () => {
    setShowProgress(false)
    setJobId(null)
    setError('')
    setSuccessMessage('')
  }

  return (
    <div className="space-y-6">
      {/* Research Form */}
      {!showProgress && (
        <div className="bg-light border-2 border-dark shadow-hard p-6 md:p-8">
          <h2 className="font-heading text-2xl mb-6">Research Competitor Mentions</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="competitorName" className="font-bold block mb-2">
                Competitor Name
              </label>
              <input
                type="text"
                id="competitorName"
                value={competitorName}
                onChange={(e) => {
                  setCompetitorName(e.target.value)
                  if (error) setError('') // Clear error on input
                  if (successMessage) setSuccessMessage('') // Clear success message on input
                }}
                placeholder="Acme Corporation"
                className="w-full p-3 bg-light border-2 border-dark focus:outline-none focus:ring-4 focus:ring-primary focus:border-dark transition-all duration-150"
                disabled={isLoading}
              />
              {error && (
                <p className="mt-2 text-sm font-bold text-dark bg-primary p-2 border-2 border-dark">
                  ⚠️ {error}
                </p>
              )}
              {successMessage && (
                <p className="mt-2 text-sm font-bold text-light bg-secondary p-2 border-2 border-dark">
                  {successMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full md:w-auto bg-primary border-2 border-dark font-bold py-3 px-8 shadow-hard hover:bg-dark hover:text-primary active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? '🔄 Starting Research...' : '🔍 Find Mentions'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-neutral border-l-4 border-secondary">
            <h3 className="font-bold text-sm">How it works:</h3>
            <p className="text-sm mt-1">
              Enter a competitor&apos;s name and we&apos;ll search the web to find companies and websites that mention them, then extract contact information from those sources.
            </p>
          </div>
        </div>
      )}

      {/* Progress Dashboard */}
      {showProgress && jobId && (
        <div className="space-y-6">
          {/* Header with competitor info */}
          <div className="bg-primary text-dark border-2 border-dark shadow-hard p-4 md:p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-heading text-xl md:text-2xl">
                  Researching: "{competitorName}"
                </h2>
                <p className="text-sm mt-1 font-mono">
                  Job ID: {jobId}
                </p>
              </div>
              <button
                onClick={handleNewResearch}
                className="bg-dark text-light border-2 border-dark font-bold py-2 px-4 shadow-hard hover:bg-secondary active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150"
              >
                🔄 New Research
              </button>
            </div>
          </div>

          {/* Progress Dashboard */}
          <ProgressDashboard
            jobId={jobId}
            competitor={competitorName}
            onComplete={handleProgressComplete}
          />
        </div>
      )}
    </div>
  )
} 