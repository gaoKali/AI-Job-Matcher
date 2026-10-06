const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'_site');
if(out!==path.join(root,'_site'))throw Error('Unexpected output directory');
// Only delete generated release output, never user files.
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const scripts=['providers.js','parser-core.js','resume-parser.js','resume-worker.js','analysis-contract.js','analysis-config.js','public-ai-security.js','analysis-provider.js','optimization-contract.js','optimization-provider.js','report-print.js','app.js'];
const files=['index.html','styles.css','brand.css','print-report.css','assets/favicon.svg','assets/character-drink-clean.webp','assets/character-cup-ink.webp',...scripts.map(f=>'js/'+f)];
for(const name of files){const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,name),target);}
fs.cpSync(path.join(root,'assets/vendor'),path.join(out,'assets/vendor'),{recursive:true});
const entry=path.join(out,'index.html');let html=fs.readFileSync(entry,'utf8');
const policy="default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://ai-job-matcher-api.gaoweishmily.workers.dev https://challenges.cloudflare.com; worker-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
html=html.replace('<meta name="viewport"','<meta http-equiv="Content-Security-Policy" content="'+policy+'">\n  <meta name="viewport"');fs.writeFileSync(entry,html);fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Pages artifact ready: allowlisted static resources only.');
