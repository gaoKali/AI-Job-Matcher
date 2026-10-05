(function(root){
'use strict';
const fallback='简历中未提供足够信息';
const focuses=['提升 JD 匹配度','优化工作经历表达','突出核心技能','强化项目经历','优化个人总结','增强 ATS 关键词','精简冗余内容'];
const strings=['jdSummary','optimizedProfile','fullOptimizedResume'];
const lists=['matchedStrengths','gaps','importantKeywords','optimizationSummary','optimizedSkills','missingEvidence','suggestedQuestions'];
const experienceKeys=['company','title','original','optimized','reason'];
const projectKeys=['name','original','optimized','reason'];
const objectSchema=keys=>({type:'object',additionalProperties:false,required:keys,properties:Object.fromEntries(keys.map(k=>[k,{type:'string'}]))});
const properties=Object.fromEntries([...strings.map(k=>[k,{type:'string'}]),...lists.map(k=>[k,{type:'array',items:{type:'string'}}]),['matchScore',{type:'number',minimum:0,maximum:100}],['optimizedExperiences',{type:'array',items:objectSchema(experienceKeys)}],['optimizedProjects',{type:'array',items:objectSchema(projectKeys)}]]);
const schema={type:'object',additionalProperties:false,required:Object.keys(properties),properties};
function fail(code,message){return Object.assign(new Error(message),{code});}
function clean(value,max,label,required=true){
 if(typeof value!=='string')throw fail('BAD_REQUEST',label+'格式不正确。');
 const text=value.replace(/<[^>]*>/g,' ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();
 if(required&&!text)throw fail('EMPTY_INPUT','请先填写'+label+'。');
 if(text.length>max)throw fail('INPUT_TOO_LONG',label+'最多 '+max.toLocaleString('zh-CN')+' 个字符，请精简后重试。');
 return text;
}
function input(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw fail('BAD_REQUEST','请求格式不正确。');
 const a=root.AnalysisContract;
 const resumeText=a.redact(a.clean(body.resumeText));
 const targetRole=clean(body.targetRole,80,'目标岗位');
 const jd=clean(body.jd,12000,'岗位 JD');
 const extraRequirements=clean(body.extraRequirements||'',1000,'额外要求',false);
 if(body.analysis?.isMock)throw fail('BAD_REQUEST','请先完成真实简历分析。');
 const analysis=a.validate(a.normalizeAnalysisResult(body.analysis));
 if(!body.analysis||JSON.stringify(analysis).length>16000)throw fail('BAD_REQUEST','请先完成真实简历分析。');
 return {resumeText,analysis,targetRole,jd,focuses:Array.isArray(body.focuses)?[...new Set(body.focuses.filter(v=>focuses.includes(v)))]:[],extraRequirements};
}
const text=value=>typeof value==='string'&&value.trim()?value.trim():fallback;
const array=value=>(Array.isArray(value)?value:typeof value==='string'?[value]:[]).filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim());
function normalize(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw fail('INVALID_SCHEMA','简历优化结果格式异常。');
 const result=Object.fromEntries([...strings.map(k=>[k,text(value[k])]),...lists.map(k=>[k,array(value[k])])]);
 result.matchScore=typeof value.matchScore==='string'&&/^\d+(?:\.\d+)?%?$/.test(value.matchScore)?Number(value.matchScore.replace('%','')):value.matchScore;
 for(const [name,keys]of [['optimizedExperiences',experienceKeys],['optimizedProjects',projectKeys]]){
  result[name]=value[name]==null?[]:value[name];
  if(!Array.isArray(result[name]))throw fail('INVALID_SCHEMA','简历优化结果格式异常。');
  result[name]=result[name].map(item=>{if(!item||typeof item!=='object'||Array.isArray(item))throw fail('INVALID_SCHEMA','简历优化结果格式异常。');return Object.fromEntries(keys.map(k=>[k,text(item[k])]));});
 }
 return result;
}
function validate(value){
 if(!value||Object.keys(properties).some(k=>!Object.hasOwn(value,k)))throw fail('INVALID_SCHEMA','简历优化结果字段不完整。');
 if(!Number.isFinite(value.matchScore)||value.matchScore<0||value.matchScore>100)throw fail('INVALID_SCHEMA','简历优化匹配分格式异常。');
 for(const k of strings)if(typeof value[k]!=='string'||value[k].length>26000)throw fail('INVALID_SCHEMA','简历优化文本格式异常。');
 for(const k of lists)if(!Array.isArray(value[k])||value[k].length>40||value[k].some(s=>typeof s!=='string'||s.length>2000))throw fail('INVALID_SCHEMA','简历优化列表格式异常。');
 for(const [name,keys]of [['optimizedExperiences',experienceKeys],['optimizedProjects',projectKeys]])if(!Array.isArray(value[name])||value[name].length>30||value[name].some(v=>keys.some(k=>typeof v[k]!=='string'||v[k].length>14000)))throw fail('INVALID_SCHEMA','简历优化经历格式异常。');
 if(value.fullOptimizedResume===fallback)throw fail('INVALID_SCHEMA','未返回完整优化简历。');
 return value;
}
const compact=v=>String(v).toLowerCase().replace(/\s+/g,'');
const numbers=v=>v.match(/\d+(?:[.,]\d+)*(?:\s*[%％])?/g)||[];
const technicalTerms=v=>v.match(/(?<![A-Za-z])[A-Za-z][A-Za-z0-9+#.]{1,30}(?:[ -][A-Za-z][A-Za-z0-9+#.]{1,20})?(?![A-Za-z])/g)||[];
function safeguard(result,resume){
 const source=compact(resume);const warnings=[];
 const sourceNumbers=new Set(numbers(resume).map(compact));
 const supportedSkill=s=>source.includes(compact(s))||(s==='报表制作'&&/制作.{0,6}报表|报表.{0,6}制作/.test(resume));
 const unsupportedSkills=result.optimizedSkills.filter(s=>!supportedSkill(s));
 result.optimizedSkills=result.optimizedSkills.filter(s=>supportedSkill(s));
 const unknownTerms=[...new Set([...unsupportedSkills,...technicalTerms([result.optimizedProfile,...result.optimizedExperiences.map(v=>v.optimized),...result.optimizedProjects.map(v=>v.optimized)].join('\n'))])].filter(s=>!source.includes(compact(s))&&!/^(profile|skills|professional|experience|project|education)$/i.test(s));
 const unconfirmedActions=['对接运营团队','运营团队','跨部门协作','用户分层','用户生命周期','增长实验','A/B','留存率','转化率','DAU','MAU','主导','带领团队','精通','熟练掌握'];
 const unsafe=v=>numbers(v).some(n=>!sourceNumbers.has(compact(n)))||unknownTerms.some(s=>compact(v).includes(compact(s)))||unconfirmedActions.some(s=>compact(v).includes(compact(s))&&!source.includes(compact(s)));
 for(const s of unsupportedSkills)warnings.push('“'+s+'”未找到原简历直接证据，已从真实技能中移除；仅在确实具备时补充。');
 const filter=(items,keys)=>items.filter(item=>{
  if(!source.includes(compact(item.original))||keys.some(k=>item[k]!==fallback&&!source.includes(compact(item[k])))){warnings.push('一项经历未能对应原文，未纳入优化稿；请核对原简历。');return false;}
  // Models sometimes return only rewritten bullets, omitting the original heading.
  // Restore that exact original heading before checking preservation.
  const heading=item.original.split('\n')[0];
  if(item.original.includes('\n')&&(/\d{4}/.test(heading)||keys.some(k=>item[k]!==fallback&&compact(heading).includes(compact(item[k]))))&&((numbers(heading).some(n=>!compact(item.optimized).includes(compact(n))))||keys.some(k=>item[k]!==fallback&&compact(heading).includes(compact(item[k]))&&!compact(item.optimized).includes(compact(item[k])))))item.optimized=heading+'\n'+item.optimized;
  if(unsafe(item.optimized)||numbers(item.original).some(n=>!compact(item.optimized).includes(compact(n)))||keys.some(k=>item[k]!==fallback&&compact(item.original).includes(compact(item[k]))&&!compact(item.optimized).includes(compact(item[k])))){item.optimized=item.original;item.reason='改写含未确认的事实或遗漏了原有信息，已保留原文。';warnings.push(item.reason);}
  return true;
 });
 result.optimizedExperiences=filter(result.optimizedExperiences,['company','title']);
 result.optimizedProjects=filter(result.optimizedProjects,['name']);
 if(unsafe(result.optimizedProfile)){result.optimizedProfile=fallback;warnings.push('个人简介包含未确认的数字或技术词，未加入优化稿。');}
 // Reconstruct from the source, applying only anchored rewrites. All original
 // employers, dates, education and untouched facts remain; no model-invented full text.
 let full=resume;
 for(const item of [...result.optimizedExperiences,...result.optimizedProjects]){
  if(full.includes(item.original))full=full.replace(item.original,item.optimized);
 }
 const header=[];
 if(result.optimizedProfile!==fallback)header.push('个人简介\n'+result.optimizedProfile);
 if(result.optimizedSkills.length)header.push('核心技能\n'+result.optimizedSkills.join('、'));
 result.fullOptimizedResume=[...header,full].join('\n\n');
 result.missingEvidence=[...new Set([...result.missingEvidence,...warnings])];
 if(warnings.length)result.optimizationSummary=['基于 JD 梳理现有证据与信息缺口。','已执行原文核对：未确认的数字、技术词或经历保留原文或单列补充问题。',...(result.optimizedExperiences.some(v=>v.optimized!==v.original)?['重述已核对的工作经历，保持真实公司、职位及时间。']:['工作经历中未确认的扩写已撤回，保留原文。']),...(result.optimizedProjects.some(v=>v.optimized!==v.original)?['重述原简历中已有的项目经历。']:[])];
 return validate(result);
}
root.OptimizationContract={focuses,schema,input,clean,normalize,validate,safeguard,fallback};
if(typeof module!=='undefined')module.exports=root.OptimizationContract;
})(typeof window==='undefined'?globalThis:window);
