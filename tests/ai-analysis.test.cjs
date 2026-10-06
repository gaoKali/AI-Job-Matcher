const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const contract = require('../js/analysis-contract.js');
const sample = require('./analysis-sample.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const env = { AI_API_KEY: 'unit-test-only', AI_BASE_URL: 'https://unit-test.cn-beijing.maas.aliyuncs.com/compatible-mode/v1', ALLOWED_ORIGINS: 'http://127.0.0.1:4173' };
const responseFor = analysis => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(analysis) } }] }));
const requestFor = (body, options = {}) => new Request('http://127.0.0.1:4173/api/resume/analyze', { method: 'POST', headers: { Origin: 'http://127.0.0.1:4173', 'Content-Type': 'application/json', ...options.headers }, body: JSON.stringify(body), ...options });
test('输入空白、异常类型、超长内容被阻止，清理HTML且脱敏联系方式', () => {
  for (const value of ['', '  ', null, 'x'.repeat(12001)]) assert.throws(() => contract.clean(value));
  assert.equal(contract.clean('<script>ignore</script><b>SQL</b>\u0000'), 'SQL');
  const redacted = contract.redact('邮箱 test@example.com 电话13800138000 身份证110101199001010001\n微信号：test-person\n联系地址：测试地址');
  assert.doesNotMatch(redacted, /test@example|138001|110101|test-person|测试地址/);
});
test('直接校验严格匹配简单Schema，格式转换统一由normalize负责', () => {
  assert.equal(contract.validate(clone(sample.analysis), sample.resumeText).coreSkills[0], 'SQL');
  const mutations = [a => delete a.missingInformation, a => a.extra = 'x', a => a.coreSkills = 'SQL', a => a.recommendedDirections[0].confidence = 100, a => a.workExperienceSummary = ['摘要'], a => a.recommendedDirections[0].evidence = []];
  for (const mutate of mutations) { const a = clone(sample.analysis); mutate(a); assert.throws(() => contract.validate(a, sample.resumeText), { code: 'INVALID_SCHEMA' }); }
});
test('真实服务适配器单次调用，使用真实文本JSON包裹、服务端Key与非思考模式', async () => {
  const { analyzeResume } = await import('../ai/provider.mjs');
  let calls = 0;
  const result = await analyzeResume(sample.resumeText, env, async (url, options) => {
    calls++;
    assert.equal(url, 'https://unit-test.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'qwen3.8-flash'); assert.equal(body.enable_thinking, false); assert.equal(body.reasoning_effort, undefined);
    assert.equal(body.response_format.type, 'json_schema'); assert.equal(body.response_format.json_schema.strict,true); assert.deepEqual(body.response_format.json_schema.schema,contract.schema); assert.equal(body.messages.length, 2);
    assert.equal(JSON.parse(body.messages[1].content).resumeText, sample.resumeText);
    assert.match(body.messages[0].content, /不编造/); assert.doesNotMatch(body.messages[0].content, /banmu|微信号：|半目/);
    return responseFor(sample.analysis);
  });
  assert.equal(calls, 1); assert.deepEqual(result, sample.analysis);
});
test('切换兼容模型只改服务端配置，不泄露Qwen专用参数', async () => {
  const { analyzeResume } = await import('../ai/provider.mjs');
  await analyzeResume(sample.resumeText, { ...env, AI_BASE_URL: 'https://api.deepseek.com/v1', AI_MODEL: 'configured-model' }, async (url, options) => {
    assert.equal(url, 'https://api.deepseek.com/v1/chat/completions'); assert.equal(JSON.parse(options.body).enable_thinking, undefined); assert.equal(JSON.parse(options.body).reasoning_effort, undefined);
    return responseFor(sample.analysis);
  });
});
test('新版百炼支持API Host和完整Base URL，模型与Worker默认一致', async () => {
  const { analyzeResume } = await import('../ai/provider.mjs');
  for (const base of ['unit-test.cn-beijing.maas.aliyuncs.com', 'https://unit-test.cn-beijing.maas.aliyuncs.com', env.AI_BASE_URL + '/']) {
    await analyzeResume(sample.resumeText, { ...env, AI_BASE_URL: base }, async (url, options) => {
      assert.equal(url, env.AI_BASE_URL + '/chat/completions');
      assert.equal(JSON.parse(options.body).model, 'qwen3.8-flash');
      return responseFor(sample.analysis);
    });
  }
  const config = fs.readFileSync(path.join(__dirname, '../worker/wrangler.toml'), 'utf8');
  assert.match(config, /AI_MODEL = "qwen3\.8-flash"/); assert.doesNotMatch(config, /^AI_BASE_URL\s*=/m);
  assert.match(config, /keep_vars = true/); assert.match(config, /name = "ai-job-matcher-api"/);
  assert.doesNotMatch(config, /dashscope\.aliyuncs\.com/);
});
test('开发CORS允许指定本机来源并拒绝相似域名及错误协议', async () => {
  const { handleAnalysis } = await import('../ai/handler.mjs');
  for (const origin of ['http://127.0.0.1','http://localhost','http://127.0.0.1:4173','http://localhost:4173']) {
    const response = await handleAnalysis(new Request('https://worker.invalid/api/resume/analyze', { method: 'OPTIONS', headers: { Origin: origin } }), {});
    assert.equal(response.status, 204); assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  }
  for (const origin of ['http://localhost.evil.invalid','http://127.0.0.1.evil.invalid','null','https://localhost']) {
    assert.equal((await handleAnalysis(new Request('https://worker.invalid/api/resume/analyze', { method: 'OPTIONS', headers: { Origin: origin } }), {})).status, 403);
  }
});
test('未填写/非法/占位地址不会请求模型，也不回退旧地址', async () => {
  const { analyzeResume } = await import('../ai/provider.mjs');
  for (const base of ['', '  ', 'https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com', 'http://unit-test.cn-beijing.maas.aliyuncs.com', 'https://name:password@example.com', 'https://example.com?key=private', 'https://example.com#fragment', 'https://']) {
    let calls = 0;
    await assert.rejects(analyzeResume(sample.resumeText, { ...env, AI_BASE_URL: base }, () => { calls++; }), { code: 'NOT_CONFIGURED' });
    assert.equal(calls, 0);
  }
});
test('无密钥不调用；授权/限流/网络/空内容/坏JSON/截断输出均不重试', async () => {
  const { analyzeResume } = await import('../ai/provider.mjs');
  await assert.rejects(analyzeResume(sample.resumeText, {}, () => { throw Error('should not call'); }), { code: 'NOT_CONFIGURED' });
  const cases = [
    [() => new Response('private upstream error', { status: 401 }), 'MODEL_HTTP_ERROR'],
    [() => new Response('private', { status: 429 }), 'MODEL_HTTP_ERROR'], [() => new Response('private', { status: 503 }), 'MODEL_HTTP_ERROR'],
    [() => { throw Error('private key details'); }, 'NETWORK'], [() => responseFor(null), 'INVALID_SCHEMA'],
    [() => new Response('{'), 'INVALID_JSON'], [() => new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] })), 'INVALID_SCHEMA'],
    [() => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: '' } }] })), 'INVALID_JSON']
  ];
  for (const [respond, code] of cases) { let calls = 0; await assert.rejects(analyzeResume(sample.resumeText, env, async () => { calls++; return respond(); }), { code }); assert.equal(calls, 1); }
});
test('北京首选地址超时最多一次兜底，总超时受限', async () => {
  const { analyzeResume } = await import('../ai/provider.mjs');
  await assert.rejects(analyzeResume(sample.resumeText, env, (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('aborted')))), 90), { code: 'UPSTREAM_FALLBACK_TIMEOUT' });
});
test('Worker/本地共享处理器：来源、格式、大小、单份输入、缺密钥、敏感错误屏蔽', async () => {
  const { handleAnalysis, resetLimitsForTests } = await import('../ai/handler.mjs'); resetLimitsForTests();
  const forbidden = await handleAnalysis(requestFor({ resumeText: sample.resumeText }, { headers: { Origin: 'https://evil.invalid', 'Content-Type': 'application/json' } }), env);
  assert.equal(forbidden.status, 403); assert.equal(forbidden.headers.get('Access-Control-Allow-Origin'), null);
  for (const body of [{ resumeText: '' }, { resumeText: 'x'.repeat(12001) }, { resumeText: sample.resumeText, key: 'client-key' }, { resumes: [sample.resumeText] }]) assert.equal((await handleAnalysis(requestFor(body), env)).status, 400);
  let calls = 0;
  const missing = await handleAnalysis(requestFor({ resumeText: sample.resumeText }), {}, () => { calls++; }); assert.equal(missing.status, 503); assert.equal(calls, 0);
  const success = await handleAnalysis(requestFor({ resumeText: sample.resumeText }), env, async () => responseFor(sample.analysis));
  assert.equal(success.status, 200); assert.equal(success.headers.get('Cache-Control'), 'no-store'); assert.deepEqual((await success.json()).analysis, sample.analysis);
  const failure = await handleAnalysis(requestFor({ resumeText: sample.resumeText }), env, async () => { throw Error('unit-test-only secret ' + sample.resumeText); });
  assert.equal(failure.status, 502); assert.doesNotMatch(await failure.text(), /unit-test|SQL|secret/);
  const limited = await handleAnalysis(requestFor({ resumeText: sample.resumeText }), env, async () => { throw Error('no call'); }); assert.equal(limited.status, 429);
  const preflight = await handleAnalysis(new Request('http://local/api/resume/analyze', { method: 'OPTIONS', headers: { Origin: 'http://127.0.0.1:4173' } }), env); assert.equal(preflight.status, 204);
});
function client(fetcher, search = '', diagnosticConsole) {
  const root = { AnalysisContract: contract, JobMatcherProviders: { analysisProvider: { analyze: async () => ({ isMock: true }) } }, location: { search, hostname: '127.0.0.1' }, AnalysisConfig: { endpoint: '/api/resume/analyze', timeoutMs: 20 } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/analysis-provider.js'), 'utf8'), { window: root, URLSearchParams, AbortController, fetch: fetcher, setTimeout, clearTimeout, ...(diagnosticConsole ? { console: diagnosticConsole } : {}) });
  return root;
}
test('前端真实resumeText去除联系方式后单次发送，缺配置不偷换模拟结果', async () => {
  let calls = 0;
  const root = client(async (_url, options) => { calls++; assert.doesNotMatch(options.body, /test@example.com/); return new Response(JSON.stringify({ mode: 'live', analysis: sample.analysis })); });
  const result = await root.JobMatcherProviders.analysisProvider.analyze({ resumeText: sample.resumeText + '\n邮箱 test@example.com' });
  assert.equal(result.isMock, false); assert.equal(calls, 1);
  const missing = client(async () => new Response('{"error":{"code":"NOT_CONFIGURED"}}', { status: 503 }));
  await assert.rejects(missing.JobMatcherProviders.analysisProvider.analyze({ resumeText: sample.resumeText }), { code: 'NOT_CONFIGURED' });
  assert.equal(client(() => { throw Error('no fetch'); }, '?demo=1').JobMatcherProviders.analysisMode, 'demo');
});
test('前端空输入不发送、网络/坏JSON/超时/取消均可恢复', async () => {
  const input = client(() => { throw Error('must not call'); }); await assert.rejects(input.JobMatcherProviders.analysisProvider.analyze({ resumeText: '' }), { code: 'EMPTY_INPUT' });
  const network = client(async () => { throw Error('private'); }); await assert.rejects(network.JobMatcherProviders.analysisProvider.analyze({ resumeText: sample.resumeText }), { code: 'NETWORK' });
  const invalid = client(async () => new Response('invalid')); await assert.rejects(invalid.JobMatcherProviders.analysisProvider.analyze({ resumeText: sample.resumeText }), { code: 'INVALID_JSON' });
  const timeout = client((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('abort')))));
  await assert.rejects(timeout.JobMatcherProviders.analysisProvider.analyze({ resumeText: sample.resumeText }), { code: 'TIMEOUT' });
  const controller = new AbortController(); controller.abort(); await assert.rejects(input.JobMatcherProviders.analysisProvider.analyze({ resumeText: sample.resumeText, signal: controller.signal }), { code: 'CANCELLED' });
});
test('公开文件不含凭据/持久化，不暴露服务端文件，真实分析统一输入且支持取消', () => {
  const js = ['app.js','analysis-config.js','analysis-provider.js'].map(f => fs.readFileSync(path.join(__dirname, '../js', f), 'utf8')).join('\n');
  assert.doesNotMatch(js, /Bearer|sk-[A-Za-z0-9]{10}|localStorage|sessionStorage|indexedDB/);
  assert.match(js, /resumeText: text/); assert.match(js, /state\.aiAbort\?\.abort/); assert.match(js, /if \(state.busy \|\| state.reading\) return/);
  const server = fs.readFileSync(path.join(__dirname, '../server.cjs'), 'utf8'); assert.doesNotMatch(server, /\['\/ai\/|\['\/worker\/|\['\/\.env/);
  const config = fs.readFileSync(path.join(__dirname, '../worker/wrangler.toml'), 'utf8'); assert.doesNotMatch(config, /^AI_API_KEY\s*=/m);
});
test('Worker入口路由、缺密钥、预检都能正常运行', async () => {
  const { default: worker } = await import('../worker/index.mjs');
  assert.equal((await worker.fetch(new Request('https://proxy.invalid/unknown'), {})).status, 404);
  assert.equal((await worker.fetch(requestFor({ resumeText: sample.resumeText }), {})).status, 503);
  const req = new Request('https://proxy.invalid/api/resume/analyze', { method: 'OPTIONS', headers: { Origin: 'http://127.0.0.1:4173' } });
  assert.equal((await worker.fetch(req, {})).status, 204);
});
test('过大请求/异常编码/非JSON及过大上游返回被拒绝', async () => {
  const { handleAnalysis, resetLimitsForTests } = await import('../ai/handler.mjs'); resetLimitsForTests();
  const tooLarge = requestFor({ resumeText: 'x'.repeat(60001) }); assert.equal((await handleAnalysis(tooLarge, env)).status, 400);
  const wrongType = new Request('https://proxy.invalid/api/resume/analyze', { method: 'POST', headers: { Origin: 'http://127.0.0.1:4173', 'Content-Type': 'text/plain' }, body: 'text' }); assert.equal((await handleAnalysis(wrongType, env)).status, 415);
  const badJSON = new Request('https://proxy.invalid/api/resume/analyze', { method: 'POST', headers: { Origin: 'http://127.0.0.1:4173', 'Content-Type': 'application/json' }, body: '{' }); assert.equal((await handleAnalysis(badJSON, env)).status, 400);
  const { analyzeResume } = await import('../ai/provider.mjs');
  await assert.rejects(analyzeResume(sample.resumeText, env, async () => new Response('x'.repeat(200001))), { code: 'INVALID_JSON' });
});


test('健康检查无需配置或外部调用，GET返回固定JSON，其他方法不进入AI', async () => {
  const { default: worker } = await import('../worker/index.mjs');
  const unreadableEnv = new Proxy({}, { get() { throw new Error('health must not read provider settings'); } });
  const response = await worker.fetch(new Request('https://proxy.invalid/health'), unreadableEnv);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { ok: true, service: 'ai-job-matcher-api' });
  const post = await worker.fetch(new Request('https://proxy.invalid/health', { method: 'POST' }), unreadableEnv);
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET');
});


test('连接检查采用真实接口空JSON请求；OPTIONS与POST错误均保留CORS且不调用模型', async () => {
  const { handleAnalysis } = await import('../ai/handler.mjs');
  let modelCalls = 0;
  const origin = 'http://127.0.0.1:4173';
  const preflight = await handleAnalysis(new Request('https://proxy.invalid/api/resume/analyze', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } }), env);
  assert.equal(preflight.status, 204);
  for (const [name,value] of [['Access-Control-Allow-Origin',origin],['Access-Control-Allow-Methods','POST, OPTIONS'],['Access-Control-Allow-Headers','Content-Type']]) assert.equal(preflight.headers.get(name), value);
  const root = client(async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { resumeText: '' });
    const req = new Request('https://proxy.invalid/api/resume/analyze', { ...options, headers: { ...options.headers, Origin: origin } });
    const response = await handleAnalysis(req, env, () => { modelCalls++; throw Error('must not call model'); });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
    return response;
  });
  assert.equal((await root.JobMatcherProviders.analysisProvider.checkConnection()).ok, true);
  assert.equal(modelCalls, 0);
});

