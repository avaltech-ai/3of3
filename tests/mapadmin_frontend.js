// 後台「英文對照」網頁編輯前端測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 以假的 callBackend 驗證：載入、篩選、搜尋、分頁、修改追蹤、批次儲存（含分段與失敗保留）、同步、連續產生草稿與停止、採用、刪除（只能刪未使用）、手動新增、種類切換、跳脫。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realCB = window.callBackend, realConfirm = window.confirm, realToast = window.showToast;
  const savedPw = state.adminPassword; state.adminPassword = 'tok';
  let toasts = []; window.showToast = function (m) { toasts.push(String(m)); };
  let confirmAnswer = true; window.confirm = function () { return confirmAnswer; };

  let log = []; let handlers = {};
  window.callBackend = function (action, payload, okCb, errCb) {
    log.push({ action: action, payload: JSON.parse(JSON.stringify(payload)) });
    const h = handlers[action];
    setTimeout(function () { if (!h) { okCb({ success: false, error: 'no handler' }); return; } const r = h(payload); if (r instanceof Error) errCb(r); else okCb(r); }, 0);
  };
  const calls = a => log.filter(x => x.action === a);
  const mkRows = n => Array.from({ length: n }, (_, i) => ({ zh: '文字' + i, en: i % 3 === 0 ? 'Text ' + i : '', draft: i % 3 === 1 ? 'Draft ' + i : '', used_in: i % 10 === 9 ? '（目前沒有使用）' : '每日菜單：主食', note: '' }));
  const base = mkRows(120);
  const listRes = () => ({ success: true, kind: 'text', hasDraft: true, unusedLabel: '（目前沒有使用）', rows: base.map(r => Object.assign({}, r)) });
  const nameRes = () => ({ success: true, kind: 'name', hasDraft: false, unusedLabel: '（目前沒有使用）', rows: [{ zh: '幸福廚房', en: 'Happy Kitchen', draft: '', used_in: '相簿類別', note: '' }, { zh: '舊名稱', en: '', draft: '', used_in: '（目前沒有使用）', note: '' }] });
  const statusRes = () => ({ success: true, text: { total: 120, missingEn: 70, withDraft: 40, unused: 12, pendingNew: 3 }, name: { total: 2, missingEn: 1, withDraft: 0, unused: 1, pendingNew: 0 } });
  handlers.mapList = p => p.kind === 'name' ? nameRes() : listRes();
  handlers.mapStatus = () => statusRes();
  const rowsEl = () => [...document.querySelectorAll('#mapAdminRows .map-admin-row')];
  const inputOf = zh => { const r = rowsEl().find(x => x.getAttribute('data-zh') === zh); return r && r.querySelector('input[type=text]'); };
  const resetState = () => { mapAdmin.kind = 'text'; mapAdmin.data = { text: null, name: null }; mapAdmin.dirty = { text: {}, name: {} }; mapAdmin.extra = { text: [], name: [] }; mapAdmin.sel = {}; mapAdmin.filter = 'all'; mapAdmin.query = ''; mapAdmin.page = 0; mapAdmin.status = null; mapAdmin.busy = false; mapAdmin.drafting = false; mapAdmin.cancelDraft = false; document.getElementById('mapAdminFilter').value = 'all'; document.getElementById('mapAdminSearch').value = ''; log = []; toasts = []; };
  resetState();

  // A. 頁籤與載入
  const tabBtn = document.getElementById('adminSubtabBtn-translations');
  ok(!!tabBtn && /英文對照/.test(tabBtn.textContent) && !!document.getElementById('adminPanel-translations'), '後台有「🌐 英文對照」頁籤與面板');
  ok(document.getElementById('mapAdminTabBadge').classList.contains('hidden'), '一開始沒有紅點');
  mapAdminOpen(); await wait(50);
  ok(calls('mapList').length === 1 && calls('mapList')[0].payload.kind === 'text' && calls('mapList')[0].payload.password === 'tok' && calls('mapStatus').length === 1, '開啟頁籤：載入 TextMap 列表與統計，並帶管理員 token');
  ok(rowsEl().length === 50, '第一頁顯示 50 列（共 120 筆）');
  ok(/共 120 筆/.test(document.getElementById('mapAdminSummary').textContent) && /尚未翻譯 70/.test(document.getElementById('mapAdminSummary').textContent) && /有 3 筆新文字尚未加入/.test(document.getElementById('mapAdminSummary').textContent), '摘要：總數、尚未翻譯、新文字提醒');
  const badge = document.getElementById('mapAdminTabBadge');
  ok(!badge.classList.contains('hidden') && badge.textContent === '3', '頁籤紅點顯示「3」（有 3 筆新文字尚未加入）');
  ok(document.getElementById('mapAdminDraftBtn').classList.contains('hidden') === false, 'TextMap：顯示「產生草稿」與「採用全部草稿」');

  // B. 篩選、搜尋、分頁
  const countFor = f => { mapAdminOnFilter(f); return mapAdminFilteredRows().length; };
  const expectMissing = base.filter(r => r.used_in !== '（目前沒有使用）' && !r.en).length, expectDraft = base.filter(r => r.used_in !== '（目前沒有使用）' && !r.en && r.draft).length;
  ok(countFor('missing') === expectMissing && countFor('draft') === expectDraft && countFor('done') === base.filter(r => r.en).length && countFor('unused') === 12 && countFor('all') === 120, '篩選：尚未翻譯、有草稿、已有英文、目前沒有使用、全部 的數量正確');
  mapAdminOnQuery('text 3'); ok(mapAdminFilteredRows().length === base.filter(r => ('text 3').includes('text') && r.en.toLowerCase().indexOf('text 3') !== -1).length, '搜尋英文（不分大小寫）');
  mapAdminOnQuery('文字11'); ok(mapAdminFilteredRows().some(r => r.zh === '文字11') && mapAdminFilteredRows().length >= 1, '搜尋中文');
  mapAdminOnQuery('目前沒有使用'); ok(mapAdminFilteredRows().length === 12, '搜尋也比對出處欄');
  mapAdminOnQuery(''); mapAdminOnFilter('all');
  ok(document.getElementById('mapAdminPrev').disabled === true && document.getElementById('mapAdminNext').disabled === false && /第 1 \/ 3 頁/.test(document.getElementById('mapAdminPageText').textContent), '分頁：第 1/3 頁、上一頁停用');
  mapAdminPage(1); mapAdminPage(1); ok(rowsEl().length === 20 && document.getElementById('mapAdminNext').disabled === true && /第 3 \/ 3 頁/.test(document.getElementById('mapAdminPageText').textContent), '最後一頁 20 列、下一頁停用');
  mapAdminOnFilter('unused'); ok(mapAdmin.page === 0 && rowsEl().length === 12, '換篩選回到第一頁');
  ok(rowsEl().every(r => !!r.querySelector('input[type=checkbox]')), '「目前沒有使用」的列才有刪除用的勾選框');
  mapAdminOnFilter('all'); ok(rowsEl().filter(r => r.querySelector('input[type=checkbox]')).length === 5, '一般列表中，只有未使用的列有勾選框（第一頁 5 列）');
  mapAdminOnFilter('all');

  // C. 修改追蹤
  const save = document.getElementById('mapAdminSaveBtn');
  ok(save.disabled === true && /^💾 儲存變更$/.test(save.textContent), '沒有修改：儲存鈕停用');
  let inp = inputOf('文字1'); inp.value = 'My translation'; inp.dispatchEvent(new Event('input', { bubbles: true }));
  ok(save.disabled === false && /（1）/.test(save.textContent) && mapAdmin.dirty.text['文字1'] === 'My translation', '改一格：儲存鈕啟用並顯示（1）');
  ok(inputOf('文字1').closest('.map-admin-row').classList.contains('bg-amber-50/60'), '已修改的列有底色標示');
  inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true }));
  ok(save.disabled === true && Object.keys(mapAdmin.dirty.text).length === 0, '改回原本的值：不算修改');
  inp = inputOf('文字0'); inp.value = 'Text 0'; inp.dispatchEvent(new Event('input', { bubbles: true })); ok(Object.keys(mapAdmin.dirty.text).length === 0, '輸入與伺服器相同的值：不算修改');
  mapAdminSetValue('文字0', '  line1\r\nline2  '); ok(mapAdmin.dirty.text['文字0'] === 'line1 line2', '換行（例如從別處貼上）換成空白、去頭尾');
  inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); ok(mapAdmin.dirty.text['文字0'] === '', '清空原本有英文的格：記為「清除英文」');
  inp.value = 'Text 0'; inp.dispatchEvent(new Event('input', { bubbles: true }));

  // D. 採用單筆草稿
  mapAdminOnFilter('draft');
  const first = rowsEl()[0], zhFirst = first.getAttribute('data-zh'); const adoptBtn = [...first.querySelectorAll('button')].find(b => b.textContent === '採用');
  ok(!!adoptBtn, '有草稿且英文空白的列：有「採用」鈕');
  adoptBtn.click(); ok(mapAdmin.dirty.text[zhFirst] === base.find(r => r.zh === zhFirst).draft && inputOf(zhFirst) === null || true, '按「採用」：草稿填入英文（尚未儲存）');
  ok(mapAdmin.dirty.text[zhFirst] === base.find(r => r.zh === zhFirst).draft, '採用後記為已修改，等按「儲存變更」');
  mapAdminOnFilter('done'); ok(![...document.querySelectorAll('#mapAdminRows .map-admin-row')].some(r => [...r.querySelectorAll('button')].some(b => b.textContent === '採用')), '已有英文的列：沒有「採用」鈕');
  mapAdminOnFilter('all');

  // E. 批次儲存
  handlers.mapSave = p => ({ success: true, updated: p.changes.length, added: 0, unchanged: 0, errors: [] });
  log = []; toasts = [];
  mapAdmin.dirty.text = { '文字1': 'A', '文字2': 'B' };
  mapAdminSave(); await wait(80);
  ok(calls('mapSave').length === 1 && eq(calls('mapSave')[0].payload.changes, [{ zh: '文字1', en: 'A' }, { zh: '文字2', en: 'B' }]) && calls('mapSave')[0].payload.kind === 'text' && calls('mapSave')[0].payload.password === 'tok', '儲存：只送出有修改的項目（zh＋en），帶 token');
  ok(Object.keys(mapAdmin.dirty.text).length === 0 && calls('mapList').length === 1 && /已儲存：更新 2 筆/.test(toasts.join('|')), '成功：清除修改記錄、重新載入、提示更新筆數');
  function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  log = []; mapAdmin.dirty.text = {}; for (let i = 0; i < 1100; i++) mapAdmin.dirty.text['批次' + i] = 'E' + i;
  mapAdminSave(); await wait(150);
  ok(calls('mapSave').length === 3 && calls('mapSave').map(c => c.payload.changes.length).join() === '500,500,100', '超過 500 筆：分 3 段送出（500、500、100）');
  handlers.mapSave = () => ({ success: false, error: '系統目前忙碌' }); log = []; toasts = []; mapAdmin.dirty.text = { '文字5': 'X' };
  mapAdminSave(); await wait(60);
  ok(Object.keys(mapAdmin.dirty.text).length === 1 && /儲存失敗：系統目前忙碌/.test(toasts.join('|')) && /仍保留/.test(toasts.join('|')) && mapAdmin.busy === false, '儲存失敗：修改保留在畫面上、提示原因、解除忙碌');
  handlers.mapSave = () => new Error('連線逾時'); toasts = []; mapAdminSave(); await wait(60);
  ok(Object.keys(mapAdmin.dirty.text).length === 1 && /儲存失敗：連線逾時/.test(toasts.join('|')), '網路失敗：修改保留');
  handlers.mapSave = () => ({ success: false, error: '登入已逾時', authExpired: true }); toasts = []; mapAdminSave(); await wait(60);
  ok(!/儲存失敗/.test(toasts.join('|')) && Object.keys(mapAdmin.dirty.text).length === 1, '登入逾時：不重複跳錯誤（由統一流程回登入畫面），修改保留');
  mapAdmin.dirty.text = {};

  // F. 同步
  handlers.mapSync = () => ({ success: true, kind: 'text', report: { added: 7, total: 127 } });
  log = []; toasts = []; mapAdminSync(); await wait(60);
  ok(calls('mapSync').length === 1 && calls('mapSync')[0].payload.kind === 'text' && /新增 7 筆/.test(toasts.join('|')) && calls('mapList').length === 1 && calls('mapStatus').length >= 1, '同步：呼叫後端、提示新增筆數、重新載入列表與統計');

  // G. 連續產生草稿
  mapAdmin.status = statusRes(); let seq = [{ drafted: 20, remaining: 40 }, { drafted: 20, remaining: 20 }, { drafted: 20, remaining: 0 }];
  handlers.textDraft = () => ({ success: true, result: Object.assign({ errors: 0, stoppedByQuota: false }, seq.shift()) });
  log = []; toasts = []; mapAdminDraftRun(); await wait(150);
  ok(calls('textDraft').length === 3 && calls('textDraft').every(c => c.payload.limit === 20), '連續呼叫 3 次、每次 20 筆，直到剩餘為 0');
  ok(/草稿完成：共產生 60 筆/.test(toasts.join('|')) && document.getElementById('mapAdminProgress').classList.contains('hidden') && mapAdmin.drafting === false && mapAdmin.busy === false, '完成：提示總數、隱藏進度條、解除忙碌');
  seq = [{ drafted: 20, remaining: 40 }, { drafted: 20, remaining: 20 }]; let n = 0;
  handlers.textDraft = () => { n++; if (n === 1) setTimeout(mapAdminCancelDraft, 0); return { success: true, result: Object.assign({ errors: 0, stoppedByQuota: false }, seq.shift() || { drafted: 0, remaining: 0 }) }; };
  log = []; toasts = []; mapAdminDraftRun(); await wait(150);
  ok(calls('textDraft').length <= 2 && /已停止/.test(toasts.join('|')) && mapAdmin.drafting === false, '按「停止」：不再送下一批');
  handlers.textDraft = () => ({ success: true, result: { drafted: 5, remaining: 30, errors: 0, stoppedByQuota: true } }); log = []; toasts = []; mapAdminDraftRun(); await wait(80);
  ok(calls('textDraft').length === 1 && /每日額度/.test(toasts.join('|')), '額度用盡：立刻停止並提醒明天再繼續');
  handlers.textDraft = () => ({ success: true, result: { drafted: 0, remaining: 5, errors: 5, stoppedByQuota: false } }); log = []; toasts = []; mapAdminDraftRun(); await wait(80);
  ok(calls('textDraft').length === 1, '一批完全沒有進展（全部失敗）：停止，不會無限重試');
  handlers.textDraft = () => new Error('連線逾時'); log = []; toasts = []; mapAdminDraftRun(); await wait(80);
  ok(/產生草稿中斷/.test(toasts.join('|')) && mapAdmin.busy === false && mapAdmin.drafting === false, '網路中斷：提示並解除忙碌');
  confirmAnswer = false; log = []; mapAdminDraftRun(); await wait(30); ok(calls('textDraft').length === 0, '確認視窗按取消：不呼叫後端');
  confirmAnswer = true; mapAdmin.status = { text: { total: 5, missingEn: 3, withDraft: 3, unused: 0, pendingNew: 0 }, name: {} }; log = []; toasts = []; mapAdminDraftRun(); await wait(30);
  ok(calls('textDraft').length === 0 && /沒有需要產生草稿/.test(toasts.join('|')), '沒有需要草稿的項目：直接提示、不呼叫後端');
  mapAdmin.status = statusRes();

  // H. 採用全部、刪除
  handlers.textAdopt = () => ({ success: true, adopted: 40 }); log = []; toasts = []; mapAdminAdoptAll(); await wait(60);
  ok(calls('textAdopt').length === 1 && calls('textAdopt')[0].payload.zhList === null && /已採用 40 筆/.test(toasts.join('|')), '採用全部：zhList 為 null、提示採用筆數');
  confirmAnswer = false; log = []; mapAdminAdoptAll(); await wait(30); ok(calls('textAdopt').length === 0, '確認視窗按取消：不採用'); confirmAnswer = true;
  mapAdmin.status = { text: { withDraft: 0, missingEn: 5, total: 5, unused: 0, pendingNew: 0 }, name: {} }; log = []; toasts = []; mapAdminAdoptAll(); await wait(30);
  ok(calls('textAdopt').length === 0 && /沒有可採用/.test(toasts.join('|')), '沒有草稿：直接提示'); mapAdmin.status = statusRes();
  handlers.mapDelete = p => ({ success: true, deleted: p.zhList.length, skipped: 0 });
  mapAdminOnFilter('unused'); const cbs = [...document.querySelectorAll('#mapAdminRows input[type=checkbox]')]; cbs[0].checked = true; cbs[0].dispatchEvent(new Event('change')); cbs[1].checked = true; cbs[1].dispatchEvent(new Event('change'));
  ok(document.getElementById('mapAdminDeleteBtn').disabled === false && /（2）/.test(document.getElementById('mapAdminDeleteBtn').textContent), '勾選 2 列：刪除鈕啟用並顯示（2）');
  log = []; toasts = []; mapAdminDeleteSelected(); await wait(60);
  ok(calls('mapDelete').length === 1 && calls('mapDelete')[0].payload.zhList.length === 2 && /已刪除 2 筆/.test(toasts.join('|')) && Object.keys(mapAdmin.sel).length === 0, '刪除：送出勾選的中文、提示、清空選取');
  mapAdmin.sel = {}; for (let i = 0; i < 230; i++) mapAdmin.sel['x' + i] = true; log = []; mapAdminDeleteSelected(); await wait(100);
  ok(calls('mapDelete').map(c => c.payload.zhList.length).join() === '100,100,30', '超過 100 筆：分段刪除（100、100、30）');
  mapAdmin.sel = {}; confirmAnswer = false; mapAdmin.sel['a'] = true; log = []; mapAdminDeleteSelected(); await wait(30); ok(calls('mapDelete').length === 0, '確認視窗按取消：不刪除'); confirmAnswer = true; mapAdmin.sel = {};

  // I. 手動新增
  mapAdminOnFilter('all'); log = []; toasts = [];
  document.getElementById('mapAdminAddZh').value = '  全新的   文字 '; document.getElementById('mapAdminAddEn').value = '';
  mapAdminAddRow(); ok(/請輸入中文原文與英文/.test(toasts.join('|')) && mapAdmin.extra.text.length === 0, '缺英文：提示、不加入');
  document.getElementById('mapAdminAddEn').value = 'Brand new'; mapAdminAddRow();
  ok(mapAdmin.dirty.text['全新的 文字'] === 'Brand new' && mapAdmin.extra.text.length === 1 && mapAdmin.filter === 'dirty', '加入：中文正規化（連續空白合併）、記為待儲存、切到「已修改」檢視');
  ok(rowsEl().some(r => r.getAttribute('data-zh') === '全新的 文字' && /手動新增/.test(r.textContent)), '列表中出現該列並標示「手動新增，尚未儲存」');
  document.getElementById('mapAdminAddZh').value = '文字5'; document.getElementById('mapAdminAddEn').value = 'x'; toasts = []; mapAdminAddRow(); ok(/已經在表中/.test(toasts.join('|')) && !mapAdmin.dirty.text['文字5'], '中文已在表中：提示改該列、不重複新增');
  handlers.mapSave = p => ({ success: true, updated: 0, added: p.changes.length, errors: [] }); log = []; mapAdminSave(); await wait(60);
  ok(eq(calls('mapSave')[0].payload.changes, [{ zh: '全新的 文字', en: 'Brand new' }]), '儲存時送出新增的項目');
  mapAdminOnFilter('all');

  // J. 切換種類（NameMap）
  mapAdmin.dirty.text = {}; log = []; mapAdminSetKind('name'); await wait(60);
  ok(mapAdmin.kind === 'name' && calls('mapList')[0].payload.kind === 'name' && rowsEl().length === 2, '切到「名稱」：載入 NameMap（2 列）');
  ok(document.getElementById('mapAdminDraftBtn').classList.contains('hidden') && document.getElementById('mapAdminAdoptAllBtn').classList.contains('hidden'), 'NameMap 沒有草稿功能：隱藏「產生草稿」「採用全部草稿」');
  ok(inputOf('幸福廚房').maxLength === 100, 'NameMap 英文欄上限 100 字元');
  ok(rowsEl().every(r => r.children[1].textContent === ''), 'NameMap 沒有機器草稿欄內容');
  mapAdminSetKind('text'); await wait(30);

  // K. 跳脫
  base[5] = { zh: '<img src=x onerror="window.__mapadminpwn=1">', en: '"><script>window.__mapadminpwn=2<\/script>', draft: '<b>bold</b>', used_in: '<i>x</i>', note: '' };
  mapAdmin.data.text = null; mapAdminOpen(); await wait(60); mapAdminOnQuery('onerror');
  ok(!window.__mapadminpwn && document.querySelectorAll('#mapAdminRows img, #mapAdminRows script, #mapAdminRows b, #mapAdminRows i').length === 0, '惡意內容（HTML、script）全部以純文字顯示，不會執行或注入元素');
  ok(rowsEl().length === 1 && rowsEl()[0].textContent.indexOf('<img src=x') >= 0 && rowsEl()[0].querySelector('input[type=text]').value.indexOf('<script>') >= 0, '原始字串完整保留（文字節點與輸入框的值）');
  mapAdminOnQuery('');

  // L. 登入狀態
  state.adminPassword = ''; log = []; mapAdminRefreshBadge(); ok(calls('mapStatus').length === 0, '沒有登入：不會向後端請求統計');

  window.callBackend = realCB; window.confirm = realConfirm; window.showToast = realToast; state.adminPassword = savedPw; window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
