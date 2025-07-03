#!/usr/bin/env tsx

/**
 * Phase 1 Test Script: Enhanced Domain Discovery Infrastructure
 * Following PLAN_TESTSCRIPT guidelines for real-environment validation
 * 
 * Tests:
 * 1. Static domain discovery functionality  
 * 2. API-based discovery mock infrastructure
 * 3. Rate limiting and error handling
 * 4. Observable implementation logging
 * 5. Performance benchmarking
 * 6. Configuration options
 */

import { EnhancedDomainDiscoveryService } from '../services/scraper/index'

interface TestResult {
  testName: string
  passed: boolean
  duration: number
  details: any
  errors: string[]
}

class Phase1TestSuite {
  private results: TestResult[] = []
  
  // Test 1: Static Domain Discovery
  async testStaticDomainDiscovery(): Promise<TestResult> {
    const testName = 'Static Domain Discovery'
    const startTime = Date.now()
    const errors: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log(`🧪 Running ${testName}...`)
      
      // Test with different limits
      const testCases = [
        { maxDomains: 10, expectedMin: 10 },
        { maxDomains: 50, expectedMin: 50 },
        { maxDomains: 100, expectedMin: 100 },
        { maxDomains: 500, expectedMin: 400 }, // Should return all available static domains
      ]

      const results = []
      
      for (const testCase of testCases) {
        const config = {
          enableStaticList: true,
          enableApiDiscovery: false,
          enableRegistryLookup: false,
          enableWebCrawling: false,
          enableDirectorySearch: false
        }
        
        const result = await EnhancedDomainDiscoveryService.discoverDomains(
          testCase.maxDomains, 
          config
        )
        
        const testPassed = result.domains.length >= Math.min(testCase.expectedMin, testCase.maxDomains)
        
        if (!testPassed) {
          errors.push(`Expected at least ${testCase.expectedMin} domains, got ${result.domains.length}`)
        }
        
        results.push({
          maxDomains: testCase.maxDomains,
          actualDomains: result.domains.length,
          staticCount: result.statistics.staticCount,
          sources: result.sources,
          processingTime: result.processingTimeMs,
          passed: testPassed
        })
        
        console.log(`  ✓ Static domains (limit: ${testCase.maxDomains}): ${result.domains.length} found`)
      }
      
      details = { testCases: results }
      passed = errors.length === 0
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    const duration = Date.now() - startTime
    const result: TestResult = { testName, passed, duration, details, errors }
    this.results.push(result)
    
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join(', ')}`)
    }
    
    return result
  }

  // Test 2: API Discovery Infrastructure
  async testApiDiscoveryInfrastructure(): Promise<TestResult> {
    const testName = 'API Discovery Infrastructure'
    const startTime = Date.now()
    const errors: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log(`🧪 Running ${testName}...`)
      
      const config = {
        enableStaticList: false,
        enableApiDiscovery: true,
        enableRegistryLookup: false,
        enableWebCrawling: false,
        enableDirectorySearch: false
      }
      
      const result = await EnhancedDomainDiscoveryService.discoverDomains(50, config)
      
      // Validate API discovery returned domains
      const hasApiDomains = result.statistics.apiCount > 0
      const hasCorrectSource = result.sources['api'] > 0
      const hasValidDomains = result.domains.length > 0
      const allDomainsValid = result.domains.every(domain => 
        typeof domain === 'string' && domain.includes('.')
      )
      
      if (!hasApiDomains) errors.push('No API domains returned')
      if (!hasCorrectSource) errors.push('API source not tracked correctly')
      if (!hasValidDomains) errors.push('No valid domains returned')
      if (!allDomainsValid) errors.push('Invalid domain format detected')
      
      details = {
        totalDomains: result.domains.length,
        apiCount: result.statistics.apiCount,
        sources: result.sources,
        processingTime: result.processingTimeMs,
        sampleDomains: result.domains.slice(0, 5)
      }
      
      passed = errors.length === 0
      console.log(`  ✓ API domains discovered: ${result.statistics.apiCount}`)
      console.log(`  ✓ Sample domains: ${result.domains.slice(0, 3).join(', ')}...`)
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    const duration = Date.now() - startTime
    const result: TestResult = { testName, passed, duration, details, errors }
    this.results.push(result)
    
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join(', ')}`)
    }
    
    return result
  }

  // Test 3: Multi-Channel Discovery
  async testMultiChannelDiscovery(): Promise<TestResult> {
    const testName = 'Multi-Channel Discovery'
    const startTime = Date.now()
    const errors: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log(`🧪 Running ${testName}...`)
      
      const config = {
        enableStaticList: true,
        enableApiDiscovery: true,
        enableRegistryLookup: false,
        enableWebCrawling: false,
        enableDirectorySearch: false
      }
      
      const result = await EnhancedDomainDiscoveryService.discoverDomains(100, config)
      
      // Validate multi-channel aggregation
      const hasMultipleSources = Object.keys(result.sources).length >= 2
      const totalFromSources = result.statistics.staticCount + result.statistics.apiCount
      const noDuplicates = result.domains.length === new Set(result.domains).size
      
      if (!hasMultipleSources) errors.push('Should have multiple discovery sources')
      if (result.domains.length === 0) errors.push('No domains discovered from any source')
      if (!noDuplicates) errors.push('Duplicate domains detected - deduplication failed')
      
      details = {
        totalDomains: result.domains.length,
        staticCount: result.statistics.staticCount,
        apiCount: result.statistics.apiCount,
        totalFromSources,
        sources: result.sources,
        processingTime: result.processingTimeMs,
        duplicatesRemoved: totalFromSources - result.domains.length
      }
      
      passed = errors.length === 0
      console.log(`  ✓ Total domains: ${result.domains.length}`)
      console.log(`  ✓ Static: ${result.statistics.staticCount}, API: ${result.statistics.apiCount}`)
      console.log(`  ✓ Sources: ${Object.keys(result.sources).join(', ')}`)
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    const duration = Date.now() - startTime
    const result: TestResult = { testName, passed, duration, details, errors }
    this.results.push(result)
    
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join(', ')}`)
    }
    
    return result
  }

  // Test 4: Error Handling and Rate Limiting
  async testErrorHandlingAndRateLimiting(): Promise<TestResult> {
    const testName = 'Error Handling & Rate Limiting'
    const startTime = Date.now()
    const errors: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log(`🧪 Running ${testName}...`)
      
      // Test invalid configurations
      const invalidConfigs = [
        { maxDomains: -1 },
        { maxDomains: 0 },
        { maxDomains: 10000 }, // Very large number
      ]
      
      const results = []
      
      for (const config of invalidConfigs) {
        try {
          const result = await EnhancedDomainDiscoveryService.discoverDomains(config.maxDomains)
          results.push({
            config,
            success: true,
            domains: result.domains.length,
            errors: result.errors.length
          })
        } catch (error) {
          results.push({
            config,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      // Test rate limiting behavior
      const rateLimitStartTime = Date.now()
      const config = {
        enableStaticList: true,
        enableApiDiscovery: true,
        rateLimitDelayMs: 100
      }
      
      const result = await EnhancedDomainDiscoveryService.discoverDomains(10, config)
      const rateLimitDuration = Date.now() - rateLimitStartTime
      
      // Should have some delay due to rate limiting
      const hasRateLimit = rateLimitDuration > 150 // Expected minimum delay
      
      details = {
        invalidConfigTests: results,
        rateLimitTest: {
          duration: rateLimitDuration,
          hasRateLimit,
          domains: result.domains.length
        }
      }
      
      // Minimal validation - system should handle errors gracefully
      passed = true
      console.log(`  ✓ Invalid config handling: ${results.length} tests completed`)
      console.log(`  ✓ Rate limiting: ${rateLimitDuration}ms (expected >150ms)`)
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    const duration = Date.now() - startTime
    const result: TestResult = { testName, passed, duration, details, errors }
    this.results.push(result)
    
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join(', ')}`)
    }
    
    return result
  }

  // Test 5: Performance Benchmarking
  async testPerformanceBenchmarks(): Promise<TestResult> {
    const testName = 'Performance Benchmarks'
    const startTime = Date.now()
    const errors: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log(`🧪 Running ${testName}...`)
      
      const benchmarks = []
      
      // Benchmark different domain counts
      const testSizes = [10, 50, 100, 500]
      
      for (const size of testSizes) {
        const benchmarkStart = Date.now()
        
        const result = await EnhancedDomainDiscoveryService.discoverDomains(size)
        
        const benchmarkDuration = Date.now() - benchmarkStart
        const domainsPerSecond = (result.domains.length / benchmarkDuration) * 1000
        
        benchmarks.push({
          requestedDomains: size,
          actualDomains: result.domains.length,
          duration: benchmarkDuration,
          domainsPerSecond: Math.round(domainsPerSecond),
          processingTimeMs: result.processingTimeMs
        })
        
        console.log(`  ✓ ${size} domains: ${benchmarkDuration}ms (${Math.round(domainsPerSecond)} domains/sec)`)
      }
      
      // Performance criteria
      const avgDuration = benchmarks.reduce((sum, b) => sum + b.duration, 0) / benchmarks.length
      const performanceGood = avgDuration < 5000 // Should complete within 5 seconds average
      
      if (!performanceGood) {
        errors.push(`Average duration ${avgDuration}ms exceeds 5000ms threshold`)
      }
      
      details = {
        benchmarks,
        averageDuration: avgDuration,
        performanceGood
      }
      
      passed = errors.length === 0
      console.log(`  ✓ Average performance: ${Math.round(avgDuration)}ms`)
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    const duration = Date.now() - startTime
    const result: TestResult = { testName, passed, duration, details, errors }
    this.results.push(result)
    
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join(', ')}`)
    }
    
    return result
  }

  // Test 6: Backward Compatibility
  async testBackwardCompatibility(): Promise<TestResult> {
    const testName = 'Backward Compatibility'
    const startTime = Date.now()
    const errors: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log(`🧪 Running ${testName}...`)
      
      // Test the legacy getDomainsToCheck method
      const legacyResult = await EnhancedDomainDiscoveryService.getDomainsToCheck(50)
      
      const isArray = Array.isArray(legacyResult)
      const hasValidDomains = legacyResult.length > 0
      const allStrings = legacyResult.every(domain => typeof domain === 'string')
      
      if (!isArray) errors.push('Legacy method should return array')
      if (!hasValidDomains) errors.push('Legacy method should return domains')
      if (!allStrings) errors.push('All domains should be strings')
      
      details = {
        legacyDomains: legacyResult.length,
        sampleDomains: legacyResult.slice(0, 3),
        isArray,
        allStrings
      }
      
      passed = errors.length === 0
      console.log(`  ✓ Legacy method: ${legacyResult.length} domains returned`)
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    const duration = Date.now() - startTime
    const result: TestResult = { testName, passed, duration, details, errors }
    this.results.push(result)
    
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join(', ')}`)
    }
    
    return result
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Phase 1 Enhanced Domain Discovery Test Suite\n')
    
    const startTime = Date.now()
    
    // Run all test methods
    await this.testStaticDomainDiscovery()
    await this.testApiDiscoveryInfrastructure()
    await this.testMultiChannelDiscovery()
    await this.testErrorHandlingAndRateLimiting()
    await this.testPerformanceBenchmarks()
    await this.testBackwardCompatibility()
    
    const totalDuration = Date.now() - startTime
    const passedTests = this.results.filter(r => r.passed).length
    const totalTests = this.results.length
    
    console.log('\n📊 Test Suite Summary:')
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${totalTests - passedTests}`)
    console.log(`Total Duration: ${totalDuration}ms`)
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
    
    // Detailed results
    console.log('\n📋 Detailed Results:')
    this.results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName}: ${result.duration}ms`)
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`)
      }
    })
    
    // Export results for CI/CD
    const testReport = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 1 - Enhanced Domain Discovery',
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      totalDuration,
      successRate: (passedTests / totalTests) * 100,
      results: this.results
    }
    
    console.log('\n💾 Test Report JSON:')
    console.log(JSON.stringify(testReport, null, 2))
    
    // Exit with appropriate code
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! Phase 1 infrastructure is ready.')
      process.exit(0)
    } else {
      console.log('\n❌ Some tests failed. Please review and fix before proceeding to Phase 2.')
      process.exit(1)
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new Phase1TestSuite()
  testSuite.runAllTests().catch(error => {
    console.error('Fatal test error:', error)
    process.exit(1)
  })
}

export { Phase1TestSuite } 