test('开发诊断记录URL/状态/固定错误信息，不记录上游私密message或简历', async () => {
  const logs=[]; const safeConsole={info(...args){logs.push(args);}};
  const root=client(async()=>new Response(JSON.stringify({error:{code:'AUTH_FAILED',message:'unit-secret raw-request',requestId:'00000000-0000-4000-8000-000000000001',upstreamStatus:401}}),{status:502}), '',safeConsole);
  await assert.rejects(root.JobMatcherProviders.analysisProvider.analyze({resumeText:sample.resumeText}), {code:'AUTH_FAILED',status:502,upstreamStatus:401});
  const log=logs.map(x=>JSON.parse(x[1])).find(x=>x.stage==='failure');
  assert.equal(log.url,'/api/resume/analyze'); assert.equal(log.status,502); assert.equal(log.code,'AUTH_FAILED'); assert.equal(log.message,contract.messages.AUTH_FAILED);
  assert.doesNotMatch(JSON.stringify(logs),/unit-secret|raw-request|SQL|星河|Bearer/);
});

test('Worker安全日志只记录请求元数据和上游HTTP状态，Secret与正文不写入', async () => {
  const { handleAnalysis,resetLimitsForTests }=await import('../ai/handler.mjs'); resetLimitsForTests();
  const logs=[]; const previous=console.info; console.info=(message)=>logs.push(message);
  try {
    const response=await handleAnalysis(requestFor({resumeText:sample.resumeText}),env,async()=>new Response('unit-secret upstream',{status:404}));
    assert.equal(response.status,502);
    const payload=await response.json();
    assert.equal(payload.error.upstreamStatus,404); assert.equal(payload.error.code,'MODEL_HTTP_ERROR');
    assert.equal(payload.error.message,contract.messages.MODEL_HTTP_ERROR);
    assert.match(payload.error.requestId,/^[a-f0-9-]{36}$/i);
    const log=logs.map(v=>JSON.parse(v)).find(v=>v.event==='resume-api'); assert.equal(log.status,502); assert.equal(log.upstreamStatus,404);
    assert.doesNotMatch(JSON.stringify(logs),/unit-secret|Bearer|SQL|星河|Authorization|AI_API_KEY/);
  } finally {console.info=previous;}
});


