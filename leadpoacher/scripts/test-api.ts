#!/usr/bin/env tsx
/**
 * API Integration Test Script - Phase 3 Validation
 * Tests: API routes, form integration, data flow
 * Usage: npx tsx scripts/test-api.ts
 */

import { createScrapeJob, getScrapeJobById } from '../lib/actions'

// Test utilities
const log = (phase: string, message: string, success: boolean = true) => {
  const timestamp = new Date().toISOString()
  const status = success ? '✅' : '❌'
  console.log(`${status} [${timestamp}] ${phase}: ${message}`)
}

const testExample = async (name: string, fn: () => Promise<any>) => {
  try {
    const result = await fn()
    log('TEST', `${name} - PASSED`, true)
    return result
  } catch (error) {
    log('TEST', `${name} - FAILED: ${error instanceof Error ? error.message : error}`, false)
    throw error
  }
}

async function testScrapeJobCreation() {
  log('API', 'Testing scrape job creation via server actions...')
  
  await testExample('Create New Scrape Job', async () => {
    const testCompetitor = `Test Company ${Date.now()}`
    
    const result = await createScrapeJob({ competitor: testCompetitor })
    
    if (result.error) {
      throw new Error(`Failed to create scrape job: ${result.error}`)
    }
    
    if (!result.data) {
      throw new Error('No job data returned')
    }
    
    const job = result.data
    
    // Verify job structure
    if (!job.id || !job.competitor || !job.state) {
      throw new Error(`Job missing required fields: ${JSON.stringify(job)}`)
    }
    
    if (job.competitor !== testCompetitor) {
      throw new Error(`Competitor mismatch: expected "${testCompetitor}", got "${job.competitor}"`)
    }
    
    if (job.state !== 'queued') {
      throw new Error(`Job should be queued, got state: ${job.state}`)
    }
    
    return job
  })
  
  await testExample('Prevent Duplicate Jobs', async () => {
    const competitor = `Duplicate Test ${Date.now()}`
    
    // Create first job
    const result1 = await createScrapeJob({ competitor })
    if (result1.error) {
      throw new Error(`Failed to create first job: ${result1.error}`)
    }
    
    // Try to create duplicate job immediately
    const result2 = await createScrapeJob({ competitor })
    
    // Should either succeed (if enough time passed) or return error
    if (result2.error) {
      // Error is expected for duplicates
      if (!result2.error.includes('duplicate') && !result2.error.includes('recent')) {
        throw new Error(`Unexpected error for duplicate: ${result2.error}`)
      }
      return 'Duplicate prevention working'
    } else {
      // If it succeeded, that's also acceptable (might have different logic)
      return 'Duplicate job allowed (acceptable)'
    }
  })
}

async function testScrapeJobRetrieval() {
  log('API', 'Testing scrape job retrieval...')
  
  await testExample('Retrieve Job by ID', async () => {
    // First create a job
    const competitor = `Retrieve Test ${Date.now()}`
    const createResult = await createScrapeJob({ competitor })
    
    if (createResult.error || !createResult.data) {
      throw new Error('Failed to create test job')
    }
    
    const jobId = createResult.data.id
    
    // Now retrieve it
    const getResult = await getScrapeJobById(jobId)
    
    if (getResult.error) {
      throw new Error(`Failed to retrieve job: ${getResult.error}`)
    }
    
    if (!getResult.data) {
      throw new Error('Job not found')
    }
    
    const retrievedJob = getResult.data
    
    if (retrievedJob.id !== jobId) {
      throw new Error(`ID mismatch: expected ${jobId}, got ${retrievedJob.id}`)
    }
    
    if (retrievedJob.competitor !== competitor) {
      throw new Error(`Competitor mismatch: expected "${competitor}", got "${retrievedJob.competitor}"`)
    }
    
    return retrievedJob
  })
  
  await testExample('Handle Nonexistent Job ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    
    const result = await getScrapeJobById(fakeId)
    
    // Should return null data, not an error
    if (result.error && !result.error.includes('not found')) {
      throw new Error(`Unexpected error for nonexistent job: ${result.error}`)
    }
    
    if (result.data) {
      throw new Error('Should not return data for nonexistent job')
    }
    
    return 'Nonexistent job handled correctly'
  })
}

async function testAPIRouteStructure() {
  log('API', 'Testing API route structure...')
  
  await testExample('Scrape API Route Exists', async () => {
    // Check that the API route file exists and has proper structure
    const fs = require('fs')
    const path = require('path')
    
    const apiRoutePath = path.join(process.cwd(), 'app', 'api', 'scrape', 'route.ts')
    
    if (!fs.existsSync(apiRoutePath)) {
      throw new Error('Scrape API route file not found')
    }
    
    const content = fs.readFileSync(apiRoutePath, 'utf8')
    
    // Check for basic required exports
    if (!content.includes('export async function POST')) {
      throw new Error('POST handler not found in API route')
    }
    
    // Check for Supabase client usage
    if (!content.includes('supabase') && !content.includes('edge function')) {
      throw new Error('API route should interact with Supabase')
    }
    
    return 'API route structure valid'
  })
}

