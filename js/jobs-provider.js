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
  providers.jobProvider={async search(preferences,profile,{signal,onProgress=()=>{}}={}){
    abortCheck(signal);const warnings=[],all=[];let done=0;let next=0;
    async function worker(){while(next<root.JobSources.length){const source=root.JobSources[next++];try{let jobs;const saved=cached.get(source.key);if(saved&&Date.now()-saved.time<300000)jobs=saved.jobs;else{const data=await request('/api/jobs/boards/'+source.key,{signal});jobs=core.normalizeBoard(source,data);cached.set(source.key,{time:Date.now(),jobs});}all.push(...jobs);}catch(e){if(e.code==='CANCELLED')throw e;warnings.push(source.company+' 暂时不可访问，已继续其他来源。');console.warn('Public job source:',source.key,e.code||(['SyntaxError','TypeError'].includes(e.name)?e.name:'SOURCE_FORMAT'),e.status||null);}finally{onProgress('正在读取公开岗位：'+(++done)+' / '+root.JobSources.length+' 家公司……');}}}
    await Promise.all(Array.from({length:4},worker));abortCheck(signal);
    const jobs=core.shortlist(all,preferences,profile,10).map(job=>({...job,matchScore:null,matchReasons:[],gaps:job.screeningNotes,recommendation:'AI尚未评分，请自行核对JD。',resumeTips:[],isMock:false}));
    if(!jobs.length)return {jobs:[],warnings,total:all.length,availableSources:root.JobSources.length-warnings.length};
    if(profile?.isMock){warnings.push('开发演示画像不发送给真实AI；以下为真实岗位，尚未AI评分。');return {jobs,warnings,total:all.length};}
    onProgress('已筛选出 '+jobs.length+' 个相关岗位，正在一次批量匹配……');
    try{
      const data=await request('/api/jobs/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({preferences,profile,jobs:jobs.map(({id,company,title,location,description,url,source,publishedAt,workMode})=>({id,company,title,location,description:description.slice(0,6000),descriptionTruncated:description.length>6000,url,source,publishedAt,workMode}))}),signal},65000);
      if(data.mode!=='live'||!Array.isArray(data.matches))throw contract.failure('INVALID_SCHEMA');
      const matches=new Map(data.matches.map(m=>[m.id,m]));
      for(const job of jobs){const match=matches.get(job.id);if(match&&Number.isFinite(match.matchScore)&&match.matchScore>=0&&match.matchScore<=100&&['matchReasons','gaps','resumeTips'].every(k=>Array.isArray(match[k])&&match[k].every(v=>typeof v==='string'))&&typeof match.recommendation==='string')Object.assign(job,{matchScore:match.matchScore,matchReasons:match.matchReasons,gaps:[...job.screeningNotes,...match.gaps],recommendation:match.recommendation,resumeTips:match.resumeTips});else warnings.push(job.title+' 暂未取得有效AI评分。');}
    }catch(e){if(e.code==='CANCELLED')throw e;warnings.push('AI岗位匹配暂时失败（'+(contract.messages[e.code]?e.code:'NETWORK')+(e.status?'，HTTP '+e.status:'')+'），已保留真实岗位，可查看JD或稍后重新搜索。');console.warn('Job matching:',contract.messages[e.code]?e.code:'NETWORK',e.status||null);}
    return {jobs:core.filter(jobs),warnings,total:all.length};
  }};
})(window);
