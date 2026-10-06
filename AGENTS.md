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


## 2026-10-06 最新授权：本地 PDF 优化报告
用户授权仅增加完整优化报告PDF导出，不做Word/模板/云保存。检查点0dff450。独立report-print.js与print-report.css、成功结果顶部下载按钮；window.print仅当前结果，0新增AI，后台和Worker配置不变无需部署。130项测试通过，11页真实Chromium A4样本逐页核对全文与中文；短卡保留、长卡重复表头，原页面折叠不影响导出。测试provider只用于临时验收，不得进入正式入口。详见docs/PDF_REPORT_EXPORT.md。

## 2026-10-06 MVP 冻结（最新边界）
已完成PDF最后质量收尾，检查点444e211。完整稿不强制另起页，按原有换行自然分页；系统真实性占位仅在独立提醒区；首次有效导出提示关闭浏览器页眉页脚。134测试通过、10页真实合成PDF逐页验收、全文尾部完整，无新增AI或Worker变更。详见docs/MVP_FREEZE.md与docs/PDF_REPORT_EXPORT.md。停止新增功能，等待用户新授权；不要恢复旧岗位搜索方向。

## 2026-10-06 最新授权：插画手账视觉改版
用户重新授权Landing Page与整站UI。改版前检查点7da118d；新增brand.css、原创story-scene.svg/companion.svg，保留三步业务DOM及AI逻辑。标题用本机楷体后备，不安装字体/框架；屏幕样式独立，PDF仅统一墨绿并实测全文完整。134测试通过，正式PDF/DOCX解析及手机/桌面布局回归；隔离合成provider验证分析/优化显示，本轮0线上AI调用。详见docs/ILLUSTRATED_UI.md。不要部署Pages、改Worker配置或增加搜索/Agent/登录/数据库。

## 最新视觉要求：纯黑白与用户提供人物
用户2026-10-06提供两张戴眼镜人物图，要求黑白线稿并用于Logo，覆盖上轮原创小怪兽视觉。检查点a43b3b0；内置imagegen线稿转换资产已保存正式assets，保留原第一图署名水印。生成式编辑不保证逐像素不变，不宣称完美复刻。业务逻辑不改，页面不再显示旧SVG角色；PDF黑白专业版，来源和验收见docs/ILLUSTRATED_UI.md。

## 最新视觉收尾：吸管杯为主角
2026-10-06用户要求吸管杯人物用于首屏及头像，去除右下角水印，各元素融入白色背景，每步少量装饰。检查点20b36c2；新character-drink-clean.png通过内置imagegen局部清理，旧原图保留。屏幕混合/渐隐与无硬框宣传区域，三步小装饰放在标题外侧。AI/Worker/配置/报告逻辑未改；134测试通过，桌面及390px验收无溢出、图片加载正常。按用户新授权覆盖此前“保留水印”边界。

## 2026-10-06 UI正式锁定与最终验收
用户锁定当前黑白手绘/漫画/留白、Logo、人物与Landing结构；不得重新设计或新增装饰，只允许响应式/可读性/交互缺陷修复。验收前检查点baf551c；135测试通过，真实Qwen分析及优化各一次HTTP200，长PDF10页检查通过；5种视口验收，无岗位搜索正常入口。分析实测发现责任升级与专业扩写，前端基础事实校正回退原文并增加测试，不能宣称全面语义防编造。两张无损WebP与原PNG逐像素一致、体积减42.7%。参见docs/FINAL_MVP_ACCEPTANCE.md。Worker/Prompt/模型/Secret/BaseURL不改；JOBS_ENABLED及WEBSEARCH_ENABLED=false；不部署Pages，等待本人确认下一轮上线。

## 2026-10-06 最新授权：公开上线前保护（未上线）
以8738cdc为可用MVP。仅AI接口边界、匿名计数、首次Turnstile会话及对应安全提示/CSP；UI布局、Prompt、模型、PDF不动。PUBLIC_AI_ENABLED/FREE_PUBLIC_MODE=true，分析优化共享2次/60秒、10次/IP/北京时间日、100次/全站/日；每个实际上游尝试含既有fallback原子预留。新增Free SQLite AI_USAGE、按日HMAC匿名IP、30分钟签名会话；不存简历JD输出。148测试与Wrangler dry-run通过，0真实模型测试。尚未部署：等待用户创建Managed Widget并在已有Worker填TURNSTILE_SITE_KEY普通变量、TURNSTILE_SECRET_KEY Secret，之后再部署迁移并真人验收。不得宣称当前线上保护已生效。见docs/PUBLIC_AI_SECURITY.md。不要发布Pages或启用历史岗位方向。

## 2026-10-06 保护版本已正式部署（覆盖上条未部署状态）
用户自行配置Turnstile两变量后已授权继续部署。现有ai-job-matcher-api版本f7ad89af-a663-4666-8d7a-09f976a63820，AI_USAGE迁移/绑定生效。148测试全通过；正式本地页面真实Widget自动通过、服务端Siteverify及签名会话成功，分析/优化各一次HTTP200，优化复用会话，没有代点人工验证码，没有额外Qwen测试调用。实际限额边界由mock测试验证，不消耗100次模型。Secret/BaseURL/UI/Prompt/PDF/模型未变，无新Worker或Pages。见docs/PUBLIC_AI_SECURITY.md。

## 最新授权：GitHub Pages 公测发布准备
只允许公开部署及生产配置，不修改已锁定 UI/插画/Prompt/解析/优化/PDF/安全策略。150 项测试通过，静态资源白名单构建和子路径验收完成，当前尚未上传 GitHub。用户要求 GitHub 登录/授权、创建仓库确认、Pages 开关、Turnstile 正式 hostname 需要本人操作时暂停。当前 gaoKali 的 AI-Job-Matcher Public 创建表单已填写，等待本人点击；实际发布和公开 AI 验收完成前不得创建 Public MVP v1.0 标签。详情见 docs/GITHUB_PAGES_RELEASE.md。保留现有 Worker、Secret/BaseURL、全部限额及关闭岗位搜索/MCP。
