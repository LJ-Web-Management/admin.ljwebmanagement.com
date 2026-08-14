# admin.ljwebmanagement.com

Admin dashboard for LJ Web Management: order management, analytics, and internal messaging.

## Status

Build order (see spec): **(1) repo + Pages + DNS shell - in progress.** Steps 2-7 (AWS
provisioning, real auth, live order/analytics/messaging APIs) are not started because they
require AWS credentials that aren't available in this environment. See
[`infra/README.md`](infra/README.md) for what's needed to continue.

Until the backend is deployed and `VITE_API_BASE_URL` points at it, every build (local and
production) runs against mock data only, no real customer, order, or financial data is
reachable.

## Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router. Deployed to GitHub
  Pages via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) on
  push to `main`, custom domain `admin.ljwebmanagement.com`.
- **Backend (planned):** API Gateway (REST + WebSocket) + Lambda, Cognito for auth, RDS
  Postgres / Aurora Serverless v2, S3 for order PDFs and message attachments. See
  [`infra/README.md`](infra/README.md).

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to point at a real API once one exists. Leaving
`VITE_API_BASE_URL` unset (default) runs the app fully against mock data, including a mock
login accepting `marketing@ljwebmanagement.com`.

## Roles

- **admin**: full access, real data
- **employee**: access to a checked list of pages/sections, granular per user
  (`src/lib/types.ts` -> `PAGE_SECTIONS`)
- **demo**: access to all pages, sanitized/placeholder data only
