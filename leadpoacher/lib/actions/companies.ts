'use server'

import { createServerSupabaseClient } from '../supabaseClient'
import { Company, CompanyInsert, CompanyUpdate } from '../dbSchema'

// Observable Implementation: Structured logging for company operations
const logCompanyOperation = (operation: string, data: any, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `company_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

/**
 * Create a new company that mentions a competitor
 * @param company - Company data to insert
 * @returns Created company or error
 */
export async function createCompany(company: CompanyInsert): Promise<{
  data: Company | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!company.domain?.trim()) {
      const error = 'Company domain is required'
      logCompanyOperation('create', company, false, error)
      return { data: null, error }
    }

    if (!company.name?.trim()) {
      const error = 'Company name is required'
      logCompanyOperation('create', company, false, error)
      return { data: null, error }
    }

    // Dependency Transparency: Clear Supabase client usage
    const supabase = createServerSupabaseClient()
    
    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('domain', company.domain.toLowerCase().trim())
      .single()

    if (existingCompany) {
      logCompanyOperation('create', company, true, 'Company already exists')
      return { data: existingCompany, error: null }
    }

    // Create new company
    const { data, error } = await supabase
      .from('companies')
      .insert({
        domain: company.domain.toLowerCase().trim(),
        name: company.name.trim(),
        created_at: company.created_at || new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logCompanyOperation('create', company, false, error.message)
      return { data: null, error: `Failed to create company: ${error.message}` }
    }

    logCompanyOperation('create', { id: data.id, domain: data.domain }, true)
    return { data, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logCompanyOperation('create', company, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Get company by domain
 * @param domain - Company domain to search for
 * @returns Company data or error
 */
export async function getCompanyByDomain(domain: string): Promise<{
  data: Company | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!domain?.trim()) {
      const error = 'Domain is required'
      logCompanyOperation('get_by_domain', { domain }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('domain', domain.toLowerCase().trim())
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logCompanyOperation('get_by_domain', { domain }, false, error.message)
      return { data: null, error: `Failed to fetch company: ${error.message}` }
    }

    const success = !!data
    logCompanyOperation('get_by_domain', { domain, found: success }, success)
    return { data: data || null, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logCompanyOperation('get_by_domain', { domain }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Get all companies with optional pagination
 * @param limit - Maximum number of companies to return
 * @param offset - Number of companies to skip
 * @returns Array of companies or error
 */
export async function getCompanies(limit = 50, offset = 0): Promise<{
  data: Company[] | null
  error: string | null
  count?: number
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (limit < 1 || limit > 100) {
      const error = 'Limit must be between 1 and 100'
      logCompanyOperation('get_all', { limit, offset }, false, error)
      return { data: null, error }
    }

    if (offset < 0) {
      const error = 'Offset must be non-negative'
      logCompanyOperation('get_all', { limit, offset }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logCompanyOperation('get_all', { limit, offset }, false, error.message)
      return { data: null, error: `Failed to fetch companies: ${error.message}` }
    }

    logCompanyOperation('get_all', { limit, offset, count: data?.length || 0 }, true)
    return { data, error: null, count: count || 0 }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logCompanyOperation('get_all', { limit, offset }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Update company information
 * @param id - Company ID to update
 * @param updates - Fields to update
 * @returns Updated company or error
 */
export async function updateCompany(id: string, updates: CompanyUpdate): Promise<{
  data: Company | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!id?.trim()) {
      const error = 'Company ID is required'
      logCompanyOperation('update', { id, updates }, false, error)
      return { data: null, error }
    }

    // Validate updates object has at least one field
    const validFields = ['domain', 'name']
    const hasValidUpdate = validFields.some(field => updates[field as keyof CompanyUpdate] !== undefined)
    
    if (!hasValidUpdate) {
      const error = 'At least one valid field must be provided for update'
      logCompanyOperation('update', { id, updates }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    // Prepare update data
    const updateData: Partial<CompanyUpdate> = {}
    if (updates.domain !== undefined) updateData.domain = updates.domain?.toLowerCase().trim()
    if (updates.name !== undefined) updateData.name = updates.name?.trim()

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logCompanyOperation('update', { id, updates }, false, error.message)
      return { data: null, error: `Failed to update company: ${error.message}` }
    }

    logCompanyOperation('update', { id, updated_fields: Object.keys(updateData) }, true)
    return { data, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logCompanyOperation('update', { id, updates }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
} 