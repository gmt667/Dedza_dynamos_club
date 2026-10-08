import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './api.mjs';

const root = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };

createServer(async (request, response) => {
  const urlObj = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
  const requestPath = decodeURIComponent(urlObj.pathname);
  const query = Object.fromEntries(urlObj.searchParams);

  if (requestPath.startsWith('/api/')) {
    const handled = await handleApiRequest(request, response, requestPath, query);
    if (handled) return;
  }

  const safePath = normalize(requestPath).replace(/^[/\\]+/, '').replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, safePath || 'index.html');
  if (filePath.startsWith(root) && existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
  const missing = !filePath.startsWith(root) || !existsSync(filePath);
  if (missing) filePath = join(root, '404.html');
  response.writeHead(missing ? 404 : 200, { 'content-type': types[extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-store' });
  createReadStream(filePath).pipe(response);
}).listen(4173, '127.0.0.1', () => console.log('Dedza Dynamos preview: http://127.0.0.1:4173'));
