# 企业官方职位池（当前第5步）

当前正式目录：C:\Users\WIN10\Documents\ChatGPT\AI-Job-Matcher。Git检查点 d5850a5。

## 当前真实覆盖

登记 117 家企业：国央企 23 家、民企 29 家、外企 65 家。只有20家实际获得大陆职位并启用；均为外企在中国招聘。其余来源不自动请求，不把页面能打开当作岗位能读取。100家登记目标已达到，100家稳定采集目标尚未达到，不得混淆。

112个新主页调查记录见 COMPANY_SOURCE_RESEARCH.json；其中包含未证实的调查线索，不能全部算作已登记企业。Not Found、错误企业租户、第三方招聘平台代页及普通非招聘首页已从新登记记录排除。旧公司与ATS公开接口证据保留在 JOB_SOURCE_AUDIT.md。

启用企业：Databricks、Bosch、Inter IKEA、Ubisoft、AECOM、Western Digital、Sia、EY、Vitol、NielsenIQ、Louis Dreyfus Company、Eurofins、Roland Berger、BEUMER Group、Expeditors、Third Bridge、AUMOVIO、Avery Dennison、Continental ContiTech、Wabtec。

稳定适配：SmartRecruiters 官方公开 API（18家）、Greenhouse（Databricks）、SuccessFactors公开HTML（EY）。Lever/Ashby及通用JSON-LD/公开HTML/sitemap解析代码保留；当前未取得可启用的大陆来源。Workday、Moka、北森、大易、Oracle等未因名称而擅自调用隐藏接口。

## 产品流程

正常流程只请求企业官方公开岗位，不读取第三方招聘平台、不调用MCP。公司名单独立放在 js/company-sources.js；只存公司与招聘入口配置，不写死职位。SmartRecruiters登记的是已验证的企业公开职位集合API地址，而不是某一条固定职位链接。js/job-keyword-aliases.js 独立维护岗位与城市别名。

企业级职位池与用户查询分离，公共数据缓存4小时。每次搜索只更新最多6家过期企业，并发3，公开HTTP最多38次，单请求10秒，总采集75秒。DO快照及保存最多4次，整体不超过42个子请求。超过预算停止较低优先级请求。失败隔离；第一次失败冷却30分钟，连续3次失败冷却6小时。无定时后台任务。

Cloudflare CompanyJobPool仅保存公开职位，不接受简历、画像、用户条件或个人AI结果；内部DO路径不对外公开。SQLite Durable Objects在Cloudflare免费计划有免费额度，超额时应按账户计划核对限制，不能承诺所有Cloudflare/Qwen用量永久免费。没有新增付费搜索API、付费数据库或代理。原 SearchBudget 与已用MCP计数保留，不重置。

SmartRecruiters列表返回真实公开职位ref。只有选中的最多15个候选才读取该公开ref，取其实际postingUrl/applyUrl；不能把API ref显示成申请链接，也不拼职位URL。中国大陆范围明确限定，港澳台及未限定中国的全球远程排除。目标城市保留别名匹配或明确Remote China，其他明确城市不会因China字样混入。

按URL、公司、岗位名称（忽略空格差异）与城市去重；先标题、城市、部门及描述规则筛选，行业只加分。最多50个相关候选、最多15个一次Qwen批量匹配。岗位/URL全部来自源，AI只评分及解释。JD只使用公开职责与资格要求，不把企业宣传/福利补写成JD；没有JD时后端强制低可信度并输出固定信息不足提示。

## 实测与边界

现有职位池557个大陆公开记录。数据分析师+上海3个，产品经理+上海6个，软件工程师+北京0个，算法工程师+深圳0个。全部带真实页面URL后才展示。已直接打开5个原始职位网页验证标题与企业；未登录、无Cookie或验证码绕过。具体记录在 company-pool-live-result.json。

完整页面用合成简历验证：一次真实简历AI分析、一次3岗批量匹配，得分65/40/35并按分数排序。公司/企业类型/行业筛选可操作，空结果正常，不展示模拟职位。浏览器Console无错误。手机390px检查无横向溢出。缺JD防护新增离线回归，不重复模型调用。81项离线测试通过。

已部署到现有 ai-job-matcher-api，版本04abb287-9072-45d8-a81a-e30f1abb24f7。AI_API_KEY、AI_BASE_URL未修改；默认qwen3.8-flash。WEBSEARCH_ENABLED=false、FREE_MODE=true。后续不得宣称国内广泛覆盖或所有117家working，不开启Agent/登录/付费服务/Pages。

## 官方依据

- SmartRecruiters公开职位接口：https://developers.smartrecruiters.com/docs/endpoints
- 中国地域筛选与公开列表：https://developers.smartrecruiters.com/docs/customer-overview
- Cloudflare Durable Objects免费能力：https://developers.cloudflare.com/durable-objects/platform/pricing/
- 存储限制：https://developers.cloudflare.com/durable-objects/platform/limits/

