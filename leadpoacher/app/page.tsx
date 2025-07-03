'use client'

import { useState } from 'react'
import CompetitorForm from '../components/CompetitorForm'
import LeadsTable from '../components/LeadsTable'
import { Lead } from '../lib/dbSchema'

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentCompetitor, setCurrentCompetitor] = useState<string>('')

  // Sample data for testing - will be replaced with real data later
  const sampleLeads: Lead[] = [
    {
      id: '1',
      company_id: 'comp-1',
      contact_name: 'Sarah Johnson',
      contact_email: 'sarah@techcorp.com',
      source_url: 'https://techcorp.com/blog/competitor-analysis',
      status: 'new',
      note: 'Mentioned competitor in blog post about market analysis',
      timestamp: '2025-01-01T10:00:00Z'
    },
    {
      id: '2', 
      company_id: 'comp-2',
      contact_name: 'Michael Chen',
      contact_email: 'michael@startupxyz.com',
      source_url: 'https://startupxyz.com/about',
      status: 'new',
      note: 'CEO who mentioned competitor as market leader in company about page',
      timestamp: '2025-01-01T10:05:00Z'
    },
    {
      id: '3', 
      company_id: 'comp-3',
      contact_name: 'Emily Rodriguez',
      contact_email: 'emily@innovatelab.com',
      source_url: 'https://innovatelab.com/press-release',
      status: 'contacted',
      note: 'CTO quoted comparing their solution to competitor in press release',
      timestamp: '2025-01-01T10:10:00Z'
    }
  ]

  const handleCompetitorSubmit = async (competitorName: string) => {
    setIsLoading(true)
    setCurrentCompetitor(competitorName)
    
    try {
      // Simulate API call - will be replaced with real competitor research later
      console.log('Researching competitor mentions for:', competitorName)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // For now, just add sample data
      setLeads(sampleLeads)
    } catch (error) {
      console.error('Error researching competitor:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
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
        <LeadsTable 
          leads={leads} 
          isLoading={isLoading} 
          competitorName={currentCompetitor}
        />
      </section>

      {/* Stats Section */}
      {leads.length > 0 && (
        <section className="mt-16 max-w-6xl mx-auto">
          <div className="bg-light border-2 border-dark shadow-hard p-6 mb-6">
            <h3 className="font-heading text-lg mb-2">Research Summary</h3>
            <p className="text-sm">
              Found {leads.length} contacts from companies that mention &quot;{currentCompetitor}&quot;
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-light border-2 border-dark p-6 shadow-hard text-center">
              <h3 className="font-heading text-3xl text-secondary">{leads.length}</h3>
              <p className="font-bold">Total Contacts</p>
              <p className="text-xs mt-1">from competitor mentions</p>
            </div>
            <div className="bg-light border-2 border-dark p-6 shadow-hard text-center">
              <h3 className="font-heading text-3xl text-primary">
                {leads.filter(lead => lead.status === 'new').length}
              </h3>
              <p className="font-bold">New Prospects</p>
              <p className="text-xs mt-1">ready to contact</p>
            </div>
            <div className="bg-light border-2 border-dark p-6 shadow-hard text-center">
              <h3 className="font-heading text-3xl">
                {new Set(leads.map(lead => lead.company_id)).size}
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
