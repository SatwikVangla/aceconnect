import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getBatches,
  getDepartment,
  getDepartments,
  getProfile,
  getRollNumbers,
  getSections,
  getStorageInfo,
  listProfiles,
  saveProfile,
  seedGeneratedProfiles,
} from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
const adminToken = process.env.ADMIN_TOKEN || '';

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
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  });
  response.end(JSON.stringify(payload));
}

function sendNoContent(response) {
  response.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  });
  response.end();
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

function isAdminAuthorized(request) {
  if (!adminToken) {
    return true;
  }

  const headerToken = request.headers['x-admin-token'];
  return typeof headerToken === 'string' && headerToken === adminToken;
}

function requireAdmin(request, response) {
  if (isAdminAuthorized(request)) {
    return true;
  }

  sendJson(response, 401, { error: 'Admin authorization required' });
  return false;
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
    });
    return;
  }

  if (pathname === '/api/admin/config' && request.method === 'GET') {
    sendJson(response, 200, {
      authEnabled: Boolean(adminToken),
    });
    return;
  }

  if (pathname === '/api/admin/session' && request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      const providedToken = typeof body.token === 'string' ? body.token : '';
      const valid = !adminToken || providedToken === adminToken;

      if (!valid) {
        sendJson(response, 401, { error: 'Invalid admin token' });
        return;
      }

      sendJson(response, 200, { ok: true });
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body' });
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
    if (!requireAdmin(request, response)) {
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
    if (!requireAdmin(request, response)) {
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
