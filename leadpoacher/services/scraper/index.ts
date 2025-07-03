// Web Scraper Service - Privacy Page Focused Lead Discovery
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
  context?: string // Context around the competitor mention
  confidence: number // Confidence score for the match
}

interface PrivacyPageData {
  url: string
  domain: string
  hasCompetitorMention: boolean
  competitorContext?: string
  leads: ExtractedLead[]
  processingErrors: string[]
}

interface ScrapingResult {
  competitor: string
  domainsChecked: number
  privacyPagesFound: number
  competitorMentionsFound: number
  leads: ExtractedLead[]
  companies: { domain: string; name: string }[]
  totalLeadsFound: number
  errors: string[]
  processingDetails: PrivacyPageData[]
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
 * Domain Discovery Service - Get list of domains to check
 * Phase 1: Use curated list of business domains
 */
class DomainDiscoveryService {
  private static businessDomains = [
    // Major German Companies - DAX 40 and major corporations
    'sap.com', 'siemens.com', 'bmw.com', 'volkswagen.com', 'adidas.com',
    'deutsche-bank.de', 'mercedes-benz.com', 'basf.com', 'bayer.com', 'infineon.com',
    'allianz.de', 'volkswagen.de', 'porsche.com', 'continental.com', 'lufthansa.com',
    'henkel.com', 'fresenius.com', 'rwe.com', 'eon.com', 'beiersdorf.com',
    'munich-re.com', 'delivery-hero.com', 'zalando.de', 'hellofresh.de', 'sartorius.com',
    'deutsche-post.de', 'dhl.com', 'puma.com', 'freenet.de', 'covestro.com',
    
    // Technology & Software Companies
    'teamviewer.com', 'software-ag.com', 'nemetschek.com', 'united-internet.de',
    '1und1.de', 'ionos.de', 'web.de', 'gmx.de', 'check24.de', 'idealo.de',
    'rocket-internet.com', 'trivago.com', 'xing.com', 'stepstone.de',
    'jimdo.com', 'strato.de', 'aboutyou.com', 'home24.de', 'mymuesli.com',
    
    // E-commerce & Retail
    'otto.de', 'mediamarkt.de', 'saturn.de', 'hornbach.de', 'bauhaus.de',
    'obi.de', 'ikea.com', 'lidl.de', 'aldi.de', 'edeka.de', 'rewe.de',
    'dm.de', 'rossmann.de', 'deichmann.com', 'christ.de', 'douglas.de',
    'notebooksbilliger.de', 'alternate.de', 'cyberport.de', 'conrad.de',
    'amazon.de', 'ebay.de', 'real.de', 'kaufland.de', 'netto.de',
    
    // Financial Services
    'commerzbank.de', 'ing.de', 'dkb.de', 'santander.de', 'postbank.de',
    'sparkasse.de', 'volksbank.de', 'targobank.de', 'norisbank.de',
    'consorsbank.de', 'comdirect.de', 'onvista.de', 'flatex.de',
    'axa.de', 'generali.de', 'zurich.de', 'ergo.de', 'huk.de',
    'signal-iduna.de', 'debeka.de', 'wuerttembergische.de', 'provinzial.de',
    
    // Telecommunications & Media
    'telekom.de', 'vodafone.de', 'telefonica.de', 'o2.de', 'freenet.de',
    'drillisch.de', 'mobilcom-debitel.de', 'congstar.de', 'klarmobil.de',
    'ard.de', 'zdf.de', 'rtl.de', 'prosieben.de', 'sat1.de', 'vox.de',
    'n-tv.de', 'welt.de', 'spiegel.de', 'zeit.de', 'faz.net', 'sueddeutsche.de',
    'bild.de', 'focus.de', 'stern.de', 'chip.de', 'computerbild.de',
    
    // Automotive & Transportation
    'mercedes-benz.com', 'audi.com', 'opel.com', 'ford.de', 'hyundai.de',
    'toyota.de', 'nissan.de', 'renault.de', 'peugeot.de', 'citroen.de',
    'skoda.de', 'seat.de', 'mini.de', 'smart.com', 'maybach.com',
    'db.de', 'bahn.de', 'flixbus.de', 'europcar.de', 'sixt.de',
    'hertz.de', 'avis.de', 'enterprise.de', 'adac.de', 'dekra.de',
    
    // Healthcare & Pharmaceuticals
    'boehringer-ingelheim.com', 'merck.de', 'stada.de', 'teva.de',
    'ratiopharm.de', 'hexal.de', 'sandoz.de', 'pfizer.de', 'novartis.de',
    'sanofi.de', 'gsk.de', 'astrazeneca.de', 'abbott.de', 'roche.de',
    'helios-gesundheit.de', 'asklepios.com', 'sana.de', 'rhoen-klinikum.de',
    'fresenius-helios.de', 'charite.de', 'uniklinik-koeln.de', 'mh-hannover.de',
    
    // Energy & Utilities
    'eon.com', 'rwe.com', 'vattenfall.de', 'engie.de', 'innogy.com',
    'stadtwerke-muenchen.de', 'swb.de', 'enbw.com', 'ewe.de', 'gasag.de',
    'shell.de', 'bp.com', 'total.de', 'aral.de', 'jet.de', 'star.de',
    'wintershall.com', 'bayerngas.de', 'gasunie.de', 'vng.de',
    
    // Real Estate & Construction
    'vonovia.de', 'deutsche-wohnen.de', 'leg.de', 'tag.de', 'adler.de',
    'ado.de', 'grand-city.de', 'deutsche-euroshop.de', 'hamborner.de',
    'hochtief.de', 'strabag.com', 'bilfinger.com', 'max-boegl.de',
    'zech.de', 'goldbeck.de', 'wolff-muellerr.de', 'bauer.de',
    
    // Food & Beverages
    'unilever.de', 'nestle.de', 'kraft-heinz.de', 'mondelez.de',
    'ferrero.de', 'haribo.de', 'ritter-sport.de', 'milka.de',
    'coca-cola.de', 'pepsi.de', 'redbull.com', 'bitburger.de',
    'beck.de', 'krombacher.de', 'warsteiner.de', 'heineken.de',
    'loacker.com', 'bahlsen.de', 'griesson.de', 'lambertz.de',
    
    // Consulting & Services
    'mckinsey.com', 'bcg.com', 'bain.com', 'rolandberger.com',
    'kpmg.de', 'pwc.de', 'deloitte.com', 'ey.com', 'mazars.de',
    'bdo.de', 'rödl.de', 'ebner-stolz.de', 'warth-klein.com',
    'accenture.com', 'capgemini.com', 'atos.com', 'tcs.com', 'wipro.com',
    'infosys.com', 'cognizant.com', 'ibm.com', 'microsoft.com',
    
    // Job Portals & HR
    'indeed.de', 'monster.de', 'jobware.de', 'stellenanzeigen.de',
    'jobs.de', 'meinestadt.de', 'arbeitsagentur.de', 'karriere.de',
    'jobscout24.de', 'academics.de', 'get-in-it.de', 'absolventa.de',
    'praktikum.de', 'trainee.de', 'berufsstart.de', 'jobvector.de',
    'staufenbiel.de', 'e-fellows.net', 'squeaker.net', 'consulting.de',
    
    // Airlines & Travel
    'lufthansa.com', 'eurowings.com', 'condor.de', 'tuifly.com',
    'ryanair.com', 'easyjet.com', 'booking.com', 'expedia.de',
    'check24.de', 'idealo.de', 'holidaycheck.de', 'tripadvisor.de',
    'tui.com', 'dertour.de', 'schauinsland-reisen.de', 'alltours.de',
    'fti.de', 'thomas-cook.de', 'ltur.de', 'lastminute.de',
    
    // Gaming & Entertainment
    'ubisoft.com', 'ea.com', 'activision.com', 'nintendo.de',
    'sony.de', 'microsoft.com', 'steam.com', 'blizzard.com',
    'crytek.com', 'yager.de', 'daedalic.de', 'kalypso.de',
    'netflix.com', 'amazon.com', 'disney.de', 'sky.de',
    'maxdome.de', 'joyn.de', 'tvnow.de', 'zattoo.com',
    
    // Education & Research
    'daad.de', 'hu-berlin.de', 'fu-berlin.de', 'tu-berlin.de',
    'lmu.de', 'tum.de', 'uni-heidelberg.de', 'kit.edu',
    'rwth-aachen.de', 'tu-dresden.de', 'uni-hamburg.de', 'uni-koeln.de',
    'uni-muenchen.de', 'uni-bonn.de', 'uni-frankfurt.de', 'uni-stuttgart.de',
    'max-planck.de', 'fraunhofer.de', 'helmholtz.de', 'leibniz-gemeinschaft.de',
    
    // Government & Public Sector
    'bundesregierung.de', 'bundestag.de', 'bundesrat.de', 'bfarm.de',
    'bka.de', 'bnd.de', 'verfassungsschutz.de', 'bundeswehr.de',
    'zoll.de', 'bundesbank.de', 'destatis.de', 'umweltbundesamt.de',
    'rki.de', 'pei.de', 'bsi.bund.de', 'bnetza.de', 'bagkoeln.de',
    
    // Logistics & Transportation
    'dhl.com', 'ups.com', 'fedex.com', 'dpd.com', 'gls.de',
    'hermes.de', 'dachser.de', 'schenker.de', 'kuehne-nagel.com',
    'hapag-lloyd.com', 'fraport.de', 'munich-airport.de', 'hamburg-airport.de',
    'dus.com', 'cologne-airport.de', 'hannover-airport.de', 'stuttgart-airport.com',
    
    // Fashion & Lifestyle
    'hugo-boss.com', 'esprit.de', 'tom-tailor.de', 'gerry-weber.de',
    'marc-opolo.com', 'bogner.com', 'escada.com', 'joop.com',
    'diesel.com', 'levis.com', 'tommy-hilfiger.de', 'calvin-klein.de',
    'h-m.com', 'zara.com', 'c-a.com', 'kik.de', 'takko.de',
    'bonprix.de', 'neckermann.de', 'quelle.de', 'baur.de',
    
    // Sports & Fitness
    'mcfit.com', 'fitnessfirst.de', 'clever-fit.com', 'johnreed.fitness',
    'meridian-spa.com', 'fitness-company.de', 'bodystreet.com',
    'sky-fitness.de', 'activefitness.de', 'vitalis.de', 'training-online.de',
    'runtastic.com', 'komoot.de', 'strava.com', 'nike.com',
    'adidas.com', 'puma.com', 'under-armour.de', 'asics.de',
    
    // Manufacturing & Industrial
    'thyssenkrupp.com', 'man.eu', 'liebherr.com', 'trumpf.com',
    'kuka.com', 'festo.com', 'bosch.com', 'schaeffler.com',
    'zf.com', 'knorr-bremse.com', 'wuerth.com', 'phoenix-contact.com',
    'wago.com', 'pilz.com', 'sick.com', 'ifm.com', 'turck.com',
    'pepperl-fuchs.com', 'balluff.com', 'baumer.com', 'leuze.com',
    
    // Chemicals & Materials
    'basf.com', 'bayer.com', 'henkel.com', 'evonik.com',
    'lanxess.com', 'wacker.com', 'altana.com', 'symrise.com',
    'brenntag.com', 'k-s.com', 'suedzucker.de', 'pfeifer-langen.de',
    'nordzucker.de', 'clariant.com', 'huntsman.com', 'dow.com',
    
    // Startups & Scale-ups (German)
    'n26.com', 'rocket-internet.com', 'trivago.com', 'delivery-hero.com',
    'hellofresh.de', 'zalando.de', 'aboutyou.com', 'home24.de',
    'wayfair.de', 'westwing.de', 'made.com', 'fab.com', 'dawanda.com',
    'rocket-internet.com', 'global-founders-capital.com', 'project-a.com',
    'earlybird.com', 'target-global.com', 'creathor.de', 'cherry.de',
    
    // International Tech Giants
    'google.com', 'apple.com', 'facebook.com', 'meta.com', 'amazon.com',
    'netflix.com', 'spotify.com', 'uber.com', 'airbnb.com', 'pinterest.com',
    'twitter.com', 'linkedin.com', 'snapchat.com', 'tiktok.com', 'zoom.com',
    'slack.com', 'dropbox.com', 'salesforce.com', 'oracle.com', 'adobe.com',
    'vmware.com', 'citrix.com', 'servicenow.com', 'workday.com', 'tableau.com',
    
    // European Companies
    'asml.com', 'unilever.com', 'philips.com', 'ing.com', 'shell.com',
    'nestle.com', 'novartis.com', 'roche.com', 'abb.com', 'nokia.com',
    'ericsson.com', 'volvo.com', 'ikea.com', 'h-m.com', 'spotify.com',
    'klarna.com', 'adyen.com', 'takeaway.com', 'allegro.eu', 'meituan.com',
    
    // Asian Companies
    'toyota.com', 'sony.com', 'nintendo.com', 'softbank.com', 'samsung.com',
    'lg.com', 'hyundai.com', 'alibaba.com', 'tencent.com', 'baidu.com',
    'jd.com', 'xiaomi.com', 'bytedance.com', 'didi.com', 'grab.com',
    'sea.com', 'rakuten.com', 'naver.com', 'kakao.com', 'line.me'
  ]

