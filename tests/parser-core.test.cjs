const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../js/parser-core.js');
const core = globalThis.ResumeParserCore;
const view = { width: 600, convertToViewportPoint: (x, y) => [x, 800 - y] };
const token = (str, x, y, width = 60) => ({ str, transform: [1, 0, 0, 1, x, y], width, height: 12 });
test('按视觉行排序，保留中英文词语', () => {
  const items = [token('研究', 72, 720, 24), token('用户', 48, 720, 24), token('Skills:', 48, 760, 42), token('Python', 100, 760, 42), token('Education', 48, 680)];
  assert.equal(core.pdfPageText({ items }, view).text, 'Skills: Python\n用户研究\nEducation');
});
test('稳定双栏按左栏后右栏读取', () => {
  const items = [token('简历标题', 40, 790, 80)];
  for (let i = 0; i < 4; i++) items.push(token('左' + i, 40, 750 - i * 30), token('右' + i, 320, 750 - i * 30));
  const result = core.pdfPageText({ items }, view);
  assert.equal(result.multiColumn, true);
  assert.equal(result.text, '简历标题\n左0\n左1\n左2\n左3\n右0\n右1\n右2\n右3');
});
test('清理换行而不改写简历内容', () => {
  assert.equal(core.cleanText('  简历\r\n技能：SQL\u0000  \r\n\r\n'), '简历\n技能：SQL');
  assert.equal(core.pdfPageText({ items: [] }, view).text, '');
});
test('实际DOCX结构校验：正常、空正文、损坏与伪装', () => {
  const read = name => { const buffer = fs.readFileSync(path.join(__dirname, 'fixtures', name)); return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength); };
  assert.doesNotThrow(() => core.checkDocxZip(read('normal.docx')));
  assert.doesNotThrow(() => core.checkDocxZip(read('empty.docx')));
  assert.throws(() => core.checkDocxZip(read('corrupt.docx')));
  assert.throws(() => core.checkDocxZip(read('unsupported.txt')));
  const modified = read('normal.docx');
  const bytes = new DataView(modified);
  for (let i = 0; i < bytes.byteLength - 46; i++) if (bytes.getUint32(i, true) === 0x02014b50) { bytes.setUint32(i + 24, 70 * 1024 * 1024, true); break; }
  assert.throws(() => core.checkDocxZip(modified), error => error.code === 'DOCX_LIMIT');
});
