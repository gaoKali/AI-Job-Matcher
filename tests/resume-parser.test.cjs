const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/resume-parser.js'), 'utf8');
function setup(outcome = 'success') {
  const created = [];
  let timeout;
  const root = { JobMatcherProviders: { validateFile: () => '' }, location: { protocol: 'http:' }, document: { baseURI: 'http://127.0.0.1:4173/' } };
  root.Worker = class {
    constructor(url) { this.url = url; created.push(this); }
    terminate() { this.terminated = true; }
    postMessage(message, transfer) {
      this.message = message; this.transfer = transfer;
      if (outcome === 'pending') return;
      queueMicrotask(() => {
        if (outcome === 'crash') this.onerror({ preventDefault() {} });
        else if (outcome === 'failure') this.onmessage({ data: { type: 'error', code: 'DOCX_NO_TEXT', message: '没有文字' } });
        else this.onmessage({ data: { type: 'success', result: { text: '真实测试文字', warnings: [] } } });
      });
    }
  };
  vm.runInNewContext(source, { window: root, URL, setTimeout: callback => { timeout = callback; return 1; }, clearTimeout() {} });
  const file = { name: 'demo.pdf', size: 20, type: 'application/pdf', arrayBuffer: async () => new ArrayBuffer(20) };
  return { root, file, created, expire: () => timeout() };
}
test('本地字节传给Worker，不使用文件上传URL，完成后释放Worker', async () => {
  const { root, file, created } = setup();
  const result = await root.JobMatcherProviders.resumeParser.parse(file);
  assert.equal(result.text, '真实测试文字');
  assert.equal(created[0].url.href, 'http://127.0.0.1:4173/js/resume-worker.js');
  assert.equal(created[0].message.format, 'pdf');
  assert.equal(created[0].transfer[0], created[0].message.buffer);
  assert.equal(created[0].terminated, true);
});
test('浏览器Worker异常和解析错误友好返回并释放资源', async () => {
  for (const outcome of ['crash', 'failure']) {
    const { root, file, created } = setup(outcome);
    await assert.rejects(root.JobMatcherProviders.resumeParser.parse(file), error => error.code === (outcome === 'crash' ? 'BROWSER_ERROR' : 'DOCX_NO_TEXT'));
    assert.equal(created[0].terminated, true);
  }
});
test('超时和取消会终止Worker，迟到结果不再被接受', async () => {
  for (const action of ['timeout', 'abort']) {
    const { root, file, created, expire } = setup('pending');
    const controller = new AbortController();
    const pending = root.JobMatcherProviders.resumeParser.parse(file, { signal: controller.signal });
    await new Promise(resolve => setImmediate(resolve));
    if (action === 'timeout') expire(); else controller.abort();
    await assert.rejects(pending, error => error.code === (action === 'timeout' ? 'TIMEOUT' : 'CANCELLED'));
    assert.equal(created[0].terminated, true);
    created[0].onmessage({ data: { type: 'success', result: { text: '不应接受的迟到结果' } } });
  }
});
test('统一原文只存在内存，解析器不持久化或上传原始文件', () => {
  const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  assert.match(app, /window\.resumeText = text/);
  assert.match(app, /const text = window\.resumeText/);
  assert.match(app, /window\.resumeText = ''/);
  assert.doesNotMatch(app + source, /localStorage|sessionStorage|indexedDB|XMLHttpRequest|fetch\(/);
});
