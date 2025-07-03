#!/usr/bin/env tsx
/**
 * Master Test Runner - PLAN_TESTSCRIPT Validation
 * Executes all test phases with observability and real-environment validation
 * Usage: npx tsx scripts/run-all-tests.ts
 */

import { testFoundation } from './test-foundation'
import { testScraper } from './test-scraper'
import { testApi } from './test-api'
import { testE2E } from './test-e2e'

interface TestPhase {
  name: string
  description: string
  testFunction: () => Promise<void>
  critical: boolean // If true, failure stops all subsequent tests
}

interface TestResult {
  phase: string
  success: boolean
  duration: number
  error?: string
  details?: any
}

class TestRunner {
  private results: TestResult[] = []
  private startTime: number = 0

  private log(level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN', message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const emoji = {
      'INFO': 'ℹ️',
      'SUCCESS': '✅',
      'ERROR': '❌',
      'WARN': '⚠️'
    }[level]
    
    console.log(`${emoji} [${timestamp}] ${message}`)
    
    if (data) {
      console.log(JSON.stringify({
        timestamp,
        level,
        message,
        data
      }, null, 2))
    }
  }

  private async runPhase(phase: TestPhase): Promise<TestResult> {
    const phaseStartTime = Date.now()
    
    this.log('INFO', `Starting Phase: ${phase.name}`)
    this.log('INFO', `Description: ${phase.description}`)
    
    try {
      await phase.testFunction()
      
      const duration = Date.now() - phaseStartTime
      const result: TestResult = {
        phase: phase.name,
        success: true,
        duration
      }
      
      this.log('SUCCESS', `Phase "${phase.name}" PASSED (${duration}ms)`)
      return result
      
    } catch (error) {
      const duration = Date.now() - phaseStartTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      const result: TestResult = {
        phase: phase.name,
        success: false,
        duration,
        error: errorMessage
      }
      
      this.log('ERROR', `Phase "${phase.name}" FAILED (${duration}ms)`)
      this.log('ERROR', `Error: ${errorMessage}`)
      
      if (phase.critical) {
        this.log('ERROR', `Critical phase failed - stopping all tests`)
        throw new Error(`Critical phase "${phase.name}" failed: ${errorMessage}`)
      }
      
      return result
    }
  }

  private generateTestReport(): void {
    const totalDuration = Date.now() - this.startTime
    const passedTests = this.results.filter(r => r.success)
    const failedTests = this.results.filter(r => !r.success)
    
    console.log('\n' + '='.repeat(70))
    console.log('📊 TEST EXECUTION REPORT')
    console.log('='.repeat(70))
    
    console.log(`🕐 Total Duration: ${totalDuration}ms`)
    console.log(`✅ Phases Passed: ${passedTests.length}`)
    console.log(`❌ Phases Failed: ${failedTests.length}`)
    console.log(`📈 Success Rate: ${((passedTests.length / this.results.length) * 100).toFixed(1)}%`)
    
    console.log('\n📋 Phase Details:')
    for (const result of this.results) {
      const status = result.success ? '✅ PASS' : '❌ FAIL'
      console.log(`  ${status} ${result.phase} (${result.duration}ms)`)
      if (result.error) {
        console.log(`    Error: ${result.error}`)
      }
    }
    
    if (failedTests.length > 0) {
      console.log('\n🚨 FAILED PHASES SUMMARY:')
      for (const failed of failedTests) {
        console.log(`  ❌ ${failed.phase}: ${failed.error}`)
      }
    }
    
    console.log('\n' + '='.repeat(70))
    
    // Observability: Structured log for automated parsing
    const report = {
      timestamp: new Date().toISOString(),
      operation: 'test_execution_complete',
      totalDuration,
      totalPhases: this.results.length,
      passedPhases: passedTests.length,
      failedPhases: failedTests.length,
      successRate: (passedTests.length / this.results.length) * 100,
      phases: this.results,
      success: failedTests.length === 0
    }
    
    this.log('INFO', 'Test execution complete', report)
  }

  private async checkPrerequisites(): Promise<void> {
    this.log('INFO', 'Checking test prerequisites...')
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }
    
    // Check file system
    const fs = require('fs')
    const path = require('path')
    
    const requiredFiles = [
      'lib/supabaseClient.ts',
      'lib/actions/index.ts',
      'services/scraper/index.ts',
      'app/api/scrape/route.ts'
    ]
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file)
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file not found: ${file}`)
      }
    }
    
    this.log('SUCCESS', 'All prerequisites satisfied')
  }

  async runAllTests(): Promise<boolean> {
    this.startTime = Date.now()
    
    try {
      // PLAN_TESTSCRIPT Principle: Real-Environment Validation
      await this.checkPrerequisites()
      
      // PLAN_TESTSCRIPT Principle: Phase-Based Validation
      const phases: TestPhase[] = [
        {
          name: 'Foundation',
          description: 'Database connections, schema, and server actions',
          testFunction: testFoundation,
          critical: true // Must pass for other phases to work
        },
        {
          name: 'Scraper Service',
          description: 'Email extraction, company name parsing, and scraper logic',
          testFunction: testScraper,
          critical: false // Can fail without breaking other phases
        },
        {
          name: 'API Integration',
          description: 'API routes, form integration, and data flow',
          testFunction: testApi,
          critical: true // Required for end-to-end flow
        },
        {
          name: 'End-to-End',
          description: 'Complete user workflow and data display',
          testFunction: testE2E,
          critical: false // Integration tests, failure acceptable
        }
      ]
      
      this.log('INFO', `Starting test execution with ${phases.length} phases`)
      
      // PLAN_TESTSCRIPT Principle: Example-Driven Specs
      // Each phase tests concrete input/output examples
      for (const phase of phases) {
        const result = await this.runPhase(phase)
        this.results.push(result)
        
        // Allow small delay between phases for system stability
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // PLAN_TESTSCRIPT Principle: Observability & Debugging
      this.generateTestReport()
      
      const allPassed = this.results.every(r => r.success)
      
      if (allPassed) {
        this.log('SUCCESS', '🎉 ALL TESTS PASSED - LeadPoacher implementation validated!')
        return true
      } else {
        this.log('WARN', '⚠️ Some tests failed - check report for details')
        return false
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.log('ERROR', `Test execution failed: ${errorMessage}`)
      
      this.generateTestReport()
      return false
    }
  }
}

async function main() {
  console.log('🧪 LEADPOACHER IMPLEMENTATION VALIDATION')
  console.log('Following PLAN_TESTSCRIPT principles for comprehensive testing')
  console.log('='.repeat(70))
  
  const runner = new TestRunner()
  const success = await runner.runAllTests()
  
  // Exit with appropriate code for CI/CD integration
  process.exit(success ? 0 : 1)
}

// PLAN_TESTSCRIPT Principle: Real-Environment Validation
// This script tests in the actual Next.js/Supabase environment
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { TestRunner } 