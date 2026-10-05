
export const sources=[
 {key:'boss',name:'BOSS直聘',kind:'platform',url:(role,city)=>'https://www.zhipin.com/web/geek/job?'+new URLSearchParams({query:role,city:({'北京':'101010100','上海':'101020100','深圳':'101280600'})[city]||''})},
 {key:'liepin',name:'猎聘',kind:'platform',url:(role,city)=>'https://www.liepin.com/zhaopin/?'+new URLSearchParams({dq:({'北京':'010','上海':'020','深圳':'050090'})[city]||'',key:role})},
 {key:'zhaopin',name:'智联招聘',kind:'platform',url:(role,city)=>'https://www.zhaopin.com/sou/?'+new URLSearchParams({jl:({'北京':'530','上海':'538','深圳':'765'})[city]||'',kw:role})},
 {key:'tencent',name:'腾讯',kind:'corporate',url:()=> 'https://careers.tencent.com/jobopportunity.html'},
 {key:'bytedance',name:'字节跳动',kind:'corporate',url:()=> 'https://jobs.bytedance.com/experienced'},
 {key:'meituan',name:'美团',kind:'corporate',url:()=> 'https://join.meituan.com/'},
 {key:'xiaomi',name:'小米',kind:'corporate',url:()=> 'https://www.mi.com/about/join'},
 {key:'jd',name:'京东',kind:'corporate',url:()=> 'https://zhaopin.jd.com/'},
 {key:'alibaba',name:'阿里巴巴',kind:'corporate',url:()=> 'https://talent.alibaba.com/'},
 {key:'sensors',name:'神策数据',kind:'corporate',url:()=> 'https://www.sensorsdata.cn/about/joinus.html'}
];
const plain=s=>s.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function inspect(html,url,role,city){
 const text=plain(html), title=plain((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'');
 const links=[];
 for(const a of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
   let href;try{href=new URL(a[1].replace(/&amp;/g,'&'),url).href;}catch{continue;}
   if(!/^https?:/.test(href))continue;
   const label=plain(a[2]);const context=plain(html.slice(Math.max(0,a.index-250),a.index+a[0].length+850));
   if(/\/job_detail\/|\/jobdetail\/|\/jobs\/CC|\/job\/\d|\/a\/\d|postid=|position\/\d|\/job\/detail/i.test(href)&&label){
      links.push({title:label.slice(0,100),url:href,context:context.slice(0,450),matchesRole:label.includes(role),matchesCity:context.includes(city)});
   }
 }
 const unique=[...new Map(links.map(j=>[j.url,j])).values()];
 return {title,textLength:text.length,hasJavaScript:/<script\b/i.test(html),challengePage:/安全验证|访问验证|人机验证|请完成验证|访问异常|访问受限|异常访问|Access Denied|Just a moment|Forbidden|验证后继续/i.test(title+' '+text.slice(0,1800)),loginWall:/请先登录|登录后查看|登录后可查看|登录后搜索/.test(text),captchaMention:/验证码|captcha/i.test(text),jobLinks:unique.length,matchedJobs:unique.filter(j=>j.matchesRole&&j.matchesCity),examples:unique.slice(0,3),officialCareerLinks:[...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].filter(a=>/社会招聘|加入我们|招聘职位|查看职位/.test(plain(a[2]))).map(a=>({label:plain(a[2]).slice(0,40),url:new URL(a[1].replace(/&amp;/g,'&'),url).href})).slice(0,8),roleMentions:text.split(role).length-1,cityMentions:text.split(city).length-1,preview:text.slice(0,600)};
}
export async function probe(source,role,city){
 const url=source.url(role,city);const start=Date.now();
 try {
 const r=await fetch(url,{redirect:'manual',headers:{Accept:'text/html'},signal:AbortSignal.timeout(12000)});
 if(r.status>=300&&r.status<400)return {key:source.key,name:source.name,kind:source.kind,url,status:r.status,redirect:r.headers.get('location'),elapsedMs:Date.now()-start,directFetchSupported:false};
 const html=await r.text();if(html.length>2500000)return {key:source.key,name:source.name,url,status:r.status,error:'PAGE_TOO_LARGE',directFetchSupported:false};
 const content=inspect(html,url,role,city);
 return {key:source.key,name:source.name,kind:source.kind,url,status:r.status,elapsedMs:Date.now()-start,...content,directFetchSupported:r.ok&&!content.challengePage&&!content.loginWall&&content.jobLinks>0};
 }catch(e){return {key:source.key,name:source.name,kind:source.kind,url,error:e.name||'NETWORK',elapsedMs:Date.now()-start,directFetchSupported:false};}
}
export async function handleProbe(request){
 const p=new URL(request.url).searchParams,role=p.get('role')||'',city=p.get('city')||'';
 if(request.method!=='GET'||role.length<1||role.length>40||!['北京','上海','深圳'].includes(city))return new Response('Invalid probe',{status:400});
 const results=[];for(let i=0;i<sources.length;i+=3)results.push(...await Promise.all(sources.slice(i,i+3).map(s=>probe(s,role,city))));
 return new Response(JSON.stringify({testedAt:new Date().toISOString(),environment:'Cloudflare Worker',role,city,results},null,2),{headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
}
