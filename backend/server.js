import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  authenticateUser,
  changeUserPassword,
  createSession,
  createUser,
  deleteSession,
  deleteUser,
  getAuthConfig,
  getBatches,
  getDepartment,
  getDepartments,
  getProfile,
  getRollNumbers,
  getSessionUser,
  getSections,
  getStorageInfo,
  listUsers,
  listProfiles,
  saveProfile,
  seedGeneratedProfiles,
  updateUser,
} from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
const sessionCookieName = 'aceconnect_session';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  });
  response.end(JSON.stringify(payload));
}

function sendNoContent(response) {
  response.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  });
  response.end();
}

function sendJsonWithHeaders(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw);
}

async function serveStatic(response, pathname) {
  const relativePath = pathname === '/' ? '/index.html' : pathname;
  const resolvedPath = path.normalize(path.join(rootDir, relativePath));

  if (!resolvedPath.startsWith(rootDir)) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const file = await readFile(resolvedPath);
    const extension = path.extname(resolvedPath);

    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
    });
    response.end(file);
  } catch {
    sendJson(response, 404, { error: 'File not found' });
  }
}

function parseCookies(request) {
  const raw = request.headers.cookie;

  if (!raw) {
    return {};
  }

  return raw.split(';').reduce((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');

    if (separatorIndex === -1) {
      return cookies;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function buildSessionCookie(sessionId, expiresAt) {
  return `${sessionCookieName}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
}

function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

async function getRequestSession(request) {
  const cookies = parseCookies(request);
  return getSessionUser(cookies[sessionCookieName]);
}

async function requireEditorSession(request, response) {
  const session = await getRequestSession(request);

  if (session && ['admin', 'editor'].includes(session.user.role)) {
    return session;
  }

  sendJson(response, 401, { error: 'Authenticated editor session required' });
  return null;
}

async function requireAdminSession(request, response) {
  const session = await getRequestSession(request);

  if (session && session.user.role === 'admin') {
    return session;
  }

  sendJson(response, 403, { error: 'Admin session required' });
  return null;
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: 'Invalid request' });
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const { pathname, searchParams } = requestUrl;

  if (request.method === 'OPTIONS') {
    sendNoContent(response);
    return;
  }

  if (pathname === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      ...(await getStorageInfo()),
      auth: await getAuthConfig(),
    });
    return;
  }

  if (pathname === '/api/auth/config' && request.method === 'GET') {
    sendJson(response, 200, await getAuthConfig());
    return;
  }

  if (pathname === '/api/auth/me' && request.method === 'GET') {
    const session = await getRequestSession(request);
    sendJson(response, 200, {
      authenticated: Boolean(session),
      user: session?.user ?? null,
    });
    return;
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const user = await authenticateUser(username, password);

      if (!user) {
        sendJson(response, 401, { error: 'Invalid username or password' });
        return;
      }

      const session = await createSession(user.id);
      sendJsonWithHeaders(
        response,
        200,
        {
          ok: true,
          user,
        },
        {
          'Set-Cookie': buildSessionCookie(session.id, session.expiresAt),
        },
      );
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body' });
    }
    return;
  }

  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    const session = await getRequestSession(request);

    if (session) {
      await deleteSession(session.sessionId);
    }

    sendJsonWithHeaders(
      response,
      200,
      { ok: true },
      { 'Set-Cookie': clearSessionCookie() },
    );
    return;
  }

  if (pathname === '/api/auth/change-password' && request.method === 'POST') {
    const session = await requireEditorSession(request, response);

    if (!session) {
      return;
    }

    try {
      const body = await readJsonBody(request);
      const nextPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

      if (nextPassword.length < 8) {
        sendJson(response, 400, { error: 'New password must be at least 8 characters long' });
        return;
      }

      await changeUserPassword(session.user.id, nextPassword);
      sendJson(response, 200, { ok: true });
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body' });
    }
    return;
  }

  if (pathname === '/api/users' && request.method === 'GET') {
    if (!(await requireAdminSession(request, response))) {
      return;
    }

    sendJson(response, 200, await listUsers());
    return;
  }

  if (pathname === '/api/users' && request.method === 'POST') {
    const session = await requireAdminSession(request, response);

    if (!session) {
      return;
    }

    try {
      const body = await readJsonBody(request);
      const user = await createUser({
        username: typeof body.username === 'string' ? body.username : '',
        password: typeof body.password === 'string' ? body.password : '',
        fullName: typeof body.fullName === 'string' ? body.fullName : '',
        role: typeof body.role === 'string' ? body.role : 'editor',
      });
      sendJson(response, 201, user);
    } catch (error) {
      if (error instanceof Error && error.message === 'USERNAME_EXISTS') {
        sendJson(response, 409, { error: 'Username already exists' });
        return;
      }

      if (error instanceof Error && error.message === 'INVALID_USER_INPUT') {
        sendJson(response, 400, { error: 'Invalid user input' });
        return;
      }

      sendJson(response, 400, { error: 'Unable to create user' });
    }
    return;
  }

  const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);

  if (userMatch && request.method === 'PUT') {
    const session = await requireAdminSession(request, response);

    if (!session) {
      return;
    }

    try {
      const body = await readJsonBody(request);
      const user = await updateUser(
        decodeURIComponent(userMatch[1]),
        {
          fullName: typeof body.fullName === 'string' ? body.fullName : undefined,
          role: typeof body.role === 'string' ? body.role : undefined,
        },
        session.user.id,
      );
      sendJson(response, 200, user);
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        sendJson(response, 404, { error: 'User not found' });
        return;
      }

      if (error instanceof Error && error.message === 'INVALID_USER_INPUT') {
        sendJson(response, 400, { error: 'Invalid user input' });
        return;
      }

      if (error instanceof Error && error.message === 'CANNOT_CHANGE_OWN_ROLE') {
        sendJson(response, 400, { error: 'You cannot change your own role' });
        return;
      }

      sendJson(response, 400, { error: 'Unable to update user' });
    }
    return;
  }

  if (userMatch && request.method === 'DELETE') {
    const session = await requireAdminSession(request, response);

    if (!session) {
      return;
    }

    try {
      await deleteUser(decodeURIComponent(userMatch[1]), session.user.id);
      sendNoContent(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        sendJson(response, 404, { error: 'User not found' });
        return;
      }

      if (error instanceof Error && error.message === 'CANNOT_DELETE_SELF') {
        sendJson(response, 400, { error: 'You cannot delete your own account' });
        return;
      }

      if (error instanceof Error && error.message === 'CANNOT_DELETE_LAST_ADMIN') {
        sendJson(response, 400, { error: 'You cannot delete the last admin user' });
        return;
      }

      sendJson(response, 400, { error: 'Unable to delete user' });
    }
    return;
  }

  if (pathname === '/api/departments') {
    const departments = await getDepartments();
    sendJson(response, 200, departments);
    return;
  }

  const batchMatch = pathname.match(/^\/api\/departments\/([^/]+)\/batches$/);

  if (batchMatch) {
    const department = await getDepartment(batchMatch[1]);

    if (!department) {
      sendJson(response, 404, { error: 'Department not found' });
      return;
    }

    sendJson(response, 200, {
      department,
      batches: getBatches(),
    });
    return;
  }

  const sectionsMatch = pathname.match(/^\/api\/departments\/([^/]+)\/sections$/);

  if (sectionsMatch) {
    const department = await getDepartment(sectionsMatch[1]);

    if (!department) {
      sendJson(response, 404, { error: 'Department not found' });
      return;
    }

    const batchStart = searchParams.get('batchStart');
    const batchEnd = searchParams.get('batchEnd');
    const batchLabel = batchStart && batchEnd ? `${batchStart} - ${batchEnd}` : null;

    const sections = await getSections();

    sendJson(response, 200, {
      department,
      batchLabel,
      sections,
    });
    return;
  }

  const rollNumberMatch = pathname.match(/^\/api\/departments\/([^/]+)\/rollnumbers$/);

  if (rollNumberMatch) {
    const department = await getDepartment(rollNumberMatch[1]);

    if (!department) {
      sendJson(response, 404, { error: 'Department not found' });
      return;
    }

    const batchStart = searchParams.get('batchStart');
    const batchEnd = searchParams.get('batchEnd');
    const section = searchParams.get('section') ?? 'A';

    const rollNumbers = await getRollNumbers(rollNumberMatch[1], batchStart, section);

    sendJson(response, 200, {
      department,
      batchLabel: batchStart && batchEnd ? `${batchStart} - ${batchEnd}` : null,
      section,
      rollNumbers,
    });
    return;
  }

  if (pathname === '/api/profiles' && request.method === 'GET') {
    const profiles = await listProfiles({
      departmentId: searchParams.get('departmentId') ?? undefined,
      batchStart: searchParams.get('batchStart') ?? undefined,
      section: searchParams.get('section') ?? undefined,
    });
    sendJson(response, 200, profiles);
    return;
  }

  if (pathname === '/api/profiles/seed' && request.method === 'POST') {
    if (!(await requireEditorSession(request, response))) {
      return;
    }

    const result = await seedGeneratedProfiles({
      departmentId: searchParams.get('departmentId') ?? 'cse',
      batchStart: Number(searchParams.get('batchStart')) || 2022,
      section: searchParams.get('section') ?? 'A',
    });
    sendJson(response, 201, result);
    return;
  }

  const profileMatch = pathname.match(/^\/api\/profiles\/([^/]+)$/);

  if (profileMatch && request.method === 'GET') {
    const rollNumber = decodeURIComponent(profileMatch[1]);
    sendJson(response, 200, await getProfile(rollNumber, {
      departmentId: searchParams.get('departmentId') ?? 'cse',
      batchStart: Number(searchParams.get('batchStart')) || 2022,
      section: searchParams.get('section') ?? 'A',
    }));
    return;
  }

  if (profileMatch && request.method === 'PUT') {
    if (!(await requireEditorSession(request, response))) {
      return;
    }

    try {
      const rollNumber = decodeURIComponent(profileMatch[1]);
      const body = await readJsonBody(request);
      const profile = await saveProfile(rollNumber, body);
      sendJson(response, 200, profile);
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body' });
    }
    return;
  }

  await serveStatic(response, pathname);
});

server.listen(port, host, () => {
  console.log(`Ace Connect server running on http://${host}:${port}`);
});
