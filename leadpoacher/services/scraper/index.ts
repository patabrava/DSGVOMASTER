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

// Enhanced Domain Discovery Infrastructure - Phase 1
// Following MONOCODE Observable Implementation principles

// New interfaces for enhanced domain discovery
interface DomainSource {
  source: 'static' | 'api' | 'registry' | 'crawl' | 'directory'
  discoveredAt: Date
  confidence: number
  metadata?: Record<string, any>
}

interface EnhancedDomain {
  domain: string
  sources: DomainSource[]
  lastValidated?: Date
  isActive: boolean
  businessType?: string
  country?: string
  language?: string
}

interface DomainDiscoveryConfig {
  enableStaticList: boolean
  enableApiDiscovery: boolean
  enableRegistryLookup: boolean
  enableWebCrawling: boolean
  enableDirectorySearch: boolean
  maxDomainsPerSource: number
  rateLimitDelayMs: number
}

interface DomainDiscoveryResult {
  domains: string[]
  sources: { [key: string]: number }
  totalDiscovered: number
  processingTimeMs: number
  errors: string[]
  statistics: {
    staticCount: number
    apiCount: number
    registryCount: number
    crawlCount: number
    directoryCount: number
  }
}

/**
 * Enhanced Domain Discovery Service - Multi-channel discovery infrastructure
 * Phase 1: Foundation with API integration capabilities
 */
class EnhancedDomainDiscoveryService {
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

  private static defaultConfig: DomainDiscoveryConfig = {
    enableStaticList: true,
    enableApiDiscovery: true,
    enableRegistryLookup: false, // Enabled in Phase 3
    enableWebCrawling: true,     // ✅ ENABLED in Phase 2
    enableDirectorySearch: false, // Enabled in Phase 3
    maxDomainsPerSource: 1000,
    rateLimitDelayMs: 100
  }

  // Phase 1: Static domain discovery with infrastructure for future expansion
  static async discoverDomains(
    maxDomains: number = 500, 
    config: Partial<DomainDiscoveryConfig> = {}
  ): Promise<DomainDiscoveryResult> {
    const startTime = Date.now()
    const finalConfig = { ...this.defaultConfig, ...config }
    const result: DomainDiscoveryResult = {
      domains: [],
      sources: {},
      totalDiscovered: 0,
      processingTimeMs: 0,
      errors: [],
      statistics: {
        staticCount: 0,
        apiCount: 0,
        registryCount: 0,
        crawlCount: 0,
        directoryCount: 0
      }
    }

    try {
      logScraperOperation('enhanced_domain_discovery_start', { 
        maxDomains, 
        config: finalConfig 
      }, true)

      const domainSet = new Set<string>()

      // Discovery Channel 1: Static domain list
      if (finalConfig.enableStaticList) {
        const staticDomains = await this.getStaticDomains(finalConfig.maxDomainsPerSource)
        staticDomains.forEach(domain => domainSet.add(domain))
        result.statistics.staticCount = staticDomains.length
        result.sources['static'] = staticDomains.length
        
        logScraperOperation('static_domain_discovery', { 
          domainsFound: staticDomains.length 
        }, true)
      }

      // Discovery Channel 2: API-based discovery (Phase 1 foundation)
      if (finalConfig.enableApiDiscovery) {
        try {
          const apiDomains = await this.discoverFromAPIs(finalConfig.maxDomainsPerSource)
          apiDomains.forEach(domain => domainSet.add(domain))
          result.statistics.apiCount = apiDomains.length
          result.sources['api'] = apiDomains.length
          
          logScraperOperation('api_domain_discovery', { 
            domainsFound: apiDomains.length 
          }, true)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'API discovery failed'
          result.errors.push(`API Discovery: ${errorMsg}`)
          logScraperOperation('api_domain_discovery_failed', {}, false, errorMsg)
        }
      }

      // Discovery Channel 3: Web Crawling (Phase 2 - NOW IMPLEMENTED)
      if (finalConfig.enableWebCrawling) {
        try {
          const crawlDomains = await this.discoverFromWebCrawling(finalConfig.maxDomainsPerSource)
          crawlDomains.forEach(domain => domainSet.add(domain))
          result.statistics.crawlCount = crawlDomains.length
          result.sources['crawl'] = crawlDomains.length
          
          logScraperOperation('web_crawling_discovery', { 
            domainsFound: crawlDomains.length 
          }, true)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Web crawling discovery failed'
          result.errors.push(`Web Crawling: ${errorMsg}`)
          logScraperOperation('web_crawling_discovery_failed', {}, false, errorMsg)
        }
      }

      // Future channels (Phase 3)
      if (finalConfig.enableRegistryLookup) {
        // TODO: Implement registry lookup in Phase 3
        logScraperOperation('registry_discovery_placeholder', { 
          message: 'Registry lookup will be implemented in Phase 3' 
        }, true)
      }

      if (finalConfig.enableDirectorySearch) {
        // TODO: Implement directory search in Phase 3
        logScraperOperation('directory_search_placeholder', { 
          message: 'Directory search will be implemented in Phase 3' 
        }, true)
      }

      // Convert set to array and limit to maxDomains
      result.domains = Array.from(domainSet).slice(0, maxDomains)
      result.totalDiscovered = result.domains.length
      result.processingTimeMs = Date.now() - startTime

      logScraperOperation('enhanced_domain_discovery_complete', {
        totalDomains: result.totalDiscovered,
        sources: result.sources,
        processingTimeMs: result.processingTimeMs,
        errors: result.errors.length
      }, true)

      return result

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Domain discovery failed'
      result.errors.push(errorMsg)
      result.processingTimeMs = Date.now() - startTime
      
      logScraperOperation('enhanced_domain_discovery_failed', { 
        maxDomains, 
        config: finalConfig 
      }, false, errorMsg)
      
      return result
    }
  }

