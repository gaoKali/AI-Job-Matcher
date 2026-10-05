# 公开岗位来源实际审计

日期：2026-10-05（北京时间）。仅匿名普通HTTP/公开网页和官方接口；不带Cookie、认证或简历，不破解验证码、字体或私有接口。状态是本次测试记录，不保证永久可用。

Git安全检查点：0ad5d5be4abd66abbbb930201d5d2a9123216e2e。唯一正式目录：C:\Users\WIN10\Documents\ChatGPT\AI-Job-Matcher。

审计52个独立来源（54个URL检查），初步本地HTTP working23个；最终22个ATS来源可用，智联降为limited。22表示公司来源数，不是22种ATS。最终Worker主页面确认22个来源成功、2个上海数据相关职位、14个缓存命中。公司seed30家，其中22家启用、8家受限暂关闭。没有达到15种稳定平台目标，国内自动平台覆盖尚不足。

## 逐来源证据

|来源|域名 / 实测URL|类型|未登录是否能看岗位|HTTP|JS依赖|公开JSON / API|JobPosting|sitemap|Cookie / 登录 / 验证|Worker|难度|状态与原因|
|---|---|---|---|---|---|---|---|---|---|---|---|---|
|BOSS直聘|[www.zhipin.com](https://www.zhipin.com/web/geek/job?query=%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90%E5%B8%88&city=101020100)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|猎聘|[www.liepin.com](https://www.liepin.com/zhaopin/?city=020&dq=020&key=%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90%E5%B8%88)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：HTTP200仅公开SEO分类，未取得独立岗位|
|智联招聘|[www.zhaopin.com](https://www.zhaopin.com/sou/jl538/kw%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90%E5%B8%88/)|job_board|列表20岗和300字预览，薪资/完整JD隐藏|200|部分/未知|公开HTML内JSON（仅本地取得）|未发现|未验证|列表无需登录；完整信息需登录，不读取隐藏薪资|limited：PUBLIC_DATA_MISSING|中/高|limited：匿名浏览器及本地HTTP可读20个公开列表，薪资和完整JD需登录；Worker仅取得JS壳 PUBLIC_DATA_MISSING，已停用自动来源|
|前程无忧|[we.51job.com](https://we.51job.com/pc/search)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|拉勾|[www.lagou.com](https://www.lagou.com/)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|验证/访问限制，停止|未从Worker单独测试|中/高|blocked：验证页；停止|
|58招聘|[sh.58.com](https://sh.58.com/job/)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|验证/访问限制，停止|未从Worker单独测试|中/高|blocked：验证页；停止|
|应届生求职|[www.yingjiesheng.com](https://www.yingjiesheng.com/)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|牛客招聘|[www.nowcoder.com](https://www.nowcoder.com/jobs/recommend)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|实习僧|[www.shixiseng.com](https://www.shixiseng.com/interns?keyword=%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90&city=%E4%B8%8A%E6%B5%B7)|job_board|部分可见，文字编码受限|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开列表，但部分职位标题/数字字体编码；不解码绕过，暂不启用|
|职友集|[www.jobui.com](https://www.jobui.com/jobs?jobKw=%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90%E5%B8%88&cityKw=%E4%B8%8A%E6%B5%B7)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|验证/访问限制，停止|未从Worker单独测试|中/高|blocked：验证页；停止|
|腾讯|[careers.tencent.com](https://careers.tencent.com/search.html)|company_career|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|海投网|[www.haitou.cc](https://www.haitou.cc/)|job_board|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|阿里巴巴|[talent.alibaba.com](https://talent.alibaba.com/)|company_career|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|百度|[talent.baidu.com](https://talent.baidu.com/)|company_career|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|网易|[hr.163.com](https://hr.163.com/job-list.html)|company_career|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|小米|[hr.xiaomi.com](https://hr.xiaomi.com/)|company_career|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|字节跳动|[jobs.bytedance.com](https://jobs.bytedance.com/experienced/position)|company_career|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|Moka|[www.mokahr.com](https://www.mokahr.com/)|ats|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|北森|[www.beisen.com](https://www.beisen.com/)|ats|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|NVIDIA/Workday|[nvidia.wd5.myworkdayjobs.com](https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite)|ats|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|大易|[www.dayee.com](https://www.dayee.com/)|ats|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|SAP/SuccessFactors|[jobs.sap.com](https://jobs.sap.com/search/?q=data&locationsearch=Shanghai)|ats|未确认可读取独立岗位|403|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|验证/访问限制，停止|未从Worker单独测试|中/高|blocked：HTTP403及验证页面，停止自动访问|
|Visa/SmartRecruiters|[api.smartrecruiters.com](https://api.smartrecruiters.com/v1/companies/Visa/postings?q=data&limit=100)|ats|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开接口200但本次无职位，不按有效源启用|
|Bosch/SmartRecruiters|[api.smartrecruiters.com](https://api.smartrecruiters.com/v1/companies/BoschGroup/postings?q=data&limit=100)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|IKEA/SmartRecruiters|[api.smartrecruiters.com](https://api.smartrecruiters.com/v1/companies/InterIKEAGroup/postings?q=data&limit=100)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Ubisoft/SmartRecruiters|[api.smartrecruiters.com](https://api.smartrecruiters.com/v1/companies/Ubisoft2/postings?q=data&limit=100)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|SGS/SmartRecruiters|[api.smartrecruiters.com](https://api.smartrecruiters.com/v1/companies/SGS/postings?q=data&limit=100)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|AECOM/SmartRecruiters|[api.smartrecruiters.com](https://api.smartrecruiters.com/v1/companies/AECOM2/postings?q=data&limit=100)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Western Digital/SmartRecruiters|[api.smartrecruiters.com](https://api.smartrecruiters.com/v1/companies/WesternDigital/postings?q=data&limit=100)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Epic Games/Greenhouse|[boards-api.greenhouse.io](https://boards-api.greenhouse.io/v1/boards/epicgames/jobs?content=true)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Figma/Greenhouse|[boards-api.greenhouse.io](https://boards-api.greenhouse.io/v1/boards/figma/jobs?content=true)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Anthropic/Greenhouse|[boards-api.greenhouse.io](https://boards-api.greenhouse.io/v1/boards/anthropic/jobs?content=true)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Airbnb/Greenhouse|[boards-api.greenhouse.io](https://boards-api.greenhouse.io/v1/boards/airbnb/jobs?content=true)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Linear/Ashby|[api.ashbyhq.com](https://api.ashbyhq.com/posting-api/job-board/linear)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Deel/Ashby|[api.ashbyhq.com](https://api.ashbyhq.com/posting-api/job-board/deel)|ats|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开接口200但本次无职位，不按有效源启用|
|Oracle Recruiting|[careers.oracle.com](https://careers.oracle.com/jobs/)|ats|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|Cloudflare/Greenhouse|[boards-api.greenhouse.io](https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs?content=true)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Databricks/Greenhouse|[boards-api.greenhouse.io](https://boards-api.greenhouse.io/v1/boards/databricks/jobs?content=true)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Stripe/Greenhouse|[boards-api.greenhouse.io](https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|GitLab/Greenhouse|[boards-api.greenhouse.io](https://boards-api.greenhouse.io/v1/boards/gitlab/jobs?content=true)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|OpenAI/Ashby|[api.ashbyhq.com](https://api.ashbyhq.com/posting-api/job-board/openai)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Notion/Ashby|[api.ashbyhq.com](https://api.ashbyhq.com/posting-api/job-board/notion)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Spotify/Lever|[api.lever.co](https://api.lever.co/v0/postings/spotify?mode=json&limit=500)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Ramp/Ashby|[api.ashbyhq.com](https://api.ashbyhq.com/posting-api/job-board/ramp)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Perplexity/Ashby|[api.ashbyhq.com](https://api.ashbyhq.com/posting-api/job-board/perplexity)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|Sia/SmartRecruiters|[api.smartrecruiters.com](https://api.smartrecruiters.com/v1/companies/Sia/postings?q=data&city=Shanghai&limit=50)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|
|JetBrains官网|[www.jetbrains.com](https://www.jetbrains.com/careers/jobs/)|company_career|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|米哈游官网|[join.mihoyo.com](https://join.mihoyo.com/)|company_career|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|limited：公开页面/JS壳或无稳定独立职位数据；不探测隐藏接口|
|安踏招聘官网|[careers.anta.com](https://careers.anta.com/)|company_career|未确认可读取独立岗位|TypeError|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|unavailable：当前测试环境连接异常，不能判断停运|
|永达汽车/北森|[yonda1.zhiye.com](https://yonda1.zhiye.com/social/jobs)|ats|未确认可读取独立岗位|200|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|验证脚本存在，未确认验证码；未使用Cookie|未从Worker单独测试|中/高|limited：公开页面JS职位壳；只发现验证相关脚本，未证实出现验证码，不探测私有接口|
|Deloitte/Taleo|[deloitte.taleo.net](https://deloitte.taleo.net/careersection/2/jobsearch.ftl)|ats|未确认可读取独立岗位|TypeError|部分/未知|未取得可用公开数据，未探测内部接口|未发现|未验证|未发送Cookie；是否必须登录未完全确认|未从Worker单独测试|中/高|unavailable：当前测试环境连接异常，不能判断停运|
|Palantir/Lever|[api.lever.co](https://api.lever.co/v0/postings/palantir?mode=json&limit=500)|ats|是（公开列表）|200|取公开JSON不需渲染|官方公开API，实际匿名200|未发现|未验证|不需Cookie或登录；匿名200，无验证页|working（最终线上搜索）|低/中|working：公开岗位JSON/HTML读取成功|

## 实现与边界

- 公开职位GET依据 [Greenhouse官方文档](https://docs.greenhouse.io/job-board.html)、[SmartRecruiters官方文档](https://developers.smartrecruiters.com/docs/endpoints)，以及实际匿名返回的Lever、Ashby职位数据。不调用认证feed或内部接口。
- Workday、Moka、北森、大易、SuccessFactors、Oracle、Taleo没有通过可用公开岗位结构验证，仅记录受限；没有猜API。厂商首页不等于有效职位源。
- generic-career支持真实JSON-LD/JobPosting、有限公开详情HTML、robots声明的同站sitemap；ATS识别只转交已登记且启用的公开接口。当前通用官网暂无稳定独立源启用。
- 并发3；职位HTTP请求最多24，连同缓存操作最多48；每次9秒超时；不自动重试。候选足够35个即停止低优先级来源，单次最多50候选，前端最多15个岗位一次Qwen批量匹配。
- 45分钟缓存键为岗位关键词＋城市＋来源，只保存公开岗位；不缓存简历或个人分析。缓存失败不影响已取得职位。
- WEBSEARCH_ENABLED=false、FREE_MODE=true；保留MCP和原1500计数保护，不调用MCP或收费搜索。
- 实际验证上海2岗：Bosch智能驾驶数据科学家、Sia数据科学与分析咨询岗，均为数据分析相邻岗位，不能称为精准的互联网数据分析师覆盖。Qwen唯一一次批量返回45/25分，未编造缺失要求。完整原链接在direct-source-live-result.json。
- 最终Worker版本：8b5d2497-8044-40a1-8319-5910381a7360。74项离线测试通过；主页面过滤与390px手机布局验证，无横向溢出，浏览器无Console报错。