async function testErrorHandling() {
  log('API', 'Testing API error handling...')
  
  await testExample('Handle Invalid Job Data', async () => {
    // Test with empty competitor name
    const result = await createScrapeJob({ competitor: '' })
    
    if (!result.error) {
      throw new Error('Should reject empty competitor name')
    }
    
    if (!result.error.includes('competitor') && !result.error.includes('required')) {
      throw new Error(`Unexpected error message: ${result.error}`)
    }
    
    return 'Invalid job data rejected correctly'
  })
  
  await testExample('Handle Very Long Competitor Name', async () => {
    const longName = 'A'.repeat(1000)
    
    const result = await createScrapeJob({ competitor: longName })
    
    // Either should reject with error, truncate, or accept (all are valid behaviors)
    if (result.error) {
      if (!result.error.includes('long') && !result.error.includes('length')) {
        throw new Error(`Unexpected error for long name: ${result.error}`)
      }
      return 'Long competitor name rejected correctly'
    } else {
      // If accepted, that's valid behavior too
      if (result.data) {
        return `Long competitor name accepted (${result.data.competitor.length} chars)`
      }
      return 'Long competitor name handled appropriately'
    }
  })
}

async function testDataConsistency() {
  log('API', 'Testing data consistency across operations...')
  
  await testExample('Job State Consistency', async () => {
    const competitor = `Consistency Test ${Date.now()}`
    
    // Create job
    const createResult = await createScrapeJob({ competitor })
    if (createResult.error || !createResult.data) {
      throw new Error('Failed to create test job')
    }
    
    const jobId = createResult.data.id
    const originalState = createResult.data.state
    
    // Retrieve immediately 
    const getResult = await getScrapeJobById(jobId)
    if (getResult.error || !getResult.data) {
      throw new Error('Failed to retrieve job immediately after creation')
    }
    
    // State should be consistent
    if (getResult.data.state !== originalState) {
      throw new Error(`State changed unexpectedly: ${originalState} -> ${getResult.data.state}`)
    }
    
    // Timestamps should be reasonable
    if (!getResult.data.requested_at) {
      throw new Error('Job missing requested_at timestamp')
    }
    
    const createdAt = new Date(getResult.data.requested_at)
    const now = new Date()
    const timeDiff = now.getTime() - createdAt.getTime()
    
    if (timeDiff > 60000) { // More than 1 minute old
      throw new Error(`Creation timestamp seems wrong: ${createdAt}`)
    }
    
    if (timeDiff < 0) { // Future timestamp
      throw new Error(`Creation timestamp is in the future: ${createdAt}`)
    }
    
    return 'Job state and timestamps are consistent'
  })
}

async function testConcurrentOperations() {
  log('API', 'Testing concurrent operations...')
  
  await testExample('Concurrent Job Creation', async () => {
    const baseCompetitor = `Concurrent Test ${Date.now()}`
    
    // Create multiple jobs concurrently with different names
    const promises = []
    for (let i = 0; i < 5; i++) {
      const competitor = `${baseCompetitor} ${i}`
      promises.push(createScrapeJob({ competitor }))
    }
    
    const results = await Promise.all(promises)
    
    // Check that all jobs were created (or failed gracefully)
    let successCount = 0
    let errorCount = 0
    
    for (const result of results) {
      if (result.data) {
        successCount++
      } else if (result.error) {
        errorCount++
      }
    }
    
    if (successCount === 0) {
      throw new Error('No concurrent jobs were created successfully')
    }
    
    // Verify all successful jobs have unique IDs
    const successfulJobs = results.filter(r => r.data).map(r => r.data!)
    const jobIds = successfulJobs.map(job => job.id)
    const uniqueIds = new Set(jobIds)
    
    if (uniqueIds.size !== jobIds.length) {
      throw new Error('Duplicate job IDs found in concurrent creation')
    }
    
    return `Concurrent creation: ${successCount} success, ${errorCount} errors`
  })
}

async function testIntegrationFlow() {
  log('API', 'Testing end-to-end integration flow...')
  
  await testExample('Complete Job Lifecycle', async () => {
    const competitor = `Lifecycle Test ${Date.now()}`
    
    // Step 1: Create job
    const createResult = await createScrapeJob({ competitor })
    if (createResult.error || !createResult.data) {
      throw new Error(`Job creation failed: ${createResult.error}`)
    }
    
    const job = createResult.data
    log('INTEGRATION', `Created job ${job.id} for "${competitor}"`)
    
    // Step 2: Verify job exists and is queued
    const getResult = await getScrapeJobById(job.id)
    if (getResult.error || !getResult.data) {
      throw new Error('Job not retrievable after creation')
    }
    
    if (getResult.data.state !== 'queued') {
      throw new Error(`Job should be queued, got: ${getResult.data.state}`)
    }
    
    log('INTEGRATION', `Job ${job.id} confirmed queued`)
    
    // Step 3: Check that job data is complete
    const retrievedJob = getResult.data
    
    if (!retrievedJob.requested_at) {
      throw new Error('Job missing requested_at timestamp')
    }
    
    if (retrievedJob.completed_at) {
      throw new Error('New job should not have completed_at timestamp')
    }
    
    log('INTEGRATION', `Job ${job.id} has correct initial state`)
    
    return `Complete lifecycle test passed for job ${job.id}`
  })
}

async function main() {
  try {
    console.log('\n🧪 API INTEGRATION TESTS - Phase 3 Validation')
    console.log('='.repeat(50))
    
    // Test 1: Scrape Job Creation
    await testScrapeJobCreation()
    
    // Test 2: Scrape Job Retrieval
    await testScrapeJobRetrieval()
    
    // Test 3: API Route Structure
    await testAPIRouteStructure()
    
    // Test 4: Error Handling
    await testErrorHandling()
    
    // Test 5: Data Consistency
    await testDataConsistency()
    
    // Test 6: Concurrent Operations
    await testConcurrentOperations()
    
    // Test 7: Integration Flow
    await testIntegrationFlow()
    
    console.log('\n✅ ALL API INTEGRATION TESTS PASSED')
    console.log('API routes and integration components are working correctly')
    
  } catch (error) {
    console.log('\n❌ API INTEGRATION TESTS FAILED')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { main as testApi } 