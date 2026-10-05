// Synthetic non-personal fixture only. Never imported by the product.
const resumeText = '测试候选人\n2021.01-2024.01 星河测试企业 数据分析师\n使用 SQL、Excel 制作销售报表。负责零售行业数据整理。\n2017-2021 测试大学 统计学 本科';
const analysis = {
  candidateProfile: '具有零售行业数据整理与报表经验的候选人。', experienceYears: '约3年（按已列任职日期）', currentDirection: '数据分析',
  coreSkills: ['SQL','Excel'], workExperienceSummary: '2021.01-2024.01 在星河测试企业担任数据分析师，使用 SQL、Excel 制作销售报表。',
  educationSummary: '2017-2021 测试大学，统计学，本科。', strengths: ['已描述 SQL、Excel 报表实践，具备零售行业数据整理经验。'],
  weaknesses: ['建议补充真实报表使用范围与业务成果，目前没有足够结果描述。'],
  recommendedDirections: [{ title: '数据分析师', reason: '已有数据分析师经历和报表实践，可继续考虑这一方向。', confidence: 'high', evidence: '使用 SQL、Excel 制作销售报表。' }],
  missingInformation: ['2024.01之后的经历未提供。','项目成果和指标未提供。']
};
module.exports = { resumeText, analysis };
