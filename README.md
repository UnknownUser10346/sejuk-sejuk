# Sejuk Sejuk Ops — Internal Operations System

> A role-based internal operations system for managing air-conditioning service jobs, technician assignments, and business performance.

🌐 **Live:** [sejuk-sejuk.vercel.app](https://sejuk-sejuk.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Realtime) |
| AI Assistant | Groq API (LLaMA 3) |
| Deployment | Vercel |

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
  - Total jobs, revenue, rescheduled, postponed
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

## Key Database Columns (orders table)

| Column | Type | Notes |
|---|---|---|
| `status` | text | new / assigned / in_progress / postponed / job_done / reviewed / closed |
| `assigned_technician_id` | uuid | FK to profiles |
| `scheduled_date` | date | Job date |
| `postpone_reason` | text | Filled by technician |
| `postponed_at` | timestamptz | When postponed |
| `postponed_count` | int | Total postpones per order |
| `rescheduled_count` | int | Total reschedules per order |
| `customer_address` | text | Customer location |
| `branch` | text | Service branch |

---

## WhatsApp Notifications

Notifications are sent via **WhatsApp click-to-chat links** (wa.me). No third-party API required.

| Trigger | Recipient |
|---|---|
| New order created & assigned | Technician |
| Order rescheduled by admin | Technician |
| Job marked done by technician | Manager |

Technician phone numbers are stored in the `profiles` table (`phone` column).

---

## AI Assistant

The AI Assistant is powered by **Groq (LLaMA 3)** via a secure Vercel serverless function.

- Frontend calls `/api/ai-assistant` — no API keys exposed in browser
- Serverless function queries Supabase with the service role key (server-side only)
- Supports natural language questions about jobs, technicians, and performance

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

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `GROQ_API_KEY` | Your Groq API key |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key *(keep secret)* |

### 4. Deploy

Click **Deploy** — your app will be live at `your-project.vercel.app`.

> After adding env vars to an existing deployment, go to **Deployments → Redeploy** to apply them.

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
