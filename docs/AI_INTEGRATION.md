## 最新部署与联调状态（2026-10-05）

以下记录覆盖后文历史交接状态。用户已授权部署。唯一正式目录仍是 C:\Users\WIN10\Documents\ChatGPT\AI-Job-Matcher。

- Wrangler 4.147.0 设备登录成功；补齐 workers_scripts:write 后成功部署现有 ai-job-matcher-api。keep_vars=true/--keep-vars 保留控制台变量和 Secret，没有读取或写入真实 API Key。
- Worker URL：https://ai-job-matcher-api.gaoweishmily.workers.dev
- 版本：5ba4f7c1-58ee-4f50-a4a7-b4a90c7fa4f6。兼容日期调整为 2026-10-04，避免上海日期领先 Cloudflare UTC 的未来日期校验错误。
- 前端真实 endpoint 已设为 https://ai-job-matcher-api.gaoweishmily.workers.dev/api/resume/analyze；默认模型仍是 qwen3.8-flash。全部 29 项自动测试通过。
- 浏览器填入 88 字符合成简历并点击分析，加载/按钮禁用正常；请求以 NETWORK 失败，网页友好恢复，没有切换到模拟分析。没有发送用户真实简历。
- 命令行 OPTIONS 请求连接超时，curl HTTPS 请求也在 15 秒后超时。当前网络无法访问 workers.dev 地址，尚不能验证远端 CORS、百炼认证和真实结构化结果。不能把部署成功等同于 AI 联调成功。
- 下一步先恢复该 Worker URL 的网络可达性，再用一次合成简历验证 Qwen 与真实页面，不需要再次创建密钥，不接真实岗位搜索。不要为了绕过网络问题把真实 API Key 放进前端。

# 第4步：AI分析接入与交接

## 当前模型修订（2026-10-05）

