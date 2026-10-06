const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../_site'),prefix='/AI-Job-Matcher/';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');if(!['GET','HEAD'].includes(req.method)||!url.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
 let file;try{file=path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length))||'index.html');}catch{res.writeHead(400);res.end();return;}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);});
}).listen(Number(process.env.PORT||4176),'127.0.0.1',()=>console.log('Pages subpath preview ready'));
