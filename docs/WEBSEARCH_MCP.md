# 第5步最终方案：百炼联网搜索 MCP（待开通与免费保护确认）

## 当前状态与正式路径
C:\Users\WIN10\Documents\ChatGPT\AI-Job-Matcher。
已实现 Streamable HTTP 适配、动态三个平台查询、搜索结果普通JS筛选、最多15岗一次Qwen匹配、低信息置信度和ATS补充。62项离线测试通过；这些测试是明确隔离的夹具，不是线上搜索验证。
未调用真实WebSearch MCP，未进行新的Qwen真实测试，也未声称获得本轮真实搜索结果。

## 官方依据（2026-10-05）
- 外部调用：https://help.aliyun.com/zh/model-studio/mcp-external-calls
- 计费区别：https://help.aliyun.com/zh/model-studio/web-search/
- 官方Qwen Code的MCP服务链接：https://qwenlm.github.io/qwen-code-docs/en/developers/tools/web-search/
- MCP协议：https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
官方MCP地址 https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp 。直接HTTP JSON-RPC，initialize→notifications/initialized→tools/list→tools/call；解析JSON与SSE，传递会话/协议头。不安装框架、不用模型决定工具调用，不发送resumeText或候选人信息给搜索服务。
Bearer读取现有env.AI_API_KEY，不修改AI_BASE_URL。工具名字和参数从官方tools/list读取，不预猜私有接口；不认识参数/结果格式则安全失败而非造岗位。

## 重要：FREE_MODE不是阿里云计费开关
官方说明MCP前2000次免费，用尽后可能自动计费。外部调用文档另提及部分MCP额度用尽自动停止，两份说明存在范围/版本差异；不能据此假设本账号必然停用。
没有查到可用于当前外部MCP调用、保证不扣费的官方请求参数或可靠实时剩余额度接口。不得把模型的“免费额度用完即停”直接宣称适用于搜索MCP，也不得虚构free_only请求头。
因此当前FREE_MODE默认为true，**即使WEBSEARCH_ENABLED=true也不执行MCP**；没有上游免费专用保障时一律返回FREE_SEARCH_UNAVAILABLE并继续免费ATS。false仅用于离线测试适配器或未来用户明确授权付费的情况，当前用户没有此授权，不能把false部署给用户。
代码绝不把内存计数、localStorage计数、用户声称还有额度当成全账号免费保障；不加入收费搜索后备。本次配置WEBSEARCH_ENABLED=false。
下一步由本人查看/开通MCP并确认费用和额度保护；确认之前不搜索，若官方确无免费即停能力，必须保持FREE_MODE并明确说明实时国内搜索尚不能启用，不用切换false绕过保护。

## 控制与真实字段
每个用户动作最多3次tools/call，三个平台各一次，不重试（严格3次总额优先）。初始化/工具发现属于协议控制消息，并非三次搜索之外的新搜索。会话无循环和后台任务，每次HTTP有15秒期限及500KB结果限制。前端搜索动作禁重复点击，Worker简单IP限制；这不是账户级硬计费预算。
调用/api/jobs/search只传preferences；关键词来自role/city/industry/level/mustHave。排除条件在JS过滤；销售数据分析师保留、电话销售过滤。普通去重不使用AI。
仅接受zhipin.com/liepin.com/zhaopin.com及其真实子域的独立职位详情URL，不接受分类/公司主页、伪装域名或无URL记录。原URL原样保留，不自行拼造或HTTPS改写。公司/城市/薪资/经验/学历/日期仅取结果明确字段或明确标签，未知填未公开，摘要来源于MCP返回；不依据查询词捏造城市或公司。
少于10个相关搜索结果时补充Greenhouse/Lever/Ashby，所有来源合并后最多15岗，一次模型请求。补充来源不增加模型次数；匹配网络失败不二次调用模型，保留真实未评分岗位。简历分析原有网络兜底不变。
匹配只用既有简历分析、条件和必要职位字段/摘要，不抓网页全文、不逐岗二次搜索。MCP摘要最多1500字符、ATS摘要最多1800字符。confidence高/中/低；短搜索摘要强制低。JD没有的信息不可补写，模型不创建岗位/URL。
正常用户流程不展示测试岗位；零结果显示免费搜索暂不可用/放宽条件的明确提示。页面保留来源真实性告知。

## 待本人操作
打开 https://bailian.console.aliyun.com/cn-beijing?tab=mcp#/mcp-market/detail/WebSearch ，选择联网搜索WebSearch并打开立即开通的确认页。先核对免费额度及耗尽后的处理方式，不同意产生付费。
不创建新密钥、不向聊天发送Key。Cloudflare不新增Secret；FREE_MODE=true和WEBSEARCH_ENABLED=false已由项目准备，无需用户改代码或执行命令。开通与保护确认后再由开发者完成启用和一次真实三平台测试。

## 本阶段边界
不做Agent/抓取/登录/验证码/付费API，不部署GitHub Pages。企业官网没有被固定公司库冒充：此次按最新指定的三平台查询上限实施，没有暗中追加第四次企业官网搜索。未来扩展另确认。

安全部署完成：现有ai-job-matcher-api版本2369532a-3b67-4620-9c3b-f7689ff5d878。FREE_MODE=true、WEBSEARCH_ENABLED=false，现有Secret及Base URL保留。未发送任何真实搜索请求。
