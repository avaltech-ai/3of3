// 後台「新增／編輯行事曆活動」表單模式測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：新增／編輯既有／以舊活動為範本新增 三種模式的橫幅、顏色與按鈕；更新原活動前列出修改的欄位並確認、沒有變更就不送出；
// 「另存為新活動」保留原活動；「複製」清空日期且存成新的一筆；未儲存內容的切換防呆；列表標示編輯中；惡意標題以純文字顯示。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { events: state.events, pwd: state.adminPassword, ls: (function () { try { return localStorage.getItem('nobel_a_events_custom'); } catch (e) { return null; } })() };
  const realConfirm = window.confirm, realCB = window.callBackend, realToast = window.showToast, realLoad = window.loadAppData, realScroll = window.scrollTo;
  const $ = id => document.getElementById(id);
  const toasts = [], cbs = [], confirms = []; let confirmAnswer = true;
  window.confirm = m => { confirms.push(String(m)); return confirmAnswer; };
  window.showToast = (m, i) => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  window.scrollTo = function () {};
  window.callBackend = (a, p, okCb) => { cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true }); };
  state.adminPassword = 'tok'.repeat(15);
  const mk = (id, date, title, extra) => Object.assign({ id: id, date: date, endDate: '', title: title, calendarPrompt: '提示' + id, target: '諾貝爾 A,諾貝爾 B', categoryMajor: '班級主題', categoryMinor: '幸福廚房', timeLocation: '10:00', description: '原本的說明' + id, theme: 'T-' + id }, extra || {});
  const reset = () => { toasts.length = 0; cbs.length = 0; confirms.length = 0; confirmAnswer = true; state.events = [mk('E1', '2026-10-07', '十月份幸福廚房'), mk('E2', '2026-10-08', '十月壽星慶生會', { categoryMajor: '全園活動', categoryMinor: '慶生活動' })]; clearEventForm(); };
  const cls = (el, c) => el.className.split(/\s+/).indexOf(c) >= 0;
  const banner = () => $('eventFormModeText').textContent;
  const vis = el => !el.classList.contains('hidden');
  const rowsT = () => [...document.querySelectorAll('#adminEventsTableContainer tbody tr')];
  const fillNew = (title, date) => { $('eventForm-title').value = title; $('eventForm-date').value = date; setCheckedValues('eventForm-target', '諾貝爾 A'); const s = $('eventForm-categoryMajor'); s.value = '班級主題'; if (s.value !== '班級主題') { s.value = s.options[1] && s.options[1].value; } };

  reset(); renderEventOptionsUI();

  // A. 初始：新增模式
  ok(/新增活動/.test(banner()) && cls($('eventFormCard'), 'border-emerald-200') && $('saveEventBtn').textContent.trim() === '➕ 新增這筆活動', '新增模式：綠色橫幅「新增活動：儲存後會建立一筆新活動」、卡片綠框、按鈕「➕ 新增這筆活動」');
  ok(!vis($('saveEventAsNewBtn')) && !vis($('eventFormCancelEditBtn')), '新增模式沒有「另存為新活動」與「取消編輯」');

  // B. 編輯既有
  editEventInAdmin('E1');
  ok(/正在編輯既有活動/.test(banner()) && banner().indexOf('十月份幸福廚房') >= 0 && banner().indexOf('2026-10-07') >= 0 && /修改這筆原本的內容/.test(banner()), '編輯模式橫幅：「正在編輯既有活動「十月份幸福廚房」（2026-10-07）…會修改這筆原本的內容」');
  ok(cls($('eventFormCard'), 'border-amber-400') && !cls($('eventFormCard'), 'border-emerald-200') && cls($('saveEventBtn'), 'bg-amber-500') && !cls($('saveEventBtn'), 'bg-emerald-500'), '編輯模式：卡片與按鈕變橘色、綠色移除');
  ok($('saveEventBtn').textContent.trim() === '💾 更新原活動' && vis($('saveEventAsNewBtn')) && vis($('eventFormCancelEditBtn')) && $('saveEventAsNewBtn').textContent.indexOf('另存為新活動') >= 0, '編輯模式：「💾 更新原活動」＋「➕ 另存為新活動」＋「取消編輯」');
  ok($('eventForm-id').value === 'E1' && $('eventForm-title').value === '十月份幸福廚房' && $('eventForm-date').value === '2026-10-07', '表單帶入原活動內容與編號');
  const rows = rowsT(); ok(rows.length === 2 && cls(rows[0], 'bg-amber-50') !== cls(rows[1], 'bg-amber-50'), '列表：只有一筆被標示為編輯中（橘底）');
  ok(rowsT().filter(r => /十月份幸福廚房/.test(r.textContent))[0].className.indexOf('bg-amber-50') >= 0, '被標示的就是 E1（十月份幸福廚房）');
  ok(rowsT().every(r => [...r.querySelectorAll('button')].map(b => b.textContent.trim()).join() === '編輯,複製,刪除'), '列表每一筆的操作：編輯、複製、刪除');

  // C. 沒有變更
  handleSaveEvent(null); ok(cbs.length === 0 && confirms.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]) && state.events[0].title === '十月份幸福廚房', '編輯後沒改任何東西就按「更新原活動」：提示「沒有任何變更」，不確認、不送出');

  // D. 有變更：確認差異
  $('eventForm-title').value = '十月份幸福廚房（改）'; $('eventForm-date').value = '2026-10-14'; $('eventForm-description').value = '全新的長說明'.repeat(20);
  confirmAnswer = false; handleSaveEvent(null);
  ok(confirms.length === 1 && /即將修改原活動「十月份幸福廚房」/.test(confirms[0]) && /日期：2026-10-07 → 2026-10-14/.test(confirms[0]) && /活動名稱：十月份幸福廚房 → 十月份幸福廚房（改）/.test(confirms[0]), '更新前列出差異：日期 2026-10-07 → 2026-10-14、活動名稱 舊 → 新');
  ok(/詳細說明：（原內容） → （已修改）/.test(confirms[0]) && confirms[0].indexOf('全新的長說明') < 0, '長說明只顯示「（原內容）→（已修改）」，不把整段貼進確認視窗');
  ok(/另存為新活動/.test(confirms[0]) && /取消/.test(confirms[0]), '確認文字提醒：想保留原活動請取消後改按「另存為新活動」');
  ok(cbs.length === 0 && state.events[0].title === '十月份幸福廚房' && state.events[0].date === '2026-10-07' && $('eventForm-id').value === 'E1' && $('eventForm-title').value === '十月份幸福廚房（改）' && /正在編輯/.test(banner()), '按「取消」：沒送出、原活動不變、表單內容與編輯模式都保留（可改按另存為新活動）');
  confirmAnswer = true; handleSaveEvent(null);
  ok(cbs.length === 1 && cbs[0].a === 'saveEvent' && cbs[0].p.data.id === 'E1' && state.events.length === 2 && state.events[0].title === '十月份幸福廚房（改）' && state.events[0].date === '2026-10-14', '確定更新：以原編號 E1 送出，活動數不變、內容已更新');
  ok(cbs[0].p.data.theme === 'T-E1', '更新時沿用原活動的主題欄位');
  ok(/已更新原活動「十月份幸福廚房（改）」/.test(toasts[toasts.length - 1]), '提示明確寫「已更新原活動「…」」');
  ok(/新增活動/.test(banner()) && $('eventForm-id').value === '' && $('eventForm-title').value === '' && cls($('eventFormCard'), 'border-emerald-200'), '儲存後回到新增模式、表單清空');

  // E. 另存為新活動
  reset(); editEventInAdmin('E1'); $('eventForm-title').value = '十月份幸福廚房（另存）'; $('eventForm-date').value = '2026-10-21';
  handleSaveEvent(null, true);
  ok(confirms.length === 0 && cbs.length === 1 && cbs[0].p.data.id !== 'E1' && /^EV-/.test(cbs[0].p.data.id) && state.events.length === 3, '另存為新活動：不跳確認、用新編號 EV-… 送出、活動數 +1');
  ok(state.events.find(x => x.id === 'E1').title === '十月份幸福廚房' && state.events.find(x => x.id === 'E1').date === '2026-10-07', '原活動 E1 完全沒有被改動');
  ok(state.events.find(x => x.id === cbs[0].p.data.id).title === '十月份幸福廚房（另存）' && cbs[0].p.data.theme === 'T-E1', '新活動是修改後的內容，並沿用來源活動的主題欄位');
  ok(/已新增活動「十月份幸福廚房（另存）」/.test(toasts[toasts.length - 1]) && /新增活動/.test(banner()), '提示「已新增活動」，回到新增模式');

  // F. 複製
  reset(); copyEventInAdmin('E1');
  ok(/以 「十月份幸福廚房」（2026-10-07） 為範本新增/.test(banner()) && /原活動不會改變/.test(banner()) && /新的日期/.test(banner()), '複製模式橫幅：「以「十月份幸福廚房」（2026-10-07）為範本新增：原活動不會改變，請先選好新的日期」');
  ok(cls($('eventFormCard'), 'border-sky-300') && cls($('saveEventBtn'), 'bg-sky-500') && $('saveEventBtn').textContent.trim() === '➕ 新增這筆活動' && !vis($('saveEventAsNewBtn')) && vis($('eventFormCancelEditBtn')), '複製模式：藍色、只有一顆「➕ 新增這筆活動」、有「取消編輯」');
  ok($('eventForm-id').value === '' && $('eventForm-date').value === '' && $('eventForm-endDate').value === '' && $('eventForm-title').value === '十月份幸福廚房' && $('eventForm-description').value === '原本的說明E1' && getCheckedValues('eventForm-target').indexOf('諾貝爾 A') >= 0, '複製：沒有編號、日期與結束日期清空，其他內容（標題、說明、對象）保留');
  ok(rowsT().every(r => r.className.indexOf('bg-amber-50') < 0), '複製模式：列表沒有任何「編輯中」標示（因為沒有在改任何一筆）');
  handleSaveEvent(null); ok(cbs.length === 0 && /請填寫必填欄位/.test(toasts[toasts.length - 1]), '複製後沒選日期就存：擋下並提示必填');
  $('eventForm-date').value = '2026-10-28'; handleSaveEvent(null);
  ok(confirms.length === 0 && cbs.length === 1 && /^EV-/.test(cbs[0].p.data.id) && state.events.length === 3 && cbs[0].p.data.date === '2026-10-28' && cbs[0].p.data.theme === 'T-E1', '選好日期後存檔：新編號、活動數 +1，沿用來源的主題欄位');
  ok(state.events.find(x => x.id === 'E1').date === '2026-10-07' && state.events.find(x => x.id === 'E1').title === '十月份幸福廚房', '原活動 E1 仍是原樣');
  ok(/已新增活動/.test(toasts[toasts.length - 1]), '提示「已新增活動」');

  // G. 防呆：未儲存內容
  reset(); editEventInAdmin('E1'); editEventInAdmin('E2');
  ok(confirms.length === 0 && $('eventForm-id').value === 'E2' && /十月壽星慶生會/.test(banner()), '沒有改動時，直接切到另一筆編輯：不跳確認');
  $('eventForm-title').value = '改到一半'; confirmAnswer = false; editEventInAdmin('E1');
  ok(confirms.length === 1 && /尚未儲存/.test(confirms[0]) && $('eventForm-id').value === 'E2' && $('eventForm-title').value === '改到一半', '改到一半去編輯別筆：先問「尚未儲存的內容，確定放棄？」，按取消留在原處、內容還在');
  confirmAnswer = true; editEventInAdmin('E1'); ok($('eventForm-id').value === 'E1' && $('eventForm-title').value === '十月份幸福廚房', '按確定才切換');
  $('eventForm-title').value = '又改了'; confirmAnswer = false; clearEventFormGuarded(); ok(confirms.length === 3 && $('eventForm-title').value === '又改了' && $('eventForm-id').value === 'E1', '「清空表單」：有未儲存內容時先確認，取消則保留');
  cancelEventEdit(); ok(confirms.length === 4 && $('eventForm-id').value === 'E1', '「取消編輯」：有未儲存內容時同樣先確認');
  confirmAnswer = true; cancelEventEdit(); ok($('eventForm-id').value === '' && /新增活動/.test(banner()) && rowsT().every(r => r.className.indexOf('bg-amber-50') < 0), '確定取消編輯：回到新增模式、清空、列表不再標示');
  confirms.length = 0; $('eventForm-title').value = '新增到一半'; copyEventInAdmin('E2'); ok(confirms.length === 1, '新增模式寫到一半按別筆的「複製」：先確認');
  confirms.length = 0; editEventInAdmin('E1'); clearEventFormGuarded(); ok(confirms.length === 0 && /新增活動/.test(banner()), '剛按編輯、沒改內容就清空：不跳確認');
  confirms.length = 0; copyEventInAdmin('E1'); editEventInAdmin('E2'); ok(confirms.length === 0 && $('eventForm-id').value === 'E2', '剛複製、沒改內容就去編輯別筆：不跳確認（複製帶入的內容不算未儲存）');

  // H. 新增模式
  reset(); fillNew('全新活動', '2026-11-02'); handleSaveEvent(null);
  ok(confirms.length === 0 && cbs.length === 1 && /^EV-/.test(cbs[0].p.data.id) && state.events.length === 3 && /已新增活動「全新活動」/.test(toasts[toasts.length - 1]), '新增模式存檔：不跳確認、新編號、提示「已新增活動「全新活動」」');
  reset(); fillNew('新增模式的另存', '2026-11-03'); handleSaveEvent(null, true); ok(cbs.length === 1 && /^EV-/.test(cbs[0].p.data.id) && state.events.length === 3, '在新增模式呼叫另存為新活動：也是新的一筆，不出錯');

  // I. 安全與長文字
  reset(); state.events[0].title = '<img src=x onerror=window.__efpwn=1>惡意標題'; renderAdminEventsTable(); editEventInAdmin('E1');
  ok(!window.__efpwn && !$('eventFormModeBanner').querySelector('img') && $('eventFormModeText').textContent.indexOf('<img') >= 0, '惡意標題：橫幅以純文字顯示，沒有注入元素');
  ok(!document.querySelector('#adminEventsTableContainer img[src="x"]') && !window.__efpwn, '惡意標題：列表也以純文字顯示');
  $('eventForm-title').value = 'x'.repeat(100); confirmAnswer = false; handleSaveEvent(null); ok(/…/.test(confirms[confirms.length - 1]) && confirms[confirms.length - 1].indexOf('x'.repeat(60)) < 0, '很長的標題在確認視窗中會截短加「…」');

  // J. 還原
  reset(); window.confirm = realConfirm; window.callBackend = realCB; window.showToast = realToast; window.loadAppData = realLoad; window.scrollTo = realScroll;
  state.events = saved.events; state.adminPassword = saved.pwd; window.handleDataLoaded = realHandle;
  try { if (saved.ls === null) localStorage.removeItem('nobel_a_events_custom'); else localStorage.setItem('nobel_a_events_custom', saved.ls); } catch (e) {}
  try { renderAdminEventsTable(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
