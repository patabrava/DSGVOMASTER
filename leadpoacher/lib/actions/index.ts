// Server Actions Index - Export all CRUD operations
// Following MONOCODE Dependency Transparency principles

// Company operations
export {
  createCompany,
  getCompanyByDomain,
  getCompanies,
  updateCompany
} from './companies'

// Lead operations  
export {
  createLead,
  getLeadsByCompany,
  getAllLeadsWithCompany,
  updateLeadStatus,
  updateLead,
  deleteLead
} from './leads'

// Scrape job operations
export {
  createScrapeJob,
  updateScrapeJobStatus,
  getScrapeJobById,
  getScrapeJobByCompetitor,
  getScrapeJobs,
  getQueuedScrapeJobs,
  cleanupOldScrapeJobs
} from './scrapeJobs' 