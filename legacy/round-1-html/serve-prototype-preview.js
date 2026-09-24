// Minimal static server used only to preview the prototype in the Browser pane.
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = rel === '/' ? '2026-09-23_cms-customize-prototype.html' : rel.replace(/^\/+/, '');
  const full = path.join(root, file);
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
}).listen(4174, () => console.log('prototype preview on http://localhost:4174'));
