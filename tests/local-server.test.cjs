const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
test('真实本地HTTP服务：公开脚本正常、私有路径404、缺密钥503、无来源403', async () => {
  const child = spawn(process.execPath, ['server.cjs'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: '4175', AI_API_KEY: '' }, stdio: ['ignore','pipe','pipe'], windowsHide: true });
  try {
    await new Promise((resolve, reject) => { child.stdout.once('data', resolve); child.once('error', reject); child.once('exit', code => reject(Error('Test server stopped: ' + code))); });
    const base = 'http://127.0.0.1:4175';
    const html = await fetch(base);
    assert.equal(html.status, 200); assert.match(await html.text(), /js\/analysis-provider.js/);
    assert.match(html.headers.get('Content-Security-Policy'), /connect-src 'self'/);
    assert.equal((await fetch(base + '/js/analysis-provider.js')).status, 200);
    for (const pathname of ['/.env','/worker/wrangler.toml','/ai/provider.mjs','/tests/analysis-sample.cjs','/server.cjs']) assert.equal((await fetch(base + pathname)).status, 404);
    const body = JSON.stringify({ resumeText: '测试履历 SQL' });
    const missing = await fetch(base + '/api/resume/analyze', { method: 'POST', headers: { Origin: 'http://127.0.0.1:4173', 'Content-Type': 'application/json' }, body });
    assert.equal(missing.status, 503); assert.equal((await missing.json()).error.code, 'NOT_CONFIGURED');
    const forbidden = await fetch(base + '/api/resume/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); assert.equal(forbidden.status, 403);
  } finally { child.kill(); }
});
