# 本地浏览器解析依赖

- PDF.js / pdfjs-dist 6.4.299，Apache-2.0，使用同版本主库、Worker、CMaps 与标准字体。来源：https://github.com/mozilla/pdf.js 。
- Mammoth.js 1.13.0，BSD-2-Clause，使用自带依赖的浏览器压缩包。来源：https://github.com/mwilliamson/mammoth.js 。

版本来自官方 npm 完整发行包，已复制到项目并固定；无需用户安装。测试发现旧工作目录中的标准字体存在异常，已用官方发行包替换。各库及字体/CMaps 的许可证随文件保留。只使用文字提取，不执行 PDF 脚本或 DOCX 外部链接，不渲染 DOCX HTML，不访问 CDN。上传文件字节通过浏览器 ArrayBuffer 交给 Worker，不通过网络传输。
