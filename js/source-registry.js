(function(root){
const companies=[
  {
    "key": "cloudflare",
    "company": "Cloudflare",
    "source": "Greenhouse",
    "board": "cloudflare",
    "industry": "互联网 网络安全 SaaS",
    "apiUrl": "https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs?content=true",
    "name": "Greenhouse",
    "type": "ats",
    "domain": "boards-api.greenhouse.io",
    "adapter": "greenhouse",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://job-boards.greenhouse.io/cloudflare",
    "jobHosts": [
      "job-boards.greenhouse.io",
      "boards.greenhouse.io",
      "cloudflare.com",
      "www.cloudflare.com"
    ]
  },
  {
    "key": "stripe",
    "company": "Stripe",
    "source": "Greenhouse",
    "board": "stripe",
    "industry": "金融科技 SaaS 互联网",
    "apiUrl": "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true",
    "name": "Greenhouse",
    "type": "ats",
    "domain": "boards-api.greenhouse.io",
    "adapter": "greenhouse",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://job-boards.greenhouse.io/stripe",
    "jobHosts": [
      "job-boards.greenhouse.io",
      "boards.greenhouse.io",
      "stripe.com",
      "www.stripe.com"
    ]
  },
  {
    "key": "databricks",
    "company": "Databricks",
    "source": "Greenhouse",
    "board": "databricks",
    "industry": "AI 数据 SaaS 企业服务",
    "apiUrl": "https://boards-api.greenhouse.io/v1/boards/databricks/jobs?content=true",
    "name": "Greenhouse",
    "type": "ats",
    "domain": "boards-api.greenhouse.io",
    "adapter": "greenhouse",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://job-boards.greenhouse.io/databricks",
    "jobHosts": [
      "job-boards.greenhouse.io",
      "boards.greenhouse.io",
      "databricks.com",
      "www.databricks.com"
    ]
  },
  {
    "key": "gitlab",
    "company": "GitLab",
    "source": "Greenhouse",
    "board": "gitlab",
    "industry": "SaaS 企业服务 软件",
    "apiUrl": "https://boards-api.greenhouse.io/v1/boards/gitlab/jobs?content=true",
    "name": "Greenhouse",
    "type": "ats",
    "domain": "boards-api.greenhouse.io",
    "adapter": "greenhouse",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://job-boards.greenhouse.io/gitlab",
    "jobHosts": [
      "job-boards.greenhouse.io",
      "boards.greenhouse.io",
      "gitlab.com",
      "www.gitlab.com"
    ]
  },
  {
    "key": "spotify",
    "company": "Spotify",
    "source": "Lever",
    "board": "spotify",
    "industry": "互联网 消费科技 音乐",
    "apiUrl": "https://api.lever.co/v0/postings/spotify?mode=json&limit=500",
    "name": "Lever",
    "type": "ats",
    "domain": "api.lever.co",
    "adapter": "lever",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://jobs.lever.co/spotify",
    "jobHosts": [
      "jobs.lever.co"
    ]
  },
  {
    "key": "palantir",
    "company": "Palantir",
    "source": "Lever",
    "board": "palantir",
    "industry": "AI 数据 企业服务",
    "apiUrl": "https://api.lever.co/v0/postings/palantir?mode=json&limit=500",
    "name": "Lever",
    "type": "ats",
    "domain": "api.lever.co",
    "adapter": "lever",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://jobs.lever.co/palantir",
    "jobHosts": [
      "jobs.lever.co"
    ]
  },
  {
    "key": "openai",
    "company": "OpenAI",
    "source": "Ashby",
    "board": "openai",
    "industry": "AI 人工智能",
    "apiUrl": "https://api.ashbyhq.com/posting-api/job-board/openai",
    "name": "Ashby",
    "type": "ats",
    "domain": "api.ashbyhq.com",
    "adapter": "ashby",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://jobs.ashbyhq.com/openai",
    "jobHosts": [
      "jobs.ashbyhq.com"
    ]
  },
  {
    "key": "notion",
    "company": "Notion",
    "source": "Ashby",
    "board": "notion",
    "industry": "SaaS 互联网 企业服务",
    "apiUrl": "https://api.ashbyhq.com/posting-api/job-board/notion",
    "name": "Ashby",
    "type": "ats",
    "domain": "api.ashbyhq.com",
    "adapter": "ashby",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://jobs.ashbyhq.com/notion",
    "jobHosts": [
      "jobs.ashbyhq.com"
    ]
  },
  {
    "key": "ramp",
    "company": "Ramp",
    "source": "Ashby",
    "board": "ramp",
    "industry": "金融科技 SaaS 企业服务",
    "apiUrl": "https://api.ashbyhq.com/posting-api/job-board/ramp",
    "name": "Ashby",
    "type": "ats",
    "domain": "api.ashbyhq.com",
    "adapter": "ashby",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://jobs.ashbyhq.com/ramp",
    "jobHosts": [
      "jobs.ashbyhq.com"
    ]
  },
  {
    "key": "perplexity",
    "company": "Perplexity",
    "source": "Ashby",
    "board": "perplexity",
    "industry": "AI 搜索 互联网",
    "apiUrl": "https://api.ashbyhq.com/posting-api/job-board/perplexity",
    "name": "Ashby",
    "type": "ats",
    "domain": "api.ashbyhq.com",
    "adapter": "ashby",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "careerUrl": "https://jobs.ashbyhq.com/perplexity",
    "jobHosts": [
      "jobs.ashbyhq.com"
    ]
  },
  {
    "key": "epic",
    "company": "Epic Games",
    "name": "Greenhouse",
    "type": "ats",
    "adapter": "greenhouse",
    "board": "epicgames",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "industry": "AI 软件 互联网",
    "domain": "boards-api.greenhouse.io",
    "apiUrl": "https://boards-api.greenhouse.io/v1/boards/epicgames/jobs?content=true",
    "careerUrl": "https://job-boards.greenhouse.io/epicgames",
    "jobHosts": [
      "job-boards.greenhouse.io",
      "boards.greenhouse.io",
      "www.airbnb.com",
      "careers.airbnb.com"
    ]
  },
  {
    "key": "figma",
    "company": "Figma",
    "name": "Greenhouse",
    "type": "ats",
    "adapter": "greenhouse",
    "board": "figma",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "industry": "AI 软件 互联网",
    "domain": "boards-api.greenhouse.io",
    "apiUrl": "https://boards-api.greenhouse.io/v1/boards/figma/jobs?content=true",
    "careerUrl": "https://job-boards.greenhouse.io/figma",
    "jobHosts": [
      "job-boards.greenhouse.io",
      "boards.greenhouse.io",
      "www.airbnb.com",
      "careers.airbnb.com"
    ]
  },
  {
    "key": "anthropic",
    "company": "Anthropic",
    "name": "Greenhouse",
    "type": "ats",
    "adapter": "greenhouse",
    "board": "anthropic",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "industry": "AI 软件 互联网",
    "domain": "boards-api.greenhouse.io",
    "apiUrl": "https://boards-api.greenhouse.io/v1/boards/anthropic/jobs?content=true",
    "careerUrl": "https://job-boards.greenhouse.io/anthropic",
    "jobHosts": [
      "job-boards.greenhouse.io",
      "boards.greenhouse.io",
      "www.airbnb.com",
      "careers.airbnb.com"
    ]
  },
  {
    "key": "airbnb",
    "company": "Airbnb",
    "name": "Greenhouse",
    "type": "ats",
    "adapter": "greenhouse",
    "board": "airbnb",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "industry": "AI 软件 互联网",
    "domain": "boards-api.greenhouse.io",
    "apiUrl": "https://boards-api.greenhouse.io/v1/boards/airbnb/jobs?content=true",
    "careerUrl": "https://job-boards.greenhouse.io/airbnb",
    "jobHosts": [
      "job-boards.greenhouse.io",
      "boards.greenhouse.io",
      "www.airbnb.com",
      "careers.airbnb.com"
    ]
  },
  {
    "key": "linear",
    "company": "Linear",
    "name": "Ashby",
    "type": "ats",
    "adapter": "ashby",
    "board": "linear",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 3,
    "industry": "AI 软件 互联网",
    "domain": "api.ashbyhq.com",
    "apiUrl": "https://api.ashbyhq.com/posting-api/job-board/linear",
    "careerUrl": "https://jobs.ashbyhq.com/linear",
    "jobHosts": [
      "jobs.ashbyhq.com"
    ]
  },
  {
    "key": "bosch",
    "company": "Bosch",
    "name": "SmartRecruiters",
    "type": "ats",
    "adapter": "smartrecruiters",
    "board": "BoschGroup",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "industry": "汽车科技 制造业数字化 智能硬件",
    "domain": "api.smartrecruiters.com",
    "apiUrl": "https://api.smartrecruiters.com/v1/companies/BoschGroup/postings",
    "careerUrl": "https://careers.smartrecruiters.com/BoschGroup",
    "jobHosts": [
      "jobs.smartrecruiters.com"
    ]
  },
  {
    "key": "ikea",
    "company": "Inter IKEA",
    "name": "SmartRecruiters",
    "type": "ats",
    "adapter": "smartrecruiters",
    "board": "InterIKEAGroup",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "industry": "消费科技",
    "domain": "api.smartrecruiters.com",
    "apiUrl": "https://api.smartrecruiters.com/v1/companies/InterIKEAGroup/postings",
    "careerUrl": "https://careers.smartrecruiters.com/InterIKEAGroup",
    "jobHosts": [
      "jobs.smartrecruiters.com"
    ]
  },
  {
    "key": "ubisoft",
    "company": "Ubisoft",
    "name": "SmartRecruiters",
    "type": "ats",
    "adapter": "smartrecruiters",
    "board": "Ubisoft2",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "industry": "游戏 互联网",
    "domain": "api.smartrecruiters.com",
    "apiUrl": "https://api.smartrecruiters.com/v1/companies/Ubisoft2/postings",
    "careerUrl": "https://careers.smartrecruiters.com/Ubisoft2",
    "jobHosts": [
      "jobs.smartrecruiters.com"
    ]
  },
  {
    "key": "sgs",
    "company": "SGS",
    "name": "SmartRecruiters",
    "type": "ats",
    "adapter": "smartrecruiters",
    "board": "SGS",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "industry": "咨询 医疗科技",
    "domain": "api.smartrecruiters.com",
    "apiUrl": "https://api.smartrecruiters.com/v1/companies/SGS/postings",
    "careerUrl": "https://careers.smartrecruiters.com/SGS",
    "jobHosts": [
      "jobs.smartrecruiters.com"
    ]
  },
  {
    "key": "aecom",
    "company": "AECOM",
    "name": "SmartRecruiters",
    "type": "ats",
    "adapter": "smartrecruiters",
    "board": "AECOM2",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "industry": "咨询 制造业数字化",
    "domain": "api.smartrecruiters.com",
    "apiUrl": "https://api.smartrecruiters.com/v1/companies/AECOM2/postings",
    "careerUrl": "https://careers.smartrecruiters.com/AECOM2",
    "jobHosts": [
      "jobs.smartrecruiters.com"
    ]
  },
  {
    "key": "western",
    "company": "Western Digital",
    "name": "SmartRecruiters",
    "type": "ats",
    "adapter": "smartrecruiters",
    "board": "WesternDigital",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "industry": "智能硬件 软件",
    "domain": "api.smartrecruiters.com",
    "apiUrl": "https://api.smartrecruiters.com/v1/companies/WesternDigital/postings",
    "careerUrl": "https://careers.smartrecruiters.com/WesternDigital",
    "jobHosts": [
      "jobs.smartrecruiters.com"
    ]
  },
  {
    "key": "sia",
    "company": "Sia",
    "name": "SmartRecruiters",
    "type": "ats",
    "adapter": "smartrecruiters",
    "board": "Sia",
    "enabled": true,
    "status": "working",
    "method": "official_public_api",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "industry": "咨询 数据 AI",
    "domain": "api.smartrecruiters.com",
    "apiUrl": "https://api.smartrecruiters.com/v1/companies/Sia/postings",
    "careerUrl": "https://careers.smartrecruiters.com/Sia",
    "jobHosts": [
      "jobs.smartrecruiters.com"
    ]
  },
  {
    "key": "tencent",
    "company": "腾讯",
    "name": "腾讯官网",
    "type": "company_career",
    "adapter": "generic-career",
    "domain": "careers.tencent.com",
    "careerUrl": "https://careers.tencent.com/search.html",
    "enabled": false,
    "status": "limited",
    "method": "public_html",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "jobHosts": [
      "careers.tencent.com"
    ]
  },
  {
    "key": "baidu",
    "company": "百度",
    "name": "百度官网",
    "type": "company_career",
    "adapter": "generic-career",
    "domain": "talent.baidu.com",
    "careerUrl": "https://talent.baidu.com/",
    "enabled": false,
    "status": "limited",
    "method": "public_html",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "jobHosts": [
      "talent.baidu.com"
    ]
  },
  {
    "key": "alibaba",
    "company": "阿里巴巴",
    "name": "阿里巴巴官网",
    "type": "company_career",
    "adapter": "generic-career",
    "domain": "talent.alibaba.com",
    "careerUrl": "https://talent.alibaba.com/",
    "enabled": false,
    "status": "limited",
    "method": "public_html",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "jobHosts": [
      "talent.alibaba.com"
    ]
  },
  {
    "key": "bytedance",
    "company": "字节跳动",
    "name": "字节跳动官网",
    "type": "company_career",
    "adapter": "generic-career",
    "domain": "jobs.bytedance.com",
    "careerUrl": "https://jobs.bytedance.com/experienced/position",
    "enabled": false,
    "status": "limited",
    "method": "public_html",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "jobHosts": [
      "jobs.bytedance.com"
    ]
  },
  {
    "key": "netease",
    "company": "网易",
    "name": "网易官网",
    "type": "company_career",
    "adapter": "generic-career",
    "domain": "hr.163.com",
    "careerUrl": "https://hr.163.com/job-list.html",
    "enabled": false,
    "status": "limited",
    "method": "public_html",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "jobHosts": [
      "hr.163.com"
    ]
  },
  {
    "key": "xiaomi",
    "company": "小米",
    "name": "小米官网",
    "type": "company_career",
    "adapter": "generic-career",
    "domain": "hr.xiaomi.com",
    "careerUrl": "https://hr.xiaomi.com/",
    "enabled": false,
    "status": "limited",
    "method": "public_html",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "jobHosts": [
      "hr.xiaomi.com"
    ]
  },
  {
    "key": "mihoyo",
    "company": "米哈游",
    "name": "米哈游官网",
    "type": "company_career",
    "adapter": "generic-career",
    "domain": "join.mihoyo.com",
    "careerUrl": "https://join.mihoyo.com/",
    "enabled": false,
    "status": "limited",
    "method": "public_html",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "jobHosts": [
      "join.mihoyo.com"
    ]
  },
  {
    "key": "jetbrains",
    "company": "JetBrains",
    "name": "JetBrains官网",
    "type": "company_career",
    "adapter": "generic-career",
    "domain": "www.jetbrains.com",
    "careerUrl": "https://www.jetbrains.com/careers/jobs/",
    "enabled": false,
    "status": "limited",
    "method": "public_html",
    "lastChecked": "2026-10-05",
    "priority": 2,
    "jobHosts": [
      "www.jetbrains.com"
    ]
  }
];
const boards=[
  {
    "key": "zhaopin",
    "name": "智联招聘",
    "type": "job_board",
    "adapter": "zhaopin",
    "domain": "www.zhaopin.com",
    "careerUrl": "https://www.zhaopin.com/",
    "enabled": false,
    "status": "limited",
    "method": "public_html_json",
    "priority": 1,
    "lastChecked": "2026-10-05",
    "jobHosts": [
      "www.zhaopin.com"
    ],
    "note": "普通访客可看首屏预览；Worker返回JS页面壳，未读取到公开JSON，自动来源停用"
  },
  {
    "key": "boss",
    "name": "BOSS直聘",
    "domain": "www.zhipin.com",
    "status": "limited",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://www.zhipin.com/"
  },
  {
    "key": "liepin",
    "name": "猎聘",
    "domain": "www.liepin.com",
    "status": "limited",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://www.liepin.com/"
  },
  {
    "key": "51job",
    "name": "前程无忧",
    "domain": "we.51job.com",
    "status": "limited",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://we.51job.com/"
  },
  {
    "key": "lagou",
    "name": "拉勾",
    "domain": "www.lagou.com",
    "status": "blocked",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://www.lagou.com/"
  },
  {
    "key": "58",
    "name": "58招聘",
    "domain": "sh.58.com",
    "status": "blocked",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://sh.58.com/"
  },
  {
    "key": "shixiseng",
    "name": "实习僧",
    "domain": "www.shixiseng.com",
    "status": "limited",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://www.shixiseng.com/"
  },
  {
    "key": "yingjiesheng",
    "name": "应届生求职",
    "domain": "www.yingjiesheng.com",
    "status": "limited",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://www.yingjiesheng.com/"
  },
  {
    "key": "nowcoder",
    "name": "牛客招聘",
    "domain": "www.nowcoder.com",
    "status": "limited",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://www.nowcoder.com/"
  },
  {
    "key": "haitou",
    "name": "海投网",
    "domain": "www.haitou.cc",
    "status": "limited",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://www.haitou.cc/"
  },
  {
    "key": "jobui",
    "name": "职友集",
    "domain": "www.jobui.com",
    "status": "blocked",
    "type": "job_board",
    "enabled": false,
    "method": "manual_link",
    "lastChecked": "2026-10-05",
    "priority": 1,
    "careerUrl": "https://www.jobui.com/"
  }
];
root.CompanySources=Object.freeze(companies.map(Object.freeze));root.PublicSources=Object.freeze([...boards,...root.CompanySources].map(Object.freeze));if(typeof module!=="undefined")module.exports={companies:root.CompanySources,sources:root.PublicSources};
})(typeof window==="undefined"?globalThis:window);
