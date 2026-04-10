# API Reference

## Base

All endpoints are served by the local Node backend.

## Health

### `GET /api/health`

Returns service health and storage info.

Example response:

```json
{
  "ok": true,
  "engine": "sqlite",
  "path": "/.../backend/aceconnect.sqlite",
  "seedPath": "/.../backend/seed-data.json",
  "auth": {
    "authEnabled": true,
    "sessionCookieName": "aceconnect_session"
  }
}
```

## Auth

### `GET /api/auth/config`

Returns auth configuration.

### `GET /api/auth/me`

Returns the authenticated user for the current session cookie.

### `POST /api/auth/login`

Creates a session and returns a `Set-Cookie` header.

Request body:

```json
{
  "username": "admin",
  "password": "change-me-now"
}
```

### `POST /api/auth/logout`

Deletes the current session and clears the cookie.

### `POST /api/auth/change-password`

Requires an authenticated `admin` or `editor` session.

Request body:

```json
{
  "newPassword": "strong-password"
}
```

## Users

### `GET /api/users`

Requires an authenticated `admin` session.

Returns all users without password fields.

### `POST /api/users`

Requires an authenticated `admin` session.

Request body:

```json
{
  "username": "editor1",
  "fullName": "Editor One",
  "role": "editor",
  "password": "strong-password"
}
```

### `PUT /api/users/:userId`

Requires an authenticated `admin` session.

Request body:

```json
{
  "fullName": "Updated Name",
  "role": "admin"
}
```

### `DELETE /api/users/:userId`

Requires an authenticated `admin` session.

## Departments

### `GET /api/departments`

Returns all departments.

### `GET /api/departments/:departmentId/batches`

Returns department metadata and generated batch list.

### `GET /api/departments/:departmentId/sections`

Query params:

- `batchStart`
- `batchEnd`

Returns sections for the selected batch context.

### `GET /api/departments/:departmentId/rollnumbers`

Query params:

- `batchStart`
- `batchEnd`
- `section`

Returns generated roll numbers for the selected section.

## Profiles

### `GET /api/profiles`

Optional query params:

- `departmentId`
- `batchStart`
- `section`

Returns stored profiles filtered by the provided fields.

### `GET /api/profiles/:rollNumber`

Optional query params:

- `departmentId`
- `batchStart`
- `section`

Returns a stored profile if one exists. Otherwise returns a generated default profile shape.

### `PUT /api/profiles/:rollNumber`

Requires an authenticated `admin` or `editor` session.

JSON body fields accepted:

- `imageSrc`
- `name`
- `qualifications`
- `address`
- `website`
- `github`
- `twitter`
- `instagram`
- `facebook`
- `fullName`
- `email`
- `phone`
- `mobile`
- `section`
- `departmentId`
- `batchStart`
- `bio`

### `POST /api/profiles/seed`

Requires an authenticated `admin` or `editor` session.

Optional query params:

- `departmentId`
- `batchStart`
- `section`

Creates missing default profiles for the selected cohort.
