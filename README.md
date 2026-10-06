# 向前 · AI 简历分析与优化

向前帮助求职者基于真实经历整理简历，对照目标岗位 JD 改善表达。当前 MVP 无岗位搜索、账号系统或云端简历保存。

## 三个步骤

1. 上传文字型 PDF、DOCX，或粘贴简历，在浏览器本地读取。
2. AI 梳理概况、技能、经历、优势和信息缺口。
3. 粘贴目标岗位 JD，查看经历前后对照与完整优化简历，保存 PDF 报告。

投递前请本人核实经历、时间、数据和技能。扫描 PDF 暂不支持 OCR。

## 技术与本地运行

纯 HTML、CSS、JavaScript；使用本地 PDF.js / Mammoth.js。浏览器只调用 Cloudflare Worker，由 Worker 请求 OpenAI-compatible AI 服务，当前为 qwen3.8-flash。

安装 Node.js 后，在项目目录运行 `node server.cjs`，打开 `http://127.0.0.1:4173/`。Windows 也可双击“启动网页.cmd”。

测试：`node --test tests/*.test.cjs`。夹具都是合成材料，自动测试不调用真实模型。

## GitHub Pages

正式网站：https://gaokali.github.io/AI-Job-Matcher/ 。公开仓库：https://github.com/gaoKali/AI-Job-Matcher 。GitHub Actions 自动测试、打包和发布。

`node tools/build-pages.cjs` 只将网页必要资源复制到 `_site`，不包含后端、测试文件、日志或凭据。相对资源路径支持 `/AI-Job-Matcher/`。

正式 Turnstile Hostname 为 `gaokali.github.io`；Worker 已允许精确 Origin `https://gaokali.github.io`，保留本地来源，不使用通配符。正式网站已完成真实 AI 分析及优化验收。

## Cloudflare Worker / Turnstile

已有 Worker 的代码与绑定位于 `worker/wrangler.toml`。配置变量后用 Wrangler 部署。真实 Secret 只能放仪表盘 Secret，不能放仓库。

|变量|类型|默认或用途|
|---|---|---|
|AI_API_KEY|Secret|模型密钥|
|AI_BASE_URL|普通变量|现有 OpenAI-compatible 地址|
|AI_MODEL|普通变量|qwen3.8-flash|
|TURNSTILE_SITE_KEY|普通变量，可公开|前端从 Worker 获取|
|TURNSTILE_SECRET_KEY|Secret|Siteverify 验证及会话签名|
|ALLOWED_ORIGINS|普通变量|正式及本地 Origin 白名单|
|PUBLIC_AI_ENABLED|普通变量|true；false 暂停新的 AI 请求|
|FREE_PUBLIC_MODE|普通变量|true；不自动切换付费服务|
|IP_MINUTE_AI_LIMIT|普通变量|2 次 / 60 秒|
|IP_DAILY_AI_LIMIT|普通变量|10 次 / IP / 日|
|DAILY_AI_GLOBAL_LIMIT|普通变量|100 次 / 全站 / 日|

以上三项限额只在 Cloudflare Dashboard → Workers & Pages → ai-job-matcher-api → Settings → Variables and Secrets 管理。修改普通变量并保存部署后作用于新请求，无需改代码。每分钟为滚动 60 秒；既有次数不因修改上限清零。缺失或无效时停止 AI 请求。初始值为 2、10、100。

AI_USAGE 使用 Cloudflare SQLite Durable Object 原子计数。必须服务端 Siteverify 验证，原 token 不重复使用；独立签名会话仅在页面内存保留30分钟，绑定来源和 IP。达到限额停止请求，没有无限重试。

## 隐私与公测限制

原始文件在浏览器本地读取，不上传本站保存。AI 分析与优化时，必要的简历文本和 JD 经 Worker 发送给 AI 服务；本站不永久保存简历、JD 或报告。刷新清除本次页面内存。请移除不希望发送给 AI 服务的敏感个人信息。

额度每天按北京时间恢复，失败和既有网络兜底尝试保守计数。不新增付费搜索、服务器或数据库；限额不检测百炼剩余免费额度，免费额度用尽时应限制提供方计费或关闭 PUBLIC_AI_ENABLED。

`/health`、本地解析、已有报告查看和 PDF 下载不计 AI 次数。保存 PDF 时选择“另存为 PDF”并关闭“页眉和页脚”。开发演示仅本机可用，公开域名不能通过 `?demo=1` 开启。

详见 [安全保护](docs/PUBLIC_AI_SECURITY.md)。开源依赖许可保留在 vendor 目录。