test('Worker上游网络失败与浏览器NETWORK分开，HTTP错误有中文消息与请求编号', async () => {
  const { handleAnalysis,resetLimitsForTests }=await import('../ai/handler.mjs'); resetLimitsForTests();
  const response=await handleAnalysis(requestFor({resumeText:sample.resumeText}),env,async()=>{throw new TypeError('private-network-message');});
  assert.equal(response.status,502); const body=await response.json();
  assert.equal(body.error.code,'UPSTREAM_FALLBACK_FAILED'); assert.equal(body.error.message,contract.messages.UPSTREAM_FALLBACK_FAILED);
  assert.doesNotMatch(JSON.stringify(body),/private-network-message|SQL|星河/);
  // Independently check the frontend's transport error remains NETWORK.
  const offline=client(async()=>{throw new TypeError('private-network-message');});
  await assert.rejects(offline.JobMatcherProviders.analysisProvider.analyze({resumeText:sample.resumeText}), {code:'NETWORK',status:null});
});


test('北京网络异常只兜底一次，地址/Key/模型/JSON保持一致且安全日志不含正文',async()=>{
  const {analyzeResume}=await import('../ai/provider.mjs');const calls=[];const logs=[];const previous=console.info;console.info=(v)=>logs.push(v);
  try {
    const result=await analyzeResume(sample.resumeText,env,async(url,options)=>{
      calls.push({url,options});
      if(calls.length===1) throw new TypeError('fetch failed unit-test-only private');
      assert.equal(url,'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');
      assert.equal(options.headers.Authorization,calls[0].options.headers.Authorization);
      assert.equal(options.headers['Content-Type'],'application/json');assert.equal(options.body,calls[0].options.body);
      assert.equal(JSON.parse(options.body).model,'qwen3.8-flash');
      const r=responseFor(sample.analysis);r.headers.set('x-request-id','request-test-123');return r;
    });
    assert.deepEqual(result,sample.analysis);assert.equal(calls.length,2);
    const metadata=logs.map(v=>JSON.parse(v)).filter(v=>v.attempt);assert.equal(metadata[0].attempt,'primary');assert.equal(metadata[0].status,null);
    assert.equal(metadata[1].attempt,'fallback');assert.equal(metadata[1].status,200);assert.equal(metadata[1].requestId,'request-test-123');
    for(const log of metadata) assert.deepEqual(Object.keys(log).sort(),['attempt','errorType','requestId','status','upstreamHost'].sort());
    assert.doesNotMatch(JSON.stringify(logs),/unit-test-only|private|Bearer|SQL|星河|Authorization/);
  }finally{console.info=previous;}
});

