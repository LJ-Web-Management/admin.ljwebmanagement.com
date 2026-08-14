# Backend infrastructure (not yet provisioned)

This repo currently ships the frontend only (build order step 1), live for testing at
https://lj-web-management.github.io/admin.ljwebmanagement.com/ (mock data only). The
backend runs on **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions),
not AWS, chosen so the whole stack runs at $0/month at this project's scale. To continue:

## DNS cutover (when Route 53 or your DNS provider is ready)

The frontend currently builds for the GitHub Pages *project page* path
(`/admin.ljwebmanagement.com/`), since the custom domain isn't live. Once
`admin.ljwebmanagement.com` has DNS pointed at GitHub Pages:

1. Set the repo variable `CUSTOM_DOMAIN_LIVE` (any value): this switches
   `deploy-pages.yml` to root-relative asset paths and writes the `CNAME` file again.
2. Re-set the custom domain: `gh api -X PUT repos/LJ-Web-Management/admin.ljwebmanagement.com/pages -f "cname=admin.ljwebmanagement.com"`.
3. Push to `main` (or re-run the workflow) to redeploy.

## What's needed from you

1. **A Supabase account** (free) at supabase.com, and a new project for this app.
2. **Run the migrations** in `supabase/migrations/` against that project, in order
   (`0001_schema.sql`, `0002_policies.sql`, `0003_storage.sql`), either via the Supabase
   SQL editor, or `supabase db push` with the Supabase CLI.
3. **Deploy the Edge Function** in `supabase/functions/transcripts-ingest/` (`supabase
   functions deploy transcripts-ingest`), and set its secrets:
   - `TRANSCRIPTS_INGEST_KEY`, a random shared key the Google Apps Script automation
     sends as the `X-API-Key` header.
   - `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_URL`, Supabase sets these automatically
     for Edge Functions.
4. **GitHub repo secrets/variables**, once the project exists:
   - Repo variable `VITE_API_BASE_URL` = your Supabase project URL (e.g.
     `https://xxxxx.supabase.co`), used by `deploy-pages.yml` to build the frontend
     against the real backend instead of mock data.
   - Repo variable `VITE_SUPABASE_ANON_KEY` = the project's anon/public key (safe to
     expose client-side; RLS policies do the real access control).
   - Repo variable `SUPABASE_URL` + repo secret `SUPABASE_ANON_KEY`, used only by
     `.github/workflows/supabase-keepalive.yml` to ping the project twice a week so
     the free tier doesn't pause it after 7 days of inactivity.

## Planned resources

- **Auth:** Supabase Auth (Postgres-backed), email + password, no MFA. `profiles` table
  extends `auth.users` with `role` (`admin` / `employee` / `demo`) and a `permissions`
  jsonb column holding granular per-page/section grants.
- **Database:** Supabase Postgres, orders (+ additional costs, taxes/fees, documents),
  users/permissions, message threads/participants/messages, past customers,
  chat transcripts. See `supabase/migrations/0001_schema.sql` for the full schema,
  including a `service_suggestions` view that does the case-insensitive,
  whitespace-trimmed service-text grouping.
- **Access control:** Postgres Row Level Security, not an API-layer permission check,
  see `supabase/migrations/0002_policies.sql`. Demo-role users are deliberately granted
  no policies on real tables (defense in depth); the app layer serves demo users the
  same static placeholder dataset the frontend already ships for mock mode, so no real
  customer/order/financial data is queried for that role at all.
- **Storage:** one private Supabase Storage bucket (`files`), split by path prefix
  (`orders/{id}/...`, `transcripts/{id}/...`), accessed via signed URLs.
- **Realtime:** Supabase Realtime (Postgres logical replication) for the messaging
  feature, no separate WebSocket infrastructure to run.
- **Custom logic:** Supabase Edge Functions (Deno) for anything beyond plain CRUD,
  currently just `transcripts-ingest`, the endpoint the Google Apps Script + Gemini
  automation posts to.
- **Cost:** $0/month at this scale (free tier: 500MB DB, 1GB storage, 50K MAU auth,
  2GB bandwidth, 500K Edge Function invocations). The keepalive workflow prevents the
  only real free-tier gotcha, projects pausing after a week of no traffic.

## Suggested approach

1. Create the Supabase project, run the three migration files in order.
2. Deploy the `transcripts-ingest` Edge Function and set its secrets.
3. Set the four GitHub repo secrets/variables above.
4. Push to `main`, `deploy-pages.yml` will build the frontend against the real
   Supabase project instead of mock data (`USE_MOCK_API` flips off once
   `VITE_API_BASE_URL` is set).
5. Once real, swap the frontend's `src/lib/apiClient.ts` "real" branches (currently
   thin `fetch` calls to a generic REST API) for `@supabase/supabase-js` calls, this
   hasn't been done yet since it needs a live project to test against.
