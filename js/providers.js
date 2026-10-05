/* Provider boundary: future AI / jobs integrations replace these methods.
 * Secrets must stay in a future server adapter, never in browser JavaScript.
 * This version has no network requests and no persistent storage.
 */
(function (root) {
  'use strict';
  const exampleResume = '示例候选人｜产品与用户运营\n工作经验：4年\n核心技能：用户研究、需求分析、数据分析、跨团队协作\n2023—2026  星禾数字（虚构）｜产品运营\n负责用户反馈整理、活动规划与产品需求协作。\n2022—2023  沐光科技（虚构）｜用户运营\n参与用户分层、社群活动及用户体验改进。\n教育背景：示例大学（虚构）｜本科｜市场营销\n本材料仅用于演示，不代表任何真实候选人。';
  const profile = {
    name: '示例候选人', summary: '具备产品与用户运营经历，希望向更关注产品体验的方向发展。',
    years: '4', skills: ['用户研究', '需求分析', '数据分析', '跨团队协作'],
    education: '示例大学（虚构） · 本科 · 市场营销',
    experience: [
      { title: '产品运营 · 星禾数字（虚构）', date: '2023—2026', summary: '整理用户反馈，参与活动规划，与产品团队协作梳理需求。' },
      { title: '用户运营 · 沐光科技（虚构）', date: '2022—2023', summary: '参与用户分层和社群活动，围绕用户体验提出改进建议。' }
    ],
    strengths: ['经历围绕用户与产品展开，职业主线清楚。', '具备用户反馈到需求整理的协作经验。', '兼有运营执行与数据分析的示例技能。'],
    weaknesses: ['成果描述缺少真实指标，可补充有依据的结果。', '项目中的个人职责和决策过程还可更具体。', '工具的实际使用场景需要更多项目证据。'],
    directions: [
      { title: '产品运营', reason: '从已有用户运营与产品协作经历出发，延续当前经验。' },
      { title: '用户运营', reason: '发挥用户分层、社群活动和用户体验方面的示例经验。' },
      { title: '产品经理', reason: '可迁移需求分析经验；还需补充完整产品项目证据。' }
    ]
  };
  const jobs = [
    { id: 'demo-1', title: '产品运营', company: '星野科技', city: '上海', industry: '互联网', workMode: '混合办公', level: '中级', score: 92, reasons: ['示例候选人具有用户反馈整理与产品协作经历。', '运营与需求分析技能与示例职责接近。'], gaps: ['还需补充运营项目的真实成果指标。'], responsibilities: ['梳理用户反馈，参与产品体验改进。', '制定运营活动计划并跟踪实际效果。'], requirements: ['有产品或用户运营经验。', '能使用数据分析支持运营决策。'] },
    { id: 'demo-2', title: '用户运营', company: '青屿生活', city: '杭州', industry: '消费零售', workMode: '现场办公', level: '中级', score: 88, reasons: ['示例中的用户分层和社群活动经验与岗位相关。'], gaps: ['消费零售业务经验尚需进一步确认。'], responsibilities: ['围绕用户生命周期设计运营活动。', '协同业务团队改善用户体验。'], requirements: ['具备用户运营经验。', '能够复盘活动与沟通业务需求。'] },
    { id: 'demo-3', title: '产品经理', company: '知行云', city: '上海', industry: '企业服务', workMode: '混合办公', level: '中级', score: 81, reasons: ['示例需求分析和跨团队协作可迁移到产品工作。'], gaps: ['缺少完整产品规划与上线过程的证据。'], responsibilities: ['开展需求调研并整理产品方案。', '与设计、研发协作推进功能迭代。'], requirements: ['具备需求分析与沟通能力。', '能够说明产品决策和验证过程。'] },
    { id: 'demo-4', title: '增长运营', company: '森点数字', city: '北京', industry: '互联网', workMode: '远程办公', level: '高级', score: 76, reasons: ['示例数据分析和运营活动经验与增长方向相关。'], gaps: ['尚未展示增长实验、渠道评估或带队经验。'], responsibilities: ['制定增长实验计划并复盘结果。', '协作优化用户转化与留存。'], requirements: ['有增长实验实践。', '能独立建立指标与实验方案。'] },
    { id: 'demo-5', title: '客户成功经理', company: '禾序协作', city: '深圳', industry: '企业服务', workMode: '现场办公', level: '中级', score: 71, reasons: ['示例用户反馈与沟通经验可支持客户需求理解。'], gaps: ['需要确认企业客户交付与续约经验。'], responsibilities: ['理解客户需求并协同交付。', '跟踪产品使用情况，支持客户实现业务目标。'], requirements: ['有客户沟通和项目协作经验。', '了解企业服务的交付流程。'] },
    { id: 'demo-6', title: '用户研究员', company: '见微设计', city: '杭州', industry: '互联网', workMode: '混合办公', level: '初级', score: 67, reasons: ['示例用户研究技能与反馈整理经历具有相关性。'], gaps: ['研究方法、样本设计与独立研究报告缺少证据。'], responsibilities: ['参与用户访谈与体验研究。', '整理研究材料，提出有依据的洞察。'], requirements: ['熟悉基本用户研究方法。', '能清楚呈现研究过程和结论。'] },
    { id: 'demo-7', title: '运营负责人', company: '远山互动', city: '成都', industry: '互联网', workMode: '现场办公', level: '管理岗', score: 59, reasons: ['示例运营背景与业务方向有一定关联。'], gaps: ['示例中未提供团队管理与整体业务目标负责经验。'], responsibilities: ['建立运营规划与团队分工。', '管理业务目标并推动跨部门协作。'], requirements: ['有团队管理和业务规划经验。', '能够负责完整业务目标。'] }
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  function scoreJob(job, preferences) {
    let score = job.score;
    const reasons = [...job.reasons];
    const gaps = [...job.gaps];
    const dimensions = [['role', '目标岗位', job.title, 6], ['city', '目标城市', job.city, 8], ['industry', '目标行业', job.industry, 4], ['workMode', '工作方式', job.workMode, 5], ['level', '岗位级别', job.level, 5]];
    for (const [key, label, actual, weight] of dimensions) {
      const expected = (preferences[key] || '').trim();
      if (!expected) continue;
      const options = expected.split(/[、，,;；\s/]+/).filter(Boolean);
      if (options.includes(actual)) {
        score += weight;
        reasons.push(`${label}符合所填条件：${actual}。`);
      } else {
        score -= weight;
        gaps.push(`${label}为“${actual}”，与所填“${expected}”不同，需确认是否接受。`);
      }
    }
    return { ...clone(job), score: Math.max(0, Math.min(100, score)), reasons, gaps, source: '本地模拟数据（虚构）', isMock: true, sourceUrl: null };
  }
  function validateFile(file) {
    if (!file) return '请选择 PDF 或 DOCX 简历。';
    if (!/\.(pdf|docx)$/i.test(file.name)) return '暂不支持这个文件类型，请选择 PDF 或 DOCX。';
    if (!file.size) return '文件为空，请重新选择。';
    if (file.size > 10 * 1024 * 1024) return '文件超过 10 MB，请选择较小的简历。';
    const expected = /\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (file.type && file.type !== expected && file.type !== 'application/octet-stream') return '文件格式与扩展名不一致，请选择有效的 PDF 或 DOCX。';
    return '';
  }
  function filterJobs(items, minimum = 0, order = 'desc') {
    return items.filter(job => job.score >= Number(minimum)).sort((a, b) => (order === 'asc' ? a.score - b.score : b.score - a.score) || a.id.localeCompare(b.id));
  }
  root.JobMatcherProviders = {
    mode: 'mock', exampleResume, validateFile, filterJobs,
    // Browser-local resumeParser is registered by js/resume-parser.js.
    analysisProvider: { async analyze() { return { ...clone(profile), isMock: true }; } },
    jobProvider: { async search(preferences = {}) { return jobs.map(job => scoreJob(job, preferences)); } }
  };
})(typeof window === 'undefined' ? globalThis : window);