test('HTTP错误400/401/403/404/429/500/503和无效JSON绝不切换地址',async()=>{
  const {analyzeResume}=await import('../ai/provider.mjs');
  for(const status of [301,400,401,403,404,429,500,503]){
    let calls=0;await assert.rejects(analyzeResume(sample.resumeText,env,async()=>{calls++;return new Response('private-upstream',{status});}),e=>e.upstreamStatus===status);
    assert.equal(calls,1);
  }
  let calls=0;await assert.rejects(analyzeResume(sample.resumeText,env,async()=>{calls++;return new Response('{',{status:200});}),{code:'INVALID_JSON',upstreamStatus:200});assert.equal(calls,1);
});

test('已收到200响应后的正文读取网络异常也不能触发兜底',async()=>{
  const {analyzeResume}=await import('../ai/provider.mjs');let calls=0;
  const body=new ReadableStream({start(controller){controller.error(new TypeError('network failure in body'));}});
  await assert.rejects(analyzeResume(sample.resumeText,env,async()=>{calls++;return new Response(body,{status:200});}),{code:'NETWORK',upstreamStatus:200});assert.equal(calls,1);
});

test('两个网络地址都失败就停止；兜底HTTP错误保留真实状态',async()=>{
  const {analyzeResume}=await import('../ai/provider.mjs');let calls=0;
  await assert.rejects(analyzeResume(sample.resumeText,env,async()=>{calls++;throw new TypeError('fetch failed');}),{code:'UPSTREAM_FALLBACK_FAILED'});assert.equal(calls,2);
  calls=0;await assert.rejects(analyzeResume(sample.resumeText,env,async()=>{calls++;if(calls===1)throw new TypeError('fetch failed');return new Response('private',{status:401});}),{code:'MODEL_HTTP_ERROR',upstreamStatus:401});assert.equal(calls,2);
});

