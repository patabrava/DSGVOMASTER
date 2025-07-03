<think>
1. Decompose (NLIR):
   - High-level question: How do I create a granular step-by-step plan to build the LeadPoacher MVP based on the architecture?
   - Sub-questions:
     a. What are the core components that need to be built?
     b. What's the dependency order for building these components?
     c. How can each component be broken into testable, atomic tasks?
     d. What's the minimal viable subset needed for MVP?
     e. How should tasks be prioritized to enable testing between each step?

2. Reason (Structured Responses):
   a. Core components from architecture:
      - Database schema (companies, leads, scrape_jobs tables)
      - Next.js 14 app with App Router
      - Supabase client setup
      - Basic UI components (LeadsTable, CompetitorForm)
      - Edge Function for scraping
      - Server actions for data operations
      - CSV export functionality
      - Realtime updates

   b. Dependency order:
      - Database/Supabase setup first (foundation)
      - Basic Next.js app structure
      - Database schema and types
      - Core UI components
      - Server actions for CRUD operations
      - Edge Function for scraping
      - Advanced features (realtime, CSV export)

   c. Atomic task breakdown approach:
      - Each task should touch only one file or one specific functionality
      - Should be testable in isolation
      - Should have clear acceptance criteria
      - Should not depend on future tasks

   d. MVP subset:
      - Core database tables
      - Basic UI to add competitors and view leads
      - Simple scraping functionality
      - Basic CRUD operations
      - Skip advanced features like realtime updates, CSV export initially

   e. Testing-friendly prioritization:
      - Start with infrastructure that can be verified
      - Build UI components that can be visually tested
      - Add business logic that can be unit tested
      - Integrate components that can be integration tested

3. Reflect:
   - Current state: I understand the architecture and have identified core components
   - What's solved: Component identification and dependency analysis
   - What remains: Create the actual granular task breakdown with specific acceptance criteria

4. Solve:
   - Need to create a detailed task list that follows the MONOCODE principles
   - Each task should be preventively architected with failure modes
   - Each task should be incrementally deliverable
   - Each task should have clear test-first decomposition

5. Refine & Evaluate:
   - Review each task for: Is it small enough? Is it testable? Does it have clear start/end?
   - Ensure dependency order is correct
   - Make sure MVP scope is realistic
   - Check that failure modes are considered

6. AoT-Inspired Dependency Analysis:
   - Independent tasks: Database setup, basic file structure, UI components
   - Dependent tasks: Server actions (need DB), Edge functions (need DB), integration tasks

7. AoT Contraction:
   - Use independent tasks as foundation
   - Contract dependent tasks into logical sequence

8. Iterate:
   - This analysis gives me enough structure to create the detailed plan

9. Final Sanity Check:
   - Did I identify all core components? Yes
   - Does the dependency order make sense? Yes
   - Are tasks small and testable? Need to ensure this in the final plan
   - Does this enable MVP delivery? Yes
</think>

# LeadPoacher MVP Development Plan

## Phase 1: Foundation Setup (Days 1-3)

### Task 1.1: Initialize Project Structure
**Goal:** Create basic Next.js 14 project with required dependencies
**Start:** Empty directory
**End:** Running Next.js app with Supabase packages installed
**Test:** `npm run dev` starts successfully on localhost:3000

**Acceptance Criteria:**
- [ ] Next.js 14 project created with App Router
- [ ] Required packages installed: `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`
- [ ] Basic folder structure matches architecture: `app/`, `components/`, `lib/`, `hooks/`, `services/`
- [ ] TypeScript configured
- [ ] Default Next.js page loads

### Task 1.2: Supabase Project Setup
**Goal:** Configure Supabase project and local development
**Start:** Next.js project with Supabase packages
**End:** Supabase project connected locally
**Test:** `supabase status` shows all services running

**Acceptance Criteria:**
- [ ] Supabase CLI installed
- [ ] New Supabase project created
- [ ] Local Supabase started with `supabase start`
- [ ] Environment variables configured in `.env.local`
- [ ] Database URL accessible

### Task 1.3: Create Supabase Client Configuration
**Goal:** Set up Supabase client for browser and server
**Start:** Running Supabase instance
**End:** Supabase clients configured and exportable
**Test:** Import clients in a test file without errors

**Acceptance Criteria:**
- [ ] `lib/supabaseClient.ts` created with `createBrowserClient` and `createServerClient`
- [ ] Environment variables properly referenced
- [ ] TypeScript types properly configured
- [ ] Test connection to Supabase succeeds

## Phase 2: Database Schema (Days 4-5)

### Task 2.1: Create Companies Table Migration
**Goal:** Define and create companies table
**Start:** Empty database
**End:** Companies table exists with proper schema
**Test:** Can insert/select from companies table

