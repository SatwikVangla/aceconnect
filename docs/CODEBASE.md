# Codebase Guide

## Root Files

### [`index.html`](/home/satwik/aceconnect/index.html)

Landing page HTML shell. It loads Bootstrap, site CSS, and [`index.js`](/home/satwik/aceconnect/index.js).

### [`index.js`](/home/satwik/aceconnect/index.js)

Loads department data from the backend and renders department cards into the page body.

Main responsibilities:

- call `/api/departments`
- render department cards
- use a fallback card if the backend request fails

### [`package.json`](/home/satwik/aceconnect/package.json)

Defines the project as an ES module package and exposes the `npm start` command.

### [`README.md`](/home/satwik/aceconnect/README.md)

Top-level usage guide with links to the rest of the documentation.

## Shared Utility

### [`utilities/spinner.js`](/home/satwik/aceconnect/utilities/spinner.js)

Exports `spinnerRender(element)`, a small helper that replaces an element's content with a Bootstrap spinner.

## Styling

### [`css/index.css`](/home/satwik/aceconnect/css/index.css)

Styles the landing page layout and department cards.

### [`dist/`](/home/satwik/aceconnect/dist)

Vendored Bootstrap assets. These files are third-party library code and are not the project’s application logic.

## Department Flow: `cse/`

The `cse/` folder currently contains the only department flow in the app.

### [`cse/cse.html`](/home/satwik/aceconnect/cse/cse.html)

Batch selection page shell.

### [`cse/cse.js`](/home/satwik/aceconnect/cse/cse.js)

Fetches department batches from `/api/departments/:id/batches` and renders them as buttons.

### [`cse/cse.css`](/home/satwik/aceconnect/cse/cse.css)

Batch page styling.

### [`cse/sections.html`](/home/satwik/aceconnect/cse/sections.html)

Section selection page shell.

### [`cse/sections.js`](/home/satwik/aceconnect/cse/sections.js)

Fetches sections from `/api/departments/:id/sections` and passes batch context through query params.

### [`cse/sections.css`](/home/satwik/aceconnect/cse/sections.css)

Section page styling.

### [`cse/rollnumber.html`](/home/satwik/aceconnect/cse/rollnumber.html)

Roll number list page shell.

### [`cse/rollnumber.js`](/home/satwik/aceconnect/cse/rollnumber.js)

Fetches generated roll numbers from `/api/departments/:id/rollnumbers` and links each one to a profile page.

### [`cse/rollnumber.css`](/home/satwik/aceconnect/cse/rollnumber.css)

Roll number page styling.

### [`cse/profile.html`](/home/satwik/aceconnect/cse/profile.html)

Profile page shell containing both the read-only profile view container and the editor container.

### [`cse/profile.js`](/home/satwik/aceconnect/cse/profile.js)

Small API helper for fetching a profile by roll number with optional context query parameters.

### [`cse/profiles.js`](/home/satwik/aceconnect/cse/profiles.js)

Main profile page controller.

Main responsibilities:

- fetch profile data
- fetch auth config
- fetch current session user
- render the profile summary
- render the login form when the user is not authenticated
- render the editor form
- call login, logout, and change-password endpoints
- submit profile updates to `PUT /api/profiles/:rollNumber`

### [`cse/profile.css`](/home/satwik/aceconnect/cse/profile.css)

Styles the profile layout and editor card.

## Backend

### [`backend/server.js`](/home/satwik/aceconnect/backend/server.js)

The application server.

Main responsibilities:

- create the Node HTTP server
- parse routes and query params
- handle CORS headers
- read and clear session cookies
- authenticate session-backed users
- serve static assets
- expose JSON API endpoints

### [`backend/data.js`](/home/satwik/aceconnect/backend/data.js)

SQLite-backed data access layer.

Main responsibilities:

- create the database and schema
- seed the database from JSON on first run
- fetch departments and sections
- generate batches and roll numbers
- hash and verify user passwords
- create and validate sessions
- read profiles
- save profiles
- seed missing generated profiles

### [`backend/seed-data.json`](/home/satwik/aceconnect/backend/seed-data.json)

Bootstrap data used only when a new SQLite database is created.

### `backend/aceconnect.sqlite`

Generated runtime database file. This file is ignored by git and not committed.

## Images

### [`images/`](/home/satwik/aceconnect/images)

Static image assets used by the UI, including logos and department thumbnails.

## Query-Parameter Flow

The frontend uses query parameters to keep navigation context.

Typical flow:

1. `index.html`
2. `cse/cse.html?department=cse`
3. `cse/sections.html?department=cse&batchStart=2022&batchEnd=2026`
4. `cse/rollnumber.html?department=cse&batchStart=2022&batchEnd=2026&section=A`
5. `cse/profile.html?rollNumber=22AG1A0501&departmentId=cse&batchStart=2022&section=A`

The profile page can reconstruct backend context from URL params and form payloads.
