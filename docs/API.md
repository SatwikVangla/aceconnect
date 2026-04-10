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
  "seedPath": "/.../backend/seed-data.json"
}
```

## Admin

### `GET /api/admin/config`

Returns whether admin auth is enabled.

### `POST /api/admin/session`

Validates an admin token.

Request body:

```json
{
  "token": "change-me"
}
```

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

Protected when `ADMIN_TOKEN` is set.

Required header when protected:

```text
X-Admin-Token: <token>
```

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

Protected when `ADMIN_TOKEN` is set.

Optional query params:

- `departmentId`
- `batchStart`
- `section`

Creates missing default profiles for the selected cohort.
