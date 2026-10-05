/* File bytes stay in dedicated browser workers. No upload or external URLs. */
'use strict';
importScripts('parser-core.js');
const core = self.ResumeParserCore;
const SCANNED_MESSAGE = '这份 PDF 可能是扫描版，暂时无法直接读取文字。你可以将简历文字复制后使用‘粘贴文本’方式继续。';
async function readPdf(buffer) {
  const header = new TextDecoder('latin1').decode(new Uint8Array(buffer, 0, Math.min(1024, buffer.byteLength)));
  if (!header.includes('%PDF-')) core.fail('FORMAT', '文件内容不是有效的 PDF，请确认格式后重新上传。');
  const base = new URL('../assets/vendor/pdfjs/', self.location.href).href;
  const pdfjs = await import(base + 'pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer), cMapUrl: base + 'cmaps/', cMapPacked: true, standardFontDataUrl: base + 'standard_fonts/', useWorkerFetch: true, useWasm: false, isEvalSupported: false, stopAtErrors: true, disableFontFace: true, enableXfa: false, verbosity: 0 });
  let document;
  try {
    document = await task.promise;
    if (document.numPages > 100) core.fail('PAGE_LIMIT', '简历页数超过 100 页，请缩小文件或使用“粘贴文本”。');
    const pages = [], emptyPages = [];
    let length = 0, multiColumn = false;
    for (let number = 1; number <= document.numPages; number++) {
      self.postMessage({ type: 'progress', message: `正在读取简历……第 ${number} / ${document.numPages} 页` });
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      const extracted = core.pdfPageText(content, page.getViewport({ scale: 1 }));
      if (!extracted.text) emptyPages.push(number);
      multiColumn ||= extracted.multiColumn;
      length += extracted.text.length;
      if (length > core.MAX_TEXT) core.fail('TEXT_LIMIT', '提取文字超过 150,000 字符，请缩小简历文件后重试。');
      pages.push(extracted.text);
      page.cleanup();
    }
    const text = core.cleanText(pages.join('\n\n'));
    if (!text) core.fail('PDF_NO_TEXT', SCANNED_MESSAGE);
    const warnings = [];
    if (emptyPages.length) warnings.push(`第 ${emptyPages.join('、')} 页未读取到文字，可能为空白或扫描页；未对这些页面进行 OCR。`);
    if (multiColumn) warnings.push('已按分栏顺序整理文字，请展开内容检查阅读顺序。');
    return { text, pageCount: document.numPages, warnings, parser: 'PDF.js' };
  } finally { await task.destroy().catch(() => {}); }
}
async function readDocx(buffer) {
  core.checkDocxZip(buffer);
  importScripts('../assets/vendor/mammoth/mammoth.browser.min.js');
  const result = await self.mammoth.extractRawText({ arrayBuffer: buffer }, { externalFileAccess: false });
  const text = core.cleanText(result.value);
  if (!text) core.fail('DOCX_NO_TEXT', '这份 DOCX 没有可读取的正文文字，可能是空文档或只有图片。你可以使用“粘贴文本”方式继续。');
  if (text.length > core.MAX_TEXT) core.fail('TEXT_LIMIT', '提取文字超过 150,000 字符，请缩小简历文件后重试。');
  return { text, parser: 'Mammoth.js', warnings: result.messages.length ? ['部分文档元素可能无法完整读取，请展开内容核对；图片里的文字不会提取。'] : [] };
}
self.onmessage = async event => {
  try {
    const result = event.data.format === 'pdf' ? await readPdf(event.data.buffer) : await readDocx(event.data.buffer);
    self.postMessage({ type: 'success', result });
  } catch (error) {
    // PDF.js uses a numeric password code; it is not one of our UI codes.
    let message = error.message, code = typeof error.code === 'string' ? error.code : undefined;
    if (!code) {
      if (error.name === 'PasswordException') { code = 'ENCRYPTED'; message = '这份 PDF 有密码保护，请先解除密码再上传。'; }
      else if (event.data.format === 'pdf') { code = 'PDF_PARSE_FAILED'; message = '这份 PDF 可能已损坏或暂时无法读取，请重新导出 PDF，或使用“粘贴文本”方式继续。'; }
      else { code = 'DOCX_PARSE_FAILED'; message = '这份 DOCX 可能已损坏或暂时无法读取，请重新导出 DOCX，或使用“粘贴文本”方式继续。'; }
    }
    self.postMessage({ type: 'error', code, message });
  }
};
