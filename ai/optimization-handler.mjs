import '../js/analysis-contract.js';
import '../js/optimization-contract.js';
import {requestStructured} from './provider.mjs';
import {readLimited} from './handler.mjs';
import {protectedFetcher,guardStatus,enabled} from './public-ai-guard.mjs';
import {OPTIMIZATION_PROMPT} from './optimization-prompt.mjs';
const contract=globalThis.OptimizationContract, analysis=globalThis.AnalysisContract;
export async function handleOptimization(request,env,fetcher=fetch){
 const requestId=crypto.randomUUID(),started=Date.now(),origin=request.headers.get('Origin')||'';
 const allowed=(env.ALLOWED_ORIGINS||'http://127.0.0.1:4173,http://localhost:4173').split(',').map(s=>s.trim());
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Vary:'Origin','X-Request-ID':requestId,'Access-Control-Expose-Headers':'X-Request-ID','X-Content-Type-Options':'nosniff'};
 const send=(status,body)=>{console.info(JSON.stringify({event:'resume-optimization',requestId,status,code:body.error?.code||null,durationMs:Date.now()-started}));return new Response(JSON.stringify(body),{status,headers});};
 if(!origin||!allowed.includes(origin))return send(403,{error:{code:'ACCESS_DENIED',requestId}});
 Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-AI-Session'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return send(405,{error:{code:'BAD_REQUEST',requestId}});
 try{
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw analysis.failure('BAD_REQUEST');
  const input=contract.input(await readLimited(request,160000));
  enabled(env);
  if(!env.AI_API_KEY)throw analysis.failure('NOT_CONFIGURED');
  const guarded=await protectedFetcher(request,env,fetcher);
  const result=await requestStructured({systemPrompt:OPTIMIZATION_PROMPT,input,schema:contract.schema,name:'resume_optimization',maxTokens:10000,allowNetworkFallback:false,preferSharedBeijing:true,validate:value=>contract.safeguard(contract.validate(contract.normalize(value)),input.resumeText)},env,guarded,90000);
  return send(200,{mode:'live',optimization:result});
 }catch(error){
  const code=error.code==='NETWORK'?'UPSTREAM_NETWORK':Object.hasOwn(analysis.messages,error.code)?error.code:'UNAVAILABLE';
  const status=guardStatus(code)||(['BAD_REQUEST','EMPTY_INPUT','INPUT_TOO_LONG'].includes(code)?400:code==='RATE_LIMIT'?429:code==='NOT_CONFIGURED'?503:code==='TIMEOUT'?504:502);
  return send(status,{error:{code,message:analysis.messages[code],requestId,...(Number.isInteger(error.upstreamStatus)?{upstreamStatus:error.upstreamStatus}:{})}});
 }
}
