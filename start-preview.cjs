// Zero-dependency launcher; starts only this project's local HTTP preview.
const http = require('node:http');
const { spawn } = require('node:child_process');
function ready() {
  return new Promise(resolve => {
    const request = http.get('http://127.0.0.1:4173/', response => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => resolve(body.includes('js/analysis-provider.js')));
    });
    request.on('error', () => resolve(false));
    request.setTimeout(1000, () => { request.destroy(); resolve(false); });
  });
}
(async () => {
  if (await ready()) return;
  const server = spawn(process.execPath, ['server.cjs'], { cwd: __dirname, detached: true, stdio: 'ignore', windowsHide: true });
  server.on('error', () => {});
  server.unref();
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (await ready()) return;
  }
  console.error('本地预览未启动成功。请在 Codex 中告诉开发助手“帮我启动网页”，无需修改代码。');
  process.exitCode = 1;
})();
