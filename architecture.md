Below is a **complete, opinionated architecture** for **LeadPoacher** using **Next.js 14 (App Router) + Supabase (Postgres + Edge Functions + Model Context Protocol)**. Everything is formatted in pure Markdown so you can paste it into a repo README or an architecture doc.

---

## 1. High-level system diagram

```mermaid
graph TD
  A[Browser – React App] -- competitor name --> B(Server Action / API route)
  B --> C{Supabase DB<br/>tables + RLS}
  B --> D[Supabase Edge Function<br/>(scrape-leads)]
  D -->|HTTP crawl + parse| E[Headless Scraper<br/>(Playwright & Cheerio)]
  E --> C
  C -- realtime channel --> A
  A -- export request --> F[CSV Builder API]
  F -->|INSERT storage object| G[Supabase Storage]
  G --> A
```

*Everything except the optional headless scraper can run inside Supabase (Edge Functions + Postgres) so you stay serverless from day one.*

---

## 2. Repo & folder layout

```
leadpoacher/
├─ app/                         # Next.js 14 “app” router
│  ├─ layout.tsx
│  ├─ page.tsx                  # ⬅ homepage (CompetitorSearchPage)
│  ├─ (dashboard)/              # ⬅ parallel route for auth-less dashboard
│  │  ├─ layout.tsx
│  │  ├─ page.tsx              # LeadsTable, ExportButton, etc.
│  └─ api/
│     └─ scrape/route.ts        # POST → invokes Edge Fn ‘scrape-leads’
│
├─ components/                  # Dumb UI pieces (Cards, Tables…)
│  ├─ LeadsTable.tsx
│  ├─ CompetitorForm.tsx
│  └─ ...
│
├─ lib/
│  ├─ supabaseClient.ts         # createBrowserClient & createServerClient
│  ├─ dbSchema.ts               # generated types from Supabase
│  └─ queries.ts                # SQL fragments shared by server actions
│
├─ hooks/
│  ├─ useLeads.ts               # TanStack Query wrapper
│  └─ useRealtime.ts
│
├─ services/                    # Pure business logic (no React!)
│  ├─ csv/
│  │  └─ buildCsv.ts
│  └─ scraper/                  # local dev runner for scraping
│     ├─ index.ts
│     └─ parse.ts
│
├─ supabase/                    # Supabase-as-code
│  ├─ migrations/               # SQL + SeaORM or drizzle migrations
│  ├─ types/
│  │  └─ generated.ts
│  └─ functions/
│     └─ scrape-leads/
│         ├─ index.ts           # Deno Edge Function
│         └─ deps.ts
│
├─ scripts/
│  └─ export_csv.ts             # CLI helper (pnpm export:csv)
│
├─ .env.local                   # NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
├─ .supabase/config.toml
├─ tsconfig.json
└─ package.json
```

### Why this split?

| Area                                                | Lives in                                  | Responsibility                                  |
| --------------------------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| **Transient UI state** (form inputs, table filters) | React server + client components          | UX only                                         |
| **Fetched data cache**                              | TanStack Query (`useLeads`)               | keeps the dashboard snappy                      |
| **Authoritative data**                              | Supabase Postgres                         | leads, companies, scrape\_jobs, messages, notes |
| **Background compute**                              | Supabase Edge Function + headless scraper | long-running I/O                                |
| **Files**                                           | Supabase Storage                          | CSV exports                                     |

---

## 3. Database schema (Postgres on Supabase)

| table         | important columns                                                                                | purpose                |
| ------------- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| `companies`   | `id`, `domain`, `name`, `created_at`                                                             | de-dupe domains        |
| `leads`       | `id`, `company_id`, `contact_name`, `contact_email`, `source_url`, `status`, `note`, `timestamp` | single row per contact |
| `scrape_jobs` | `id`, `competitor`, `state` (queued / running / done / error), `requested_at`, `completed_at`    | job queue & progress   |
| `messages`    | optional future use (drip campaigns)                                                             |                        |
| `notes`       | free-form engagement notes                                                                       |                        |

