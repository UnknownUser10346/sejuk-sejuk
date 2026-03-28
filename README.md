# Sejuk Sejuk Ops 🧊

Internal operations system for Sejuk Sejuk Service Sdn Bhd — an air-conditioning installation, servicing and repair company.

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS v3 |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

## Modules

- **Module 1** — Admin Portal (create & assign orders)
- **Module 2** — Technician Portal (view & complete jobs)
- **Module 3** — WhatsApp Notification Trigger
- **Bonus** — KPI Dashboard
- **AI Module** — Operations Query Window

## Workflow
```
New Order → Assigned → In Progress → Job Done → Reviewed → Closed
```

## Roles

- **Admin** — creates orders, assigns technicians
- **Technician** — views assigned jobs, records completion
- **Manager** — reviews completed jobs, views KPI

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Run `npm install`
4. Run `npm run dev`

## Status

🚧 In development