  static async getDomainsToCheck(maxDomains: number = 500): Promise<string[]> {
    try {
      logScraperOperation('domain_discovery_start', { maxDomains }, true)
      
      // Phase 1: Return curated list (now expanded to 400+ domains)
      // TODO Phase 2: Integrate with domain APIs or web crawling
      const domains = this.businessDomains.slice(0, maxDomains)
      
      logScraperOperation('domain_discovery_complete', { domainsFound: domains.length }, true)
      return domains
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Domain discovery failed'
      logScraperOperation('domain_discovery_failed', { maxDomains }, false, errorMsg)
      return []
    }
  }
}

/**
 * Privacy Page Detector - Find privacy policy pages on domains
 */
class PrivacyPageDetector {
  private static readonly PRIVACY_PATHS = [
    '/datenschutz',
    '/datenschutzerklaerung', 
    '/privacy',
    '/privacy-policy',
    '/privacypolicy',
    '/datenschutz.html',
    '/privacy.html'
  ]

  static async findPrivacyPage(domain: string): Promise<string | null> {
    try {
      logScraperOperation('privacy_page_search_start', { domain }, true)
      
      for (const path of this.PRIVACY_PATHS) {
        const url = `https://${domain}${path}`
        
        try {
          const response = await fetch(url, {
            method: 'HEAD', // Use HEAD to check existence without downloading content
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; LeadPoacher/1.0; +privacy-policy-checker)'
            },
            signal: AbortSignal.timeout(5000)
          })
          
          if (response.ok && response.status === 200) {
            logScraperOperation('privacy_page_found', { domain, path, url }, true)
            return url
          }
          
        } catch (error) {
          // Continue to next path
          continue
        }
      }
      
