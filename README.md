# Ace Connect

Ace Connect is a small full-stack student directory app. It serves a browser frontend, a session-based Node backend, SQLite persistence, an admin dashboard, and cohort/student/profile management.

Detailed documentation:

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Codebase Guide](./docs/CODEBASE.md)


## Run

```bash
npm start
```

The app starts on `http://127.0.0.1:3000`.

Run tests with:

```bash
npm test
```

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
- admin users can open a dedicated admin dashboard page for user management
- the homepage now includes direct shortcuts to the cohort browser, sample profile, and admin dashboard

## User Management

Admins can:

- list all users
- create admin or editor accounts
- update another user's full name and role
- delete another user account
- access those controls from `cse/admin.html`

## Student Management

Admins can also manage persisted student records from the dedicated admin dashboard.

- list cohort students through `GET /api/students`
- create students through `POST /api/students`
- update students through `PUT /api/students/:rollNumber`
- delete students through `DELETE /api/students/:rollNumber`
- open the linked profile page directly from the dashboard

Profile edits stay synchronized with the student table for shared fields like name, email, phone, section, batch, and department.

Safety rules:

- an admin cannot delete their own account
- an admin cannot delete the last remaining admin
- an admin cannot change their own role through the user-management panel

## Backend Storage

Profile data is stored in SQLite at runtime and bootstrapped from [`backend/seed-data.json`](/home/satwik/aceconnect/backend/seed-data.json).

## Deployment

The repo now includes deployment-ready files:

- [`Dockerfile`](/home/satwik/aceconnect/Dockerfile)
- [`.dockerignore`](/home/satwik/aceconnect/.dockerignore)
- [`render.yaml`](/home/satwik/aceconnect/render.yaml)

Quick Docker run:

```bash
docker build -t aceconnect .
docker run -p 3000:3000 aceconnect
```
