import '../js/job-core.js';
import '../js/websearch-core.js';
import {budgetRequest,SEARCH_LIMIT_MESSAGE} from './search-budget.mjs';
const core=globalThis.WebSearchCore;
export const MCP_URL='https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp';
export const FREE_MESSAGE='当前免费实时岗位搜索额度暂时不可用，请稍后再试。';
const fail=(code)=>Object.assign(new Error(code),{code});
// The user authorizes a conservative site-wide 1500-call guard; never use an in-memory quota.
export function enabled(env){return String(env.WEBSEARCH_ENABLED).toLowerCase()==='true'&&Boolean(env.SEARCH_BUDGET);}
export class WebSearchClient {
 constructor(apiKey,fetcher=fetch,reserve=async()=>{throw fail("SEARCH_COUNTER_UNAVAILABLE");}){this.reserve=reserve;this.key=apiKey;this.fetcher=fetcher;this.session=null;this.protocol='2025-03-26';this.id=0;this.calls=0;this.domains=new Set();}
 async rpc(method,params,notification=false){
 const id=++this.id;const headers={'Authorization':'Bearer '+this.key,'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
 if(this.session)headers['Mcp-Session-Id']=this.session;if(method!=='initialize')headers['MCP-Protocol-Version']=this.protocol;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{const transport=this.fetcher;const response=await transport(MCP_URL,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',...(notification?{}:{id}),method,params}),signal:controller.signal,redirect:'manual'});
 if(!response.ok)throw fail([401,403].includes(response.status)?'SEARCH_NOT_ENABLED':response.status===429?'SEARCH_QUOTA_UNAVAILABLE':'SEARCH_HTTP_ERROR');
 if(response.headers.get('Mcp-Session-Id'))this.session=response.headers.get('Mcp-Session-Id');
 if(notification){await response.body?.cancel();return null;}
 const reader=response.body?.getReader();if(!reader)throw fail('SEARCH_INVALID_RESULT');const decoder=new TextDecoder();let buffer='',size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>500000)throw fail('SEARCH_TOO_LARGE');buffer+=decoder.decode(value,{stream:true});if(response.headers.get('Content-Type')?.includes('text/event-stream')){for(const event of buffer.split(/\r?\n\r?\n/).slice(0,-1)){const text=event.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!text)continue;let frame;try{frame=JSON.parse(text);}catch{continue;}if(frame.id===id){await reader.cancel();if(frame.error)throw fail('SEARCH_RPC_ERROR');return frame.result;}}}}}finally{reader.releaseLock();}
 let result;try{result=JSON.parse(buffer+decoder.decode());}catch{throw fail('SEARCH_INVALID_RESULT');}if(result.id!==id||result.error)throw fail('SEARCH_RPC_ERROR');return result.result;
 }catch(e){if(e.code)throw e;const message=String(e.message||'');const reason=/Illegal invocation|incorrect.*this|this.*reference/i.test(message)?'FUNCTION_BINDING':/redirect/i.test(message)?'REDIRECT_MODE':/encoding|compressed|gzip/i.test(message)?'ENCODING':/network|connect|fetch/i.test(message)?'CONNECTION':/request|header/i.test(message)?'REQUEST_HEADERS':'UNKNOWN';const diagnostic={stage:method,errorType:e.name||'Error',reason};console.warn(JSON.stringify({event:'websearch-rpc',...diagnostic}));throw Object.assign(fail(controller.signal.aborted?'SEARCH_TIMEOUT':'SEARCH_NETWORK'),{diagnostic});}finally{clearTimeout(timer);}
 }
 async connect(){const init=await this.rpc('initialize',{protocolVersion:this.protocol,capabilities:{},clientInfo:{name:'ai-job-matcher',version:'1.0.0'}});if(!init?.protocolVersion)throw fail('SEARCH_PROTOCOL');this.protocol=init.protocolVersion;await this.rpc('notifications/initialized',{},true);const list=await this.rpc('tools/list',{});
 const tools=(list?.tools||[]).filter(t=>/search/i.test(t.name)&&!/(extract|crawl|image)/i.test(t.name));
 for(const t of tools){const props=t.inputSchema?.properties||{};const key=['query','search_query','query_text','queries'].find(k=>props[k]?.type==='string'||(props[k]?.type==='array'&&props[k]?.items?.type==='string'));if(!key||(t.inputSchema.required||[]).some(k=>k!==key))continue;this.tool=t;this.queryKey=key;return;}
 throw fail('SEARCH_TOOL_SCHEMA');
 }
 async search(p){if(this.calls>=3||this.domains.has(p.domain))throw fail('SEARCH_LIMIT');await this.reserve();this.calls++;this.domains.add(p.domain);
 const result=await this.rpc('tools/call',{name:this.tool.name,arguments:{[this.queryKey]:this.tool.inputSchema.properties[this.queryKey].type==='array'?[p.query]:p.query}});
 if(result?.isError)throw fail('SEARCH_TOOL_ERROR');let payload=result?.structuredContent;
 if(!payload){const text=(result?.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');try{payload=JSON.parse(text);}catch{payload=[...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)].map(m=>({title:m[1],url:m[2],summary:text.slice(m.index+m[0].length,m.index+m[0].length+1000)}));if(!payload.length)throw fail('SEARCH_INVALID_RESULT');}}
 const rows=core.extractRows(payload);const jobs=core.normalizeResults(payload,p.domain);this.lastResultStats={returnedRows:rows.length,acceptedJobs:jobs.length};return jobs;
 }
}
export async function searchPublicJobs(preferences,env,fetcher=fetch){
 if(!enabled(env))return {mode:'live',jobs:[],searchCalls:0,status:'FREE_SEARCH_UNAVAILABLE',warnings:[FREE_MESSAGE]};
 if(!env.AI_API_KEY)return {mode:'live',jobs:[],searchCalls:0,status:'SEARCH_NOT_ENABLED',warnings:[FREE_MESSAGE]};
 let usage;try{usage=await budgetRequest(env,'/usage');if(usage.paused)return {mode:'live',jobs:[],searchCalls:0,status:'SEARCH_SAFETY_LIMIT',usage,warnings:[SEARCH_LIMIT_MESSAGE]};}catch{return {mode:'live',jobs:[],searchCalls:0,status:'SEARCH_COUNTER_UNAVAILABLE',warnings:[FREE_MESSAGE]};}
 const client=new WebSearchClient(env.AI_API_KEY,fetcher,()=>budgetRequest(env,'/reserve')),jobs=[],warnings=[],platformResults=[];
 try{await client.connect();}catch(e){return {mode:'live',jobs:[],searchCalls:0,status:e.code,diagnostic:e.diagnostic||null,usage,warnings:[FREE_MESSAGE]};}
 for(const p of core.queries(preferences)){try{const found=await client.search(p);jobs.push(...found);platformResults.push({source:p.source,count:new Set(found.map(j=>j.url)).size,status:'OK',...client.lastResultStats});}catch(e){platformResults.push({source:p.source,count:0,status:e.code});warnings.push(e.code==='SEARCH_SAFETY_LIMIT'?SEARCH_LIMIT_MESSAGE:p.source+' 搜索暂不可用（'+e.code+'）。');if(['SEARCH_QUOTA_UNAVAILABLE','SEARCH_NOT_ENABLED','SEARCH_SAFETY_LIMIT','SEARCH_COUNTER_UNAVAILABLE'].includes(e.code))break;}}
 try{usage=await budgetRequest(env,'/usage');}catch{warnings.push('累计搜索计数暂时无法读取。');}
 return {mode:'live',jobs:[...new Map(jobs.map(j=>[j.url,j])).values()],searchCalls:client.calls,status:jobs.length?'OK':platformResults.some(p=>p.status==='SEARCH_SAFETY_LIMIT')?'SEARCH_SAFETY_LIMIT':'NO_RESULTS',warnings,usage,platformResults};
}
