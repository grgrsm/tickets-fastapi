# Event Ticket Booking

A full-stack MVP: step-by-step booking (participants → contact → review → result), server-side pricing and rules, and an atomic booking transaction that locks the event row in PostgreSQL. The demo event takes place in New York.

## Features
- 1–4 participants, each with a name and age. The ticket type is derived from age: full 2,000 ₽ (14+), child 1,000 ₽ (under 14).
- A child under 14 can attend only if the same booking includes a participant aged 18+ (a 17-year-old does not count as an adult).
- One contact email per order (normalized: trimmed and lowercased), age 0–120, names are trimmed and cannot be empty.
- Participants and contact details can be edited before confirmation. Duplicate submissions are blocked. Loading, error, success and sold-out states are handled.
- API: `GET /api/v1/events`, `GET /api/v1/events/{id}`, `POST /api/v1/bookings` (201/404/409/422), `GET /api/v1/bookings/{id}`. Errors have one shape: `{"error": {"code", "message", "details"?}}`.
- The UI is fully in English. Palette: `#895aeb` (accent: header, buttons, tabs), `#111013` (text), `#fefeff` (page and card background). The event time is shown in New York time.

## Stack
Next.js 15 (App Router), React 19, strict TypeScript, Tailwind 3 — no extra libraries (the form is simple, so React Hook Form and Zod are not needed). FastAPI, Pydantic v2, SQLAlchemy 2 async + asyncpg, Alembic, PostgreSQL 16, pytest + HTTPX. Versions are pinned (`requirements.txt`, `frontend/package-lock.json`).

## Run (only Docker with Compose is required)
```bash
cp .env.example .env        # change the password if you like
docker compose up --build
```
Migrations (`alembic upgrade head`) and the idempotent demo-event seed run automatically when the backend starts (`backend/entrypoint.sh`). To run them manually:
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```
- App: http://localhost:3000
- API: http://localhost:8000/api/v1/events
- Swagger: http://localhost:8000/docs

## Demo
- **Successful booking:** add a participant (for example Anna, 30), enter an email and confirm. A booking number appears.
- **Sold out:** leave one seat and order two:
  ```bash
  docker compose exec backend python -m app.seed --set-booked 19   # default capacity is 20
  ```
  Order 2 participants. The real transaction returns 409 and the entered data is kept. Reset with `--set-booked 0`. The command is available only from the container console; there is no public endpoint that changes capacity. For another capacity set `DEMO_EVENT_CAPACITY` in `.env` (applied when the event is created, i.e. on a fresh database: `docker compose down -v`).

## Backend tests
```bash
docker compose run --rm --entrypoint pytest backend -q
```
Tests use a separate `tickets_test` database (created by the `db/init` script; on an existing volume create it with `docker compose exec db createdb -U tickets tickets_test`). The test configuration refuses to run against a database whose name does not end with `_test`.

## Transaction and concurrency
`booking_service.create_booking`: validate and price → `async with session.begin()` → `SELECT … FOR UPDATE` on the event row → check `capacity - booked_tickets >= N` → insert the booking and participants, `booked_tickets += N` → commit. Any exception rolls everything back. Concurrent requests queue on the row lock. `events.booked_tickets` is the single source of truth, with a CHECK constraint `booked_tickets <= capacity` as a safety net.

## Structure and where to change things
```
backend/app/{api/routes, schemas, services, repositories, db/models, seed.py, exceptions.py}
backend/alembic, backend/tests
frontend/src/{app, components/booking, lib, types}
```
| What to change | Where |
|---|---|
| Prices, child age threshold, participant limit, adult age | `backend/app/services/pricing.py` (constants) |
| Accompaniment rule | `pricing.has_required_adult` + the message in `booking_service.validate_participants` |
| Capacity | `DEMO_EVENT_CAPACITY` in `.env` for a new event, or `python -m app.seed --set-booked` for the demo; in code — `app/seed.py` |
| Event name, description, venue | constants at the top of `backend/app/seed.py`; run `python -m app.seed` to refresh the existing event |
| New order field | schema `schemas/booking.py`, model `db/models/booking.py` + Alembic migration, `booking_service.py`, type `frontend/src/types/api.ts`, form in `components/booking/` |

The frontend receives prices and thresholds from the API (`pricing` on the event), so only simple checks are duplicated for instant feedback (`frontend/src/lib/validation.ts`).

## Verification results (actually run in the development environment)
- Backend: `pytest` against real PostgreSQL 16 — **21 tests passed** (prices, the 13/14 age boundary, the adult rule, validation, forged prices, 409 without partial records, 8 parallel orders for 5 seats → exactly 5×201 and 3×409).
- Frontend: `tsc --noEmit` and `next build` pass; the server-rendered page loads the event from the live API; CORS preflight checked.
- Sold-out scenario via `python -m app.seed --set-booked 19` and an order for two participants → HTTP 409 from the real transaction.

## Limitations
- **Docker was not available in the development environment**, so `docker compose up` and the Dockerfiles were **not run**; backend and frontend were checked directly against a local PostgreSQL. Run `docker compose up --build` before a demo.
- The UI was exercised in headless Chromium (desktop 1280 px and mobile 360 px): the full flow participant → email → review → confirmation works and there is no horizontal overflow. This was a manual run; the project has no frontend automated tests.
- No payments, accounts, emails or temporary seat reservations (by specification).
- Prices stay in rubles (₽) as in the original specification, even though the demo event is in New York.
