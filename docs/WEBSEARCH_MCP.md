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


## 2026-10-05 本人开通后的1500次保护（覆盖之前禁用方案）
用户已明确开通并授权启用。FREE_MODE仍为true，WEBSEARCH_ENABLED=true；新增同一Worker的SearchBudget SQLite Durable Object，不创建其他Worker、不购买数据库。全站固定对象global-websearch-budget-v1，key websearch-total-v1，每次tools/call前用事务预留1次；失败、超时和崩溃不退次数；达到1500停用，不月度清零，无公开重置接口。持久计数不可读/写时停止MCP。
查看计数：GET /api/jobs/search-usage；搜索返回usage并在结果页显示累计次数。计数只覆盖本站使用该保护路径的调用，不能统计百炼控制台或其他应用的同账号消耗；500次缓冲不是账号层面的免费计费保证。不得擅自删除命名空间或改变固定对象名称以清零。
65项离线测试通过。部署版本75fd657b-19fd-43f6-a5a9-f0767c0463fa。真实一轮测试使用合成画像，结果待记录；不继续反复搜索。

## 本轮真实验证与最终状态（2026-10-05）
使用合成画像与用户指定条件：数据分析师 / 上海 / 互联网 / 不考虑销售。正式浏览器真实请求完成三个平台tools/call：BOSS直聘1次、猎聘1次、智联招聘1次，累计used=3、limit=1500、remaining=1497。三个平台最终接受的独立职位均为0；没有岗位交给Qwen，因此本轮模型调用0次，不能声称国内真实岗位批量匹配已经验证成功。控制台无异常。此前一次初始化失败没有搜索工具调用，也没有模型请求。
本轮未保留上游原始搜索正文，所以无法判定零结果是索引无独立职位、URL过滤，还是未知响应包装造成；不得把零结果解释成平台无岗位。发现包裹结构覆盖不全后，已支持有界递归、JSON字符串包装，增加returnedRows/acceptedJobs无隐私诊断；修复后不进行第二轮真实搜索消耗额度。下一次正常用户搜索可凭这些条数进一步判断。
67项离线测试通过，包含并发上限、失败仍计数、重建对象不清零、计数不可用时停止调用、嵌套响应兼容、裸调用原生fetch以及一次批量匹配。免费ATS备用保留。Job批量匹配仅在北京专属Base URL时选用已成功连通的官方共享北京端点，仍用原Key，不改变远端AI_BASE_URL，不重试模型；简历分析保持原规则。
Worker版本0f1c366b-ccf8-414f-a6a6-e12de2a3822f已部署到现有ai-job-matcher-api；Key/Base URL未改。计数公开查看路径/api/jobs/search-usage；浏览器工具打开该只读链接被ERR_BLOCKED_BY_CLIENT阻止，未重复尝试或绕过。此前真实搜索返回usage已经证明持久计数工作；刷新与部署不会清零已由事务/重建测试验证。
