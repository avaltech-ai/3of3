// 常用文件可上傳壓縮檔（zip／rar／7z）與補齊的常見格式、單檔 25 MB 上限、對應圖示（瀏覽器測試）。需從中文介面開始、剛載入的頁面。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(2500);
  const $ = id => document.getElementById(id);
  const real = { cb: window.callBackend, toast: window.showToast, load: window.loadAppData, docs: state.docs, pwd: state.adminPassword };
  const toasts = [], cbs = [];
  window.showToast = (m) => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  window.callBackend = (a, p, okCb) => { cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true, fileId: 'F1', downloadUrl: 'https://x/y' }); };
  state.adminPassword = 'tok'.repeat(15);
  const choose = (file) => { const dt = new DataTransfer(); dt.items.add(file); const inp = $('docModal-fileInput'); inp.files = dt.files; handleDocModalFileChosen({ target: inp }); return inp; };
  const mb = n => n * 1024 * 1024;
  const badge = html => { const m = html.match(/<text[^>]*>([^<]*)<\/text>/); return m ? m[1] : ''; };
  const page = html => (html.match(/<path d="M6 3\.5[^>]*fill="(#[0-9A-Fa-f]{6})"/) || [])[1];

  // A. 選檔視窗的 accept 與程式裡的清單一致，且含壓縮檔
  const accepted = $('docModal-fileInput').getAttribute('accept').split(',').map(x => x.replace('.', '').trim());
  ok(accepted.slice().sort().join() === DOC_ALLOWED_EXT.slice().sort().join(), '選檔視窗 accept 與 DOC_ALLOWED_EXT 完全一致：' + accepted.join(' '));
  ok(['zip', 'rar', '7z'].every(x => accepted.indexOf(x) !== -1), 'accept 含 zip、rar、7z');
  ok(['ppt', 'pptx', 'csv', 'txt', 'jpeg'].every(x => accepted.indexOf(x) !== -1), '順手補齊：ppt、pptx、csv、txt、jpeg');
  ok(/25 MB/.test($('docModal-fileStatus').textContent) && /ZIP／RAR／7Z/.test($('docModal-fileStatus').textContent), '說明文字寫出可傳的格式與 25 MB 上限');

  // B. 檔案檢查
  const f = (name, size, type) => ({ name: name, size: size, type: type || '' });
  ok(['a.zip', 'a.rar', 'a.7z', 'A.ZIP', 'b.RAR', '期末.7Z', 'x.pdf', 'x.docx', 'x.pptx', 'x.csv', 'x.txt', 'x.jpeg'].every(n => docFileProblem(f(n, 1000)) === ''), '允許的副檔名（含大寫、中文檔名）都通過');
  ok(['a.exe', 'a.sh', 'a.dmg', 'a.js', 'noext', 'a.', '.zip.exe'].every(n => /不支援/.test(docFileProblem(f(n, 1000)))), '不允許的副檔名被擋（exe、sh、dmg、js、沒有副檔名、以點結尾、.zip.exe）');
  ok(docFileProblem(f('a.zip', mb(25))) === '' && /太大/.test(docFileProblem(f('a.zip', mb(25) + 1))), '剛好 25 MB 可以，多 1 位元組就擋');
  ok(/26\.0 MB/.test(docFileProblem(f('a.zip', mb(26)))), '太大的提示寫出實際大小');
  ok(docFileProblem(null) !== '', '沒有檔案：不通過');

  // C. 上傳用的檔案類型
  ok(docUploadMime(f('a.rar', 10, '')) === 'application/vnd.rar' && docUploadMime(f('a.7z', 10, '')) === 'application/x-7z-compressed' && docUploadMime(f('a.zip', 10, '')) === 'application/zip', '瀏覽器沒給類型時：rar／7z／zip 依副檔名補上正確類型（不再一律當 PDF）');
  ok(docUploadMime(f('a.zip', 10, 'application/x-zip-compressed')) === 'application/x-zip-compressed', '瀏覽器有給類型：照用');
  ok(docUploadMime(f('a.weird', 10, '')) === 'application/octet-stream' && docUploadMime(f('noext', 10, '')) === 'application/octet-stream', '查不到：通用二進位（不是 PDF）');
  ok(Object.keys(DOC_MIME_BY_EXT).sort().join() === DOC_ALLOWED_EXT.slice().sort().join(), '每個允許的副檔名都有對應類型');

  // D. 圖示
  const ic = e => getDocFileIconHtml({ fileName: 'x.' + e, fileExtension: e });
  ok(['zip', 'rar', '7z', 'tar', 'gz'].every(e => page(ic(e)) === '#D97706'), '壓縮檔（zip、rar、7z、tar、gz）：同一種琥珀色');
  ok(badge(ic('zip')) === 'ZIP' && badge(ic('rar')) === 'RAR' && badge(ic('7z')) === '7Z' && badge(ic('tar')) === 'TAR' && badge(ic('gz')) === 'GZ', '徽章顯示真正的副檔名（以前 RAR、7Z 都寫成 ZIP）');
  ok(page(ic('pdf')) === '#EF4444' && badge(ic('pdf')) === 'PDF' && page(ic('docx')) === '#2563EB' && page(ic('xlsx')) === '#059669' && page(ic('pptx')) === '#EA580C' && page(ic('png')) === '#7C3AED', '其他格式的圖示不受影響（PDF、Word、Excel、PowerPoint、圖片）');
  ok(page(ic('xyz')) === '#64748B' && badge(ic('xyz')) === 'XYZ', '沒有專屬圖示的格式：灰色圖示加副檔名');
  ok(badge(getDocFileIconHtml({ fileName: '備份.RAR', fileExtension: '' })) === 'RAR', '資料裡沒有 fileExtension：從檔名判斷（大寫也行）');
  const evil = document.createElement('div'); evil.innerHTML = getDocFileIconHtml({ fileName: 'a', fileExtension: '<img src=x onerror=window.__docpwn=1>' });
  ok(evil.querySelectorAll('img,script').length === 0 && !window.__docpwn && /<IMG/.test(evil.textContent), '副檔名含惡意字串：被跳脫成純文字，不會變成元素');

  // E. 選檔流程
  openDocEditModal();
  const inp = choose(new File(['x'], '家長手冊.zip', { type: 'application/zip' }));
  ok(docModalSelectedFile && docModalSelectedFile.name === '家長手冊.zip' && /已選取新檔案：家長手冊\.zip/.test($('docModal-fileStatus').textContent) && $('docModal-fileName').value === '家長手冊.zip', '選 zip：已選取、狀態列顯示檔名、文件名稱自動帶入');
  toasts.length = 0;
  choose(new File(['x'], 'virus.exe', { type: 'application/x-msdownload' }));
  ok(toasts.some(t => /不支援/.test(t)) && docModalSelectedFile.name === '家長手冊.zip' && $('docModal-fileInput').value === '', '再選 exe：提示不支援、輸入框清空、原本選好的 zip 保留');
  toasts.length = 0;
  choose(new File([new Uint8Array(mb(25) + 1)], 'big.zip', { type: 'application/zip' }));
  ok(toasts.some(t => /太大/.test(t)) && docModalSelectedFile.name === '家長手冊.zip', '選超過 25 MB 的 zip：提示太大、不取代原本的選擇');

  // F. 實際送出：rar（瀏覽器沒給類型）上傳到後端
  closeDocEditModalNow && closeDocEditModalNow();
  openDocEditModal();
  $('docModal-fileName').value = '';
  choose(new File(['RAR!'], '園外教學資料.rar', { type: '' }));
  ok($('docModal-fileName').value === '園外教學資料.rar', '（對照）rar 也能選取並帶入名稱');
  const cat = $('docModal-category'); if (cat && cat.options.length && !cat.value) cat.value = cat.options[0].value;
  cbs.length = 0; handleSaveDocModal();
  await wait(400);
  const up = cbs.find(c => c.a === 'uploadDocument');
  ok(!!up && up.p.file.name === '園外教學資料.rar' && up.p.file.mimeType === 'application/vnd.rar' && up.p.meta.fileExtension === 'rar', '送出：後端收到 .rar、類型 application/vnd.rar、副檔名 rar（不是 pdf）');
  ok(!!up && up.p.file.base64 === btoa('RAR!'), '檔案內容原樣送出（base64）');
  ok(!!state.docs.find(d => d.fileName === '園外教學資料.rar' && d.fileExtension === 'rar'), '本機列表立即出現這份文件且副檔名是 rar');

  // 還原
  try { closeDocEditModalNow(); } catch (e) {}
  Object.assign(window, { callBackend: real.cb, showToast: real.toast, loadAppData: real.load });
  state.docs = real.docs; state.adminPassword = real.pwd;
  const bad = res.filter(x => x.startsWith('✗'));
  console.log(res.join('\n') + '\n\n' + (res.length - bad.length) + ' 項通過，' + bad.length + ' 項失敗');
  return res.join('\n') + '\n\n' + (res.length - bad.length) + ' pass / ' + bad.length + ' fail';
})();
