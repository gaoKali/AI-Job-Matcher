
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const core=require('../js/job-core.js');const sources=require('../js/job-sources.js');const contract=require('../js/analysis-contract.js');const {analysis}=require('./analysis-sample.cjs');
const env={AI_API_KEY:'unit-test-only',AI_BASE_URL:'https://unit-test.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',ALLOWED_ORIGINS:'http://127.0.0.1:4173'};
const board=(source,title='Data Analyst',location='Shanghai')=>source.source==='Lever'?[{id:'job1',text:title,categories:{location},descriptionPlain:'SQL analytics 3 years experience. Collaborate with sales.',hostedUrl:'https://jobs.lever.co/'+source.board+'/job1'}]:{jobs:[{id:'job1',title,location:source.source==='Greenhouse'?{name:location}:location,content:'&lt;p&gt;SQL analytics 3 years experience&lt;/p&gt;',descriptionPlain:'SQL analytics 3 years experience',absolute_url:'https://job-boards.greenhouse.io/'+source.board+'/jobs/job1',jobUrl:'https://jobs.ashbyhq.com/'+source.board+'/job1',publishedAt:'2026-10-01T00:00:00Z',updated_at:'2026-10-03T00:00:00Z',workplaceType:'Hybrid'}]};
const job=()=>core.normalizeBoard(sources[0],board(sources[0]))[0];
const match=j=>({id:j.id,matchScore:85,matchReasons:['已有SQL经验'],gaps:['行业信息待确认'],recommendation:'建议核实JD后申请',resumeTips:['突出真实SQL项目']});
const request=(body,path='/api/jobs/match',method='POST')=>new Request('https://worker.invalid'+path,{method,headers:{Origin:'http://127.0.0.1:4173','Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});

test('10家独立公开源使用官方URL；三平台统一字段、真实链接、HTML纯文本和未知日期',()=>{
 assert.equal(sources.length,10);assert.deepEqual(new Set(sources.map(s=>s.source)),new Set(['Greenhouse','Lever','Ashby']));
 for(const source of [sources[0],sources[4],sources[6]]){const jobs=core.normalizeBoard(source,board(source));assert.equal(jobs.length,1);for(const key of ['id','company','title','location','description','url','source','publishedAt'])assert.ok(Object.hasOwn(jobs[0],key));assert.match(jobs[0].description,/SQL/);assert.doesNotMatch(jobs[0].description,/<p>|&lt;/);assert.match(jobs[0].url,/^https:/);if(source.source==='Greenhouse'){assert.equal(jobs[0].publishedAt,null);assert.equal(jobs[0].updatedAt,'2026-10-03T00:00:00Z');}}
 assert.equal(core.safeUrl('javascript:alert(1)'),null);assert.equal(core.safeUrl('https://user:pass@example.com'),null);
 const raw=board(sources[6]);raw.jobs[0].isListed=false;assert.equal(core.normalizeBoard(sources[6],raw).length,0);
});

test('城市/中英岗位筛选保留远程混合与China/APAC，排除销售岗位但保留Sales Analyst和协作销售的分析师',()=>{
 const base=job();const jobs=[base,{...base,id:'onsite',url:base.url+'?id=2',location:'New York',workMode:'现场办公'},{...base,id:'remote',url:base.url+'?id=3',location:'Remote US',workMode:'远程办公'},{...base,id:'sales',url:base.url+'?id=4',title:'Sales Analyst'},{...base,id:'wrong',url:base.url+'?id=5',title:'Frontend Engineer',description:'React'},{...base,id:'hybrid',url:base.url+'?id=6',location:'APAC Multiple locations',workMode:'混合办公'}];
 const result=core.shortlist(jobs,{role:'数据分析师',city:'上海',exclude:'不考虑销售'},analysis,10);assert.deepEqual(result.map(j=>j.id),[base.id,'hybrid','remote','sales']);assert.ok(result[1].screeningNotes.some(s=>s.includes('签证')));
 assert.equal(core.shortlist(jobs,{role:'不存在的岗位'},analysis).length,0);
});

test('去重、最多10个、未注明条件不编造、最低分/来源/公司/地区/排序',()=>{
 const base=job();const candidates=Array.from({length:20},(_,i)=>({...base,id:'id'+i,url:base.url+'?id='+i}));assert.equal(core.shortlist([...candidates,candidates[0]],{},analysis,10).length,10);
 const results=[{...base,matchScore:50},{...base,id:'b',company:'Other',matchScore:90},{...base,id:'c',matchScore:null}];assert.deepEqual(core.filter(results).map(j=>j.matchScore),[90,50,null]);assert.deepEqual(core.filter(results,{order:'asc'}).map(j=>j.matchScore),[50,90,null]);assert.equal(core.filter(results,{minimum:60,company:'Other',source:'Greenhouse',city:'Shanghai'}).length,1);assert.equal(core.filter(results,{minimum:5}).length,2);assert.equal(results[0].matchScore,50);
 assert.ok(core.shortlist([{...base,description:''}],{mustHave:'双休'},analysis)[0].screeningNotes.some(n=>n.includes('未在JD')));
});

test('岗位公开代理只GET白名单，不向招聘网站发送简历、Key或浏览器请求头',async()=>{
 const {handleJobs}=await import('../ai/jobs-handler.mjs');let calls=0;
 const response=await handleJobs(request(undefined,'/api/jobs/boards/cloudflare','GET'),env,{},async(url,opts)=>{calls++;assert.equal(url,sources[0].apiUrl);assert.equal(opts.method,'GET');assert.deepEqual(opts.headers,{Accept:'application/json'});assert.equal(opts.body,undefined);return new Response(JSON.stringify(board(sources[0])));});assert.equal(response.status,200);assert.equal(calls,1);assert.equal(response.headers.get('Access-Control-Allow-Origin'),'http://127.0.0.1:4173');
 assert.equal((await handleJobs(request(undefined,'/api/jobs/boards/https://evil.invalid','GET'),env,{},()=>{throw Error('no call');})).status,404);
 assert.equal((await handleJobs(request(undefined,'/api/jobs/boards/cloudflare','GET'),env,{},()=>{throw Error('private');})).status,502);
 assert.equal((await handleJobs(request(undefined,'/api/jobs/match','OPTIONS'),env)).status,204);
});

test('批量AI一次调用，复用Qwen严格JSON、非思考与服务端Key，校验限制及输入脱敏',async()=>{
 const {matchingInput,matchJobs,validateMatches}=await import('../ai/job-matching.mjs');const input=matchingInput({profile:{...analysis,candidateProfile:'数据分析师 邮箱 test@example.com'},preferences:{role:'数据分析师'},jobs:[job()]});assert.doesNotMatch(JSON.stringify(input.profile),/test@example/);
 let calls=0;const result=await matchJobs(input,env,async(url,opts)=>{calls++;assert.match(url,/compatible-mode\/v1\/chat\/completions$/);const body=JSON.parse(opts.body);assert.equal(body.model,'qwen3.8-flash');assert.equal(body.enable_thinking,false);assert.equal(body.response_format.type,'json_schema');assert.equal(body.response_format.json_schema.strict,true);assert.equal(body.response_format.json_schema.schema.properties.matches.items.additionalProperties,false);assert.equal(JSON.parse(body.messages[1].content).jobs.length,1);assert.match(body.messages[0].content,/不编造/);return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({matches:[match(job())]})}}]}));});assert.equal(calls,1);assert.equal(result.matches[0].matchScore,85);
 for(const invalid of [{...match(job()),id:'invented'},{...match(job()),matchScore:101}])assert.throws(()=>validateMatches({matches:[invalid]},[job()]),{code:'INVALID_SCHEMA'});
 assert.throws(()=>matchingInput({profile:analysis,jobs:Array(16).fill(job())}),{code:'BAD_REQUEST'});
 assert.throws(()=>matchingInput({profile:analysis,jobs:[{...job(),url:'https://evil.invalid'}]}),{code:'BAD_REQUEST'});
});

