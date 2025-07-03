# 🧪 LeadPoacher Testing Guide

This document describes the comprehensive testing suite for LeadPoacher, implemented following **PLAN_TESTSCRIPT** principles for phase-based validation with real-environment testing.

## 🎯 Testing Philosophy

Our testing approach follows PLAN_TESTSCRIPT guidelines:

1. **Phase-Based Validation**: Tests are organized into discrete phases that build upon each other
2. **Real-Environment Validation**: Tests run in the actual Next.js/Supabase environment, not mocks
3. **Example-Driven Specs**: Every test uses concrete input/output examples
4. **Observability & Debugging**: Comprehensive logging and error reporting

## 🚀 Quick Start

### Prerequisites
- Node.js and npm installed
- Supabase project configured with environment variables
- All dependencies installed (`npm install`)

### Run All Tests
```bash
npm run test
```

### Run Individual Test Phases
```bash
npm run test:foundation  # Database and server actions
npm run test:scraper     # Email extraction and scraper logic  
npm run test:api         # API routes and integration
npm run test:e2e         # End-to-end user workflow
```

## 📋 Test Phases

### Phase 1: Foundation Tests
**File**: `scripts/test-foundation.ts`  
**Command**: `npm run test:foundation`  
**Critical**: ✅ Yes (failure stops subsequent tests)

**What it validates**:
- ✅ Supabase database connection
- ✅ Company CRUD operations (create, read)
- ✅ Lead CRUD operations (create, read with company joins)
- ✅ Scrape job CRUD operations (create, update status, retrieve)
- ✅ Error handling for invalid inputs
- ✅ Data consistency and foreign key constraints

**Example scenarios tested**:
```typescript
// Company creation and retrieval
const company = await createCompany({ domain: 'test-company.com', name: 'Test Company Ltd' })
const retrieved = await getCompanyByDomain('test-company.com')

// Lead creation with company association
const lead = await createLead({
  company_id: company.id,
  contact_email: 'john@test-company.com',
  contact_name: 'John Doe'
})

// Scrape job workflow
const job = await createScrapeJob({ competitor: 'Test Competitor' })
await updateScrapeJobStatus(job.id, 'running')
```

### Phase 2: Scraper Service Tests
**File**: `scripts/test-scraper.ts`  
**Command**: `npm run test:scraper`  
**Critical**: ❌ No (can fail without breaking other phases)

**What it validates**:
- ✅ Email extraction from HTML content
- ✅ Company name extraction from page titles and domains
- ✅ Filtering of junk emails (noreply, admin, support)
- ✅ Handling of malformed HTML
- ✅ Edge cases (empty content, very long HTML)
- ✅ Function signatures and return types

**Example scenarios tested**:
```typescript
// Email extraction with proper structure
const leads = extractEmailsFromHTML(htmlContent, 'https://example.com')
// Returns: ExtractedLead[] with email, sourceUrl, domain fields

// Company name from title tags
const name = extractCompanyName('<title>ACME Corp - Home</title>', 'acme.com')
// Returns: "ACME Corp" (cleaned title)

// Junk email filtering
const leads = extractEmailsFromHTML(htmlWithJunk, sourceUrl)
// Filters out: noreply@, admin@, support@ emails
```

### Phase 3: API Integration Tests
**File**: `scripts/test-api.ts`  
**Command**: `npm run test:api`  
**Critical**: ✅ Yes (required for end-to-end flow)

**What it validates**:
- ✅ Scrape job creation via server actions
- ✅ Duplicate job prevention logic
- ✅ Job status tracking and retrieval
- ✅ API route structure and exports
- ✅ Error handling for invalid inputs
- ✅ Concurrent operation handling
- ✅ Data consistency across operations

**Example scenarios tested**:
```typescript
// Job creation and duplicate prevention
const job1 = await createScrapeJob({ competitor: 'Test Company' })
const job2 = await createScrapeJob({ competitor: 'Test Company' }) // Should prevent duplicate

// Job retrieval and status tracking
const retrieved = await getScrapeJobById(job1.id)
// Verifies: ID consistency, state validity, timestamp accuracy

// Concurrent job creation
const promises = [
  createScrapeJob({ competitor: 'Company A' }),
  createScrapeJob({ competitor: 'Company B' }),
  createScrapeJob({ competitor: 'Company C' })
]
const results = await Promise.all(promises)
```

