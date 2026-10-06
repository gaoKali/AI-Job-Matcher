import '../js/analysis-contract.js';
import {readLimited} from './handler.mjs';
import {enabled,issueSession,guardStatus} from './public-ai-guard.mjs';
const c=globalThis.AnalysisContract;
export async function handleSecurity(request,env,fetcher=fetch){
 const origin=request.headers.get('Origin')||'',allowed=(env.ALLOWED_ORIGINS||'http://127.0.0.1,http://localhost,http://127.0.0.1:4173,http://localhost:4173').split(',').map(x=>x.trim());
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Origin'};
 const send=(status,body)=>Response.json(body,{status,headers});
 if(!origin||!allowed.includes(origin))return send(403,{error:{code:'ACCESS_DENIED'}});
 Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-AI-Session'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
  enabled(env);const path=new URL(request.url).pathname;
  if(path==='/api/security/config'&&request.method==='GET'){
   if(!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET_KEY||!env.AI_USAGE)throw c.failure('SECURITY_UNAVAILABLE');return send(200,{siteKey:env.TURNSTILE_SITE_KEY});
  }
  if(path!=='/api/security/session'||request.method!=='POST')return send(405,{error:{code:'BAD_REQUEST'}});
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw c.failure('BAD_REQUEST');
  const body=await readLimited(request,6000);
  if(!body||Array.isArray(body)||Object.keys(body).join(',')!=='token'||typeof body.token!=='string'||!body.token||body.token.length>2048)throw c.failure('TURNSTILE_REQUIRED');
  if(!env.TURNSTILE_SECRET_KEY||!env.AI_USAGE||!request.headers.get('CF-Connecting-IP'))throw c.failure('SECURITY_UNAVAILABLE');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);let result;
  try{
   const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:body.token,remoteip:request.headers.get('CF-Connecting-IP')}),signal:controller.signal});
   if(!response.ok)throw Error();result=await response.json();
  }catch{throw c.failure('TURNSTILE_FAILED');}finally{clearTimeout(timer);}
  if(result.success!==true||result.action!=='resume_ai'||result.hostname!==new URL(origin).hostname)throw c.failure('TURNSTILE_FAILED');
  return send(200,await issueSession(request,env));
 }catch(e){const code=Object.hasOwn(c.messages,e.code)?e.code:'SECURITY_UNAVAILABLE';return send(guardStatus(code)||400,{error:{code,message:c.messages[code]}});}
}
