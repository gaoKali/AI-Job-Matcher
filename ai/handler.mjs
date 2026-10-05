import '../js/analysis-contract.js';
import { analyzeResume } from './provider.mjs';
const contract = globalThis.AnalysisContract;
const entries = new Map();
const MAX_BYTES = 60000;
export function resetLimitsForTests() { entries.clear(); }
export function permit(identity) {
  const now = Date.now();
  for (const [key, value] of entries) if (now - value.start >= 60000) entries.delete(key);
  const value = entries.get(identity) || { start: now, count: 0 };
  if (value.count >= 2 || entries.size >= 2000) return false;
  value.count++; entries.set(identity, value); return true;
}
export async function readLimited(request, maxBytes = MAX_BYTES) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw contract.failure('INPUT_TOO_LONG');
  const reader = request.body?.getReader();
  if (!reader) throw contract.failure('BAD_REQUEST');
  const parts = []; let size = 0;
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES) { await reader.cancel(); throw contract.failure('INPUT_TOO_LONG'); } parts.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw contract.failure('BAD_REQUEST'); }
}
export async function handleAnalysis(request, env, fetcher = fetch) {
  const requestId = globalThis.crypto.randomUUID();
  const started = Date.now();
  const origin = request.headers.get('Origin') || '';
  const origins = (env.ALLOWED_ORIGINS || 'http://127.0.0.1,http://localhost,http://127.0.0.1:4173,http://localhost:4173').split(',').map(x => x.trim()).filter(Boolean);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin', 'X-Request-ID': requestId, 'Access-Control-Expose-Headers': 'X-Request-ID' };
  const send = (status, body) => {
    if (body.error) body.error = { ...body.error, message: body.error.code === 'INVALID_SCHEMA' ? contract.schemaFailure(body.error.missingFields).message : contract.messages[body.error.code] || contract.messages.UNAVAILABLE, requestId };
    // Safe diagnostics only: no resume, IP, headers, environment values or upstream body.
    console.info(JSON.stringify({ event: 'resume-api', requestId, method: request.method, path: '/api/resume/analyze', status, code: body.error?.code || null, upstreamStatus: body.error?.upstreamStatus || null, durationMs: Date.now() - started }));
    return new Response(JSON.stringify(body), { status, headers });
  };
  if (!origin || !origins.includes(origin)) return send(403, { error: { code: 'ACCESS_DENIED' } });
  headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';
  if (request.method === 'OPTIONS') {
    console.info(JSON.stringify({ event: 'resume-api', requestId, method: 'OPTIONS', path: '/api/resume/analyze', status: 204 }));
    return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Max-Age': '600' } });
  }
  if (request.method !== 'POST') return send(405, { error: { code: 'BAD_REQUEST' } });
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return send(415, { error: { code: 'BAD_REQUEST' } });
  try {
    const body = await readLimited(request);
    if (!body || Array.isArray(body) || Object.keys(body).join(',') !== 'resumeText') throw contract.failure('BAD_REQUEST');
    const text = contract.redact(contract.clean(body.resumeText));
    // No billing attempt before configuration/input validation. No automatic retry.
    if (!env.AI_API_KEY) throw contract.failure('NOT_CONFIGURED');
    if (!permit(request.headers.get('CF-Connecting-IP') || 'local')) throw contract.failure('RATE_LIMIT');
    const analysis = await analyzeResume(text, env, fetcher);
    return send(200, { mode: 'live', analysis });
  } catch (error) {
    const code = error.code === 'NETWORK' ? 'UPSTREAM_NETWORK' : Object.hasOwn(contract.messages, error.code) ? error.code : 'UNAVAILABLE';
    const status = ['BAD_REQUEST','EMPTY_INPUT','INPUT_TOO_LONG'].includes(code) ? 400 : code === 'RATE_LIMIT' ? 429 : ['TIMEOUT','UPSTREAM_FALLBACK_TIMEOUT'].includes(code) ? 504 : code === 'NOT_CONFIGURED' ? 503 : 502;
    const upstreamStatus = Number.isInteger(error.upstreamStatus) && error.upstreamStatus >= 100 && error.upstreamStatus <= 599 ? error.upstreamStatus : undefined;
    return send(status, { error: { code, ...(code === 'INVALID_SCHEMA' ? { missingFields: contract.safeMissingFields(error.missingFields) } : {}), ...(upstreamStatus ? { upstreamStatus } : {}) } });
  }
}
