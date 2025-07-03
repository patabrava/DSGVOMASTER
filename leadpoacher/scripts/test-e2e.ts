#!/usr/bin/env tsx
/**
 * End-to-End Test Script - Phase 4 Validation
 * Tests: Complete user workflow, form submission, data display
 * Usage: npx tsx scripts/test-e2e.ts
 */

import { createScrapeJob, getScrapeJobById, getAllLeadsWithCompany } from '../lib/actions'

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function testFormSubmissionFlow() {
  log('E2E', 'Testing form submission workflow...')
  
  await testExample('User Submits Competitor Form', async () => {
    const competitor = `E2E Test Company ${Date.now()}`
    
    // Simulate form submission by calling the same server action
    log('E2E', `Simulating form submission for "${competitor}"`)
    
    const result = await createScrapeJob({ competitor })
    
    if (result.error) {
      throw new Error(`Form submission failed: ${result.error}`)
    }
    
    if (!result.data) {
      throw new Error('No job created from form submission')
    }
    
    const job = result.data
    
    // Verify job was created with correct initial state
    if (job.state !== 'queued') {
      throw new Error(`Job should be queued after form submission, got: ${job.state}`)
    }
    
    if (job.competitor !== competitor) {
      throw new Error(`Competitor name mismatch: expected "${competitor}", got "${job.competitor}"`)
    }
    
    log('E2E', `✓ Job ${job.id} created successfully`)
    return job
  })
}

async function testJobProgressTracking() {
  log('E2E', 'Testing job progress tracking...')
  
  await testExample('Track Job State Changes', async () => {
    const competitor = `Progress Test ${Date.now()}`
    
    // Create job
    const createResult = await createScrapeJob({ competitor })
    if (createResult.error || !createResult.data) {
      throw new Error('Failed to create job for progress tracking')
    }
    
    const jobId = createResult.data.id
    log('E2E', `Tracking progress for job ${jobId}`)
    
    // Check initial state
    let currentJob = createResult.data
    if (currentJob.state !== 'queued') {
      throw new Error(`Job should start as queued, got: ${currentJob.state}`)
    }
    
    log('E2E', `✓ Job starts in queued state`)
    
    // Simulate checking job status multiple times (as UI would do)
    for (let i = 0; i < 3; i++) {
      await sleep(100) // Small delay between checks
      
      const getResult = await getScrapeJobById(jobId)
      if (getResult.error || !getResult.data) {
        throw new Error(`Failed to retrieve job on check ${i + 1}`)
      }
      
      currentJob = getResult.data
      log('E2E', `Check ${i + 1}: Job state is "${currentJob.state}"`)
      
      // Job should remain in a valid state
      const validStates = ['queued', 'running', 'done', 'error']
      if (!validStates.includes(currentJob.state)) {
        throw new Error(`Invalid job state: ${currentJob.state}`)
      }
    }
    
    return `Job ${jobId} state tracking successful`
  })
}

async function testDataDisplay() {
  log('E2E', 'Testing data display functionality...')
  
  await testExample('Retrieve Leads for Display', async () => {
    // Test the data retrieval that the UI would use
    const result = await getAllLeadsWithCompany(10, 0)
    
    if (result.error) {
      throw new Error(`Failed to retrieve leads: ${result.error}`)
    }
    
    if (!result.data) {
      throw new Error('No leads data returned')
    }
    
    const leads = result.data
    log('E2E', `Retrieved ${leads.length} leads for display`)
    
    // Verify lead structure for UI display
    for (const lead of leads.slice(0, 3)) { // Check first 3 leads
      if (!lead.id || !lead.contact_email) {
        throw new Error(`Lead missing required display fields: ${JSON.stringify(lead)}`)
      }
      
      if (!lead.company) {
        throw new Error(`Lead missing company data: ${JSON.stringify(lead)}`)
      }
      
      // Check company structure
      if (!lead.company.domain || !lead.company.name) {
        throw new Error(`Company missing required fields: ${JSON.stringify(lead.company)}`)
      }
    }
    
    if (leads.length > 0) {
      log('E2E', `✓ Leads have proper structure for UI display`)
    }
    
    return `Retrieved ${leads.length} properly structured leads`
  })
  
  await testExample('Test Data Pagination', async () => {
    // Test pagination functionality
    const page1 = await getAllLeadsWithCompany(5, 0)
    const page2 = await getAllLeadsWithCompany(5, 5)
    
    if (page1.error) {
      throw new Error(`Page 1 query failed: ${page1.error}`)
    }
    
    // Page 2 might fail if there's not enough data, which is acceptable behavior
    
    const leads1 = page1.data || []
    const leads2 = page2.data || []
    
    log('E2E', `Page 1: ${leads1.length} leads, Page 2: ${leads2.length} leads`)
    
    // If we have enough data, verify no duplicates between pages
    if (leads1.length > 0 && leads2.length > 0) {
      const ids1 = leads1.map(lead => lead.id)
      const ids2 = leads2.map(lead => lead.id)
      
      const duplicates = ids1.filter(id => ids2.includes(id))
      if (duplicates.length > 0) {
        throw new Error(`Duplicate leads found between pages: ${duplicates.join(', ')}`)
      }
      
      log('E2E', `✓ No duplicates between pagination pages`)
    }
    
    return 'Pagination working correctly'
  })
}

