(function (root) {
  'use strict';
  const MAX_CHARS = 12000;
  const messages = {
    EMPTY_INPUT: '请先上传或粘贴简历。', INPUT_TOO_LONG: '简历分析最多支持 12,000 个字符，请在“粘贴文本”中精简后重试。',
    NOT_CONFIGURED: 'AI 服务尚未配置，请联系网站维护者完成配置。你的简历尚未发送给 AI。',
    AUTH_FAILED: 'AI 服务的授权配置无效，请联系网站维护者检查密钥。',
    TIMEOUT: 'AI 分析等待超时，请稍后手动重试。', NETWORK: '浏览器未收到 AI 接口响应，可能是网络或跨域连接问题。请先点击“检查 AI 连接”，并查看 Console 中的 AI request 记录。',
    UPSTREAM_FALLBACK_FAILED: '专属地址和官方共享地址均连接失败，请稍后重试。',
    UPSTREAM_FALLBACK_TIMEOUT: '专属地址连接失败，官方共享地址也未能及时返回，请稍后重试。',
    UPSTREAM_NETWORK: '简历已到达本站接口，但暂时无法连接大模型服务。请稍后重试。',
    RATE_LIMIT: '操作过于频繁，请稍等一分钟再试。', UNAVAILABLE: 'AI 服务暂时不可用，请稍后重试。',
    MODEL_HTTP_ERROR: '模型服务返回了 HTTP 错误，请查看上游状态码。',
    INVALID_JSON: '模型返回的内容不是有效 JSON，请稍后重试。',
    INVALID_SCHEMA: '模型返回的字段或类型不符合要求。',
    INVALID_RESULT: 'AI 返回的分析格式异常，请稍后重试。', ACCESS_DENIED: '当前网页尚未获准使用 AI 服务，请联系网站维护者。',
    CANCELLED: '本次分析已取消。', BAD_REQUEST: '简历输入格式不正确，请重新上传或粘贴。'
  };
  function failure(code) { return Object.assign(new Error(messages[code] || 'AI 分析暂时失败，请稍后重试。'), { code }); }
  function clean(value) {
    if (typeof value !== 'string') throw failure('BAD_REQUEST');
    if (value.length > MAX_CHARS) throw failure('INPUT_TOO_LONG');
    const text = value.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
      .replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\r\n?/g, '\n').trim();
    if (!text) throw failure('EMPTY_INPUT');
    return text;
  }
  // Best-effort contact redaction, not a guarantee that all personal data is removed.
  function redact(text) {
    return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[邮箱已隐藏]')
      .replace(/\b\d{17}[\dXx]\b/g, '[证件号码已隐藏]')
      .replace(/(?:\+?86[-\s]?)?1[3-9](?:[-\s]?\d){9}\b/g, '[电话已隐藏]')
      .replace(/(?:\+\d{1,3}[-\s]?)?(?:\(\d{2,4}\)|\b\d{2,4})[-\s]\d{3,4}[-\s]\d{3,4}\b/g, '[电话已隐藏]')
      .replace(/^(?:\s*)(?:微信|微信号|手机号|联系电话|联系地址|家庭住址|通讯地址)\s*[:：].*$/gm, '[联系信息已隐藏]');
  }
  const UNKNOWN = '简历中未提供足够信息';
  const shape = {
    candidateProfile: '基于简历概括经验与行业，不输出联系方式', experienceYears: '字符串，例如5年左右；不能判断则说明信息不足', currentDirection: '当前职业方向或信息不足',
    coreSkills: ['仅简历已有技能'], workExperienceSummary: '工作经历与项目摘要，未知不补写', educationSummary: '教育背景摘要，未知不补写',
    strengths: ['基于真实经历的优势'], weaknesses: ['简历描述不足及建议补充，非能力否定'],
    missingInformation: ['无法从简历判断的信息'],
    recommendedDirections: [{ title: '推荐岗位', reason: '基于经历推断的理由', confidence: '字符串，例如高或85%；非录用概率', evidence: '简历中的判断依据；信息不足明确说明' }]
  };
  const strings = ['candidateProfile','experienceYears','currentDirection','workExperienceSummary','educationSummary'];
  const lists = ['coreSkills','strengths','weaknesses','missingInformation'];
  const directionKeys = ['title','reason','confidence','evidence'];
  const field = description => ({type:'string',description:description+'；没有信息填写“'+UNKNOWN+'”'});
  const properties = {};
  strings.forEach(k=>properties[k]=field(shape[k]));
  lists.forEach(k=>properties[k]={type:'array',items:{type:'string'},description:shape[k][0]+'；无信息返回[]'});
  properties.recommendedDirections={type:'array',items:{type:'object',additionalProperties:false,required:directionKeys,properties:Object.fromEntries(directionKeys.map(k=>[k,field(shape.recommendedDirections[0][k])]))}};
  const schema = {type:'object',additionalProperties:false,required:Object.keys(shape),properties};
  const knownFields=new Set([...Object.keys(shape),...directionKeys.map(k=>'recommendedDirections.'+k)]);
  function safeMissingFields(values){return Array.isArray(values)?[...new Set(values.filter(v=>typeof v==='string'&&knownFields.has(v)))]:[];}
  function schemaFailure(values=[]){const missingFields=safeMissingFields(values);const error=failure('INVALID_SCHEMA');if(missingFields.length)error.message+=': missing '+missingFields.join(', ');return Object.assign(error,{missingFields});}
  function stringValue(value,kind){
    if(value==null || (typeof value==='string'&&!value.trim()))return UNKNOWN;
    if(typeof value==='string')return value;
    if(typeof value==='number'&&Number.isFinite(value)&&(kind==='experienceYears'||kind==='confidence'))return String(value)+(kind==='experienceYears'?'年':'%');
    if(Array.isArray(value)&&value.every(v=>typeof v==='string'))return value.length?value.join('\n'):UNKNOWN;
    return value; // Invalid objects/booleans are not converted into invented content.
  }
  function listValue(value){if(value==null)return [];if(typeof value==='string')return value.trim()?[value]:[];return Array.isArray(value)?value.slice():value;}
  function normalizeAnalysisResult(result){
    if(!result||typeof result!=='object'||Array.isArray(result))throw schemaFailure();
    const normalized={};
    strings.forEach(k=>normalized[k]=stringValue(Object.hasOwn(result,k)?result[k]:undefined,k));
    lists.forEach(k=>normalized[k]=listValue(Object.hasOwn(result,k)?result[k]:undefined));
    const directions=Object.hasOwn(result,'recommendedDirections')?result.recommendedDirections:undefined;
    normalized.recommendedDirections=directions==null?[]:Array.isArray(directions)?directions.map(d=>{
      if(!d||typeof d!=='object'||Array.isArray(d))return d;
      return Object.fromEntries(directionKeys.map(k=>[k,stringValue(Object.hasOwn(d,k)?d[k]:undefined,k)]));
    }):directions;
    return normalized;
  }
  function validate(result){
    const bad=(fields=[])=>{throw schemaFailure(fields);};
    if(!result||typeof result!=='object'||Array.isArray(result))bad();
    const missing=Object.keys(shape).filter(k=>!Object.hasOwn(result,k));if(missing.length)bad(missing);
    if(Object.keys(result).length!==Object.keys(shape).length)bad();
    strings.forEach(k=>{if(typeof result[k]!=='string')bad();});
    lists.forEach(k=>{if(!Array.isArray(result[k])||!result[k].every(v=>typeof v==='string'))bad();});
    if(!Array.isArray(result.recommendedDirections))bad();
    result.recommendedDirections.forEach(d=>{
      if(!d||typeof d!=='object'||Array.isArray(d))bad();
      const missing=directionKeys.filter(k=>!Object.hasOwn(d,k));if(missing.length)bad(missing.map(k=>'recommendedDirections.'+k));
      if(Object.keys(d).length!==directionKeys.length||directionKeys.some(k=>typeof d[k]!=='string'))bad();
    });
    return result;
  }
  root.AnalysisContract={MAX_CHARS,messages,failure,clean,redact,shape,schema,safeMissingFields,schemaFailure,normalizeAnalysisResult,validate};
  if (typeof module !== 'undefined') module.exports = root.AnalysisContract;
})(typeof window === 'undefined' ? globalThis : window);
