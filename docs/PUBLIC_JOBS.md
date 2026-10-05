# 真实公开岗位与批量匹配（第5步）

正式目录：C:\Users\WIN10\Documents\ChatGPT\AI-Job-Matcher。开发前保存Git提交1d8c223，标签checkpoint-resume-ai-working；可以恢复第4步可用版本。没有推送仓库或部署GitHub Pages。

## 来源与边界

独立清单js/job-sources.js包含10家公司：Cloudflare、Stripe、Databricks、GitLab（Greenhouse）；Spotify、Palantir（Lever）；OpenAI、Notion、Ramp、Perplexity（Ashby）。2026-10-05官方接口实测约3,900个公开职位，数量随招聘变化。仅固定公开GET接口，无登录、爬虫、验证码、收费岗位API或Agent。

官方依据：
- Greenhouse：https://docs.greenhouse.io/job-board.html — GET /v1/boards/{board_token}/jobs?content=true
- Lever：https://github.com/lever/postings-api — GET /v0/postings/{site}?mode=json&limit=500；现有两家公司均未达到500。新大公司可能需要后续增加分页，当前不声称全平台检索。
- Ashby：https://developers.ashbyhq.com/docs/public-job-posting-api — GET /posting-api/job-board/{name}
- Cloudflare：https://developers.cloudflare.com/workers/runtime-apis/fetch/ — 代理使用manual重定向，流式返回保留Content-Encoding。

接口为固定名单/api/jobs/boards/{key}，CORS仍允许已有本地来源。Worker只发Accept:application/json，没有转发用户请求头、简历、画像、求职条件或AI密钥。公共响应缓存5分钟；浏览器缓存只存岗位。每源12秒上游/18秒浏览器超时，4路并发，每个源失败独立提示。大型OpenAI接口约13.8MB，公开源有界上限25MB，不影响简历文件10MB上限。

## 统一数据和筛选

id/company/title/location/description/url/source/publishedAt均存在，日期未知用null，不把Greenhouse更新日期或Lever创建时间冒充发布日期；可额外保留updatedAt、workMode、行业标签。链接来自真实API，不由模型创建，限定https，不接受凭据URL，页面转义所有文本。源HTML转换为纯文本。

普通JS（js/job-core.js）先去重并筛选：中英常用岗位关键词、城市、工作方式、标题/描述关键词、工作年限、级别、行业、必须/排除条件；明确排除销售只排除销售岗位标题，不把与销售协作的数据分析师误判为销售。明确不同城市的现场岗过滤，远程/混合/China/APAC/多地保留并提示地区与许可待核实。复杂自由条件或JD未确认条件不编造满足，交给批量匹配解释。国际科技源为主，中国大陆本地覆盖有限，无结果如实提示。

## 一次批量AI

前端先取得真实公开岗位，选最多10个，然后POST /api/jobs/match。输入为现有真实分析结果、7项求职条件和真实JD；不重复发送原始文件。服务端清理/脱敏、限字段和长度、限10岗位、请求体180KB，检查名单、公司/来源与申请域名。JD每岗最多6000字符，并传descriptionTruncated提示完整要求需核对原链接。画像总长度上限14000字符，不存数据库、磁盘或日志。

共用原有OpenAI-compatible传输适配器requestStructured、qwen3.8-flash、enable_thinking=false和严格json_schema。一次返回每个id的0-100 matchScore、matchReasons、gaps、recommendation、resumeTips；输出最多6000Token、模型预算55秒、前端65秒，实例内每IP每分钟最多2次匹配。既有仅网络异常的北京地址兜底不变，不修格式重发模型，无定时任务。该限流是基本保护，不宣称全局计费硬上限。

不从中文简历推断国籍、居住地或签证；未提供经验只能说明待确认，不能断言没有能力。简历建议仅突出已有事实，补充新库/项目必须确有真实使用，不虚构数字。分数不是录用概率。AI失败仍显示真实岗位、暂未评分和错误类型，不用模拟结果。部分匹配缺失的岗位同样明确未评分。

## 页面和测试

保留三步骤及配色布局。第三步包含真实名称/公司/地区/工作方式/来源、评分、匹配原因、差距、申请建议、简历重点、折叠JD摘要；查看真实岗位直接打开原链接。排序/最低分/公司/地区/来源筛选、清空、重新搜索、重新上传可操作。正在搜索防重复；重传取消旧请求、迟到响应不能覆盖新简历。岗位源与匹配分开，正常模式没有模拟职位。

54项离线测试通过；在Wrangler本地真实运行时验证Cloudflare 406岗和OpenAI 828岗（约13.8MB）。线上浏览器用合成简历真实分析1次、岗位批量匹配成功1次（10个岗位，65/45/40/25/20/20/15/15/15/10，非硬编码），实测3044个公开职位（OpenAI原被10MB保护拦截，后已修正）。升降序、公司Stripe/地区Canada/Greenhouse来源、最低分100空结果、清除筛选恢复10岗均通过。点击真实链接打开Stripe Careers | Data Analyst（原API链接跳转到/careers/listing/data-analyst/5416444）。没有发送任何真实个人简历。

收紧未知事实规则后仅再请求一次批量匹配，遭遇UPSTREAM_FALLBACK_TIMEOUT，页面保留真实未评分岗位；停止继续调用模型。最终版本需用户正常点击检验（不是AI代码未接）。浏览器没有JS崩溃；失败场景日志只记录固定错误类型、来源和状态，不含正文或Secret。暂不宣称每个岗位链接都可永久访问；以原页面为准，失效时重新搜索。

最终部署记录另见AI_INTEGRATION.md。保留原AI_API_KEY、AI_BASE_URL、模型与Worker；不加入Agent、登录、数据库或Pages部署。

第5步最终公开源验收：浏览器诊断模式读取3871个真实职位，10家公司均完成读取，没有AI调用。390px手机视口页面宽375px、卡片和过滤器均为单列，无横向溢出，截图见screenshots/public-jobs-mobile.png。正常模式曾成功一次10岗真实评分；最后的上游超时已保留未评分岗位，不继续自动测试模型。