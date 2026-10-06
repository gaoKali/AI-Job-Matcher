// Unified, fail-closed public AI protection. Persistent storage receives anonymous counts only.
import '../js/analysis-contract.js';
const c=globalThis.AnalysisContract,enc=new TextEncoder(),DAY=86400000;
export const guardCodes=['TOO_MANY_REQUESTS','DAILY_USER_LIMIT_REACHED','SERVICE_DAILY_LIMIT_REACHED','AI_DISABLED','TURNSTILE_REQUIRED','TURNSTILE_FAILED','SECURITY_UNAVAILABLE'];
export function guardStatus(code){return ['AI_DISABLED','SECURITY_UNAVAILABLE'].includes(code)?503:code.startsWith('TURNSTILE_')?403:guardCodes.includes(code)?429:null;}
export function enabled(env){if(env.PUBLIC_AI_ENABLED==='false')throw c.failure('AI_DISABLED');}
export function settings(env){
 const number=(v,d,max)=>v===undefined?d:/^[1-9][0-9]*$/.test(String(v))&&Number(v)<=max?Number(v):null;
 const ip=number(env.IP_DAILY_AI_LIMIT,10,10000),global=number(env.DAILY_AI_GLOBAL_LIMIT,100,100000),minute=number(env.IP_MINUTE_AI_LIMIT,2,100);
 if(!ip||!global||!minute)throw c.failure('SECURITY_UNAVAILABLE');return {ip,global,minute};
}
function identity(request,env){
 enabled(env);const ip=request.headers.get('CF-Connecting-IP'),origin=request.headers.get('Origin')||'';
 if(!ip||ip.length>64||!env.TURNSTILE_SECRET_KEY||!env.AI_USAGE)throw c.failure('SECURITY_UNAVAILABLE');
 const allowed=(env.ALLOWED_ORIGINS||'http://127.0.0.1,http://localhost,http://127.0.0.1:4173,http://localhost:4173').split(',').map(x=>x.trim());
 if(!allowed.includes(origin)||!/^https?:\/\//.test(origin))throw c.failure('ACCESS_DENIED');return {ip,origin};
}
async function key(env){return crypto.subtle.importKey('raw',enc.encode(env.TURNSTILE_SECRET_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));
async function ipKey(ip,env,day){return b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(env),enc.encode('ip-v1|'+day+'|'+ip))));}
export async function issueSession(request,env,now=Date.now()){
 const {ip,origin}=identity(request,env),day=Math.floor((now+8*3600000)/DAY),expiresAt=now+1800000;
 const payload=b64(enc.encode(JSON.stringify({v:1,day,expiresAt,origin,ip:await ipKey(ip,env,day)})));
 const sig=b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(env),enc.encode('session-v1|'+payload))));return {session:payload+'.'+sig,expiresAt};
}
async function sessionIdentity(request,env,now){
 const {ip,origin}=identity(request,env),token=request.headers.get('X-AI-Session')||'';
 if(!token||token.length>2048)throw c.failure('TURNSTILE_REQUIRED');
 try{
  const parts=token.split('.');if(parts.length!==2||!await crypto.subtle.verify('HMAC',await key(env),decode(parts[1]),enc.encode('session-v1|'+parts[0])))throw Error();
  const data=JSON.parse(new TextDecoder().decode(decode(parts[0])));
  if(data.v!==1||!Number.isSafeInteger(data.expiresAt)||data.expiresAt<=now||data.expiresAt>now+1800000||data.origin!==origin||data.ip!==await ipKey(ip,env,data.day))throw Error();
  const day=Math.floor((now+8*3600000)/DAY);return {day,ipHash:await ipKey(ip,env,day),now};
 }catch{throw c.failure('TURNSTILE_FAILED');}
}
async function reserve(env,value){
 try{
  const stub=env.AI_USAGE.get(env.AI_USAGE.idFromName('public-ai-global-v1'));
  const response=await stub.fetch('https://usage.internal/reserve',{method:'POST',body:JSON.stringify({...value,limits:settings(env)})}),result=await response.json();
  if(!response.ok){if(guardCodes.includes(result.code))throw c.failure(result.code);throw Error();}
  if(result.allowed!==true||!Number.isSafeInteger(result.used))throw Error();console.info(JSON.stringify({event:'ai-usage',date:new Date(value.day*DAY).toISOString().slice(0,10),used:result.used}));
 }catch(e){if(guardCodes.includes(e.code))throw e;throw c.failure('SECURITY_UNAVAILABLE');}
}
// Count every actual outbound attempt, including the existing bounded network fallback.
// Failed attempts are conservatively not refunded. Validation and CAPTCHA do not consume AI quota.
export async function protectedFetcher(request,env,fetcher=fetch){
 await sessionIdentity(request,env,Date.now());
 return async(...args)=>{const value=await sessionIdentity(request,env,Date.now());await reserve(env,value);return fetcher(...args);};
}
export class AIUsage {
 constructor(ctx){this.storage=ctx.storage;}
 async fetch(request){
  if(request.method!=='POST'||new URL(request.url).pathname!=='/reserve')return new Response('Not found',{status:404});
  try{
   const {day,ipHash,now,limits}=await request.json();
   if(!Number.isSafeInteger(day)||!Number.isSafeInteger(now)||Math.floor((now+8*3600000)/DAY)!==day||!/^[-_a-zA-Z0-9]{43}$/.test(ipHash)||!limits||!['ip','global','minute'].every(k=>Number.isSafeInteger(limits[k])&&limits[k]>0))throw Error();
   const result=await this.storage.transaction(async tx=>{
    const previous=(await tx.get('day'))??day;if(previous>day)throw Error();
    if(previous!==day){const all=await tx.list();for(const k of all.keys())await tx.delete(k);}
    const used=(await tx.get('global'))??0,ipKey='ip:'+ipHash,record=(await tx.get(ipKey))??{count:0,times:[]};
    if(!Number.isSafeInteger(used)||used<0||!Number.isSafeInteger(record.count)||record.count<0||!Array.isArray(record.times)||record.times.some(t=>!Number.isSafeInteger(t)))throw Error();
    if(used>=limits.global)return {code:'SERVICE_DAILY_LIMIT_REACHED'};
    if(record.count>=limits.ip)return {code:'DAILY_USER_LIMIT_REACHED'};
    const times=record.times.filter(t=>now-t<60000);if(times.length>=limits.minute)return {code:'TOO_MANY_REQUESTS'};
    await tx.put('day',day);await tx.put('global',used+1);await tx.put(ipKey,{count:record.count+1,times:[...times,now]});return {allowed:true,used:used+1};
   });
   if(result.allowed&&typeof this.storage.setAlarm==='function')await this.storage.setAlarm((day+2)*DAY-8*3600000);
   return Response.json(result,{status:result.allowed?200:429});
  }catch{return Response.json({code:'SECURITY_UNAVAILABLE'},{status:503});}
 }
 async alarm(){await this.storage.deleteAll();}
}
