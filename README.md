# Ace Connect

Ace Connect is a static frontend plus a small Node backend for browsing departments, batches, sections, roll numbers, and editable student profiles.

Detailed documentation:

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Codebase Guide](./docs/CODEBASE.md)

## Run

```bash
npm start
```

The app starts on `http://127.0.0.1:3000`.

## Storage

The backend now uses SQLite through Node's built-in `node:sqlite` module.

- Runtime database: `backend/aceconnect.sqlite`
- First-run seed file: `backend/seed-data.json`

The SQLite database is generated locally and ignored by git.

## Admin Auth

Write operations are protected by an admin token when `ADMIN_TOKEN` is set.

Example:

```bash
ADMIN_TOKEN=change-me npm start
```

Protected routes:

- `POST /api/profiles/seed`
- `PUT /api/profiles/:rollNumber`

Frontend behavior:

- If `ADMIN_TOKEN` is configured, the profile editor asks for the token before allowing saves.
- The token is stored in browser `localStorage` under `aceconnect_admin_token`.

## Backend Storage

Profile data is stored in SQLite at runtime and bootstrapped from [`backend/seed-data.json`](/home/satwik/aceconnect/backend/seed-data.json).
