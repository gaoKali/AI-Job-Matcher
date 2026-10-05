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
const count=(text,term)=>compact(text).split(compact(term)).length-1;
const issueMessages={
 ORIGINAL:'未能唯一定位原文，未采用这项改写。',IDENTITY:'公司、职位或项目归属未能在对应原文中确认，已保留原文。',
 NUMBERS:'数字、日期或数量单位与该段原文不一致，已保留原文。',RESPONSIBILITY:'改写扩大了职责、行动或成果，已保留原文。',
 SKILL:'技能未在相应经历中找到依据，未写入正式稿。',EDUCATION:'学历或学校名称未在原文找到依据，已保留原文。',
 LANGUAGE:'改写语言与原简历不一致，已保留原文。',LENGTH:'改写过长或重复，已保留更精简的原文。',
 KEYWORDS:'关键词重复堆砌，已保留原文。',ADVICE:'补充建议混入正式改写，已保留原文。',OVERLAP:'原文片段重叠或跨越经历边界，未采用这项改写。'
};
const fieldMap={ORIGINAL:['original'],IDENTITY:['company','title','project'],NUMBERS:['time','numbers'],RESPONSIBILITY:['responsibility'],SKILL:['skill'],EDUCATION:['education'],LANGUAGE:['language'],LENGTH:['length'],KEYWORDS:['keywords'],ADVICE:['advice'],OVERLAP:['original','company','project']};
function readChecks(value){
 const sections=['matchedStrengths','optimizedExperiences','optimizedProjects','optimizedProfile','optimizedSkills','overall'];
 const issues=(Array.isArray(value?.issues)?value.issues:[]).slice(0,80).filter(v=>v&&Object.hasOwn(issueMessages,v.code)&&sections.includes(v.section)).map(v=>({code:v.code,section:v.section,index:Number.isInteger(v.index)&&v.index>=-1&&v.index<40?v.index:-1,fields:fieldMap[v.code],message:issueMessages[v.code]}));
 return {status:issues.length?'needs_confirmation':'checked',issues};
}
function indexed(text){let normalized='',positions=[];for(let i=0;i<text.length;i++){if(/\s/.test(text[i]))continue;const ch=text[i].toLowerCase();for(const c of ch){normalized+=c;positions.push(i);}}return {normalized,positions};}
function locate(text,index,quote){const query=compact(quote),hits=[];if(query.length<3)return hits;let offset=0;while(hits.length<40){const pos=index.normalized.indexOf(query,offset);if(pos<0)break;const start=index.positions[pos],end=index.positions[pos+query.length-1]+1;hits.push({start,end,original:text.slice(start,end)});offset=pos+1;}return hits;}
const rolePattern=/经理|主管|专员|分析师|工程师|助理|实习生|运营|设计师|开发|developer|engineer|analyst|manager|assistant|intern|lead|specialist|designer/i;
const workSection=/^(?:工作经历|工作经验|职业经历|任职经历|实习经历|work experience|professional experience|employment)\s*[:：]?$/i;
const projectSection=/^(?:项目经历|项目经验|projects?|project experience)\s*[:：]?$/i;
const educationSection=/^(?:教育背景|教育经历|学历|education)\s*[:：]?$/i;
const otherSection=/^(?:个人简介|个人总结|技能|核心技能|专业技能|证书|profile|summary|skills|certifications)\s*[:：]?$/i;
function sourceBlocks(resume){
 const boundaries=[{start:0,type:'unknown'}];let offset=0,type='unknown';
 for(const raw of resume.split('\n')){const line=raw.trim();let next=null;
  if(workSection.test(line))next='work';else if(projectSection.test(line))next='project';else if(educationSection.test(line))next='education';else if(otherSection.test(line))next='other';
  else if(/\b(?:19|20)\d{2}\b/.test(line)&&rolePattern.test(line)&&!/大学|学院|university|college|bachelor|master/i.test(line)&&line.length<180)next='work';
  else if(line.length<100&&(/^(?:公司|单位|雇主|company|employer)\s*[:：]/i.test(line)||(/公司|企业|集团|\b(?:inc|ltd|corp)\b/i.test(line)&&!/负责|使用|协助|参与|提升|managed|used|supported|created/i.test(line))))next='work';
  else if(line.length<100&&/(?:大学|学院|university|college)/i.test(line)&&!rolePattern.test(line))next='education';
  else if(line.length<140&&(/^[^。！？]{2,40}项目\s*[:：]/.test(line)||/^(?:项目名称|project name)\s*[:：]/i.test(line)||(type==='project'&&/项目|project/i.test(line)&&!/负责|使用|参与|整理|处理|developed|used/i.test(line))))next='project';
  if(next){type=next;boundaries.push({start:offset,type,line});}offset+=raw.length+1;
 }
 const unique=boundaries.filter((v,i)=>i===boundaries.length-1||v.start!==boundaries[i+1].start);
 return unique.map((v,i)=>({...v,end:unique[i+1]?.start??resume.length}));
}
// Numeric tokens include units, Chinese counts and date ranges; evidence is local.
function numbers(text){return (text.match(/\d+(?:[.,]\d+)*(?:\s*(?:[%％]|years?\b|people\b|users?\b|万元|亿元|元|人|名|份|个|次|年|月|天|万|亿))?|[零〇一二三四五六七八九十百千万两]+(?:[%％]|人|名|份|个|次|年|万|亿)/gi)||[]).map(compact);}
const tools=['SQL','Excel','Python','Tableau','Power BI','PowerBI','Java','JavaScript','TypeScript','React','Vue','C++','C#','R语言','Spark','Hadoop','MySQL','PostgreSQL','TensorFlow','PyTorch','Docker','Kubernetes','Figma','Photoshop','AI','机器学习','深度学习','数据可视化','自动化','A/B','DAU','GMV','MAU','CRM','SAP','SPSS','SAS','Stata','MATLAB','ClickHouse','Redis','MongoDB','Rust','Swift','数据挖掘','用户画像','用户增长','机器学习算法'];
function containsTerm(text,term){if(/^[a-z][a-z0-9+.# /-]*$/i.test(term)){const safe=term.replace(/[.*+?^$()|[\]\\]/g,'\\$&');return new RegExp('(?<![A-Za-z0-9])'+safe+'(?![A-Za-z0-9])','i').test(text);}return compact(text).includes(compact(term));}
// Mentions of absent or planned skills are not evidence of possession.
function evidencedTerm(text,term){return text.split(/[。；;\n]/).some(part=>containsTerm(part,term)&&!/(?:没有|不具备|不会|未掌握|未使用|尚未|从未|计划学习|准备学习|待学习|希望学习|not\s+(?:know|used|have|proficient)|never\s+(?:used|learned)|no\s+(?:experience|knowledge)|plan(?:ning)?\s+to\s+learn)/i.test(part));}
const newActions=['管理','领导','创建','设计','开发','实施','策划','监控','维护','搭建','自动化','上线','用户分层','用户生命周期','增长实验','跨部门','运营团队','对接','管理团队','带领','主导','精通','熟练掌握','全面负责','统筹','独立负责','提升','降低','增长','促进','推动','实现','贡献','确保','支撑','赋能','闭环','抓手','深度参与'];
const strongerEnglish=['led','owned','managed','directed','spearheaded','drove','improved','increased','reduced','achieved','delivered','boosted','expert'];
function chinese(text){return (text.match(/[\u3400-\u9fff]/g)||[]).length;}
function wrongLanguage(value,source){const chars=chinese(source),latin=(source.match(/[A-Za-z]/g)||[]).length;return (chars>=8&&chars>latin/2&&chinese(value)<Math.min(6,chars/3))||(chars<5&&latin>20&&chinese(value)>=8);}
function missingFacts(value,original,scope,allNames,options={}){
 const codes=[];const localNumbers=new Set(numbers(original));
 if(numbers(value).some(n=>!localNumbers.has(n)))codes.push('NUMBERS');
 const metrics=['收入','营收','成本','利润','转化率','留存率','DAU','MAU','GMV','参与人数','管理人数','ROI','增长率'];
 for(const metric of metrics){
  if(containsTerm(value,metric)&&!containsTerm(original,metric)){codes.push('RESPONSIBILITY');continue;}
  const pattern=new RegExp(metric+'[^。；;\\n\\d]{0,8}(\\d+(?:[.,]\\d+)*(?:\\s*(?:[%％]|万元|元|人|份|个|万|亿))?)','gi');
  const pairs=t=>[...t.matchAll(pattern)].map(m=>compact(m[1]));
  const before=pairs(original);if(pairs(value).some(n=>!before.includes(n)))codes.push('NUMBERS');
 }

 if(/建议补充|如果.*(?:具备|有真实)|待确认|待补充|suggest(?:ed)?|if you have/i.test(value)&&!/建议补充|待确认|suggest/i.test(original))codes.push('ADVICE');
 const levels=['总监','经理','主管','首席','高级','资深','director','senior','principal','head of','chief'];
 if(levels.some(t=>containsTerm(value,t)&&!containsTerm(scope,t)))codes.push('IDENTITY');
 const knownOrg=/[\u3400-\u9fffA-Za-z0-9]{2,30}(?:公司|集团|企业|大学|学院)|\b(?:bachelor|master|phd|mba)\b|博士|硕士|本科/gi;
 const orgs=value.match(knownOrg)||[];
 if(orgs.some(n=>!compact(scope).includes(compact(n))))codes.push('EDUCATION');
 if(allNames.some(n=>containsTerm(value,n)&&!containsTerm(scope,n)))codes.push('IDENTITY');
 if(tools.concat(options.unsupportedSkills||[]).some(t=>containsTerm(value,t)&&!evidencedTerm(scope,t)))codes.push('SKILL');
 if(newActions.some(t=>containsTerm(value,t)&&!containsTerm(original,t))||strongerEnglish.some(t=>containsTerm(value,t)&&!containsTerm(original,t)))codes.push('RESPONSIBILITY');
 // Don't upgrade assistance/participation to ownership even when tools/values match.
 if(/协助|辅助|参与|配合|supported|assisted|participated/i.test(original)&&/负责|领导|主导|独立|led|owned|managed/i.test(value)&&!/负责|领导|主导|独立|led|owned|managed/i.test(original))codes.push('RESPONSIBILITY');
 if(!options.explanatory&&wrongLanguage(value,original))codes.push('LANGUAGE');
 if(!options.profile&&value.length>Math.max(original.length+12,Math.ceil(original.length*1.2)))codes.push('LENGTH');
 return [...new Set(codes)];
}
function safeguard(result,resume){
 const source=compact(resume),map=indexed(resume),blocks=sourceBlocks(resume),issues=[],placements=[];
 const note=(code,section,index=-1)=>{if(issues.length<70&&!issues.some(v=>v.code===code&&v.section===section&&v.index===index))issues.push({code,section,index});};
 const allNames=[...new Set(result.optimizedExperiences.flatMap(v=>[v.company,v.title]).concat(result.optimizedProjects.map(v=>v.name)))].filter(v=>v!==fallback&&compact(v).length>=2&&source.includes(compact(v)));
 const supportedSkill=s=>evidencedTerm(resume,s)||(s==='报表制作'&&/制作.{0,6}报表|报表.{0,6}制作/.test(resume));
 const unsupportedSkills=result.optimizedSkills.filter(s=>!supportedSkill(s));
 result.optimizedSkills=[...new Set(result.optimizedSkills)].filter((s,i)=>{if(!supportedSkill(s)||/精通|专家|expert|advanced/i.test(s)&&!containsTerm(resume,s)){note('SKILL','optimizedSkills',i);return false;}return true;});
 // Even explanatory strengths cannot turn assistance into ownership.
 result.matchedStrengths=result.matchedStrengths.map((value,i)=>{
  const codes=missingFacts(value,resume,resume,allNames,{profile:true,explanatory:true,unsupportedSkills});
  if(codes.length){for(const code of codes)note(code,'matchedStrengths',i);return '该项优势表述建议确认真实性，请对照原简历核实。';}return value;
 });
 const process=(items,section,keys,type)=>{
  const accepted=[];
  for(const item of items){const nextIndex=accepted.length;let matches=locate(resume,map,item.original);
   const candidates=matches.map(span=>{const block=[...blocks].reverse().find(b=>b.start<=span.start);return {...span,block,scope:resume.slice(block?.start??span.start,block?.end??span.end)};});
   const localMatches=candidates.filter(span=>keys.every(k=>item[k]!==fallback&&containsTerm(span.scope,item[k]))&&(span.block.type===type||span.block.type==='unknown'));
   let span=localMatches.length===1?localMatches[0]:candidates.length===1?candidates[0]:null;
   if(!span){note('ORIGINAL',section);continue;}
   if(span.end>span.block.end||placements.some(p=>p.start<span.end&&span.start<p.end)){note('OVERLAP',section);continue;}
   // Always show the actual source substring, not the model's whitespace or case variant.
   item.original=span.original;
   const identity=keys.every(k=>item[k]!==fallback&&containsTerm(span.scope,item[k]));
   if(!identity||!(span.block.type===type||span.block.type==='unknown')){
    note('IDENTITY',section,nextIndex);item.optimized=item.original;item.reason='建议确认真实性：归属未能确认，已保留原文。';
    for(const key of keys)if(!containsTerm(span.scope,item[key]))item[key]=fallback;
   }else{
    // Restore unchanged identifying heading when the model returned only bullets.
    const heading=item.original.split('\n')[0];
    if(item.original.includes('\n')&&(keys.some(k=>containsTerm(heading,item[k]))||/\d{4}/.test(heading))&&!compact(item.optimized).includes(compact(heading)))item.optimized=heading+'\n'+item.optimized;
    const codes=missingFacts(item.optimized,item.original,span.scope,allNames,{unsupportedSkills});
    // All existing numeric facts must stay attached to the same source block.
    if(numbers(item.original).some(n=>!new Set(numbers(item.optimized)).has(n)))codes.push('NUMBERS');
    for(const key of keys)if(containsTerm(item.original,item[key])&&!containsTerm(item.optimized,item[key]))codes.push('IDENTITY');
    const keywords=[...result.importantKeywords,...result.optimizedSkills].filter(t=>t.length>=2);
    if(keywords.some(t=>count(item.optimized,t)>Math.max(2,count(item.original,t))))codes.push('KEYWORDS');
    if(codes.length){for(const c of new Set(codes))note(c,section,nextIndex);item.optimized=item.original;item.reason='建议确认真实性：'+issueMessages[codes[0]];}
   }
   accepted.push(item);placements.push({...span,item,section,index:nextIndex});
  }
  return accepted;
 };
 result.optimizedExperiences=process(result.optimizedExperiences,'optimizedExperiences',['company','title'],'work');
 result.optimizedProjects=process(result.optimizedProjects,'optimizedProjects',['name'],'project');
 // Summaries never borrow facts from the JD or claim responsibility upgrades.
 if(result.optimizedProfile!==fallback){
  const profileCodes=missingFacts(result.optimizedProfile,resume,resume,allNames,{profile:true,unsupportedSkills});
  if(result.optimizedProfile.length>Math.max(30,Math.floor(resume.length*.15)))profileCodes.push('LENGTH');
  if(profileCodes.length){for(const c of new Set(profileCodes))note(c,'optimizedProfile');result.optimizedProfile=fallback;}
 }
 const assemble=()=>{
  let full=resume;
  for(const p of [...placements].sort((a,b)=>b.start-a.start))full=full.slice(0,p.start)+p.item.optimized+full.slice(p.end);
  const language=chinese(resume)>=8?'zh':'en',headers=[];
  // Avoid repeating skills already present in the original. Profile only if concise,
  // distinct and within the global budget; never append a second education section.
  if(result.optimizedProfile!==fallback&&!compact(full).includes(compact(result.optimizedProfile)))headers.push((language==='zh'?'个人简介':'Profile')+'\n'+result.optimizedProfile);
  return [...headers,full].join('\n\n');
 };
 const cap=Math.ceil(resume.length*1.2);let full=assemble();
 if(full.length>cap&&result.optimizedProfile!==fallback){note('LENGTH','optimizedProfile');result.optimizedProfile=fallback;full=assemble();}
 for(const p of [...placements].sort((a,b)=>(b.item.optimized.length-b.item.original.length)-(a.item.optimized.length-a.item.original.length))){if(full.length<=cap)break;if(p.item.optimized!==p.item.original){note('LENGTH',p.section,p.index);p.item.optimized=p.item.original;p.item.reason='改写过长，已保留原文。';full=assemble();}}
 result.fullOptimizedResume=full;
 result.factChecks=readChecks({issues});
 if(issues.length){result.missingEvidence=[...new Set([...result.missingEvidence,'部分改写未通过基础事实核对，建议确认真实性；未确认内容没有写入正式稿。'])];}
 const changed=placements.filter(p=>p.item.original!==p.item.optimized);
 result.optimizationSummary=[changed.length?'整理了 '+changed.length+' 段有原文依据的经历表达，保留原公司、职位、时间和数字。':'对照 JD 核对现有证据，未确认的改写保留原文。','完整稿与上面的经历改写使用同一份内容，不采用模型另写的全文。',...(issues.length?['未确认的事实单列提醒，补充建议不写入正式稿。']:[])];
 return validate(result);
}
root.OptimizationContract={focuses,schema,input,clean,normalize,validate,safeguard,fallback,readChecks,sourceBlocks};
if(typeof module!=='undefined')module.exports=root.OptimizationContract;
})(typeof window==='undefined'?globalThis:window);
