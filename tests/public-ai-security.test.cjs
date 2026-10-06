const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {fixture,MemoryStorage}=require('./security-fixture.cjs'),sample=require('./analysis-sample.cjs');
const req=(f,path='/api/resume/analyze',body={resumeText:sample.resumeText},headers={})=>new Request('https://worker.invalid'+path,{method:'POST',headers:{...f.headers,...headers},body:JSON.stringify(body)});
const model=result=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]});
const optBody=()=>({resumeText:sample.resumeText,analysis:sample.analysis,targetRole:'数据分析师',jd:'使用 SQL、Excel 制作业务报表。',focuses:[],extraRequirements:''});
const optResult=()=>({jdSummary:'业务报表',matchScore:80,matchedStrengths:['SQL'],gaps:[],importantKeywords:['SQL'],optimizationSummary:['整理表达'],optimizedProfile:'使用 SQL',optimizedSkills:['SQL'],optimizedExperiences:[],optimizedProjects:[],missingEvidence:[],suggestedQuestions:[],fullOptimizedResume:sample.resumeText});
async function blocked(f,expected,headers={}){const {handleAnalysis}=await import('../ai/handler.mjs');let calls=0;const response=await handleAnalysis(req(f,undefined,undefined,headers),f.env,async()=>{calls++;return model(sample.analysis);});assert.equal((await response.json()).error.code,expected);assert.equal(calls,0);return response;}

