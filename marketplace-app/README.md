# AI Agent Marketplace

A full-stack marketplace where creators publish packaged AI agents and buyers can securely purchase, review, and download them.

## What It Does

- **Creators** upload a zipped agent package (with `agent.json` + docs), which is scanned and stored in object storage.
- **Admins** review submissions and publish or reject agents.
- **Buyers** browse/search, purchase via Stripe Checkout, and download via presigned URLs.
- **Trust signals** (scan summary + declared permissions + creator verification) are shown on agent detail pages.

## Key Features

- Authentication with NextAuth (email/password + optional Google OAuth) and role-based access (BUYER/CREATOR/ADMIN)
- Postgres persistence via Prisma (Supabase-compatible)
- Cloudflare R2 package storage (S3-compatible) with 10-minute presigned download links
- Stripe Checkout + webhook verification with idempotent fulfillment (creates Licenses on success)
- Heuristic package security scanning (secrets, allowlist validation, agent.json validation, suspicious patterns)
- Buyer Library (`/dashboard/buyer`) for owned agents + “updated since purchase” badge
- Ratings & reviews (only licensed users can review)
- Creator analytics (`/dashboard/creator/analytics`) for views/downloads/revenue and a 30-day downloads chart
- Full-text search (Postgres FTS) and category filtering in the marketplace UI
- SEO for agent pages: static generation for published agents, metadata + JSON-LD, dynamic OG images, sitemap
- Reporting workflow (“Report this agent”) that stores an alert and can notify admins via email

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Prisma + Postgres (Supabase)
- NextAuth v5 (Prisma adapter)
- Cloudflare R2 via AWS SDK v3 (+ presigned URLs)
- Stripe (Checkout + webhooks)
- Tailwind CSS
- JSZip-based scanner
- Recharts (analytics chart)
- @vercel/og (OG images)

## Local Development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000

## Environment Variables

This project expects the following environment variables to be set (values omitted):

- Database: `DATABASE_URL` (and optionally `DIRECT_URL` for migrations on Supabase)
- Auth: `AUTH_SECRET` (recommended), `NEXTAUTH_URL` (optional), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`
- Storage (R2): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` (optional)
- Payments (Stripe): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Admin alerts email (optional): `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_ALERT_EMAILS`, `NEXT_PUBLIC_SITE_URL`

## Project Layout

- `src/app`: Routes (pages + API route handlers)
- `src/components`: UI components
- `src/lib`: Prisma client, repository adapter, storage, scanning, analytics, search
- `prisma`: Database schema and migrations
