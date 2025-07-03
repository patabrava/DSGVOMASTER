#!/usr/bin/env tsx
/**
 * Foundation Test Script - Phase 1 Validation
 * Tests: Database connections, schema, server actions
 * Usage: npx tsx scripts/test-foundation.ts
 */

import { createServerSupabaseClient } from '../lib/supabaseClient'
import { createCompany, getCompanyByDomain, createLead, getAllLeadsWithCompany } from '../lib/actions'
import { createScrapeJob, updateScrapeJobStatus, getScrapeJobById } from '../lib/actions'

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

async function testDatabaseConnection() {
  log('FOUNDATION', 'Testing Supabase database connection...')
  
  await testExample('Database Connection', async () => {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from('companies').select('count').limit(1)
    
    if (error) throw new Error(`Database connection failed: ${error.message}`)
    return data
  })
}

async function testCompanyCRUD() {
  log('FOUNDATION', 'Testing Company CRUD operations...')
  
  const testCompany = {
    domain: `test-company-${Date.now()}.com`,
    name: `Test Company Ltd ${Date.now()}`
  }
  
  // Test Create
  const createResult = await testExample('Create Company', async () => {
    const result = await createCompany(testCompany)
    if (result.error) throw new Error(result.error)
    if (!result.data) throw new Error('No company data returned')
    return result.data
  })
  
  // Test Read
  await testExample('Get Company by Domain', async () => {
    const result = await getCompanyByDomain(testCompany.domain)
    if (result.error) throw new Error(result.error)
    if (!result.data) throw new Error('Company not found')
    if (result.data.domain !== testCompany.domain) {
      throw new Error('Retrieved company domain mismatch')
    }
    return result.data
  })
  
  return createResult
}

async function testLeadCRUD(companyId: string) {
  log('FOUNDATION', 'Testing Lead CRUD operations...')
  
  const testLead = {
    company_id: companyId,
    contact_name: 'John Doe',
    contact_email: `john-${Date.now()}@test-company.com`,
    source_url: 'https://test-company.com/contact',
    status: 'new' as const,
    note: 'Test lead for validation'
  }
  
  // Test Create Lead
  const createResult = await testExample('Create Lead', async () => {
    const result = await createLead(testLead)
    if (result.error) throw new Error(result.error)
    if (!result.data) throw new Error('No lead data returned')
    return result.data
  })
  
  // Test Get Leads with Company
  await testExample('Get Leads with Company Info', async () => {
    const result = await getAllLeadsWithCompany(10, 0)
    if (result.error) throw new Error(result.error)
    if (!result.data) throw new Error('No leads data returned')
    
    // Find our test lead
    const testLeadFound = result.data.find(lead => 
      lead.contact_email === testLead.contact_email
    )
    
    if (!testLeadFound) throw new Error('Test lead not found in results')
    if (!testLeadFound.company) throw new Error('Company data missing from lead')
    
    return testLeadFound
  })
  
  return createResult
}

async function testScrapeJobCRUD() {
  log('FOUNDATION', 'Testing Scrape Job CRUD operations...')
  
  const testJob = {
    competitor: `Test Competitor Inc ${Date.now()}`
  }
  
  // Test Create Job
  const createResult = await testExample('Create Scrape Job', async () => {
    const result = await createScrapeJob(testJob)
    if (result.error) throw new Error(result.error)
    if (!result.data) throw new Error('No job data returned')
    if (result.data.state !== 'queued') throw new Error('Job not in queued state')
    return result.data
  })
  
  // Test Update Job Status
  await testExample('Update Job Status', async () => {
    const result = await updateScrapeJobStatus(createResult.id, 'running')
    if (result.error) throw new Error(result.error)
    if (!result.data) throw new Error('No updated job data returned')
    if (result.data.state !== 'running') throw new Error('Job state not updated')
    return result.data
  })
  
  // Test Get Job
  await testExample('Get Scrape Job by ID', async () => {
    const result = await getScrapeJobById(createResult.id)
    if (result.error) throw new Error(result.error)
    if (!result.data) throw new Error('Job not found')
    if (result.data.state !== 'running') throw new Error('Job state incorrect')
    return result.data
  })
  
  return createResult
}

async function testErrorHandling() {
  log('FOUNDATION', 'Testing error handling scenarios...')
  
  // Test invalid company creation
  await testExample('Invalid Company Creation', async () => {
    const result = await createCompany({ domain: '', name: '' })
    if (!result.error) throw new Error('Expected error for invalid input')
    return result.error
  })
  
  // Test nonexistent company lookup
  await testExample('Nonexistent Company Lookup', async () => {
    const result = await getCompanyByDomain('nonexistent-company-12345.com')
    if (result.error) throw new Error(`Unexpected error: ${result.error}`)
    if (result.data) throw new Error('Expected null for nonexistent company')
    return 'No company found as expected'
  })
  
  // Test invalid lead creation
  await testExample('Invalid Lead Creation', async () => {
    const result = await createLead({
      company_id: 'invalid-id',
      contact_email: 'invalid-email'
    })
    if (!result.error) throw new Error('Expected error for invalid lead')
    return result.error
  })
}

async function main() {
  try {
    console.log('\n🧪 FOUNDATION TESTS - Phase 1 Validation')
    console.log('='.repeat(50))
    
    // Test 1: Database Connection
    await testDatabaseConnection()
    
    // Test 2: Company CRUD
    const company = await testCompanyCRUD()
    
    // Test 3: Lead CRUD  
    const lead = await testLeadCRUD(company.id)
    
    // Test 4: Scrape Job CRUD
    const job = await testScrapeJobCRUD()
    
    // Test 5: Error Handling
    await testErrorHandling()
    
    console.log('\n✅ ALL FOUNDATION TESTS PASSED')
    console.log(`Created test data:`)
    console.log(`- Company: ${company.name} (${company.domain})`)
    console.log(`- Lead: ${lead.contact_name} (${lead.contact_email})`)
    console.log(`- Job: ${job.competitor} (${job.id})`)
    
  } catch (error) {
    console.log('\n❌ FOUNDATION TESTS FAILED')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { main as testFoundation } 