## 企业来源登记与状态

|企业|类型|ATS/方式|状态|自动启用|真实招聘入口|
|---|---|---|---|---|---|
|Cloudflare|外企|greenhouse|limited|否|https://job-boards.greenhouse.io/cloudflare|
|Stripe|外企|greenhouse|limited|否|https://job-boards.greenhouse.io/stripe|
|Databricks|外企|greenhouse|working|是|https://job-boards.greenhouse.io/databricks|
|GitLab|外企|greenhouse|limited|否|https://job-boards.greenhouse.io/gitlab|
|Spotify|外企|lever|limited|否|https://jobs.lever.co/spotify|
|Palantir|外企|lever|limited|否|https://jobs.lever.co/palantir|
|OpenAI|外企|ashby|limited|否|https://jobs.ashbyhq.com/openai|
|Notion|外企|ashby|limited|否|https://jobs.ashbyhq.com/notion|
|Ramp|外企|ashby|limited|否|https://jobs.ashbyhq.com/ramp|
|Perplexity|外企|ashby|limited|否|https://jobs.ashbyhq.com/perplexity|
|Epic Games|外企|greenhouse|limited|否|https://job-boards.greenhouse.io/epicgames|
|Figma|外企|greenhouse|limited|否|https://job-boards.greenhouse.io/figma|
|Anthropic|外企|greenhouse|limited|否|https://job-boards.greenhouse.io/anthropic|
|Airbnb|外企|greenhouse|limited|否|https://job-boards.greenhouse.io/airbnb|
|Linear|外企|ashby|limited|否|https://jobs.ashbyhq.com/linear|
|Bosch|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/BoschGroup/postings|
|Inter IKEA|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/InterIKEAGroup/postings|
|Ubisoft|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/Ubisoft2/postings|
|SGS|外企|smartrecruiters|limited|否|https://api.smartrecruiters.com/v1/companies/SGS/postings|
|AECOM|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/AECOM2/postings|
|Western Digital|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/WesternDigital/postings|
|Sia|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/Sia/postings|
|腾讯|民企|generic-career|limited|否|https://careers.tencent.com/search.html|
|百度|民企|generic-career|limited|否|https://talent.baidu.com/|
|阿里巴巴|民企|generic-career|limited|否|https://talent.alibaba.com/|
|字节跳动|民企|generic-career|limited|否|https://jobs.bytedance.com/experienced/position|
|网易|民企|generic-career|limited|否|https://hr.163.com/job-list.html|
|小米|民企|generic-career|limited|否|https://hr.xiaomi.com/|
|米哈游|民企|generic-career|limited|否|https://join.mihoyo.com/|
|JetBrains|外企|generic-career|limited|否|https://www.jetbrains.com/careers/jobs/|
|中国移动|央企|generic|limited|否|https://job.10086.cn/|
|中国电信|央企|generic|limited|否|https://job.chinatelecom.com.cn/wt/TELE/web/index|
|国家电网|央企|generic|unavailable|否|https://zhaopin.sgcc.com.cn/|
|南方电网|央企|generic|limited|否|https://zhaopin.csg.cn/|
|国家能源集团|央企|generic|limited|否|https://zhaopin.chnenergy.com.cn/|
|中国石化|央企|generic|limited|否|https://job.sinopec.com/|
|中国石油|央企|generic|unavailable|否|https://zhaopin.cnpc.com.cn/|
|中国华能|央企|generic|limited|否|https://zhaopin.chng.com.cn/|
|中国核工业|央企|北森|limited|否|https://cnnc.zhiye.com/|
|中国电建|央企|generic|limited|否|https://zhaopin.powerchina.cn/|
|中国建筑|央企|北森|limited|否|https://cscec.zhiye.com/|
|中国交建|央企|北森|limited|否|https://ccccltd.zhiye.com/|
|中国南方航空|央企|generic|limited|否|https://job.csair.com/|
|中国东方航空|央企|generic|limited|否|https://job.ceair.com/|
|招商局集团|央企|北森|limited|否|https://cmhk.zhiye.com/|
|工商银行|央企|generic|unavailable|否|https://job.icbc.com.cn/|
|建设银行|央企|generic|unavailable|否|https://job.ccb.com/|
|农业银行|央企|generic|unavailable|否|https://career.abchina.com/|
|交通银行|央企|generic|unavailable|否|https://job.bankcomm.com/|
|中国人寿|央企|北森|limited|否|https://chinalife.zhiye.com/|
|中国人保|央企|北森|limited|否|https://picc.zhiye.com/|
|北京银行|国企|北森|limited|否|https://bankofbeijing.zhiye.com/|
|华为|民企|generic|limited|否|https://career.huawei.com/cn/social-recruitment|
|联想|民企|generic|limited|否|https://talent.lenovo.com.cn/position|
|比亚迪|民企|generic|limited|否|https://job.byd.com/|
|美团|民企|generic|limited|否|https://zhaopin.meituan.com/|
|京东|民企|generic|limited|否|https://zhaopin.jd.com/|
|拼多多|民企|generic|limited|否|https://careers.pinduoduo.com/|
|携程|民企|generic|limited|否|https://careers.ctrip.com/|
|快手|民企|generic|limited|否|https://zhaopin.kuaishou.cn/|
|滴滴|民企|generic|limited|否|https://talent.didiglobal.com/|
|哔哩哔哩|民企|generic|limited|否|https://jobs.bilibili.com/|
|OPPO|民企|generic|limited|否|https://careers.oppo.com/|
|vivo|民企|generic|limited|否|https://hr.vivo.com/|
|荣耀|民企|generic|limited|否|https://career.honor.com/|
|大华|民企|北森|limited|否|https://dahua.zhiye.com/|
|中兴通讯|民企|generic|limited|否|https://job.zte.com.cn/|
|格力|民企|generic|unavailable|否|https://job.gree.com/|
|美的|民企|generic|limited|否|https://careers.midea.com/|
|吉利|民企|generic|unavailable|否|https://job.geely.com/|
|宁德时代|民企|generic|unavailable|否|https://careers.catl.com/|
|招商银行|国企|generic|limited|否|https://career.cmbchina.com/|
|平安集团|民企|generic|limited|否|https://talent.pingan.com/|
|迈瑞医疗|民企|北森|limited|否|https://mindray.zhiye.com/|
|药明康德|民企|北森|limited|否|https://wuxiapptec.zhiye.com/|
|西门子|外企|generic|limited|否|https://jobs.siemens.com.cn/siemens/position/index|
|SAP|外企|generic|blocked|否|https://jobs.sap.com/|
|Microsoft|外企|generic|limited|否|https://careers.microsoft.com/|
|Apple|外企|generic|limited|否|https://jobs.apple.com/|
|Oracle|外企|generic|limited|否|https://careers.oracle.com/|
|Amazon|外企|generic|limited|否|https://www.amazon.jobs/|
|IBM|外企|generic|limited|否|https://www.ibm.com/careers/|
|NVIDIA|外企|Workday|limited|否|https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite|
|Google|外企|generic|unavailable|否|https://www.google.com/about/careers/applications/jobs/results/|
|AMD|外企|generic|limited|否|https://careers.amd.com/|
|Qualcomm|外企|generic|limited|否|https://careers.qualcomm.com/|
|Intel|外企|Workday|limited|否|https://jobs.intel.com/|
|Tesla|外企|generic|blocked|否|https://www.tesla.com/careers/search/|
|Cisco|外企|generic|limited|否|https://jobs.cisco.com/|
|Bayer|外企|SAP SuccessFactors|limited|否|https://jobs.bayer.com/|
|Schneider Electric|外企|generic|limited|否|https://careers.se.com/|
|Accenture|外企|generic|limited|否|https://www.accenture.com/us-en/careers|
|Honeywell|外企|generic|limited|否|https://careers.honeywell.com/|
|BASF|外企|generic|unavailable|否|https://basf.jobs/|
|PwC|外企|generic|limited|否|https://www.pwccn.com/en/careers.html|
|KPMG|外企|generic|limited|否|https://kpmg.com/cn/en/home/careers.html|
|EY|外企|successfactors|working|是|https://careers.ey.com/|
|Deloitte|外企|generic|limited|否|https://jobs.deloitte.com/|
|Nestlé|外企|generic|blocked|否|https://www.nestle.com/jobs|
|Unilever|外企|generic|limited|否|https://careers.unilever.com/|
|Roche|外企|generic|limited|否|https://careers.roche.com/|
|P&G|外企|generic|limited|否|https://www.pgcareers.com/|
|Novartis|外企|generic|limited|否|https://www.novartis.com/careers/career-search|
|L’Oréal|外企|generic|limited|否|https://careers.loreal.com/|
|AstraZeneca|外企|generic|limited|否|https://careers.astrazeneca.com/|
|Vitol|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/Vitol/postings|
|NielsenIQ|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/NielsenIQ/postings|
|Louis Dreyfus Company|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/LouisDreyfusCompany/postings|
|Eurofins|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/Eurofins/postings|
|Roland Berger|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/RolandBerger/postings|
|BEUMER Group|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/BEUMERGroup1/postings|
|Expeditors|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/Expeditors/postings|
|Third Bridge|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/ThirdBridge/postings|
|AUMOVIO|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/Aumovio/postings|
|Avery Dennison|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/AveryDennison/postings|
|Continental ContiTech|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/ContinentalGroupSectorContiTech/postings|
|Wabtec|外企|smartrecruiters|working|是|https://api.smartrecruiters.com/v1/companies/Wabtec/postings|
