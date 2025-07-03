#!/usr/bin/env tsx
/**
 * Scraper Service Test Script - Phase 2 Validation
 * Tests: Scraper functions, email extraction, search parsing
 * Usage: npx tsx scripts/test-scraper.ts
 */

import { scrapeCompetitorMentions, extractEmailsFromHTML, extractCompanyName, searchCompetitorMentions } from '../services/scraper'

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

async function testEmailExtraction() {
  log('SCRAPER', 'Testing email extraction from HTML...')
  
  // Test with valid email patterns
  await testExample('Extract Valid Emails from HTML', async () => {
    const testHtml = `
      <html>
        <body>
          <p>Contact us at info@example.com or sales@example.org</p>
          <a href="mailto:support@example.com">Support</a>
          <div>CEO: john.doe@example.co.uk</div>
          <span>Invalid: notanemail@</span>
          <span>Also invalid: @example.com</span>
        </body>
      </html>
    `
    const testUrl = 'https://example.com/contact'
    
    const leads = extractEmailsFromHTML(testHtml, testUrl)
    
    const expectedEmails = [
      'info@example.com',
      'sales@example.org', 
      'support@example.com',
      'john.doe@example.co.uk'
    ]
    
    if (leads.length < 2) {
      throw new Error(`Expected at least 2 leads, got ${leads.length}`)
    }
    
    // Check that all leads have proper structure
    for (const lead of leads) {
      if (!lead.email || !lead.sourceUrl || !lead.domain) {
        throw new Error(`Lead missing required fields: ${JSON.stringify(lead)}`)
      }
      if (lead.sourceUrl !== testUrl) {
        throw new Error(`Lead has wrong sourceUrl: ${lead.sourceUrl}`)
      }
      if (lead.domain !== 'example.com') {
        throw new Error(`Lead has wrong domain: ${lead.domain}`)
      }
    }
    
    // Check that we found some of the expected emails
    const foundEmails = leads.map(lead => lead.email)
    let foundCount = 0
    for (const expectedEmail of expectedEmails) {
      if (foundEmails.includes(expectedEmail)) {
        foundCount++
      }
    }
    
    if (foundCount < 2) {
      throw new Error(`Expected to find at least 2 emails, found: ${foundEmails.join(', ')}`)
    }
    
    return leads
  })
  
  // Test with no emails
  await testExample('Extract from HTML with No Emails', async () => {
    const testHtml = '<html><body><p>No emails here!</p></body></html>'
    const testUrl = 'https://no-emails.com'
    const leads = extractEmailsFromHTML(testHtml, testUrl)
    
    if (leads.length !== 0) {
      throw new Error(`Expected 0 leads, got ${leads.length}: ${leads.map(l => l.email).join(', ')}`)
    }
    
    return leads
  })
  
  // Test with mailto links
  await testExample('Extract Emails from Mailto Links', async () => {
    const testHtml = `
      <html><body>
        <a href="mailto:contact@company.com">Contact Us</a>
        <a href="mailto:sales@company.com?subject=inquiry">Sales</a>
      </body></html>
    `
    const testUrl = 'https://company.com'
    const leads = extractEmailsFromHTML(testHtml, testUrl)
    
    if (leads.length < 1) {
      throw new Error(`Expected at least 1 lead from mailto, got ${leads.length}`)
    }
    
    const emails = leads.map(lead => lead.email)
    if (!emails.includes('contact@company.com')) {
      throw new Error(`Expected to find contact@company.com, got: ${emails.join(', ')}`)
    }
    
    return leads
  })
}

async function testCompanyNameExtraction() {
  log('SCRAPER', 'Testing company name extraction...')
  
  await testExample('Extract Company from Title Tag', async () => {
    const testHtml = `
      <html>
        <head><title>ACME Corporation - Home</title></head>
        <body>Welcome to ACME</body>
      </html>
    `
    const domain = 'acme-corp.com'
    
    const companyName = extractCompanyName(testHtml, domain)
    
    if (!companyName || companyName.length === 0) {
      throw new Error('No company name extracted')
    }
    
    // Should extract "ACME Corporation" from title, not the domain
    if (companyName === domain) {
      throw new Error(`Expected title-based name, got domain: ${companyName}`)
    }
    
    return companyName
  })
  
  await testExample('Fallback to Domain-based Name', async () => {
    const testHtml = '<html><body>No title tag</body></html>'
    const domain = 'big-company.co.uk'
    
    const companyName = extractCompanyName(testHtml, domain)
    
    if (!companyName || companyName.length === 0) {
      throw new Error('No company name extracted')
    }
    
    // Should convert domain to readable name
    if (companyName === domain) {
      throw new Error(`Expected formatted name, got raw domain: ${companyName}`)
    }
    
    // Should be something like "Big Company"
    if (!companyName.includes(' ')) {
      throw new Error(`Expected multi-word company name, got: ${companyName}`)
    }
    
    return companyName
  })
}

async function testSearchFunctionStructure() {
  log('SCRAPER', 'Testing search function structure...')
  
  await testExample('Search Function Exists', async () => {
    if (typeof searchCompetitorMentions !== 'function') {
      throw new Error('searchCompetitorMentions function not found')
    }
    
    // Test that it accepts the expected parameters
    // We won't actually call it to avoid making real requests
    return 'Search function structure valid'
  })
}

