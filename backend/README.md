# E-Skedyul Admin Frontend and FastAPI Backend

This branch connects the Admin frontend to the FastAPI API and Supabase-backed storage.

## Architecture

React Admin frontend -> FastAPI -> Supabase PostgreSQL
The backend authenticates administrators with Supabase Auth and checks their active administrator profile before protected API operations.

## Setup

1. Create a Supabase project.
2. Run `schema.sql` in the Supabase SQL Editor for a new database. For an existing database, review and run `migrations/001_join_codes_and_join_requests.sql` as appropriate.
3. Copy `.env.example` to `.env` inside the `backend` directory.
4. Fill in `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and the initial administrator settings. Never commit the real `.env` file or expose the Supabase secret key in browser code.
5. From `backend`, create and activate a virtual environment, install `requirements.txt`, and create the first administrator with `python scripts/create_admin.py`.
6. Start the API with `uvicorn admin.app:app --reload --host 127.0.0.1 --port 8000`.
7. Set the frontend `VITE_API_URL` to the API URL if it differs from the default `http://127.0.0.1:8000`, then start the frontend using the repository's normal pnpm commands.

Example PowerShell commands:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
python scripts/create_admin.py
uvicorn admin.app:app --reload --host 127.0.0.1 --port 8000
```

Create the database schema before creating the initial administrator. The bootstrap script requires valid Supabase credentials and a configured database URL.

## Admin API integration

The Admin login calls `POST /admin/auth/login`. After authentication, the frontend stores the returned access token and sends it as a Bearer token for protected requests. Initial organization, event, and join-request data is loaded from `GET /admin/dashboard/bootstrap`.

Other Admin endpoints cover organization CRUD and status/join-code management, event CRUD and conflict checking, organization administrator assignments, and join-request review. The API is defined in `admin/routes/`; the UI integration is in `src/features/admin/` and the shared API helper is `src/lib/api.ts`.

## Join-request limitation

Public join requests currently contain a member name and an organization join code, but not an authenticated member ID or verified member profile. Admin approval records the decision and reviewer details; **it does not create a member account or organization membership**. The current organization membership table is for administrator profiles. Completing member access requires a member identity/profile model and corresponding member-side integration. The Wizard, Account, and Management frontend files are intentionally outside this Admin-only change.

## Tests

From the repository root, run the frontend type check and production build:

```powershell
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm build
```

Run backend tests from the `backend` directory:

```powershell
pip install -r requirements.txt
python -m pytest
```

The branch includes a GitHub Actions workflow to run these checks on updates to the Admin integration branch and on pull requests to `main`.

## Security notes

- Do not commit `backend/.env`; use `.env.example` only as a template.
- Keep `SUPABASE_SECRET_KEY` on the server only.
- Protect all Admin endpoints with Supabase token validation and an active Admin profile.
