'use server'

import { createServerSupabaseClient } from '../supabaseClient'
import { ScrapeJob, ScrapeJobInsert, ScrapeJobUpdate } from '../dbSchema'

// Observable Implementation: Structured logging for scrape job operations
const logScrapeJobOperation = (operation: string, data: any, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `scrape_job_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

/**
 * Create a new scrape job for a competitor
 * @param scrapeJob - Scrape job data to insert
 * @returns Created scrape job or error
 */
export async function createScrapeJob(scrapeJob: ScrapeJobInsert): Promise<{
  data: ScrapeJob | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!scrapeJob.competitor?.trim()) {
      const error = 'Competitor name is required'
      logScrapeJobOperation('create', scrapeJob, false, error)
      return { data: null, error }
    }

    // Dependency Transparency: Clear Supabase client usage
    const supabase = createServerSupabaseClient()
    
    // Check if there's already a recent job for this competitor (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: recentJob } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('competitor', scrapeJob.competitor.trim())
      .gte('requested_at', fiveMinutesAgo)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single()

    if (recentJob) {
      logScrapeJobOperation('create', scrapeJob, true, 'Recent job exists, returning existing')
      return { data: recentJob, error: null }
    }

    // Create new scrape job
    const { data, error } = await supabase
      .from('scrape_jobs')
      .insert({
        competitor: scrapeJob.competitor.trim(),
        state: scrapeJob.state || 'queued',
        requested_at: scrapeJob.requested_at || new Date().toISOString(),
        completed_at: null
      })
      .select()
      .single()

    if (error) {
      logScrapeJobOperation('create', scrapeJob, false, error.message)
      return { data: null, error: `Failed to create scrape job: ${error.message}` }
    }

    logScrapeJobOperation('create', { id: data.id, competitor: data.competitor, state: data.state }, true)
    return { data, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logScrapeJobOperation('create', scrapeJob, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Update scrape job status
 * @param id - Scrape job ID to update
 * @param state - New state
 * @param completedAt - Optional completion timestamp
 * @returns Updated scrape job or error
 */
export async function updateScrapeJobStatus(
  id: string, 
  state: 'queued' | 'running' | 'done' | 'error',
  completedAt?: string
): Promise<{
  data: ScrapeJob | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!id?.trim()) {
      const error = 'Scrape job ID is required'
      logScrapeJobOperation('update_status', { id, state }, false, error)
      return { data: null, error }
    }

    const validStates = ['queued', 'running', 'done', 'error']
    if (!validStates.includes(state)) {
      const error = `Invalid state. Must be one of: ${validStates.join(', ')}`
      logScrapeJobOperation('update_status', { id, state }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    // Prepare update data with state management logic
    const updateData: any = { state }
    
    // Set completion time for terminal states
    if (state === 'done' || state === 'error') {
      updateData.completed_at = completedAt || new Date().toISOString()
    }
    
    // Clear completion time if returning to non-terminal state
    if (state === 'queued' || state === 'running') {
      updateData.completed_at = null
    }

    const { data, error } = await supabase
      .from('scrape_jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logScrapeJobOperation('update_status', { id, state }, false, error.message)
      return { data: null, error: `Failed to update scrape job status: ${error.message}` }
    }

    logScrapeJobOperation('update_status', { id, state, completed: !!data.completed_at }, true)
    return { data, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logScrapeJobOperation('update_status', { id, state }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Get scrape job by ID
 * @param id - Scrape job ID
 * @returns Scrape job data or error
 */
export async function getScrapeJobById(id: string): Promise<{
  data: ScrapeJob | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!id?.trim()) {
      const error = 'Scrape job ID is required'
      logScrapeJobOperation('get_by_id', { id }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logScrapeJobOperation('get_by_id', { id }, false, error.message)
      return { data: null, error: `Failed to fetch scrape job: ${error.message}` }
    }

    const success = !!data
    logScrapeJobOperation('get_by_id', { id, found: success }, success)
    return { data: data || null, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logScrapeJobOperation('get_by_id', { id }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Get scrape job by competitor name
 * @param competitor - Competitor name
 * @returns Most recent scrape job for competitor or error
 */
export async function getScrapeJobByCompetitor(competitor: string): Promise<{
  data: ScrapeJob | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (!competitor?.trim()) {
      const error = 'Competitor name is required'
      logScrapeJobOperation('get_by_competitor', { competitor }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('competitor', competitor.trim())
      .order('requested_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logScrapeJobOperation('get_by_competitor', { competitor }, false, error.message)
      return { data: null, error: `Failed to fetch scrape job: ${error.message}` }
    }

    const success = !!data
    logScrapeJobOperation('get_by_competitor', { competitor, found: success }, success)
    return { data: data || null, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logScrapeJobOperation('get_by_competitor', { competitor }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Get all scrape jobs with optional filtering
 * @param state - Optional state filter
 * @param limit - Maximum number of jobs to return
 * @param offset - Number of jobs to skip
 * @returns Array of scrape jobs or error
 */
export async function getScrapeJobs(
  state?: 'queued' | 'running' | 'done' | 'error',
  limit = 50,
  offset = 0
): Promise<{
  data: ScrapeJob[] | null
  error: string | null
  count?: number
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (limit < 1 || limit > 100) {
      const error = 'Limit must be between 1 and 100'
      logScrapeJobOperation('get_all', { state, limit, offset }, false, error)
      return { data: null, error }
    }

    if (offset < 0) {
      const error = 'Offset must be non-negative'
      logScrapeJobOperation('get_all', { state, limit, offset }, false, error)
      return { data: null, error }
    }

    if (state) {
      const validStates = ['queued', 'running', 'done', 'error']
      if (!validStates.includes(state)) {
        const error = `Invalid state filter. Must be one of: ${validStates.join(', ')}`
        logScrapeJobOperation('get_all', { state, limit, offset }, false, error)
        return { data: null, error }
      }
    }

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('scrape_jobs')
      .select('*', { count: 'exact' })
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply state filter if provided
    if (state) {
      query = query.eq('state', state)
    }

    const { data, error, count } = await query

    if (error) {
      logScrapeJobOperation('get_all', { state, limit, offset }, false, error.message)
      return { data: null, error: `Failed to fetch scrape jobs: ${error.message}` }
    }

    logScrapeJobOperation('get_all', { state, count: data?.length || 0 }, true)
    return { data, error: null, count: count || 0 }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logScrapeJobOperation('get_all', { state, limit, offset }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Get queued scrape jobs for processing
 * @param limit - Maximum number of jobs to return
 * @returns Array of queued scrape jobs or error
 */
export async function getQueuedScrapeJobs(limit = 10): Promise<{
  data: ScrapeJob[] | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (limit < 1 || limit > 50) {
      const error = 'Limit must be between 1 and 50'
      logScrapeJobOperation('get_queued', { limit }, false, error)
      return { data: null, error }
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('state', 'queued')
      .order('requested_at', { ascending: true }) // FIFO queue
      .limit(limit)

    if (error) {
      logScrapeJobOperation('get_queued', { limit }, false, error.message)
      return { data: null, error: `Failed to fetch queued scrape jobs: ${error.message}` }
    }

    logScrapeJobOperation('get_queued', { count: data?.length || 0 }, true)
    return { data, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logScrapeJobOperation('get_queued', { limit }, false, error)
    return { data: null, error: `Unexpected error: ${error}` }
  }
}

/**
 * Delete old completed scrape jobs (cleanup utility)
 * @param olderThanDays - Delete jobs completed more than this many days ago
 * @returns Number of deleted jobs or error
 */
export async function cleanupOldScrapeJobs(olderThanDays = 30): Promise<{
  deletedCount: number | null
  error: string | null
}> {
  try {
    // Explicit Error Handling: Validate inputs
    if (olderThanDays < 1 || olderThanDays > 365) {
      const error = 'Days must be between 1 and 365'
      logScrapeJobOperation('cleanup', { olderThanDays }, false, error)
      return { deletedCount: null, error }
    }

    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString()
    
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('scrape_jobs')
      .delete()
      .in('state', ['done', 'error'])
      .lt('completed_at', cutoffDate)
      .select('id')

    if (error) {
      logScrapeJobOperation('cleanup', { olderThanDays }, false, error.message)
      return { deletedCount: null, error: `Failed to cleanup scrape jobs: ${error.message}` }
    }

    const deletedCount = data?.length || 0
    logScrapeJobOperation('cleanup', { olderThanDays, deletedCount }, true)
    return { deletedCount, error: null }

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred'
    logScrapeJobOperation('cleanup', { olderThanDays }, false, error)
    return { deletedCount: null, error: `Unexpected error: ${error}` }
  }
} 