'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/public-ai-security.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness({sdk=true,serverFails=false}={}){
 const mounts=[],scripts=[],timers=new Map(),options=[],tokens=[];let id=0,retries=0,removed=0,next;
 const element=tag=>({tag,children:[],events:{},hidden:false,disabled:false,textContent:'',setAttribute(){},append(...els){this.children.push(...els);},addEventListener(name,fn){this.events[name]=fn;},scrollIntoView(){this.scrolled=true;},remove(){this.removed=true;}});
 const button={disabled:false,before(el){mounts.push(el);},click(){retries++;next=root.PublicAISecurity.ensureSession();next.catch(()=>{});}};
 const root={AnalysisContract:require('../js/analysis-contract.js'),AnalysisConfig:{endpoint:'https://worker.invalid/api/resume/analyze'}};
 const turnstile={render(el,o){assert.equal(el.children.length,0,'widget container must be empty');assert.equal(o.appearance,'always');assert.equal(o.retry,'never');options.push(o);return 'widget-'+options.length;},remove(){removed++;}};
 if(sdk)root.turnstile=turnstile;
 const document={createElement:element,querySelectorAll:()=>mounts.filter(el=>!el.removed),querySelector:()=>button,getElementById:()=>button,body:{append(el){mounts.push(el);}},head:{append(el){scripts.push(el);}}};
 vm.runInNewContext(source,{window:root,location:{href:'https://gaokali.github.io/AI-Job-Matcher/'},document,URL,AbortController,console:{warn(){}},setTimeout(fn,ms){const key=++id;timers.set(key,{fn,ms});return key;},clearTimeout(key){timers.delete(key);},fetch:async(url,opts)=>{
  if(url.endsWith('/config'))return Response.json({siteKey:'test-public-site-key'});
  tokens.push(JSON.parse(opts.body).token);
  return serverFails?Response.json({error:{code:'TURNSTILE_FAILED'}},{status:403}):Response.json({session:'signed-session-fixture',expiresAt:Date.now()+1800000});
 }});
 return {root,mounts,scripts,options,tokens,timers,button,turnstile,get next(){return next;},get retries(){return retries;},get removed(){return removed;}};
}
for(const event of ['error-callback','expired-callback','timeout-callback'])test('验证'+event+'后保留重试入口，重试使用新token且不自动请求',async()=>{
 const h=harness();const first=h.root.PublicAISecurity.ensureSession();const failed=assert.rejects(first,{code:'TURNSTILE_FAILED'});await tick();
 assert.equal(h.options.length,1);assert.ok(h.mounts[0].scrolled);
 h.options[0][event]('600010');await failed;
 const retry=h.mounts[0].children.find(el=>el.tag==='button');assert.ok(retry);assert.equal(retry.textContent,'重新安全验证');assert.equal(h.mounts[0].removed,undefined);assert.equal(h.tokens.length,0);assert.equal(h.options.length,1);
 retry.events.click();await tick();assert.equal(h.retries,1);assert.equal(h.mounts[0].removed,true);assert.equal(h.options.length,2);
 h.options[1].callback('fresh-token-2');assert.equal(await h.next,'signed-session-fixture');assert.deepEqual(h.tokens,['fresh-token-2']);
 assert.equal(await h.root.PublicAISecurity.ensureSession(),'signed-session-fixture');assert.equal(h.options.length,2);assert.equal(h.timers.size,0);
});
test('SDK被拦截时仍显示提示和重试入口，重试可重新加载SDK',async()=>{
 const h=harness({sdk:false});const first=h.root.PublicAISecurity.ensureSession();const failed=assert.rejects(first,{code:'TURNSTILE_FAILED'});await tick();assert.equal(h.mounts.length,1);assert.equal(h.scripts.length,1);
 h.scripts[0].events.error();await failed;assert.equal(h.scripts[0].removed,true);assert.equal(h.options.length,0);
 h.mounts[0].children.find(el=>el.tag==='button').events.click();await tick();assert.equal(h.scripts.length,2);
 h.root.turnstile=h.turnstile;h.scripts[1].events.load();await tick();h.options[0].callback('new-sdk-token');await h.next;assert.deepEqual(h.tokens,['new-sdk-token']);
});
test('验证总超时不调用模型；失败入口可重试；取消则清理验证框',async()=>{
 const h=harness();const first=h.root.PublicAISecurity.ensureSession();const failed=assert.rejects(first,{code:'TURNSTILE_FAILED'});await tick();[...h.timers.values()].find(v=>v.ms===120000).fn();await failed;assert.equal(h.tokens.length,0);assert.ok(h.mounts[0].children.some(el=>el.tag==='button'));
 const controller=new AbortController(),second=h.root.PublicAISecurity.ensureSession({signal:controller.signal});const cancelled=assert.rejects(second,{code:'CANCELLED'});await tick();controller.abort();await cancelled;assert.equal(h.mounts[1].removed,true);assert.equal(h.timers.size,0);
});
test('服务端验证失败绝不缓存会话，下次必须获取新token',async()=>{
 const h=harness({serverFails:true});for(let n=0;n<2;n++){const call=h.root.PublicAISecurity.ensureSession();const failure=assert.rejects(call,{code:'TURNSTILE_FAILED'});await tick();h.options[n].callback('server-token-'+n);await failure;}assert.deepEqual(h.tokens,['server-token-0','server-token-1']);assert.equal(h.options.length,2);
});
