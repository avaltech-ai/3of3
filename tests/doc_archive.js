// 常用文件的檔案檢查與圖示（瀏覽器測試）：可上傳的格式（含 zip／rar／7z）、單檔 25 MB、上傳類型、圖示、副檔名判斷。需從中文介面開始、剛載入的頁面。
// 表單的檔案清單、逐個上傳、前台展開等在 tests/doc_multifile.js。
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

  // G. 副檔名判斷（使用者回報：貼 Drive 連結、名稱「注音學習卡（形狀口訣）v2」的 zip 被當成副檔名 v2）
  ok(docResolveExt('', '', '注音學習卡（形狀口訣）v2', '') === 'pdf', '名稱結尾 v2（前面沒有點）：不是副檔名，預設 pdf（以前會變成 v2）');
  ok(docResolveExt('', '', '園遊會報告版本2.0', '') === 'pdf' && docResolveExt('', '', '報告 v2.0', '') === 'pdf', '「2.0」這類數字結尾不是副檔名');
  ok(docResolveExt('', '', '園外教學.7z', '') === '7z' && docResolveExt('', '', '手冊.PDF', '') === 'pdf' && docResolveExt('', '', '影片.mp4', '') === 'mp4', '名稱結尾「.副檔名」：照用（含 7z、大寫、未知格式 mp4）');
  ok(docResolveExt('zip', '', '注音學習卡（形狀口訣）v2', '') === 'zip', '下拉選單選 zip：名稱沒寫副檔名也是 zip');
  ok(docResolveExt('zip', 'a.pdf', 'b.docx', 'xlsx') === 'zip', '下拉選單優先於檔名、名稱與舊資料');
  ok(docResolveExt('', 'a.rar', 'b.docx', 'xlsx') === 'rar' && docResolveExt('', '', 'noext', 'xlsx') === 'xlsx', '沒選：上傳檔名 → 名稱 → 舊資料（認得的）');
  ok(docResolveExt('', '', 'noext', 'v2') === 'pdf' && docResolveExt('', '', 'noext', '.ZIP') === 'zip', '舊資料的副檔名不認得（v2）就忽略；有前置點、大寫會整理');

  // 還原
  try { closeDocEditModalNow(); } catch (e) {}
  Object.assign(window, { callBackend: real.cb, showToast: real.toast, loadAppData: real.load });
  state.docs = real.docs; state.adminPassword = real.pwd;
  const bad = res.filter(x => x.startsWith('✗'));
  console.log(res.join('\n') + '\n\n' + (res.length - bad.length) + ' 項通過，' + bad.length + ' 項失敗');
  return res.join('\n') + '\n\n' + (res.length - bad.length) + ' pass / ' + bad.length + ' fail';
})();
