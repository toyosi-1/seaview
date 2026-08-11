# Sea View Properties – Procurement & Contractor Management Portal

Enterprise procurement portal for Sea View Properties (a subsidiary of the Nigerian Ports Authority).

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL, Storage, RLS)
- **PDF:** @react-pdf/renderer
- **Notifications:** Sonner (in-app), Supabase Realtime

---

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the project root with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get these values from your Supabase project → **Settings → API**.

### 2. Database Setup

Run these SQL files in order in your **Supabase SQL Editor**:

1. `supabase/migrations/001_initial_schema.sql` — All tables, enums, RLS, triggers
2. `supabase/migrations/002_storage_buckets.sql` — Storage bucket + policies

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## User Roles

| Role | Access |
|------|--------|
| `contractor` | Register, submit proposals, upload completions, view payment status |
| `md` | Full access — initial + final approval, verification |
| `procurement_officer` | Appraisal, forward to Head of Procurement |
| `head_of_procurement` | Review appraisal, approve/reject, forward to MD |
| `head_of_audit` | Review completions, approve, forward to Accounts |
| `head_of_accounts` | Process payments, upload evidence |
| `ict_admin` | User management, audit logs, system settings |

> ICT Admin cannot participate in procurement approvals (enforced by RLS).

---

## Approval Workflow

```
Contractor submits proposal
  → MD Initial Review
    → Procurement Officer Appraisal
      → Head of Procurement Approval
        → MD Final Approval → Contract Awarded (CON-YYYY-XXXX)

Contractor submits Completion Report
  → MD Verification
    → Head of Audit Review
      → Head of Accounts → Payment Processed (PAY-YYYY-XXXX)
```

---

## Key Features

- Role-based access with Supabase Row Level Security
- Immutable audit log (triggers prevent UPDATE/DELETE)
- Digital signature upload (PNG) applied to award letters
- PDF award letter generation via @react-pdf/renderer
- Real-time notifications via Supabase Realtime
- Universal fuzzy search across all entities
- Mobile-responsive executive dashboard
- Internal minutes/comments hidden from contractors
