// 後台「常用文件」表單模式測試（瀏覽器）：新增／編輯既有／複製、更新前差異確認、另存為新文件（沿用檔案連結）、關閉彈窗的未儲存防呆。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { docs: state.docs, pwd: state.adminPassword, ls: (function () { try { return localStorage.getItem('nobel_a_docs_custom'); } catch (e) { return null; } })() };
  const real = { confirm: window.confirm, cb: window.callBackend, toast: window.showToast, load: window.loadAppData };
  const $ = id => document.getElementById(id);
  const toasts = [], cbs = [], confirms = []; let answer = true;
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.showToast = m => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  window.callBackend = (a, p, okCb) => { cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true }); };
  state.adminPassword = 'tok'.repeat(15);
  const mk = (id, name, extra) => Object.assign({ id: id, fileName: name, fileExtension: 'pdf', category: '保健用藥', description: '說明' + id, driveFileId: 'DRIVE' + id + 'abcdefghijklmnop', downloadUrl: 'https://drive.google.com/file/d/' + id + '/view', updatedAt: '2026-10-01' }, extra || {});
  const reset = () => { toasts.length = 0; cbs.length = 0; confirms.length = 0; answer = true; state.docs = [mk('D1', '幼兒用藥委託單.pdf'), mk('D2', '學期行事曆.pdf', { category: '學期行事曆' })]; docModalFiles = []; closeDocEditModalNow(); };
  const cls = (el, c) => el.className.split(/\s+/).indexOf(c) >= 0;
  const txt = () => $('docFormModeText').textContent;
  const vis = el => !el.classList.contains('hidden');
  const open = () => !$('docEditModal').classList.contains('hidden');
  const saveCall = () => cbs.filter(c => c.a === 'saveDoc')[0];
  reset();

  // A. 新增
  openDocEditModal();
  ok(open() && /新增文件：儲存後會建立一筆新的常用文件/.test(txt()) && cls($('docModalBox'), 'border-emerald-200') && $('docModalSaveBtn').textContent.trim() === '➕ 新增這筆文件' && !vis($('docModalSaveAsNewBtn')), '新增模式：綠色橫幅、按鈕「➕ 新增這筆文件」、沒有「另存為新」');

  // B. 編輯
  closeDocEditModalNow(); openDocEditModal('D1');
  ok(/正在編輯既有文件「幼兒用藥委託單.pdf」/.test(txt()) && /會修改這筆原本的內容/.test(txt()) && cls($('docModalBox'), 'border-amber-400') && !cls($('docModalBox'), 'border-emerald-200'), '編輯模式：橘色橫幅「正在編輯既有文件「幼兒用藥委託單.pdf」…」、彈窗橘框');
  ok($('docModalSaveBtn').textContent.trim() === '💾 更新原文件' && vis($('docModalSaveAsNewBtn')) && cls($('docModalSaveBtn'), 'bg-amber-500') && !cls($('docModalSaveBtn'), 'bg-indigo-600') && $('docModal-id').value === 'D1', '編輯模式：「💾 更新原文件」＋「➕ 另存為新文件」，帶入原編號');

  // C. 沒有變更
  handleSaveDocModal({ preventDefault() {} }); ok(cbs.length === 0 && confirms.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]) && open(), '沒改任何東西就更新：提示「沒有任何變更」，不確認、不送出、彈窗維持開著');

  // D. 有變更
  const newCat = [...$('docModal-category').options].map(o => o.value).filter(v => v && v !== '保健用藥')[0]; // 下拉選項是動態載入的，取一個實際存在的
  $('docModal-fileName').value = '幼兒用藥委託單（新版）.pdf'; $('docModal-category').value = newCat; $('docModal-description').value = '全新的說明'.repeat(10);
  answer = false; handleSaveDocModal({ preventDefault() {} });
  ok(confirms.length === 1 && /即將修改原文件「幼兒用藥委託單.pdf」/.test(confirms[0]) && /文件名稱：幼兒用藥委託單.pdf → 幼兒用藥委託單（新版）.pdf/.test(confirms[0]) && confirms[0].indexOf('文件分類：保健用藥 → ' + newCat) >= 0 && /說明描述：（原內容） → （已修改）/.test(confirms[0]) && /另存為新文件/.test(confirms[0]), '更新前列出差異（名稱、分類；說明只寫「已修改」），並提醒可改按「另存為新文件」');
  ok(cbs.length === 0 && open() && state.docs[0].fileName === '幼兒用藥委託單.pdf' && /正在編輯/.test(txt()), '按取消：沒送出、原文件不變、彈窗與編輯模式保留');
  answer = true; handleSaveDocModal({ preventDefault() {} });
  ok(!!saveCall() && saveCall().p.docData.id === 'D1' && state.docs.length === 2 && state.docs.find(d => d.id === 'D1').fileName === '幼兒用藥委託單（新版）.pdf' && state.docs.find(d => d.id === 'D1').category === newCat, '確定更新：以原編號 D1 送出，文件數不變、內容已更新');
  ok(/已更新原文件「幼兒用藥委託單（新版）.pdf」/.test(toasts.join('|')) && !open() && confirms.length === 2, '提示「已更新原文件」、彈窗關閉、儲存後關閉不會多問「放棄嗎」');

  // E. 另存為新
  reset(); openDocEditModal('D1'); $('docModal-fileName').value = '另存的文件.pdf';
  handleSaveDocModal(null, true);
  ok(confirms.length === 0 && !!saveCall() && saveCall().p.docData.id !== 'D1' && /^DOC-/.test(saveCall().p.docData.id) && state.docs.length === 3, '另存為新：不跳確認、新編號 DOC-…、文件數 +1');
  ok(state.docs.find(d => d.id === 'D1').fileName === '幼兒用藥委託單.pdf', '原文件 D1 完全沒被改動');
  const nd = state.docs.find(d => d.id === saveCall().p.docData.id);
  ok(nd.fileName === '另存的文件.pdf' && nd.downloadUrl === 'https://drive.google.com/file/d/D1/view' && nd.driveFileId === 'DRIVED1abcdefghijklmnop' && /已新增文件「另存的文件.pdf」/.test(toasts.join('|')), '新文件是修改後的內容、沿用原檔案連結，提示「已新增文件」');

  // F. 複製
  reset(); copyDocInAdmin('D1');
  ok(open() && /以「幼兒用藥委託單.pdf」為範本新增/.test(txt()) && /原文件不會改變/.test(txt()) && /檔案連結沿用原文件/.test(txt()) && cls($('docModalBox'), 'border-sky-300') && $('docModalSaveBtn').textContent.trim() === '➕ 新增這筆文件' && !vis($('docModalSaveAsNewBtn')), '複製：藍色橫幅（原文件不會改變、檔案連結沿用）、只有一顆「新增這筆文件」');
  ok($('docModal-id').value === '' && $('docModal-fileName').value === '幼兒用藥委託單.pdf' && $('docModal-description').value === '說明D1' && docModalFiles.length === 1 && docModalFiles[0].downloadUrl === 'https://drive.google.com/file/d/D1/view' && /複製文件/.test($('docModalTitle').textContent), '複製：沒有編號，名稱、分類、說明、連結保留；標題「複製文件」');
  $('docModal-fileName').value = '複製後的文件.pdf'; handleSaveDocModal({ preventDefault() {} });
  ok(confirms.length === 0 && !!saveCall() && /^DOC-/.test(saveCall().p.docData.id) && state.docs.length === 3 && state.docs.find(d => d.id === 'D1').fileName === '幼兒用藥委託單.pdf' && /已新增文件「複製後的文件.pdf」/.test(toasts.join('|')), '存檔：新的一筆、原文件 D1 不變、提示「已新增文件」');

  // G. 防呆
  reset(); openDocEditModal('D1'); confirms.length = 0; closeDocEditModal(); ok(confirms.length === 0 && !open(), '剛開編輯、沒改內容就關閉：不跳確認');
  openDocEditModal('D1'); $('docModal-description').value = '改到一半'; answer = false; closeDocEditModal();
  ok(confirms.length === 1 && /尚未儲存/.test(confirms[0]) && open() && $('docModal-description').value === '改到一半', '改到一半按關閉：先問，取消則彈窗與內容保留');
  copyDocInAdmin('D2'); openDocEditModal('D2'); ok(confirms.length === 3 && $('docModal-id').value === 'D1', '彈窗開著且有未儲存內容時按「複製」或編輯別份：先確認');
  answer = true; closeDocEditModal(); ok(!open(), '確定放棄：彈窗關閉');
  openDocEditModal('D1'); docModalAddFiles([new File(['x'], 'new.pdf')]); answer = false; confirms.length = 0; closeDocEditModal(); ok(confirms.length === 1 && docFormDirty(), '選了新檔案（尚未上傳）也算未儲存內容');
  docModalFiles = []; answer = true; closeDocEditModalNow();

  // H. 列表按鈕與安全
  reset(); state.docs[0].fileName = '<img src=x onerror=window.__docpwn=1>惡意.pdf'; openDocEditModal('D1');
  ok(!window.__docpwn && !$('docFormModeBanner').querySelector('img') && $('docFormModeText').textContent.indexOf('<img') >= 0, '惡意文件名稱：橫幅以純文字顯示，沒有注入元素');
  closeDocEditModalNow(); renderDocsList(); renderAdminDocsList();
  ok(document.querySelectorAll('#docAdminListContainer button[data-act="copy"]').length >= 1 && !document.querySelector('#docAdminListContainer img[src="x"], #docsListContainer img[src="x"]') && !window.__docpwn, '後台常用文件列表：每份有「複製」鈕，惡意名稱不注入元素');

  reset(); window.confirm = real.confirm; window.callBackend = real.cb; window.showToast = real.toast; window.loadAppData = real.load;
  state.docs = saved.docs; state.adminPassword = saved.pwd; window.handleDataLoaded = realHandle;
  try { if (saved.ls === null) localStorage.removeItem('nobel_a_docs_custom'); else localStorage.setItem('nobel_a_docs_custom', saved.ls); } catch (e) {}
  try { renderDocsList(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
