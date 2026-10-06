# 公开上线前 AI 防刷与费用保护

正式项目：`C:\Users\WIN10\Documents\ChatGPT\AI-Job-Matcher`。
可用 MVP 检查点：`8738cdc`。本次不改变 UI 布局、Prompt、模型、PDF、已有 Secret / Base URL，不启用岗位搜索，不发布 Pages。

## 当前完成状态

代码及模拟安全测试完成；Worker 离线打包检查通过。**尚未部署此安全版本**，现有线上 Worker 不应被视为已受新增保护。用户需要先创建真实 Turnstile Widget 并在现有 Worker 配置两个值，再由 Codex 部署绑定与迁移、完成真人验证。未填任何假生产 Key。

## 默认配置

|变量|默认值|用途|
|---|---|---|
|PUBLIC_AI_ENABLED|true|false 时停止所有真正 AI 操作|
|FREE_PUBLIC_MODE|true|不开放历史岗位匹配入口；不自动切换付费模型、搜索服务或额外重试|
|IP_MINUTE_AI_LIMIT|2|同一 IP 滑动 60 秒，分析和优化共享|
|IP_DAILY_AI_LIMIT|10|同一 IP 北京时间每天上限|
|DAILY_AI_GLOBAL_LIMIT|100|全站北京时间每天上限|
|TURNSTILE_SITE_KEY|待配置|普通环境变量，公开 Site Key|
|TURNSTILE_SECRET_KEY|待配置|Worker Secret，绝不可放网页或仓库|

现有 ALLOWED_ORIGINS 只保留 localhost / 127.0.0.1 指定来源。之后增加实际 Pages 的 Origin，不能填通配符。

## 用户下一步（不需要命令或改代码）

1. Cloudflare 控制台 → Turnstile → Add widget / 添加 Widget。
2. 名称 `ai-job-matcher`；Hostnames 添加 `localhost` 和 `127.0.0.1`，不要带协议、端口或路径；模式 Managed / 托管；不启用 Pre-clearance；Create / 创建。
3. Cloudflare → Workers & Pages → 已有 `ai-job-matcher-api` → Settings → Variables and Secrets → Add。
4. Site Key 添加为普通变量 `TURNSTILE_SITE_KEY`；Secret Key 添加为 Secret `TURNSTILE_SECRET_KEY`。已有 AI_API_KEY / AI_BASE_URL 不动。不要把 Secret 发到聊天中。
5. 配置完成告知 Codex。Codex 再部署当前安全代码，绑定 AI_USAGE 并做真实会话验证。安全版本未部署前本地新 AI 流程会保守提示验证未配置；解析和既有报告不受影响。

## 如何实现及测试边界

- Widget 在第一次用户明确点击 AI 时加载，服务端 Siteverify 必须验证 success、hostname、action。Turnstile token 只交换一次；服务端签发 HMAC 会话，绑定 Origin 和匿名 IP，30 分钟过期。会话只存在前端内存，刷新后消失。不使用 Cookie、localStorage 或 sessionStorage。
- HMAC 使用 Worker 内已有 Turnstile Secret 并按不同用途分离签名输入。IP 从 Cloudflare 的 CF-Connecting-IP 获取，绝不读取客户端提交的 ip/userId/deviceId。每天更换匿名 HMAC 计数键。
- 所有模型请求先验证输入与会话，再以同一个 SQLite Durable Object 原子预留限额。分析/优化共享，服务重启/部署不清零。既有受限网络 fallback 每一个实际上游尝试也计数；失败保守不退还，避免不确定计费情况下超过上限。HTTP/格式失败没有新增模型重试。
- 达到任一限额、停用、无绑定、计数损坏、缺少 Secret、验证失败都 fail closed，不请求 Qwen。默认全站 100 指上游尝试最多 100 次，不是成功报告数。
- 持久存储只含日期、每日全站次数、匿名 IP 次数和最多两次近期请求时间。日切换清除旧 IP 记录，并有两天到期清理。**没有简历、JD、姓名、联系方式或模型输出。**
- `/health`、CORS OPTIONS、空输入检查、本地文件解析、已生成报告查看及 PDF 都不计数；仍可继续使用。按钮原有 busy 防重复保持。
- 记录用量：Cloudflare → 该 Worker → Observability / Logs，筛选 `ai-usage`，查看当天最新一条的 `date` 和 `used`。只记录聚合用量，不公开后台端点、不输出 IP/token/Secret/正文。
- 新增错误为固定中文提示：TOO_MANY_REQUESTS、DAILY_USER_LIMIT_REACHED、SERVICE_DAILY_LIMIT_REACHED、AI_DISABLED、TURNSTILE_REQUIRED、TURNSTILE_FAILED、SECURITY_UNAVAILABLE。普通公开页面不显示内部调试细节；localhost 保留有限错误码诊断。
- 限额可以限制消耗，**不检测百炼剩余额度，也不能保证现有 Qwen 在免费额度用尽后不计费**。如要求绝对零账单，应同时在百炼设置免费额度用尽停止（若模型控制台提供）或手动关闭 PUBLIC_AI_ENABLED。没有新增付费服务、计划升级、第三方数据库或搜索 API。

## 验收记录

148 项测试通过（包含原 135 项）；新增验证覆盖：真实处理器的模拟分析+优化两次成功、共享第三次429、过期/伪造/异IP会话拒绝、每日IP与全站上限、120并发只能预留100、实例重新创建保持计数、北京时间日切与滑动窗口、Turnstile失败/错误域名/错误action/重复token、缺失和损坏配置、fallback达到额度时不出第二个上游请求、输入长度、health/OPTIONS/PDF不计数、隐私日志以及前端单会话复用。

测试使用单元夹具，不调用真实 Qwen，不发送真实简历。Wrangler 4.147.0 `deploy --dry-run` 成功，三个 Durable Object 导出及迁移打包通过；**没有执行真正部署**。本地正式网页安全脚本加载正常，浏览器 Console 无错误。

真实 Widget 和 Cloudflare 持久绑定仍需完成最终上线前验收，不能将 mock 验收称为真实人机验证已成功。

## 当前官方依据

- [Turnstile 免费计划](https://developers.cloudflare.com/turnstile/plans/)：免费挑战，使用 Managed Widget。
- [服务端 Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)：300 秒有效、单次 token、必须服务端验证。
- [控制台创建 Widget](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/)。
- [本地开发域名](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)：可添加 localhost 和 127.0.0.1。
- [Durable Objects 免费计划](https://developers.cloudflare.com/durable-objects/platform/pricing/)：采用 SQLite 类；沿用项目已有免费原生能力。免费账户超过平台配额会停止服务，不自动升级套餐。
