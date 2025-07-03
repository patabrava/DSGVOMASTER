// Web Scraper Service - Search for competitor mentions and extract leads
// Following MONOCODE Observable Implementation principles

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

// Observable Implementation: Structured logging for scraper operations
const logScraperOperation = (operation: string, data: any, success: boolean, error?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: `scraper_${operation}`,
    data: data,
    success,
    error: error || null
  }))
}

/**
 * Search DuckDuckGo for pages mentioning competitor
 * Using DuckDuckGo because it doesn't require API keys
 */
async function searchCompetitorMentions(competitor: string, maxResults = 20): Promise<SearchResult[]> {
  try {
    logScraperOperation('search_start', { competitor, maxResults }, true)
    
    // DuckDuckGo search query - looking for competitor mentions
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
    const results = parseDuckDuckGoResults(html, maxResults)
    
    logScraperOperation('search_complete', { competitor, resultsFound: results.length }, true)
    return results
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown search error'
    logScraperOperation('search_failed', { competitor, maxResults }, false, errorMsg)
    return []
  }
}

/**
 * Parse DuckDuckGo HTML results
 */
function parseDuckDuckGoResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = []
  
  try {
    // Simple regex parsing of DuckDuckGo results
    // Looking for result links and titles
    const linkRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    const snippetRegex = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([^<]+)<\/a>/g
    
    let linkMatch
    let count = 0
    
    while ((linkMatch = linkRegex.exec(html)) !== null && count < maxResults) {
      const url = linkMatch[1]
      const title = linkMatch[2]
      
      // Skip DuckDuckGo internal URLs and common non-lead sites
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
    
    logScraperOperation('parse_results', { totalParsed: results.length }, true)
    return results
    
  } catch (error) {
    logScraperOperation('parse_results', { html: html.length }, false, 'Failed to parse search results')
    return []
  }
}

/**
 * Extract emails and contact info from a webpage
 */
async function extractLeadsFromPage(url: string, competitor: string): Promise<ExtractedLead[]> {
  try {
    logScraperOperation('extract_start', { url, competitor }, true)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Verify the competitor is actually mentioned on this page
    const competitorMentioned = html.toLowerCase().includes(competitor.toLowerCase())
    if (!competitorMentioned) {
      logScraperOperation('extract_skip', { url, reason: 'competitor_not_mentioned' }, true)
      return []
    }
    
    const leads = extractEmailsFromHTML(html, url)
    
    logScraperOperation('extract_complete', { url, leadsFound: leads.length }, true)
    return leads
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown extraction error'
    logScraperOperation('extract_failed', { url }, false, errorMsg)
    return []
  }
}

/**
 * Extract emails from HTML content
 */
function extractEmailsFromHTML(html: string, sourceUrl: string): ExtractedLead[] {
  const leads: ExtractedLead[] = []
  const emailSet = new Set<string>()
  const domain = new URL(sourceUrl).hostname
  
  try {
    // Email regex pattern - matches most common email formats
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    
    // Find emails in HTML
    let match
    while ((match = emailRegex.exec(html)) !== null) {
      const email = match[0].toLowerCase()
      
      // Skip common junk emails
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
      
      // Try to extract name near the email
      const name = extractNameNearEmail(html, email)
      
      leads.push({
        email,
        name: name || undefined,
        sourceUrl,
        domain
      })
    }
    
    // Also check for mailto links
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
    
    logScraperOperation('extract_emails', { sourceUrl: domain, emailsFound: leads.length }, true)
    return leads
    
  } catch (error) {
    logScraperOperation('extract_emails', { sourceUrl: domain }, false, 'Failed to extract emails')
    return []
  }
}

/**
 * Try to extract a name that appears near an email address in HTML
 */
function extractNameNearEmail(html: string, email: string): string | null {
  try {
    // Remove HTML tags around the email for context search
    const cleanText = html.replace(/<[^>]*>/g, ' ')
    const emailIndex = cleanText.toLowerCase().indexOf(email.toLowerCase())
    
    if (emailIndex === -1) return null
    
    // Look for names in the 200 characters before the email
    const contextBefore = cleanText.substring(Math.max(0, emailIndex - 200), emailIndex)
    
    // Simple name patterns (firstname lastname)
    const namePatterns = [
      /([A-Z][a-z]+ [A-Z][a-z]+)(?:\s|,|:|\.|$)/,
      /([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s|,|:|\.|$)/
    ]
    
    for (const pattern of namePatterns) {
      const match = contextBefore.match(pattern)
      if (match) {
        const name = match[1].trim()
        // Avoid common false positives
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

/**
 * Extract company name from domain and page content
 */
function extractCompanyName(html: string, domain: string): string {
  try {
    // Try to extract from title tag first
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      const title = titleMatch[1].trim()
      // Clean up common title patterns
      const cleanTitle = title
        .replace(/\s*-\s*.*$/, '') // Remove everything after first dash
        .replace(/\s*\|\s*.*$/, '') // Remove everything after first pipe
        .replace(/\s*Home\s*$/i, '')
        .replace(/\s*Welcome\s*$/i, '')
        .trim()
      
      if (cleanTitle.length > 2 && cleanTitle.length < 50) {
        return cleanTitle
      }
    }
    
    // Fallback to domain-based name
    return domain
      .replace(/^www\./, '')
      .replace(/\.[^.]+$/, '') // Remove TLD
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
  } catch (error) {
    return domain
  }
}

/**
 * Main scraping function - searches for competitor mentions and extracts leads
 */
export async function scrapeCompetitorMentions(competitor: string, maxResults = 10): Promise<ScrapingResult> {
  const startTime = Date.now()
  
  logScraperOperation('scrape_start', { competitor, maxResults }, true)
  
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
            
            // Extract company name from the page if we haven't seen this domain
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
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed to process ${searchResult.url}: ${errorMsg}`)
        logScraperOperation('process_page_failed', { url: searchResult.url }, false, errorMsg)
      }
    }
    
    result.totalLeadsFound = result.leads.length
    
    const duration = Date.now() - startTime
    logScraperOperation('scrape_complete', { 
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
    
    logScraperOperation('scrape_failed', { competitor, maxResults }, false, errorMsg)
    return result
  }
}

// Export for testing
export { 
  searchCompetitorMentions,
  extractLeadsFromPage,
  extractEmailsFromHTML,
  extractCompanyName
} 