### Phase 4: End-to-End Tests
**File**: `scripts/test-e2e.ts`  
**Command**: `npm run test:e2e`  
**Critical**: ❌ No (integration tests, failure acceptable)

**What it validates**:
- ✅ Complete user workflow simulation
- ✅ Form submission to job creation
- ✅ Job progress tracking over time
- ✅ Data display and pagination
- ✅ Error scenarios in user workflow
- ✅ Multi-user concurrent scenarios
- ✅ Data integrity throughout operations

**Example scenarios tested**:
```typescript
// Complete user journey
1. User loads dashboard → getAllLeadsWithCompany()
2. User submits form → createScrapeJob()
3. User checks status → getScrapeJobById()
4. User sees results → getAllLeadsWithCompany()

// Multi-user simulation
const users = ['User1', 'User2', 'User3']
const jobs = await Promise.all(
  users.map(user => createScrapeJob({ competitor: `${user} Company` }))
)
```

## 📊 Test Output & Observability

### Structured Logging
All tests emit structured JSON logs for monitoring:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "operation": "test_phase_complete", 
  "data": {
    "phase": "Foundation",
    "success": true,
    "duration": 1250,
    "testsRun": 15,
    "testsPassed": 15
  },
  "success": true,
  "error": null
}
```

### Test Report
The master test runner generates comprehensive reports:

```
📊 TEST EXECUTION REPORT
======================================================================
🕐 Total Duration: 8450ms
✅ Phases Passed: 4
❌ Phases Failed: 0  
📈 Success Rate: 100.0%

📋 Phase Details:
  ✅ PASS Foundation (1250ms)
  ✅ PASS Scraper Service (2100ms)
  ✅ PASS API Integration (1800ms) 
  ✅ PASS End-to-End (3300ms)
```

## 🔧 Configuration

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Test Data Management
Tests create temporary data with timestamps to avoid conflicts:
- Company domains: `test-company-${timestamp}.com`
- Competitor names: `Test Competitor ${timestamp}`
- Lead emails: `test-${timestamp}@example.com`

## 🚨 Troubleshooting

### Common Issues

**"Missing environment variables"**
- Ensure `.env.local` has Supabase credentials
- Check that environment is loaded in test runner

**"Database connection failed"**  
- Verify Supabase project is active
- Check network connectivity
- Confirm database URL is correct

**"Job creation failed"**
- Check database schema migrations are applied
- Verify foreign key constraints
- Ensure required columns exist

**"Scraper tests fail"**
- Verify scraper service exports match imports
- Check function signatures in `services/scraper/index.ts`
- Ensure HTML parsing handles edge cases

### Debug Mode
Add detailed logging by setting environment variable:
```bash
DEBUG=true npm run test
```

## 🎯 Success Criteria

For MVP validation, tests must satisfy:

✅ **Foundation Phase**: 100% pass rate (critical)  
✅ **API Integration Phase**: 100% pass rate (critical)  
⚠️ **Scraper Service Phase**: >80% pass rate (acceptable)  
⚠️ **End-to-End Phase**: >70% pass rate (acceptable)

### What Passing Tests Guarantee

✅ Database operations work correctly  
✅ Server actions handle CRUD operations  
✅ API routes accept and process requests  
✅ Form submission creates valid jobs  
✅ Data retrieval works for UI display  
✅ Error handling prevents crashes  
✅ Multi-user scenarios are supported  

## 📈 Continuous Integration

Tests are designed for CI/CD integration:

```bash
# Install dependencies
npm install

# Run tests with proper exit codes
npm run test
# Exit code 0 = success, 1 = failure

# Individual phase testing for targeted validation
npm run test:foundation  # Quick database validation
npm run test:api         # API endpoint validation
```

## 🔄 Extending Tests

To add new test scenarios:

1. **Add to existing phase**: Extend relevant test file
2. **Create new phase**: Add new test file + update master runner
3. **Follow patterns**: Use `testExample()` wrapper for consistency
4. **Include observability**: Add structured logging
5. **Test both success and failure cases**

Example new test:
```typescript
await testExample('Your Test Name', async () => {
  // Arrange
  const input = { /* test data */ }
  
  // Act  
  const result = await yourFunction(input)
  
  // Assert
  if (result.error) {
    throw new Error(`Expected success, got: ${result.error}`)
  }
  
  if (!result.data) {
    throw new Error('Expected data to be returned')
  }
  
  return result.data
})
```

---

This testing suite ensures LeadPoacher functions correctly across all components and user scenarios, providing confidence for production deployment. 