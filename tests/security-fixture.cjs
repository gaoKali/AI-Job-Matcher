const {webcrypto}=require('node:crypto');globalThis.crypto??=webcrypto;
class MemoryStorage{
 constructor(){this.data=new Map();this.queue=Promise.resolve();}
 async get(k){return structuredClone(this.data.get(k));}
 async put(k,v){this.data.set(k,structuredClone(v));}
 async delete(k){this.data.delete(k);}
 async list(){return new Map(this.data);}
 async deleteAll(){this.data.clear();}
 async setAlarm(n){this.alarmAt=n;}
 transaction(fn){const run=this.queue.then(()=>fn(this));this.queue=run.catch(()=>{});return run;}
}
async function fixture(overrides={}){
 const {AIUsage}=await import('../ai/public-ai-guard.mjs');const {handleSecurity}=await import('../ai/security-handler.mjs');
 const storage=new MemoryStorage(),object=new AIUsage({storage});
 const env={PUBLIC_AI_ENABLED:'true',FREE_PUBLIC_MODE:'true',TURNSTILE_SECRET_KEY:'unit-test-turnstile-secret-not-real',TURNSTILE_SITE_KEY:'unit-test-site-key',AI_API_KEY:'unit-test-only',AI_BASE_URL:'https://dashscope.aliyuncs.com/compatible-mode/v1',ALLOWED_ORIGINS:'http://127.0.0.1:4173',AI_USAGE:{idFromName:n=>n,get:()=>({fetch:(url,options)=>object.fetch(new Request(url,options))})},...overrides};
 const baseHeaders={Origin:'http://127.0.0.1:4173','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'};
 const reply=await handleSecurity(new Request('https://worker.invalid/api/security/session',{method:'POST',headers:baseHeaders,body:JSON.stringify({token:'fixture-only'})}),env,async()=>Response.json({success:true,hostname:'127.0.0.1',action:'resume_ai'}));
 const issued=await reply.json();return {env,storage,object,headers:{...baseHeaders,...(issued.session?{'X-AI-Session':issued.session}:{})},issued};
}
module.exports={fixture,MemoryStorage};
