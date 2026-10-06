export {AIUsage} from '../ai/public-ai-guard.mjs';
import {handleSecurity} from '../ai/security-handler.mjs';
import {protectedFetcher,guardStatus} from '../ai/public-ai-guard.mjs';
export {CompanyJobPool} from '../sources/company-pool.mjs';
export {SearchBudget} from '../ai/search-budget.mjs';
import { handleAnalysis } from '../ai/handler.mjs';
import {handleOptimization} from '../ai/optimization-handler.mjs';
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
    if(pathname.startsWith('/api/security/'))return handleSecurity(request,env);
    if(pathname.startsWith('/api/jobs/')) {
      if(env.FREE_PUBLIC_MODE!=='false'||env.JOBS_ENABLED!=='true')return new Response(JSON.stringify({error:{code:'FEATURE_DISABLED'}}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
      if(pathname==='/api/jobs/match'&&request.method==='POST'){
        try{return await handleJobs(request,env,ctx,await protectedFetcher(request,env));}
        catch(error){return Response.json({error:{code:error.code||'SECURITY_UNAVAILABLE'}},{status:guardStatus(error.code||'SECURITY_UNAVAILABLE')||403});}
      }
      return handleJobs(request,env,ctx);
    }
    if(pathname==='/api/resume/optimize')return handleOptimization(request,env);
    if (pathname !== '/api/resume/analyze') return new Response('Not found', { status: 404 });
    return handleAnalysis(request, env);
  }
};
