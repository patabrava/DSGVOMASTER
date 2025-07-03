'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllLeadsWithCompany } from '../lib/actions'

export interface LeadWithCompany {
  id: string
  company_id: string
  contact_name: string | null
  contact_email: string | null
  source_url: string | null
  status: string | null
  note: string | null
  timestamp: string | null
  company: {
    domain: string
    name: string | null
  }
}

export function useLeads(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['leads', limit, offset],
    queryFn: async () => {
      const result = await getAllLeadsWithCompany(limit, offset)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      return {
        leads: result.data || [],
        count: result.count || 0
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds to show new leads
    staleTime: 0, // Always consider data stale to get fresh results
  })
}

export function useRefreshLeads() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
  }
} 