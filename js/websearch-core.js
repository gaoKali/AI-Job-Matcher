(function(root){
'use strict';
const platforms=[{domain:'zhipin.com',source:'BOSS直聘',progress:'正在搜索 BOSS直聘……'},{domain:'liepin.com',source:'猎聘',progress:'正在搜索猎聘……'},{domain:'zhaopin.com',source:'智联招聘',progress:'正在搜索智联招聘……'}];
const str=v=>typeof v==='string'?root.JobCore.plain(v):'';
function sourceFor(url){try{const u=new URL(url);if(!/^https?:$/.test(u.protocol)||u.username||u.password)return null;return platforms.find(p=>u.hostname===p.domain||u.hostname.endsWith('.'+p.domain))||null;}catch{return null;}}
function isJobUrl(url){const p=sourceFor(url);if(!p)return false;const path=new URL(url).pathname;return p.domain==='zhipin.com'?/\/job_detail\/[^/]+\.html$/.test(path):p.domain==='liepin.com'?/\/(?:job|a)\/\d+(?:\.shtml)?\/?$/.test(path):/\/(?:jobdetail\/[^/]+\.htm|jobs\/CC[^/]+\.htm)$/.test(path);}
function idFor(url){let h=2166136261;for(let i=0;i<url.length;i++)h=Math.imul(h^url.charCodeAt(i),16777619);return 'web:'+((h>>>0).toString(16));}
function queries(p){const clean=v=>str(v).replace(/site:|https?:\/\/\S+|["<>\n\r]/gi,' ').trim().slice(0,45);const tail=[p.role,p.city,p.industry,p.level,p.mustHave].map(clean).filter(Boolean).join(' ').slice(0,150)+' 招聘';return platforms.map(x=>({...x,query:'site:'+x.domain+' '+tail}));}
function extractRows(result){if(Array.isArray(result))return result;if(!result||typeof result!=='object')return [];for(const key of ['results','search_results','items','documents','data','output','result','web_pages']){if(Array.isArray(result[key]))return result[key];if(result[key]&&typeof result[key]==='object'){const rows=extractRows(result[key]);if(rows.length)return rows;}}return typeof result.url==='string'?[result]:[];}
function normalizeResults(result,domain){const unknown='未公开';return extractRows(result).flatMap(row=>{
const url=typeof row?.url==='string'?row.url.trim():typeof row?.link==='string'?row.link.trim():'';const platform=sourceFor(url);if(!platform||platform.domain!==domain||!isJobUrl(url))return [];
const title=str(row.title||row.name);if(!title)return [];const summary=str(row.summary||row.snippet||row.description||row.content).slice(0,1500)||unknown;
// Only explicit structured search fields are mapped. Do not infer city/company from a query.
const explicitCity=summary.match(/(?:工作地点|工作城市|工作地|城市|地点)s*[:：]s*([^，。;；s]{1,30})/);const city=str(row.city||row.location)||(explicitCity?explicitCity[1]:unknown);const explicitCompany=summary.match(/(?:公司名称|公司)s*[:：]s*([^，。;；]{1,60})/);const company=str(row.company)||(explicitCompany?explicitCompany[1].trim():unknown);
return [{id:idFor(url),title,company,city,location:city,salary:str(row.salary)||unknown,experience:str(row.experience)||unknown,education:str(row.education)||unknown,summary,description:summary,source:platform.source,url,publishedAt:str(row.publishedAt||row.published_at||row.publish_time)||unknown,workMode:root.JobCore.mode(summary),industry:'',isMock:false,searchSummaryOnly:true}];
});}
root.WebSearchCore={platforms,sourceFor,isJobUrl,idFor,queries,normalizeResults};if(typeof module!=='undefined')module.exports=root.WebSearchCore;
})(typeof window==='undefined'?globalThis:window);
