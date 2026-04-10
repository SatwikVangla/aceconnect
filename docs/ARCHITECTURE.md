# Architecture

## Overview

Ace Connect is a small full-stack application with:

- a static frontend built from plain HTML, CSS, and browser JavaScript
- a lightweight Node HTTP server
- a SQLite database used for persistent profile data

The server handles two jobs:

1. Serve the static site.
2. Provide JSON API endpoints consumed by the frontend.

## Runtime Flow

1. The user opens `/`.
2. [`index.js`](/home/satwik/aceconnect/index.js) fetches `/api/departments`.
3. The user navigates into department, batch, section, roll number, and profile screens.
4. Each screen fetches the next dataset from the backend.
5. The profile page can update profile data through `PUT /api/profiles/:rollNumber`.

## Frontend Structure

- `index.html` is the landing page shell.
- `index.js` renders department cards from backend data.
- `cse/` contains the department-specific pages for batches, sections, roll numbers, and profiles.
- `utilities/spinner.js` is a shared loading helper.

## Backend Structure

- [`backend/server.js`](/home/satwik/aceconnect/backend/server.js) is the HTTP server and route layer.
- [`backend/data.js`](/home/satwik/aceconnect/backend/data.js) is the data access layer.
- [`backend/seed-data.json`](/home/satwik/aceconnect/backend/seed-data.json) seeds the SQLite database on first run.
- `backend/aceconnect.sqlite` is the generated runtime database file.

## Data Model

The backend stores three logical entities:

- departments
- sections
- profiles

Roll numbers are generated from department code and batch metadata instead of being stored as a separate table.

## Auth Model

Admin write protection is header-based.

- If `ADMIN_TOKEN` is not set, write routes are open.
- If `ADMIN_TOKEN` is set, protected routes require `X-Admin-Token`.
- The frontend stores the token in browser `localStorage` after validation.

## Storage Strategy

SQLite is used for persistence because it is simple, local, and requires no external service.

- good fit for local development
- persistent across server restarts
- safer than rewriting a shared JSON document

The seed JSON file exists only to initialize a fresh database.

## Current Limits

- no user accounts or sessions
- no role-based permissions beyond one admin token
- no separate student table
- no department-specific modules beyond the current CSE flow
