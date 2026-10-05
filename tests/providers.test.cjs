const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../js/providers.js');
const providers = globalThis.JobMatcherProviders;
test('上传校验：有效 PDF/DOCX、空文件、超限、错误类型', () => {
  assert.equal(providers.validateFile({ name: '简历.pdf', size: 200, type: 'application/pdf' }), '');
  assert.equal(providers.validateFile({ name: '简历.DOCX', size: 200, type: '' }), '');
  assert.equal(providers.validateFile({ name: '简历.docx', size: 10 * 1024 * 1024, type: '' }), '');
  for (const file of [null, { name: '简历.doc', size: 2 }, { name: 'empty.pdf', size: 0 }, { name: 'big.pdf', size: 10 * 1024 * 1024 + 1 }, { name: '假.pdf', size: 2, type: 'image/png' }]) assert.ok(providers.validateFile(file));
});
test('模拟分析不会把真实输入转成虚构事实；每次返回独立数据', async () => {
  const first = await providers.analysisProvider.analyze({ resume: '真实用户的秘密信息' });
  assert.equal(first.isMock, true);
  assert.equal(first.name, '示例候选人');
  first.skills.push('污染数据');
  assert.equal((await providers.analysisProvider.analyze()).skills.includes('污染数据'), false);
});
test('至少5个岗位、分数范围、来源与链接边界', async () => {
  const jobs = await providers.jobProvider.search();
  assert.ok(jobs.length >= 5);
  for (const job of jobs) { assert.ok(Number.isInteger(job.score) && job.score >= 0 && job.score <= 100); assert.equal(job.sourceUrl, null); assert.equal(job.isMock, true); assert.ok(job.reasons.length && job.gaps.length); }
  assert.equal(new Set(jobs.map(job => job.id)).size, jobs.length);
});
test('筛选与双向排序不会修改原始结果', async () => {
  const jobs = await providers.jobProvider.search();
  const originalIds = jobs.map(job => job.id);
  const descending = providers.filterJobs(jobs, 80, 'desc');
  assert.ok(descending.every(job => job.score >= 80));
  assert.ok(descending.every((job, index) => !index || descending[index - 1].score >= job.score));
  const ascending = providers.filterJobs(jobs, 0, 'asc');
  assert.ok(ascending.every((job, index) => !index || ascending[index - 1].score <= job.score));
  assert.equal(providers.filterJobs(jobs, 100).length, 0);
  assert.deepEqual(jobs.map(job => job.id), originalIds);
});
test('需求改变产生可解释的模拟分变化，返回数据不交叉污染', async () => {
  const baseline = await providers.jobProvider.search();
  const matching = await providers.jobProvider.search({ role: '产品运营', city: '上海', workMode: '混合办公' });
  assert.ok(matching[0].score > baseline[0].score);
  assert.ok(matching[0].reasons.some(reason => reason.includes('目标城市')));
  const other = await providers.jobProvider.search({ city: '成都' });
  assert.ok(other[0].gaps.some(gap => gap.includes('成都')));
  matching[0].gaps.push('污染');
  assert.equal((await providers.jobProvider.search())[0].gaps.includes('污染'), false);
  assert.deepEqual(await providers.jobProvider.search({ city: '上海' }), await providers.jobProvider.search({ city: '上海' }));
});
