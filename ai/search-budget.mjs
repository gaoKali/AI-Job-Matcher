export const SEARCH_LIMIT=1500;
export const SEARCH_LIMIT_MESSAGE='当前免费实时岗位搜索额度已达到安全上限，已暂停联网搜索以避免产生费用。';
const key='websearch-total-v1';
export class SearchBudget {
 constructor(ctx){this.storage=ctx.storage;}
 async fetch(request){
 const path=new URL(request.url).pathname;const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
 const status=n=>({used:n,limit:SEARCH_LIMIT,remaining:Math.max(0,SEARCH_LIMIT-n),paused:n>=SEARCH_LIMIT});
 if(request.method==='GET'&&path==='/usage'){const n=(await this.storage.get(key))??0;if(!Number.isSafeInteger(n)||n<0)return new Response(JSON.stringify({error:'COUNTER_UNAVAILABLE'}),{status:503,headers});return new Response(JSON.stringify(status(n)),{headers});}
 if(request.method!=='POST'||path!=='/reserve')return new Response('Not found',{status:404});
 const result=await this.storage.transaction(async txn=>{const n=(await txn.get(key))??0;if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid counter');if(n>=SEARCH_LIMIT)return {allowed:false,...status(n)};await txn.put(key,n+1);return {allowed:true,...status(n+1)};});
 return new Response(JSON.stringify(result),{status:result.allowed?200:429,headers});
 }
}
export async function budgetRequest(env,path){
 if(!env.SEARCH_BUDGET)throw Object.assign(new Error('SEARCH_COUNTER_UNAVAILABLE'),{code:'SEARCH_COUNTER_UNAVAILABLE'});
 try{const stub=env.SEARCH_BUDGET.get(env.SEARCH_BUDGET.idFromName('global-websearch-budget-v1'));const r=await stub.fetch('https://counter.internal'+path,{method:path==='/reserve'?'POST':'GET'});const data=await r.json();if(r.status===429&&data.allowed===false)throw Object.assign(new Error('SEARCH_SAFETY_LIMIT'),{code:'SEARCH_SAFETY_LIMIT'});if(!r.ok||!Number.isSafeInteger(data.used)||data.limit!==SEARCH_LIMIT)throw Error('Counter failed');return data;}catch(e){if(e.code==='SEARCH_SAFETY_LIMIT')throw e;throw Object.assign(new Error('SEARCH_COUNTER_UNAVAILABLE'),{code:'SEARCH_COUNTER_UNAVAILABLE'});}
}