test('首选连接超时可兜底成功，其他提供商和共享首选均不发送第二次请求',async()=>{
  const {analyzeResume}=await import('../ai/provider.mjs');let calls=0;
  const result=await analyzeResume(sample.resumeText,env,async(_url,options)=>{calls++;if(calls===1)return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError'))));return responseFor(sample.analysis);},90);
  assert.deepEqual(result,sample.analysis);assert.equal(calls,2);
  for(const url of ['https://api.deepseek.com/v1','https://dashscope.aliyuncs.com/compatible-mode/v1','https://unit-test.cn-singapore.maas.aliyuncs.com/compatible-mode/v1']){
    calls=0;await assert.rejects(analyzeResume(sample.resumeText,{...env,AI_BASE_URL:url},async()=>{calls++;throw new TypeError('fetch failed');}),{code:'NETWORK'});assert.equal(calls,1);
  }
});


test('严格schema保留全部网页字段及方向字段，未知信息空数组不失败',()=>{
  assert.equal(contract.schema.additionalProperties,false);
  assert.deepEqual(contract.schema.required.sort(),Object.keys(contract.shape).sort());
  const directions=contract.schema.properties.recommendedDirections.items;
  assert.equal(directions.additionalProperties,false);assert.deepEqual(directions.required.sort(),['confidence','evidence','reason','title']);
  const unknown=contract.normalizeAnalysisResult({});
  for(const k of ['candidateProfile','experienceYears','currentDirection','workExperienceSummary','educationSummary'])assert.equal(contract.schema.properties[k].type,'string');
  for(const k of ['title','reason','confidence','evidence'])assert.equal(directions.properties[k].type,'string');
  assert.equal(directions.properties.confidence.enum,undefined);assert.equal(contract.schema.required.length,10);
  assert.deepEqual(contract.validate(unknown,'信息不足'),unknown);
});

test('只解析content，缺失字段先归一化，坏JSON不重试或记录隐私',async()=>{
  const {analyzeResume}=await import('../ai/provider.mjs');const logs=[];const previous=console.info;console.info=(v)=>logs.push(v);
  try{
    let calls=0;
    const missing=clone(sample.analysis);delete missing.strengths;
    const normalized=await analyzeResume(sample.resumeText,env,async()=>{calls++;return responseFor(missing);});assert.deepEqual(normalized.strengths,[]);
    assert.equal(calls,1);
    const log=logs.map(v=>JSON.parse(v)).find(v=>v.jsonParseSucceeded===true);assert.deepEqual(log.missingFields,[]);
    calls=0;await assert.rejects(analyzeResume(sample.resumeText,env,async()=>{calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'not JSON',reasoning_content:JSON.stringify(sample.analysis)}}]}));}),{code:'INVALID_JSON'});assert.equal(calls,1);
    calls=0;const result=await analyzeResume(sample.resumeText,env,async()=>{calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(sample.analysis),reasoning_content:'unit-secret private model data'}}]}));});assert.deepEqual(result,sample.analysis);assert.equal(calls,1);
    assert.doesNotMatch(JSON.stringify(logs),/unit-secret|private model|SQL|星河|Bearer/);
  }finally{console.info=previous;}
});

