(function(){
'use strict';
const contract=window.OptimizationContract,a=window.AnalysisContract;
const endpoint=new URL('/api/resume/optimize',window.AnalysisConfig.endpoint).href;
const development=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
window.ResumeOptimization={endpoint,async optimize(body,{signal}={}){
 const input=contract.input(body),controller=new AbortController();
 const cancel=()=>controller.abort();if(signal?.aborted)throw a.failure('CANCELLED');signal?.addEventListener('abort',cancel,{once:true});
 let timedOut=false,status=null,requestId=null;const timer=setTimeout(()=>{timedOut=true;controller.abort();},100000);
 const report=code=>{if(development)console.info('Resume optimization',JSON.stringify({url:endpoint,status,code,requestId}));};
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',cache:'no-store',body:JSON.stringify(input),signal:controller.signal});
  status=response.status;
  let payload;try{payload=JSON.parse(await response.text());}catch{throw a.failure('INVALID_JSON');}
  if(/^[a-f0-9-]{36}$/i.test(payload?.error?.requestId||''))requestId=payload.error.requestId;
  if(!response.ok)throw a.failure(Object.hasOwn(a.messages,payload?.error?.code)?payload.error.code:'UNAVAILABLE');
  if(payload.mode!=='live')throw a.failure('INVALID_SCHEMA');
  const result=contract.validate(contract.normalize(payload.optimization));result.factChecks=contract.readChecks(payload.optimization.factChecks);report(null);return result;
 }catch(error){const code=signal?.aborted?'CANCELLED':timedOut?'TIMEOUT':Object.hasOwn(a.messages,error.code)?error.code:'NETWORK';report(code);throw Object.assign(a.failure(code),{status,requestId});}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}};
})();
