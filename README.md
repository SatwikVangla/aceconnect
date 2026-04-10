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

## Authentication

The backend now uses real users and sessions instead of a single admin token.

Bootstrap admin account on first database creation:

- username: `admin`
- password: `change-me-now`

You can override those first-run bootstrap values with:

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=strong-password ADMIN_NAME="Ace Admin" npm start
```

Write routes require a logged-in `admin` or `editor` session:

- `POST /api/profiles/seed`
- `PUT /api/profiles/:rollNumber`
- `POST /api/auth/change-password`

Frontend behavior:

- the profile editor shows a login form when no valid session exists
- login creates an HTTP-only session cookie
- logout clears the session
- authenticated users can change their password from the profile page
- admin users can manage other users from the profile page

## User Management

Admins can:

- list all users
- create admin or editor accounts
- update another user's full name and role
- delete another user account

Safety rules:

- an admin cannot delete their own account
- an admin cannot delete the last remaining admin
- an admin cannot change their own role through the user-management panel

## Backend Storage

Profile data is stored in SQLite at runtime and bootstrapped from [`backend/seed-data.json`](/home/satwik/aceconnect/backend/seed-data.json).