      logScraperOperation('privacy_page_not_found', { domain, pathsChecked: this.PRIVACY_PATHS.length }, true)
      return null
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Privacy page detection failed'
      logScraperOperation('privacy_page_search_failed', { domain }, false, errorMsg)
      return null
    }
  }
}

/**
 * Enhanced Competitor Detection - Find competitor mentions with context
 */
class CompetitorDetector {
  static detectCompetitorMention(html: string, competitor: string): {
    found: boolean
    context?: string
    confidence: number
  } {
    try {
      const cleanText = html.replace(/<[^>]*>/g, ' ').toLowerCase()
      const competitorLower = competitor.toLowerCase()
      
      // Look for exact matches first
      const exactMatch = cleanText.includes(competitorLower)
      if (!exactMatch) {
        return { found: false, confidence: 0 }
      }
      
      // Extract context around the mention
      const index = cleanText.indexOf(competitorLower)
      const contextStart = Math.max(0, index - 200)
      const contextEnd = Math.min(cleanText.length, index + competitorLower.length + 200)
      const context = cleanText.substring(contextStart, contextEnd).trim()
      
      // Calculate confidence based on context
      let confidence = 0.7 // Base confidence for exact match
      
      // Boost confidence for business-relevant context
      const businessKeywords = ['service', 'provider', 'partner', 'vendor', 'processor', 'drittanbieter', 'dienstleister']
      const foundKeywords = businessKeywords.filter(keyword => context.includes(keyword))
      confidence += foundKeywords.length * 0.1
      
      // Cap confidence at 1.0
      confidence = Math.min(1.0, confidence)
      
      logScraperOperation('competitor_detection', { 
        competitor, 
        found: true, 
        confidence, 
        contextLength: context.length 
      }, true)
      
      return {
        found: true,
        context,
        confidence
      }
      
    } catch (error) {
      logScraperOperation('competitor_detection_failed', { competitor }, false, error instanceof Error ? error.message : 'Detection failed')
      return { found: false, confidence: 0 }
    }
  }
}