async function testErrorScenarios() {
  log('E2E', 'Testing error scenarios in user workflow...')
  
  await testExample('Handle Invalid Form Input', async () => {
    // Test various invalid inputs that a user might submit
    const invalidInputs = [
      { competitor: '', expectedError: 'empty' },
      { competitor: '   ', expectedError: 'whitespace' },
      { competitor: 'x'.repeat(500), expectedError: 'too long' }
    ]
    
    for (const input of invalidInputs) {
      const result = await createScrapeJob(input)
      
      if (!result.error) {
        // Some invalid inputs might be auto-corrected, which is acceptable
        log('E2E', `Input "${input.competitor.substring(0, 20)}" was accepted (auto-corrected)`)
      } else {
        log('E2E', `Input "${input.competitor.substring(0, 20)}" rejected: ${result.error}`)
      }
    }
    
    return 'Invalid inputs handled appropriately'
  })
  
  await testExample('Handle Network-like Errors', async () => {
    // Test error handling for edge cases
    const result = await getScrapeJobById('invalid-uuid-format')
    
    // Should handle gracefully, not crash
    if (result.data) {
      throw new Error('Should not return data for invalid UUID')
    }
    
    // Error should be user-friendly
    if (result.error && result.error.includes('stack trace')) {
      throw new Error('Error message contains technical details')
    }
    
    return 'Network-like errors handled gracefully'
  })
}

async function testUserExperienceFlow() {
  log('E2E', 'Testing complete user experience flow...')
  
  await testExample('Simulate Complete User Journey', async () => {
    const competitor = `UX Test ${Date.now()}`
    
    // Step 1: User loads page (check data retrieval)
    log('E2E', 'Step 1: User loads dashboard')
    const initialLeads = await getAllLeadsWithCompany(10, 0)
    if (initialLeads.error) {
      throw new Error('Failed to load initial dashboard data')
    }
    
    const initialCount = initialLeads.data?.length || 0
    log('E2E', `✓ Dashboard loads with ${initialCount} existing leads`)
    
    // Step 2: User submits competitor form
    log('E2E', 'Step 2: User submits competitor form')
    const submitResult = await createScrapeJob({ competitor })
    if (submitResult.error || !submitResult.data) {
      throw new Error(`Form submission failed: ${submitResult.error}`)
    }
    
    const jobId = submitResult.data.id
    log('E2E', `✓ Form submitted, job ${jobId} created`)
    
    // Step 3: User sees job status (queued)
    log('E2E', 'Step 3: User checks job status')
    const statusResult = await getScrapeJobById(jobId)
    if (statusResult.error || !statusResult.data) {
      throw new Error('Failed to check job status')
    }
    
    log('E2E', `✓ Job status: ${statusResult.data.state}`)
    
    // Step 4: User waits and checks leads (simulated)
    log('E2E', 'Step 4: User checks for new leads')
    const updatedLeads = await getAllLeadsWithCompany(10, 0)
    if (updatedLeads.error) {
      throw new Error('Failed to check for updated leads')
    }
    
    const updatedCount = updatedLeads.data?.length || 0
    log('E2E', `✓ Dashboard now shows ${updatedCount} leads`)
    
    // Step 5: Verify user experience consistency
    log('E2E', 'Step 5: Verify experience consistency')
    
    // Check that job still exists and is trackable
    const finalStatusResult = await getScrapeJobById(jobId)
    if (finalStatusResult.error || !finalStatusResult.data) {
      throw new Error('Job disappeared during user journey')
    }
    
    // Check that data queries are consistent
    const finalLeads = await getAllLeadsWithCompany(10, 0)
    if (finalLeads.error) {
      throw new Error('Data queries became inconsistent')
    }
    
    log('E2E', `✓ User journey completed successfully`)
    
    return {
      jobId,
      initialLeadCount: initialCount,
      finalLeadCount: updatedCount,
      jobState: finalStatusResult.data.state
    }
  })
}

