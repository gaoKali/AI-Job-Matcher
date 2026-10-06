const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm');
test('Pages仅发布必要静态文件，子路径全部资源可访问且后端/测试404',async()=>{
 cp.execFileSync(process.execPath,['tools/build-pages.cjs']);
 const files=[];function walk(p){for(const d of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,d.name);assert.equal(d.isSymbolicLink(),false);d.isDirectory()?walk(f):files.push(f);}}walk('_site');
 assert.ok(files.length>100);assert.ok(files.every(f=>!/(?:^|[\\/])(?:ai|worker|tests|tmp|\.env|\.dev\.vars)(?:[\\/.]|$)/.test(f)));
 const child=cp.spawn(process.execPath,['tools/preview-pages.cjs'],{env:{...process.env,PORT:'4177'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Preview exited')));});
  const base='http://127.0.0.1:4177/AI-Job-Matcher/',html=await (await fetch(base)).text();
  assert.match(html,/Content-Security-Policy/);assert.match(html,/challenges.cloudflare.com/);assert.doesNotMatch(html,/(?:src|href)=["']\//);
  const assets=[...html.matchAll(/(?:src|href)=["']([^"'#]+)["']/g)].map(m=>m[1]).filter(u=>!/^https?:/.test(u));
  for(const f of [...assets,'js/resume-worker.js','assets/vendor/pdfjs/pdf.min.mjs','assets/vendor/pdfjs/pdf.worker.min.mjs','assets/vendor/mammoth/mammoth.browser.min.js'])assert.equal((await fetch(new URL(f,base))).status,200,f);
  for(const f of ['ai/provider.mjs','worker/index.mjs','tests/fixtures/normal.pdf','.env','server.cjs'])assert.equal((await fetch(new URL(f,base))).status,404,f);
 }finally{child.kill();}
});
test('正式域名即便带demo=1也不能开启模拟候选人；密钥仍只在Worker',()=>{
 const root={location:{hostname:'public.github.io',search:'?demo=1'},AnalysisContract:require('../js/analysis-contract.js'),AnalysisConfig:{endpoint:'https://worker.invalid/api/resume/analyze'},JobMatcherProviders:{analysisProvider:{}}};
 vm.runInNewContext(fs.readFileSync('js/analysis-provider.js','utf8'),{window:root,URLSearchParams});assert.equal(root.JobMatcherProviders.analysisMode,'live');
 assert.doesNotMatch(fs.readFileSync('index.html','utf8'),/AI_API_KEY|TURNSTILE_SECRET_KEY/);
 assert.match(fs.readFileSync('index.html','utf8'),/请勿上传不希望发送给 AI 服务的敏感个人信息/);
});