/**
 * Privacy Page Content Extractor - Extract leads from privacy pages
 */
async function extractLeadsFromPrivacyPage(url: string, competitor: string): Promise<PrivacyPageData> {
  const domain = new URL(url).hostname
  const result: PrivacyPageData = {
    url,
    domain,
    hasCompetitorMention: false,
    leads: [],
    processingErrors: []
  }
  
  try {
    logScraperOperation('privacy_extraction_start', { url, competitor }, true)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadPoacher/1.0; +privacy-policy-checker)'
      },
      signal: AbortSignal.timeout(15000) // Longer timeout for content download
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch privacy page: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Check for competitor mention
    const competitorDetection = CompetitorDetector.detectCompetitorMention(html, competitor)
    result.hasCompetitorMention = competitorDetection.found
    result.competitorContext = competitorDetection.context
    
    // Only extract leads if competitor is mentioned
    if (result.hasCompetitorMention) {
      const extractedLeads = extractEmailsFromHTML(html, url, competitorDetection.confidence)
      
      // Enhance leads with competitor context and confidence
      result.leads = extractedLeads.map(lead => ({
        ...lead,
        context: result.competitorContext,
        confidence: competitorDetection.confidence
      }))
      
      logScraperOperation('privacy_extraction_success', { 
        url, 
        competitorFound: true, 
        leadsFound: result.leads.length,
        confidence: competitorDetection.confidence
      }, true)
    } else {
      logScraperOperation('privacy_extraction_no_competitor', { url }, true)
    }
    
    return result
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Privacy page extraction failed'
    result.processingErrors.push(errorMsg)
    logScraperOperation('privacy_extraction_failed', { url }, false, errorMsg)
    return result
  }
}

