// 後台「焦點活動」表單模式測試（瀏覽器）：新增／編輯既有／再次上架三種模式的橫幅與顏色、更新前差異確認、另存為新焦點活動、未儲存內容防呆。
// 用法見 tests/README.md（在載入 index.html 的頁面 Console 執行）。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { sp: state.spotlights, pwd: state.adminPassword, ls1: localStorage.getItem('nobel_a_spotlights_list'), ls2: localStorage.getItem('nobel_a_spotlight_custom') };
  const real = { confirm: window.confirm, alert: window.alert, cb: window.callBackend, toast: window.showToast, today: window.getTodayDateStr };
  const $ = id => document.getElementById(id);
  const toasts = [], cbs = [], confirms = []; let answer = true;
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.alert = function () {};
  window.showToast = m => { toasts.push(String(m)); };
  window.callBackend = (a, p, okCb) => { cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true }); };
  window.getTodayDateStr = () => '2026-10-13';
  state.adminPassword = 'tok'.repeat(15);
  const mk = (id, title, extra) => Object.assign({ id: id, title: title, subtitle: '副標' + id, mediaType: 'image', imageUrl: 'https://example.com/' + id + '.jpg', startDate: '2026-10-01', endDate: '2026-10-31', duration: 5, priority: 1, status: '啟用', bulletPoints: '【重點】內容' + id }, extra || {});
  const reset = () => { toasts.length = 0; cbs.length = 0; confirms.length = 0; answer = true; spPendingUploadFile = null; state.spotlights = [mk('S1', '焦點一'), mk('S2', '焦點二', { priority: 2 })]; closeSpotlightForm(); };
  const cls = (el, c) => el.className.split(/\s+/).indexOf(c) >= 0;
  const txt = () => $('spFormModeText').textContent;
  const vis = el => !el.classList.contains('hidden');
  const saveCall = () => cbs.filter(c => c.a === 'saveSpotlight')[0];
  reset();

  // A. 新增
  openSpotlightCreateForm();
  ok(vis($('spAdminFormContainer')) && /新增焦點活動：儲存後會建立一筆新的/.test(txt()) && cls($('spAdminFormContainer'), 'border-emerald-200') && $('spBtnSaveLabel').textContent === '新增這筆焦點活動' && !vis($('spBtnSaveAsNew')), '新增模式：綠色橫幅、按鈕「新增這筆焦點活動」、沒有「另存為新」');
  ok(cls($('spBtnSave'), 'bg-emerald-500') && !cls($('spBtnSave'), 'bg-peach-500'), '儲存鈕變綠色（原本的桃色移除）');

  // B. 編輯
  closeSpotlightForm(); openSpotlightEditForm('S1');
  ok(/正在編輯既有焦點活動「焦點一」/.test(txt()) && /會修改這筆原本的內容/.test(txt()) && cls($('spAdminFormContainer'), 'border-amber-400') && !cls($('spAdminFormContainer'), 'border-emerald-200'), '編輯模式：橘色橫幅「正在編輯既有焦點活動「焦點一」…會修改這筆原本的內容」、卡片橘框');
  ok($('spBtnSaveLabel').textContent === '更新原焦點活動' && vis($('spBtnSaveAsNew')) && cls($('spBtnSave'), 'bg-amber-500') && $('spForm-id').value === 'S1', '編輯模式：「更新原焦點活動」＋「➕ 另存為新焦點活動」，表單帶入原內容與編號');

  // C. 沒有變更
  saveSpotlightSettings(); ok(cbs.length === 0 && confirms.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]), '沒改任何東西就更新：提示「沒有任何變更」，不確認、不送出');

  // D. 有變更
  $('spForm-title').value = '焦點一（改）'; $('spForm-endDate').value = '2026-11-15'; $('spForm-bulletPoints').value = '全新的長重點'.repeat(10);
  answer = false; saveSpotlightSettings();
  ok(confirms.length === 1 && /即將修改原焦點活動「焦點一」/.test(confirms[0]) && /結束日期：2026-10-31 → 2026-11-15/.test(confirms[0]) && /主標題：焦點一 → 焦點一（改）/.test(confirms[0]) && /重點說明：（原內容） → （已修改）/.test(confirms[0]) && /另存為新焦點活動/.test(confirms[0]), '更新前列出差異（結束日期、主標題、重點說明只寫「已修改」），並提醒可改按「另存為新焦點活動」');
  ok(cbs.length === 0 && state.spotlights.find(s => s.id === 'S1').title === '焦點一' && $('spForm-title').value === '焦點一（改）' && /正在編輯/.test(txt()), '按取消：沒送出、原活動不變、表單內容與編輯模式保留');
  answer = true; saveSpotlightSettings();
  ok(!!saveCall() && saveCall().p.data.id === 'S1' && state.spotlights.length === 2 && state.spotlights.find(s => s.id === 'S1').title === '焦點一（改）' && state.spotlights.find(s => s.id === 'S1').endDate === '2026-11-15', '確定更新：以原編號 S1 送出，活動數不變、內容已更新');
  ok(/已更新原焦點活動「焦點一（改）」/.test(toasts.join('|')) && !vis($('spAdminFormContainer')) && /新增焦點活動/.test(txt()) && confirms.length === 2, '提示「已更新原焦點活動」、表單關閉回到新增模式、儲存後關閉表單不會多問「放棄嗎」（只有那兩次差異確認）');

  // E. 另存為新
  reset(); openSpotlightEditForm('S1'); $('spForm-title').value = '焦點一（另存）'; $('spForm-endDate').value = '2026-12-01';
  saveSpotlightSettings(true);
  ok(confirms.length === 0 && !!saveCall() && saveCall().p.data.id !== 'S1' && /^SP-/.test(saveCall().p.data.id) && state.spotlights.length === 3, '另存為新：不跳確認、新編號 SP-…、焦點活動數 +1');
  ok(state.spotlights.find(s => s.id === 'S1').title === '焦點一' && state.spotlights.find(s => s.id === 'S1').endDate === '2026-10-31', '原活動 S1 完全沒被改動');
  ok(state.spotlights.find(s => s.id === saveCall().p.data.id).title === '焦點一（另存）' && /已新增焦點活動「焦點一（另存）」/.test(toasts.join('|')), '新活動是修改後的內容，提示「已新增焦點活動」');
  ok(state.spotlights.find(s => s.id === saveCall().p.data.id).imageUrl === 'https://example.com/S1.jpg', '沿用原圖片網址（不重新上傳）');

  // F. 再次上架（複製）
  reset(); openSpotlightRelistForm('S1');
  ok(/再次上架「焦點一」/.test(txt()) && /原焦點活動不會改變/.test(txt()) && cls($('spAdminFormContainer'), 'border-sky-300') && $('spBtnSaveLabel').textContent === '新增這筆焦點活動' && !vis($('spBtnSaveAsNew')), '再次上架：藍色橫幅「原焦點活動不會改變」、只有一顆「新增這筆焦點活動」');
  ok($('spForm-id').value === '' && $('spForm-endDate').value === '' && $('spForm-startDate').value === '2026-10-13' && $('spForm-title').value === '焦點一', '再次上架：沒有編號、結束日期清空、開始日＝今天、內容保留');
  $('spForm-endDate').value = '2026-12-31'; saveSpotlightSettings();
  ok(confirms.length === 0 && !!saveCall() && /^SP-/.test(saveCall().p.data.id) && state.spotlights.length === 3 && state.spotlights.find(s => s.id === 'S1').endDate === '2026-10-31' && /已新增焦點活動/.test(toasts.join('|')), '填好結束日後存檔：新的一筆、原活動 S1 不變、提示「已新增焦點活動」');

  // G. 防呆
  reset(); openSpotlightEditForm('S1'); openSpotlightEditForm('S2');
  ok(confirms.length === 0 && $('spForm-id').value === 'S2' && /焦點二/.test(txt()), '沒有改動時直接切到另一筆：不跳確認');
  $('spForm-subtitle').value = '改到一半'; answer = false; openSpotlightEditForm('S1');
  ok(confirms.length === 1 && /尚未儲存/.test(confirms[0]) && $('spForm-id').value === 'S2' && $('spForm-subtitle').value === '改到一半', '改到一半去編輯別筆：先問，取消則留在原處、內容還在');
  openSpotlightRelistForm('S1'); openSpotlightCreateForm(); cancelSpotlightEdit();
  ok(confirms.length === 4 && vis($('spAdminFormContainer')) && $('spForm-id').value === 'S2', '「再次上架」「新增」「取消」遇到未儲存內容都會先確認，取消則保留（共 4 次確認）');
  answer = true; cancelSpotlightEdit(); ok(!vis($('spAdminFormContainer')) && /新增焦點活動/.test(txt()), '確定放棄：表單關閉、回到新增模式');
  confirms.length = 0; openSpotlightEditForm('S1'); cancelSpotlightEdit(); ok(confirms.length === 0 && !vis($('spAdminFormContainer')), '剛開編輯、沒改內容就取消：不跳確認');
  confirms.length = 0; openSpotlightCreateForm(); $('spForm-title').value = '寫到一半'; openSpotlightEditForm('S1'); ok(confirms.length === 1, '新增模式寫到一半去編輯別筆：先確認');
  confirms.length = 0; closeSpotlightForm(); openSpotlightEditForm('S1'); spPendingUploadFile = { name: 'x.jpg', mimeType: 'image/jpeg', base64: 'AAAA' }; answer = false; cancelSpotlightEdit();
  ok(confirms.length === 1 && vis($('spAdminFormContainer')) && spFormDirty(), '選了新檔案（尚未上傳）也算未儲存內容');
  spPendingUploadFile = null; answer = true;

  // H. 安全
  reset(); state.spotlights[0].title = '<img src=x onerror=window.__sppwn=1>惡意'; openSpotlightEditForm('S1');
  ok(!window.__sppwn && !$('spFormModeBanner').querySelector('img') && $('spFormModeText').textContent.indexOf('<img') >= 0, '惡意標題：橫幅以純文字顯示，沒有注入元素');

  reset(); window.confirm = real.confirm; window.alert = real.alert; window.callBackend = real.cb; window.showToast = real.toast; window.getTodayDateStr = real.today;
  state.spotlights = saved.sp; state.adminPassword = saved.pwd; window.handleDataLoaded = realHandle;
  try { if (saved.ls1 === null) localStorage.removeItem('nobel_a_spotlights_list'); else localStorage.setItem('nobel_a_spotlights_list', saved.ls1); if (saved.ls2 === null) localStorage.removeItem('nobel_a_spotlight_custom'); else localStorage.setItem('nobel_a_spotlight_custom', saved.ls2); } catch (e) {}
  try { renderSpotlightSection(); renderAdminSpotlightsList(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
