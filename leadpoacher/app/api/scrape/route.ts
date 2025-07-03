import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabaseClient'

// Observable Implementation: Structured logging for API operations
const logApiOperation = (operation: string, data: any, success: boolean, error?: string) => {
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

    // Invoke Supabase Edge Function
    const edgeFunctionUrl = `${process.env.SUPABASE_URL}/functions/v1/scrape-leads`
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!edgeFunctionUrl || !serviceRoleKey) {
      logApiOperation('config_error', { hasUrl: !!edgeFunctionUrl, hasKey: !!serviceRoleKey }, false)
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Call the Edge Function
    logApiOperation('edge_function_call', { jobId, competitor }, true)

    const edgeResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId,
        competitor: competitor.trim()
      })
    })

    if (!edgeResponse.ok) {
      const errorText = await edgeResponse.text()
      logApiOperation('edge_function_failed', { jobId, status: edgeResponse.status, error: errorText }, false)
      
      // Update job status to error
      await supabase
        .from('scrape_jobs')
        .update({ 
          state: 'error',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      return NextResponse.json(
        { error: 'Failed to process scraping job', details: errorText },
        { status: 500 }
      )
    }

    const edgeResult = await edgeResponse.json()
    
    logApiOperation('scrape_complete', { 
      jobId, 
      competitor,
      leadsFound: edgeResult.results?.savedLeads || 0,
      companiesFound: edgeResult.results?.savedCompanies || 0
    }, true)

    return NextResponse.json({
      success: true,
      message: 'Scraping job completed successfully',
      jobId,
      competitor,
      results: edgeResult.results
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logApiOperation('api_error', {}, false, errorMessage)

    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
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
    { error: 'Method not allowed. Use POST to trigger scraping.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger scraping.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger scraping.' },
    { status: 405 }
  )
} 