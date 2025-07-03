# Privacy Page Scraper Implementation

## Overview

The scraper has been completely redesigned to focus on **privacy policy pages** (`/datenschutz`, `/privacy`, etc.) instead of general web search. This approach is more targeted and effective for finding competitor mentions in the context where they're most likely to appear.

## Architecture Changes

### Before (Search-Based Approach)
```
1. Search DuckDuckGo for competitor mentions
2. Parse search results (limited by rate limits/blocking)
3. Extract leads from random result pages
4. Save companies and leads
```

### After (Privacy Page Approach)
```
1. Discover domains from curated business lists
2. Detect privacy policy pages on each domain
3. Analyze privacy pages for competitor mentions
4. Extract leads with context and confidence scoring
5. Save enhanced data with metadata
```

## Key Components

### 1. Domain Discovery Service
- **Purpose**: Provides list of business domains to check
- **Current Implementation**: Curated list of German business domains
- **Future**: Can integrate with domain APIs, business directories, or web crawling

```typescript
const domains = await DomainDiscoveryService.getDomainsToCheck(maxDomains)
```

### 2. Privacy Page Detector
- **Purpose**: Finds privacy policy pages on domains
- **Paths Checked**: `/datenschutz`, `/datenschutzerklaerung`, `/privacy`, `/privacy-policy`, etc.
- **Method**: Uses HEAD requests for efficient checking

```typescript
const privacyUrl = await PrivacyPageDetector.findPrivacyPage('example.com')
```

### 3. Competitor Detector
- **Purpose**: Analyzes content for competitor mentions
- **Features**: 
  - Exact name matching with context extraction
  - Confidence scoring based on business keywords
  - Context extraction (200 chars around mention)

```typescript
const detection = CompetitorDetector.detectCompetitorMention(html, competitorName)
```

### 4. Enhanced Lead Extraction
- **Improvements**:
  - Confidence scoring for each lead
  - Context preservation from competitor mention
  - Source URL tracking to privacy pages
  - Metadata about scraping method

## Processing Flow

### Batch Processing
```
1. Get domains (max 25 for performance)
2. Process in batches of 5 domains
3. Concurrent processing within batches
4. Rate limiting between batches (2 seconds)
```

### Individual Domain Processing
```
1. Find privacy page → Skip if not found
2. Download privacy page content
3. Check for competitor mention → Skip if not found
4. Extract leads from privacy page
5. Extract company information
6. Store results with metadata
```

## Performance Characteristics

### Efficiency Improvements
- **Targeted Approach**: Only processes privacy pages (high hit rate for mentions)
- **Batch Processing**: Concurrent processing within rate limits
- **HEAD Requests**: Efficient privacy page detection
- **Early Termination**: Skips domains without privacy pages or competitor mentions

### Current Limits
- **25 domains max** per scraping job (configurable)
- **5 concurrent domains** per batch
- **2 second delay** between batches
- **15 second timeout** per privacy page download

## Data Enhancements

### Lead Data
```typescript
interface ExtractedLead {
  email: string
  name?: string
  sourceUrl: string        // Privacy page URL
  domain: string
  context?: string         // Text around competitor mention
  confidence: number       // 0.0 - 1.0 confidence score
}
```

### Company Data
- Domain tracking
- Company name extraction from homepage
- Privacy page URL preservation

### Job Results
```typescript
interface ScrapingResult {
  domainsChecked: number
  privacyPagesFound: number
  competitorMentionsFound: number
  leads: ExtractedLead[]
  companies: { domain: string; name: string }[]
  totalLeadsFound: number
  errors: string[]
  processingDetails: PrivacyPageData[]
}
```

## Observable Implementation

### Structured Logging
Every operation logs structured JSON for monitoring:
```json
{
  "timestamp": "2025-07-03T10:12:51.782Z",
  "operation": "scraper_privacy_page_found",
  "data": {"domain": "example.com", "path": "/datenschutz"},
  "success": true,
  "error": null
}
```

### Tracking Metrics
- Domain discovery time
- Privacy page detection rate
- Competitor mention hit rate
- Lead extraction efficiency
- Error categorization

## Testing

### Isolated Testing
- **`test-scraper-privacy.ts`**: Tests scraper without database dependencies
- **Component Tests**: Individual service testing
- **Integration Tests**: End-to-end workflow testing

### Test Coverage
1. Domain Discovery Service
2. Privacy Page Detection
3. Competitor Detection Logic
4. End-to-End Integration
5. Real World Examples

## Configuration

### Domain Sources
Currently uses hardcoded German business domains:
```typescript
// Can be expanded to include:
// - Industry-specific lists
// - Regional business directories  
// - Dynamic domain discovery
['sap.com', 'siemens.com', 'bmw.com', ...]
```

### Privacy Path Patterns
```typescript
['/datenschutz', '/datenschutzerklaerung', '/privacy', '/privacy-policy', ...]
```

## Future Enhancements

### Phase 2 Improvements
1. **Dynamic Domain Discovery**: Integration with business directory APIs
2. **Industry Targeting**: Sector-specific domain lists
3. **Multi-language Support**: Enhanced competitor name variations
4. **Machine Learning**: Improved confidence scoring
5. **Caching**: Privacy page content caching for repeated scans

### Scalability Options
1. **Parallel Workers**: Multiple scraping instances
2. **Queue Management**: Background job processing
3. **Result Streaming**: Real-time progress updates
4. **Persistent Storage**: Intermediate result caching

## Error Handling

### Graceful Degradation
- Network timeouts → Skip domain
- Privacy page not found → Skip domain  
- Competitor not mentioned → Skip lead extraction
- Email extraction fails → Continue with other domains

### Observable Errors
All errors are logged with context for debugging:
```json
{
  "operation": "scraper_privacy_extraction_failed",
  "data": {"url": "https://example.com/privacy"},
  "success": false,
  "error": "Failed to fetch privacy page: 404"
}
```

## Usage Example

```typescript
// Basic usage
const result = await scrapeCompetitorMentions('CompetitorName', 20)

// Result contains:
console.log(`Checked ${result.domainsChecked} domains`)
console.log(`Found ${result.privacyPagesFound} privacy pages`)
console.log(`Found ${result.competitorMentionsFound} mentions`)
console.log(`Extracted ${result.totalLeadsFound} leads`)
```

This new implementation provides a more targeted, efficient, and observable approach to competitor lead discovery through privacy policy analysis. 