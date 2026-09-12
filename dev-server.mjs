import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanGalleries } from './gallery.mjs';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

function send(response, status, contentType, body, method) {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  response.end(method === 'HEAD' ? undefined : body);
}

createServer(async (request, response) => {
  const method = request.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    send(response, 405, 'text/plain; charset=utf-8', 'Method not allowed', method);
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    send(response, 400, 'text/plain; charset=utf-8', 'Bad request', method);
    return;
  }

  if (pathname === '/gallery-data.json') {
    try {
      const body = `${JSON.stringify(await scanGalleries())}\n`;
      send(response, 200, mimeTypes['.json'], body, method);
    } catch (error) {
      console.error(error);
      send(response, 500, 'text/plain; charset=utf-8', 'Could not scan gallery folders', method);
    }
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(projectRoot, relativePath);
  if (!filePath.startsWith(`${projectRoot}${sep}`)) {
    send(response, 403, 'text/plain; charset=utf-8', 'Forbidden', method);
    return;
  }

  try {
    const file = await stat(filePath);
    if (!file.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': file.size,
      'Cache-Control': 'no-store',
    });
    if (method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    send(response, 404, 'text/plain; charset=utf-8', 'Not found', method);
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Portfolio preview: http://127.0.0.1:${port}`);
  console.log('Drop files into works/* — galleries refresh automatically.');
});
