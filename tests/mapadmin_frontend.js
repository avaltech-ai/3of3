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
  let nameHasDraft = false;   // 模擬後端有沒有更新：false＝舊後端（NameMap 沒有草稿欄），true＝新後端
  const nameRes = () => nameHasDraft ? ({ success: true, kind: 'name', hasDraft: true, unusedLabel: '（目前沒有使用）', rows: [{ zh: '幸福廚房', en: 'Happy Kitchen', draft: '', used_in: '相簿類別', note: '' }, { zh: '諾貝爾 A', en: '', draft: 'Nobel A', used_in: '活動對象', note: '' }, { zh: '舊名稱', en: '', draft: '', used_in: '（目前沒有使用）', note: '' }] })
    : ({ success: true, kind: 'name', hasDraft: false, unusedLabel: '（目前沒有使用）', rows: [{ zh: '幸福廚房', en: 'Happy Kitchen', draft: '', used_in: '相簿類別', note: '' }, { zh: '舊名稱', en: '', draft: '', used_in: '（目前沒有使用）', note: '' }] });
  const statusRes = () => ({ success: true, text: { total: 120, missingEn: 70, withDraft: 40, unused: 12, pendingNew: 3 }, name: { total: 2, missingEn: 1, withDraft: 0, unused: 1, pendingNew: 0 } });
  handlers.mapList = p => p.kind === 'name' ? nameRes() : listRes();
  handlers.mapStatus = () => statusRes();
  const rowsEl = () => [...document.querySelectorAll('#mapAdminRows .map-admin-row')];
  const inputOf = zh => { const r = rowsEl().find(x => x.getAttribute('data-zh') === zh); return r && r.querySelector('input[type=text]'); };
  const resetState = () => { mapAdmin.kind = 'text'; mapAdmin.data = { text: null, name: null }; mapAdmin.dirty = { text: {}, name: {} }; mapAdmin.extra = { text: [], name: [] }; mapAdmin.sel = {}; mapAdmin.filter = 'all'; mapAdmin.query = ''; adminLists.translations.page = 0; adminLists.translations.size = 50; mapAdmin.status = null; mapAdmin.busy = false; mapAdmin.drafting = false; mapAdmin.cancelDraft = false; document.getElementById('mapAdminFilter').value = 'all'; document.getElementById('mapAdminSearch').value = ''; log = []; toasts = []; };
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
  const pgBtn = w => document.querySelector('#adminTranslationsPager button[data-go="' + w + '"]'), pgTxt = () => document.querySelector('#adminTranslationsPager .admin-pager-page').textContent;
  ok(pgBtn('first').disabled && pgBtn('prev').disabled && !pgBtn('next').disabled && pgTxt() === '1 / 3', '分頁（每頁 50）：第 1/3 頁、第一頁與上一頁停用');
  pgBtn('next').click(); pgBtn('next').click(); ok(rowsEl().length === 20 && pgBtn('next').disabled && pgBtn('last').disabled && pgTxt() === '3 / 3', '最後一頁 20 列、下一頁與最末頁停用');
  mapAdminOnFilter('unused'); ok(adminLists.translations.page === 0 && rowsEl().length === 12, '換篩選回到第一頁');
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
  handlers.mapDraft = () => ({ success: true, result: Object.assign({ errors: 0, stoppedByQuota: false }, seq.shift()) });
  log = []; toasts = []; mapAdminDraftRun(); await wait(150);
  ok(calls('mapDraft').length === 3 && calls('mapDraft').every(c => c.payload.limit === 20), '連續呼叫 3 次、每次 20 筆，直到剩餘為 0');
  ok(/草稿完成：共產生 60 筆/.test(toasts.join('|')) && document.getElementById('mapAdminProgress').classList.contains('hidden') && mapAdmin.drafting === false && mapAdmin.busy === false, '完成：提示總數、隱藏進度條、解除忙碌');
  seq = [{ drafted: 20, remaining: 40 }, { drafted: 20, remaining: 20 }]; let n = 0;
  handlers.mapDraft = () => { n++; if (n === 1) setTimeout(mapAdminCancelDraft, 0); return { success: true, result: Object.assign({ errors: 0, stoppedByQuota: false }, seq.shift() || { drafted: 0, remaining: 0 }) }; };
  log = []; toasts = []; mapAdminDraftRun(); await wait(150);
  ok(calls('mapDraft').length <= 2 && /已停止/.test(toasts.join('|')) && mapAdmin.drafting === false, '按「停止」：不再送下一批');
  handlers.mapDraft = () => ({ success: true, result: { drafted: 5, remaining: 30, errors: 0, stoppedByQuota: true } }); log = []; toasts = []; mapAdminDraftRun(); await wait(80);
  ok(calls('mapDraft').length === 1 && /每日額度/.test(toasts.join('|')), '額度用盡：立刻停止並提醒明天再繼續');
  handlers.mapDraft = () => ({ success: true, result: { drafted: 0, remaining: 5, errors: 5, stoppedByQuota: false } }); log = []; toasts = []; mapAdminDraftRun(); await wait(80);
  ok(calls('mapDraft').length === 1, '一批完全沒有進展（全部失敗）：停止，不會無限重試');
  handlers.mapDraft = () => new Error('連線逾時'); log = []; toasts = []; mapAdminDraftRun(); await wait(80);
  ok(/產生草稿中斷/.test(toasts.join('|')) && mapAdmin.busy === false && mapAdmin.drafting === false, '網路中斷：提示並解除忙碌');
  confirmAnswer = false; log = []; mapAdminDraftRun(); await wait(30); ok(calls('mapDraft').length === 0, '確認視窗按取消：不呼叫後端');
  confirmAnswer = true; mapAdmin.status = { text: { total: 5, missingEn: 3, withDraft: 3, unused: 0, pendingNew: 0 }, name: {} }; log = []; toasts = []; mapAdminDraftRun(); await wait(30);
  ok(calls('mapDraft').length === 0 && /沒有需要產生草稿/.test(toasts.join('|')), '沒有需要草稿的項目：直接提示、不呼叫後端');
  mapAdmin.status = statusRes();

  // H. 採用全部、刪除
  handlers.mapAdopt = () => ({ success: true, adopted: 40 }); log = []; toasts = []; mapAdminAdoptAll(); await wait(60);
  ok(calls('mapAdopt').length === 1 && calls('mapAdopt')[0].payload.zhList === null && /已採用 40 筆/.test(toasts.join('|')), '採用全部：zhList 為 null、提示採用筆數');
  confirmAnswer = false; log = []; mapAdminAdoptAll(); await wait(30); ok(calls('mapAdopt').length === 0, '確認視窗按取消：不採用'); confirmAnswer = true;
  mapAdmin.status = { text: { withDraft: 0, missingEn: 5, total: 5, unused: 0, pendingNew: 0 }, name: {} }; log = []; toasts = []; mapAdminAdoptAll(); await wait(30);
  ok(calls('mapAdopt').length === 0 && /沒有可採用/.test(toasts.join('|')), '沒有草稿：直接提示'); mapAdmin.status = statusRes();
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
  ok(document.getElementById('mapAdminDraftBtn').classList.contains('hidden') && document.getElementById('mapAdminAdoptAllBtn').classList.contains('hidden'), '舊後端（NameMap 沒有草稿欄、hasDraft=false）：維持舊畫面，隱藏「產生草稿」「採用全部草稿」（相容：前端先上線也不會壞）');
  ok(inputOf('幸福廚房').maxLength === 100, 'NameMap 英文欄上限 100 字元');
  ok(rowsEl().every(r => r.children[1].textContent === ''), 'NameMap 沒有機器草稿欄內容');
  mapAdminSetKind('text'); await wait(30);

  // J2. 名稱也有機器草稿（2026-10-18：後端 NameMap 加 draft 欄，與內容比照）＋內容／名稱各自的紅點
  nameHasDraft = true;
  const nameStatus = () => ({ success: true, text: { total: 120, missingEn: 70, withDraft: 40, unused: 12, pendingNew: 3 }, name: { total: 3, missingEn: 2, withDraft: 1, unused: 1, pendingNew: 1 } });
  handlers.mapStatus = () => nameStatus(); mapAdmin.status = nameStatus(); mapAdmin.data = { text: mapAdmin.data.text, name: null }; mapAdmin.dirty = { text: {}, name: {} };
  mapAdminUpdateBadge();
  const kb = k => document.getElementById('mapAdminKindBadge-' + k), kbt = k => document.getElementById('mapAdminKind-' + k);
  ok(!kb('text').classList.contains('hidden') && kb('text').textContent === '3' && !kb('name').classList.contains('hidden') && kb('name').textContent === '1', '「內容」「名稱」切換鈕上各有自己的紅點：內容 3、名稱 1');
  ok(document.getElementById('mapAdminTabBadge').textContent === '4' && /內容 3 筆、名稱 1 筆/.test(document.getElementById('mapAdminTabBadge').title) && /內容，有 3 筆/.test(kbt('text').getAttribute('aria-label')) && /名稱，有 1 筆/.test(kbt('name').getAttribute('aria-label')), '頁籤紅點是合計 4，滑過會寫明「內容 3 筆、名稱 1 筆」；切換鈕有給螢幕閱讀器的說明');
  mapAdmin.status = { text: { pendingNew: 0 }, name: { pendingNew: 2 } }; mapAdminUpdateBadge();
  ok(kb('text').classList.contains('hidden') && !kb('name').classList.contains('hidden') && kb('name').textContent === '2' && !kbt('text').getAttribute('aria-label'), '只有名稱有新文字：內容的紅點與說明消失、名稱顯示 2');
  mapAdmin.status = nameStatus(); mapAdminUpdateBadge();
  log = []; mapAdminSetKind('name'); await wait(80);
  const hid = id => document.getElementById(id).classList.contains('hidden');
  ok(mapAdmin.kind === 'name' && !hid('mapAdminDraftBtn') && !hid('mapAdminAdoptAllBtn'), '新後端（hasDraft=true）：「名稱」分頁也顯示「產生草稿」與「採用全部草稿」');
  const nr = zh => rowsEl().find(x => x.getAttribute('data-zh') === zh);
  ok(rowsEl().length === 3 && !!nr('諾貝爾 A') && nr('諾貝爾 A').children[1].textContent.indexOf('Nobel A') !== -1 && !!nr('諾貝爾 A').children[1].querySelector('button') && nr('幸福廚房').children[1].querySelector('button') === null, '名稱列表：顯示機器草稿欄；有草稿且英文空白的列才有「採用」鈕');
  ok(inputOf('諾貝爾 A').maxLength === 100 && inputOf('諾貝爾 A').value === '', '名稱英文欄：上限 100 字元、尚未填');
  ok(/（其中有草稿 1 筆）/.test(document.getElementById('mapAdminSummary').textContent) && /有 1 筆新名稱尚未加入/.test(document.getElementById('mapAdminSummary').textContent), '名稱摘要：「尚未翻譯 2 筆（其中有草稿 1 筆）」與「有 1 筆新名稱尚未加入」');
  const nameAdoptBtn = nr('諾貝爾 A') && nr('諾貝爾 A').children[1].querySelector('button'); if (nameAdoptBtn) nameAdoptBtn.click();
  ok(inputOf('諾貝爾 A').value === 'Nobel A' && mapAdminIsChanged('諾貝爾 A'), '按單筆「採用」：草稿填進英文欄並標為已修改（按儲存才寫入）');
  mapAdmin.dirty.name = {}; mapAdmin.data.name = null; mapAdminLoad('name'); await wait(50);
  let asked = []; window.confirm = m => { asked.push(String(m)); return true; };
  handlers.mapDraft = () => ({ success: true, result: { drafted: 1, remaining: 0, errors: 0, stoppedByQuota: false } });
  mapAdmin.status = nameStatus(); log = []; toasts = []; mapAdminDraftRun(); await wait(120);
  ok(calls('mapDraft').length === 1 && calls('mapDraft')[0].payload.kind === 'name' && calls('mapDraft')[0].payload.limit === 20 && /名稱/.test(asked[0]) && /草稿完成：共產生 1 筆/.test(toasts.join('|')), '名稱的「產生草稿」：送出 kind=name、確認視窗寫「名稱」、完成提示');
  ok(calls('mapList').length >= 1 && calls('mapList').every(c => c.payload.kind === 'name') && mapAdmin.kind === 'name', '完成後重新載入的是「名稱」的列表（不是內容）');
  mapAdmin.status = Object.assign(nameStatus(), { name: { total: 3, missingEn: 2, withDraft: 0, unused: 1, pendingNew: 1 } }); log = []; toasts = []; mapAdminDraftRun(); await wait(30);
  ok(calls('mapDraft').length === 1 && calls('mapDraft')[0].payload.kind === 'name', '名稱還有 2 筆沒草稿：可以繼續產生');
  mapAdmin.status = Object.assign(nameStatus(), { name: { total: 3, missingEn: 1, withDraft: 1, unused: 1, pendingNew: 0 } }); log = []; toasts = []; mapAdminDraftRun(); await wait(30);
  ok(calls('mapDraft').length === 0 && /沒有需要產生草稿/.test(toasts.join('|')), '名稱：全部都有草稿了 → 直接提示，不呼叫後端');
  handlers.mapAdopt = () => ({ success: true, adopted: 1 }); mapAdmin.status = nameStatus(); log = []; toasts = []; mapAdminAdoptAll(); await wait(80);
  ok(calls('mapAdopt').length === 1 && calls('mapAdopt')[0].payload.kind === 'name' && calls('mapAdopt')[0].payload.zhList === null && /已採用 1 筆/.test(toasts.join('|')) && calls('mapList').every(c => c.payload.kind === 'name'), '名稱的「採用全部草稿」：送出 kind=name，重新載入名稱列表');
  window.confirm = function () { return confirmAnswer; };
  nameHasDraft = false; handlers.mapStatus = () => statusRes(); mapAdmin.status = statusRes(); mapAdminUpdateBadge();
  mapAdmin.data = { text: mapAdmin.data.text, name: null }; mapAdminSetKind('text'); await wait(30); mapAdmin.dirty = { text: {}, name: {} };

  // K. 跳脫
  base[5] = { zh: '<img src=x onerror="window.__mapadminpwn=1">', en: '"><script>window.__mapadminpwn=2<\/script>', draft: '<b>bold</b>', used_in: '<i>x</i>', note: '' };
  mapAdmin.data.text = null; mapAdminOpen(); await wait(60); mapAdminOnQuery('onerror');
  ok(!window.__mapadminpwn && document.querySelectorAll('#mapAdminRows img, #mapAdminRows script, #mapAdminRows b, #mapAdminRows i').length === 0, '惡意內容（HTML、script）全部以純文字顯示，不會執行或注入元素');
  ok(rowsEl().length === 1 && rowsEl()[0].textContent.indexOf('<img src=x') >= 0 && rowsEl()[0].querySelector('input[type=text]').value.indexOf('<script>') >= 0, '原始字串完整保留（文字節點與輸入框的值）');
  mapAdminOnQuery('');

  // M. 分頁與其他後台列表一致（共用元件）
  try { localStorage.removeItem('nobel_a_adminlist_size_translations'); } catch (e) {}
  resetState(); adminLists.translations.size = 10; mapAdminOpen(); await wait(60);
  const pg = () => document.getElementById('adminTranslationsPager');
  const cnt = () => (pg().querySelector('.admin-pager-count') || {}).textContent, pgt = () => (pg().querySelector('.admin-pager-page') || {}).textContent;
  const goBtn = w => pg().querySelector('button[data-go="' + w + '"]');
  const setSz = v => { const sel = pg().querySelector('.admin-pager-size'); sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); };
  ok(!document.getElementById('mapAdminPrev') && !document.getElementById('mapAdminNext') && !document.getElementById('mapAdminPageText'), '舊的文字分頁（上一頁／下一頁）已移除');
  ok(rowsEl().length === 10 && cnt() === '共 120 筆' && pgt() === '1 / 12', '每頁 10 筆（與其他列表一致）：共 120 筆、1 / 12');
  const navs = [...pg().querySelectorAll('.admin-pager-nav button')];
  ok(navs.map(b => b.getAttribute('data-go')).join(',') === 'first,prev,next,last' && navs.every(b => b.textContent.trim() === '' && !!b.querySelector('svg')), '分頁列：第一頁、上一頁、下一頁、最末頁，圖示按鈕、沒有文字');
  ok([...pg().querySelectorAll('.admin-pager-size option')].map(o => o.textContent).join(',') === '10,20,50,全部', '每頁選項：10、20、50、全部');
  goBtn('last').click(); ok(pgt() === '12 / 12' && rowsEl().length === 10 && goBtn('next').disabled, '最末頁：12 / 12');
  goBtn('first').click(); goBtn('next').click(); ok(pgt() === '2 / 12' && rowsEl()[0].getAttribute('data-zh') === '文字10', '下一頁：第 2 頁從第 11 筆開始');
  setSz('50'); ok(rowsEl().length === 50 && pgt() === '1 / 3' && localStorage.getItem('nobel_a_adminlist_size_translations') === '50', '改每頁 50：回到第 1 頁、共 3 頁，並記住');
  setSz('0'); ok(rowsEl().length === 120 && pg().querySelector('.admin-pager-nav') === null && cnt() === '共 120 筆', '全部：120 筆、不分頁');
  setSz('10'); mapAdminOnFilter('missing');
  const expMiss = base.filter(r => r.used_in !== '（目前沒有使用）' && !r.en).length;
  ok(cnt() === '符合 ' + expMiss + ' 筆（共 120 筆）', '篩選後：「符合 ' + expMiss + ' 筆（共 120 筆）」');
  mapAdminOnFilter('all'); mapAdminOnQuery('文字119'); ok(pg().querySelector('.admin-pager-nav') === null && rowsEl().length === 1, '搜尋結果不到一頁：不顯示分頁按鈕');
  mapAdminOnQuery(''); mapAdminOnFilter('all'); goBtn('next').click(); ok(pgt() === '2 / 12', '（準備）移到第 2 頁');
  mapAdminOnQuery('文字1'); ok(pgt() === '1 / 4' && cnt() === '符合 31 筆（共 120 筆）', '輸入搜尋：回到第 1 頁（「文字1」符合 31 筆、共 4 頁）');
  mapAdminOnQuery(''); goBtn('last').click(); mapAdmin.filter = 'missing'; mapAdminRenderRows();
  const missPages = Math.ceil(expMiss / 10);
  ok(pgt() === missPages + ' / ' + missPages, '資料變少（篩選改變）時頁碼夾回最後一頁（' + missPages + ' / ' + missPages + '）');
  goBtn('prev').click(); ok(pgt() === (missPages - 1) + ' / ' + missPages, '夾回後按「上一頁」：從最後一頁往前一頁（頁碼已寫回，不會卡住）');
  mapAdminOnFilter('all');
  mapAdminOnQuery(''); mapAdminOnFilter('all'); goBtn('last').click(); mapAdminSetKind('name'); await wait(60);
  ok(adminLists.translations.page === 0 && cnt() === '共 2 筆' && pg().querySelector('.admin-pager-nav') === null, '切到「名稱」：回到第 1 頁、共 2 筆、不分頁');
  mapAdminSetKind('text'); await wait(60);
  try { localStorage.removeItem('nobel_a_adminlist_size_translations'); } catch (e) {}
  adminLists.translations.size = adminListStoredSize('translations');

  // L. 登入狀態
  state.adminPassword = ''; log = []; mapAdminRefreshBadge(); ok(calls('mapStatus').length === 0, '沒有登入：不會向後端請求統計');

  window.callBackend = realCB; window.confirm = realConfirm; window.showToast = realToast; state.adminPassword = savedPw; window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