默认模型及Worker配置已统一为qwen3.8-flash。[官方模型页](https://help.aliyun.com/zh/model-studio/qwen3-8-flash)确认可用；[官方价格表](https://help.aliyun.com/zh/model-studio/model-pricing)列明北京100万Token免费额度，账户实际余量/90天有效期以控制台为准。[结构化输出](https://help.aliyun.com/zh/model-studio/qwen-structured-output)支持现有JSON Object以及JSON Schema。本轮不改UI和JSON合同，保留程序校验；按最新兼容接口使用reasoning_effort=none关闭思考，不增加调用次数。

接入改为官方推荐业务空间地址。之后仅需本人填写两个Cloudflare变量：AI_API_KEY（Secret）和AI_BASE_URL（普通环境变量，复制本人北京业务空间的API Host或完整OpenAI-compatible Base URL）。AI_MODEL=qwen3.8-flash、AI_DISABLE_THINKING=true及ALLOWED_ORIGINS由代码/助手配置，不需本人编辑。支持带https的API Host，也支持裸Host；自动补/compatible-mode/v1并调用/chat/completions，不猜WorkspaceId、不填占位域名、不回退旧域名。缺失或非法地址会在发请求前停止。

本轮没有注册、申请/配置真实Key、部署或模型调用。28项测试通过（原26项加Host归一化和缺失/非法Host防请求检查）。此前26项与截图保留为历史验收记录。

2026-10-05。代码完成，默认真实API；无密钥提示配置，不拿演示结果代替真实分析。尚未调用Qwen、创建/发布Worker、部署网页。第三步仍为模拟岗位。沿用原项目和UI，不加数据库、登录、Agent或框架。

## 选定模型及官方核验

选择华北2（北京）的 `qwen3.8-flash` 非思考模式，通过OpenAI-compatible Chat Completions。

- [模型信息](https://help.aliyun.com/zh/model-studio/qwen3-8-flash)：当前可用，文本及结构化输出；短上下文输入0.8元/百万Token、输出2.7元/百万Token，实际以控制台为准。
- [结构化输出](https://help.aliyun.com/zh/model-studio/qwen-structured-output)：使用JSON Object，提示词包含JSON，关闭思考。该模式不保证业务结构，所以程序另外校验字段、类型、长度、原文引用。此模型也支持JSON Schema；本轮保留现有JSON Object加程序校验，不改结果合同。
- [兼容接口](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)：采用官方推荐的北京业务空间专属域名；AI_BASE_URL不设旧端点默认值，之后填入控制台真实API Host或完整兼容Base URL。
- [新人额度](https://help.aliyun.com/zh/model-studio/new-free-quota)：北京模型可享额度，通常100万Token、90天，需检查具体账户/模型余量。已认证账户耗尽后会转付费，必须开启“免费额度用完即停”。不能承诺永久免费。
- [获取API Key](https://help.aliyun.com/zh/model-studio/get-api-key)；[Cloudflare Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)。

## 未来本人配置（当前不执行，不申请Key或部署）

1. 打开 [阿里云百炼](https://bailian.console.aliyun.com/)，本人登录，选择华北2（北京）。开通协议由本人阅读同意。
2. 在“API-Key”页面点击“创建API Key”，本人妥善保存，不发给聊天或普通网页。
3. 在“免费额度”中找到qwen3.8-flash，检查余额/到期时间，打开“免费额度用完即停”。若没有免费额度先停止，不自动充值。
4. 在 [Cloudflare](https://dash.cloudflare.com/) 本人注册/登录。这轮只准备账号，不需要自己编写Worker。
5. 告诉助手“账号已准备好”，不要附上Key。待本人以后授权部署后，助手创建Worker并接好网页；本人在Variables and Secrets填写AI_API_KEY（Secret），以及AI_BASE_URL（普通变量，复制北京业务空间API Host或兼容Base URL）。本轮不执行这些操作。

## 已准备文件与接口

前端 `js/analysis-contract.js`：12,000字符上限、清理/尽力脱敏、固定JSON类型和依据检查、友好错误。
`js/analysis-config.js`：只有公开endpoint和超时，没有Key。`js/analysis-provider.js`：真实resumeText单次调用/取消、显式demo模式。`js/app.js`：真实结果、等待和安全转义展示。

后端 `ai/prompt.mjs` 凝练Skill；`ai/provider.mjs`提供通用兼容API调用；`ai/handler.mjs`做输入、字节数、来源、实例限流、脱敏和错误包装。`server.cjs`本地路由复用相同逻辑，静态白名单不暴露ai、worker、环境或测试文件。`worker/index.mjs`和`worker/wrangler.toml`准备好了无密钥的Worker配置。默认来源仅本地预览，未开放任意网站。

POST /api/resume/analyze 仅接受 `{resumeText: string}`。不接受前端Key、模型、Base URL、system prompt或多份材料。成功 `{mode:"live",analysis:{...}}`；失败 `{error:{code:...}}`，不返回上游正文、凭据或简历。

合同字段：candidateProfile、experienceYears、currentDirection为字符串；coreSkills、workExperienceSummary（含项目）、educationSummary、strengths、weaknesses、missingInformation、evidence为字符串数组；recommendedDirections为title/reason/confidence/evidence对象数组。confidence只能high/medium/low，表示证据充分度。未知说明无法判断；证据必须能在原文找到。引用校验不等于保证所有推断正确。

服务端AI_API_KEY为Secret；AI_MODEL、AI_BASE_URL、AI_DISABLE_THINKING、ALLOWED_ORIGINS为非敏感配置。换DeepSeek/OpenRouter等只改服务端配置，但仍需供应商支持JSON模式并另行在线验证。后续Agent可复用调用边界，不预装框架。

## 原则与实际限制

Skill提取合并1116/1204；诊断1205；1032事实边界和可迁移能力；3818/1199真实项目表达。1032/1200/1201/1203的真实JD优化后置。不拼接原文，不使用宣传、身份伪装、HR批量筛选、入库、市场薪酬或编造成果示例。

不上传文件，只在点击时传清理/脱敏文本。电话、邮箱、证件和联系信息尽力隐藏，但不能保证去掉所有隐私。原文保留内存便于核对，不用数据库或浏览器持久存储。刷新/重传清本站数据，不能撤回外部已收到内容；不承诺AI供应商不留存。

单次输入12,000字符，请求60,000字节，上游返回200,000字节上限；输出4,000Token。一次调用、无自动重试。服务端55秒、客户端65秒超时。实例内每IP每分钟2次，内存条目60秒过期。CORS非身份认证，实例限流非全局费用上限；公开前需复核平台防滥用并开启百炼额度用完停止。

源码没有真实Key；环境文件、Cloudflare缓存、构建输出及原始Skill压缩包被gitignore排除。Worker不启用observability，应用不记录文本或上游正文。网页所有模型内容转义，HTML不可信；简历被JSON包装为待分析数据，不能覆盖系统规则。仍需用户核对AI判断。

## 测试状态

26项自动测试通过（原13项+新增13项）：输入/脱敏、schema/证据、单次协议、兼容模型、缺Key、授权/限流/服务/网络/空内容/坏JSON/截断/超时、前端取消/错误、来源/预检、请求/返回大小、密钥隔离及Worker路由。

浏览器：缺Key明确报错、不显示假分析；合成PDF136字符/DOCX165字符读取正常；隔离工具成功响应后展示完整JSON、加载按钮禁用、展开依据、方向填入表单、7个模拟岗位、升序/筛选、重传清空、分析时切换取消。控制台只有预期NOT_CONFIGURED代码，无敏感信息。390像素手机视口可用宽度375像素，与页面scrollWidth相等，无横向溢出；桌面与手机截图已保存。官方Wrangler 4.147.0 deploy --dry-run打包通过（约19KB），未登录、未发布服务。

tests/preview-ai-stub.cjs仅显式启动端口4174，合成样本和测试字符串凭据只用于本机假fetch，绝不发给模型；正常启动器不使用它。交付前停止工具并关测试标签。成功响应测试不代表Qwen在线验证；实际模型质量、账户额度、Cloudflare网络待本人配置后测试。

## 健康检查部署与网络专项检查（2026-10-05）

- 在现有 ai-job-matcher-api 增加 GET /health，固定返回 {"ok":true,"service":"ai-job-matcher-api"}，不读取 AI 环境变量、不调用 Qwen、无 Token 消耗。其他方法返回 405，AI 路由保持不变。
- 已使用 keep_vars 部署，未修改 AI_API_KEY、AI_BASE_URL；当前版本 457acb25-8d59-4088-8b90-93c8ea7e375f，Cloudflare deployments list 确认 100% 流量。workers_dev=true，部署输出确认原公开路由 https://ai-job-matcher-api.gaoweishmily.workers.dev。
- 30 项自动测试全部通过，包括健康检查无需任何模型配置、GET JSON、POST 405。
- 当前环境访问 https://ai-job-matcher-api.gaoweishmily.workers.dev/health 返回 UND_ERR_CONNECT_TIMEOUT。仅过滤 /health 的实时日志连接也发生 ETIMEDOUT，未能取得日志，不能据此声称没有请求到达。管理 API 能部署/读取部署状态，公开域名及日志网络不可达，提示当前环境存在网络限制或异常解析；最终需用户独立浏览器确认。
- 等待用户打开上述完整 /health 地址并报告是否看到 ok=true。此轮没有新 Qwen 调用，不进入岗位搜索阶段。

## 用户浏览器健康检查确认与首次真实分析交接（2026-10-05）

用户亲自访问 /health 并确认返回 {"ok":true,"service":"ai-job-matcher-api"}。健康检查和当前公开路由已验证可从用户浏览器访问，不再重复排查 /health；执行环境的连接超时不作为部署失败依据。

核对健康检查版本同时包含 POST /api/resume/analyze、共享服务端适配器和 JSON 验证器；默认模型 qwen3.8-flash。前端 endpoint 为 https://ai-job-matcher-api.gaoweishmily.workers.dev/api/resume/analyze，标准入口不含 demo=1，成功只接受 mode=live 并设置 isMock=false。结果展示候选人概况、工作年限、当前方向、技能、工作经历/项目、教育、优势、不足、推荐方向、信息不足及原文依据。错误只在 Console 打印安全错误代码，不打印凭据、请求头或简历。

正式目录本地网页服务已重启，并通过本地 HTTP GET 确认公开脚本使用上述线上地址。没有重新部署、配置环境变量、创建密钥、健康请求或线上 Qwen 调用。本轮不增加模拟结果或岗位搜索。等待用户打开 http://127.0.0.1:4173/ 刷新，上传或粘贴简历，点击“进入简历分析”完成首次真实 Qwen 测试。尚不能宣称真实模型分析已经成功。

## AI 接口连接专项诊断（2026-10-05）

正式目录代码已核对：前端 POST https://ai-job-matcher-api.gaoweishmily.workers.dev/api/resume/analyze 与 Worker 路由完全一致；JSON 为 {resumeText: ...}；服务端读取 env.AI_API_KEY、env.AI_BASE_URL，Bearer 与 JSON Content-Type 正确，Base URL 只补 /chat/completions，默认 qwen3.8-flash。Secret 名称列表确认 AI_API_KEY 仍存在，没有读取值或修改任何用户配置。

新增本地开发按钮“检查 AI 连接（不消耗额度）”：发送同一接口的空文本 JSON POST，自动经过浏览器 OPTIONS 预检，Worker 在模型调用前返回 400/EMPTY_INPUT；这表示连接成功而非分析失败。CORS 对当前 http://127.0.0.1:4173 允许 POST/OPTIONS/Content-Type，错误响应也保留 Origin 和请求编号。

现场实测连接检查成功，响应 400/EMPTY_INPUT，requestId=b9002d6a-774f-4fcd-b256-824a075b1674。可排除当前代码的路径/字段不一致；当前跨域预检与 POST 可读响应已验证。连接成功不证明模型调用成功。

仅做一次 88 字符合成简历的真实调用，仍报 NETWORK。旧诊断把 Console 对象简化显示为 Object，未能取得那次调用的 HTTP 状态；不能据此断言是否为 Worker 上游连接失败或浏览器断连。原错误代码 NETWORK 在两层复用，已修复：Worker 百炼连接异常改为 UPSTREAM_NETWORK；浏览器未收到响应保持 NETWORK，开发界面追加 HTTP 状态或未取得状态提示。

已添加安全 Console 文本 JSON：请求 URL、HTTP status、固定中文 code/message、requestId、上游 HTTP 状态；无密钥、请求头或简历正文。Worker 只记录相同状态元数据，开启 Workers Logs 且 invocation_logs=false，不记录默认调用请求信息。日志配置遵循 https://developers.cloudflare.com/workers/observability/logs/workers-logs/ 。此前 observability=false 没有可还原的历史应用日志；Wrangler 实时日志尾流连接 ETIMEDOUT，Cloudflare 控制台加载也超时，故没有伪造历史日志或声称原请求已到达。

34 项离线测试通过，含零模型连接检查、预检/POST CORS、上游状态、日志隐私、两段 NETWORK 区分。最新部署版本 9d5130ae-f343-4ff5-b2b0-27c28abffda8，现有 ai-job-matcher-api 已重新部署；keep_vars 保留 AI_API_KEY 和 AI_BASE_URL。本地 HTTP 确认最新脚本正在提供。后续不再自动模型请求，等待用户刷新原网页后测试一次并提供页面提示及 Console 中 AI request 记录，不接岗位搜索。

## 北京专属地址的网络层兜底（2026-10-05）

用户已在浏览器确认 UPSTREAM_NETWORK / HTTP 502，并明确授权北京共享地址兜底。AI_BASE_URL 仍为首选，未修改 Cloudflare AI_BASE_URL 或 AI_API_KEY。只有北京业务空间域名在尚未取得任何 HTTP 响应时的网络异常/连接超时才调用一次 https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions；共享地址、其他地域和其他提供商不触发此兜底。官方地址依据：https://help.aliyun.com/en/model-studio/base-url 。

最多首选一次+共享一次，使用相同现有 Key、qwen3.8-flash、JSON Object、消息和安全规则。总预算仍为55秒，首选连接预算最多15秒，为共享请求保留剩余时间；取得首选 HTTP 响应后，正文解析仍受总预算限制且绝不切换。任何 HTTP 状态（包含301/400/401/403/404/429/500）、无效JSON、正文读取失败不会兜底。重定向采用manual，保留HTTP状态且不将Authorization转发到重定向地址；无效控制字符凭据会在请求前阻止，不修改远端Secret。

上游安全日志仅含 attempt(primary/fallback)、upstreamHost、status、errorType、返回的安全requestId；不包含Key、Authorization、完整正文或原始异常信息。两地址网络失败返回 UPSTREAM_FALLBACK_FAILED / HTTP 502；共享超时返回 UPSTREAM_FALLBACK_TIMEOUT / HTTP 504；真正的 HTTP 错误保留upstreamStatus和原有错误分类。

39 项离线测试通过，覆盖两次上限、共享成功、两地址失败、HTTP错误不切换、收到200后读取失败不切换、首选超时兜底、其他提供商隔离和日志隐私。现有 ai-job-matcher-api 重新部署成功，版本 1374700f-1e06-430c-af52-d76947be18bc。部署使用keep_vars，原配置保留；本轮无线上Qwen调用、不重复网络排查、不修改页面设计、不进入岗位搜索。等待用户刷新本地网页并重新测试。

## 严格结构化输出最小修复（2026-10-05）

用户确认链路和上游网络正常，当前错误为 INVALID_RESULT/502。仅修改请求的结构化输出与校验：北京百炼 HTTP JSON 顶层 enable_thinking=false，response_format={type:json_schema,json_schema:{name:resume_analysis,strict:true,schema:...}}。schema 所有根字段与推荐方向子字段 required，两个对象层 additionalProperties=false。保留当前网页使用的顶层 evidence 字段；10 个用户要求字段均存在，方向包含 title/reason/confidence/evidence，confidence=high/medium/low。未知信息允许占位字符串和空数组，不猜造经历；引用若存在仍需匹配真实原文。

只解析 choices[0].message.content，JSON.parse 后做本地类型/字段/证据检查，不读 reasoning_content，不调用第二个修复模型。既有网络兜底逻辑保持原样：HTTP 已返回或结果异常绝不切换/重试。API Key、AI_BASE_URL、模型 qwen3.8-flash、Cloudflare 配置文件和 UI 均未改变。

错误分类：网络段沿用 UPSTREAM_NETWORK 与已有网络兜底错误；上游真实 HTTP 错误为 MODEL_HTTP_ERROR，保留 upstreamStatus；不可解析为 INVALID_JSON；字段/类型/依据失败为 INVALID_SCHEMA，缺失字段通过白名单 missingFields 显示，例如 missing strengths。开发日志只记录模型、finish_reason、content存在与字符长度、JSON解析是否成功、已知缺失字段及已有安全上游元数据，无原文、完整模型内容、密钥和敏感请求头。

官方格式核验：https://help.aliyun.com/zh/model-studio/qwen-structured-output ；模型支持信息：https://help.aliyun.com/zh/model-studio/qwen3-8-flash 。42项离线测试通过，包含严格请求体、空信息、reasoning_content忽略、JSON/Schema区分、缺失字段安全展示、单次模型请求与原网络兜底回归。现有 ai-job-matcher-api 已部署版本 bbc39c80-ac64-4c93-86ee-2f7b951e1fdb。使用 keep_vars，未配置任何Secret；本地HTTP确认新脚本可用。未做真实Qwen调用，等用户刷新并以同一简历测试一次，不进入岗位搜索。

## 简化结果类型与安全归一化（2026-10-05）
用户浏览器确认 INVALID_SCHEMA/502。旧校验要求摘要和依据为数组、confidence为固定枚举、额外顶层evidence及原文精确匹配；这些限制与本轮指定的简单类型不一致，未取得上次失败的具体字段日志，不声称已确定单一触发项。

当前Schema、前后端共享校验器和页面展示统一为10个字段：candidateProfile/experienceYears/currentDirection/workExperienceSummary/educationSummary为string；coreSkills/strengths/weaknesses/missingInformation为string[]；recommendedDirections为对象数组，title/reason/confidence/evidence全部string。全部required，对象additionalProperties=false，请求json_schema严格模式及enable_thinking=false不变。无需额外顶层evidence或confidence枚举。

JSON.parse后先normalizeAnalysisResult再validate：数字年限和推荐程度转为“年”和“%”字符串，单个字符串列表包装为数组，缺失/null字符串填“简历中未提供足够信息”，缺失/null列表为空数组；兼容旧字符串数组摘要和依据仅连接原有文本。仅选取已知字段，不修改原对象、不补写经历技能成果，无法安全转换的对象/布尔等仍INVALID_SCHEMA。页面对所有结果继续HTML转义；原有模拟岗位及显式开发demo模式保留。

45项离线测试通过，包含归一化、Schema一致性、缺失信息、非法类型、真实模式200响应、单次模拟模型请求、日志隐私及原功能回归。未调用线上Qwen。最终部署现有ai-job-matcher-api成功，版本33e24a5e-6b5c-43fc-b056-bcfae0c6f8cc；keep_vars保留远端AI_API_KEY及AI_BASE_URL，未修改Cloudflare配置文件/环境变量、模型、网络兜底或岗位搜索。本地预览已就绪，等待用户刷新原网页，用同一简历测试一次。
## 第5步完成（2026-10-05）
正式项目检查点：1d8c223，tag checkpoint-resume-ai-working。10家Greenhouse/Lever/Ashby公开源接入；真实岗位经普通JS筛选后一次最多10岗Qwen批量匹配，复用原API配置。54项离线测试通过。浏览器真实10岗评分成功一次，原始Stripe招聘页可打开；另一次上游临时超时已保留未评分真实岗位，停止继续AI调用。公开源最终读到3871岗，手机390px单列无横向溢出。最终现有Worker部署版本a646e95a-ad84-48e0-b4a8-97645d34623b，keep_vars保留Secret和Base URL；本地预览已提供最新脚本。详见PUBLIC_JOBS.md。本轮没有Agent、Pages、数据库、登录或仓库推送。