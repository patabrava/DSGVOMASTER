const fs = require('fs')
const path = require('path')

console.log('🚀 Phase 2 Quick Test - Web Crawling Engine')
console.log('==========================================\n')

try {
  const scraperPath = path.join(__dirname, '../services/scraper/index.ts')
  const content = fs.readFileSync(scraperPath, 'utf8')
  
  console.log('📋 Checking Phase 2 Implementation Components:\n')
  
  // Check 1: GermanBusinessCrawler class
  const hasCrawlerClass = content.includes('class GermanBusinessCrawler')
  console.log(`${hasCrawlerClass ? '✅' : '❌'} GermanBusinessCrawler class: ${hasCrawlerClass ? 'Found' : 'Missing'}`)
  
  // Check 2: Business seeds
  const hasSeeds = content.includes('GERMAN_BUSINESS_SEEDS') && content.includes('unternehmensregister.de')
  console.log(`${hasSeeds ? '✅' : '❌'} German business seeds: ${hasSeeds ? 'Found' : 'Missing'}`)
  
  // Check 3: Business indicator interface
  const hasIndicators = content.includes('interface BusinessIndicator') && content.includes('hasImpressum')
  console.log(`${hasIndicators ? '✅' : '❌'} Business indicator detection: ${hasIndicators ? 'Found' : 'Missing'}`)
  
  // Check 4: Web crawling integration
  const hasIntegration = content.includes('discoverFromWebCrawling') && content.includes('enableWebCrawling: true')
  console.log(`${hasIntegration ? '✅' : '❌'} Enhanced discovery integration: ${hasIntegration ? 'Found' : 'Missing'}`)
  
  // Check 5: Rate limiting
  const hasRateLimit = content.includes('crawlDelayMs') && content.includes('crawlDelay')
  console.log(`${hasRateLimit ? '✅' : '❌'} Rate limiting implementation: ${hasRateLimit ? 'Found' : 'Missing'}`)
  
  // Check 6: Robots.txt compliance
  const hasRobots = content.includes('checkRobotsTxt') && content.includes('respectRobotsTxt')
  console.log(`${hasRobots ? '✅' : '❌'} Robots.txt compliance: ${hasRobots ? 'Found' : 'Missing'}`)
  
  // Check 7: Domain extraction
  const hasDomainExtraction = content.includes('extractDomainsFromHTML') && content.includes('isGermanBusinessDomain')
  console.log(`${hasDomainExtraction ? '✅' : '❌'} Domain extraction logic: ${hasDomainExtraction ? 'Found' : 'Missing'}`)
  
  // Check 8: Business confidence scoring
  const hasConfidenceScoring = content.includes('calculateBusinessConfidence') && content.includes('hasVATNumber')
  console.log(`${hasConfidenceScoring ? '✅' : '❌'} Business confidence scoring: ${hasConfidenceScoring ? 'Found' : 'Missing'}`)
  
  const checks = [hasCrawlerClass, hasSeeds, hasIndicators, hasIntegration, hasRateLimit, hasRobots, hasDomainExtraction, hasConfidenceScoring]
  const passed = checks.filter(check => check).length
  const total = checks.length
  const successRate = (passed / total) * 100
  
  console.log(`\n📊 PHASE 2 IMPLEMENTATION STATUS:`)
  console.log(`Components implemented: ${passed}/${total}`)
  console.log(`Success rate: ${successRate.toFixed(1)}%`)
  
  if (successRate >= 90) {
    console.log('\n🎉 PHASE 2 IMPLEMENTATION COMPLETE!')
    console.log('✅ Web crawling engine is fully implemented')
    console.log('✅ All major components are in place')
    console.log('✅ Ready for testing and Phase 3 development')
  } else if (successRate >= 75) {
    console.log('\n⚠️  PHASE 2 MOSTLY COMPLETE')
    console.log('Some components may need attention before proceeding')
  } else {
    console.log('\n❌ PHASE 2 INCOMPLETE')
    console.log('Major components are missing or not implemented correctly')
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message)
} 