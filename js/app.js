(function () {
  'use strict';
  const providers = window.JobMatcherProviders;
  const $ = id => document.getElementById(id);
  const state = { method: 'file', file: null, profile: null, preferences: {}, jobs: [], highestStep: 1, generation: 0, busy: false, readAbort: null, reading: false };
  // The single canonical resume value for PDF, DOCX and pasted text.
  // Memory only. Only cleaned/redacted text is sent for an explicit AI analysis.
  window.resumeText = '';
  const escape = text => String(text ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const list = items => `<ul>${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;
  function announce(text) { $('live-status').textContent = text; }
  function showStep(step, focus = true) {
    state.highestStep = Math.max(state.highestStep, step);
    for (let number = 1; number <= 3; number++) $('step-' + number).hidden = number !== step;
    document.querySelectorAll('[data-step]').forEach(button => {
      const number = Number(button.dataset.step);
      button.disabled = number > state.highestStep;
      button.classList.toggle('active', number === step);
      button.classList.toggle('completed', number < step);
      if (number === step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    if (focus) {
      const heading = $(step === 1 ? 'upload-title' : step === 2 ? 'analysis-title' : 'results-title');
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }
  function setMethod(method) {
    if (state.method !== method) {
      clearExtracted();
      state.file = null;
      $('resume-file').value = '';
      $('file-summary').hidden = true;
      $('file-name').textContent = '';
      $('file-size').textContent = '';
      $('resume-text').value = '';
      $('text-count').textContent = '0 / 150000';
    }
    state.method = method;
    ['file', 'text'].forEach(name => {
      $(name + '-panel').hidden = name !== method;
      $(name + '-method').classList.toggle('active', name === method);
      $(name + '-method').setAttribute('aria-pressed', String(name === method));
    });
    $('resume-error').hidden = true;
  }
  function displayError(id, message) { $(id).textContent = message; $(id).hidden = false; }
  function clearExtracted() {
    state.generation++;
    state.aiAbort?.abort();
    state.optimizeAbort?.abort();
    state.optimizeAbort = null;
    stopOptimizationLoading();
    state.optimization = null;
    $('optimization-results').replaceChildren();
    $('optimization-results').hidden = true;
    $('optimization-error').hidden = true;
    $('optimization-form').reset();
    $('jd-count').textContent = '0 / 12000';
    $('resume-origin').textContent = '';
    $('analysis-notice').textContent = '';
    state.aiAbort = null;
    stopLoading();
    state.readAbort?.abort();
    state.readAbort = null;
    state.reading = false;
    state.busy = false;
    state.profile = null;
    state.jobs = [];
    state.highestStep = 1;
    window.resumeText = '';
    $('read-status').hidden = true;
    $('read-status-title').textContent = '';
    $('read-status-detail').textContent = '';
    $('read-warning').textContent = '';
    $('read-warning').hidden = true;
    $('toggle-preview').hidden = true;
    $('toggle-preview').textContent = '查看提取内容';
    $('toggle-preview').setAttribute('aria-expanded', 'false');
    $('extracted-preview').hidden = true;
    $('extracted-text').textContent = '';
    $('analysis-content').replaceChildren();
    $('analyze-button').disabled = false;
    $('optimize-button').disabled = false;
    showStep(1, false);
  }
  function readingStatus(title, detail = '') {
    $('read-status').hidden = false;
    $('read-status-title').textContent = title;
    $('read-status-detail').textContent = detail;
  }
  function acceptText(text, warnings = []) {
    window.resumeText = text;
    $('extracted-text').textContent = window.resumeText;
    readingStatus('简历读取成功', `已成功读取简历，共 ${Array.from(window.resumeText).length.toLocaleString('zh-CN')} 个字符。`);
    $('toggle-preview').hidden = false;
    $('read-warning').textContent = warnings.join(' ');
    $('read-warning').hidden = !warnings.length;
  }
  function updatePastedText() {
    clearExtracted();
    const text = window.ResumeParserCore.cleanText($('resume-text').value);
    $('text-count').textContent = $('resume-text').value.length + ' / 150000';
    if (text) acceptText(text);
    $('resume-error').hidden = true;
  }
  async function selectFile(file) {
    clearExtracted();
    state.file = null;
    $('file-summary').hidden = true;
    $('file-name').textContent = '';
    $('file-size').textContent = '';
    const error = providers.validateFile(file);
    if (error) { $('resume-file').value = ''; displayError('resume-error', error); return; }
    state.file = file;
    $('resume-error').hidden = true;
    $('file-name').textContent = file.name;
    const size = file.size < 1024 * 1024 ? `${Math.max(1, Math.ceil(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    $('file-size').textContent = size;
    $('file-summary').hidden = false;
    const generation = state.generation;
    const controller = new AbortController();
    state.readAbort = controller;
    state.reading = true;
    $('analyze-button').disabled = true;
    readingStatus('正在读取简历……', '文件只在浏览器内处理，不会上传。');
    try {
      const result = await providers.resumeParser.parse(file, { signal: controller.signal, onProgress: message => { if (generation === state.generation) readingStatus('正在读取简历……', message); } });
      if (generation !== state.generation) return;
      acceptText(result.text, result.warnings);
      announce('简历读取成功，可以查看提取内容或进入简历分析。');
    } catch (error) {
      if (generation !== state.generation || error.code === 'CANCELLED') return;
      window.resumeText = '';
      readingStatus('暂时无法读取简历', '可重新上传，或切换到“粘贴文本”。');
      displayError('resume-error', error.message || '浏览器读取异常，请重试或粘贴文本。');
    } finally {
      if (generation === state.generation) { state.reading = false; state.readAbort = null; $('analyze-button').disabled = false; }
    }
  }
  function reset(focus = true) {
    clearExtracted();
    state.generation++;
    Object.assign(state, { method: 'file', file: null, profile: null, preferences: {}, jobs: [], highestStep: 1, busy: false });
    $('resume-form').reset();
    $('optimization-form').reset();
    $('jd-count').textContent = '0 / 12000';
    $('resume-text').value = '';
    $('text-count').textContent = '0 / 150000';
    $('file-summary').hidden = true;
    $('file-name').textContent = '';
    $('file-size').textContent = '';
    $('resume-origin').textContent = '';
    $('analysis-content').replaceChildren();
    $('analyze-button').disabled = false;
    $('optimize-button').disabled = false;
    setMethod('file');
    showStep(1, focus);
    announce('已清空本次简历、分析和优化结果，可以重新开始。');
  }
  function renderMockAnalysis(profile) {
    $('analysis-content').innerHTML = `
      <article class="card profile-card"><div class="profile-top"><span class="avatar" aria-hidden="true">✦</span><div><h3>${escape(profile.name)}<span class="sample-label">模拟画像</span></h3><p>${escape(profile.summary)}</p></div></div><div class="profile-overview"><div><p class="overline">工作年限（示例）</p><span class="years">${escape(profile.years)} <small>年</small></span></div><div><p class="overline">教育背景（示例）</p><p>${escape(profile.education)}</p></div><div class="profile-skills"><p class="overline">核心技能（示例）</p><div class="chips">${profile.skills.map(skill => `<span class="chip">${escape(skill)}</span>`).join('')}</div></div></div></article>
      <div class="analysis-grid"><article class="card analysis-card"><h3>工作经历摘要</h3>${profile.experience.map(item => `<div class="timeline-item"><strong>${escape(item.title)}</strong><small>${escape(item.date)}</small><p>${escape(item.summary)}</p></div>`).join('')}</article><article class="card analysis-card"><h3>简历优势</h3>${list(profile.strengths)}</article><article class="card analysis-card"><h3>简历不足与改进建议</h3>${list(profile.weaknesses)}</article><article class="card analysis-card"><h3>如何理解这份分析</h3>${list(['此处使用独立的虚构画像，不读取或判断你的真实经历。', '未来真实分析会区分事实、推断与建议，并保留原文依据。', '缺少描述不等于缺少能力；成果数字必须来自真实材料。'])}</article></div>
      <article class="card directions-card"><h3>推荐求职方向 · 模拟建议</h3><div class="directions">${profile.directions.map(item => `<div class="direction"><strong>${escape(item.title)}</strong><p>${escape(item.reason)}</p><button type="button" class="text-button choose-direction" data-role="${escape(item.title)}">用作目标岗位 →</button></div>`).join('')}</div></article>`;
  }
  let loadingTimer;
  function stopLoading() {
    clearInterval(loadingTimer);
    $('analysis-loading').hidden = true;
    $('resume-form').setAttribute('aria-busy', 'false');
    $('analyze-button').textContent = '进入简历分析 →';
  }
  function startLoading() {
    const hints = ['正在分析你的简历……', '正在梳理你的工作经历……', '正在识别核心技能……', '正在判断适合的求职方向……'];
    let index = 0;
    $('analysis-loading').hidden = false;
    $('analysis-loading-text').textContent = hints[0];
    $('resume-form').setAttribute('aria-busy', 'true');
    $('analyze-button').textContent = '正在分析，请稍候……';
    loadingTimer = setInterval(() => { $('analysis-loading-text').textContent = hints[++index % hints.length]; }, 3500);
  }
  function renderAnalysis(profile) {
    if (profile.isMock) { renderMockAnalysis(profile); return; }
    const items = values => values.length ? list(values) : '<p>简历中未提供足够信息。</p>';
    const confidence = { high: '证据较充分', medium: '证据一般', low: '需补充证据' };
    $('analysis-content').innerHTML = `
      <article class="card profile-card"><div class="profile-top"><span class="avatar" aria-hidden="true">✦</span><div><h3>候选人概况</h3><p>${escape(profile.candidateProfile)}</p></div></div><div class="profile-overview"><div><p class="overline">工作年限</p><span class="years ai-years">${escape(profile.experienceYears)}</span></div><div><p class="overline">当前职业方向</p><p>${escape(profile.currentDirection)}</p></div><div class="profile-skills"><p class="overline">核心技能</p><div class="chips">${profile.coreSkills.map(s => `<span class="chip">${escape(s)}</span>`).join('') || '未提供'}</div></div></div></article>
      <div class="analysis-grid"><article class="card analysis-card"><h3>工作经历与项目摘要</h3>${'<p>' + escape(profile.workExperienceSummary) + '</p>'}</article><article class="card analysis-card"><h3>教育背景</h3>${'<p>' + escape(profile.educationSummary) + '</p>'}</article><article class="card analysis-card"><h3>简历优势</h3>${items(profile.strengths)}</article><article class="card analysis-card"><h3>简历不足与建议补充</h3>${items(profile.weaknesses)}<p class="inline-note">未描述不等于没有能力；请仅补充真实经历与成果。</p></article><article class="card analysis-card"><h3>缺少的信息</h3>${profile.missingInformation.length ? list(profile.missingInformation) : '<p>暂未识别到关键缺失信息，请核对摘要。</p>'}</article></div>
      <article class="card directions-card"><h3>推荐求职方向</h3><p class="inline-note">根据经历推断的方向；推荐程度表示证据充分度，不是录用概率。</p><div class="directions">${profile.recommendedDirections.map(d => `<div class="direction"><strong>${escape(d.title)}</strong><span class="chip">${escape(confidence[d.confidence] || d.confidence)}</span><p>${escape(d.reason)}</p><details><summary>查看判断依据</summary><p>${escape(d.evidence)}</p></details><button type="button" class="text-button choose-direction" data-role="${escape(d.title)}">用作目标岗位 →</button></div>`).join('') || '<p>当前信息不足，暂不能推荐可靠方向。</p>'}</div></article>`;
  }
  $('file-method').addEventListener('click', () => setMethod('file'));
  $('text-method').addEventListener('click', () => { setMethod('text'); $('resume-text').focus(); });
  $('resume-file').addEventListener('change', event => { if (event.target.files[0]) selectFile(event.target.files[0]); });
  $('remove-file').addEventListener('click', () => { clearExtracted(); state.file = null; $('resume-file').value = ''; $('file-summary').hidden = true; $('file-name').textContent = ''; $('file-size').textContent = ''; $('resume-error').hidden = true; $('resume-file').focus(); announce('已清空简历，可以重新选择文件。'); });
  $('resume-text').addEventListener('input', updatePastedText);
  $('use-example').addEventListener('click', () => { setMethod('text'); $('resume-text').value = providers.exampleResume; updatePastedText(); $('resume-text').focus(); });
  $('toggle-preview').addEventListener('click', () => { const expand = $('extracted-preview').hidden; $('extracted-preview').hidden = !expand; $('toggle-preview').setAttribute('aria-expanded', String(expand)); $('toggle-preview').textContent = expand ? '收起提取内容' : '查看提取内容'; });
  ['dragenter', 'dragover'].forEach(name => $('drop-zone').addEventListener(name, event => { event.preventDefault(); $('drop-zone').classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach(name => $('drop-zone').addEventListener(name, event => { event.preventDefault(); $('drop-zone').classList.remove('dragging'); }));
  $('drop-zone').addEventListener('drop', event => {
    $('resume-file').value = '';
    if (event.dataTransfer.files.length !== 1) { clearExtracted(); state.file = null; $('file-summary').hidden = true; displayError('resume-error', '请一次选择一份简历。'); return; }
    selectFile(event.dataTransfer.files[0]);
  });
  // Stop the browser opening dropped files outside the upload target.
  window.addEventListener('dragover', event => event.preventDefault());
  window.addEventListener('drop', event => event.preventDefault());
  $('resume-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (state.busy || state.reading) return;
    const text = window.resumeText;
    const error = state.method === 'file' ? (providers.validateFile(state.file) || (!text ? '这份文件尚未成功读取，请重新上传或使用“粘贴文本”。' : '')) : (!text ? '请先粘贴简历文本，或点击“试用示例简历”。' : '');
    if (error) { displayError('resume-error', error); (state.method === 'file' ? $('resume-file') : $('resume-text')).focus(); return; }
    try { window.AnalysisContract.clean(text); } catch (error) { displayError('resume-error', error.message); return; }
    const generation = state.generation;
    const controller = new AbortController();
    state.aiAbort = controller;
    state.busy = true;
    $('analyze-button').disabled = true;
    $('resume-error').hidden = true;
    startLoading();
    try {
      const profile = await providers.analysisProvider.analyze({ resumeText: text, signal: controller.signal });
      if (generation !== state.generation) return;
      state.profile = profile;
      state.jobs = [];
      state.highestStep = 3;
        $('resume-origin').textContent = `已${state.method === 'file' ? '读取：' + state.file.name : '接收粘贴文本'}，共 ${Array.from(text).length.toLocaleString('zh-CN')} 个字符。${profile.isMock ? '当前为开发演示，以下不是对这份材料的真实分析。' : '以下分析基于你提供的简历，请核对事实和建议。'}`;
      $('analysis-notice').textContent = profile.isMock ? '开发演示模式：使用独立虚构画像，不调用 AI。' : 'AI 分析已完成。事实依据来自简历；推荐方向是推断，待补充内容是建议。';
      renderAnalysis(profile);
      showStep(2);
      announce('简历分析已完成，可继续粘贴目标 JD 优化简历。');
    } catch (error) {
      if (generation !== state.generation || error.code === 'CANCELLED') return;
      const diagnostic = ['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname) ? '（' + (error.code || 'UNAVAILABLE') + (error.status ? '，HTTP ' + error.status : '，未取得 HTTP 状态') + '）' : '';
      displayError('resume-error', (error.message || 'AI 分析暂时失败，请稍后重试。') + diagnostic);
      console.warn('Resume analysis:', error.code || 'UNAVAILABLE');
    }
    finally { if (generation === state.generation) { state.busy = false; state.aiAbort = null; stopLoading(); $('analyze-button').disabled = false; } }
  });
  $('analysis-content').addEventListener('click', event => {
    const button = event.target.closest('.choose-direction');
    if (!button) return;
    $('target-role').value = button.dataset.role;
    showStep(3);
    $('target-jd').focus();
    announce('已将 ' + button.dataset.role + ' 填入目标岗位。');
  });
  let optimizationTimer;
  function stopOptimizationLoading(){
    clearInterval(optimizationTimer);
    $('optimization-loading').hidden=true;
    $('optimization-form').setAttribute('aria-busy','false');
    $('optimize-button').textContent='开始优化简历 →';
    $('optimization-form').querySelectorAll('input,textarea,button').forEach(el=>el.disabled=false);
  }
  function startOptimizationLoading(){
    const hints=['正在理解目标岗位……','正在分析 JD 关键词……','正在匹配你的真实经历……','正在优化简历表达……','正在生成针对性简历……'];let index=0;
    $('optimization-loading').hidden=false;$('optimization-loading-text').textContent=hints[0];
    $('optimization-form').setAttribute('aria-busy','true');
    $('optimization-form').querySelectorAll('input,textarea,button').forEach(el=>el.disabled=true);
    $('optimize-button').textContent='正在优化，请稍候……';
    optimizationTimer=setInterval(()=>{$('optimization-loading-text').textContent=hints[++index%hints.length];},3500);
  }
  function renderOptimization(result,role){
    const checks=window.OptimizationContract.readChecks(result.factChecks);
    const items=(values,empty='暂无需要补充的内容。')=>values.length?list(values):'<p class="subtle">'+empty+'</p>';
    const priority=values=>items(values.slice(0,2))+(values.length>2?'<details class="quality-details"><summary>展开其余 '+(values.length-2)+' 项</summary>'+items(values.slice(2))+'</details>':'');
    const fold=(title,content,open=false)=>'<details class="card optimization-card quality-details"'+(open?' open':'')+'><summary>'+title+'</summary><div class="quality-detail-content">'+content+'</div></details>';
    const compare=(title,entries,section)=>entries.length?'<article class="card optimization-card"><h3>'+title+'</h3>'+entries.map((item,index)=>{
      const flagged=checks.issues.some(v=>v.section===section&&v.index===index);
      const name=item.company?(item.company===window.OptimizationContract.fallback?'原文片段':item.company)+' · '+(item.title===window.OptimizationContract.fallback?'职位待确认':item.title):item.name;
      return '<section class="rewrite-item"><h4>'+escape(name)+'</h4>'+(flagged?'<p class="fact-badge">建议确认真实性 · 未确认的改写已保留原文</p>':'')+'<div class="rewrite-grid"><div class="original-copy"><span class="overline">原文</span><p>'+escape(item.original)+'</p></div><div class="optimized-copy"><span class="overline">优化后</span><p>'+escape(item.optimized)+'</p></div></div><details class="quality-details rewrite-reason"><summary>为什么这么改</summary><p>'+escape(item.reason)+'</p></details></section>';
    }).join('')+'</article>':'';
    const factDetails=checks.issues.length?'<article class="card optimization-card evidence-card"><h3>建议确认真实性</h3><p>基础核对发现 '+checks.issues.length+' 处待确认内容，已保留原文或撤回不确定的改写，其余结果可正常查看。</p><details class="quality-details"><summary>展开事实核对说明</summary>'+items(checks.issues.map(v=>v.message))+'</details></article>':'';
    $('optimization-results').innerHTML=
      '<article class="card optimization-card"><div class="optimization-overview"><div><p class="eyebrow">岗位匹配概览</p><h3>'+escape(role)+'</h3><p>'+escape(result.jdSummary)+'</p></div><div class="score"><strong>'+escape(result.matchScore)+'</strong><span>原始简历匹配度 / 100</span></div></div><p class="inline-note">评分反映本次 JD 与已有经历的证据匹配，不是录用概率。缺少描述不等于缺少能力。</p><div class="analysis-grid"><div><h4>最相关的优势</h4>'+priority(result.matchedStrengths)+'</div><div><h4>最需要补充的差距</h4>'+priority(result.gaps)+'</div></div>'+fold('查看 JD 关键词','<div class="chips">'+result.importantKeywords.map(s=>'<span class="chip">'+escape(s)+'</span>').join('')+'</div>')+'</article>'+
      factDetails+compare('工作经历优化',result.optimizedExperiences,'optimizedExperiences')+compare('项目经历优化',result.optimizedProjects,'optimizedProjects')+
      '<article class="card optimization-card"><div class="section-heading compact"><div><h3>完整优化版简历</h3><p>与上面的经历改写使用同一份内容，补充建议不会写入正文。</p></div><button type="button" class="button primary" id="copy-resume">复制优化简历</button></div><p class="submission-note">AI 仅基于你提供的真实经历进行改写。投递前请再次确认时间、数据、技能和项目描述准确无误。</p><pre class="full-resume" id="optimized-resume-text"></pre><button type="button" class="text-button" id="toggle-full-resume" aria-expanded="false" aria-controls="optimized-resume-text">展开全文</button><p id="copy-status" class="inline-note" role="status"></p><button type="button" class="button secondary" id="reoptimize">调整要求重新优化</button></article>'+
      fold('这次重点优化了什么',items(result.optimizationSummary))+
      (result.optimizedProfile!==window.OptimizationContract.fallback?fold('个人简介优化','<p class="plain-copy">'+escape(result.optimizedProfile)+'</p>'):'')+
      fold('建议重点展示的真实技能',items(result.optimizedSkills,'当前没有可确认的技能条目，请核对原简历。'))+
      fold('这些信息如果你有，建议补充','<p class="inline-note">仅在确实具备时补充真实经历和数据，以下内容未进入正式简历。</p>'+items(result.missingEvidence)+items(result.suggestedQuestions));
    $('optimized-resume-text').textContent=result.fullOptimizedResume;
    $('optimization-results').hidden=false;
    $('optimization-results').scrollIntoView({block:'start'});
  }
  $('go-optimize').addEventListener('click',()=>{showStep(3);$('target-role').focus();});
  $('target-jd').addEventListener('input',()=>{$('jd-count').textContent=$('target-jd').value.length+' / 12000';});
  $('optimization-form').addEventListener('submit',async event=>{
    event.preventDefault();if(state.busy||state.reading)return;
    if(!state.profile||!window.resumeText){displayError('optimization-error','请先上传简历并完成简历分析。');return;}
    const input={resumeText:window.resumeText,analysis:state.profile,targetRole:$('target-role').value,jd:$('target-jd').value,focuses:[...document.querySelectorAll('input[name="focus"]:checked')].map(el=>el.value),extraRequirements:$('extra-requirements').value};
    try{window.OptimizationContract.input(input);}catch(error){displayError('optimization-error',error.message);return;}
    const generation=state.generation,controller=new AbortController();state.optimizeAbort=controller;state.busy=true;
    state.optimization=null;$('optimization-results').replaceChildren();$('optimization-results').hidden=true;$('optimization-error').hidden=true;startOptimizationLoading();
    try{
      const result=await window.ResumeOptimization.optimize(input,{signal:controller.signal});
      if(generation!==state.generation)return;
      state.optimization=result;renderOptimization(result,input.targetRole);announce('简历优化已完成，请核对原文、改写与完整简历。');
    }catch(error){
      if(generation!==state.generation||error.code==='CANCELLED')return;
      const detail=['127.0.0.1','localhost'].includes(location.hostname)?'（'+(error.code||'UNAVAILABLE')+(error.status?'，HTTP '+error.status:'')+'）':'';
      displayError('optimization-error','简历优化暂时失败，请稍后重试。'+detail);
    }finally{if(generation===state.generation){state.busy=false;state.optimizeAbort=null;stopOptimizationLoading();}}
  });
  $('optimization-results').addEventListener('click',async event=>{
    if(event.target.closest('#toggle-full-resume')){const button=$('toggle-full-resume'),expanded=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'收起全文':'展开全文';$('optimized-resume-text').classList.toggle('expanded',expanded);}
    if(event.target.closest('#reoptimize')){if(state.busy)return;$('optimization-form').scrollIntoView({block:'start'});$('target-jd').focus();announce('调整要求后，点击开始优化简历。');}
    if(event.target.closest('#copy-resume')&&state.optimization){
      const button=$('copy-resume');button.disabled=true;
      try{await navigator.clipboard.writeText(state.optimization.fullOptimizedResume);$('copy-status').textContent='已复制，可以粘贴到你的文档中。';}
      catch{const range=document.createRange();range.selectNodeContents($('optimized-resume-text'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);$('copy-status').textContent='浏览器未允许自动复制，已选中文字，请按 Ctrl+C（手机可长按复制）。';}
      finally{button.disabled=false;}
    }
  });
  document.querySelectorAll('.reset-resume').forEach(button => button.addEventListener('click', reset));
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.step))));
  // Clear restored form values on reload/back-forward, including browser bfcache.
  window.addEventListener('pageshow', () => reset(false));
  if (['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname) && providers.analysisMode !== 'demo') {
    const checkButton = $('check-ai-connection');
    checkButton.hidden = false;
    checkButton.addEventListener('click', async () => {
      if (state.busy || state.reading || checkButton.disabled) return;
      checkButton.disabled = true;
      $('analyze-button').disabled = true;
      const status = $('ai-connection-status');
      status.hidden = false;
      status.textContent = '正在检查跨域连接与 AI 接口，不发送简历、不调用模型……';
      try {
        await providers.analysisProvider.checkConnection();
        status.textContent = '连接正常：跨域预检和 AI 接口检查已通过，未调用模型。可以进入简历分析。';
      } catch (error) {
        status.textContent = error.message + '（' + error.code + (error.status ? '，HTTP ' + error.status : '，未取得 HTTP 状态') + '）请截图 Console 中的 AI request 记录。';
      } finally { checkButton.disabled = false; if (!state.busy) $('analyze-button').disabled = false; }
    });
  }
  $('analysis-mode').textContent = providers.analysisMode === 'demo' ? '开发演示 · 不调用 AI' : 'AI 简历分析 · 定向优化';
})();
