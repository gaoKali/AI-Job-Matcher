// Opt-in local browser test harness. No real key, no model/network call, no deployment.
// Not started by the normal launcher. The main product remains at port 4173.
const http = require('node:http');
const { resumeText, analysis } = require('./analysis-sample.cjs');
const server = http.createServer(async (req, res) => {
  if (req.url === '/api/resume/analyze') {
    try {
      const { handleAnalysis, resetLimitsForTests } = await import('../ai/handler.mjs');
      resetLimitsForTests(); // Quota behavior is covered by automated tests, not this visual harness.
      const request = new Request('http://127.0.0.1:4174/api/resume/analyze', { method: req.method, headers: req.headers, body: req, duplex: 'half' });
      const result = await handleAnalysis(request, { AI_API_KEY: 'unit-test-only', AI_BASE_URL: 'https://unit-test.cn-beijing.maas.aliyuncs.com/compatible-mode/v1', ALLOWED_ORIGINS: 'http://127.0.0.1:4174' }, async (_url, options) => {
        const text = JSON.parse(JSON.parse(options.body).messages[1].content).resumeText;
        if (text !== resumeText) return new Response('Fixture only', { status: 503 });
        await new Promise(resolve => setTimeout(resolve, 2500));
        return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(analysis) } }] }));
      });
      res.writeHead(result.status, Object.fromEntries(result.headers)); res.end(await result.text());
    } catch { res.writeHead(500); res.end('{"error":{"code":"UNAVAILABLE"}}'); }
    return;
  }
  const upstream = http.request({ hostname: '127.0.0.1', port: 4173, path: req.url, method: req.method }, response => { res.writeHead(response.statusCode, response.headers); response.pipe(res); });
  upstream.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(upstream);
});
server.listen(4174, '127.0.0.1', () => console.log('仅合成测试数据的隔离浏览器测试页：http://127.0.0.1:4174；不调用 Qwen。'));
