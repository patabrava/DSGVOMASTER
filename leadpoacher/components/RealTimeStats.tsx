'use client'

import { ProgressStats } from '../lib/types/progress'
import { formatProcessingSpeed } from '../lib/utils/progressUtils'

interface RealTimeStatsProps {
  stats: ProgressStats
  className?: string
}

export default function RealTimeStats({ stats, className = '' }: RealTimeStatsProps) {
  // Explicit Error Handling: Safe destructuring with defaults
  const {
    domainsChecked = 0,
    privacyPagesFound = 0,
    competitorMentionsFound = 0,
    leadsExtracted = 0,
    companiesFound = 0,
    totalExpected = 0,
    domainProgress = 0,
    overallProgress = 0,
    processingSpeed = 0,
    estimatedTimeRemaining
  } = stats

  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return 'Calculating...'
    
    if (seconds < 60) return `${seconds}s remaining`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m remaining`
    return `${Math.round(seconds / 3600)}h remaining`
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    progress,
    bgColor = 'bg-light',
    textColor = 'text-dark',
    accentColor = 'bg-secondary'
  }: {
    title: string
    value: string | number
    subtitle?: string
    progress?: number
    bgColor?: string
    textColor?: string
    accentColor?: string
  }) => (
    <div className={`${bgColor} ${textColor} border-2 border-dark p-4 md:p-6 shadow-hard text-center transition-all duration-300 hover:shadow-hard-lg hover:-translate-x-1 hover:-translate-y-1`}>
      <h3 className="font-heading text-2xl md:text-3xl">{value}</h3>
      <p className="font-bold text-sm md:text-base">{title}</p>
      {subtitle && (
        <p className="text-xs md:text-sm mt-1 opacity-75">{subtitle}</p>
      )}
      {progress !== undefined && (
        <div className="w-full bg-neutral border-2 border-dark mt-3 h-2">
          <div 
            className={`${accentColor} h-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.max(progress * 100, 2)}%` }}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Domains Checked"
          value={domainsChecked.toLocaleString()}
          subtitle={`of ${totalExpected.toLocaleString()} expected`}
          progress={domainProgress}
          bgColor="bg-secondary"
          textColor="text-light"
          accentColor="bg-light"
        />
        
        <StatCard
          title="Privacy Pages"
          value={privacyPagesFound.toLocaleString()}
          subtitle="pages analyzed"
          bgColor="bg-primary"
          textColor="text-dark"
          accentColor="bg-dark"
        />
        
        <StatCard
          title="Competitor Mentions"
          value={competitorMentionsFound.toLocaleString()}
          subtitle="mentions found"
          bgColor="bg-light"
          textColor="text-dark"
          accentColor="bg-secondary"
        />
        
        <StatCard
          title="Leads Extracted"
          value={leadsExtracted.toLocaleString()}
          subtitle={`from ${companiesFound} companies`}
          bgColor="bg-light"
          textColor="text-dark"
          accentColor="bg-primary"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Processing Speed"
          value={formatProcessingSpeed(processingSpeed)}
          subtitle="current rate"
          bgColor="bg-neutral"
          textColor="text-dark"
          accentColor="bg-secondary"
        />
        
        <StatCard
          title="Overall Progress"
          value={`${Math.round(overallProgress * 100)}%`}
          subtitle="complete"
          progress={overallProgress}
          bgColor="bg-neutral"
          textColor="text-dark"
          accentColor="bg-primary"
        />
        
        <StatCard
          title="Time Remaining"
          value={formatTimeRemaining(estimatedTimeRemaining)}
          subtitle="estimated"
          bgColor="bg-neutral"
          textColor="text-dark"
          accentColor="bg-secondary"
        />
      </div>

      {/* Detailed Progress Section */}
      {(domainsChecked > 0 || privacyPagesFound > 0) && (
        <div className="bg-light border-2 border-dark shadow-hard p-4 md:p-6">
          <h3 className="font-heading text-lg mb-4">Progress Breakdown</h3>
          
          <div className="space-y-4">
            {/* Domain Discovery Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">Domain Discovery</span>
                <span className="font-mono text-xs">
                  {domainsChecked}/{totalExpected} ({Math.round(domainProgress * 100)}%)
                </span>
              </div>
              <div className="w-full bg-neutral border-2 border-dark h-3">
                <div 
                  className="bg-secondary h-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(domainProgress * 100, 2)}%` }}
                />
              </div>
            </div>

            {/* Privacy Page Analysis Progress */}
            {privacyPagesFound > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">Privacy Page Analysis</span>
                  <span className="font-mono text-xs">
                    {privacyPagesFound} pages analyzed
                  </span>
                </div>
                <div className="w-full bg-neutral border-2 border-dark h-3">
                  <div 
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${Math.max((privacyPagesFound / Math.max(domainsChecked, 1)) * 100, 2)}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Lead Extraction Progress */}
            {leadsExtracted > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">Lead Extraction</span>
                  <span className="font-mono text-xs">
                    {leadsExtracted} leads from {companiesFound} companies
                  </span>
                </div>
                <div className="w-full bg-neutral border-2 border-dark h-3">
                  <div 
                    className="bg-secondary h-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${Math.max((leadsExtracted / Math.max(privacyPagesFound, 1)) * 100, 2)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          <div className="mt-6 pt-4 border-t-2 border-dark">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="font-heading text-lg text-secondary">
                  {Math.round((privacyPagesFound / Math.max(domainsChecked, 1)) * 100)}%
                </div>
                <div className="text-xs font-mono">Privacy Page Hit Rate</div>
              </div>
              
              <div>
                <div className="font-heading text-lg text-primary">
                  {Math.round((competitorMentionsFound / Math.max(privacyPagesFound, 1)) * 100)}%
                </div>
                <div className="text-xs font-mono">Mention Discovery Rate</div>
              </div>
              
              <div>
                <div className="font-heading text-lg text-secondary">
                  {Math.round((leadsExtracted / Math.max(competitorMentionsFound, 1)) * 100)}%
                </div>
                <div className="text-xs font-mono">Lead Extraction Rate</div>
              </div>
              
              <div>
                <div className="font-heading text-lg">
                  {(leadsExtracted / Math.max(companiesFound, 1)).toFixed(1)}
                </div>
                <div className="text-xs font-mono">Avg Leads per Company</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 