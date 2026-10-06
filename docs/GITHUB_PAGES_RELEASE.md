# GitHub Pages 公测发布准备

唯一正式目录：C:\Users\WIN10\Documents\ChatGPT\AI-Job-Matcher。

## 本轮已完成

- 发布前扫描当前文件及 30 个提交、627 个 Git 历史对象、281 个可解码文本 blob。未发现匹配到的真实凭据；未发现历史追踪的 .env、.dev.vars、.wrangler 或日志。测试材料为合成简历，不读取用户真实简历。扫描不能代替密钥轮换或人工逐项隐私审查，上传前仍需检查最后待提交文件。
- 独立构建工具只将网页必需的 HTML、CSS、JavaScript、两张角色 WebP、图标及本地解析器资源复制到 _site。Worker、测试、文档、日志均不进入 Pages 发布包。
- Pages 工作流对 master/main 推送执行回归测试、静态构建和官方 Pages Actions 部署。
- 生产域名不能通过 ?demo=1 启动模拟简历分析；本地开发模式保留。
- 准确更新隐私说明，保持既有布局、Prompt、模型、PDF 与安全逻辑。
- 150 项测试通过；测试以 /AI-Job-Matcher/ 子路径验证资源加载与后端文件不可访问。没有新增真实 AI 调用。

## 当前暂停点

GitHub 账号 gaoKali 已登录，公开仓库 AI-Job-Matcher 表单已填写，等待用户本人点击 Create repository。当前未上传代码、未启用 Pages、未修改 Worker CORS。不要把预计 Pages 地址当成已发布网站。

后续顺序：确认仓库创建 → 发布前最终检查 → Git 推送 → 按用户要求在需要 Pages 开关时停下来 → 验证实际 Pages URL → 提示用户给现有 Turnstile 添加正式 hostname（保留 localhost/127.0.0.1）→ 添加 Worker 精确 Origin 并部署现有 Worker → 实际公开全流程验收。

公开完整验收通过前不创建 Public MVP v1.0 标签。

## 参考

- [GitHub Pages 官方 Actions 部署说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [发布来源设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Dashboard 限额管理与仓库创建（2026-10-06）
用户已创建 Public 仓库 https://github.com/gaoKali/AI-Job-Matcher 。三项 AI 限额从环境变量严格读取：IP_MINUTE_AI_LIMIT / IP_DAILY_AI_LIMIT / DAILY_AI_GLOBAL_LIMIT；不再有缺失时的硬编码默认值，缺失或无效时 fail closed。wrangler.toml 删除这三项赋值，keep_vars=true 保留 Dashboard 值，未来部署不覆盖它们。动态阈值、缺失/错误配置和全部回归合计152项通过。已部署原 Worker，版本 edf514b2-84e6-4085-a2f4-096a2a321889。无真实 AI 测试调用。完整线上配置下载被自动审批拒绝，未执行，不使用替代方法读取 Secrets。

代码已推送 origin/master（0b3e815）。GitHub Pages 设置显示当前 disabled、Source=Deploy from a branch，等待用户本人选择 GitHub Actions。尚无已发布网址，未修改生产 CORS，未进行公开 AI 验收或最终版本标记。

用户已于2026-10-06确认 Pages Source 选择 GitHub Actions，授权继续静态发布。触发重新部署以取代启用 Pages 前可能失败的运行；不修改产品代码。正式网址确认后仍须暂停等待本人添加 Turnstile Hostname。

## 正式公网验收完成（2026-10-06）
- GitHub Pages：https://gaokali.github.io/AI-Job-Matcher/ ，现有 Actions 首次正式部署成功（运行 37465673503）。
- 用户已配置 Turnstile 正式 hostname；Worker 精确 Origin 白名单加入 https://gaokali.github.io，保留本地来源，没有通配符。
- 现有 Worker 重新部署成功，版本 d901f136-bc81-4418-9ee1-2f9a9c63e226。保留 Dashboard Secrets、Base URL 和三项动态限额。
- 正式网站上传合成文字 PDF，读取 136 字符；Turnstile 自动验证通过，真实 Qwen 简历分析成功；随后产品运营中文 JD 优化成功，匹配度 85，独立签名会话复用成功。仅执行分析与优化各一次，没有继续请求模型。
- 保守事实检查对过长或扩大职责的改写保留原文；前后对照、确认提醒、完整简历均显示。
- PDF 按钮显示关闭页眉页脚提示；从当前真实结果的报告 DOM 与原打印 CSS 渲染 3 页 PDF，并逐页检查中文、前后对照和完整简历，无空白页及截断。原生打印对话框的“另存为 PDF”最终保存由用户选择，未自动操控系统打印窗口。
- 390×844 手机宽度：页面宽 375，不发生横向溢出，表单及结果可访问；已恢复桌面视口。
- 正式网站捕获的 warn/error 日志为空；全部 152 项回归测试通过。发布包不包含后端、测试、日志或凭据，Git 当前及历史扫描未发现凭据命中。
- 保持 UI、Prompt、PDF 核心、qwen3.8-flash 不变；岗位搜索及 WebSearch 默认关闭。
