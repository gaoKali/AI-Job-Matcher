// Local preview with the same server-only AI adapter used by the Worker.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const allowed = new Map([
  ['/index.html', 'text/html; charset=utf-8'], ['/styles.css', 'text/css; charset=utf-8'],
  ['/js/app.js', 'text/javascript; charset=utf-8'], ['/js/providers.js', 'text/javascript; charset=utf-8'],
  ['/js/parser-core.js', 'text/javascript; charset=utf-8'], ['/js/resume-parser.js', 'text/javascript; charset=utf-8'], ['/js/resume-worker.js', 'text/javascript; charset=utf-8'],
  ['/js/analysis-contract.js', 'text/javascript; charset=utf-8'], ['/js/analysis-config.js', 'text/javascript; charset=utf-8'], ['/js/analysis-provider.js', 'text/javascript; charset=utf-8'],
  ...['job-sources.js','job-core.js','websearch-core.js','jobs-provider.js'].map(f=>['/js/'+f,'text/javascript; charset=utf-8']),
  ['/assets/favicon.svg', 'image/svg+xml'], ['/tools/live-search-test.html','text/html; charset=utf-8'], ['/tools/live-search-test.js','text/javascript; charset=utf-8']
]);
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (request, response) => {
  if (request.url.split('?')[0] === '/api/resume/analyze') {
    try {
      const { handleAnalysis } = await import('./ai/handler.mjs');
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) if (value !== undefined && name !== 'cf-connecting-ip') headers.set(name, Array.isArray(value) ? value.join(',') : value);
      const options = { method: request.method, headers };
      if (!['GET','HEAD'].includes(request.method)) { options.body = request; options.duplex = 'half'; }
      const result = await handleAnalysis(new Request(`http://127.0.0.1:${port}/api/resume/analyze`, options), process.env);
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(await result.text());
    } catch { response.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end('{"error":{"code":"UNAVAILABLE"}}'); }
    return;
  }
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  let pathname;
  try { pathname = new URL(request.url, 'http://localhost').pathname; } catch { response.writeHead(400); response.end(); return; }
  if (pathname === '/') pathname = '/index.html';
  let contentType = allowed.get(pathname);
  // Only known local parser assets; never expose arbitrary files or uploads.
  if (/^\/assets\/vendor\/pdfjs\/(pdf(?:\.worker)?\.min\.mjs|cmaps\/[A-Za-z0-9_.-]+\.bcmap|standard_fonts\/[A-Za-z0-9_.-]+\.(?:pfb|ttf))$/.test(pathname)) contentType = pathname.endsWith('.mjs') ? 'text/javascript; charset=utf-8' : 'application/octet-stream';
  if (pathname === '/assets/vendor/mammoth/mammoth.browser.min.js') contentType = 'text/javascript; charset=utf-8';
  if (!contentType) { response.writeHead(404); response.end('Not found'); return; }
  fs.readFile(path.join(__dirname, pathname.slice(1)), (error, data) => {
    if (error) { response.writeHead(500); response.end('Preview file unavailable'); return; }
    response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://*.workers.dev; worker-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" });
    response.end(request.method === 'HEAD' ? undefined : data);
  });
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `端口 ${port} 已被占用，可直接检查已有网页，或设置 PORT 使用其他端口。` : '本地预览启动失败：' + error.code); process.exitCode = 1; });
server.requestTimeout = 15000;
server.listen(port, '127.0.0.1', () => console.log(`向前本地网页：http://127.0.0.1:${port}\n只在本机运行；密钥仅从服务端环境变量读取。按 Ctrl+C 停止。`));
