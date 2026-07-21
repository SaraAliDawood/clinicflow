# ClinicFlow — Appointment Scheduling

[![CI](https://github.com/SaraAliDawood/clinicflow/actions/workflows/ci.yml/badge.svg)](https://github.com/SaraAliDawood/clinicflow/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tests](https://img.shields.io/badge/tests-Vitest-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

A clinic appointment-scheduling app: staff pick a provider and a day, see the
**live list of open slots**, and book a patient in — with **double-booking made
impossible**. Built to demonstrate non-trivial **scheduling logic** (availability
generation + interval-overlap conflict detection) on a clean full-stack base.

> Runs with **zero external services** (SQLite + seed). `npm run db:setup && npm run dev`.

```bash
git clone https://github.com/SaraAliDawood/clinicflow.git
cd clinicflow
cp .env.example .env
npm install
npm run db:setup      # migrate + seed providers, patients, appointments
npm run dev           # http://localhost:3000
```

**Login:** `admin@clinicflow.dev` / `password123`

---

## The interesting part: scheduling logic

`src/lib/scheduling.ts` is pure, dependency-free, and fully unit-tested:

- **Slot generation** — splits a provider's working window (`workStart`, `workEnd`, `slotMinutes`) into bookable slots.
- **Conflict detection** — half-open interval overlap (`a.start < b.end && b.start < a.end`), so touching slots (10:00–10:30 and 10:30–11:00) don't false-positive.
- **Double-booking prevention** — the booking endpoint re-checks for conflicts **inside a transaction**, so two racing requests can't both grab the same slot.

```ts
generateSlots(540, 660, 30, [{ start: 570, end: 600 }])
// 09:00–11:00, 30-min slots, 09:30 already booked → ['09:00','10:00','10:30']
```

## Features

- 📅 **Live availability** — pick provider + date, see open slots computed from working hours minus existing bookings.
- 🚫 **No double-books** — server-side conflict check in a transaction; a taken slot returns `409` and the UI refreshes.
- 👩‍⚕️ **Providers** with individual working hours and slot lengths (20 / 30 / 45 min).
- 🧑‍🤝‍🧑 **Patients** — list + quick-add.
- 📊 **Dashboard** — today's schedule and counts.
- 🔐 **Auth** — JWT (httpOnly cookie) + bcrypt, route-guarded.
- ✅ **Tested & typed** — Vitest suite over the scheduling logic; Zod-validated inputs.

## Architecture

```
src/
  lib/
    scheduling.ts   # pure slot generation + overlap detection (unit-tested)
    auth.ts db.ts http.ts validation.ts
  app/
    (app)/          # dashboard + booking (auth-guarded)
    api/            # Node route handlers: auth, providers, patients,
                    #   availability, appointments
    login/
  components/
prisma/             # schema, migration, seed
tests/              # Vitest — scheduling logic
```

## API

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/{register,login,logout}` | Auth |
| GET | `/api/providers` | Active providers + hours |
| GET/POST | `/api/patients` | List / create patients |
| GET | `/api/availability?providerId=&date=` | Open slots for a day |
| GET/POST | `/api/appointments` | List / book (conflict-checked) |
| PATCH | `/api/appointments/:id` | Update status |

## Built for scale

Indexed `(providerId, date)` for fast day lookups; availability computed in SQL-bounded
queries (one provider/day at a time, never full-table scans); stateless JWT auth for
horizontal scaling; standalone Docker output; SQLite locally, Postgres in prod
(flip the Prisma `provider`). CI runs typecheck + tests + build on every push.

## Testing

```bash
npm test          # scheduling unit tests
npx tsc --noEmit
```

## Tech stack

Next.js 15 · React 19 · TypeScript · Prisma · SQLite/Postgres · jose (JWT) ·
bcrypt · Zod · Tailwind CSS · Vitest · Docker · GitHub Actions.

---

Built by **Sara Dawood** — [portfolio](https://saraalidawood.github.io/PORTFOLIO/) · [GitHub](https://github.com/SaraAliDawood)