  // Channel 1: Static domain list
  private static async getStaticDomains(maxDomains: number): Promise<string[]> {
    // Add rate limiting to simulate real-world conditions
    await this.rateLimitDelay(50)
    return this.businessDomains.slice(0, maxDomains)
  }

  // Channel 2: API-based discovery (Phase 1 foundation)
  private static async discoverFromAPIs(maxDomains: number): Promise<string[]> {
    const apiDomains: string[] = []
    
    try {
      // Phase 1: Mock API responses for testing infrastructure
      // Phase 3: Implement real API integrations
      
      logScraperOperation('api_discovery_start', { maxDomains }, true)
      
      // Simulate API calls with rate limiting
      await this.rateLimitDelay(200)
      
      // Mock German startup/company domains from hypothetical APIs
      // Phase 3: Replace with real API calls to:
      // - OpenCorporates API
      // - Hunter.io Company Search  
      // - Clearbit Company API
      // - SecurityTrails Domain Intelligence
      const mockApiDomains = [
        'flixbus.com', 'outfittery.de', 'wundertax.de', 'personio.de',
        'contentful.com', 'ramp.de', 'pitch.com', 'mambu.com',
        'forto.com', 'tier.app', 'cluno.com', 'dance.com',
        'gorillas.io', 'flink.com', 'picnic.app', 'getir.com',
        'shopify.de', 'stripe.com', 'twilio.com', 'sendgrid.com',
        'ecosia.org', 'blinkist.com', 'mindmeister.com', 'wunderlist.com',
        'soundcloud.com', 'eyeem.com', 'adjust.com', 'researchgate.net',
        'thermomix.de', 'mytaxi.com', 'foodpanda.de', 'lieferando.de'
      ]
      
      apiDomains.push(...mockApiDomains.slice(0, maxDomains))
      
      logScraperOperation('api_discovery_mock', { 
        domainsFound: apiDomains.length,
        note: 'Using mock data for Phase 1 infrastructure testing'
      }, true)
      
      return apiDomains
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'API discovery error'
      logScraperOperation('api_discovery_error', { maxDomains }, false, errorMsg)
      return []
    }
  }

