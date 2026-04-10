import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  departments,
  getBatches,
  getDepartment,
  getProfile,
  getRollNumbers,
  sections,
} from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';

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
  });
  response.end(JSON.stringify(payload));
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

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: 'Invalid request' });
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const { pathname, searchParams } = requestUrl;

  if (pathname === '/api/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (pathname === '/api/departments') {
    sendJson(response, 200, departments);
    return;
  }

  const batchMatch = pathname.match(/^\/api\/departments\/([^/]+)\/batches$/);

  if (batchMatch) {
    const department = getDepartment(batchMatch[1]);

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
    const department = getDepartment(sectionsMatch[1]);

    if (!department) {
      sendJson(response, 404, { error: 'Department not found' });
      return;
    }

    const batchStart = searchParams.get('batchStart');
    const batchEnd = searchParams.get('batchEnd');
    const batchLabel = batchStart && batchEnd ? `${batchStart} - ${batchEnd}` : null;

    sendJson(response, 200, {
      department,
      batchLabel,
      sections,
    });
    return;
  }

  const rollNumberMatch = pathname.match(/^\/api\/departments\/([^/]+)\/rollnumbers$/);

  if (rollNumberMatch) {
    const department = getDepartment(rollNumberMatch[1]);

    if (!department) {
      sendJson(response, 404, { error: 'Department not found' });
      return;
    }

    const batchStart = searchParams.get('batchStart');
    const batchEnd = searchParams.get('batchEnd');
    const section = searchParams.get('section') ?? 'A';

    sendJson(response, 200, {
      department,
      batchLabel: batchStart && batchEnd ? `${batchStart} - ${batchEnd}` : null,
      section,
      rollNumbers: getRollNumbers(batchStart, section),
    });
    return;
  }

  const profileMatch = pathname.match(/^\/api\/profiles\/([^/]+)$/);

  if (profileMatch) {
    sendJson(response, 200, getProfile(decodeURIComponent(profileMatch[1])));
    return;
  }

  await serveStatic(response, pathname);
});

server.listen(port, host, () => {
  console.log(`Ace Connect server running on http://${host}:${port}`);
});