function browser(fetcher){const root={JobMatcherProviders:{},JobCore:core,AnalysisContract:contract,JobSources:sources.slice(0,3),AnalysisConfig:{endpoint:'https://worker.invalid/api/resume/analyze'}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/jobs-provider.js'),'utf8'),{window:root,fetch:fetcher,AbortController,setTimeout,clearTimeout,TextDecoder,console:{warn(){}}});return root;}

test('某源失败继续其他源；真实评分或AI失败保留未评分岗位，不用模拟职位',async()=>{
 let modelCalls=0;const root=browser(async(url,opts)=>{if(url.endsWith('/boards/stripe'))return new Response('{}',{status:503});if(url.includes('/boards/'))return new Response(JSON.stringify(board(sources.find(s=>url.endsWith('/'+s.key)))));modelCalls++;const input=JSON.parse(opts.body);return new Response(JSON.stringify({mode:'live',matches:input.jobs.map(match)}));});
 const result=await root.JobMatcherProviders.jobProvider.search({role:'数据分析师',city:'上海'},analysis);assert.equal(result.jobs.length,2);assert.equal(result.warnings.length,1);assert.equal(modelCalls,1);assert.equal(result.jobs[0].matchScore,85);assert.equal(result.jobs[0].isMock,false);
 const failed=browser(async(url)=>url.includes('/boards/')?new Response(JSON.stringify(board(sources.find(s=>url.endsWith('/'+s.key))))):new Response(JSON.stringify({error:{code:'INVALID_JSON'}}),{status:502}));const fallback=await failed.JobMatcherProviders.jobProvider.search({},analysis);assert.equal(fallback.jobs.length,3);assert.equal(fallback.jobs[0].matchScore,null);assert.ok(fallback.warnings.some(w=>w.includes('INVALID_JSON')));
});

test('空结果零AI调用，公开源短缓存只存岗位，取消不发模型或显示迟到结果',async()=>{
 let calls=0;const root=browser(async(url)=>{calls++;assert.ok(url.includes('/boards/'));return new Response(JSON.stringify(board(sources.find(s=>url.endsWith('/'+s.key)))));});for(let i=0;i<2;i++)assert.equal((await root.JobMatcherProviders.jobProvider.search({role:'不存在的岗位'},analysis)).jobs.length,0);assert.equal(calls,3);
 const controller=new AbortController();controller.abort();await assert.rejects(root.JobMatcherProviders.jobProvider.search({},analysis,{signal:controller.signal}),{code:'CANCELLED'});
});


test('公开代理使用Worker支持的manual重定向并保留流式压缩头',async()=>{
 const {handleJobs}=await import('../ai/jobs-handler.mjs');const response=await handleJobs(request(undefined,'/api/jobs/boards/cloudflare','GET'),env,{},async(_url,opts)=>{assert.equal(opts.redirect,'manual');return new Response('compressed-bytes',{headers:{'Content-Encoding':'gzip'}});});assert.equal(response.headers.get('Content-Encoding'),'gzip');
 const redirect=await handleJobs(request(undefined,'/api/jobs/boards/cloudflare','GET'),env,{},async()=>new Response(null,{status:301,headers:{Location:'https://evil.invalid'}}));assert.equal(redirect.status,502);
});


test('真实输入和JD只发一份批量请求；长JD明确截断，提示词禁止推断签证和不存在的技能',async()=>{
 const {MATCH_PROMPT,matchingInput}=await import('../ai/job-matching.mjs');const input=matchingInput({profile:analysis,jobs:[{...job(),description:'x'.repeat(8000)}]});assert.equal(input.jobs[0].description.length,1800);assert.equal(input.jobs[0].descriptionTruncated,true);assert.match(MATCH_PROMPT,/不得依据中文简历/);assert.match(MATCH_PROMPT,/仅当确有真实使用经历/);
});
