import {collectPublicJobs} from '../sources/service.mjs';
import '../js/job-sources.js';
import '../js/analysis-contract.js';
import {readLimited,permit} from './handler.mjs';
import {matchingInput,matchJobs} from './job-matching.mjs';
import {budgetRequest} from './search-budget.mjs';
import {searchPublicJobs} from './websearch.mjs';
const sources=globalThis.JobSources,contract=globalThis.AnalysisContract;
function cors(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=(env.ALLOWED_ORIGINS||'http://127.0.0.1,http://localhost,http://127.0.0.1:4173,http://localhost:4173').split(',').map(v=>v.trim());
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Origin'};
  if(!allowed.includes(origin))return {allowed:false,headers};
  return {allowed:true,headers:{...headers,'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}};
}
export async function handleJobs(request,env,ctx={},fetcher=fetch){
  const c=cors(request,env),requestId=crypto.randomUUID();c.headers['X-Request-ID']=requestId;
  const send=(status,data)=>new Response(JSON.stringify(data),{status,headers:c.headers});
  const error=(status,code)=>send(status,{error:{code,message:contract.messages[code]||'公开岗位暂时不可访问，请稍后重试。',requestId}});
  if(new URL(request.url).pathname==='/api/jobs/search-usage'&&request.method==='GET'){try{return send(200,await budgetRequest(env,'/usage'));}catch{return send(503,{error:{code:'SEARCH_COUNTER_UNAVAILABLE'}});}}
  if(!c.allowed)return error(403,'ACCESS_DENIED');
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:c.headers});
  const pathname=new URL(request.url).pathname;
  if(pathname==='/api/jobs/public-search'){
    if(request.method!=='POST'||!request.headers.get('Content-Type')?.startsWith('application/json'))return error(400,'BAD_REQUEST');
    try{const body=await readLimited(request,12000);if(!body||Object.keys(body).some(k=>k!=='preferences'))return error(400,'BAD_REQUEST');const preferences=globalThis.JobCore.preferences(body.preferences);for(const k of Object.keys(preferences))preferences[k]=contract.redact(globalThis.JobCore.plain(preferences[k]));if(!permit('direct:'+request.headers.get('CF-Connecting-IP')))return error(429,'RATE_LIMIT');return send(200,await collectPublicJobs(preferences,{fetcher}));}catch{return error(400,'BAD_REQUEST');}
  }
  if(pathname==='/api/jobs/search'){
    if(request.method!=='POST'||!request.headers.get('Content-Type')?.startsWith('application/json'))return error(400,'BAD_REQUEST');
    try{const body=await readLimited(request,12000);if(!body||Object.keys(body).some(k=>k!=='preferences'))return error(400,'BAD_REQUEST');const preferences=globalThis.JobCore.preferences(body.preferences);for(const key of Object.keys(preferences))preferences[key]=contract.redact(globalThis.JobCore.plain(preferences[key]));if(!permit('search:'+(request.headers.get('CF-Connecting-IP')||'local')))return error(429,'RATE_LIMIT');const result=await searchPublicJobs(preferences,env,fetcher);console.info(JSON.stringify({event:'public-search',requestId,searchCalls:result.searchCalls,status:result.status,count:result.jobs.length}));return send(200,result);}catch{return error(400,'BAD_REQUEST');}
  }
  if(pathname.startsWith('/api/jobs/boards/')){
    if(request.method!=='GET')return error(405,'BAD_REQUEST');
    const source=sources.find(s=>pathname==='/api/jobs/boards/'+s.key);if(!source)return error(404,'SOURCE_NOT_FOUND');
    // Public GET only; never forward user headers, profile, resume or credentials.
    try{
      const response=await fetcher(source.apiUrl,{method:'GET',headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000),redirect:'manual',cf:{cacheTtl:300,cacheEverything:true}});
      if(!response.ok)return error(response.status===429?429:502,'SOURCE_HTTP_ERROR');
      if(Number(response.headers.get('content-length'))>25000000)return error(502,'SOURCE_TOO_LARGE');
      const headers={...c.headers};const encoding=response.headers.get('Content-Encoding');if(encoding)headers['Content-Encoding']=encoding;
      return new Response(response.body,{status:200,headers});
    }catch(e){const errorType=/AbortSignal|timeout is not/.test(String(e?.message))?'UNSUPPORTED_TIMEOUT':/redirect/i.test(String(e?.message))?'REDIRECT_MODE':/cache/i.test(String(e?.message))?'CACHE_MODE':['TypeError','ReferenceError','AbortError','TimeoutError'].includes(e?.name)?e.name:'Error';console.warn(JSON.stringify({event:'job-source',source:source.key,errorType}));return error(502,'SOURCE_NETWORK');}
  }
  if(pathname!=='/api/jobs/match')return error(404,'SOURCE_NOT_FOUND');
  if(request.method!=='POST')return error(405,'BAD_REQUEST');
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return error(415,'BAD_REQUEST');
  try{
    const input=matchingInput(await readLimited(request,180000));
    if(!env.AI_API_KEY)throw contract.failure('NOT_CONFIGURED');
    if(!permit('jobs:'+(request.headers.get('CF-Connecting-IP')||'local')))throw contract.failure('RATE_LIMIT');
    const result=await matchJobs(input,env,fetcher);
    console.info(JSON.stringify({event:'job-match',requestId,status:200,count:input.jobs.length}));
    return send(200,{mode:'live',...result});
  }catch(e){
    const code=e.code==='NETWORK'?'UPSTREAM_NETWORK':Object.hasOwn(contract.messages,e.code)?e.code:'UNAVAILABLE';
    const status=['BAD_REQUEST','INPUT_TOO_LONG'].includes(code)?400:code==='RATE_LIMIT'?429:code==='NOT_CONFIGURED'?503:['TIMEOUT','UPSTREAM_FALLBACK_TIMEOUT'].includes(code)?504:502;
    console.info(JSON.stringify({event:'job-match',requestId,status,code}));
    return send(status,{error:{code,message:contract.messages[code],requestId,...(Number.isInteger(e.upstreamStatus)?{upstreamStatus:e.upstreamStatus}:{})}});
  }
}
