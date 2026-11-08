# ADEM — Product notes

## Purpose

ADEM is a hackathon prototype for Arabic-first dermatology clinic appointment requests and receptionist workflows. The team earned 4th place.

## Technology

Next.js 14 (App Router), React, TypeScript, custom CSS, browser localStorage, PostgreSQL schema, and partially connected server actions.

## Users and workflows

- **Patients** submit a booking request with name, age, neighborhood, optional phone and reason for visit.
- **Reception staff** view and filter bookings, add WhatsApp requests manually, assign appointment dates and times, prepare WhatsApp confirmations and track follow-ups.
- **Analytics** show an area-by-age heatmap in the reception dashboard.

## Current prototype boundaries

- The dashboard currently reads and writes browser localStorage.
- The patient booking Server Action saves to PostgreSQL only when DATABASE_URL is configured; otherwise the client saves demo data to localStorage.
- The database and dashboard are not yet connected into a shared source of truth.
- Staff database actions and a cookie guard exist, but a complete login flow is not implemented.
- WhatsApp links only prepare messages; actual sending is manual.
- Seeded records are fictional; the app is not ready for real clinical data.

## Next technical steps

1. Move all reads and writes to a single PostgreSQL-backed data layer.
2. Implement staff authentication and authorization.
3. Add transactions, audit trails, appointment validation and safe handling of personal information.
4. Test the full booking-to-reception flow across browsers/devices.

## Credits

Software development: Hussein (with OpenAI Codex as an assistant).
UI/UX and brand identity: collaborating designer.

See README.md and docs/architecture.md for details.
