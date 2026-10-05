import '../js/analysis-contract.js';
import { SYSTEM_PROMPT } from './prompt.mjs';
const contract = globalThis.AnalysisContract;
const BEIJING_FALLBACK = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
function networkFailure(error) {
  return ['TypeError', 'AbortError', 'TimeoutError'].includes(error?.name)
    || ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(error?.code || error?.cause?.code)
    || /fetch failed|network (?:error|failure)|connection (?:reset|refused)|dns|connect error|timed? ?out/i.test(String(error?.message || ''));
}
function safeRequestId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(value) ? value : null;
}
function diagnostic(attempt, host, status, errorType, requestId) {
  // Only the requested metadata; never log body, headers, key or raw exceptions.
  console.info(JSON.stringify({ attempt, upstreamHost: host, status, errorType, requestId }));
}
// Shared compatible adapter: other providers never send their key to DashScope.
export async function analyzeResume(text, env, fetcher = fetch, timeoutMs = 55000) {
  return requestStructured({systemPrompt:SYSTEM_PROMPT,input:{currentDate:new Date().toISOString().slice(0,10),resumeText:text},schema:contract.schema,name:'resume_analysis',validate:result=>contract.validate(contract.normalizeAnalysisResult(result))},env,fetcher,timeoutMs);
}
export async function requestStructured(task, env, fetcher = fetch, timeoutMs = 55000) {
  const key = env.AI_API_KEY;
  if (!key || !String(key).trim() || /[\r\n\u0000]/.test(String(key))) throw contract.failure('NOT_CONFIGURED');
  const configuredBase = String(env.AI_BASE_URL || '').trim();
  if (!configuredBase || /[{}<>]/.test(configuredBase)) throw contract.failure('NOT_CONFIGURED');
  let base;
  try { base = new URL(configuredBase.includes('://') ? configuredBase : 'https://' + configuredBase); }
  catch { throw contract.failure('NOT_CONFIGURED'); }
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw contract.failure('NOT_CONFIGURED');
  if (base.hostname.endsWith('.maas.aliyuncs.com') && base.pathname === '/') base.pathname = '/compatible-mode/v1';
  const model = env.AI_MODEL || 'qwen3.8-flash';
  const body = {
    model, messages: [{ role: 'system', content: task.systemPrompt }, { role: 'user', content: JSON.stringify(task.input) }],
    response_format: { type: 'json_schema', json_schema: { name: task.name, strict: true, schema: task.schema } }, temperature: 0.2, max_tokens: task.maxTokens || 4000, stream: false
  };
  const isBailian = /(?:^|\.)aliyuncs\.com$/.test(base.hostname);
  if (isBailian || env.AI_DISABLE_THINKING === 'true') {
    body.enable_thinking = false;
  }
  // Fallback only for Beijing workspace domains, never other regions/providers
  // or a primary URL already using the shared host.
  const canFallback = task.allowNetworkFallback !== false && /\.cn-beijing\.maas\.aliyuncs\.com$/.test(base.hostname);
  const targets = [{ name: 'primary', base }, ...(canFallback ? [{ name: 'fallback', base: new URL(BEIJING_FALLBACK) }] : [])];
  const deadline = Date.now() + timeoutMs;
  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw contract.failure(index ? 'UPSTREAM_FALLBACK_TIMEOUT' : 'TIMEOUT');
    const controller = new AbortController();
    // Reserve time for the second endpoint within the existing 55s total limit.
    const connectBudget = index === 0 && canFallback ? Math.min(15000, remaining / 3) : remaining;
    let timer = setTimeout(() => controller.abort(), connectBudget);
    let receivedHTTP = false; let status = null; let requestId = null;
    const resultMeta = { model: /^[A-Za-z0-9._/-]{1,100}$/.test(model) ? model : 'configured-model', finish_reason: null, contentExists: false, contentLength: 0, jsonParseSucceeded: false, missingFields: [] };
    const logResult = () => console.info(JSON.stringify(resultMeta));
    try {
      const response = await fetcher(target.base.href.replace(/\/+$/, '') + '/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal, redirect: 'manual'
      });
      receivedHTTP = true;
      status = response.status;
      requestId = safeRequestId(response.headers.get('x-request-id') || response.headers.get('x-dashscope-request-id'));
      // Once HTTP headers arrive, never switch endpoints even if body reading fails.
      clearTimeout(timer);
      timer = setTimeout(() => controller.abort(), Math.max(1, deadline - Date.now()));
      if (!response.ok) throw Object.assign(contract.failure('MODEL_HTTP_ERROR'), { upstreamStatus: status });
      const reader = response.body?.getReader();
      if (!reader) throw contract.failure('INVALID_JSON');
      let content = ''; let size = 0;
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 200000) { await reader.cancel(); throw contract.failure('INVALID_JSON'); }
          content += decoder.decode(value, { stream: true });
        }
      } finally { reader.releaseLock(); }
      const outer = JSON.parse(content + decoder.decode());
      requestId = requestId || safeRequestId(outer?.request_id);
      const choice = outer?.choices?.[0];
      resultMeta.finish_reason = ['stop','length','content_filter','tool_calls','function_call'].includes(choice?.finish_reason) ? choice.finish_reason : 'unknown';
      const rawContent = choice?.message?.content;
      resultMeta.contentExists = typeof rawContent === 'string' && Boolean(rawContent.trim());
      resultMeta.contentLength = typeof rawContent === 'string' ? rawContent.length : 0;
      if (!resultMeta.contentExists || resultMeta.contentLength > 40000) throw contract.failure('INVALID_JSON');
      // Analyze only content; reasoning_content is never read or parsed.
      let result;
      try { result = JSON.parse(rawContent); resultMeta.jsonParseSucceeded = true; }
      catch { throw contract.failure('INVALID_JSON'); }
      if (choice.finish_reason !== 'stop') throw contract.schemaFailure();
      const analysis = task.validate(result);
      logResult();
      diagnostic(target.name, target.base.hostname, status, null, requestId);
      return analysis;
    } catch (error) {
      const timeout = controller.signal.aborted || ['AbortError', 'TimeoutError'].includes(error?.name);
      const isNetwork = !receivedHTTP && (timeout || networkFailure(error));
      const code = timeout ? 'TIMEOUT' : Object.hasOwn(contract.messages, error?.code) ? error.code : error instanceof SyntaxError ? 'INVALID_JSON' : 'NETWORK';
      resultMeta.missingFields = contract.safeMissingFields(error.missingFields);
      if (receivedHTTP) logResult();
      diagnostic(target.name, target.base.hostname, status, receivedHTTP && ![200,201].includes(status) ? 'HTTP_ERROR' : code, requestId);
      if (isNetwork && index === 0 && canFallback) continue;
      if (isNetwork && index === 1) throw contract.failure(timeout ? 'UPSTREAM_FALLBACK_TIMEOUT' : 'UPSTREAM_FALLBACK_FAILED');
      throw Object.assign(code === 'INVALID_SCHEMA' ? contract.schemaFailure(resultMeta.missingFields) : contract.failure(code), receivedHTTP ? { upstreamStatus: status } : {});
    } finally { clearTimeout(timer); }
  }
  throw contract.failure('UPSTREAM_FALLBACK_FAILED');
}
