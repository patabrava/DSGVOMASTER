'use server'

import { createServerSupabaseClient } from '../supabaseClient'
import { Lead, LeadInsert, LeadUpdate } from '../dbSchema'

// Observable Implementation: Structured logging for lead operations
const logLeadOperation = (operation: string, data: any, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `lead_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

/**
 * Create a new lead for a company
 * @param lead - Lead data to insert
 * @returns Created lead or error
 */
export async function createLead(lead: LeadInsert): Promise<{
  data: Lead | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!lead.company_id?.trim()) {
      const error = 'Company ID is required'
      logLeadOperation('create', lead, false, error)
      return { data: null, error }
    }

    if (!lead.contact_email?.trim()) {
      const error = 'Contact email is required'
      logLeadOperation('create', lead, false, error)
      return { data: null, error }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(lead.contact_email.trim())) {
      const error = 'Invalid email format'
      logLeadOperation('create', lead, false, error)
      return { data: null, error }
    }

    // Dependency Transparency: Clear Supabase client usage
    const supabase = createServerSupabaseClient()
    
    // Verify company exists
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', lead.company_id)
      .single()

    if (!company) {
      const error = 'Company not found'
      logLeadOperation('create', lead, false, error)
      return { data: null, error }
    }

    // Check for duplicate leads (same email for same company)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, contact_email')
      .eq('company_id', lead.company_id)
      .eq('contact_email', lead.contact_email.toLowerCase().trim())
      .single()

    if (existingLead) {
      logLeadOperation('create', lead, true, 'Lead already exists')
      const { data: fullLead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', existingLead.id)
        .single()
      return { data: fullLead, error: null }
    }

    // Create new lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        company_id: lead.company_id,
        contact_name: lead.contact_name?.trim() || null,
        contact_email: lead.contact_email.toLowerCase().trim(),
        source_url: lead.source_url?.trim() || null,
        status: lead.status || 'new',
        note: lead.note?.trim() || null,
        timestamp: lead.timestamp || new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logLeadOperation('create', lead, false, error.message)
      return { data: null, error: `Failed to create lead: ${error.message}` }
    }

    logLeadOperation('create', { id: data.id, company_id: data.company_id, email: data.contact_email }, true)
    return { data, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logLeadOperation('create', lead, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Get leads by company ID
 * @param companyId - Company ID to filter by
 * @param limit - Maximum number of leads to return
 * @param offset - Number of leads to skip
 * @returns Array of leads or error
 */
export async function getLeadsByCompany(companyId: string, limit = 50, offset = 0): Promise<{
  data: Lead[] | null
  error: string | null
  count?: number
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!companyId?.trim()) {
      const error = 'Company ID is required'
      logLeadOperation('get_by_company', { companyId }, false, error)
      return { data: null, error }
    }

    if (limit < 1 || limit > 100) {
      const error = 'Limit must be between 1 and 100'
      logLeadOperation('get_by_company', { companyId, limit, offset }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logLeadOperation('get_by_company', { companyId, limit, offset }, false, error.message)
      return { data: null, error: `Failed to fetch leads: ${error.message}` }
    }

    logLeadOperation('get_by_company', { companyId, count: data?.length || 0 }, true)
    return { data, error: null, count: count || 0 }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logLeadOperation('get_by_company', { companyId, limit, offset }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Get all leads with company information
 * @param limit - Maximum number of leads to return
 * @param offset - Number of leads to skip
 * @returns Array of leads with company data or error
 */
export async function getAllLeadsWithCompany(limit = 50, offset = 0): Promise<{
  data: (Lead & { company: { domain: string; name: string | null } })[] | null
  error: string | null
  count?: number
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (limit < 1 || limit > 100) {
      const error = 'Limit must be between 1 and 100'
      logLeadOperation('get_all_with_company', { limit, offset }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error, count } = await supabase
      .from('leads')
      .select(`
        *,
        company:companies(domain, name)
      `, { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logLeadOperation('get_all_with_company', { limit, offset }, false, error.message)
      return { data: null, error: `Failed to fetch leads with company data: ${error.message}` }
    }

    logLeadOperation('get_all_with_company', { count: data?.length || 0 }, true)
    return { data, error: null, count: count || 0 }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logLeadOperation('get_all_with_company', { limit, offset }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Update lead status
 * @param id - Lead ID to update
 * @param status - New status
 * @returns Updated lead or error
 */
export async function updateLeadStatus(id: string, status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected'): Promise<{
  data: Lead | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!id?.trim()) {
      const error = 'Lead ID is required'
      logLeadOperation('update_status', { id, status }, false, error)
      return { data: null, error }
    }

    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'rejected']
    if (!validStatuses.includes(status)) {
      const error = `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      logLeadOperation('update_status', { id, status }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logLeadOperation('update_status', { id, status }, false, error.message)
      return { data: null, error: `Failed to update lead status: ${error.message}` }
    }

    logLeadOperation('update_status', { id, status }, true)
    return { data, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logLeadOperation('update_status', { id, status }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Update lead information
 * @param id - Lead ID to update
 * @param updates - Fields to update
 * @returns Updated lead or error
 */
export async function updateLead(id: string, updates: LeadUpdate): Promise<{
  data: Lead | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!id?.trim()) {
      const error = 'Lead ID is required'
      logLeadOperation('update', { id, updates }, false, error)
      return { data: null, error }
    }

    // Validate updates object has at least one field
    const validFields = ['contact_name', 'contact_email', 'source_url', 'status', 'note']
    const hasValidUpdate = validFields.some(field => updates[field as keyof LeadUpdate] !== undefined)
    
    if (!hasValidUpdate) {
      const error = 'At least one valid field must be provided for update'
      logLeadOperation('update', { id, updates }, false, error)
      return { data: null, error }
    }

    // Validate email if provided
    if (updates.contact_email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (updates.contact_email && !emailRegex.test(updates.contact_email.trim())) {
        const error = 'Invalid email format'
        logLeadOperation('update', { id, updates }, false, error)
        return { data: null, error }
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Prepare update data
    const updateData: Partial<LeadUpdate> = {}
    if (updates.contact_name !== undefined) updateData.contact_name = updates.contact_name?.trim() || null
    if (updates.contact_email !== undefined) updateData.contact_email = updates.contact_email?.toLowerCase().trim()
    if (updates.source_url !== undefined) updateData.source_url = updates.source_url?.trim() || null
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.note !== undefined) updateData.note = updates.note?.trim() || null

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logLeadOperation('update', { id, updates }, false, error.message)
      return { data: null, error: `Failed to update lead: ${error.message}` }
    }

    logLeadOperation('update', { id, updated_fields: Object.keys(updateData) }, true)
    return { data, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logLeadOperation('update', { id, updates }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Delete a lead
 * @param id - Lead ID to delete
 * @returns Success status or error
 */
export async function deleteLead(id: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!id?.trim()) {
      const error = 'Lead ID is required'
      logLeadOperation('delete', { id }, false, error)
      return { success: false, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      logLeadOperation('delete', { id }, false, error.message)
      return { success: false, error: `Failed to delete lead: ${error.message}` }
    }

    logLeadOperation('delete', { id }, true)
    return { success: true, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logLeadOperation('delete', { id }, false, error)
    return { success: false, error: `Unexpected error: ${error}` }
  }
} 