# Sejuk Sejuk Ops — Internal Operations System

> A role-based internal operations system for managing air-conditioning service jobs, technician assignments, and business performance.

🌐 **Live Demo:** [sejuk-sejuk.vercel.app](https://sejuk-sejuk.vercel.app)

---

## What I Built

**Sejuk Sejuk Ops** is a full-stack internal operations web app for an air-conditioning service company. It replaces manual WhatsApp-based job coordination with a structured, role-based system.

Three user roles — **Admin**, **Manager**, and **Technician** — each have their own dashboard and workflows:

- **Admin** creates and assigns service orders, reschedules postponed jobs, and sends WhatsApp notifications to technicians
- **Technician** views their assigned jobs, updates job status, and can postpone jobs with a reason
- **Manager** reviews completed jobs, monitors team KPIs, and queries business data via an AI Assistant

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL + Realtime) |
| AI Assistant | Groq API (LLaMA 3) via Vercel serverless function |
| Deployment | Vercel |
| Notifications | WhatsApp click-to-chat (wa.me) |

---

## Architecture Decisions

### 1. Supabase as Backend
Supabase was chosen for its real-time capabilities, built-in auth, and PostgreSQL flexibility. Row-level security (RLS) controls data access per role without needing a custom backend server.

### 2. Role-Based Routing
Each role (admin, manager, technician) has its own layout and protected route group in React. Users are redirected based on their `role` field stored in the `profiles` table.

### 3. Serverless Function for AI
The AI Assistant uses a **Vercel serverless function** (`/api/ai-assistant.js`) to:
- Accept a natural language question from the frontend
- Query Supabase using the **service role key** (server-side only)
- Send the data + question to **Groq (LLaMA 3)**
- Return the answer to the frontend

This keeps both the Groq API key and Supabase service role key fully hidden from the browser.

### 4. WhatsApp Notifications (No API Cost)
Instead of a paid SMS/WhatsApp API, notifications use **wa.me deep links** that open WhatsApp with a pre-filled message. This is zero-cost and works instantly on mobile.

### 5. Postpone & Reschedule Workflow
A dedicated `postponed` status was added to the order lifecycle. When a technician postpones a job, the admin receives a signal to reschedule. On reschedule, status auto-reverts to `assigned` and `rescheduled_count` increments — fully tracked in the database.

---

## How AI Was Integrated

The AI Assistant is accessible to the **Manager** role and allows natural language queries about operations data.

**Flow:**
```
Manager types question (e.g. "Who has the most postponed jobs?")
        ↓
Frontend POST → /api/ai-assistant (Vercel serverless)
        ↓
Serverless fetches relevant data from Supabase (orders, profiles)
        ↓
Data + question sent to Groq API (LLaMA 3 model)
        ↓
AI generates a natural language answer
        ↓
Response returned to frontend and displayed
```

**Security:**
- `GROQ_API_KEY` — server-side only, never in frontend code
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, used only in the serverless function
- Frontend only calls `/api/ai-assistant` — no direct AI or DB access from the browser

---

## Challenges & Assumptions

### Challenges

| Challenge | How It Was Solved |
|---|---|
| `postponed` status rejected by DB | The `orders_status_check` constraint was missing `postponed` — dropped and recreated to include it |
| DB column names didn't match code | DB used `postponed_count` / `rescheduled_count` (with **d**) but code used without — all files updated to match DB |
| KPI cards showing 0 for rescheduled/postponed | Date filter on KPI query excluded future-dated orders — removed date filter so all orders are counted |
| AI key exposed on frontend | Reworked from direct Groq call in browser to a secure Vercel serverless function |
| Technician WA button not appearing | Logic was tied to phone number presence — fixed to always show button after order save |

### Assumptions

- Each technician has a phone number stored in `profiles.phone` for WhatsApp notifications to work as direct links
- The `branch` column stores branch name as plain text (not a foreign key)
- `customer_address` is used as the address field (not `address`)
- All users are created and assigned roles manually via Supabase (no public self-registration)

---

## Limitations

- **WhatsApp notifications are manual** — admin/technician must tap the pre-filled WA link; there is no automated message sending (would require WhatsApp Business API)
- **No push notifications** — the app has no real-time alerts; users must open the app to see updates
- **AI context is limited** — the AI Assistant only has access to orders and profiles data; it cannot answer questions about inventory, invoices, or external data
- **No file uploads** — job reports or photos cannot be attached to orders in the current version
- **Role management is manual** — roles are assigned directly in Supabase; there is no in-app user management UI for admins
- **Single language** — the UI is in English; no multilingual support currently

---

## Roles & Features

### 👤 Admin
- Create, edit, and assign service orders to technicians
- View all orders with status badges (New, Assigned, In Progress, Postponed, Job Done, Reviewed, Closed)
- Read-only order detail page with Edit button
- WhatsApp notification to technician on new job assignment
- Reschedule postponed orders → auto-notifies technician via WhatsApp

### 🔧 Technician
- View assigned jobs
- Update job status (Start, Complete, Postpone)
- Postpone a job with reason — triggers manager notification
- Receive WhatsApp notifications for new and rescheduled jobs

### 📊 Manager
- Review completed jobs
- KPI Dashboard with real-time stats:
  - Total jobs, revenue, rescheduled, postponed counts
  - Per-technician breakdown (jobs, revenue, rescheduled, postponed)
  - Leaderboard
- AI Assistant for natural language queries on job data

---

## Order Status Flow

```
new → assigned → in_progress → job_done → reviewed → closed
                      ↓
                  postponed → (admin reschedules) → assigned
```

---

## Project Structure

```
sejuk-sejuk/
├── api/
│   └── ai-assistant.js       # Vercel serverless function (Groq + Supabase)
├── public/
├── src/
│   ├── pages/
│   │   ├── admin/            # Admin pages
│   │   ├── manager/          # Manager pages
│   │   └── technician/       # Technician pages
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── App.jsx
│   └── main.jsx
├── .env
├── index.html
└── package.json
```

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/sejuk-sejuk.git
cd sejuk-sejuk
npm install
```

### 2. Create `.env` file

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=your-groq-key
```

### 3. Run locally

```bash
npm run dev
```

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "deploy"
git push
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Import Project**
2. Select your GitHub repo
3. Framework: **Vite** (auto-detected)

### 3. Add Environment Variables in Vercel

| Key | Notes |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `GROQ_API_KEY` | Groq API key — **no VITE_ prefix** |
| `SUPABASE_URL` | Supabase project URL — **no VITE_ prefix** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key — **keep secret, no VITE_ prefix** |

### 4. Deploy

Click **Deploy** — live at `your-project.vercel.app`. Future pushes to `main` auto-deploy. ✅

---

## Supabase Setup Notes

Make sure the `orders` table status constraint includes `postponed`:

```sql
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY['new','assigned','in_progress','postponed','job_done','reviewed','closed']));
```

Required extra columns (run once):

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postpone_reason text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postponed_at timestamptz;
```

---

## License

Internal use only — © 2026 Sejuk Sejuk AC Services. All rights reserved.
