import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/.fractions-fighter') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('Fractions Fighter local launcher'); return; }
    let path = resolve(root, '.' + pathname);
    if (path !== root.slice(0, -1) && !path.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403); res.end(); return; }
    try { if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html'); } catch { path = resolve(root, 'index.html'); }
    const bytes = await readFile(path); res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(bytes);
  } catch { res.writeHead(404); res.end('File not found'); }
});
function open(url) { const tool = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open'; execFile(tool, process.platform === 'win32' ? ['/c', 'start', '', url] : [url], () => {}); }
let port = 4175;
server.on('error', async error => {
  if (error.code !== 'EADDRINUSE') throw error;
  try { const response = await fetch(`http://127.0.0.1:${port}/.fractions-fighter`); if ((await response.text()) === 'Fractions Fighter local launcher') { open(`http://127.0.0.1:${port}`); console.log('Opened the already-running game.'); return; } } catch { /* Try the next available local port. */ }
  port++; server.listen(port, '127.0.0.1');
});
server.on('listening', () => { const url = `http://127.0.0.1:${port}`; console.log(`Fractions Fighter is ready: ${url}\nKeep this window open while playing. Press Control-C to stop the local server.`); open(url); });
server.listen(port, '127.0.0.1');