**Acceptance Criteria:**
- [ ] Migration file created: `supabase/migrations/001_create_companies.sql`
- [ ] Table has columns: `id`, `domain`, `name`, `created_at`
- [ ] Primary key and indexes configured
- [ ] Unique constraint on domain
- [ ] Migration runs successfully

### Task 2.2: Create Leads Table Migration
**Goal:** Define and create leads table with foreign key to companies
**Start:** Companies table exists
**End:** Leads table exists with proper relationships
**Test:** Can insert lead with company_id foreign key

**Acceptance Criteria:**
- [ ] Migration file created: `supabase/migrations/002_create_leads.sql`
- [ ] Table has columns: `id`, `company_id`, `contact_name`, `contact_email`, `source_url`, `status`, `note`, `timestamp`
- [ ] Foreign key constraint to companies table
- [ ] Indexes on commonly queried fields
- [ ] Migration runs successfully

### Task 2.3: Create Scrape Jobs Table Migration
**Goal:** Define scrape_jobs table for job queue tracking
**Start:** Companies and leads tables exist
**End:** Scrape jobs table exists
**Test:** Can insert/update scrape job records

**Acceptance Criteria:**
- [ ] Migration file created: `supabase/migrations/003_create_scrape_jobs.sql`
- [ ] Table has columns: `id`, `competitor`, `state`, `requested_at`, `completed_at`
- [ ] State column has enum/check constraint
- [ ] Migration runs successfully

### Task 2.4: Generate TypeScript Types
**Goal:** Generate TypeScript types from database schema
**Start:** Database schema completed
**End:** TypeScript types available for use
**Test:** Can import and use types in TypeScript files

**Acceptance Criteria:**
- [ ] Types generated with `supabase gen types typescript`
- [ ] Types saved to `lib/dbSchema.ts`
- [ ] Types export properly
- [ ] All table types available

## Phase 3: Core UI Components (Days 6-8)

### Task 3.1: Create Basic App Layout
**Goal:** Set up main app layout with navigation
**Start:** Default Next.js layout
**End:** Custom layout with navigation structure
**Test:** Layout renders with navigation elements

**Acceptance Criteria:**
- [ ] `app/layout.tsx` customized with proper metadata
- [ ] Basic navigation structure
- [ ] Global styles applied
- [ ] Layout responsive

### Task 3.2: Create Competitor Search Form Component
**Goal:** Build form for entering competitor domains
**Start:** Basic layout exists
**End:** Form component with validation
**Test:** Form accepts input and shows validation errors

**Acceptance Criteria:**
- [ ] `components/CompetitorForm.tsx` created
- [ ] Form has input field for competitor domain
- [ ] Basic validation (required field, URL format)
- [ ] Submit button with loading state
- [ ] Form is responsive

### Task 3.3: Create Leads Table Component
**Goal:** Build table to display leads data
**Start:** Competitor form exists
**End:** Table component that can display leads
**Test:** Component renders with sample data

**Acceptance Criteria:**
- [ ] `components/LeadsTable.tsx` created
- [ ] Table displays: company name, contact name, email, source URL
- [ ] Responsive table design
- [ ] Empty state handling
- [ ] Loading state handling

### Task 3.4: Create Main Dashboard Page
**Goal:** Combine components into main dashboard
**Start:** Individual components exist
**End:** Dashboard page with form and table
**Test:** Dashboard page renders with all components

**Acceptance Criteria:**
- [ ] `app/page.tsx` updated with dashboard layout
- [ ] CompetitorForm and LeadsTable integrated
- [ ] Basic layout and styling
- [ ] Page loads without errors

## Phase 4: Server Actions & Data Operations (Days 9-11)

### Task 4.1: Create Company CRUD Operations
**Goal:** Build server actions for company management
**Start:** Database schema and types available
**End:** Server actions for company operations
**Test:** Can create/read companies via server actions

**Acceptance Criteria:**
- [ ] Server actions created for: create company, get company by domain
- [ ] Proper error handling and validation
- [ ] TypeScript types used correctly
- [ ] Database operations work correctly

### Task 4.2: Create Lead CRUD Operations
**Goal:** Build server actions for lead management
**Start:** Company operations exist
**End:** Server actions for lead operations
**Test:** Can create/read/update leads via server actions

**Acceptance Criteria:**
- [ ] Server actions created for: create lead, get leads by company, update lead status
- [ ] Proper foreign key handling
- [ ] Input validation
- [ ] Error handling

### Task 4.3: Create Scrape Job Operations
**Goal:** Build server actions for scrape job management
**Start:** Database tables and basic server actions exist
**End:** Server actions for job queue management
**Test:** Can create and update scrape jobs

**Acceptance Criteria:**
- [ ] Server actions for: create scrape job, update job status, get job by ID
- [ ] State management (queued → running → done/error)
- [ ] Proper error handling

