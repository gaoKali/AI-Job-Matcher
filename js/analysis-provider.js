(function () {
  'use strict';
  const contract = window.AnalysisContract;
  const providers = window.JobMatcherProviders;
  const development = ['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname);
  const endpoint = window.AnalysisConfig.endpoint;
  function report(stage, status = null, code = null, requestId = null, upstreamStatus = null, missingFields = []) {
    if (!development) return;
    // Only fixed configuration and allowlisted metadata. No body, headers or raw errors.
    console.info('AI request', JSON.stringify({ stage, url: endpoint, status, code, message: contract.messages[code] || null, requestId, upstreamStatus, missingFields: contract.safeMissingFields(missingFields) }));
  }
  function attach(error, status, requestId, upstreamStatus) {
    return Object.assign(error, { status, requestId, upstreamStatus });
  }
  async function request(text, signal, timeoutMs) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal?.aborted) throw contract.failure('CANCELLED');
    signal?.addEventListener('abort', cancel, { once: true });
    let timedOut = false;
    let status = null; let requestId = null; let upstreamStatus = null;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    report('request');
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', cache: 'no-store',
        body: JSON.stringify({ resumeText: text }), signal: controller.signal
      });
      status = response.status;
      let payload;
      try { payload = JSON.parse(await response.text()); } catch { throw contract.failure('INVALID_JSON'); }
      // Never print untrusted response text/message: use our fixed message dictionary.
      if (typeof payload?.error?.requestId === 'string' && /^[a-f0-9-]{36}$/i.test(payload.error.requestId)) requestId = payload.error.requestId;
      if (Number.isInteger(payload?.error?.upstreamStatus) && payload.error.upstreamStatus >= 100 && payload.error.upstreamStatus <= 599) upstreamStatus = payload.error.upstreamStatus;
      if (!response.ok) {
        const code = Object.hasOwn(contract.messages, payload?.error?.code) ? payload.error.code : 'UNAVAILABLE';
        throw code === 'INVALID_SCHEMA' ? contract.schemaFailure(payload?.error?.missingFields) : contract.failure(code);
      }
      if (payload?.mode !== 'live') throw contract.failure('INVALID_SCHEMA');
      const result = { ...contract.groundAnalysis(contract.validate(contract.normalizeAnalysisResult(payload.analysis)), text), isMock: false };
      report('success', status);
      return result;
    } catch (error) {
      const code = signal?.aborted ? 'CANCELLED' : timedOut ? 'TIMEOUT' : Object.hasOwn(contract.messages, error.code) ? error.code : 'NETWORK';
      report('failure', status, code, requestId, upstreamStatus, error.missingFields);
      throw attach(code === 'INVALID_SCHEMA' ? contract.schemaFailure(error.missingFields) : contract.failure(code), status, requestId, upstreamStatus);
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
  }
  providers.mockAnalysisProvider = providers.analysisProvider;
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  providers.analysisMode = demo ? 'demo' : 'live';
  if (demo) return;
  providers.analysisProvider = {
    async analyze({ resumeText, signal }) {
      return request(contract.redact(contract.clean(resumeText)), signal, window.AnalysisConfig.timeoutMs);
    },
    async checkConnection() {
      // Empty input is rejected before configuration checks and model calls.
      // JSON POST verifies browser OPTIONS preflight AND readable POST response.
      try { await request('', undefined, Math.min(window.AnalysisConfig.timeoutMs, 15000)); }
      catch (error) {
        if (error.status === 400 && error.code === 'EMPTY_INPUT') {
          report('connection-ok', error.status, error.code, error.requestId);
          return { ok: true, status: error.status };
        }
        throw error;
      }
      throw contract.failure('INVALID_SCHEMA');
    }
  };
})();
