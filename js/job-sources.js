(function(root){
  'use strict';
  const sources=[
    {key:'cloudflare',company:'Cloudflare',source:'Greenhouse',board:'cloudflare',industry:'互联网 网络安全 SaaS'},
    {key:'stripe',company:'Stripe',source:'Greenhouse',board:'stripe',industry:'金融科技 SaaS 互联网'},
    {key:'databricks',company:'Databricks',source:'Greenhouse',board:'databricks',industry:'AI 数据 SaaS 企业服务'},
    {key:'gitlab',company:'GitLab',source:'Greenhouse',board:'gitlab',industry:'SaaS 企业服务 软件'},
    {key:'spotify',company:'Spotify',source:'Lever',board:'spotify',industry:'互联网 消费科技 音乐'},
    {key:'palantir',company:'Palantir',source:'Lever',board:'palantir',industry:'AI 数据 企业服务'},
    {key:'openai',company:'OpenAI',source:'Ashby',board:'openai',industry:'AI 人工智能'},
    {key:'notion',company:'Notion',source:'Ashby',board:'notion',industry:'SaaS 互联网 企业服务'},
    {key:'ramp',company:'Ramp',source:'Ashby',board:'ramp',industry:'金融科技 SaaS 企业服务'},
    {key:'perplexity',company:'Perplexity',source:'Ashby',board:'perplexity',industry:'AI 搜索 互联网'}
  ].map(s=>Object.freeze({...s,apiUrl:s.source==='Greenhouse'?'https://boards-api.greenhouse.io/v1/boards/'+s.board+'/jobs?content=true':s.source==='Lever'?'https://api.lever.co/v0/postings/'+s.board+'?mode=json&limit=500':'https://api.ashbyhq.com/posting-api/job-board/'+s.board}));
  root.JobSources=Object.freeze(sources);if(typeof module!=='undefined')module.exports=root.JobSources;
})(typeof window==='undefined'?globalThis:window);
