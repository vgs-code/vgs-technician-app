# VGS Technician App

Mobile-first technician workflow prototype built with Next.js, React, TypeScript and Tailwind CSS.

## Prototype features
- Technician dashboard with today's job overview
- Job list, search and status filters
- Job details and status flow: Assigned → Accepted → On the way → In progress → Completed
- Map navigation link
- Diagnosis and spare-parts form UI
- Earnings summary and profile view
- Responsive mobile bottom navigation

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Important limitations
This is a frontend prototype. Job data is sample data and state is held in the browser only. It does not yet include production authentication, a database, server-side authorization, photo uploads, push notifications, payment payouts or secure customer-contact handling. Connect a backend (for example Supabase) before real customer or technician use.

## Deployment
Import this repository into Vercel and deploy with the default Next.js settings.
