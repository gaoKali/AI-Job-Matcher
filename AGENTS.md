# 唯一正式项目与操作边界

唯一正式项目根目录：C:\Users\WIN10\Documents\ChatGPT\AI-Job-Matcher

- 所有后续代码修改、测试、运行和部署，必须以本目录为工作目录，并明确设置工具 workdir 为此完整路径。
- 不因会话默认 cwd 为 C:\Users\WIN10\Desktop\job-workbench 而在其内开发本产品。
- job-workbench 内含旧 Next.js 项目；其 local-prototype 是此前使用的暂存/测试副本，不是本产品正式目录，也不是 Git worktree。不得再在副本编辑后同步作为日常开发流程。
- 如正式目录写入受工具权限限制，直接对本目录请求所需的执行权限；不改用副本。不得覆盖用户的新文件或更新版本。
- 本产品使用现有原生 HTML/CSS/JavaScript，不改为 React/Vue/Next.js，保留本地 PDF/DOCX 解析和真实简历分析；模拟岗位只可用于测试，正常流程使用真实公开岗位。
- 默认模型 qwen3.8-flash；Worker 目标 ai-job-matcher-api；仅服务端读取 env.AI_API_KEY 和 env.AI_BASE_URL。
- 保留 Cloudflare 控制台配置，keep_vars=true，不将空 AI_BASE_URL 写入部署配置覆盖远端值；禁止读取/打印/写入真实 API Key 到代码、聊天或 Git 可提交文件。
- 用户已明确恢复并授权部署。2026-10-05 已成功部署 ai-job-matcher-api；当前网络连接 workers.dev 超时，真实 Qwen 联调尚未成功。用户已亲自验证 /health 成功，停止重复排查健康检查；连接代码已完成，等待用户浏览器首次真实 AI 测试，仍不接真实岗位搜索。

## 目录核对记录（2026-10-05）

254 个源码、资产、测试及文档文件经 SHA-256 比较。最新 Worker、CORS、模型配置及所有有效代码已经在正式目录，未发现仅副本存在而需要补回的有效修改。唯一文档差异是正式目录 AI_INTEGRATION.md 更新，保留正式版本。副本 .worker-check 构建产物排除，不作为源码同步。

本目录 29 项自动测试通过。启动器 cwd=__dirname，静态服务文件路径也基于 __dirname，因此从本目录启动仅运行本目录文件。正式原始 Skill 压缩包及已有功能完整保留。Wrangler 授权等待已经结束，本轮没有部署。

## 最新上游连接规则（2026-10-05）
用户确认 Worker → 百炼 UPSTREAM_NETWORK/502。按用户明确授权，仅北京专属地址在尚未取得 HTTP 响应的网络异常/超时可兜底一次官方共享地址，最多1+1，HTTP/JSON/已收到响应后的错误不切换，其他提供商不兜底。39项离线测试通过，最新Worker版本1374700f-1e06-430c-af52-d76947be18bc已部署，待用户浏览器验证，不自动调用模型、不再排查前端CORS或健康检查。

## 当前第5步边界（覆盖历史暂停搜岗状态）
用户已确认第4步成功，授权本轮公开岗位接入。10家固定公开源、普通JS筛选、Qwen一次最多10岗批量匹配已实现；不接收费源/爬虫，不做Agent，不部署Pages，不加数据库/登录。开发前Git检查点1d8c223，tag checkpoint-resume-ai-working。54项离线测试通过；真实一次10岗评分成功，另一次临时上游超时已有未评分提示，停止自动模型测试。后续参考docs/PUBLIC_JOBS.md，不重新配置任何已有Secret。


## 第5步最新最终边界
最新用户要求实时百炼WebSearch MCP三平台搜索，不继续固定国内公司库方案。参考docs/WEBSEARCH_MCP.md。FREE_MODE=true，WEBSEARCH_ENABLED=false；不确认上游免费保护时绝不执行MCP，也不虚构free_only参数。不得将FREE_MODE切为false规避用户零费用要求。开通待本人操作；不要求新Key、不读/改AI_API_KEY或AI_BASE_URL；不做Agent。