  // Channel 3: Web crawling discovery (Phase 2 implementation)
  private static async discoverFromWebCrawling(maxDomains: number): Promise<string[]> {
    try {
      logScraperOperation('web_crawling_discovery_start', { maxDomains }, true)
      
      // Use the German Business Crawler to discover domains
      const crawlResults = await GermanBusinessCrawler.crawlForGermanBusinessDomains(
        maxDomains,
        {
          maxDomainsPerSeed: Math.ceil(maxDomains / 10), // Distribute across seeds
          crawlDelayMs: 2000, // More conservative for discovery
          respectRobotsTxt: true,
          germanOnly: true,
          businessOnly: true
        }
      )
      
      // Aggregate all discovered domains from all seeds
      const discoveredDomains = new Set<string>()
      crawlResults.forEach(result => {
        result.discoveredDomains.forEach((domain: string) => discoveredDomains.add(domain))
      })
      
      const domains = Array.from(discoveredDomains).slice(0, maxDomains)
      
      logScraperOperation('web_crawling_discovery_complete', {
        domainsFound: domains.length,
        seedsProcessed: crawlResults.length,
        totalExtracted: discoveredDomains.size
      }, true)
      
      return domains
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Web crawling discovery error'
      logScraperOperation('web_crawling_discovery_error', { maxDomains }, false, errorMsg)
      return []
    }
  }

  // Rate limiting utility
  private static async rateLimitDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Backward compatibility method
  static async getDomainsToCheck(maxDomains: number = 500): Promise<string[]> {
    const result = await this.discoverDomains(maxDomains)
    return result.domains
  }
}

