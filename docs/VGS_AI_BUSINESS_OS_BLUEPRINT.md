# VGS AI Business OS — Product Blueprint

## Vision
Build a multi-tenant home-services marketplace and operations SaaS inspired by common marketplace workflows. Use original VGS branding, original UI, and independently implemented code. Do not copy Urban Company's proprietary code, assets, text, or exact interface.

## Existing foundation
- Next.js app deployed on Vercel
- Supabase database and authentication
- Technician sign-in and assigned-job dashboard
- Admin operations page
- Customers, service jobs, invoices, job updates, technician profiles, and location punches

## Product roles
1. Super Admin: manage tenants, plans, platform configuration, usage, and support.
2. Business Owner/Admin: configure brand, service catalogue, areas, prices, staff, schedules, customers, bookings, invoices, and reports.
3. Dispatcher/Call Centre: manage leads, bookings, technician allocation, rescheduling, and escalations.
4. Technician: view assigned jobs, accept/decline within policy, navigate, check in/out, record diagnosis, parts, photos, customer approval, and completion.
5. Customer: discover services, get estimates, book slots, track jobs, pay, download invoices, rate service, and raise complaints.
6. Finance/Operations: reconcile payments, refunds, commissions, payouts, GST invoices, and reports.

## Modules
- Public service website and booking funnel
- Customer portal/PWA
- Technician mobile-first PWA
- Admin CRM and dispatch board
- Service catalogue, price book, packages, add-ons, coupons, and service areas
- Scheduling, availability, assignment, rescheduling, cancellations, and SLA tracking
- Quotes, work orders, invoices, GST fields, payment status, refunds, technician commissions
- Attendance/location punches with explicit consent and minimum necessary location collection
- Customer communication templates and notification queue
- Ratings, complaints, warranty/revisit workflows
- Inventory and spare parts
- Analytics and exports
- Multi-tenant SaaS plans and billing
- AI assistant for summaries, classification, draft responses, and suggested assignments; human approval for money, refunds, prices, and irreversible actions

## Recommended architecture
- Next.js App Router + TypeScript for web/PWA
- Supabase Auth, Postgres, Storage, and Edge Functions
- Vercel deployment
- Row Level Security with tenant_id enforced in every tenant-owned table
- Database constraints and transactional server-side functions for critical state changes
- Payment gateway and messaging provider integrated only after accounts and credentials are supplied
- Background jobs/queue for reminders, retries, and notifications
- Audit log for admin, finance, status, and permission changes

## Delivery plan
### Phase 0 — Stabilize the current MVP
- Configure SMS provider or use email login temporarily
- Verify admin allowlist, redirect URLs, and active technician profiles
- End-to-end test login, assigned jobs, attendance punches, status changes, and invoice creation
- Tighten RLS and enforce permitted job-status transitions server-side
- Add error handling, loading states, and audit logging

### Phase 1 — VGS internal operations MVP
- Customer and lead capture
- Booking creation and service catalogue
- Dispatch and technician assignment
- Job lifecycle with diagnosis, parts, photos, customer approval, completion
- Quotations and invoices
- Notifications and basic dashboard reports

### Phase 2 — Customer experience
- Public service pages and booking flow
- Customer accounts and booking history
- Slot selection, booking tracking, rescheduling, cancellation
- Ratings, complaints, warranty/revisit
- Payment gateway integration

### Phase 3 — Automation
- Event-based booking confirmations and reminders
- Technician assignment recommendations based on skills, area, availability, workload
- Follow-up and review requests
- Failed-notification retries and operations alerts
- AI summaries and support drafts with human approval

### Phase 4 — Multi-tenant SaaS
- Tenant onboarding and tenant_id isolation
- Per-tenant branding, services, prices, areas, teams, roles, and settings
- Subscription plans, limits, billing, usage, and suspension policy
- Super-admin dashboard
- Tenant isolation tests and security review

### Phase 5 — Scale
- Inventory and supplier workflows
- Franchise/multi-city support
- Advanced analytics, SLA and cohort metrics
- Native mobile apps only if PWA limitations justify the cost

## Core booking lifecycle
lead_created -> booking_requested -> confirmed -> assigned -> technician_en_route -> checked_in -> diagnosis_pending -> quote_pending -> approved -> in_progress -> completed -> invoice_issued -> payment_pending -> paid -> review_requested

Alternative terminal states: cancelled, no_show, disputed, refund_pending, refunded, revisit_required.

Transitions must be validated server-side. Store status history and actor/timestamp for every transition.

## Core metrics
- Lead-to-booking conversion
- Booking confirmation time
- Assignment time
- Technician arrival SLA
- Completion rate
- Cancellation and revisit rate
- Average order value
- Gross margin and technician payout
- Repeat booking and review rate
- Notification delivery failures

## Guardrails
- Never expose service-role keys in browser code or GitHub.
- Enforce tenant_id and role checks in database policies and server-side actions.
- Do not collect technician location continuously by default; collect only during explicit attendance/job events with clear disclosure.
- Keep payment, refund, payout, pricing overrides, and account suspension behind authorization and audit logs.
- Treat AI as an assistant for recommendations and drafts until permissions, testing, and rollback controls are in place.
- Do not claim production readiness until real workflows and tenant isolation have been tested.
