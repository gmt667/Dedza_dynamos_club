/**
 * Dedza Dynamos — Admin server
 * Runs on port 4174, completely separate from the public site (port 4173)
 * Access: http://127.0.0.1:4174/
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './api.mjs';

const PORT = 4174;
const root = resolve(fileURLToPath(new URL('./admin-dist/', import.meta.url)));

const types = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.js':    'text/javascript; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.ico':   'image/x-icon',
  '.webp':  'image/webp',
};

// Allow fetching club assets (crest, images) from the public dist folder
const publicAssets = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));

createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const reqPath = decodeURIComponent(urlObj.pathname);
  const query = Object.fromEntries(urlObj.searchParams);

  // Handle live Database REST API
  if (reqPath.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res, reqPath, query);
    if (handled) return;
  }

  const safe = normalize(reqPath).replace(/^[/\\]+/, '').replace(/^(\.\.[/\\])+/, '');

  // Serve from admin-dist first
  let filePath = join(root, safe || 'index.html');
  if (filePath.startsWith(root) && existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  // If not found in admin-dist, check public dist assets (images, brand, etc.)
  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    const publicPath = join(publicAssets, safe);
    if (publicPath.startsWith(publicAssets) && existsSync(publicPath) && !statSync(publicPath).isDirectory()) {
      filePath = publicPath;
    } else {
      // 404 — redirect to admin login
      res.writeHead(302, { location: '/' });
      res.end();
      return;
    }
  }

  const ct = types[extname(filePath)] || 'application/octet-stream';
  // Never cache admin files
  res.writeHead(200, {
    'content-type': ct,
    'cache-control': 'no-store, no-cache',
    'x-robots-tag': 'noindex',
  });
  createReadStream(filePath).pipe(res);
}).listen(PORT, '127.0.0.1', () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Dedza Dynamos — ADMIN PANEL                 ║');
  console.log(`║  http://127.0.0.1:${PORT}/                    ║`);
  console.log('║                                              ║');
  console.log('║  Credentials:  admin / admin123              ║');
  console.log('║  Public site:  http://127.0.0.1:4173/        ║');
  console.log('╚══════════════════════════════════════════════╝');
});
