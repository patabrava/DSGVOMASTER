import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabaseClient'
import { scrapeCompetitorMentions } from '../../../services/scraper/index'

// Observable Implementation: Structured logging for API operations
const logApiOperation = (operation: string, data: Record<string, unknown>, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `api_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

export async function POST(request: NextRequest) {
  try {
    logApiOperation('scrape_request', { method: 'POST' }, true)

    // Parse request body
    const { jobId, competitor } = await request.json()

    // Explicit Error Handling: Validate inputs
    if (!jobId || typeof jobId !== 'string') {
      logApiOperation('validation_failed', { error: 'Invalid jobId' }, false)
      return NextResponse.json(
        { error: 'Invalid or missing jobId' },
        { status: 400 }
      )
    }

    if (!competitor || typeof competitor !== 'string' || competitor.trim().length < 2) {
      logApiOperation('validation_failed', { error: 'Invalid competitor' }, false)
      return NextResponse.json(
        { error: 'Invalid or missing competitor name (minimum 2 characters)' },
        { status: 400 }
      )
    }

    // Dependency Transparency: Clear Supabase client usage
    const supabase = createServerSupabaseClient()

    // Verify the scrape job exists and is in correct state
    const { data: scrapeJob, error: jobError } = await supabase
      .from('scrape_jobs')
      .select('id, competitor, state')
      .eq('id', jobId)
      .single()

    if (jobError || !scrapeJob) {
      logApiOperation('job_not_found', { jobId }, false, jobError?.message)
      return NextResponse.json(
        { error: 'Scrape job not found' },
        { status: 404 }
      )
    }

    // Check if job is in correct state for processing
    if (scrapeJob.state !== 'queued') {
      logApiOperation('invalid_job_state', { jobId, state: scrapeJob.state }, false)
      return NextResponse.json(
        { error: `Job is in '${scrapeJob.state}' state, cannot process` },
        { status: 409 }
      )
    }

    // Verify competitor matches
    if (scrapeJob.competitor.trim() !== competitor.trim()) {
      logApiOperation('competitor_mismatch', { jobId, expected: scrapeJob.competitor, provided: competitor }, false)
      return NextResponse.json(
        { error: 'Competitor name does not match job' },
        { status: 400 }
      )
    }

    logApiOperation('job_validated', { jobId, competitor }, true)

    // Update job status to 'running'
    await supabase
      .from('scrape_jobs')
      .update({ state: 'running' })
      .eq('id', jobId)

    logApiOperation('scraping_start', { jobId, competitor }, true)

    // Use new privacy page scraper with extensive domain coverage for comprehensive lead discovery
    const scrapingResult = await scrapeCompetitorMentions(competitor.trim(), 500)

    if (scrapingResult.errors.length > 0) {
      logApiOperation('scraping_errors', { jobId, errors: scrapingResult.errors.slice(0, 5) }, false)
    }

    // Log detailed scraping results
    logApiOperation('scraping_detailed_results', {
      jobId,
      domainsChecked: scrapingResult.domainsChecked,
      privacyPagesFound: scrapingResult.privacyPagesFound,
      competitorMentionsFound: scrapingResult.competitorMentionsFound,
      totalLeadsFound: scrapingResult.totalLeadsFound,
      companiesFound: scrapingResult.companies.length
    }, true)

    // Save companies and leads to database
    let savedCompanies = 0
    let savedLeads = 0

    // Process companies first
    for (const company of scrapingResult.companies) {
      try {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('domain', company.domain)
          .single()

        if (!existingCompany) {
          await supabase
            .from('companies')
            .insert({
              domain: company.domain,
              name: company.name
            })
          savedCompanies++
        }
      } catch (error) {
        logApiOperation('company_save_failed', { domain: company.domain }, false, error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Process leads with enhanced data
    for (const lead of scrapingResult.leads) {
      try {
        // Get company ID for this lead
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('domain', lead.domain)
          .single()

        if (company) {
          // Check if lead already exists
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('company_id', company.id)
            .eq('contact_email', lead.email)
            .single()

          if (!existingLead) {
            // Insert lead with enhanced privacy page data
            await supabase
              .from('leads')
              .insert({
                company_id: company.id,
                contact_name: lead.name || null,
                contact_email: lead.email,
                source_url: lead.sourceUrl,
                status: 'new',
                // Add metadata about the scraping method and confidence
                notes: lead.context ? `Found via privacy page. Context: ${lead.context.substring(0, 200)}...` : 'Found via privacy page analysis',
                // Store confidence if your schema supports it
              })
            savedLeads++
          }
        }
      } catch (error) {
        logApiOperation('lead_save_failed', { email: lead.email }, false, error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Update job status to 'done' with enhanced completion data
    await supabase
      .from('scrape_jobs')
      .update({ 
        state: 'done',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    logApiOperation('scrape_complete', { 
      jobId, 
      competitor,
      method: 'privacy_page_analysis',
      domainsChecked: scrapingResult.domainsChecked,
      privacyPagesFound: scrapingResult.privacyPagesFound,
      competitorMentionsFound: scrapingResult.competitorMentionsFound,
      leadsFound: savedLeads,
      companiesFound: savedCompanies,
      totalErrors: scrapingResult.errors.length
    }, true)

    return NextResponse.json({
      success: true,
      message: 'Privacy page scraping completed successfully',
      jobId,
      competitor,
      method: 'privacy_page_analysis',
      results: {
        domainsChecked: scrapingResult.domainsChecked,
        privacyPagesFound: scrapingResult.privacyPagesFound,
        competitorMentionsFound: scrapingResult.competitorMentionsFound,
        totalLeadsFound: scrapingResult.totalLeadsFound,
        savedCompanies,
        savedLeads,
        errors: scrapingResult.errors.slice(0, 10), // Limit error details in response
        processingTime: Date.now() - Date.parse(new Date().toISOString())
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logApiOperation('api_error', { errorType: 'unexpected' }, false, errorMessage)

    // Try to update job status to 'error' if we can extract jobId
    try {
      const body = await request.clone().json()
      const { jobId } = body
      
      if (jobId) {
        const supabase = createServerSupabaseClient()
        await supabase
          .from('scrape_jobs')
          .update({ 
            state: 'error',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)
        
        logApiOperation('job_marked_error', { jobId }, true)
      }
    } catch {
      // Ignore update errors - job will remain in running state which can be cleaned up later
      logApiOperation('job_error_update_failed', {}, false, 'Could not update job status to error')
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: errorMessage,
        method: 'privacy_page_analysis'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Only allow POST and OPTIONS
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger privacy page scraping.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger privacy page scraping.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger privacy page scraping.' },
    { status: 405 }
  )
} 