'use client'

import { useState } from 'react'
import CompetitorForm from '../components/CompetitorForm'
import LeadsTable from '../components/LeadsTable'
import { useLeads, useRefreshLeads } from '../hooks/useLeads'

export default function Dashboard() {
  const { data, isLoading, error } = useLeads()
  const refreshLeads = useRefreshLeads()
  const [currentCompetitor, setCurrentCompetitor] = useState<string>('')

  const handleCompetitorSubmit = async (competitorName: string) => {
    setCurrentCompetitor(competitorName)
    
    // Refresh leads after a short delay to show new results
    setTimeout(() => {
      refreshLeads()
    }, 2000)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <h1 className="font-heading text-5xl md:text-7xl">LEADPOACHER</h1>
        <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto">
          Find companies that mention your competitors. 
          Turn competitor research into actionable contact lists.
        </p>
      </section>

      {/* Main Dashboard */}
      <section className="max-w-6xl mx-auto space-y-8">
        {/* Competitor Form */}
        <CompetitorForm onSubmit={handleCompetitorSubmit} />

        {/* Leads Table */}
        {error ? (
          <div className="bg-light border-2 border-dark shadow-hard p-6">
            <h3 className="font-heading text-xl mb-4">Error Loading Leads</h3>
            <p className="text-red-600">Failed to load leads: {error.message}</p>
            <button 
              onClick={refreshLeads}
              className="btn btn-secondary mt-4"
            >
              Try Again
            </button>
          </div>
        ) : (
          <LeadsTable 
            leads={data?.leads || []} 
            isLoading={isLoading} 
            competitorName={currentCompetitor}
          />
        )}
      </section>

      {/* Stats Section */}
      {data?.leads && data.leads.length > 0 && (
        <section className="mt-16 max-w-6xl mx-auto">
          <div className="bg-light border-2 border-dark shadow-hard p-6 mb-6">
            <h3 className="font-heading text-lg mb-2">Research Summary</h3>
            <p className="text-sm">
              Found {data.leads.length} contacts from companies that mention &quot;{currentCompetitor}&quot;
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-light border-2 border-dark p-6 shadow-hard text-center">
              <h3 className="font-heading text-3xl text-secondary">{data.leads.length}</h3>
              <p className="font-bold">Total Contacts</p>
              <p className="text-xs mt-1">from competitor mentions</p>
            </div>
            <div className="bg-light border-2 border-dark p-6 shadow-hard text-center">
              <h3 className="font-heading text-3xl text-primary">
                {data.leads.filter(lead => lead.status === 'new').length}
              </h3>
              <p className="font-bold">New Prospects</p>
              <p className="text-xs mt-1">ready to contact</p>
            </div>
            <div className="bg-light border-2 border-dark p-6 shadow-hard text-center">
              <h3 className="font-heading text-3xl">
                {new Set(data.leads.map(lead => lead.company_id)).size}
              </h3>
              <p className="font-bold">Companies Found</p>
              <p className="text-xs mt-1">mentioning competitor</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
