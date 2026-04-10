# Architecture

## Overview

Ace Connect is a small full-stack application with:

- a static frontend built from plain HTML, CSS, and browser JavaScript
- a lightweight Node HTTP server
- a SQLite database used for persistent students, profiles, users, and sessions

The server handles two jobs:

1. Serve the static site.
2. Provide JSON API endpoints consumed by the frontend.

## Runtime Flow

1. The user opens `/`.
2. [`index.js`](/home/satwik/aceconnect/index.js) fetches `/api/departments`.
3. The user navigates into department, batch, section, roll number, and profile screens.
4. Each screen fetches the next dataset from the backend.
5. The profile page can update profile data through `PUT /api/profiles/:rollNumber`.
6. Admins can open a dedicated dashboard from the homepage and manage both users and students.

## Frontend Structure

- `index.html` is the landing page shell.
- `index.js` renders department cards, auth-aware quick links, and top-level navigation to profile/admin flows.
- `cse/` contains the department-specific pages for batches, sections, roll numbers, and profiles.
- `utilities/spinner.js` is a shared loading helper.

## Backend Structure

- [`backend/server.js`](/home/satwik/aceconnect/backend/server.js) is the HTTP server and route layer.
- [`backend/data.js`](/home/satwik/aceconnect/backend/data.js) is the data access layer.
- [`backend/seed-data.json`](/home/satwik/aceconnect/backend/seed-data.json) seeds the SQLite database on first run.
- `backend/aceconnect.sqlite` is the generated runtime database file.

## Data Model

The backend stores six logical entities:

- departments
- sections
- students
- profiles
- users
- sessions

Generated cohorts are materialized into the `students` table on demand. That keeps the original generated roll-number behavior while also enabling CRUD and persistence.

## Auth Model

Authentication is session-based.

- Users are stored in SQLite with salted password hashes.
- Successful login creates a row in the `sessions` table.
- The server returns an HTTP-only `aceconnect_session` cookie.
- Protected write routes require a valid session whose user role is `admin` or `editor`.
- The profile page uses `/api/auth/me` to decide whether to show the login form or the editor.
- Admin-only user-management endpoints allow account creation, role updates, and deletion.
- Admin-only student endpoints allow cohort record creation, editing, and deletion.
- A dedicated admin dashboard page provides the UI for both user and student operations.

## Storage Strategy

SQLite is used for persistence because it is simple, local, and requires no external service.

- good fit for local development
- persistent across server restarts
- safer than rewriting a shared JSON document

The seed JSON file exists only to initialize a fresh database.

## Current Limits

- no self-service user registration
- no non-admin student-management UI
- no department-specific modules beyond the current CSE flow
- no production deployment has been executed yet, only deployment-ready configuration
