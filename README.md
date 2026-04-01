# Writers Block

Writers Block is a production-focused AI screenplay writing platform built with Next.js 14, Supabase, Upstash Redis, Razorpay, and Replicate. It supports Tamil-first screenplay workflows, English-friendly UI, streaming AI generation, paid plans, admin analytics, PDF delivery, and operational guardrails needed for a real SaaS product.

## What The App Does

- Generate screenplay scenes with streamed AI output.
- Continue an existing screenplay with `generate-next`.
- Improve dialogue while preserving screenplay structure.
- Suggest cinematic shot ideas.
- Recommend movie reference scenes for tone and structure.
- Manage saved projects, subscriptions, and user profiles.
- Export or email screenplay PDFs.
- Track usage by plan and enforce per-user plus per-IP rate limits.

## Core Stack

- Framework: Next.js 14 App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI primitives: Radix UI and shadcn/ui
- Database and auth: Supabase
- Rate limiting: Upstash Redis
- Payments: Razorpay
- Email: Resend
- AI generation: Replicate
- Reference-scene matching: Anthropic
- Monitoring: Vercel Analytics and Speed Insights

## AI Model Setup

All streaming screenplay endpoints use Replicate. The current default model is `google/gemini-2.5-flash`, configurable with `REPLICATE_MODEL`.

- Default: `google/gemini-2.5-flash`
- Supported override pattern: any compatible Replicate text model
- Shared tuning env: `MAX_TOKENS`
- Movie references use `ANTHROPIC_API_KEY`

## Main Product Areas

### Public Marketing Site

- Cinematic landing page
- Feature and workflow sections
- Monthly and yearly pricing toggle
- CTA and conversion-focused sections

### Authenticated Dashboard

- Project list and project detail flows
- Subscription status and upgrade surface
- Settings and profile management
- Admin dashboard for privileged users listed in `ADMIN_EMAILS`

### Screenplay Editor

- Scene setup form
- Live streamed screenplay generation
- Dialogue improvement
- Scene continuation
- Shot suggestions
- Reference scene recommendations
- Browser PDF export
- Server-side PDF email delivery

### Backend Platform

- Supabase-backed auth and persistence
- Redis-backed rate limits
- Razorpay order creation, verification, and webhook reconciliation
- Subscription expiry cron job
- Usage logging for AI endpoints

## Architecture Overview

```text
Browser
  -> Next.js app
  -> Middleware auth checks
  -> API routes
     -> Redis rate limiting
     -> Supabase auth and data access
     -> Replicate / Anthropic / Razorpay / Resend
```

### Important Backend Patterns

- Authenticated AI routes check the current user before model calls.
- Effective plan is derived from subscription state, so expired or inactive subscriptions fall back safely.
- AI endpoints apply both IP-based and per-user daily limits.
- Usage events are logged to `usage_logs`.
- Admin, webhook, and cron handlers use the Supabase service role inside the handler, not at module scope.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values relevant to your setup.

### Required For Local Development

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
REPLICATE_API_TOKEN=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### Required For Production Features

```bash
SUPABASE_SERVICE_ROLE_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
RAZORPAY_WEBHOOK_SECRET=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
ADMIN_EMAILS=admin@example.com
CRON_SECRET=...
```

### Optional Or Feature-Specific

```bash
REPLICATE_MODEL=google/gemini-2.5-flash
MAX_TOKENS=8000
ANTHROPIC_API_KEY=...
SUPABASE_DATABASE_URL=...
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
DISABLE_RATE_LIMIT=false
ALLOW_AI_WITHOUT_REDIS=1
DEBUG=false
```

### Pricing Configuration

```bash
PRO_MONTHLY_PRICE_PAISE=199900
PRO_ANNUAL_PRICE_PAISE=1918800
PREMIUM_MONTHLY_PRICE_PAISE=499900
PREMIUM_ANNUAL_PRICE_PAISE=4798800
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project
- Upstash Redis database for production-like rate limiting

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env.local
```

Populate `.env.local` with your project values.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run start` runs the production build.
- `npm run lint` runs the Next.js ESLint command.

There is currently no `test` script configured in `package.json`.

## Database Setup

The schema source of truth is `supabase/database.sql`.

It defines:

- `profiles`
- `subscriptions`
- `projects`
- `documents`
- `usage_logs`
- indexes and constraints
- row-level security policies
- helper triggers and defaults

Apply the SQL in the Supabase SQL Editor for your project.

## API Surface

Current top-level API groups:

- `app/api/admin`
- `app/api/cron`
- `app/api/documents`
- `app/api/generate`
- `app/api/generate-next`
- `app/api/improve-dialogue`
- `app/api/movie-references`
- `app/api/projects`
- `app/api/razorpay`
- `app/api/shots`
- `app/api/subscription`
- `app/api/user`

## Repository Structure

```text
app/
  (home)/                Public landing pages
  api/                   Route handlers
  auth/                  Auth callback flow
  dashboard/             Protected app pages
  editor/                Screenplay editor page
  signin/ signup/        Auth screens

components/
  ui/                    Shared UI primitives
  screenplay-editor.tsx  Editor rendering and export actions

hooks/
  useRazorpay.ts
  useProjects.ts
  useUser.ts

lib/
  ai-rate-limits.ts
  admin-stats.ts
  email.ts
  ratelimit.ts
  replicate-model.ts
  screenplay-pdf.ts
  screenplay-print-html.ts
  subscription.ts
  supabase/

supabase/
  database.sql

types/
  database.ts
  project.ts
```

## Billing Notes

- Free, Pro, and Premium plans are supported.
- Pro and Premium support monthly and annual pricing.
- Checkout starts in `/api/razorpay/create-order`.
- Payment verification happens in `/api/razorpay/verify`.
- Webhook reconciliation happens in `/api/razorpay/webhook`.
- Subscription-expiry maintenance runs through `vercel.json` on `/api/cron/check-subscriptions`.

## Performance And Reliability Notes

- Rate limits are enforced with Upstash Redis.
- Server components use cached query helpers where applicable.
- API routes set explicit cache headers.
- Motion-aware UI respects reduced-motion preferences.
- The app includes error boundaries and defensive fallback handling around external services.

## Deployment

Recommended target: Vercel.

### Production Checklist

- Add all required environment variables.
- Apply `supabase/database.sql`.
- Configure Razorpay webhook to `/api/razorpay/webhook`.
- Configure Resend sender domain if emailing PDFs or billing notifications.
- Set `ADMIN_EMAILS` before using admin routes.
- Confirm `CRON_SECRET` is present for cron endpoints.
- Run `npm run build` before deployment.

## Known Documentation Notes

- `UX_AUDIT_REPORT.md` is a point-in-time product audit, not a live source of truth for implementation details.
- `CLAUDE.md` is maintainer guidance for code agents and has been aligned with the current stack.

## License

MIT