### Task 4.4: Connect Form to Server Actions
**Goal:** Wire competitor form to create scrape jobs
**Start:** Server actions and form exist
**End:** Form submission creates scrape job
**Test:** Submitting form creates database record

**Acceptance Criteria:**
- [ ] Form onSubmit calls server action
- [ ] Loading states properly managed
- [ ] Success/error feedback to user
- [ ] Form resets after successful submission

## Phase 5: Basic Scraping Functionality (Days 12-14)

### Task 5.1: Create Basic Scraper Service
**Goal:** Build simple scraper for extracting leads
**Start:** Server actions exist
**End:** Scraper service that can extract emails from URLs
**Test:** Scraper returns email addresses from test URLs

**Acceptance Criteria:**
- [ ] `services/scraper/index.ts` created
- [ ] Function to fetch and parse HTML
- [ ] Email extraction via regex
- [ ] Error handling for failed requests
- [ ] Returns structured data

### Task 5.2: Create Supabase Edge Function
**Goal:** Deploy scraper as Supabase Edge Function
**Start:** Local scraper service works
**End:** Edge function that can be invoked
**Test:** Edge function responds to HTTP requests

**Acceptance Criteria:**
- [ ] `supabase/functions/scrape-leads/index.ts` created
- [ ] Function accepts job parameters
- [ ] Calls scraper service
- [ ] Updates database with results
- [ ] Deployed successfully

### Task 5.3: Create API Route to Invoke Edge Function
**Goal:** Create Next.js API route to trigger scraping
**Start:** Edge function exists
**End:** API route that safely invokes edge function
**Test:** POST request to API route triggers scraping

**Acceptance Criteria:**
- [ ] `app/api/scrape/route.ts` created
- [ ] Validates request parameters
- [ ] Calls Supabase Edge Function
- [ ] Returns appropriate response
- [ ] Handles errors properly

### Task 5.4: Connect Scrape Jobs to Processing
**Goal:** Wire scrape job creation to actual processing
**Start:** All scraping infrastructure exists
**End:** Creating scrape job triggers processing
**Test:** Submitted competitor gets processed and leads appear in table

**Acceptance Criteria:**
- [ ] Scrape job creation triggers Edge Function
- [ ] Processing updates job status
- [ ] Extracted leads saved to database
- [ ] Error states properly handled
- [ ] End-to-end flow works

## Phase 6: Data Display & Polish (Days 15-16)

### Task 6.1: Implement Leads Data Fetching
**Goal:** Connect LeadsTable to real data
**Start:** Leads exist in database
**End:** Table displays real leads from database
**Test:** Table shows leads that were scraped

**Acceptance Criteria:**
- [ ] `hooks/useLeads.ts` created with TanStack Query
- [ ] LeadsTable fetches and displays real data
- [ ] Loading and error states implemented
- [ ] Data refreshes appropriately

### Task 6.2: Add Job Status Indicator
**Goal:** Show scraping job progress to users
**Start:** Scrape jobs tracked in database
**End:** UI shows job status
**Test:** User can see when scraping is in progress

**Acceptance Criteria:**
- [ ] Job status component created
- [ ] Shows current scraping state
- [ ] Updates in real-time or on refresh
- [ ] Proper styling for different states

### Task 6.3: Basic Error Handling & User Feedback
**Goal:** Improve user experience with proper feedback
**Start:** Core functionality works
**End:** Users get clear feedback on actions
**Test:** Error states and success messages display properly

**Acceptance Criteria:**
- [ ] Toast notifications or alert system
- [ ] Error messages are user-friendly
- [ ] Success confirmations provided
- [ ] Loading states throughout UI

### Task 6.4: MVP Testing & Bug Fixes
**Goal:** Ensure MVP works end-to-end
**Start:** All components built
**End:** Stable MVP ready for use
**Test:** Complete user flow works without errors

**Acceptance Criteria:**
- [ ] End-to-end test: submit competitor → see leads
- [ ] All error paths handled gracefully
- [ ] UI is responsive and usable
- [ ] No console errors or warnings
- [ ] Basic performance acceptable

## Success Criteria for MVP
1. User can input a competitor domain
2. System scrapes and extracts contact information
3. Leads are displayed in a clean table format
4. Basic error handling prevents crashes
5. System handles multiple scrape jobs

## Risk Mitigation Built Into Tasks
- Each task has clear acceptance criteria and test conditions
- Database schema created before dependent functionality
- Server actions tested before UI integration
- Scraping logic isolated and testable
- End-to-end testing ensures integration works

This plan follows the MONOCODE principles by architecting around failure modes, capturing constraints early, enabling test-first development, and delivering in incremental slices that can be tested and validated at each step.