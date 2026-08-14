# Backend infrastructure (not yet provisioned)

This repo currently ships the frontend only (build order step 1). Steps 2–7 need an AWS
account with credentials this environment does not have. To continue:

## What's needed from you

1. **AWS account + IAM access** to create a scoped deploy role (or run provisioning
   yourself the first time). At minimum, an account with permissions to create:
   Cognito user pools, RDS/Aurora, S3 buckets, Lambda, API Gateway, Route 53 records,
   Secrets Manager entries, and IAM roles.
2. **Route 53 hosted zone** for `ljwebmanagement.com` (or delegate a subdomain) so
   `admin.ljwebmanagement.com` can be pointed at GitHub Pages (step 1, `A`/`ALIAS` +
   `CNAME` records) and, later, `api.admin.ljwebmanagement.com` at API Gateway.
3. **GitHub repo secrets/variables** once the backend exists:
   - Repo variable `VITE_API_BASE_URL` — used by `deploy-pages.yml` to build the frontend
     against the real API instead of mock data.
   - Repo secret `AWS_DEPLOY_ROLE_ARN` — least-privilege OIDC role for GitHub Actions to
     assume when deploying the backend (CDK/SAM) and running migrations.

## Planned resources (per spec)

- **Auth:** Cognito user pool, email + password, no MFA. Role (`admin` / `employee` /
  `demo`) and granular per-page/section permissions stored in Postgres, keyed to the
  Cognito `sub`.
- **API:** API Gateway REST API (orders, analytics, services autocomplete, user admin) +
  WebSocket API (messaging), backed by Lambda.
- **Database:** RDS Postgres or Aurora Serverless v2 — orders, users/permissions,
  message threads/participants/messages, service-text usage for autocomplete ranking.
- **Storage:** S3 private bucket for order PDFs and message attachments, accessed via
  signed URLs.
- **Secrets:** DB credentials and JWT signing keys in Secrets Manager — never hardcoded.
- **Observability:** CloudWatch logs/alarms on all Lambdas and API Gateway stages.
- **Estimated cost:** ~$20–35/month at this scale (RDS/Aurora dominant; Lambda, API
  Gateway, S3, Cognito, Route 53 low-to-free at this traffic level).

## Suggested approach once AWS access is available

Provision with CDK (TypeScript, to match the frontend) as a `infra/cdk` app with stacks
for: `AuthStack` (Cognito), `DataStack` (RDS/Aurora + Secrets Manager + migrations),
`ApiStack` (API Gateway REST + Lambda), `RealtimeStack` (WebSocket API + connection
tracking table/columns), `StorageStack` (S3 + bucket policy). Wire a
`.github/workflows/deploy-backend.yml` that assumes `AWS_DEPLOY_ROLE_ARN` via OIDC,
runs `cdk deploy`, and runs DB migrations, on push to `main` — gated so it only runs once
the secret exists.
