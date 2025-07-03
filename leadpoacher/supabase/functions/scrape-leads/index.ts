import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Copy of scraper service types (needed since we can't import from local files in Edge Functions)
interface SearchResult {
  title: string
  url: string
  snippet: string
}

interface ExtractedLead {
  email: string
  name?: string
  sourceUrl: string
  domain: string
}

interface ScrapingResult {
  competitor: string
  searchResults: SearchResult[]
  leads: ExtractedLead[]
  companies: { domain: string; name: string }[]
  totalSearched: number
  totalLeadsFound: number
  errors: string[]
}

// Observable Implementation: Structured logging for edge function
const logEdgeOperation = (operation: string, data: any, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `edge_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

/**
 * Copy of core scraper functions for Edge Function
 * (In production, these would be in a shared package)
 */

async function searchCompetitorMentions(competitor: string, maxResults = 20): Promise<SearchResult[]> {
  try {
    const query = encodeURIComponent(`"${competitor}" contact email`)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`)
    }
    
    const html = await response.text()
    return parseDuckDuckGoResults(html, maxResults)
    
  } catch (error) {
    logEdgeOperation('search_failed', { competitor, maxResults }, false, error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

function parseDuckDuckGoResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = []
  
  try {
    const linkRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    let linkMatch
    let count = 0
    
    while ((linkMatch = linkRegex.exec(html)) !== null && count < maxResults) {
      const url = linkMatch[1]
      const title = linkMatch[2]
      
      if (url.includes('duckduckgo.com') || 
          url.includes('wikipedia.org') ||
          url.includes('facebook.com') ||
          url.includes('twitter.com') ||
          url.includes('linkedin.com/posts') ||
          url.includes('youtube.com')) {
        continue
      }
      
      results.push({
        title: title.trim(),
        url: url.startsWith('http') ? url : `https://${url}`,
        snippet: ''
      })
      
      count++
    }
    
    return results
    
  } catch (error) {
    return []
  }
}

async function extractLeadsFromPage(url: string, competitor: string): Promise<ExtractedLead[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Verify the competitor is actually mentioned on this page
    const competitorMentioned = html.toLowerCase().includes(competitor.toLowerCase())
    if (!competitorMentioned) {
      return []
    }
    
    return extractEmailsFromHTML(html, url)
    
  } catch (error) {
    return []
  }
}

