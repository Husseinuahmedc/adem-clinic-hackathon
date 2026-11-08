<div align="center">
  <img src="public/adem-logomark.svg" alt="ADEM clinic symbol" width="86" />

  # ADEM | Clinic Booking Prototype

  **An Arabic, right-to-left clinic booking and reception workflow built for a hackathon.**

  **Hackathon result: 4th place** · Next.js · TypeScript · PostgreSQL (partial integration)
</div>

## Visual update: ADEM brand rollout

The latest hackathon prototype adds a clinic-photo hero and ADEM logomark on the patient booking page, plus a plum-purple branded header and coordinated lavender components in the reception dashboard. This change updates the visual presentation, **not** the prototype's data architecture: the dashboard still uses browser `localStorage`, and the database is not yet a unified source of truth.

The repository includes a lightweight web-optimized rendition of the hero photograph; the original high-resolution asset remains in the supplied prototype archive.

## Overview

ADEM explores a practical problem in clinic reception: booking requests, appointment confirmations, and follow-up details become difficult to track when they are scattered across chats. The prototype provides a patient-facing booking form and a receptionist dashboard in one Next.js application.

> **Prototype, not production software.** The supplied project is a hackathon demo with fictional records. The reception dashboard uses browser `localStorage`. The public booking flow also includes an optional PostgreSQL Server Action, but **the two flows are not yet fully connected to the same database**. There is no complete staff login flow. Do not deploy this as a real patient-record system without security, privacy, and data-consistency work.

## Features

| Patient-facing booking | Reception dashboard |
| --- | --- |
| Arabic RTL booking page | View and filter booking records |
| Name, age, area, optional phone and reason | Record WhatsApp bookings manually |
| Client-side validation and receipt message | Set appointment date and time |
| Approximate clinic location/map link | Prepare a WhatsApp confirmation message |
| | Track confirmation-sent status and follow-up dates |
| | Age-group / area heatmap and complaint workflow |

**WhatsApp integration:** Opens a pre-filled WhatsApp link for the staff member to send. It does not silently send messages or use the WhatsApp Business API.

## Tech stack

- **Next.js 14 App Router**: React UI and server actions in the same project.
- **TypeScript**: Types for booking data and application logic.
- **Plain CSS**: Custom responsive Arabic RTL UI.
- **PostgreSQL + `pg`**: Database schema and partial Server Action implementation.
- **Browser `localStorage`**: Demo dashboard persistence and demo-mode public booking persistence.

## How it works today

```text
Patient landing page (/)
    └── Submit → createPublicBooking Server Action
          ├── DATABASE_URL configured → insert patient + booking into PostgreSQL
          └── no DATABASE_URL → save demo record in localStorage

Reception dashboard (/dashboard)
    └── readBookings / writeBookings → localStorage
          ├── manage appointments and status
          ├── prepare WhatsApp confirmation
          └── filter and display heatmap
```

**Important:** When `DATABASE_URL` is set, public bookings go to PostgreSQL, while the dashboard still reads `localStorage`. Therefore those database records **will not appear in the current dashboard**. Without `DATABASE_URL`, both pages can use the same browser's storage for demo purposes. Data does not automatically synchronize between separate devices or browsers.

### Database structure

The SQL migration (`db/migrations/001_clinic.sql`) defines:

- `patients`: patient identity and basic details.
- `bookings`: requests, source, status, appointment date/time, and staff notes.
- `follow_ups`: scheduled follow-ups associated with patients and optionally bookings.

`app/actions/staff-bookings.ts` contains protected, database-backed helper actions for listing, updating and linking bookings; **the current dashboard does not call these actions yet**. `lib/server/auth.ts` checks a staff cookie against an environment token, but there is no complete user login/session-management feature.

## Run locally

Requirements: **Node.js 20+** and npm. PostgreSQL is optional for the browser-only demo.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for patient booking and [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for reception.

### Optional PostgreSQL setup (experimental)

1. Create a PostgreSQL database, for example `clinic_demo`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and a long random `STAFF_SESSION_TOKEN`.
3. Run the SQL schema:

   ```bash
   psql "$DATABASE_URL" -f db/migrations/001_clinic.sql
   ```

4. Restart the development server.

**Caution:** Enabling the database does not automatically connect the dashboard. For an end-to-end single-browser demo, leave `DATABASE_URL` unset until the dashboard integration is implemented.

## Project structure

```text
app/
  page.tsx                 # Patient booking landing page
  dashboard/page.tsx       # Reception dashboard (localStorage)
  actions/
    public-bookings.ts     # Public booking Server Action
    staff-bookings.ts      # Database-oriented staff Server Actions
lib/
  storage.ts               # Typed demo records and localStorage helpers
  clinic-content.ts       # Clinic labels, reasons and areas
  server/
    db.ts                  # PostgreSQL connection pool
    auth.ts                # Staff-session guard (partial)
db/
  migrations/001_clinic.sql
  seed.sql                 # Demo/test records; fictional only
public/                    # Logo and placeholder map artwork
docs/                      # Architecture and portfolio copy
```

## What's next

1. Move reception reads and writes from browser storage to the server, using one PostgreSQL source of truth.
2. Create a robust staff authentication/authorization flow with role-based permissions.
3. Add safe patient matching, server-side validation, transactions, appointment conflicts and audit history.
4. Add pagination/filtering and an intentional refresh or live-update strategy.
5. Apply privacy and security controls before collecting real medical or personal information.

## Credits

- **Software development:** Project developer, using **OpenAI Codex** as an AI coding assistant.
- **UI/UX and brand identity:** Project teammate (name can be added with their permission).
- **Result:** 4th place at the hackathon.

See [Portfolio project summary](docs/portfolio.md) for ready-to-adapt copy for a personal portfolio or `sitehie.info`.

## Disclaimer

All seeded records are fictional. This is a learning and hackathon prototype, **not a medical records system or deployed clinic service**. The ADEM brand artwork is credited to the UI/UX contributor; re-use outside this project should be agreed with the creator.