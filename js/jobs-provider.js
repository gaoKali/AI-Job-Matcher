(function(root){
  'use strict';
  const providers=root.JobMatcherProviders,core=root.JobCore,contract=root.AnalysisContract;
  const endpoint=root.AnalysisConfig.endpoint.replace(/\/api\/resume\/analyze\/?$/,'');
  const cached=new Map();
  function abortCheck(signal){if(signal?.aborted)throw contract.failure('CANCELLED');}
  async function request(path,options={},timeout=18000){
    const controller=new AbortController();const external=options.signal;const cancel=()=>controller.abort();external?.addEventListener('abort',cancel,{once:true});const timer=setTimeout(cancel,timeout);
    try{abortCheck(external);const response=await fetch(endpoint+path,{...options,signal:controller.signal,credentials:'omit',cache:'no-store'});const bytes=await response.arrayBuffer();if(bytes.byteLength>25000000)throw Error('SOURCE_TOO_LARGE');const data=JSON.parse(new TextDecoder().decode(bytes));if(!response.ok){const error=contract.failure(data.error?.code||'UNAVAILABLE');error.status=response.status;throw error;}return data;}
    catch(e){if(external?.aborted)throw contract.failure('CANCELLED');if(controller.signal.aborted)throw contract.failure('TIMEOUT');throw e;}
    finally{clearTimeout(timer);external?.removeEventListener('abort',cancel);}
  }
  providers.jobMode='live';
  providers.jobProvider={async search(preferences,profile,{signal,onProgress=()=>{},onSearchMeta=()=>{}}={}){
    abortCheck(signal);const warnings=[],all=[];let searchCalls=0;let usage=null;let searchUnavailable=false;
    if(root.WebSearchCore&&!profile?.isMock){onProgress("正在搜索 BOSS直聘、猎聘、智联招聘……");try{const data=await request("/api/jobs/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({preferences}),signal},95000);if(data.mode!=="live"||!Array.isArray(data.jobs))throw contract.failure("INVALID_SCHEMA");onSearchMeta({platformResults:data.platformResults||[],jobs:data.jobs,usage:data.usage,searchCalls:data.searchCalls,status:data.status});all.push(...data.jobs);searchCalls=Number(data.searchCalls)||0;usage=data.usage||null;searchUnavailable=data.status!=="OK";warnings.push(...(data.warnings||[]));}catch(e){if(e.code==="CANCELLED")throw e;searchUnavailable=true;warnings.push("当前免费实时岗位搜索额度暂时不可用，请稍后再试。");console.warn("Public search:",e.code||"NETWORK",e.status||null);}}let done=0;let next=0;
    async function worker(){while(next<root.JobSources.length){const source=root.JobSources[next++];try{let jobs;const saved=cached.get(source.key);if(saved&&Date.now()-saved.time<300000)jobs=saved.jobs;else{const data=await request('/api/jobs/boards/'+source.key,{signal});jobs=core.normalizeBoard(source,data);cached.set(source.key,{time:Date.now(),jobs});}all.push(...jobs);}catch(e){if(e.code==='CANCELLED')throw e;warnings.push(source.company+' 暂时不可访问，已继续其他来源。');console.warn('Public job source:',source.key,e.code||(['SyntaxError','TypeError'].includes(e.name)?e.name:'SOURCE_FORMAT'),e.status||null);}finally{onProgress('正在读取公开岗位：'+(++done)+' / '+root.JobSources.length+' 家公司……');}}}
    if(core.shortlist(all,preferences,profile,15).length<10){onProgress("正在补充免费公开岗位……");await Promise.all(Array.from({length:4},worker));}abortCheck(signal);onProgress("正在筛选真实岗位……");
    const jobs=core.shortlist(all,preferences,profile,15).map(job=>({...job,matchScore:null,matchReasons:[],gaps:job.screeningNotes,recommendation:'AI尚未评分，请自行核对JD。',resumeTips:[],confidence:'低',salary:job.salary||'未公开',experience:job.experience||'未公开',education:job.education||'未公开',isMock:false}));
    if(!jobs.length){if(searchUnavailable&&!warnings.some(w=>w.includes('当前免费实时岗位搜索额度')))warnings.push('当前免费实时岗位搜索额度暂时不可用，请稍后再试。');return {jobs:[],warnings,total:all.length,searchCalls,usage};}
    if(profile?.isMock){warnings.push('开发演示画像不发送给真实AI；以下为真实岗位，尚未AI评分。');return {jobs,warnings,total:all.length};}
    onProgress('已筛选出 '+jobs.length+' 个相关岗位，正在计算简历匹配度……');
    try{
      const data=await request('/api/jobs/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({preferences,profile,jobs:jobs.map(({id,company,title,location,description,url,source,publishedAt,workMode,salary,experience,education,searchSummaryOnly})=>({id,company,title,location,description:description.slice(0,1800),descriptionTruncated:description.length>1800,url,source,publishedAt,workMode,salary,experience,education,searchSummaryOnly}))}),signal},65000);
      if(data.mode!=='live'||!Array.isArray(data.matches))throw contract.failure('INVALID_SCHEMA');
      const matches=new Map(data.matches.map(m=>[m.id,m]));
      for(const job of jobs){const match=matches.get(job.id);if(match&&Number.isFinite(match.matchScore)&&match.matchScore>=0&&match.matchScore<=100&&['matchReasons','gaps','resumeTips'].every(k=>Array.isArray(match[k])&&match[k].every(v=>typeof v==='string'))&&typeof match.recommendation==='string')Object.assign(job,{matchScore:match.matchScore,matchReasons:match.matchReasons,gaps:[...job.screeningNotes,...match.gaps],recommendation:match.recommendation,resumeTips:match.resumeTips,confidence:['高','中','低'].includes(match.confidence)?match.confidence:'低'});else warnings.push(job.title+' 暂未取得有效AI评分。');}
    }catch(e){if(e.code==='CANCELLED')throw e;warnings.push('AI岗位匹配暂时失败（'+(contract.messages[e.code]?e.code:'NETWORK')+(e.status?'，HTTP '+e.status:'')+'），已保留真实岗位，可查看JD或稍后重新搜索。');console.warn('Job matching:',contract.messages[e.code]?e.code:'NETWORK',e.status||null);}
    return {jobs:core.filter(jobs),warnings,total:all.length,searchCalls,usage};
  }};
})(window);