// Update the legacy class to use the enhanced service
class DomainDiscoveryService {
  static async getDomainsToCheck(maxDomains: number = 500): Promise<string[]> {
    return EnhancedDomainDiscoveryService.getDomainsToCheck(maxDomains)
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

// Phase 2: Web Crawling Engine Infrastructure
// German Business Discovery through intelligent crawling

interface CrawlSeed {
  url: string
  type: 'business_portal' | 'directory' | 'government' | 'association'
  priority: number
  lastCrawled?: Date
}

interface CrawlResult {
  sourceUrl: string
  discoveredDomains: string[]
  businessIndicators: BusinessIndicator[]
  processingTime: number
  errors: string[]
}

interface BusinessIndicator {
  domain: string
  indicators: {
    hasImpressum: boolean
    hasGermanContent: boolean
    hasBusinessKeywords: boolean
    hasVATNumber: boolean
    hasContactInfo: boolean
    hasPrivacyPolicy: boolean
  }
  confidence: number
  businessType?: string
}

interface CrawlConfig {
  maxDepth: number
  maxDomainsPerSeed: number
  respectRobotsTxt: boolean
  crawlDelayMs: number
  userAgent: string
  germanOnly: boolean
  businessOnly: boolean
}

/**
 * German Business Web Crawler - Phase 2 Implementation
 * Intelligent discovery of German business domains through web crawling
 */
class GermanBusinessCrawler {
  private static readonly GERMAN_BUSINESS_SEEDS: CrawlSeed[] = [
    // German Business Portals
    { url: 'https://www.unternehmensregister.de', type: 'government', priority: 10 },
    { url: 'https://www.bundesanzeiger.de', type: 'government', priority: 10 },
    { url: 'https://www.dihk.de', type: 'association', priority: 9 },
    { url: 'https://www.bdi.eu', type: 'association', priority: 9 },
    { url: 'https://www.gelbeseiten.de', type: 'directory', priority: 8 },
    { url: 'https://www.wlw.de', type: 'business_portal', priority: 8 },
    { url: 'https://www.firmenwissen.de', type: 'business_portal', priority: 7 },
    { url: 'https://www.northdata.de', type: 'business_portal', priority: 7 },
    
    // Startup and Innovation Hubs
    { url: 'https://www.berlin-startup.de', type: 'business_portal', priority: 6 },
    { url: 'https://www.munich-startup.de', type: 'business_portal', priority: 6 },
    { url: 'https://www.startup-map.de', type: 'business_portal', priority: 6 },
    
    // Industry Associations
    { url: 'https://www.vdma.org', type: 'association', priority: 5 },
    { url: 'https://www.zvei.org', type: 'association', priority: 5 },
    { url: 'https://www.bitkom.org', type: 'association', priority: 5 },
    
    // Regional Business Directories
    { url: 'https://www.ihk.de', type: 'association', priority: 4 },
    { url: 'https://www.hwk.de', type: 'association', priority: 4 }
  ]

  private static readonly GERMAN_BUSINESS_KEYWORDS = [
    'GmbH', 'AG', 'UG', 'KG', 'OHG', 'Unternehmen', 'Firma', 'Betrieb',
    'Gesellschaft', 'Konzern', 'Holding', 'Service', 'Dienstleistung',
    'Produktion', 'Hersteller', 'Anbieter', 'Lieferant', 'Partner'
  ]

  private static readonly GERMAN_CONTENT_INDICATORS = [
    'Impressum', 'Datenschutz', 'AGB', 'Kontakt', 'Über uns',
    'Unternehmen', 'Leistungen', 'Produkte', 'Service'
  ]

  private static defaultCrawlConfig: CrawlConfig = {
    maxDepth: 2,
    maxDomainsPerSeed: 100,
    respectRobotsTxt: true,
    crawlDelayMs: 1000,
    userAgent: 'Mozilla/5.0 (compatible; LeadPoacher-Crawler/2.0; +https://leadpoacher.com/bot)',
    germanOnly: true,
    businessOnly: true
  }

  /**
   * Discover German business domains through intelligent web crawling
   */
  static async crawlForGermanBusinessDomains(
    maxDomains: number = 1000,
    config: Partial<CrawlConfig> = {}
  ): Promise<CrawlResult[]> {
    const finalConfig = { ...this.defaultCrawlConfig, ...config }
    const results: CrawlResult[] = []
    const discoveredDomains = new Set<string>()

    try {
      logScraperOperation('web_crawling_start', { 
        maxDomains, 
        config: finalConfig,
        seedCount: this.GERMAN_BUSINESS_SEEDS.length 
      }, true)

      // Sort seeds by priority
      const prioritizedSeeds = [...this.GERMAN_BUSINESS_SEEDS]
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10) // Limit to top 10 seeds for Phase 2

      for (const seed of prioritizedSeeds) {
        if (discoveredDomains.size >= maxDomains) break

        try {
          logScraperOperation('seed_crawl_start', { 
            seedUrl: seed.url, 
            type: seed.type, 
            priority: seed.priority 
          }, true)

          const seedResult = await this.crawlSeed(seed, finalConfig, maxDomains - discoveredDomains.size)
          
          // Add discovered domains to global set
          seedResult.discoveredDomains.forEach(domain => discoveredDomains.add(domain))
          
          results.push(seedResult)
          
          logScraperOperation('seed_crawl_complete', { 
            seedUrl: seed.url,
            domainsDiscovered: seedResult.discoveredDomains.length,
            totalDiscovered: discoveredDomains.size
          }, true)

          // Rate limiting between seeds
          await this.crawlDelay(finalConfig.crawlDelayMs * 2)

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Seed crawl failed'
          logScraperOperation('seed_crawl_failed', { seedUrl: seed.url }, false, errorMsg)
          
          results.push({
            sourceUrl: seed.url,
            discoveredDomains: [],
            businessIndicators: [],
            processingTime: 0,
            errors: [errorMsg]
          })
        }
      }

      logScraperOperation('web_crawling_complete', {
        totalSeeds: prioritizedSeeds.length,
        totalDomains: discoveredDomains.size,
        resultsCount: results.length
      }, true)

      return results

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Web crawling failed'
      logScraperOperation('web_crawling_failed', { maxDomains }, false, errorMsg)
      return []
    }
  }

  /**
   * Crawl a single seed URL for German business domains
   */
  private static async crawlSeed(
    seed: CrawlSeed, 
    config: CrawlConfig, 
    maxDomains: number
  ): Promise<CrawlResult> {
    const startTime = Date.now()
    const result: CrawlResult = {
      sourceUrl: seed.url,
      discoveredDomains: [],
      businessIndicators: [],
      processingTime: 0,
      errors: []
    }

    try {
      // Check robots.txt if required
      if (config.respectRobotsTxt) {
        const robotsAllowed = await this.checkRobotsTxt(seed.url, config.userAgent)
        if (!robotsAllowed) {
          result.errors.push('Robots.txt disallows crawling')
          return result
        }
      }

      // Fetch seed page
      await this.crawlDelay(config.crawlDelayMs)
      
      const response = await fetch(seed.url, {
        headers: {
          'User-Agent': config.userAgent,
          'Accept': 'text/html,application/xhtml+xml'
        },
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      
      // Extract domains from the page
      const extractedDomains = this.extractDomainsFromHTML(html, seed.url)
      
      // Filter for German business domains
      const businessDomains: string[] = []
      
      for (const domain of extractedDomains) {
        if (businessDomains.length >= maxDomains) break

        try {
          const businessIndicator = await this.analyzeBusinessDomain(domain, config)
          
          if (businessIndicator && businessIndicator.confidence >= 0.6) {
            businessDomains.push(domain)
            result.businessIndicators.push(businessIndicator)
          }
          
          // Rate limiting between domain analyses
          await this.crawlDelay(config.crawlDelayMs / 4)
          
        } catch (error) {
          // Continue with next domain if analysis fails
          continue
        }
      }

      result.discoveredDomains = businessDomains
      result.processingTime = Date.now() - startTime

      logScraperOperation('seed_analysis_complete', {
        seedUrl: seed.url,
        extractedDomains: extractedDomains.length,
        businessDomains: businessDomains.length,
        avgConfidence: result.businessIndicators.length > 0 
          ? result.businessIndicators.reduce((sum, bi) => sum + bi.confidence, 0) / result.businessIndicators.length 
          : 0
      }, true)

      return result

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown crawl error'
      result.errors.push(errorMsg)
      result.processingTime = Date.now() - startTime
      
      logScraperOperation('seed_crawl_error', { seedUrl: seed.url }, false, errorMsg)
      return result
    }
  }

  /**
   * Extract domains from HTML content
   */
  private static extractDomainsFromHTML(html: string, sourceUrl: string): string[] {
    const domains = new Set<string>()
    
    try {
      // Extract from href attributes
      const linkRegex = /href=["']([^"']+)["']/gi
      let match
      
      while ((match = linkRegex.exec(html)) !== null) {
        try {
          const url = new URL(match[1], sourceUrl)
          
          // Only include German domains or German-focused international domains
          if (this.isGermanBusinessDomain(url.hostname)) {
            domains.add(url.hostname.toLowerCase())
          }
        } catch {
          // Invalid URL, skip
          continue
        }
      }

      // Extract from JavaScript and other content
      const domainRegex = /(?:https?:\/\/)?([a-zA-Z0-9.-]+\.(?:de|com|org|net))/gi
      
      while ((match = domainRegex.exec(html)) !== null) {
        const domain = match[1].toLowerCase()
        if (this.isGermanBusinessDomain(domain)) {
          domains.add(domain)
        }
      }

      return Array.from(domains)
        .filter(domain => domain !== new URL(sourceUrl).hostname) // Exclude source domain
        .slice(0, 200) // Limit per page to prevent memory issues
      
    } catch (error) {
      logScraperOperation('domain_extraction_error', { sourceUrl }, false, 
        error instanceof Error ? error.message : 'Extraction failed')
      return []
    }
  }

  /**
   * Check if domain appears to be a German business domain
   */
  private static isGermanBusinessDomain(domain: string): boolean {
    // Primary filter: German TLD or German-focused domains
    if (domain.endsWith('.de')) return true
    
    // Secondary filter: Known German business patterns
    const germanPatterns = [
      /gmbh/i, /deutschland/i, /german/i, /berlin/i, /münchen/i, /hamburg/i,
      /koeln/i, /frankfurt/i, /dresden/i, /leipzig/i, /hannover/i
    ]
    
    return germanPatterns.some(pattern => pattern.test(domain))
  }

  /**
   * Analyze domain for German business indicators
   */
  private static async analyzeBusinessDomain(
    domain: string, 
    config: CrawlConfig
  ): Promise<BusinessIndicator | null> {
    try {
      await this.crawlDelay(config.crawlDelayMs / 2)
      
      const response = await fetch(`https://${domain}`, {
        headers: {
          'User-Agent': config.userAgent,
          'Accept': 'text/html,application/xhtml+xml'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        return null
      }

      const html = await response.text()
      const indicators = this.detectBusinessIndicators(html, domain)
      
      // Calculate confidence score
      const confidence = this.calculateBusinessConfidence(indicators)
      
      if (confidence >= 0.3) { // Minimum threshold
        return {
          domain,
          indicators,
          confidence,
          businessType: this.determineBusinessType(html)
        }
      }

      return null

    } catch (error) {
      // Domain analysis failed, but don't log as error (expected for many domains)
      return null
    }
  }

  /**
   * Detect German business indicators on a webpage
   */
  private static detectBusinessIndicators(html: string, domain: string) {
    const lowerHtml = html.toLowerCase()
    
    return {
      hasImpressum: /impressum|rechtliche hinweise/i.test(html),
      hasGermanContent: this.GERMAN_CONTENT_INDICATORS.some(indicator => 
        lowerHtml.includes(indicator.toLowerCase())
      ),
      hasBusinessKeywords: this.GERMAN_BUSINESS_KEYWORDS.some(keyword => 
        lowerHtml.includes(keyword.toLowerCase())
      ),
      hasVATNumber: /ust[.-]?id[.-]?nr|umsatzsteuer|de\d{9}/i.test(html),
      hasContactInfo: /kontakt|ansprechpartner|telefon|email/i.test(html),
      hasPrivacyPolicy: /datenschutz|privacy|dsgvo/i.test(html)
    }
  }

  /**
   * Calculate business confidence score
   */
  private static calculateBusinessConfidence(indicators: any): number {
    const weights = {
      hasImpressum: 0.3,        // Strong indicator for German businesses
      hasGermanContent: 0.2,    // Good indicator
      hasBusinessKeywords: 0.2, // Good indicator
      hasVATNumber: 0.15,       // Strong business indicator
      hasContactInfo: 0.1,      // Basic requirement
      hasPrivacyPolicy: 0.05    // Legal requirement
    }

    let score = 0
    Object.entries(weights).forEach(([key, weight]) => {
      if (indicators[key]) {
        score += weight
      }
    })

    return Math.min(1.0, score) // Cap at 1.0
  }

  /**
   * Determine business type from content analysis
   */
  private static determineBusinessType(html: string): string {
    const lowerHtml = html.toLowerCase()
    
    if (/software|it|tech|digital/i.test(html)) return 'technology'
    if (/handel|shop|verkauf|e-commerce/i.test(html)) return 'retail'
    if (/beratung|consulting|dienstleistung/i.test(html)) return 'consulting'
    if (/produktion|fertigung|herstellung/i.test(html)) return 'manufacturing'
    if (/gesundheit|medizin|pharma/i.test(html)) return 'healthcare'
    if (/finanz|bank|versicherung/i.test(html)) return 'financial'
    
    return 'general'
  }

  /**
   * Check robots.txt compliance
   */
  private static async checkRobotsTxt(url: string, userAgent: string): Promise<boolean> {
    try {
      const baseUrl = new URL(url).origin
      const robotsUrl = `${baseUrl}/robots.txt`
      
      const response = await fetch(robotsUrl, {
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) {
        return true // If robots.txt doesn't exist, assume allowed
      }
      
      const robotsText = await response.text()
      
      // Simple robots.txt parsing - check for Disallow: / for our user agent
      const lines = robotsText.split('\n')
      let isOurUserAgent = false
      
      for (const line of lines) {
        const trimmed = line.trim()
        
        if (trimmed.startsWith('User-agent:')) {
          const agent = trimmed.substring(11).trim()
          isOurUserAgent = agent === '*' || userAgent.includes(agent)
        }
        
        if (isOurUserAgent && trimmed.startsWith('Disallow:')) {
          const disallowed = trimmed.substring(9).trim()
          if (disallowed === '/' || disallowed === '') {
            return false // Disallowed
          }
        }
      }
      
      return true // Allowed by default
      
    } catch {
      return true // If robots.txt check fails, assume allowed
    }
  }

  /**
   * Rate limiting delay
   */
  private static async crawlDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
} 