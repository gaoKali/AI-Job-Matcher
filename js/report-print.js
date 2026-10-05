(function(root){
'use strict';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const disclaimer='本报告由 AI 基于用户提供的简历和目标岗位 JD 生成。AI 仅用于辅助优化表达，投递前请再次确认经历、时间、技能、数据及项目描述真实准确。';
const dateString=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function title(role,date){const safe=String(role||'目标岗位').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'').replace(/\+?\d[\d\s()-]{6,}\d/g,'').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'').trim().slice(0,30)||'目标岗位';return 'AI简历优化报告_'+safe+'_'+dateString(date);}
function render(result,role,date=new Date()){
 const text=v=>'<p class="report-text">'+escape(v)+'</p>';
 const list=values=>values?.length?'<ul>'+values.map(v=>'<li>'+escape(v)+'</li>').join('')+'</ul>':'<p class="report-empty">暂无可提供的条目。</p>';
 const section=(name,body,classes='')=>'<section class="report-section '+classes+'"><h2>'+name+'</h2>'+body+'</section>';
 const compares=(name,values,kind)=>!values?.length?'':section(name,values.map(item=>{
  const identity=kind==='work'?[item.company,item.title].filter(v=>v&&v!==root.OptimizationContract?.fallback).join(' · '):item.name;
  const length=item.original.length+item.optimized.length+item.reason.length;
  if(length>850||(item.original+'\n'+item.optimized).split('\n').length>20){
   const longCopy=(label,value)=>'<table class="report-long-copy"><thead><tr><th><h3>'+escape(identity||'原文片段')+' <span>· '+label+'</span></h3></th></tr></thead><tbody><tr><td>'+text(value)+'</td></tr></tbody></table>';
   return '<article class="report-comparison-long">'+longCopy('原文',item.original)+longCopy('优化后',item.optimized)+'<div class="report-reason"><h4>为什么这么改 · '+escape(identity||'原文片段')+'</h4>'+text(item.reason)+'</div></article>';
  }
  return '<article class="report-comparison '+(length>850?'report-comparison-long':'')+'"><h3>'+escape(identity||'原文片段')+'</h3><div class="report-copy"><h4>原文</h4>'+text(item.original)+'</div><div class="report-copy report-improved"><h4>优化后</h4>'+text(item.optimized)+'</div><div class="report-reason"><h4>为什么这么改</h4>'+text(item.reason)+'</div></article>';
 }).join(''));
 const checks=root.OptimizationContract?.readChecks(result.factChecks);
 return '<header class="report-header"><div class="report-brand">向前 <span>AI Resume Optimization Report</span></div><h1>AI 简历优化报告</h1><dl class="report-meta"><div><dt>目标岗位</dt><dd>'+escape(role)+'</dd></div><div><dt>原始简历与 JD 匹配度</dt><dd>'+escape(result.matchScore)+' / 100</dd></div><div><dt>生成时间</dt><dd>'+dateString(date)+' '+String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0')+'</dd></div></dl><p class="report-caption">匹配度反映已有经历与 JD 的证据匹配，不代表录用概率。缺少描述不等于缺少能力。</p></header>'+
 section('JD 核心需求',text(result.jdSummary)+(result.importantKeywords?.length?'<p class="report-keywords"><strong>核心关键词：</strong>'+result.importantKeywords.map(escape).join(' · ')+'</p>':''))+
 section('已匹配优势',list(result.matchedStrengths))+
 section('主要差距',list(result.gaps))+
 section('本次优化重点',list(result.optimizationSummary))+
 (result.optimizedProfile&&result.optimizedProfile!==root.OptimizationContract?.fallback?section('个人简介优化',text(result.optimizedProfile)):'')+
 compares('工作经历优化',result.optimizedExperiences,'work')+
 compares('项目经历优化',result.optimizedProjects,'project')+
 section('建议重点展示的真实技能',list(result.optimizedSkills))+
 section('需要补充 / 确认的信息','<p class="report-caption">仅在确实具备时补充，以下建议没有写入正式简历。</p>'+list(result.missingEvidence)+(checks?.issues.length?'<h3>建议确认真实性</h3>'+list([...new Set(checks.issues.map(v=>v.message))]):''))+
 section('建议进一步补充的问题',list(result.suggestedQuestions))+
 section('完整优化版简历','<p class="report-caption">AI 仅基于你提供的真实经历进行改写。投递前请再次确认时间、数据、技能和项目描述准确无误。</p>'+text(result.fullOptimizedResume),'report-full-resume')+
 '<footer class="report-footer">'+disclaimer+'</footer>';
}
function install(win){
 const doc=win.document;let report=null,previousTitle=null,printing=false;
 function clear(){report=null;const node=doc.getElementById('pdf-report');if(node)node.replaceChildren();finish();}
 function set(result,role,date=new Date()){
  finish();report={filename:title(role,date)};let node=doc.getElementById('pdf-report');
  if(!node){node=doc.createElement('section');node.id='pdf-report';node.setAttribute('aria-hidden','true');doc.body.append(node);}
  node.innerHTML=render(result,role,date);
 }
 function before(){if(!report)return; if(previousTitle===null)previousTitle=doc.title;doc.title=report.filename;}
 function finish(){if(previousTitle!==null){doc.title=previousTitle;previousTitle=null;}printing=false;doc.querySelectorAll('.download-pdf-report').forEach(b=>b.disabled=false);}
 function print(){if(!report||printing)return false;printing=true;before();doc.querySelectorAll('.download-pdf-report').forEach(b=>b.disabled=true);try{win.print();return true;}catch{finish();return false;}}
 win.addEventListener('beforeprint',before);win.addEventListener('afterprint',finish);win.addEventListener('focus',()=>{if(printing)finish();});
 const media=win.matchMedia?.('print');media?.addEventListener?.('change',e=>{if(!e.matches)finish();});
 return {set,clear,print};
}
const api={render,title,disclaimer,install};if(typeof module!=='undefined')module.exports=api;
if(root.document)root.ResumeReport=install(root);
})(typeof window==='undefined'?globalThis:window);
