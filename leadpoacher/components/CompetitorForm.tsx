'use client'

import { useState } from 'react'
import { createScrapeJob } from '../lib/actions'

interface CompetitorFormProps {
  onSubmit?: (competitorName: string) => void
}

export default function CompetitorForm({ onSubmit }: CompetitorFormProps) {
  const [competitorName, setCompetitorName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
      } else {
        setSuccessMessage(`✅ Started researching mentions of "${competitorName.trim()}"`)
        setCompetitorName('')
        
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

  return (
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
            <p className="mt-2 text-sm font-bold text-dark bg-secondary p-2 border-2 border-dark">
              {successMessage}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full md:w-auto btn btn-primary ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? '🔄 Researching...' : '🔍 Find Mentions'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-neutral border-l-4 border-secondary">
        <h3 className="font-bold text-sm">How it works:</h3>
        <p className="text-sm mt-1">
          Enter a competitor&apos;s name and we&apos;ll search the web to find companies and websites that mention them, then extract contact information from those sources.
        </p>
      </div>
    </div>
  )
} 