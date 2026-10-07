// 後台「英文對照」相似文字介面測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 以假的 callBackend 驗證：相似組標示、「有相似文字」篩選與組內相鄰、只看這組、套用英文到相似列（確認視窗內容、取消不動、確認後只填入畫面、不呼叫後端）、
// 來源沒有英文時擋下、已相同時不重複、數字不同不分組、未使用的列不參與、NameMap 沒有此功能、跳脫、儲存後仍是一般流程。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realCB = window.callBackend, realConfirm = window.confirm, realToast = window.showToast;
  const savedPw = state.adminPassword; state.adminPassword = 'tok';
  let toasts = []; window.showToast = function (m) { toasts.push(String(m)); };
  let confirmAnswer = true, confirmMsgs = []; window.confirm = function (m) { confirmMsgs.push(String(m)); return confirmAnswer; };
  let log = []; let handlers = {};
  window.callBackend = function (action, payload, okCb, errCb) {
    log.push({ action: action, payload: JSON.parse(JSON.stringify(payload)) });
    const h = handlers[action];
    setTimeout(function () { if (!h) { okCb({ success: false, error: 'no handler' }); return; } const r = h(payload); if (r instanceof Error) errCb(r); else okCb(r); }, 0);
  };
  const calls = a => log.filter(x => x.action === a);

  const Z1 = '社-2-3 調整自己的行動，遵守生活規範和活動規則', Z2 = '社-2-3 調整自己的行動，遵守生活規範與活動規則';
  const N1 = '社-2-4 調整自己的行動，遵守生活規範和活動規則';           // 只差編號：不應和 Z1 同組
  const P1 = '能分享自己的想法並傾聽別人的意見', P2 = '能分享自己的想法並傾聽別人的意見喔', P3 = '能分享自己的想法並傾聽別人的意見喔！了';
  const OLD = '社-2-3 調整自己的行動，遵守生活規範及活動規則';          // 很像，但「目前沒有使用」→ 不參與
  const base = [
    { zh: '白飯', en: 'Rice', draft: '', used_in: '每日菜單：主食', note: '' },
    { zh: Z1, en: 'Community 2-3 Adjust your actions and abide by the norms of life and the rules of activities.', draft: '', used_in: '主題活動：課程目標', note: '' },
    { zh: P1, en: '', draft: 'Be able to share ideas and listen to others.', used_in: '主題活動：活動目標', note: '' },
    { zh: N1, en: 'Community 2-4 …', draft: '', used_in: '主題活動：課程目標', note: '' },
    { zh: Z2, en: '', draft: 'Community - 2-3 Adjust your actions and abide by the norms of life and activity rules.', used_in: '主題活動：課程目標', note: '' },
    { zh: P2, en: '', draft: '', used_in: '主題活動：活動目標', note: '' },
    { zh: OLD, en: '', draft: '', used_in: '（目前沒有使用）', note: '' },
    { zh: P3, en: 'Be able to share ideas.', draft: '', used_in: '主題活動：活動目標', note: '' },
    { zh: '<img src=x onerror="window.__simpwn=1">這是一段含有標籤的長文字甲', en: '', draft: '', used_in: '活動：標題', note: '' },
    { zh: '<img src=x onerror="window.__simpwn=1">這是一段含有標籤的長文字乙', en: '', draft: '', used_in: '活動：標題', note: '' }
  ];
  handlers.mapList = p => p.kind === 'name'
    ? { success: true, kind: 'name', hasDraft: false, unusedLabel: '（目前沒有使用）', rows: [{ zh: '幸福廚房大班活動甲', en: '', draft: '', used_in: '相簿類別', note: '' }, { zh: '幸福廚房大班活動乙', en: '', draft: '', used_in: '相簿類別', note: '' }] }
    : { success: true, kind: 'text', hasDraft: true, unusedLabel: '（目前沒有使用）', rows: base.map(r => Object.assign({}, r)) };
  handlers.mapStatus = () => ({ success: true, text: { total: 10, missingEn: 5, withDraft: 2, unused: 1, pendingNew: 0 }, name: { total: 2, missingEn: 2, withDraft: 0, unused: 0, pendingNew: 0 } });
  const rowsEl = () => [...document.querySelectorAll('#mapAdminRows .map-admin-row')];
  const rowOf = zh => rowsEl().find(x => x.getAttribute('data-zh') === zh);
  const inputOf = zh => { const r = rowOf(zh); return r && r.querySelector('input[type=text]'); };
  const badgeOf = zh => { const r = rowOf(zh); return r && r.querySelector('.map-sim-badge'); };
  const applyOf = zh => { const r = rowOf(zh); return r && r.querySelector('.map-sim-apply'); };
  const resetState = () => { mapAdmin.kind = 'text'; mapAdmin.data = { text: null, name: null }; mapAdmin.dirty = { text: {}, name: {} }; mapAdmin.extra = { text: [], name: [] }; mapAdmin.sel = {}; mapAdmin.filter = 'all'; mapAdmin.simGroup = null; mapAdmin.query = ''; adminLists.translations.page = 0; adminLists.translations.size = 10; mapAdmin.status = null; mapAdmin.busy = false; document.getElementById('mapAdminFilter').value = 'all'; document.getElementById('mapAdminSearch').value = ''; log = []; toasts = []; confirmMsgs = []; confirmAnswer = true; };
  resetState();
  mapAdminOpen(); await wait(80);

  // A. 標示與摘要
  ok([...document.querySelectorAll('#mapAdminFilter option')].some(o => o.value === 'similar' && /相似文字/.test(o.textContent)), '篩選選單有「有相似文字」');
  ok(rowsEl().length === 10, '一開始（全部）顯示 10 列，順序不變');
  ok(!!badgeOf(Z1) && !!badgeOf(Z2) && /共 2 筆/.test(badgeOf(Z1).textContent), '「和」與「與」兩筆都有「🔗 相似文字共 2 筆」標示');
  ok(!!badgeOf(P1) && !!badgeOf(P2) && !!badgeOf(P3) && /共 3 筆/.test(badgeOf(P1).textContent), '串接的三句（P1～P3）合成一組，標示「共 3 筆」');
  ok(!badgeOf(N1) && !badgeOf('白飯') && !badgeOf(OLD), '只差編號的（社-2-4）、短文字（白飯）、目前沒有使用的列，都沒有標示');
  ok(/相似文字 3 組（7 筆/.test(document.getElementById('mapAdminSummary').textContent), '摘要顯示「相似文字 3 組（7 筆…」（P 組 3 筆、和／與 2 筆、含標籤的兩筆 2 筆）');
  ok(!!applyOf(Z1) && !!applyOf(P3) && !applyOf(N1), '有相似文字的列才有「套用到相似列」按鈕');

  // B. 篩選與相鄰
  mapAdminOnFilter('similar');
  const XA = base[8].zh, XB = base[9].zh;
  ok(rowsEl().length === 7, '「有相似文字」只列出 7 筆');
  ok(rowsEl().map(r => r.getAttribute('data-zh')).join('|') === [Z1, Z2, P1, P2, P3, XA, XB].join('|'), '同組相鄰、組別依第一筆成員在表中出現的順序（和／與組、P 組、含標籤組）、組內維持原順序');
  badgeOf(Z1).click();
  ok(mapAdmin.simGroup !== null && rowsEl().map(r => r.getAttribute('data-zh')).join('|') === [Z1, Z2].join('|') && document.getElementById('mapAdminFilter').value === 'similar', '按「只看這組」：只剩「和／與」兩筆並排');
  ok(/顯示中/.test(badgeOf(Z1).textContent), '標示改為「（顯示中）」');
  mapAdminOnFilter('similar'); ok(mapAdmin.simGroup === null && rowsEl().length === 7, '重新選篩選：回到全部相似組');
  mapAdminOnQuery('與活動規則'); ok(rowsEl().length === 1 && rowsEl()[0].getAttribute('data-zh') === Z2, '相似篩選可搭配搜尋'); mapAdminOnQuery('');

  // C. 套用：來源沒有英文
  mapAdminOnFilter('all');
  applyOf(Z2).click();
  ok(confirmMsgs.length === 0 && toasts.some(t => /還沒有英文/.test(t)) && Object.keys(mapAdmin.dirty.text).length === 0, '來源沒有英文：擋下並提示，不跳確認、不修改');

  // D. 套用：取消
  toasts = []; confirmAnswer = false;
  applyOf(Z1).click();
  ok(confirmMsgs.length === 1, '有英文的來源：跳出確認視窗');
  const msg = confirmMsgs[0];
  ok(msg.indexOf(Z1) >= 0 && msg.indexOf(base[1].en) >= 0 && msg.indexOf(Z2) >= 0 && /尚未翻譯/.test(msg) && /儲存變更/.test(msg) && msg.indexOf(N1) < 0 && msg.indexOf(OLD) < 0, '確認視窗列出來源（中文與英文）、將被改的列（含目前狀態），並註明要按「儲存變更」；不相關的列不在其中');
  ok(Object.keys(mapAdmin.dirty.text).length === 0 && calls('mapSave').length === 0, '按取消：什麼都不改');

  // E. 套用：確認
  confirmAnswer = true; confirmMsgs = []; toasts = [];
  applyOf(Z1).click();
  ok(mapAdmin.dirty.text[Z2] === base[1].en && Object.keys(mapAdmin.dirty.text).length === 1, '按確認：只把同組的「與」那筆填成同樣英文（標為已修改）');
  ok(inputOf(Z2).value === base[1].en && rowOf(Z2).classList.contains('bg-amber-50/60'), '畫面上該列的英文欄已填入並有已修改底色');
  ok(calls('mapSave').length === 0 && calls('mapList').length === 1, '套用只改畫面，沒有呼叫後端儲存（要按「儲存變更」）');
  ok(!mapAdmin.dirty.text[N1] && !mapAdmin.dirty.text[OLD] && !mapAdmin.dirty.text[Z1], '其他列（編號不同、未使用、來源本身）完全沒動');
  ok(toasts.some(t => /已套用到 1 筆/.test(t)), '提示「已套用到 1 筆，記得按儲存變更」');
  ok(document.getElementById('mapAdminSaveBtn').disabled === false && /（1）/.test(document.getElementById('mapAdminSaveBtn').textContent), '儲存鈕啟用並顯示（1）');

  // F. 再套用一次：已經相同
  confirmMsgs = []; toasts = [];
  applyOf(Z1).click();
  ok(confirmMsgs.length === 0 && toasts.some(t => /已經一樣/.test(t)), '同組英文已一致：提示「已經一樣」，不再跳確認');

  // G. 以修改中的英文當來源（尚未儲存）也可以套用；多筆目標
  mapAdminSetValue(P3, 'Share ideas and listen to others.'); mapAdminRenderRows();
  confirmMsgs = []; applyOf(P3).click();
  ok(confirmMsgs.length === 1 && confirmMsgs[0].indexOf('Share ideas and listen to others.') >= 0 && /2 筆相似的列/.test(confirmMsgs[0]) && confirmMsgs[0].indexOf(P1) >= 0 && confirmMsgs[0].indexOf(P2) >= 0 && confirmMsgs[0].indexOf('Be able to share ideas.') < 0, '以「未儲存的修改」為來源：確認視窗用修改後的英文，目標 2 筆（P1、P2）');
  ok(mapAdmin.dirty.text[P1] === 'Share ideas and listen to others.' && mapAdmin.dirty.text[P2] === 'Share ideas and listen to others.', 'P1、P2 都被填入同樣英文');

  // H. 儲存仍走一般流程
  handlers.mapSave = p => ({ success: true, updated: 0, added: 0, errors: [] }); log = [];
  mapAdminSave(); await wait(80);
  ok(calls('mapSave').length === 1 && calls('mapSave')[0].payload.changes.length === 4 && calls('mapSave')[0].payload.changes.some(c => c.zh === Z2 && c.en === base[1].en), '按「儲存變更」才送出：包含剛才套用的列');
  ok(calls('mapList').length >= 1, '儲存後重新載入（相似組快取隨之重算）');

  // I. 清除英文後來源為空 → 不能套用
  mapAdminSetValue(Z1, ''); mapAdminRenderRows(); confirmMsgs = []; toasts = [];
  applyOf(Z1).click(); ok(confirmMsgs.length === 0 && toasts.some(t => /還沒有英文/.test(t)), '把來源英文清空後：不能套用空白英文');
  mapAdmin.dirty.text = {};

  // J. 名稱（NameMap）沒有這個功能
  mapAdminSetKind('name'); await wait(80);
  ok(rowsEl().length === 2 && document.querySelectorAll('#mapAdminRows .map-sim-badge, #mapAdminRows .map-sim-apply').length === 0, '「名稱」種類：即使文字很像也不分組、沒有標示與按鈕');
  ok(!/相似文字/.test(document.getElementById('mapAdminSummary').textContent), '「名稱」種類：摘要沒有相似文字');
  mapAdmin.filter = 'similar'; document.getElementById('mapAdminFilter').value = 'similar'; mapAdminRenderRows();
  ok(rowsEl().length === 0, '「名稱」種類套用「有相似文字」篩選：沒有任何列');
  mapAdminSetKind('text'); await wait(30);
  ok(mapAdmin.filter === 'all' && document.getElementById('mapAdminFilter').value === 'all', '切回「內容」時篩選已重設為全部');

  // K. 跳脫
  mapAdminOnFilter('similar');
  ok(!window.__simpwn && document.querySelectorAll('#mapAdminRows img').length === 0 && rowsEl().some(r => r.textContent.indexOf('<img src=x') >= 0), '含標籤的中文（也成組）以純文字顯示，不會執行或注入元素');
  mapAdminOnFilter('all');

  window.callBackend = realCB; window.confirm = realConfirm; window.showToast = realToast; state.adminPassword = savedPw; window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
