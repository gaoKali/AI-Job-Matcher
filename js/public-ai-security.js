// Turnstile is loaded only for an explicit AI action; session stays in memory (30 min).
(function(){
'use strict';
const c=window.AnalysisContract;
let session=null,pending=null,sdk=null;
const base=()=>new URL(window.AnalysisConfig.endpoint,location.href);
function invalidate(code){if(['TURNSTILE_REQUIRED','TURNSTILE_FAILED'].includes(code))session=null;}
async function api(path,body,signal){
 const response=await fetch(new URL(path,base()).href,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'omit',cache:'no-store',signal});
 let payload;try{payload=await response.json();}catch{throw c.failure('SECURITY_UNAVAILABLE');}
 if(!response.ok)throw c.failure(Object.hasOwn(c.messages,payload?.error?.code)?payload.error.code:'SECURITY_UNAVAILABLE');return payload;
}
function loadSDK(){
 if(window.turnstile)return Promise.resolve();
 if(sdk)return sdk;
 sdk=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
  const timer=setTimeout(()=>{script.remove();reject(c.failure('TURNSTILE_FAILED'));},15000);
  script.addEventListener('load',()=>{clearTimeout(timer);window.turnstile?resolve():reject(c.failure('TURNSTILE_FAILED'));},{once:true});
  script.addEventListener('error',()=>{clearTimeout(timer);script.remove();reject(c.failure('TURNSTILE_FAILED'));},{once:true});document.head.append(script);
 }).catch(error=>{sdk=null;throw error;});return sdk;
}
async function challenge(siteKey,signal){
 await loadSDK();if(signal.aborted)throw c.failure('CANCELLED');
 return new Promise((resolve,reject)=>{
  const mount=document.createElement('div');mount.setAttribute('aria-label','安全验证');mount.className='ai-security-check';
  const button=document.querySelector('#step-3:not([hidden]) #optimize-button')||document.getElementById('analyze-button');
  if(button)button.before(mount);else document.body.append(mount);
  let widget=null,finished=false;
  const done=(error,token)=>{if(finished)return;finished=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);if(widget!==null)window.turnstile.remove(widget);mount.remove();error?reject(error):resolve(token);};
  const cancel=()=>done(c.failure('CANCELLED'));
  const timer=setTimeout(()=>done(c.failure('TURNSTILE_FAILED')),120000);
  signal.addEventListener('abort',cancel,{once:true});
  try{widget=window.turnstile.render(mount,{sitekey:siteKey,action:'resume_ai',theme:'light',size:'flexible',appearance:'interaction-only','retry':'never','refresh-expired':'never',callback:token=>done(null,token),'error-callback':()=>{done(c.failure('TURNSTILE_FAILED'));return true;},'expired-callback':()=>done(c.failure('TURNSTILE_FAILED')),'before-interactive-callback':()=>mount.scrollIntoView({block:'nearest'})});}
  catch{done(c.failure('TURNSTILE_FAILED'));}
 });
}
async function ensureSession({signal}={}){
 if(signal?.aborted)throw c.failure('CANCELLED');
 if(session&&session.expiresAt>Date.now()+10000)return session.session;
 if(!pending){
  const controller=new AbortController(),cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(()=>controller.abort(),150000);
  pending=(async()=>{
   const config=await api('/api/security/config',null,controller.signal);
   if(typeof config.siteKey!=='string'||!config.siteKey)throw c.failure('SECURITY_UNAVAILABLE');
   const token=await challenge(config.siteKey,controller.signal);
   const verified=await api('/api/security/session',{token},controller.signal);
   if(typeof verified.session!=='string'||!Number.isSafeInteger(verified.expiresAt)||verified.expiresAt<=Date.now()||verified.expiresAt>Date.now()+1800000+5000)throw c.failure('TURNSTILE_FAILED');
   session=verified;return verified.session;
  })().catch(error=>{throw c.failure(signal?.aborted?'CANCELLED':Object.hasOwn(c.messages,error.code)?error.code:'TURNSTILE_FAILED');}).finally(()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);pending=null;});
 }
 const value=await pending;if(signal?.aborted)throw c.failure('CANCELLED');return value;
}
window.PublicAISecurity=Object.freeze({ensureSession,invalidate});
})();