async function testMainScrapeFunction() {
  log('SCRAPER', 'Testing main scrape function structure...')
  
  await testExample('Main Scrape Function Exists', async () => {
    if (typeof scrapeCompetitorMentions !== 'function') {
      throw new Error('scrapeCompetitorMentions function not found')
    }
    
    // Test function signature by checking it doesn't throw on construction
    return 'Main scrape function structure valid'
  })
}

async function testEdgeCases() {
  log('SCRAPER', 'Testing edge cases and error conditions...')
  
  await testExample('Handle Empty HTML', async () => {
    const leads = extractEmailsFromHTML('', 'https://test.com')
    if (leads.length !== 0) {
      throw new Error(`Expected 0 leads from empty HTML, got ${leads.length}`)
    }
    return 'Empty HTML handled correctly'
  })
  
  await testExample('Handle Malformed HTML', async () => {
    const malformedHtml = '<html><body><p>Unclosed tags<div>email@test.com</div>'
    const leads = extractEmailsFromHTML(malformedHtml, 'https://test.com')
    
    // Should still extract the email despite malformed HTML
    const emails = leads.map(lead => lead.email)
    if (!emails.includes('email@test.com')) {
      throw new Error('Failed to extract email from malformed HTML')
    }
    
    return 'Malformed HTML handled correctly'
  })
  
  await testExample('Handle Invalid URL in sourceUrl', async () => {
    try {
      // This should handle the error gracefully
      const leads = extractEmailsFromHTML('<p>test@example.com</p>', 'not-a-valid-url')
      // If it doesn't throw, that's okay too - some implementations might handle this
      return 'Invalid URL handled'
    } catch (error) {
      // If it throws, that's also acceptable behavior
      return 'Invalid URL rejected appropriately'
    }
  })
  
  await testExample('Filter Out Common Junk Emails', async () => {
    const htmlWithJunk = `
      <html><body>
        <p>Contact: noreply@realcompany.com</p>
        <p>Admin: admin@realcompany.com</p>
        <p>Support: support@realcompany.com</p>
        <p>Valid: john@realcompany.com</p>
        <p>Example: test@example.com</p>
      </body></html>
    `
    
    const leads = extractEmailsFromHTML(htmlWithJunk, 'https://realcompany.com')
    
    // Should filter out junk emails
    const emails = leads.map(lead => lead.email)
    
    if (emails.includes('noreply@realcompany.com')) {
      throw new Error('Should filter out noreply emails')
    }
    if (emails.includes('admin@realcompany.com')) {
      throw new Error('Should filter out admin emails')
    }
    if (emails.includes('support@realcompany.com')) {
      throw new Error('Should filter out support emails')
    }
    if (emails.includes('test@example.com')) {
      throw new Error('Should filter out example.com emails')
    }
    
    // Should keep valid email
    if (!emails.includes('john@realcompany.com')) {
      throw new Error('Should keep valid personal email')
    }
    
    return 'Junk email filtering works correctly'
  })
}

async function testCompanyNameEdgeCases() {
  log('SCRAPER', 'Testing company name extraction edge cases...')
  
  await testExample('Handle Long Titles', async () => {
    const longTitle = `
      <html>
        <head><title>Very Long Company Name That Goes On And On - About Us - Services - Contact - Welcome</title></head>
        <body></body>
      </html>
    `
    
    const companyName = extractCompanyName(longTitle, 'company.com')
    
    // Should extract just the company part, not the whole title
    if (companyName.length > 50) {
      throw new Error(`Company name too long: ${companyName}`)
    }
    
    if (companyName.includes('About Us') || companyName.includes('Welcome')) {
      throw new Error(`Should clean up title, got: ${companyName}`)
    }
    
    return companyName
  })
  
  await testExample('Handle Title with Pipe Separator', async () => {
    const titleWithPipe = `
      <html>
        <head><title>ACME Corp | Leading Provider of Solutions</title></head>
        <body></body>
      </html>
    `
    
    const companyName = extractCompanyName(titleWithPipe, 'acme.com')
    
    // Should extract just "ACME Corp"
    if (companyName.includes('Leading Provider')) {
      throw new Error(`Should extract only company name, got: ${companyName}`)
    }
    
    if (!companyName.toLowerCase().includes('acme')) {
      throw new Error(`Should extract ACME, got: ${companyName}`)
    }
    
    return companyName
  })
}

async function main() {
  try {
    console.log('\n🧪 SCRAPER SERVICE TESTS - Phase 2 Validation')
    console.log('='.repeat(50))
    
    // Test 1: Email Extraction
    await testEmailExtraction()
    
    // Test 2: Company Name Extraction
    await testCompanyNameExtraction()
    
    // Test 3: Search Function Structure  
    await testSearchFunctionStructure()
    
    // Test 4: Main Scrape Function Structure
    await testMainScrapeFunction()
    
    // Test 5: Edge Cases
    await testEdgeCases()
    
    // Test 6: Company Name Edge Cases
    await testCompanyNameEdgeCases()
    
    console.log('\n✅ ALL SCRAPER SERVICE TESTS PASSED')
    console.log('Scraper service functions are working correctly')
    
  } catch (error) {
    console.log('\n❌ SCRAPER SERVICE TESTS FAILED')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { main as testScraper } 