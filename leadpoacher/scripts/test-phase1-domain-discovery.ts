#!/usr/bin/env tsx

/**
 * Phase 1 Test Script: Enhanced Domain Discovery Infrastructure
 * Following PLAN_TESTSCRIPT guidelines for real-environment validation
 */

import { DomainDiscoveryService } from '../services/scraper/index'

interface TestResult {
  testName: string
  passed: boolean
  duration: number
  details: any
  errors: string[]
}

async function testStaticDomainDiscovery(): Promise<TestResult> {
  const testName = 'Static Domain Discovery'
  const startTime = Date.now()
  const errors: string[] = []
  let passed = false
  let details: any = {}

  try {
    console.log(`🧪 Running ${testName}...`)
    
    // Test different domain limits
    const testCases = [
      { limit: 10, expectedMin: 10 },
      { limit: 50, expectedMin: 50 },
      { limit: 500, expectedMin: 400 }
    ]

    const results = []
    
    for (const testCase of testCases) {
      const domains = await DomainDiscoveryService.getDomainsToCheck(testCase.limit)
      
      const isValid = Array.isArray(domains) && 
                     domains.length >= Math.min(testCase.expectedMin, testCase.limit) &&
                     domains.every(d => typeof d === 'string' && d.includes('.'))
      
      if (!isValid) {
        errors.push(`Test case ${testCase.limit}: expected >= ${testCase.expectedMin}, got ${domains.length}`)
      }
      
      results.push({
        limit: testCase.limit,
        actual: domains.length,
        valid: isValid,
        samples: domains.slice(0, 3)
      })
      
      console.log(`  ✓ Limit ${testCase.limit}: ${domains.length} domains`)
    }
    
    details = { testCases: results }
    passed = errors.length === 0
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  const duration = Date.now() - startTime
  console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
  
  return { testName, passed, duration, details, errors }
}

async function testPerformance(): Promise<TestResult> {
  const testName = 'Performance Benchmark'
  const startTime = Date.now()
  const errors: string[] = []
  let passed = false
  let details: any = {}

  try {
    console.log(`🧪 Running ${testName}...`)
    
    const benchmarks = []
    const testSizes = [10, 50, 100, 500]
    
    for (const size of testSizes) {
      const benchStart = Date.now()
      const domains = await DomainDiscoveryService.getDomainsToCheck(size)
      const benchDuration = Date.now() - benchStart
      
      const domainsPerSecond = (domains.length / benchDuration) * 1000
      
      benchmarks.push({
        size,
        domains: domains.length,
        duration: benchDuration,
        domainsPerSecond: Math.round(domainsPerSecond)
      })
      
      console.log(`  ✓ ${size} domains: ${benchDuration}ms (${Math.round(domainsPerSecond)} domains/sec)`)
    }
    
    const avgDuration = benchmarks.reduce((sum, b) => sum + b.duration, 0) / benchmarks.length
    const performanceGood = avgDuration < 2000 // Should complete within 2 seconds
    
    if (!performanceGood) {
      errors.push(`Average duration ${avgDuration}ms exceeds 2000ms threshold`)
    }
    
    details = { benchmarks, avgDuration, performanceGood }
    passed = errors.length === 0
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  const duration = Date.now() - startTime
  console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
  
  return { testName, passed, duration, details, errors }
}

async function testDomainQuality(): Promise<TestResult> {
  const testName = 'Domain Quality Validation'
  const startTime = Date.now()
  const errors: string[] = []
  let passed = false
  let details: any = {}

  try {
    console.log(`🧪 Running ${testName}...`)
    
    const domains = await DomainDiscoveryService.getDomainsToCheck(100)
    
    // Quality checks
    const validDomains = domains.filter(d => {
      return typeof d === 'string' && 
             d.length > 3 && 
             d.includes('.') && 
             !d.includes(' ') &&
             /^[a-zA-Z0-9.-]+$/.test(d)
    })
    
    const germanDomains = domains.filter(d => d.endsWith('.de'))
    const businessDomains = domains.filter(d => 
      d.includes('gmbh') || 
      d.includes('ag') || 
      ['sap.com', 'siemens.com', 'bmw.com'].includes(d)
    )
    
    const qualityScore = (validDomains.length / domains.length) * 100
    const germanRatio = (germanDomains.length / domains.length) * 100
    
    if (qualityScore < 95) {
      errors.push(`Quality score ${qualityScore}% below 95% threshold`)
    }
    
    details = {
      totalDomains: domains.length,
      validDomains: validDomains.length,
      germanDomains: germanDomains.length,
      businessDomains: businessDomains.length,
      qualityScore,
      germanRatio,
      samples: domains.slice(0, 10)
    }
    
    passed = errors.length === 0
    console.log(`  ✓ Quality score: ${qualityScore.toFixed(1)}%`)
    console.log(`  ✓ German domains: ${germanRatio.toFixed(1)}%`)
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  const duration = Date.now() - startTime
  console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
  
  return { testName, passed, duration, details, errors }
}

async function runPhase1Tests(): Promise<void> {
  console.log('🚀 Starting Phase 1 Domain Discovery Validation Tests\n')
  
  const startTime = Date.now()
  const results: TestResult[] = []
  
  // Run all tests
  results.push(await testStaticDomainDiscovery())
  results.push(await testPerformance())
  results.push(await testDomainQuality())
  
  const totalDuration = Date.now() - startTime
  const passedTests = results.filter(r => r.passed).length
  const totalTests = results.length
  
  console.log('\n📊 Phase 1 Test Summary:')
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Total Duration: ${totalDuration}ms`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  // Detailed results
  console.log('\n📋 Detailed Results:')
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.testName}: ${result.duration}ms`)
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`)
    }
  })
  
  // Phase 1 validation criteria
  const phase1Ready = passedTests === totalTests
  
  if (phase1Ready) {
    console.log('\n🎉 Phase 1 COMPLETE: Enhanced domain discovery infrastructure is validated and ready!')
    console.log('✅ Static domain discovery working')
    console.log('✅ Performance meets requirements') 
    console.log('✅ Domain quality validated')
    console.log('\n🚀 Ready to proceed to Phase 2: Web Crawling Engine')
  } else {
    console.log('\n❌ Phase 1 INCOMPLETE: Please fix failing tests before proceeding')
    process.exit(1)
  }
}

// Run tests
if (require.main === module) {
  runPhase1Tests().catch(error => {
    console.error('Fatal test error:', error)
    process.exit(1)
  })
}

export { runPhase1Tests } 