*Row-Level Security (RLS):* disabled for now (no public accounts). Edge Functions use the service-role key; browser uses the anon key in read-only mode.

---

## 4. Supabase Edge Function: `scrape-leads`

```ts
// supabase/functions/scrape-leads/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { competitor, jobId } = await req.json();
  // 1. Query Google+DuckDuckGo (or SerpAPI) for pages mentioning competitor
  // 2. For every result, crawl with fetch + OpenGraph parsing
  // 3. Extract emails via regex + mailto links
  // 4. INSERT or UPSERT into `companies` & `leads`
  // 5. UPDATE scrape_jobs SET state='done'
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
```

*Runs in Deno → no cold-start on Supabase. Heavy headless work can be shipped to Fly.io or a Vercel cron if necessary.*

---

## 5. Client ↔ server communication paths

| Path                                    | Technology                                     | Why                              |
| --------------------------------------- | ---------------------------------------------- | -------------------------------- |
| **`/api/scrape` route** → Edge Function | Next.js Route Handler (POST)                   | hides service key from client    |
| **Realtime**                            | Supabase Realtime Channels                     | pushes new leads instantly       |
| **CSV export**                          | Server Action → `buildCsv.ts` → Storage upload | long-running, returns signed URL |

---

## 6. Model Context Protocol (MCP) touch-points

*Supabase’s [Model Context Protocol (MCP)](https://supabase.com/docs/guides/getting-started/mcp) lets IDE agents or LLM-powered ops tools manipulate your Supabase project in natural language.* ([supabase.com][1])

* **Local dev:** run `supabase dev` then `supabase mcp start` so tools like Cursor or Claude can scaffold new tables or write migrations for you.
* **CI/CD:** use the MCP server in GitHub Actions to apply migrations on PR.

*MCP is **optional** for LeadPoacher’s runtime, but great for developer productivity.*

---

## 7. State management strategy

| Layer              | Library / strategy                               | Persistence            |
| ------------------ | ------------------------------------------------ | ---------------------- |
| UI component state | React (useState, server components)              | memory                 |
| Query/cache        | TanStack Query + Supabase client                 | optimistic UI          |
| Global app context | React Context `AppProvider`                      | memory                 |
| Durable data       | Postgres                                         | forever                |
| Long jobs          | `scrape_jobs`  ⟷ Edge Function                   | until cleaned          |
| File artifacts     | Supabase Storage buckets (`exports/leads-*.csv`) | 30 days lifecycle rule |

---

## 8. Dev & deploy workflow

1. **Clone & boot:** `supabase init` → `supabase start` → `pnpm dev`
2. **Run edge locally:** `supabase functions serve scrape-leads --no-verify-jwt`
3. **Generate types:** `supabase gen types typescript --linked > lib/dbSchema.ts`
4. **Create migration:** `supabase migration new create_leads_tables`
5. **MCP server (optional):** `supabase mcp start`
6. **Deploy:** `supabase functions deploy scrape-leads` followed by `vercel --prod` (or Supabase Hosting).

---

## 9. Environment variables

| Variable                    | Scope              | Notes                          |
| --------------------------- | ------------------ | ------------------------------ |
| `SUPABASE_PROJECT_URL`      | all                | public                         |
| `SUPABASE_ANON_KEY`         | browser & server   | read-only (RLS off)            |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function only | secret – never ship to browser |
| `SERP_API_KEY`              | Edge Function      | optional search API            |
| `CSV_BUCKET`                | server             | `exports`                      |

---

## 10. Scaling & future extensions

1. **Auth:** if you later need multi-tenant accounts, enable email-link auth in Supabase, add `user_id` FK on every table, switch RLS on.
2. **Queue:** for high volume scraping, push job IDs into **pg-boss** or **Supabase Queue** (beta) instead of polling `scrape_jobs`.
3. **Vector search:** embed landing pages with Supabase Vector; cluster similar leads for smarter outreach.
4. **LLM-drafted emails:** call OpenAI from an Edge Function and save drafts back into Postgres.

---