test('真人会话统一保护分析+优化，正常流程两次成功，第三次429且不调用模型',async()=>{
 const f=await fixture();const {handleAnalysis}=await import('../ai/handler.mjs'),{handleOptimization}=await import('../ai/optimization-handler.mjs');let calls=0;
 assert.equal((await handleAnalysis(req(f),f.env,async()=>{calls++;return model(sample.analysis);})).status,200);
 assert.equal((await handleOptimization(req(f,'/api/resume/optimize',optBody()),f.env,async()=>{calls++;return model(optResult());})).status,200);
 assert.equal((await blocked(f,'TOO_MANY_REQUESTS')).status,429);assert.equal(calls,2);assert.equal(await f.storage.get('global'),2);
});
test('缺少验证/伪造验证/盗用不同IP会话均403，没有模型调用或计数',async()=>{
 const f=await fixture();for(const [headers,code]of [[{'X-AI-Session':''},'TURNSTILE_REQUIRED'],[{'X-AI-Session':f.issued.session+'x'},'TURNSTILE_FAILED'],[{'CF-Connecting-IP':'192.0.2.2'},'TURNSTILE_FAILED']])assert.equal((await blocked(f,code,headers)).status,403);
 assert.equal(f.storage.data.size,0);
});
test('验证过期不调用模型；Origin、客户端自报IP不能绕过服务端',async()=>{
 const f=await fixture(),{issueSession}=await import('../ai/public-ai-guard.mjs');const expired=await issueSession(req(f),f.env,Date.now()-1800001);
 await blocked(f,'TURNSTILE_FAILED',{'X-AI-Session':expired.session});assert.equal((await blocked(f,'ACCESS_DENIED',{Origin:'https://evil.invalid'})).status,403);
 const {handleAnalysis}=await import('../ai/handler.mjs');let calls=0;assert.equal((await handleAnalysis(req(f,undefined,{resumeText:sample.resumeText,ip:'other'}),f.env,()=>calls++)).status,400);assert.equal(calls,0);
});
test('单IP每日10次达到上限后不调用，改用另一匿名IP仍可使用',async()=>{
 const f=await fixture(),{handleAnalysis}=await import('../ai/handler.mjs'),{issueSession}=await import('../ai/public-ai-guard.mjs');
 await handleAnalysis(req(f),f.env,async()=>model(sample.analysis));const k=[...f.storage.data.keys()].find(k=>k.startsWith('ip:'));await f.storage.put(k,{count:10,times:[]});await blocked(f,'DAILY_USER_LIMIT_REACHED');
 const other=req(f,undefined,undefined,{'CF-Connecting-IP':'192.0.2.2'});const s=await issueSession(other,f.env);other.headers.set('X-AI-Session',s.session);assert.equal((await handleAnalysis(other,f.env,async()=>model(sample.analysis))).status,200);
});
test('全站100次达到上限后停止；总开关关闭时停止且不增加计数',async()=>{
 const f=await fixture();await f.storage.put('global',100);await blocked(f,'SERVICE_DAILY_LIMIT_REACHED');assert.equal(await f.storage.get('global'),100);
 f.env.PUBLIC_AI_ENABLED='false';assert.equal((await blocked(f,'AI_DISABLED')).status,503);assert.equal(await f.storage.get('global'),100);
});
test('持久计数串行原子预留：120并发匿名IP只允许100；重新创建实例不会清零',async()=>{
 const f=await fixture(),now=Date.now(),day=Math.floor((now+8*3600000)/86400000);const {createHash}=require('node:crypto');
 const reserve=i=>f.object.fetch(new Request('https://usage.internal/reserve',{method:'POST',body:JSON.stringify({day,now,ipHash:createHash('sha256').update('fixture-ip-'+i).digest('base64url'),limits:{global:100,ip:10,minute:2}})}));
 const responses=await Promise.all(Array.from({length:120},(_,i)=>reserve(i)));assert.equal(responses.filter(r=>r.status===200).length,100);assert.equal(await f.storage.get('global'),100);
 const {AIUsage}=await import('../ai/public-ai-guard.mjs');f.object=new AIUsage({storage:f.storage});assert.equal((await reserve(999)).status,429);
});
test('每日按北京时间重置且旧匿名IP记录清除；60秒滑动窗口恢复',async()=>{
 const f=await fixture(),now=Date.now(),day=Math.floor((now+8*3600000)/86400000),ipHash='a'.repeat(43);
 const reserve=(at,hash=ipHash)=>f.object.fetch(new Request('https://usage.internal/reserve',{method:'POST',body:JSON.stringify({day:Math.floor((at+8*3600000)/86400000),now:at,ipHash:hash,limits:{global:100,ip:10,minute:2}})}));
 assert.equal((await reserve(now)).status,200);assert.equal((await reserve(now)).status,200);assert.equal((await reserve(now)).status,429);assert.equal((await reserve(now+60000)).status,200);
 const tomorrow=(day+1)*86400000-8*3600000;assert.equal((await reserve(tomorrow,'b'.repeat(43))).status,200);assert.equal(await f.storage.get('global'),1);assert.equal(await f.storage.get('ip:'+ipHash),undefined);
});
test('健康检查、预检、空/超长简历和JD、本地PDF功能不计数',async()=>{
 const f=await fixture(),worker=(await import('../worker/index.mjs')).default,{handleAnalysis}=await import('../ai/handler.mjs'),{handleOptimization}=await import('../ai/optimization-handler.mjs');let calls=0;const fetcher=()=>calls++;
 assert.equal((await worker.fetch(new Request('https://worker.invalid/health'),f.env)).status,200);
 assert.equal((await handleAnalysis(new Request('https://worker.invalid/api/resume/analyze',{method:'OPTIONS',headers:f.headers}),f.env,fetcher)).status,204);
 for(const resumeText of ['', 'x'.repeat(12001)])assert.equal((await handleAnalysis(req(f,undefined,{resumeText}),f.env,fetcher)).status,400);
 assert.equal((await handleOptimization(req(f,'/api/resume/optimize',{...optBody(),jd:'x'.repeat(12001)}),f.env,fetcher)).status,400);
 assert.equal(calls,0);assert.equal(f.storage.data.size,0);
 const report=fs.readFileSync('js/report-print.js','utf8');assert.doesNotMatch(report,/fetch\(|ensureSession|AI_USAGE/);
 assert.doesNotMatch(fs.readFileSync('js/resume-parser.js','utf8'),/PublicAISecurity|AI_USAGE/);
});
test('Siteverify验证失败、错误hostname/action、一次性token重复使用不发行会话',async()=>{
 const f=await fixture(),{handleSecurity}=await import('../ai/security-handler.mjs');let calls=0;
 for(const result of [{success:false},{success:true,hostname:'evil.invalid',action:'resume_ai'},{success:true,hostname:'127.0.0.1',action:'other'},{success:false,'error-codes':['timeout-or-duplicate']}]){
  const response=await handleSecurity(req(f,'/api/security/session',{token:'fixture-token'}),f.env,async url=>{calls++;assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');return Response.json(result);});
  assert.equal(response.status,403);assert.equal((await response.json()).error.code,'TURNSTILE_FAILED');
 }
 assert.equal(calls,4);assert.equal(f.storage.data.size,0);
});
test('缺少/损坏计数绑定或错误限额配置均fail closed；不存在生产测试绕过',async()=>{
 const f=await fixture();f.env.IP_DAILY_AI_LIMIT='not-a-limit';await blocked(f,'SECURITY_UNAVAILABLE');delete f.env.AI_USAGE;await blocked(f,'SECURITY_UNAVAILABLE');
 const source=fs.readFileSync('ai/public-ai-guard.mjs','utf8');assert.doesNotMatch(source,/env\.(?:TEST|SKIP|BYPASS)|X-Forwarded-For|localStorage|resumeText|jd\b/);
});
test('已有网络兜底也计入全站上限；达到上限时绝不向备用Qwen发第二次请求',async()=>{
 const f=await fixture({AI_BASE_URL:'https://unit.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'});await f.storage.put('global',99);let calls=0;
 const {handleAnalysis}=await import('../ai/handler.mjs');const response=await handleAnalysis(req(f),f.env,async()=>{calls++;throw new TypeError('fetch failed');});
 assert.equal(response.status,429);assert.equal((await response.json()).error.code,'SERVICE_DAILY_LIMIT_REACHED');assert.equal(calls,1);assert.equal(await f.storage.get('global'),100);
});
test('安全计数、响应和日志不泄露个人信息、Secret、完整IP；config只返回公开Site Key',async()=>{
 const f=await fixture(),{handleSecurity}=await import('../ai/security-handler.mjs'),{handleAnalysis}=await import('../ai/handler.mjs');const logs=[],old=console.info;console.info=s=>logs.push(s);
 try{await handleAnalysis(req(f),f.env,async()=>model(sample.analysis));}finally{console.info=old;}
 const config=await handleSecurity(new Request('https://worker.invalid/api/security/config',{headers:f.headers}),f.env);assert.deepEqual(await config.json(),{siteKey:'unit-test-site-key'});
 const stored=JSON.stringify([...f.storage.data]);assert.doesNotMatch(stored,/192\.0\.2|星河|SQL|resume|email|jd/);assert.doesNotMatch(logs.join(''),/unit-test-only|unit-test-turnstile-secret|192\.0\.2|星河|Bearer/);
 assert.ok(logs.some(s=>JSON.parse(s).event==='ai-usage'));
 const frontend=['index.html','js/public-ai-security.js','js/analysis-provider.js','js/optimization-provider.js'].map(n=>fs.readFileSync(n,'utf8')).join('');assert.doesNotMatch(frontend,/TURNSTILE_SECRET_KEY|AI_API_KEY|Authorization|localStorage|sessionStorage/);
});
test('前端首次验证一次、同一会话复用、并发只交换一次、到期/失败重新验证；不持久化',async()=>{
 const contract=require('../js/analysis-contract.js');let renders=0,verifications=0,configs=0,removed=0;const mount=()=>({setAttribute(){},remove(){removed++;}});
 const root={AnalysisContract:contract,AnalysisConfig:{endpoint:'https://worker.invalid/api/resume/analyze'},turnstile:{render(el,options){renders++;assert.equal(options.action,'resume_ai');assert.equal(options.retry,'never');queueMicrotask(()=>options.callback('fixture-token'));return 'widget';},remove(){}}};
 const document={createElement:mount,querySelector:()=>({before(){}}),getElementById:()=>null,body:{append(){}},head:{append(){throw Error('SDK already mocked');}}};
 vm.runInNewContext(fs.readFileSync('js/public-ai-security.js','utf8'),{window:root,location:{href:'http://127.0.0.1:4173/'},document,URL,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{if(url.endsWith('/config')){configs++;return Response.json({siteKey:'fixture-site'});}verifications++;assert.equal(JSON.parse(options.body).token,'fixture-token');return Response.json({session:'mock-signed-session',expiresAt:Date.now()+1800000});}});
 assert.deepEqual(await Promise.all([root.PublicAISecurity.ensureSession(),root.PublicAISecurity.ensureSession()]),['mock-signed-session','mock-signed-session']);
 assert.equal(await root.PublicAISecurity.ensureSession(),'mock-signed-session');assert.equal(renders,1);assert.equal(verifications,1);assert.equal(configs,1);assert.equal(removed,1);
 root.PublicAISecurity.invalidate('TURNSTILE_FAILED');await root.PublicAISecurity.ensureSession();assert.equal(verifications,2);
 const controller=new AbortController();controller.abort();await assert.rejects(root.PublicAISecurity.ensureSession({signal:controller.signal}),{code:'CANCELLED'});assert.equal(verifications,2);
});
