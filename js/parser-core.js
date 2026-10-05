/* Pure helpers shared by the browser worker and offline tests. */
(function (root) {
  'use strict';
  const MAX_TEXT = 150000;
  function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
  function cleanText(text) {
    return String(text || '').replace(/\r\n?/g, '\n').replace(/[\u0000\u200B\uFEFF]/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  }
  function joinItems(items) {
    let text = '';
    let previous;
    for (const item of items.sort((a, b) => a.x - b.x)) {
      const value = item.str;
      if (previous && text && !/\s$/.test(text) && !/^\s/.test(value)) {
        const gap = item.x - previous.x - previous.width;
        const cjkPair = /[\u3000-\u9fff]$/.test(text) && /^[\u3000-\u9fff]/.test(value);
        if (!cjkPair || gap > Math.max(previous.height, item.height) * 0.6) text += ' ';
      }
      text += value;
      previous = item;
    }
    return text.trim();
  }
  function pdfPageText(content, viewport) {
    const points = content.items.filter(item => typeof item.str === 'string' && item.str.trim()).map(item => {
      // Use viewport coordinates to handle pages with a /Rotate value.
      const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      return { str: item.str, x, y, width: Math.abs(item.width || 0), height: Math.max(4, Math.abs(item.height || 10)) };
    }).sort((a, b) => a.y - b.y || a.x - b.x);
    const rows = [];
    for (const point of points) {
      const row = rows.findLast(item => Math.abs(item.y - point.y) <= Math.max(2, Math.min(item.height, point.height) * 0.35));
      if (row) row.items.push(point); else rows.push({ y: point.y, height: point.height, items: [point] });
    }
    // Detect only a repeated, wide empty gutter. Ordinary dates and tables
    // remain in row order; irregular layouts are explicitly flagged for review.
    const gaps = [];
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.items.length; i++) {
        const left = row.items[i - 1], right = row.items[i];
        const edge = left.x + left.width;
        if (right.x - edge > viewport.width * 0.07) gaps.push((edge + right.x) / 2);
      }
    }
    const split = gaps.find(gap => gaps.filter(value => Math.abs(value - gap) < viewport.width * 0.04).length >= 3);
    let lines;
    if (split !== undefined) {
      const crossing = row => row.items.some(item => item.x < split && item.x + item.width > split);
      const firstColumns = rows.findIndex(row => !crossing(row) && row.items.some(item => item.x >= split));
      const header = rows.slice(0, Math.max(0, firstColumns));
      const body = rows.slice(Math.max(0, firstColumns));
      lines = header.map(row => joinItems(row.items));
      // Spanning headings split the page into reading blocks.
      let block = [];
      const flush = () => {
        for (const side of [false, true]) for (const row of block) {
          const items = row.items.filter(item => (item.x >= split) === side);
          if (items.length) lines.push(joinItems(items));
        }
        block = [];
      };
      for (const row of body) {
        if (crossing(row)) { flush(); lines.push(joinItems(row.items)); } else block.push(row);
      }
      flush();
    } else lines = rows.map(row => joinItems(row.items));
    return { text: cleanText(lines.join('\n')), multiColumn: split !== undefined };
  }
  function checkDocxZip(buffer) {
    const view = new DataView(buffer);
    if (view.byteLength < 22 || view.getUint32(0, true) !== 0x04034b50) fail('FORMAT', '文件内容不是有效的 DOCX，请确认格式后重新上传。');
    let end = -1;
    for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i--) {
      if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === view.byteLength) { end = i; break; }
    }
    if (end < 0) fail('DOCX_CORRUPTED', '这份 DOCX 可能已损坏，请重新导出或使用“粘贴文本”。');
    const count = view.getUint16(end + 10, true), directorySize = view.getUint32(end + 12, true);
    let offset = view.getUint32(end + 16, true), total = 0, hasDocument = false;
    if (count > 4096 || directorySize > view.byteLength || offset + directorySize > end || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) fail('DOCX_LIMIT', '这份 DOCX 结构过于复杂，建议重新导出较小的文件或粘贴简历文本。');
    for (let index = 0; index < count; index++) {
      if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) fail('DOCX_CORRUPTED', '这份 DOCX 可能已损坏，请重新导出或使用“粘贴文本”。');
      const nameLength = view.getUint16(offset + 28, true), extra = view.getUint16(offset + 30, true), comment = view.getUint16(offset + 32, true);
      if (offset + 46 + nameLength + extra + comment > end) fail('DOCX_CORRUPTED', '这份 DOCX 可能已损坏，请重新导出或使用“粘贴文本”。');
      if (view.getUint16(offset + 8, true) & 1) fail('ENCRYPTED', '这份 DOCX 有密码保护，请先解除密码再上传。');
      total += view.getUint32(offset + 24, true);
      if (total > 64 * 1024 * 1024) fail('DOCX_LIMIT', '这份 DOCX 解压后的内容过大，请重新导出简历或粘贴文本。');
      const name = new TextDecoder().decode(new Uint8Array(buffer, offset + 46, nameLength));
      if (name === 'word/document.xml') hasDocument = true;
      offset += 46 + nameLength + extra + comment;
    }
    if (!hasDocument) fail('FORMAT', '文件中没有 Word 正文，可能不是有效的 DOCX。请重新导出或粘贴文本。');
  }
  root.ResumeParserCore = { MAX_TEXT, cleanText, pdfPageText, checkDocxZip, fail };
})(typeof self === 'undefined' ? globalThis : self);
