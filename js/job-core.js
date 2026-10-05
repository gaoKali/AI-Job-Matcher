(function(root){
  'use strict';
  const text=v=>typeof v==='string'?v:'';
  function plain(v){return text(v).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n)=>{const cp=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):'';}).replace(/\s+/g,' ').trim();}
  function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
  function mode(value){const v=text(value).toLowerCase();return /hybrid|混合/.test(v)?'混合办公':/remote|远程/.test(v)?'远程办公':/onsite|on-site|on site|现场/.test(v)?'现场办公':'未注明';}
  function normalizeBoard(source,payload){
    const rows=source.source==='Lever'?payload:payload?.jobs;if(!Array.isArray(rows))throw Error('SOURCE_FORMAT');
    return rows.filter(j=>j&&j.isListed!==false).map(j=>{
      const lever=source.source==='Lever',green=source.source==='Greenhouse';
      const url=safeUrl(green?j.absolute_url:lever?j.hostedUrl:j.jobUrl||j.applyUrl);
      if(!url||!text(j.title||j.text))return null;
      const location=green?text(j.location?.name):lever?[j.categories?.location,...(j.categories?.allLocations||[])].filter(Boolean).join(' / '):[j.location,...(j.secondaryLocations||[]).map(l=>l.location)].filter(Boolean).join(' / ');
      const description=plain(green?j.content:lever?[j.descriptionPlain||j.description,...(j.lists||[]).map(l=>text(l.text)+' '+text(l.content)),j.additionalPlain||j.additional].filter(Boolean).join(' '):j.descriptionPlain||j.descriptionHtml);
      const publishedAt=green?null:lever?null:text(j.publishedAt)||null;
      const rawId=String(j.id||url.split('/').filter(Boolean).at(-1));
      return {id:source.key+':'+rawId,company:source.company,title:plain(j.title||j.text),location:plain(location)||'未注明',description:description.slice(0,16000),url,source:source.source,publishedAt,updatedAt:green?text(j.updated_at)||null:null,workMode:mode(j.workplaceType||(j.isRemote?'Remote':location)),industry:source.industry};
    }).filter(Boolean);
  }
  const aliases={
    '产品经理':['product manager','product management'],'产品运营':['product operations','product ops'],'用户运营':['community','user operations','customer engagement'],'运营':['operations','operation','growth','community'],
    '数据分析':['data analyst','data analytics','analytics'],'数据分析师':['数据分析','data analyst','data analytics','analytics','数据科学','data scientist'],'数据科学':['data scientist','data science'],'软件工程师':['software engineer','software developer'],'开发':['engineer','developer'],'前端':['frontend','front-end'],'后端':['backend','back-end'],
    'AI':['artificial intelligence','machine learning','ai'],'人工智能':['ai','machine learning'],'销售':['sales','account executive','business development'],'市场':['marketing'],'设计':['designer','design'],'客户成功':['customer success'],'上海':['shanghai'],'北京':['beijing'],'深圳':['shenzhen'],'杭州':['hangzhou'],'中国':['china'],'新加坡':['singapore'],'远程':['remote'],'高级':['senior','staff','principal'],'初级':['junior','entry','associate'],'管理岗':['manager','director','head','lead'],'实习':['intern'],'出差':['travel'],'夜班':['night shift']
  };
  function terms(value){return text(value).split(/[、，,;；\n]+/).map(v=>v.trim().replace(/^(?:不考虑|不接受|不要|排除|必须|需要)\s*/,'')).filter(Boolean);}
  function hits(hay,value){const h=text(hay).toLowerCase();const key=value.trim();return [key,...(aliases[key]||[])].some(v=>{v=v.toLowerCase();return /^[a-z0-9 +.-]+$/i.test(v)?new RegExp('(^|[^a-z0-9])'+v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)','i').test(h):h.includes(v);});}
  function any(hay,value){return terms(value).some(v=>hits(hay,v));}
  function shortlist(jobs,p={},profile={},limit=10){
    const year=parseFloat(text(profile.experienceYears));const seen=new Set();const identities=new Set();
    const preferred=jobs.slice().sort((a,b)=>(a.sourceType==='job_board'?1:0)-(b.sourceType==='job_board'?1:0));
    return preferred.flatMap(job=>{
      if(!safeUrl(job.url))return [];const canonical=new URL(job.url);for(const k of [...canonical.searchParams.keys()])if(/^(utm_|pcm$|oga$|source$)/.test(k))canonical.searchParams.delete(k);const fingerprint=canonical.hostname+canonical.pathname+canonical.search;const identity=[job.company,job.title,job.location].map(v=>plain(v).toLowerCase()).join('|');if(seen.has(fingerprint)||(job.company!=='未公开'&&identities.has(identity)))return [];seen.add(fingerprint);if(job.company!=='未公开')identities.add(identity);
      const body=job.title+' '+job.description,full=body+' '+job.location+' '+job.industry;
      if(terms(p.exclude).some(v=>v==='销售'&&/数据分析|数据运营|销售分析师|分析工程师|\b(?:data|sales)\s+analyst\b|analytics\s+(?:engineer|analyst)/i.test(job.title)?false:hits(['销售','市场','设计','运营'].includes(v)?job.title:full,v)))return [];
      let rank=0;const notes=[];
      if(text(p.role).trim()){if(any(job.title,p.role))rank+=50;else if(any(body,p.role))rank+=12;else return [];}
      else if((profile.coreSkills||[]).some(s=>hits(body,s)))rank+=8;
      if(text(p.city).trim()){
        if(any(job.location,p.city))rank+=25;
        else if(/^(未公开|未注明)$/.test(job.location)){rank-=5;notes.push('搜索摘要未明确工作城市，申请前请核对原岗位。');}
        else if(/美国|加拿大|英国|united states|united kingdom|canada|\b(?:US|USA|UK)\b/i.test(job.location)&&!/china|apac|asia|worldwide|中国/i.test(job.location))return [];
        else if(/remote|hybrid|multiple|china|apac|asia|global|worldwide|远程|混合|多地|中国/i.test(job.location)) {rank+=2;notes.push('城市未精确匹配；远程/混合岗位仍需确认可工作的地区与签证要求。');}
        else return [];
      }
      if(p.workMode&&job.workMode!==p.workMode){if(/未注明|未公开/.test(job.workMode))notes.push('JD未注明工作方式，申请前需确认。');else{rank-=12;notes.push('工作方式与期望不同。');}}else if(p.workMode)rank+=10;
      if(p.industry&&any(full,p.industry))rank+=5;
      if(p.level&&any(job.title,p.level))rank+=7;
      for(const term of terms(p.mustHave)){if(hits(full,term))rank+=4;else{rank-=3;notes.push('必须条件“'+term+'”未在JD明确确认。');}}
      const required=job.description.match(/(\d+)\s*\+?\s*(?:years|年)/i);if(Number.isFinite(year)&&required&&Number(required[1])>year+2){rank-=10;notes.push('JD年限要求可能高于简历，应进一步核对。');}
      if(!job.description)notes.push('公开接口未提供JD，无法充分判断要求。');
      return [{...job,preRank:rank,screeningNotes:[...new Set(notes)]}];
    }).sort((a,b)=>b.preRank-a.preRank||a.id.localeCompare(b.id)).slice(0,limit);
  }
  const preferenceKeys=['role','city','industry','workMode','level','mustHave','exclude'];
  function preferences(input){const p={};for(const key of preferenceKeys){if(input?.[key]!=null&&typeof input[key]!=='string')throw Error('BAD_REQUEST');p[key]=text(input?.[key]).trim().slice(0,['mustHave','exclude'].includes(key)?500:80);}return p;}
  function filter(items,{minimum=0,order='desc',company='',city='',source='',sourceType=''}={}){return items.filter(j=>(Number.isFinite(j.matchScore)?j.matchScore>=minimum:minimum===0)&&(!company||j.company===company)&&(!city||j.location===city)&&(!source||j.source===source)&&(!sourceType||(sourceType==='company_career'?j.sourceType!=='job_board':j.sourceType===sourceType))).slice().sort((a,b)=>{const aa=Number.isFinite(a.matchScore)?a.matchScore:-1,bb=Number.isFinite(b.matchScore)?b.matchScore:-1;if(aa<0||bb<0)return bb-aa;return (order==='asc'?aa-bb:bb-aa)||a.id.localeCompare(b.id);});}
  root.JobCore={plain,safeUrl,mode,normalizeBoard,shortlist,preferences,filter};if(typeof module!=='undefined')module.exports=root.JobCore;
})(typeof window==='undefined'?globalThis:window);
