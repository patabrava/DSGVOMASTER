'use client'

import { LeadWithCompany } from '../hooks/useLeads'

interface LeadsTableProps {
  leads?: LeadWithCompany[]
  isLoading?: boolean
  competitorName?: string
}

export default function LeadsTable({ leads = [], isLoading = false, competitorName }: LeadsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-light border-2 border-dark shadow-hard">
        <div className="p-4 border-b-2 border-dark">
          <h3 className="font-heading text-xl">Contact Leads from Competitor Mentions</h3>
        </div>
        <div className="p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-neutral rounded mb-2"></div>
            <div className="h-4 bg-neutral rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-neutral rounded w-1/2"></div>
          </div>
          <p className="mt-4 font-bold">🔄 Researching competitor mentions...</p>
          {competitorName && (
            <p className="text-sm mt-2">Searching for companies that mention &quot;{competitorName}&quot;</p>
          )}
        </div>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="bg-light border-2 border-dark shadow-hard">
        <div className="p-4 border-b-2 border-dark">
          <h3 className="font-heading text-xl">Contact Leads from Competitor Mentions</h3>
        </div>
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h4 className="font-heading text-lg mb-2">No leads found yet</h4>
          <p className="text-sm">
            Start by entering a competitor name above. We&apos;ll search the web for companies that mention them and extract contact information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-light border-2 border-dark shadow-hard">
      <div className="p-4 border-b-2 border-dark flex justify-between items-center">
        <h3 className="font-heading text-xl">Contact Leads from Competitor Mentions</h3>
        <span className="bg-secondary text-light font-mono text-xs py-1 px-2 border border-dark">
          {leads.length} contact{leads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-dark">
              <th className="text-left p-4 font-bold">Contact Name</th>
              <th className="text-left p-4 font-bold">Email</th>
              <th className="text-left p-4 font-bold">Company</th>
              <th className="text-left p-4 font-bold">Source Page</th>
              <th className="text-left p-4 font-bold">Status</th>
              <th className="text-left p-4 font-bold">Note</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr 
                key={lead.id} 
                className={`border-b border-dark ${index % 2 === 0 ? 'bg-light' : 'bg-neutral'}`}
              >
                <td className="p-4">
                  <div className="font-bold">
                    {lead.contact_name || 'Unknown'}
                  </div>
                </td>
                <td className="p-4">
                  {lead.contact_email ? (
                    <a 
                      href={`mailto:${lead.contact_email}`}
                      className="text-secondary hover:underline"
                    >
                      {lead.contact_email}
                    </a>
                  ) : (
                    <span className="text-gray-500">No email</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="text-sm font-semibold">
                    {lead.company?.name || 'Unknown Company'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {lead.company?.domain}
                  </div>
                </td>
                <td className="p-4">
                  {lead.source_url ? (
                    <a 
                      href={lead.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:underline text-sm"
                    >
                      View Page →
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">No source</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`font-mono text-xs py-1 px-2 border border-dark ${
                    lead.status === 'new' ? 'bg-primary text-dark' :
                    lead.status === 'contacted' ? 'bg-secondary text-light' :
                    lead.status === 'qualified' ? 'bg-green-500 text-light' :
                    'bg-neutral text-dark'
                  }`}>
                    {lead.status?.toUpperCase() || 'NEW'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm">
                    {lead.note ? lead.note.substring(0, 40) + (lead.note.length > 40 ? '...' : '') : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet/Mobile Cards */}
      <div className="lg:hidden">
        {leads.map((lead, index) => (
          <div key={lead.id} className={`p-4 border-b-2 border-dark ${
            index === leads.length - 1 ? 'border-b-0' : ''
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold">
                  {lead.contact_name || 'Unknown'}
                </h4>
                <p className="text-sm text-gray-600">
                  at {lead.company?.name || 'Unknown Company'}
                </p>
              </div>
              <span className={`font-mono text-xs py-1 px-2 border border-dark ${
                lead.status === 'new' ? 'bg-primary text-dark' :
                lead.status === 'contacted' ? 'bg-secondary text-light' :
                lead.status === 'qualified' ? 'bg-green-500 text-light' :
                'bg-neutral text-dark'
              }`}>
                {lead.status?.toUpperCase() || 'NEW'}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-bold">Email: </span>
                {lead.contact_email ? (
                  <a href={`mailto:${lead.contact_email}`} className="text-secondary">
                    {lead.contact_email}
                  </a>
                ) : (
                  <span className="text-gray-500">No email</span>
                )}
              </div>
              {lead.source_url && (
                <div>
                  <span className="font-bold">Source: </span>
                  <a 
                    href={lead.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary"
                  >
                    View Page →
                  </a>
                </div>
              )}
              {lead.note && (
                <div>
                  <span className="font-bold">Note: </span>
                  <span>{lead.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 