/**
 * Extract emails from HTML content
 */
function extractEmailsFromHTML(html: string, sourceUrl: string, baseConfidence: number = 0.5): ExtractedLead[] {
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
        domain,
        confidence: baseConfidence
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
          domain,
          confidence: baseConfidence
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
 * Enhanced main scraping function - Privacy page focused approach
 */
export async function scrapeCompetitorMentions(competitor: string, maxDomains = 500): Promise<ScrapingResult> {
  const startTime = Date.now()
  
  logScraperOperation('scrape_start', { competitor, maxDomains }, true)
  
  const result: ScrapingResult = {
    competitor,
    domainsChecked: 0,
    privacyPagesFound: 0,
    competitorMentionsFound: 0,
    leads: [],
    companies: [],
    totalLeadsFound: 0,
    errors: [],
    processingDetails: []
  }
  
  try {
    // Step 1: Get domains to check
    const domains = await DomainDiscoveryService.getDomainsToCheck(maxDomains)
    result.domainsChecked = domains.length
    
    if (domains.length === 0) {
      result.errors.push('No domains found for checking')
      return result
    }
    
    logScraperOperation('domains_discovered', { count: domains.length }, true)
    
    // Step 2: Process domains in batches to avoid overwhelming servers
    const batchSize = 10 // Increased batch size for better performance with more domains
    const companyDomains = new Set<string>()
    
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize)
      
      logScraperOperation('batch_start', { batchIndex: i / batchSize, batchSize: batch.length }, true)
      
      // Process batch concurrently
      const batchPromises = batch.map(async (domain) => {
        try {
          // Find privacy page
          const privacyPageUrl = await PrivacyPageDetector.findPrivacyPage(domain)
          
          if (!privacyPageUrl) {
            return {
              domain,
              hasPrivacyPage: false,
              hasCompetitorMention: false,
              leads: [],
              processingErrors: [`No privacy page found for ${domain}`]
            }
          }
          
          result.privacyPagesFound++
          
          // Extract data from privacy page
          const privacyData = await extractLeadsFromPrivacyPage(privacyPageUrl, competitor)
          
          if (privacyData.hasCompetitorMention) {
            result.competitorMentionsFound++
            result.leads.push(...privacyData.leads)
            
            // Track unique companies
            if (!companyDomains.has(domain)) {
              companyDomains.add(domain)
              
              // Extract company name
              try {
                const response = await fetch(`https://${domain}`, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadPoacher/1.0)' },
                  signal: AbortSignal.timeout(5000)
                })
                
                if (response.ok) {
                  const html = await response.text()
                  const companyName = extractCompanyName(html, domain)
                  
                  result.companies.push({
                    domain,
                    name: companyName
                  })
                }
              } catch (error) {
                // Company name extraction failed, use domain
                result.companies.push({
                  domain,
                  name: domain.replace(/^www\./, '').split('.')[0]
                })
              }
            }
          }
          
          result.processingDetails.push(privacyData)
          return privacyData
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown processing error'
          result.errors.push(`Failed to process ${domain}: ${errorMsg}`)
          logScraperOperation('domain_processing_failed', { domain }, false, errorMsg)
          
          return {
            domain,
            hasPrivacyPage: false,
            hasCompetitorMention: false,
            leads: [],
            processingErrors: [errorMsg]
          }
        }
      })
      
      // Wait for batch to complete
      await Promise.all(batchPromises)
      
      // Rate limiting between batches
      if (i + batchSize < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      logScraperOperation('batch_complete', { 
        batchIndex: i / batchSize, 
        currentLeads: result.leads.length,
        currentMentions: result.competitorMentionsFound
      }, true)
    }
    
    result.totalLeadsFound = result.leads.length
    
    const duration = Date.now() - startTime
    logScraperOperation('scrape_complete', { 
      competitor, 
      duration, 
      domainsChecked: result.domainsChecked,
      privacyPagesFound: result.privacyPagesFound,
      competitorMentionsFound: result.competitorMentionsFound,
      leadsFound: result.totalLeadsFound,
      companiesFound: result.companies.length,
      errors: result.errors.length
    }, true)
    
    return result
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown scraping error'
    result.errors.push(errorMsg)
    
    logScraperOperation('scrape_failed', { competitor, maxDomains }, false, errorMsg)
    return result
  }
}

// Legacy function for backward compatibility - remove old search-based functions
async function searchCompetitorMentions(competitor: string, maxResults = 20): Promise<SearchResult[]> {
  logScraperOperation('legacy_search_called', { competitor }, true, 'Using new privacy page approach instead')
  return []
}

async function extractLeadsFromPage(url: string, competitor: string): Promise<ExtractedLead[]> {
  logScraperOperation('legacy_extract_called', { url }, true, 'Using new privacy page approach instead')
  return []
}

// Export for testing
export { 
  DomainDiscoveryService,
  PrivacyPageDetector,
  CompetitorDetector,
  extractLeadsFromPrivacyPage,
  extractEmailsFromHTML,
  extractCompanyName,
  // Legacy exports for compatibility
  searchCompetitorMentions,
  extractLeadsFromPage
} 