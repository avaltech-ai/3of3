// 常用文件「一份文件多個檔案」前端測試（瀏覽器；2026-10-19）：表單的檔案清單（多選、連結、移除、上移）、逐個上傳與失敗重試、
// 舊式單檔文件的編輯、複製／另存、前台 2 個以上檔案直接展開、後台列表、安全。需從剛載入的中文介面開始。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const waitFor = async (cond, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 3000)) { if (cond()) return true; await wait(20); } return cond(); };
  await wait(3500);
  const $ = id => document.getElementById(id);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { docs: state.docs, pwd: state.adminPassword, lang: state.lang, ls: (function () { try { return localStorage.getItem('nobel_a_docs_custom'); } catch (e) { return null; } })() };
  const real = { confirm: window.confirm, cb: window.callBackend, toast: window.showToast, load: window.loadAppData };
  const toasts = [], cbs = [], confirms = []; let answer = true, seq = 0;
  let uploadBehavior = null;   // 自訂上傳的回應：(payload, ok, err) => void；null＝全部成功
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.showToast = m => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  window.callBackend = (a, p, okCb, errCb) => {
    cbs.push({ a: a, p: p });
    if (a === 'uploadDocFile') {
      if (uploadBehavior) return uploadBehavior(p, okCb, errCb);
      const id = 'DRV' + (++seq) + 'ABCDEFGHIJ'; const nm = p.file.name;
      return okCb({ success: true, file: { name: nm, ext: docFileExt(nm), driveFileId: id, downloadUrl: 'https://drive.google.com/uc?export=download&id=' + id, size: Math.round(p.file.base64.length * 3 / 4) } });
    }
    if (okCb) okCb({ success: true, message: 'ok' });
  };
  state.adminPassword = 'tok'.repeat(15); state.lang = 'zh-TW';
  const F = (name, size, type) => (size ? new File([new Uint8Array(size)], name, { type: type === undefined ? '' : type }) : new File(['hello'], name, { type: type === undefined ? '' : type }));
  const choose = files => { const dt = new DataTransfer(); files.forEach(f => dt.items.add(f)); const inp = $('docModal-fileInput'); inp.files = dt.files; handleDocModalFileChosen({ target: inp }); return inp; };
  const mk = (id, name, extra) => Object.assign({ id: id, fileName: name, fileExtension: 'pdf', category: '保健用藥', description: '說明' + id, driveFileId: 'DRIVE' + id + 'abcdefghijklmnop', downloadUrl: 'https://drive.google.com/uc?export=download&id=DRIVE' + id + 'abcdefghijklmnop', updatedAt: '2026-10-01', files: [] }, extra || {});
  const FE = (name, ext, id, size) => ({ name: name, ext: ext, driveFileId: id === undefined ? 'FID' + name.length + 'ABCDEFGHIJ' : id, downloadUrl: 'https://drive.google.com/uc?export=download&id=' + (id || 'x' + name.length), size: size === undefined ? 2048 : size });
  const reset = () => { toasts.length = 0; cbs.length = 0; confirms.length = 0; answer = true; uploadBehavior = null; state.docs = [mk('D1', '幼兒用藥委託單'), mk('D2', '學期行事曆', { category: '學期行事曆' })]; closeDocEditModalNow(); docModalFiles = []; docModalUploading = false; };
  const open = () => !$('docEditModal').classList.contains('hidden');
  const entries = () => Array.from($('docModal-fileList').querySelectorAll('[data-doc-entry]'));
  const names = () => docModalFiles.map(x => x.name).join('|');
  const badge = html => { const m = String(html).match(/<text[^>]*>([^<]*)<\/text>/); return m ? m[1] : ''; };
  const iconColor = html => (String(html).match(/<path d="M6 3\.5[^>]*fill="(#[0-9A-Fa-f]{6})"/) || [])[1];
  const calls = a => cbs.filter(c => c.a === a);
  const entriesWrap = () => { docModalFiles = [{ key: 'w', name: 'x.zip', ext: 'zip', size: 1, downloadUrl: 'https://x.test/w', driveFileId: '', file: null, error: '', busy: false }]; renderDocModalFiles(); return !!$('docModal-fileList').querySelector('[data-doc-entry] .wrap-any'); };
  reset();

  // A. 表單結構
  openDocEditModal();
  const inp0 = $('docModal-fileInput');
  ok(inp0.multiple === true && inp0.getAttribute('accept').split(',').map(x => x.replace('.', '')).sort().join() === DOC_ALLOWED_EXT.slice().sort().join(), '選檔輸入框可多選，accept 與 DOC_ALLOWED_EXT 一致');
  ok(!$('docModal-downloadUrl') && !$('docModal-fileType') && !$('docModal-driveFileId') && !$('docModal-fileStatus'), '舊的單一連結、檔案類型、Drive 編號、狀態欄位都已移除');
  ok($('docModal-linkForm').classList.contains('hidden') && $('docModal-fileCount').textContent === '0 / 10' && $('docModal-fileList').querySelector('[data-doc-file-empty]'), '新增文件：連結小表單收起、計數 0 / 10、清單顯示「還沒有檔案」');
  ok(/最多 10 個/.test($('docModal-filesBox').textContent) && /25 MB/.test($('docModal-filesBox').textContent) && /ZIP／RAR／7Z/.test($('docModal-filesBox').textContent), '標題與說明寫出 10 個、25 MB、可傳的格式');
  ok(/選取檔案上傳/.test($('docModal-addFilesBtn').textContent) && /加入雲端連結/.test($('docModal-addLinkBtn').textContent), '兩個按鈕：選取檔案上傳、加入雲端連結');

  // B. 加入檔案
  let r = docModalAddFiles([F('園外教學.zip', 0, 'application/zip'), F('說明.pdf'), F('備份.RAR')]);
  ok(r.added === 3 && names() === '園外教學.zip|說明.pdf|備份.RAR' && $('docModal-fileCount').textContent === '3 / 10', '一次加 3 個：依序進清單，計數 3 / 10');
  ok(docModalFiles.map(x => x.ext).join() === 'zip,pdf,rar' && docModalFiles.every(x => x.file && !x.driveFileId && !x.downloadUrl), '每個檔案各自判斷副檔名（zip、pdf、rar），都是「待上傳」');
  const ic = i => entries()[i].querySelector('div');
  ok(iconColor(ic(0).outerHTML) === '#D97706' && badge(ic(0).outerHTML) === 'ZIP' && iconColor(ic(1).outerHTML) === '#EF4444' && badge(ic(1).outerHTML) === 'PDF' && badge(ic(2).outerHTML) === 'RAR' && iconColor(ic(2).outerHTML) === '#D97706', '清單每列的圖示：ZIP 琥珀色、PDF 紅色、RAR 琥珀色（徽章是真正的副檔名）');
  ok(entries().every(e => /待上傳/.test(e.textContent)) && $('docModal-fileName').value === '', '每列標示「待上傳」；一次加多個時不自動填文件名稱');
  reset(); openDocEditModal(); docModalAddFiles([F('單一檔案.zip')]);
  ok($('docModal-fileName').value === '單一檔案.zip', '清單原本是空的、名稱也空、只加 1 個檔案：自動帶入檔名');
  $('docModal-fileName').value = '我的標題'; docModalAddFiles([F('第二個.pdf')]); ok($('docModal-fileName').value === '我的標題', '已有名稱：不會被覆蓋');
  reset(); openDocEditModal(); toasts.length = 0;
  r = docModalAddFiles([F('virus.exe'), F('noext'), F('ok.zip')]);
  ok(r.added === 1 && names() === 'ok.zip' && r.problems.length === 2 && /virus\.exe.*不支援/.test(toasts.join('|')), '不支援的格式：被擋下並提示（exe、沒副檔名），其他照常加入');
  toasts.length = 0; r = docModalAddFiles([F('big.zip', 25 * 1024 * 1024 + 1)]); ok(r.added === 0 && /big\.zip.*太大/.test(toasts.join('|')) && names() === 'ok.zip', '超過 25 MB：擋下並提示');
  r = docModalAddFiles([F('edge.zip', 25 * 1024 * 1024)]); ok(r.added === 1, '剛好 25 MB：可以');
  toasts.length = 0; r = docModalAddFiles([F('ok.zip')]); ok(r.added === 0 && /已經在清單裡/.test(toasts.join('|')), '同名同大小的檔案重複加入：擋下');
  reset(); openDocEditModal(); toasts.length = 0;
  r = docModalAddFiles(Array.from({ length: 12 }, (_, i) => F('f' + i + '.pdf', 10 + i)));
  ok(r.added === 10 && docModalFiles.length === 10 && r.problems.length === 2 && /最多 10 個/.test(toasts.join('|')), '一次加 12 個：只收 10 個，其餘提示超過上限');
  ok($('docModal-addFilesBtn').disabled === true && $('docModal-addLinkBtn').disabled === true && $('docModal-fileCount').textContent === '10 / 10', '滿 10 個：兩個新增按鈕停用、計數 10 / 10');
  reset(); openDocEditModal(); const inpX = choose([F('a.zip'), F('b.pdf')]);
  ok(docModalFiles.length === 2 && inpX.value === '', '透過選檔輸入框加入：成功，輸入框清空（可再選同一個檔案）');

  // C. 加入連結
  reset(); openDocEditModal();
  toggleDocLinkForm(true); ok(!$('docModal-linkForm').classList.contains('hidden'), '按「加入雲端連結」：展開小表單');
  $('docModal-linkName').value = '注音學習卡.zip'; $('docModal-linkUrl').value = 'https://drive.google.com/file/d/ABC/view?usp=sharing'; handleDocLinkAdd();
  ok(docModalFiles.length === 1 && docModalFiles[0].name === '注音學習卡.zip' && docModalFiles[0].ext === 'zip' && !docModalFiles[0].file && !docModalFiles[0].driveFileId, '加入連結：名稱結尾 .zip → 自動判斷成 zip；沒有 Drive 編號');
  ok($('docModal-linkForm').classList.contains('hidden') && $('docModal-linkName').value === '' && $('docModal-linkUrl').value === '', '加入後：小表單收起並清空');
  ok(/連結/.test(entries()[0].textContent) && !/待上傳/.test(entries()[0].textContent) && badge(entries()[0].querySelector('div').outerHTML) === 'ZIP', '清單標示「連結」、圖示是 ZIP');
  ok(docModalAddLink('注音學習卡（形狀口訣）v2', 'https://x.test/2', 'zip') === '' && docModalFiles[1].ext === 'zip', '名稱沒副檔名（…口訣）v2）但類型選 ZIP：zip（這正是使用者回報的情境）');
  ok(docModalAddLink('另一份資料v2', 'https://x.test/3', '') === '' && docModalFiles[2].ext === 'pdf', '名稱沒副檔名、類型自動判斷：pdf（不再是 v2）');
  $('docModal-fileName').value = '我的文件.docx'; ok(docModalAddLink('', 'https://x.test/4', '') === '' && docModalFiles[3].name === '我的文件.docx' && docModalFiles[3].ext === 'docx', '沒填名稱：用上面的文件名稱，並由它判斷副檔名');
  $('docModal-fileName').value = ''; ok(docModalAddLink('', 'https://x.test/5', 'xlsx') === '' && docModalFiles[4].name === '連結' && docModalFiles[4].ext === 'xlsx', '名稱都沒有：叫「連結」，類型照選的');
  const badUrls = ['', 'ftp://x.test/a', 'drive.google.com/file/d/1', 'javascript:alert(1)', 'data:text/html,x', 'https://a b', 'https://', 'http://'];
  ok(badUrls.every(u => /https:\/\//.test(docModalAddLink('n', u, '')) ) && docModalFiles.length === 5, '不是 http(s) 的連結一律拒絕（空白、ftp、沒協定、javascript:、data:、含空白、只有協定）');
  ok(/已經在清單裡/.test(docModalAddLink('n', 'https://x.test/2', '')) && docModalFiles.length === 5, '重複的連結：拒絕');
  ok(/太長/.test(docModalAddLink('n', 'https://x.test/' + 'a'.repeat(2001), '')), '連結超過 2000 字：拒絕');
  reset(); openDocEditModal(); toasts.length = 0; toggleDocLinkForm(true); $('docModal-linkUrl').value = 'ftp://bad'; handleDocLinkAdd();
  ok(/https:\/\//.test(toasts.join('|')) && !$('docModal-linkForm').classList.contains('hidden') && $('docModal-linkUrl').value === 'ftp://bad', '按「加入清單」但連結不合法：提示原因、小表單維持展開並保留輸入');
  toggleDocLinkForm(false); ok($('docModal-linkForm').classList.contains('hidden') && $('docModal-linkUrl').value === '', '取消：收起並清空');
  reset(); openDocEditModal(); docModalAddFiles(Array.from({ length: 10 }, (_, i) => F('g' + i + '.pdf', 5 + i)));
  ok(/最多 10 個/.test(docModalAddLink('n', 'https://x.test/z', '')), '滿 10 個後加連結：拒絕');

  // D. 移除與上移
  reset(); openDocEditModal(); docModalAddFiles([F('a.zip'), F('b.pdf'), F('c.rar')]);
  ok(entries()[0].querySelector('[data-doc-act="up"]') === null && entries()[1].querySelector('[data-doc-act="up"]') && entries()[2].querySelector('[data-doc-act="remove"]'), '第一個沒有「↑」；其他有「↑」；每個都有「✕」');
  entries()[2].querySelector('[data-doc-act="up"]').click(); ok(names() === 'a.zip|c.rar|b.pdf', '按第 3 個的「↑」（按鈕自己傳 this）：往前移一格');
  docModalMoveFile(docModalFiles[0].key, -1); ok(names() === 'a.zip|c.rar|b.pdf', '第一個再往前：不動');
  entries()[1].querySelector('[data-doc-act="remove"]').click(); ok(names() === 'a.zip|b.pdf' && $('docModal-fileCount').textContent === '2 / 10', '按「✕」：從清單移除');
  docModalRemoveFile(docModalFiles[0].key); docModalRemoveFile('不存在'); ok(names() === 'b.pdf', '直接傳 key 也能移除；不存在的 key 不動作');
  docModalRemoveFile(docModalFiles[0].key); ok(!!$('docModal-fileList').querySelector('[data-doc-file-empty]'), '全部移除：回到「還沒有檔案」');

  // E. 儲存新文件：逐個上傳 → 一次登記
  reset(); openDocEditModal(); $('docModal-fileName').value = '注音學習卡'; $('docModal-category').value = '保健用藥'; $('docModal-description').value = '說明';
  docModalAddFiles([F('一.zip'), F('二.pdf')]); docModalAddLink('三.rar', 'https://drive.google.com/file/d/LNK/view', '');
  const progress = []; let hold = null;
  uploadBehavior = (p, okCb) => { progress.push($('docModalSaveBtn').textContent.trim()); hold = { p: p, ok: okCb }; };
  handleSaveDocModal({ preventDefault() {} });
  await waitFor(() => !!hold);
  ok(docModalUploading === true && /上傳檔案中（1／2）/.test($('docModalSaveBtn').textContent) && $('docModalSaveBtn').disabled === true, '上傳第 1 個：按鈕顯示「上傳檔案中（1／2）」並停用');
  ok(hold.p.file.name === '一.zip' && hold.p.file.mimeType === 'application/zip', '第一個送出的是「一.zip」，類型依副檔名補成 application/zip');
  ok(/上傳中/.test(entries()[0].textContent) && /待上傳/.test(entries()[1].textContent) && /連結/.test(entries()[2].textContent), '清單：第 1 個「上傳中…」、第 2 個「待上傳」、第 3 個（連結）不會上傳');
  const t0 = toasts.length; closeDocEditModal(); ok(open() && /上傳中/.test(toasts.slice(t0).join('|')), '上傳中按「取消」：不給關，提示稍候');
  handleSaveDocModal({ preventDefault() {} }); ok(calls('uploadDocFile').length === 1, '上傳中再按「儲存」：不會重複送出');
  docModalRemoveFile(docModalFiles[1].key); ok(docModalFiles.length === 3, '上傳中不能移除檔案');
  const h1 = hold; hold = null; h1.ok({ success: true, file: { name: '一.zip', ext: 'zip', driveFileId: 'UPLOADED001', downloadUrl: 'https://drive.google.com/uc?export=download&id=UPLOADED001', size: 5 } });
  await waitFor(() => !!hold);
  ok(/上傳檔案中（2／2）/.test($('docModalSaveBtn').textContent) && /已在雲端/.test(entries()[0].textContent), '第 1 個成功：標示「已在雲端」，開始第 2 個（2／2）');
  const h2 = hold; hold = null; h2.ok({ success: true, warning: '分享設定失敗警告', file: { name: '二.pdf', ext: 'pdf', driveFileId: 'UPLOADED002', downloadUrl: 'https://drive.google.com/uc?export=download&id=UPLOADED002', size: 5 } });
  await waitFor(() => calls('saveDoc').length === 1);
  ok(toasts.some(t => /分享設定失敗警告/.test(t)), '後端回報分享警告：顯示給使用者（仍繼續）');
  ok(calls('uploadDocFile').length === 2 && calls('uploadDocFile').map(c => c.p.file.name).join() === '一.zip,二.pdf' && calls('uploadDocFile')[0].p.file.base64 === btoa('hello') && calls('uploadDocFile')[0].p.password === state.adminPassword, '依清單順序逐個上傳（一.zip、二.pdf）；內容是 base64；帶管理員 token');
  const sv = calls('saveDoc')[0].p.docData;
  ok(sv.files.length === 3 && sv.files.map(f => f.name).join() === '一.zip,二.pdf,三.rar' && sv.files[0].driveFileId === 'UPLOADED001' && sv.files[2].driveFileId === '' && sv.files[2].downloadUrl === 'https://drive.google.com/file/d/LNK/view' && sv.files.map(f => f.ext).join() === 'zip,pdf,rar', '登記：files 依序含兩個新上傳的與一個連結，副檔名各自正確');
  ok(sv.fileExtension === 'zip' && sv.driveFileId === 'UPLOADED001' && sv.downloadUrl === sv.files[0].downloadUrl && /^DOC-/.test(sv.id) && sv.fileName === '注音學習卡' && sv.category === '保健用藥' && sv.description === '說明', '舊欄位同步成第一個檔案（舊版相容）；標題、分類、說明、新編號');
  ok(cbs.map(c => c.a).join() === 'uploadDocFile,uploadDocFile,saveDoc' && !open() && state.docs.length === 3, '順序：上傳、上傳、登記；表單關閉；本機列表立即多一份');
  ok(docFilesOf(state.docs[2]).length === 3 && /已新增文件「注音學習卡」並上傳檔案/.test(toasts.join('|')), '本機資料有 files、提示「已新增文件…並上傳檔案」');
  ok(!cbs.some(c => c.a === 'uploadDocument'), '不再使用舊的 uploadDocument');

  // F. 失敗與重試
  reset(); openDocEditModal(); $('docModal-fileName').value = '多檔重試'; docModalAddFiles([F('a1.zip'), F('b2.pdf'), F('c3.rar')]);
  let n = 0; uploadBehavior = (p, okCb) => { n++; if (p.file.name === 'b2.pdf') return okCb({ success: false, error: 'Drive 目前無法使用' }); const id = 'RETRY' + n + 'ABCDEFGHIJ'; okCb({ success: true, file: { name: p.file.name, ext: docFileExt(p.file.name), driveFileId: id, downloadUrl: 'https://drive.google.com/uc?export=download&id=' + id, size: 5 } }); };
  handleSaveDocModal({ preventDefault() {} }); await waitFor(() => !docModalUploading && toasts.some(t => /上傳失敗/.test(t)));
  ok(calls('saveDoc').length === 0 && open(), '第 2 個失敗：不登記、表單維持開著');
  ok(/已在雲端/.test(entries()[0].textContent) && /Drive 目前無法使用/.test(entries()[1].textContent) && /待上傳/.test(entries()[2].textContent) && entries()[1].className.indexOf('border-rose-300') >= 0, '清單：第 1 個已在雲端（保留）、第 2 個標紅色錯誤原因、第 3 個還是待上傳（沒被丟掉）');
  ok(/「b2\.pdf」上傳失敗：Drive 目前無法使用/.test(toasts.join('|')) && /只會重傳失敗的/.test(toasts.join('|')) && $('docModalSaveBtn').disabled === false && /新增這筆文件/.test($('docModalSaveBtn').textContent) && docModalUploading === false, '提示哪個檔案、原因與「只會重傳失敗的」；儲存鈕恢復可按');
  uploadBehavior = null; cbs.length = 0; handleSaveDocModal({ preventDefault() {} }); await waitFor(() => calls('saveDoc').length === 1);
  ok(calls('uploadDocFile').map(c => c.p.file.name).join() === 'b2.pdf,c3.rar', '重試：只上傳還沒成功的（b2.pdf、c3.rar），a1.zip 不會重傳');
  ok(calls('saveDoc')[0].p.docData.files.map(f => f.name).join() === 'a1.zip,b2.pdf,c3.rar' && calls('saveDoc')[0].p.docData.files.every(f => f.downloadUrl), '重試成功後登記全部 3 個檔案');
  reset(); openDocEditModal(); $('docModal-fileName').value = '斷線'; docModalAddFiles([F('x.zip')]);
  uploadBehavior = (p, okCb, errCb) => errCb(new Error('timeout')); handleSaveDocModal({ preventDefault() {} }); await waitFor(() => !docModalUploading && toasts.some(t => /上傳失敗/.test(t)));
  ok(/網路連線逾時/.test(toasts.join('|')) && calls('saveDoc').length === 0 && /網路連線逾時/.test(entries()[0].textContent), '網路逾時：提示、該檔標錯誤、不登記');
  reset(); openDocEditModal(); $('docModal-fileName').value = '空回應'; docModalAddFiles([F('y.zip')]);
  uploadBehavior = (p, okCb) => okCb(null); handleSaveDocModal({ preventDefault() {} }); await waitFor(() => !docModalUploading && toasts.some(t => /上傳失敗/.test(t)));
  ok(/未知錯誤/.test(toasts.join('|')) && calls('saveDoc').length === 0, '後端回應是空的：當成失敗（未知錯誤），不登記');
  reset(); openDocEditModal(); $('docModal-fileName').value = '缺網址'; docModalAddFiles([F('z.zip')]);
  uploadBehavior = (p, okCb) => okCb({ success: true, file: { name: 'z.zip' } }); handleSaveDocModal({ preventDefault() {} }); await waitFor(() => !docModalUploading && toasts.some(t => /上傳失敗/.test(t)));
  ok(calls('saveDoc').length === 0, '後端說成功但沒有下載網址：當成失敗，不登記（不會存出沒有連結的檔案）');

  // G. 驗證
  reset(); openDocEditModal(); docModalAddFiles([F('a.zip')]); $('docModal-fileName').value = ''; toasts.length = 0; handleSaveDocModal({ preventDefault() {} });
  ok(/請輸入文件名稱/.test(toasts.join('|')) && cbs.length === 0 && open(), '沒填文件名稱：提示，不上傳、不登記');
  reset(); openDocEditModal('D1'); docModalFiles[0].downloadUrl = 'drive.google.com/x'; $('docModal-fileName').value = '改個名'; toasts.length = 0; handleSaveDocModal({ preventDefault() {} });
  ok(/需以 https:\/\/ 開頭/.test(toasts.join('|')) && cbs.length === 0, '舊資料的連結不是 http(s)：提示請移除後重新加入，不送出');
  reset(); openDocEditModal(); $('docModal-fileName').value = '只有標題'; handleSaveDocModal({ preventDefault() {} });
  ok(calls('saveDoc').length === 1 && calls('saveDoc')[0].p.docData.files.length === 0 && calls('saveDoc')[0].p.docData.downloadUrl === '' && calls('saveDoc')[0].p.docData.fileExtension === 'pdf', '沒有任何檔案也能存（files 空陣列、舊欄位空白）——和以前一樣');

  // H. 編輯舊式單檔文件
  reset(); openDocEditModal('D1');
  ok(docModalFiles.length === 1 && docModalFiles[0].name === '幼兒用藥委託單' && docModalFiles[0].ext === 'pdf' && docModalFiles[0].driveFileId.indexOf('DRIVE') === 0 && /已在雲端/.test(entries()[0].textContent), '舊式單檔文件：清單裡有 1 個檔案（原本的連結），標示已在雲端');
  handleSaveDocModal({ preventDefault() {} }); ok(cbs.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]), '沒改任何東西：提示沒有任何變更，不送出');
  docModalAddFiles([F('補充說明.zip')]); answer = false; handleSaveDocModal({ preventDefault() {} });
  ok(confirms.length === 1 && /檔案：幼兒用藥委託單 → 幼兒用藥委託單、補充說明\.zip（待上傳）/.test(confirms[0]) && cbs.length === 0, '加了檔案：確認視窗列出「檔案：A → A、B（待上傳）」；取消就什麼都不做（也沒上傳）');
  answer = true; handleSaveDocModal({ preventDefault() {} }); await waitFor(() => calls('saveDoc').length === 1);
  const ed = calls('saveDoc')[0].p.docData;
  ok(ed.id === 'D1' && ed.files.length === 2 && ed.files[0].driveFileId === 'DRIVED1abcdefghijklmnop' && ed.files[1].name === '補充說明.zip' && ed.files[1].ext === 'zip' && /已更新原文件/.test(toasts.join('|')), '確定：以原編號 D1 更新，files＝原本的檔案＋新上傳的；原檔沒有重傳');
  reset(); state.docs.push(mk('M1', '多檔文件', { files: [FE('甲.zip', 'zip', 'IDAAAAAAAAAA'), FE('乙.pdf', 'pdf', 'IDBBBBBBBBBB'), FE('丙.rar', 'rar', 'IDCCCCCCCCCC')] }));
  openDocEditModal('M1'); ok(names() === '甲.zip|乙.pdf|丙.rar' && entries().every(e => /已在雲端/.test(e.textContent)), '編輯多檔文件：清單列出 3 個檔案');
  docModalRemoveFile(docModalFiles[1].key); answer = true; handleSaveDocModal({ preventDefault() {} }); await waitFor(() => calls('saveDoc').length === 1);
  ok(/檔案：甲\.zip、乙\.pdf、丙\.rar → 甲\.zip、丙\.rar/.test(confirms[0]) && calls('saveDoc')[0].p.docData.files.map(f => f.name).join() === '甲.zip,丙.rar' && calls('uploadDocFile').length === 0, '移除 1 個：差異確認列出前後清單；登記剩下 2 個；不上傳、不刪雲端檔案');
  reset(); state.docs.push(mk('M2', '多檔二', { files: [FE('甲.zip', 'zip', 'IDAAAAAAAAAA'), FE('乙.pdf', 'pdf', 'IDBBBBBBBBBB')] }));
  openDocEditModal('M2'); docModalRemoveFile(docModalFiles[1].key); docModalRemoveFile(docModalFiles[0].key); handleSaveDocModal({ preventDefault() {} }); await waitFor(() => calls('saveDoc').length === 1);
  ok(calls('saveDoc')[0].p.docData.files.length === 0 && calls('saveDoc')[0].p.docData.downloadUrl === '', '全部移除：files 空陣列、舊欄位清空');
  reset(); state.docs.push(mk('M3', '調換順序', { files: [FE('甲.zip', 'zip', 'IDAAAAAAAAAA'), FE('乙.pdf', 'pdf', 'IDBBBBBBBBBB')] }));
  openDocEditModal('M3'); docModalMoveFile(docModalFiles[1].key, -1); handleSaveDocModal({ preventDefault() {} }); await waitFor(() => calls('saveDoc').length === 1);
  const mv = calls('saveDoc')[0].p.docData;
  ok(mv.files.map(f => f.name).join() === '乙.pdf,甲.zip' && mv.fileExtension === 'pdf' && mv.driveFileId === 'IDBBBBBBBBBB', '只調換順序：也算變更；第一個檔案換了，舊欄位跟著換成新的第一個');
  reset(); state.docs.push(mk('V2', '注音學習卡（形狀口訣）v2', { fileExtension: 'v2', driveFileId: '', downloadUrl: 'https://drive.google.com/file/d/1VKG/view?usp=sharing' }));
  openDocEditModal('V2'); ok(docModalFiles[0].ext === 'v2' && badge(entries()[0].querySelector('div').outerHTML) === 'V2' && /連結/.test(entries()[0].textContent), '（使用者回報的壞資料）副檔名存成 v2 的舊文件：清單顯示灰色 V2、標示連結');
  docModalRemoveFile(docModalFiles[0].key); docModalAddLink('注音學習卡.zip', 'https://drive.google.com/file/d/1VKG/view?usp=sharing', 'zip'); answer = true;
  handleSaveDocModal({ preventDefault() {} }); await waitFor(() => calls('saveDoc').length === 1);
  ok(calls('saveDoc')[0].p.docData.files[0].ext === 'zip' && calls('saveDoc')[0].p.docData.fileExtension === 'zip' && badge(getDocFileIconHtml(state.docs.find(d => d.id === 'V2'))) === 'ZIP', '移除後重新加入同一個連結、類型選 ZIP：存成 zip，圖示變 ZIP（修好壞資料的方法）');

  // I. 複製與另存為新
  reset(); state.docs.push(mk('M4', '多檔四', { files: [FE('甲.zip', 'zip', 'IDAAAAAAAAAA'), FE('乙.pdf', 'pdf', 'IDBBBBBBBBBB')] }));
  copyDocInAdmin('M4'); ok(open() && $('docModal-id').value === '' && names() === '甲.zip|乙.pdf' && /檔案連結沿用原文件/.test($('docFormModeText').textContent), '複製多檔文件：沒有編號、清單帶入原本的檔案');
  $('docModal-fileName').value = '複製的多檔'; handleSaveDocModal({ preventDefault() {} }); await waitFor(() => calls('saveDoc').length === 1);
  const cp = calls('saveDoc')[0].p.docData;
  ok(/^DOC-/.test(cp.id) && cp.id !== 'M4' && cp.files.length === 2 && cp.files[0].driveFileId === 'IDAAAAAAAAAA' && state.docs.find(d => d.id === 'M4').fileName === '多檔四' && calls('uploadDocFile').length === 0, '存檔：新編號、沿用同樣的雲端檔案（不重傳）、原文件不變');
  reset(); state.docs.push(mk('M5', '多檔五', { files: [FE('甲.zip', 'zip', 'IDAAAAAAAAAA'), FE('乙.pdf', 'pdf', 'IDBBBBBBBBBB')] }));
  openDocEditModal('M5'); $('docModal-fileName').value = '另存的'; handleSaveDocModal(null, true); await waitFor(() => calls('saveDoc').length === 1);
  ok(confirms.length === 0 && calls('saveDoc')[0].p.docData.id !== 'M5' && calls('saveDoc')[0].p.docData.files.length === 2 && state.docs.find(d => d.id === 'M5').fileName === '多檔五', '另存為新文件：不跳確認、新編號、帶著檔案清單，原文件不變');

  // J. 前台列表
  reset(); state.docs = [mk('S1', '舊式單檔'),
    mk('S2', '單一檔案清單', { files: [FE('唯一.zip', 'zip', 'IDONLYONLY01')], fileExtension: 'zip', downloadUrl: 'https://stale.test/old' }),
    mk('MM', '注音學習卡', { category: '學習資源', description: '三份檔案', files: [FE('卡片.zip', 'zip', 'IDAAAAAAAAAA', 5 * 1024 * 1024), FE('說明.pdf', 'pdf', 'IDBBBBBBBBBB', 2048), FE('範例.rar', 'rar', 'IDCCCCCCCCCC', 0)] }),
    mk('NF', '舊快取沒有 files 欄', { files: undefined }),
    mk('M2F', '剛好兩個檔案', { files: [FE('甲.zip', 'zip', 'IDAAAAAAAAAA'), FE('乙.pdf', 'pdf', 'IDBBBBBBBBBB')] })];
  switchTab('docs'); renderDocsList();
  const cards = Array.from($('docsListContainer').children);
  ok(cards.length === 5 && cards.filter(c => c.hasAttribute('data-doc-multi')).length === 2, '前台 5 份文件：2 份是多檔卡片（3 個檔案與剛好 2 個檔案）');
  ok(cards[4].hasAttribute('data-doc-multi') && cards[4].querySelectorAll('[data-doc-file]').length === 2 && /2 個檔案/.test(cards[4].textContent), '剛好 2 個檔案：就是多檔卡片（門檻是 2）');
  const mc = cards[2];
  ok(mc.querySelectorAll('[data-doc-file]').length === 3 && mc.querySelectorAll('li a[href]').length === 3 && !mc.querySelector(':scope > .flex a') , '多檔卡片：直接展開 3 個檔案，每個有自己的下載連結');
  ok(/注音學習卡/.test(mc.querySelector('h4').textContent) && /3 個檔案/.test(mc.textContent) && /學習資源/.test(mc.textContent) && /三份檔案/.test(mc.textContent) && /更新日期：2026-10-01/.test(mc.textContent), '標題、分類、「3 個檔案」標籤、說明、更新日期都在');
  ok(mc.querySelector('[data-doc-multi-icon]') && /×3/.test(mc.querySelector('[data-doc-multi-icon]').textContent), '卡片圖示是疊層樣式並標「×3」');
  const lis = Array.from(mc.querySelectorAll('[data-doc-file]'));
  ok(badge(lis[0].innerHTML) === 'ZIP' && badge(lis[1].innerHTML) === 'PDF' && badge(lis[2].innerHTML) === 'RAR' && iconColor(lis[1].innerHTML) === '#EF4444', '每個檔案各有自己依副檔名判斷的圖示（ZIP、PDF、RAR）');
  ok(/卡片\.zip/.test(lis[0].textContent) && /5\.0 MB/.test(lis[0].textContent) && /2 KB/.test(lis[1].textContent) && !/MB|KB/.test(lis[2].textContent), '顯示檔名與大小（5.0 MB、2 KB；大小未知的不顯示）');
  ok(lis[0].querySelector('a').getAttribute('href') === 'https://drive.google.com/uc?export=download&id=IDAAAAAAAAAA' && lis[0].querySelector('a').target === '_blank' && /noopener/.test(lis[0].querySelector('a').rel) && /下載/.test(lis[0].querySelector('a').textContent), '下載連結：指向各自的檔案、新分頁開啟、noopener');
  ok(lis.every(li => li.querySelector('.wrap-any')) && entriesWrap(), '很長又沒有空白的檔名可以換行（wrap-any）：前台檔案列與表單清單都套用（避免手機出現橫向捲動）');
  const single = (c, url) => c.querySelectorAll('[data-doc-file]').length === 0 && c.querySelectorAll('a[href]').length === 1 && c.querySelector('a').getAttribute('href') === url && /下載文件/.test(c.textContent);
  ok(single(cards[0], mk('S1').downloadUrl) && single(cards[1], 'https://drive.google.com/uc?export=download&id=IDONLYONLY01') && single(cards[3], mk('NF').downloadUrl), '舊式單檔、只有 1 個檔案、舊快取沒有 files 欄：都維持原本的單檔卡片（一顆「下載文件」）；只有 1 個檔案時連結以 files 為準（舊欄位過期也不影響）');
  ok(badge(cards[1].innerHTML) === 'ZIP', '只有 1 個檔案的文件：圖示是該檔案的類型（ZIP）');
  renderDocsList('學習資源'); ok($('docsListContainer').children.length === 1 && $('docsListContainer').children[0].hasAttribute('data-doc-multi'), '分類篩選：多檔文件照常被篩選出來');
  state.lang = 'en'; renderDocsList(); const en = Array.from($('docsListContainer').children)[2];
  ok(/3 files/.test(en.textContent) && /Download/.test(en.textContent) && !/個檔案|下載/.test(en.textContent.replace(/卡片|說明|範例|注音學習卡|三份檔案/g, '')), '英文介面：「3 files」「Download」沒有殘留中文介面字');
  state.lang = 'zh-TW';

  // K. 安全
  reset(); state.docs = [mk('X1', '惡意', { files: [{ name: '<img src=x onerror=window.__mfpwn=1>.zip', ext: 'zip', driveFileId: '', downloadUrl: 'javascript:window.__mfpwn=2', size: 5 }, { name: '"><script>window.__mfpwn=3</script>.pdf', ext: '<b>', driveFileId: '', downloadUrl: 'https://x.test/a"onmouseover="window.__mfpwn=4', size: 5 }, FE('正常.zip', 'zip', 'IDNORMAL0001')] })];
  renderDocsList(); renderAdminDocsList();
  ok(!window.__mfpwn && !document.querySelector('#docsListContainer img, #docsListContainer script, #docAdminListContainer img, #docAdminListContainer script') && !document.querySelector('#docsListContainer [onmouseover]'), '前台與後台列表：惡意檔名、副檔名、網址都不會注入元素或事件');
  ok(!Array.from(document.querySelectorAll('#docsListContainer a[href]')).some(a => /^javascript:/i.test(a.getAttribute('href'))), '前台：javascript: 網址不會變成連結');
  ok(/<img/.test($('docsListContainer').textContent) && /<script/.test($('docsListContainer').textContent), '惡意檔名以純文字顯示');
  openDocEditModal('X1'); ok(!window.__mfpwn && !$('docModal-fileList').querySelector('img, script'), '表單的檔案清單：惡意檔名以純文字顯示');
  closeDocEditModalNow();

  // L. 後台列表
  reset(); state.docs = [mk('S1', '舊式單檔'), mk('MM', '多檔文件', { files: [FE('甲.zip', 'zip', 'IDAAAAAAAAAA'), FE('乙.pdf', 'pdf', 'IDBBBBBBBBBB'), FE('丙.rar', 'rar', 'IDCCCCCCCCCC')] }), mk('M2F', '兩個檔案', { files: [FE('甲.zip', 'zip', 'IDAAAAAAAAAA'), FE('乙.pdf', 'pdf', 'IDBBBBBBBBBB')] })];
  switchTab('admin'); switchAdminSubtab('uploadDoc'); renderAdminDocsList();
  const arows = Array.from($('docAdminListContainer').children).filter(r => r.querySelector('button[data-act]'));
  const mrow = arows.find(r => r.hasAttribute('data-doc-multi') && /×3/.test(r.textContent)), srow = arows.find(r => !r.hasAttribute('data-doc-multi'));
  ok(arows.length === 3 && arows.filter(r => r.hasAttribute('data-doc-multi')).length === 2 && !!mrow && !!srow, '後台列表 3 列，其中 2 列是多檔（3 個檔案、剛好 2 個檔案）');
  ok(!!mrow.querySelector('[data-doc-file-names].wrap-any'), '後台列表的檔名清單可強制換行');
  ok(mrow.querySelector('[data-doc-multi-icon]') && /×3/.test(mrow.textContent) && /3 個檔案：甲\.zip、乙\.pdf、丙\.rar/.test(mrow.querySelector('[data-doc-file-names]').textContent) && !mrow.querySelector('a'), '多檔列：疊層圖示「×3」、列出檔名、標題不是連結（沒有單一網址）');
  ok(!srow.querySelector('[data-doc-multi-icon]') && !!srow.querySelector('a[href]') && !srow.querySelector('[data-doc-file-names]'), '單檔列：照舊（一般圖示、標題是連結、沒有檔名清單）');
  ok(mrow.querySelector('button[data-act="edit"]') && mrow.querySelector('button[data-act="copy"]') && mrow.querySelector('button[data-act="del"]'), '多檔列也有編輯、複製、刪除');
  mrow.querySelector('button[data-act="edit"]').click(); ok(open() && docModalFiles.length === 3, '按多檔列的「編輯」：表單帶入 3 個檔案');
  closeDocEditModalNow();

  // M. 輔助函式
  ok(docFilesOf(undefined).length === 0 && docFilesOf({}).length === 0 && docFilesOf({ files: 'x' }).length === 0 && docFilesOf({ files: [null, {}, { downloadUrl: '' }, { name: 'a', downloadUrl: 'https://x' }] }).length === 1, 'docFilesOf：沒有、不是陣列、壞項目（null、沒網址）都安全，只留有下載網址的');
  ok(docFormatSize(0) === '' && docFormatSize(-5) === '' && docFormatSize('x') === '' && docFormatSize(1) === '1 KB' && docFormatSize(1536) === '2 KB' && docFormatSize(1048576) === '1.0 MB' && docFormatSize(26214400) === '25.0 MB', 'docFormatSize：未知不顯示、最小 1 KB、MB 一位小數');
  ok(docIsHttpUrl('https://a.b') && docIsHttpUrl(' HTTP://A.B ') && !docIsHttpUrl('') && !docIsHttpUrl(null) && !docIsHttpUrl('https://') && !docIsHttpUrl('ftp://a.b') && !docIsHttpUrl('https://a b'), 'docIsHttpUrl');

  // 還原
  reset(); window.confirm = real.confirm; window.callBackend = real.cb; window.showToast = real.toast; window.loadAppData = real.load;
  state.docs = saved.docs; state.adminPassword = saved.pwd; state.lang = saved.lang; window.handleDataLoaded = realHandle;
  try { if (saved.ls === null) localStorage.removeItem('nobel_a_docs_custom'); else localStorage.setItem('nobel_a_docs_custom', saved.ls); } catch (e) {}
  try { renderDocsList(); } catch (e) {}
  const bad = res.filter(x => x.startsWith('✗'));
  console.log(res.join('\n') + '\n\n' + (res.length - bad.length) + ' 項通過，' + bad.length + ' 項失敗');
  return res.join('\n') + '\n\n' + (res.length - bad.length) + ' pass / ' + bad.length + ' fail';
})();
