import { handleAnalysis } from '../ai/handler.mjs';
import { handleJobs } from '../ai/jobs-handler.mjs';
export default {
  async fetch(request, env, ctx) {
    const pathname = new URL(request.url).pathname;
    // Public liveness check: no provider calls, secrets or resume data.
    if (pathname === '/health') {
      const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
      if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...headers, Allow: 'GET' } });
      return new Response(JSON.stringify({ ok: true, service: 'ai-job-matcher-api' }), { status: 200, headers });
    }
    if(pathname.startsWith('/api/jobs/'))return handleJobs(request,env,ctx);
    if (pathname !== '/api/resume/analyze') return new Response('Not found', { status: 404 });
    return handleAnalysis(request, env);
  }
};
