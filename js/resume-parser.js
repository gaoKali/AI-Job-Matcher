(function (root) {
  'use strict';
  function error(code, message) { const result = new Error(message); result.code = code; return result; }
  async function parse(file, { signal, onProgress = () => {} } = {}) {
    const validation = root.JobMatcherProviders.validateFile(file);
    if (validation) throw error('VALIDATION', validation);
    if (signal?.aborted) throw error('CANCELLED', '已取消读取。');
    if (root.location.protocol === 'file:') throw error('LOCAL_PREVIEW_REQUIRED', '请通过本地预览地址打开网页再上传文件；直接打开 HTML 时浏览器会限制 PDF 解析。粘贴文本仍可使用。');
    if (!root.Worker || !file.arrayBuffer) throw error('UNSUPPORTED_BROWSER', '当前浏览器暂不支持本地读取，请使用新版 Chrome 或 Edge，或使用“粘贴文本”。');
    let buffer;
    try { buffer = await file.arrayBuffer(); } catch { throw error('FILE_READ_FAILED', '浏览器无法读取这个文件，请重新选择简历，或使用“粘贴文本”。'); }
    if (signal?.aborted) throw error('CANCELLED', '已取消读取。');
    return new Promise((resolve, reject) => {
      let worker, timer, settled = false;
      const finish = (failure, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
        worker?.terminate();
        buffer = null;
        if (failure) reject(failure); else resolve(result);
      };
      const cancel = () => finish(error('CANCELLED', '已取消读取。'));
      try {
        worker = new root.Worker(new URL('js/resume-worker.js', root.document.baseURI));
        signal?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(() => finish(error('TIMEOUT', '读取时间过长，已停止处理。请重新导出简历或使用“粘贴文本”。')), 45000);
        worker.onerror = event => { event.preventDefault(); finish(error('BROWSER_ERROR', '浏览器本地解析遇到异常，请刷新后重试，或使用“粘贴文本”。')); };
        worker.onmessageerror = () => finish(error('BROWSER_ERROR', '浏览器无法接收解析结果，请重试或使用“粘贴文本”。'));
        worker.onmessage = event => {
          if (event.data.type === 'progress') onProgress(event.data.message);
          else if (event.data.type === 'success') finish(null, event.data.result);
          else if (event.data.type === 'error') finish(error(event.data.code, event.data.message));
        };
        worker.postMessage({ format: /\.pdf$/i.test(file.name) ? 'pdf' : 'docx', buffer }, [buffer]);
      } catch { finish(error('BROWSER_ERROR', '浏览器无法启动本地解析，请刷新后重试，或使用“粘贴文本”。')); }
    });
  }
  root.JobMatcherProviders.resumeParser = { parse };
})(window);