function extractEmailsFromHTML(html: string, sourceUrl: string): ExtractedLead[] {
  const leads: ExtractedLead[] = []
  const emailSet = new Set<string>()
  const domain = new URL(sourceUrl).hostname
  
  try {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    
    let match
    while ((match = emailRegex.exec(html)) !== null) {
      const email = match[0].toLowerCase()
      
      if (email.includes('noreply') || 
          email.includes('no-reply') ||
          email.includes('example.com') ||
          email.includes('test@') ||
          email.includes('admin@') ||
          email.includes('webmaster@') ||
          email.includes('support@') ||
          emailSet.has(email)) {
        continue
      }
      
      emailSet.add(email)
      const name = extractNameNearEmail(html, email)
      
      leads.push({
        email,
        name: name || undefined,
        sourceUrl,
        domain
      })
    }
    
    // Check mailto links
    const mailtoRegex = /mailto:([^"'>\s?&]+)/gi
    while ((match = mailtoRegex.exec(html)) !== null) {
      const email = match[1].toLowerCase()
      
      if (!emailSet.has(email) && 
          !email.includes('noreply') && 
          !email.includes('example.com')) {
        
        emailSet.add(email)
        const name = extractNameNearEmail(html, email)
        
        leads.push({
          email,
          name: name || undefined,
          sourceUrl,
          domain
        })
      }
    }
    
    return leads
    
  } catch (error) {
    return []
  }
}

function extractNameNearEmail(html: string, email: string): string | null {
  try {
    const cleanText = html.replace(/<[^>]*>/g, ' ')
    const emailIndex = cleanText.toLowerCase().indexOf(email.toLowerCase())
    
    if (emailIndex === -1) return null
    
    const contextBefore = cleanText.substring(Math.max(0, emailIndex - 200), emailIndex)
    
    const namePatterns = [
      /([A-Z][a-z]+ [A-Z][a-z]+)(?:\s|,|:|\.|$)/,
      /([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s|,|:|\.|$)/
    ]
    
    for (const pattern of namePatterns) {
      const match = contextBefore.match(pattern)
      if (match) {
        const name = match[1].trim()
        if (!name.includes('Email') && 
            !name.includes('Contact') && 
            !name.includes('Info') &&
            name.length > 3) {
          return name
        }
      }
    }
    
    return null
    
  } catch (error) {
    return null
  }
}

function extractCompanyName(html: string, domain: string): string {
  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      const title = titleMatch[1].trim()
      const cleanTitle = title
        .replace(/\s*-\s*.*$/, '')
        .replace(/\s*\|\s*.*$/, '')
        .replace(/\s*Home\s*$/i, '')
        .replace(/\s*Welcome\s*$/i, '')
        .trim()
      
      if (cleanTitle.length > 2 && cleanTitle.length < 50) {
        return cleanTitle
      }
    }
    
    return domain
      .replace(/^www\./, '')
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
  } catch (error) {
    return domain
  }
}

async function scrapeCompetitorMentions(competitor: string, maxResults = 10): Promise<ScrapingResult> {
  const startTime = Date.now()
  
  const result: ScrapingResult = {
    competitor,
    searchResults: [],
    leads: [],
    companies: [],
    totalSearched: 0,
    totalLeadsFound: 0,
    errors: []
  }
  
  try {
    // Step 1: Search for competitor mentions
    const searchResults = await searchCompetitorMentions(competitor, maxResults)
    result.searchResults = searchResults
    result.totalSearched = searchResults.length
    
    if (searchResults.length === 0) {
      result.errors.push('No search results found for competitor')
      return result
    }
    
    // Step 2: Extract leads from each result page
    const companyDomains = new Set<string>()
    
    for (const searchResult of searchResults) {
      try {
        const pageLeads = await extractLeadsFromPage(searchResult.url, competitor)
        result.leads.push(...pageLeads)
        
        // Track unique companies
        for (const lead of pageLeads) {
          if (!companyDomains.has(lead.domain)) {
            companyDomains.add(lead.domain)
            
            const response = await fetch(searchResult.url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadPoacher/1.0)' },
              signal: AbortSignal.timeout(5000)
            })
            
            if (response.ok) {
              const html = await response.text()
              const companyName = extractCompanyName(html, lead.domain)
              
              result.companies.push({
                domain: lead.domain,
                name: companyName
              })
            }
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed to process ${searchResult.url}: ${errorMsg}`)
      }
    }
    
    result.totalLeadsFound = result.leads.length
    
    const duration = Date.now() - startTime
    logEdgeOperation('scrape_complete', { 
      competitor, 
      duration, 
      leadsFound: result.totalLeadsFound,
      companiesFound: result.companies.length,
      errors: result.errors.length
    }, true)
    
    return result
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown scraping error'
    result.errors.push(errorMsg)
    return result
  }
}

/**
 * Main Edge Function handler
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logEdgeOperation('function_start', { method: req.method, url: req.url }, true)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { jobId, competitor } = await req.json()

    if (!jobId || !competitor) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: jobId, competitor' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update job status to 'running'
    await supabase
      .from('scrape_jobs')
      .update({ state: 'running' })
      .eq('id', jobId)

    logEdgeOperation('job_start', { jobId, competitor }, true)

    // Perform the scraping
    const scrapingResult = await scrapeCompetitorMentions(competitor.trim(), 15)

    if (scrapingResult.errors.length > 0) {
      logEdgeOperation('scraping_errors', { jobId, errors: scrapingResult.errors }, false)
    }

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
        logEdgeOperation('company_save_failed', { domain: company.domain }, false, error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Process leads
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
            await supabase
              .from('leads')
              .insert({
                company_id: company.id,
                contact_name: lead.name || null,
                contact_email: lead.email,
                source_url: lead.sourceUrl,
                status: 'new'
              })
            savedLeads++
          }
        }
      } catch (error) {
        logEdgeOperation('lead_save_failed', { email: lead.email }, false, error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Update job status to 'done'
    await supabase
      .from('scrape_jobs')
      .update({ 
        state: 'done',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    const response = {
      success: true,
      jobId,
      competitor,
      results: {
        totalSearched: scrapingResult.totalSearched,
        totalLeadsFound: scrapingResult.totalLeadsFound,
        savedCompanies,
        savedLeads,
        errors: scrapingResult.errors
      }
    }

    logEdgeOperation('function_complete', response, true)

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    logEdgeOperation('function_error', {}, false, error instanceof Error ? error.message : 'Unknown error')

    // Try to update job status to 'error' if we have the jobId
    try {
      const body = await req.text()
      const { jobId } = JSON.parse(body)
      
      if (jobId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        await supabase
          .from('scrape_jobs')
          .update({ 
            state: 'error',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)
      }
    } catch (updateError) {
      // Ignore update errors
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 