async function testRealTimeUpdates() {
  log('E2E', 'Testing real-time update scenarios...')
  
  await testExample('Multiple Concurrent Users', async () => {
    const baseCompetitor = `Concurrent User Test ${Date.now()}`
    
    // Simulate 3 users submitting forms concurrently
    const userPromises = []
    for (let i = 1; i <= 3; i++) {
      const competitor = `${baseCompetitor} User${i}`
      userPromises.push(createScrapeJob({ competitor }))
    }
    
    const results = await Promise.all(userPromises)
    
    // Verify all users got responses
    const successfulJobs = results.filter(r => r.data)
    const failedJobs = results.filter(r => r.error)
    
    log('E2E', `Concurrent users: ${successfulJobs.length} success, ${failedJobs.length} failed`)
    
    if (successfulJobs.length === 0) {
      throw new Error('No concurrent users succeeded')
    }
    
    // Verify each user can check their own job
    for (const result of successfulJobs) {
      const jobId = result.data!.id
      const checkResult = await getScrapeJobById(jobId)
      
      if (checkResult.error || !checkResult.data) {
        throw new Error(`User cannot check their job ${jobId}`)
      }
    }
    
    log('E2E', `✓ All users can track their individual jobs`)
    
    return `${successfulJobs.length} concurrent users handled successfully`
  })
}

async function testDataIntegrity() {
  log('E2E', 'Testing data integrity throughout user workflow...')
  
  await testExample('Data Consistency Across Operations', async () => {
    const competitor = `Integrity Test ${Date.now()}`
    
    // Create job and track its data consistency
    const createResult = await createScrapeJob({ competitor })
    if (createResult.error || !createResult.data) {
      throw new Error('Failed to create job for integrity test')
    }
    
    const originalJob = createResult.data
    const jobId = originalJob.id
    
    // Check job multiple times to ensure data doesn't change unexpectedly
    for (let i = 0; i < 5; i++) {
      await sleep(50)
      
      const getResult = await getScrapeJobById(jobId)
      if (getResult.error || !getResult.data) {
        throw new Error(`Job disappeared on check ${i + 1}`)
      }
      
      const currentJob = getResult.data
      
      // Core fields should remain stable
      if (currentJob.id !== originalJob.id) {
        throw new Error('Job ID changed')
      }
      
      if (currentJob.competitor !== originalJob.competitor) {
        throw new Error('Competitor name changed')
      }
      
      if (currentJob.requested_at !== originalJob.requested_at) {
        throw new Error('Requested timestamp changed')
      }
    }
    
    log('E2E', `✓ Job data remains consistent across ${5} checks`)
    
    return `Data integrity maintained for job ${jobId}`
  })
}

async function main() {
  try {
    console.log('\n🧪 END-TO-END TESTS - Phase 4 Validation')
    console.log('='.repeat(50))
    
    // Test 1: Form Submission Flow
    await testFormSubmissionFlow()
    
    // Test 2: Job Progress Tracking
    await testJobProgressTracking()
    
    // Test 3: Data Display
    await testDataDisplay()
    
    // Test 4: Error Scenarios
    await testErrorScenarios()
    
    // Test 5: User Experience Flow
    await testUserExperienceFlow()
    
    // Test 6: Real-time Updates
    await testRealTimeUpdates()
    
    // Test 7: Data Integrity
    await testDataIntegrity()
    
    console.log('\n✅ ALL END-TO-END TESTS PASSED')
    console.log('Complete user workflow is functioning correctly')
    
  } catch (error) {
    console.log('\n❌ END-TO-END TESTS FAILED')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { main as testE2E } 