test('不可归一化的类型仍拒绝，前端错误只传播白名单字段',async()=>{
  const {handleAnalysis,resetLimitsForTests}=await import('../ai/handler.mjs');resetLimitsForTests();
  const missing=clone(sample.analysis);missing.strengths={private:'invalid object'};
  const response=await handleAnalysis(requestFor({resumeText:sample.resumeText}),env,async()=>responseFor(missing));
  assert.equal(response.status,502);const payload=await response.json();assert.equal(payload.error.code,'INVALID_SCHEMA');assert.deepEqual(payload.error.missingFields,[]);
  const root=client(async()=>new Response(JSON.stringify({...payload,error:{...payload.error,missingFields:['strengths','private user data']}}),{status:502}));
  await assert.rejects(root.JobMatcherProviders.analysisProvider.analyze({resumeText:sample.resumeText}),e=>e.code==='INVALID_SCHEMA'&&e.message.includes('missing strengths')&&!e.message.includes('private user'));
});


test('normalize兼容数字、单个字符串及旧摘要数组，保持原输入且不增加内容',()=>{
  const raw=clone(sample.analysis);raw.experienceYears=5;raw.recommendedDirections[0].confidence=85;
  raw.workExperienceSummary=['原有工作摘要','原有项目摘要'];raw.educationSummary=['原有教育摘要'];raw.recommendedDirections[0].evidence=['原有证据'];
  for(const k of ['coreSkills','strengths','weaknesses','missingInformation'])raw[k]='已有内容';raw.legacy='忽略旧字段';
  const before=clone(raw);const result=contract.validate(contract.normalizeAnalysisResult(raw));
  assert.equal(result.experienceYears,'5年');assert.equal(result.recommendedDirections[0].confidence,'85%');
  assert.equal(result.workExperienceSummary,'原有工作摘要\n原有项目摘要');assert.equal(result.educationSummary,'原有教育摘要');assert.equal(result.recommendedDirections[0].evidence,'原有证据');
  for(const k of ['coreSkills','strengths','weaknesses','missingInformation'])assert.deepEqual(result[k],['已有内容']);
  assert.deepEqual(raw,before);assert.equal(Object.keys(result).length,10);assert.equal(result.legacy,undefined);
});

