'use strict';
const profile={"candidateProfile":"具有零售行业数据整理与报表经验的候选人。","experienceYears":"约3年（按已列任职日期）","currentDirection":"数据分析","coreSkills":["SQL","Excel"],"workExperienceSummary":"2021.01-2024.01 在星河测试企业担任数据分析师，使用 SQL、Excel 制作销售报表。","educationSummary":"2017-2021 测试大学，统计学，本科。","strengths":["已描述 SQL、Excel 报表实践，具备零售行业数据整理经验。"],"weaknesses":["建议补充真实报表使用范围与业务成果，目前没有足够结果描述。"],"recommendedDirections":[{"title":"数据分析师","reason":"已有数据分析师经历和报表实践，可继续考虑这一方向。","confidence":"high","evidence":"使用 SQL、Excel 制作销售报表。"}],"missingInformation":["2024.01之后的经历未提供。","项目成果和指标未提供。"]};
const preferences={role:'数据分析师',city:'上海',industry:'互联网',exclude:'不考虑销售'};

const base=window.AnalysisConfig.endpoint.replace(/\/api\/resume\/analyze\/?$/,'');
const button=document.getElementById('run'),status=document.getElementById('status'),result=document.getElementById('result');
button.addEventListener('click',async()=>{
 if(button.disabled)return;button.disabled=true;let summary={searchCalls:0,modelCalls:0};
 const request=async(path,body,timeout)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);try{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(body),signal:controller.signal});const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error?.code||'HTTP_ERROR'),{status:r.status});return data;}finally{clearTimeout(timer);}};
 try{
 status.textContent='正在执行唯一一轮真实搜索……';const searched=await request('/api/jobs/search',{preferences},95000);summary={...summary,searchCalls:searched.searchCalls,platformResults:searched.platformResults||[],searchStatus:searched.status,diagnostic:searched.diagnostic,usage:searched.usage,warnings:searched.warnings};
 const jobs=window.JobCore.shortlist(searched.jobs||[],preferences,profile,15);summary.totalUniqueResults=searched.jobs?.length||0;summary.duplicatesRemaining=new Set((searched.jobs||[]).map(j=>j.url)).size!==(searched.jobs||[]).length;summary.filteredCount=jobs.length;summary.jobs=jobs;
 const box=document.getElementById('links');for(const j of searched.jobs||[]){const a=document.createElement('a');a.href=j.url;a.textContent=j.source+' · '+j.title;a.target='_blank';a.rel='noopener noreferrer';const p=document.createElement('p');p.append(a);box.append(p);}
 result.textContent=JSON.stringify(summary,null,2);
 if(!jobs.length){status.textContent='本次没有相关国内岗位，未调用模型。免费ATS备用仍由正式页面提供。';return;}
 status.textContent='正在执行唯一一次 Qwen 批量匹配……';summary.modelCalls=1;const matched=await request('/api/jobs/match',{preferences,profile,jobs:jobs.map(j=>({...j,description:j.description.slice(0,1500)}))},65000);summary.matches=matched.matches;summary.modelStatus=matched.mode;status.textContent='真实测试完成';result.textContent=JSON.stringify(summary,null,2);
 }catch(e){summary.error={code:e.name==='AbortError'?'BROWSER_TIMEOUT':e.message,status:e.status||null};status.textContent='本次验证未完成，已停止，不自动重试';result.textContent=JSON.stringify(summary,null,2);}
});
