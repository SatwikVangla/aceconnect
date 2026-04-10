import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'aceconnect-test-'));
process.env.ACECONNECT_SQLITE_PATH = path.join(tempDir, 'aceconnect.sqlite');
process.env.ACECONNECT_SEED_PATH = path.join(process.cwd(), 'backend', 'seed-data.json');
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'change-me-now';
process.env.ADMIN_NAME = 'Ace Connect Admin';

const { startServer } = await import('../backend/server.js');
const { closeDatabase } = await import('../backend/data.js');

const { server, port } = await startServer({ host: '127.0.0.1', port: 0 });
const baseUrl = `http://127.0.0.1:${port}`;

function extractCookie(response) {
  const cookie = response.headers.get('set-cookie');
  assert.ok(cookie, 'expected set-cookie header');
  return cookie.split(';')[0];
}

async function api(pathname, options = {}) {
  return fetch(`${baseUrl}${pathname}`, options);
}

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
  closeDatabase();
  await rm(tempDir, { recursive: true, force: true });
});

test('health endpoint reports sqlite storage and auth config', async () => {
  const response = await api('/api/health');
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.engine, 'sqlite');
  assert.equal(payload.auth.authEnabled, true);
});

test('login creates a valid session and me returns the admin user', async () => {
  const loginResponse = await api('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'change-me-now',
    }),
  });

  assert.equal(loginResponse.status, 200);
  const cookie = extractCookie(loginResponse);

  const meResponse = await api('/api/auth/me', {
    headers: {
      Cookie: cookie,
    },
  });

  assert.equal(meResponse.status, 200);
  const payload = await meResponse.json();
  assert.equal(payload.authenticated, true);
  assert.equal(payload.user.username, 'admin');
  assert.equal(payload.user.role, 'admin');
});

test('admin can create and list users', async () => {
  const loginResponse = await api('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'change-me-now',
    }),
  });
  const cookie = extractCookie(loginResponse);

  const createResponse = await api('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      username: 'editor1',
      fullName: 'Editor One',
      role: 'editor',
      password: 'strong-pass-1',
    }),
  });
  assert.equal(createResponse.status, 201);

  const listResponse = await api('/api/users', {
    headers: {
      Cookie: cookie,
    },
  });
  assert.equal(listResponse.status, 200);

  const users = await listResponse.json();
  assert.ok(users.some((user) => user.username === 'editor1' && user.role === 'editor'));
});

test('admin can create update and delete a student', async () => {
  const loginResponse = await api('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'change-me-now',
    }),
  });
  const cookie = extractCookie(loginResponse);
  const rollNumber = '22AG1A0599';

  const createResponse = await api('/api/students', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      rollNumber,
      departmentId: 'cse',
      batchStart: 2022,
      section: 'A',
      fullName: 'New Student',
      email: 'new.student@aceconnect.dev',
      phone: '9999999999',
      lateralEntry: false,
    }),
  });
  assert.equal(createResponse.status, 201);

  const updateResponse = await api(`/api/students/${rollNumber}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      departmentId: 'cse',
      batchStart: 2022,
      section: 'B',
      fullName: 'Updated Student',
      email: 'updated.student@aceconnect.dev',
      phone: '8888888888',
      lateralEntry: true,
    }),
  });
  assert.equal(updateResponse.status, 200);

  const listResponse = await api('/api/students?departmentId=cse&batchStart=2022&section=B', {
    headers: {
      Cookie: cookie,
    },
  });
  assert.equal(listResponse.status, 200);
  const students = await listResponse.json();
  assert.ok(students.some((student) => student.rollNumber === rollNumber && student.fullName === 'Updated Student'));

  const deleteResponse = await api(`/api/students/${rollNumber}`, {
    method: 'DELETE',
    headers: {
      Cookie: cookie,
    },
  });
  assert.equal(deleteResponse.status, 204);
});

test('profile updates synchronize shared fields back to the student record', async () => {
  const loginResponse = await api('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'change-me-now',
    }),
  });
  const cookie = extractCookie(loginResponse);

  const saveResponse = await api('/api/profiles/22AG1A0502', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      fullName: 'Synced Student',
      email: 'synced.student@aceconnect.dev',
      phone: '7777777777',
      section: 'C',
      departmentId: 'cse',
      batchStart: 2022,
      bio: 'Profile/student sync verification.',
    }),
  });
  assert.equal(saveResponse.status, 200);

  const studentResponse = await api('/api/students/22AG1A0502', {
    headers: {
      Cookie: cookie,
    },
  });
  assert.equal(studentResponse.status, 200);

  const student = await studentResponse.json();
  assert.equal(student.fullName, 'Synced Student');
  assert.equal(student.email, 'synced.student@aceconnect.dev');
  assert.equal(student.phone, '7777777777');
  assert.equal(student.section, 'C');
});