test('缺失或null使用占位和空数组，任意文字推荐程度合法，不能转换的类型仍拒绝',()=>{
  const result=contract.validate(contract.normalizeAnalysisResult({candidateProfile:null,recommendedDirections:[{}]}));
  for(const k of ['candidateProfile','experienceYears','currentDirection','workExperienceSummary','educationSummary'])assert.equal(result[k],'简历中未提供足够信息');
  for(const k of ['coreSkills','strengths','weaknesses','missingInformation'])assert.deepEqual(result[k],[]);
  for(const value of ['高','85%']){const a=clone(sample.analysis);a.recommendedDirections[0].confidence=value;assert.equal(contract.validate(contract.normalizeAnalysisResult(a)).recommendedDirections[0].confidence,value);}
  for(const bad of [null,[],{coreSkills:{}},{experienceYears:true},{recommendedDirections:[null]},{recommendedDirections:'岗位'}])assert.throws(()=>contract.validate(contract.normalizeAnalysisResult(bad)),{code:'INVALID_SCHEMA'});
});

test('安全格式差异经Worker及前端返回真实结果200，只有一次模型调用',async()=>{
  const {handleAnalysis,resetLimitsForTests}=await import('../ai/handler.mjs');resetLimitsForTests();let calls=0;
  const raw=clone(sample.analysis);raw.experienceYears=5;raw.coreSkills='SQL';delete raw.educationSummary;raw.recommendedDirections[0].confidence=85;
  const root=client(async()=>{const response=await handleAnalysis(requestFor({resumeText:sample.resumeText}),env,async()=>{calls++;return responseFor(raw);});assert.equal(response.status,200);return response;});
  const result=await root.JobMatcherProviders.analysisProvider.analyze({resumeText:sample.resumeText});
  assert.equal(calls,1);assert.equal(result.isMock,false);assert.equal(result.experienceYears,'5年');assert.deepEqual(Array.from(result.coreSkills),['SQL']);
});

 test('真实验收发现的职责升级与专业扩写回退原始事实，不额外调用模型', () => {
  const source = '测试候选人\n合成科技有限公司 | 用户运营 | 2022年7月—2025年6月\n整理用户反馈并分类制作周报。协助页面测试。\n教育：合成大学，信息管理本科，2018年9月—2022年6月。';
  const result = clone(sample.analysis);
  result.workExperienceSummary = '主导用户反馈项目，熟练使用Excel。';
  result.educationSummary = '合成大学，信息管理与信息系统专业本科。';
  result.strengths = ['主导用户反馈分类项目','具有整理用户反馈的经历'];
  const guarded = contract.groundAnalysis(result, source);
  assert.doesNotMatch(guarded.workExperienceSummary, /主导|熟练/);
  assert.equal(guarded.educationSummary, '教育：合成大学，信息管理本科，2018年9月—2022年6月。');
  assert.deepEqual(guarded.strengths, ['具有整理用户反馈的经历']);
  assert.ok(guarded.missingInformation.some(value => value.includes('责任范围')));
  assert.doesNotThrow(() => contract.validate(guarded));
  assert.match(result.workExperienceSummary, /主导/);
 });
