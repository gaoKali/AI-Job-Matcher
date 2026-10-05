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