## 最新授权：本人已开通，1500次持久安全上限
用户授权启用WebSearch MCP；FREE_MODE=true，WEBSEARCH_ENABLED=true，必须通过持久SearchBudget事务先预留后调用，最多累计1500，不重置、不退失败次数。新优先依据ai/search-budget.mjs与docs/WEBSEARCH_MCP.md最后记录，覆盖之前未开通禁用状态。不修改已有Secret/Base URL，不新建Worker，不自动用付费搜索。

## 最新第5步授权（直接公开读取）
用户要求MCP默认关闭，保留代码和原计数。公开来源先审计后接入；禁止逆向私有API、Cookie登录和访问限制绕过。新增来源允许公开HTML/JSON-LD/官方API，固定请求总额、隔离失败、缓存只存公开职位；继续部署同一Worker。


## 2026-10-05 最新第5步：直接公开职位采集（覆盖之前MCP优先方案）
WEBSEARCH_ENABLED=false，保留MCP与已有ATS代码，不重置计数。采用独立来源注册表、公司seed、公开适配器；30家公司登记、22个ATS公司源通过，国内平台自动读取受限，普通入口不计岗位。45分钟公开职位缓存、并发3、HTTP24/含缓存48总额、15岗一次Qwen批量匹配、失败隔离。当前上海数据相关实测2岗，Qwen一次评分成功；74项离线测试通过，同一Worker最终版本8b5d2497-8044-40a1-8319-5910381a7360。细节见docs/JOB_SOURCE_AUDIT.md与docs/direct-source-live-result.json。未完成国内广泛覆盖及15种平台目标，不得宣称已完成；不继续Agent/Pages/登录/数据库。


## 最新：仅企业官方大陆岗位（覆盖所有之前第5步方案）
Git安全检查点d5850a5。company-sources独立登记117家，仅20家实际获得大陆职位并启用；全部为外企在华岗位。国央企23/民企29/外企65为登记数，不是working数。公共DO职位池4小时、按需最多6家公司/并发3/HTTP38/总采集75秒、最多15岗一次匹配。第三方招聘平台及MCP默认关闭但代码保留，无付费搜索API。实测557个池记录；上海数据3/上海产品6/北京软件0/深圳算法0，禁止以异地或模拟职位填空。一次真实3岗Qwen批量成功；缺JD后端防猜测回归验证，81项测试通过。同一Worker版本04abb287-9072-45d8-a81a-e30f1abb24f7。未修改Key/Base URL/qwen3.8模型。详见docs/COMPANY_JOB_POOL.md，不能宣称117家均可用；不继续Agent/Pages/登录。

## 当前正式方向：AI 简历优化（覆盖所有历史岗位方案）
用户最新要求第三步改为用户粘贴真实JD的AI简历优化。保留前两步及旧源码；正常产品不得再搜索/抓取/匹配岗位。JOBS_ENABLED=false、WEBSEARCH_ENABLED=false。保持qwen3.8-flash，现有Worker/Secret/Base URL不变。优化一次显式点击仅一次模型，不自动重试。只重述原文，无依据建议单独列出；完整稿从核对后的片段应用到原文，保留时间公司教育。见docs/RESUME_OPTIMIZATION.md。检查点4dee80c，不开发Agent/登录/数据库/Pages/导出。

本轮验收：93项测试通过，真实中文/英文JD优化、无项目/有项目、复制、重新优化及手机布局验证成功。Worker最终版本759bbe8c-4618-4f33-b898-57341be79b05，未修改Secret/Base URL。正常流程不得重新加载旧职位脚本。


## 2026-10-06 简历优化质量验收
检查点d603e9e；121项测试通过。按原文经历块核对身份/时间/数字单位/技能/责任等级，未确认改写保留原文并标记建议确认真实性，不拒绝整份结果；优势说明也核对。全文按原文位置应用卡片同一改写，建议不进入全文，长度最多1.2倍，语言跟随原简历。中文和英文JD各一次真实优化成功，复制和手机布局通过。仍每次一次qwen3.8-flash，不改Key/BaseURL或服务配置、不启用搜索。Worker版本f7cf6e20-58b5-401c-86d6-7843d6ed5b82。细节和保守核对的限制见docs/OPTIMIZATION_QUALITY_REVIEW.md。
