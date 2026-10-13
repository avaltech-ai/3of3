// 後台「主題活動」表單模式測試（瀏覽器）：新增／編輯既有／複製三種模式、更新前差異確認、另存為新主題活動、關閉彈窗的未儲存防呆。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { themes: state.themes, sems: state.themeSemesters, pwd: state.adminPassword };
  const real = { confirm: window.confirm, alert: window.alert, cb: window.callBackend, toast: window.showToast };
  const $ = id => document.getElementById(id);
  const toasts = [], alerts = [], cbs = [], confirms = []; let answer = true;
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.alert = m => { alerts.push(String(m)); };
  window.showToast = m => { toasts.push(String(m)); };
  window.callBackend = (a, p, okCb) => { cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true }); };
  state.adminPassword = 'tok'.repeat(15); state.themeSemesters = ['115 學年上學期', '115 學年下學期'];
  const S1 = '115 學年上學期';
  const mk = (id, week, name, extra) => Object.assign({ id: id, semester: S1, week: week, startDate: '2026-08-03', endDate: '2026-08-07', themeName: name, name: name, themeConcept: '概念' + id, concept: '概念' + id, goals: [{ activity: '活動' + id, course: '課程' + id }], photos: ['https://example.com/' + id + '.jpg'], results: ['https://example.com/' + id + '.jpg'] }, extra || {});
  const reset = () => { toasts.length = 0; alerts.length = 0; cbs.length = 0; confirms.length = 0; answer = true; state.themes = [mk('T1', '第一週', '我的班級新生活'), mk('T2', '第二週', '書的奇幻旅程', { startDate: '2026-08-10', endDate: '2026-08-14' })]; closeThemeModalNow(); };
  const cls = (el, c) => el.className.split(/\s+/).indexOf(c) >= 0;
  const txt = () => $('themeFormModeText').textContent;
  const vis = el => !el.classList.contains('hidden');
  const open = () => !$('themeModal').classList.contains('hidden');
  const saveCall = () => cbs.filter(c => c.a === 'saveTheme')[0];
  reset();

  // A. 新增
  openThemeModal();
  ok(open() && /新增主題活動：儲存後會建立一筆新的/.test(txt()) && cls($('themeModalBox'), 'border-emerald-200') && $('btnSaveTheme').textContent.trim() === '➕ 新增這筆主題活動' && !vis($('btnSaveThemeAsNew')), '新增模式：綠色橫幅、按鈕「➕ 新增這筆主題活動」、沒有「另存為新」');

  // B. 編輯
  closeThemeModalNow(); editTheme('T1');
  ok(/正在編輯既有主題活動「我的班級新生活」/.test(txt()) && /會修改這筆原本的內容/.test(txt()) && cls($('themeModalBox'), 'border-amber-400') && !cls($('themeModalBox'), 'border-emerald-200'), '編輯模式：橘色橫幅「正在編輯既有主題活動「我的班級新生活」…」、彈窗橘框');
  ok($('btnSaveTheme').textContent.trim() === '💾 更新原主題活動' && vis($('btnSaveThemeAsNew')) && cls($('btnSaveTheme'), 'bg-amber-500') && !cls($('btnSaveTheme'), 'bg-rose-500') && $('modalThemeId').value === 'T1' && $('modalThemeName').value === '我的班級新生活', '編輯模式：「💾 更新原主題活動」＋「➕ 另存為新主題活動」，帶入原內容與編號');

  // C. 沒有變更
  saveThemeData(); ok(cbs.length === 0 && confirms.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]) && open(), '沒改任何東西就更新：提示「沒有任何變更」，不確認、不送出、彈窗維持開著');

  // D. 有變更
  $('modalThemeName').value = '新生活（改）'; $('modalThemeWeek').value = '第 1 週'; $('modalThemeEndDate').value = '2026-08-08'; $('modalThemeConcept').value = '全新概念'.repeat(10);
  document.querySelector('.theme-goal-row .goal-activity').value = '改過的活動目標';
  answer = false; saveThemeData();
  ok(confirms.length === 1 && /即將修改原主題活動「我的班級新生活」/.test(confirms[0]) && /週別：第一週 → 第 1 週/.test(confirms[0]) && /主題名稱：我的班級新生活 → 新生活（改）/.test(confirms[0]) && /截止日：2026-08-07 → 2026-08-08/.test(confirms[0]), '更新前列出差異（週別、主題名稱、截止日）');
  ok(/主題概念：（原內容） → （已修改）/.test(confirms[0]) && /活動目標與課程目標：（原內容） → （已修改）/.test(confirms[0]) && /另存為新主題活動/.test(confirms[0]), '概念與目標列只寫「（已修改）」，並提醒可改按「另存為新主題活動」');
  ok(cbs.length === 0 && open() && state.themes[0].themeName === '我的班級新生活' && $('modalThemeName').value === '新生活（改）' && /正在編輯/.test(txt()), '按取消：沒送出、原主題不變、彈窗與內容、編輯模式保留');
  answer = true; saveThemeData();
  ok(!!saveCall() && saveCall().p.data.id === 'T1' && state.themes.length === 2 && state.themes.find(x => x.id === 'T1').themeName === '新生活（改）' && state.themes.find(x => x.id === 'T1').goals[0].activity === '改過的活動目標', '確定更新：以原編號 T1 送出，主題數不變、內容已更新');
  ok(/已更新原主題活動「新生活（改）」/.test(toasts.join('|')) && !open() && confirms.length === 2, '提示「已更新原主題活動」、彈窗關閉，儲存後關閉不會多問「放棄嗎」');

  // E. 另存為新
  reset(); editTheme('T1'); $('modalThemeName').value = '另存的主題'; $('modalThemeWeek').value = '第三週';
  saveThemeData(true);
  ok(confirms.length === 0 && !!saveCall() && saveCall().p.data.id !== 'T1' && state.themes.length === 3, '另存為新：不跳確認、用新編號送出、主題數 +1');
  ok(state.themes.find(x => x.id === 'T1').themeName === '我的班級新生活' && state.themes.find(x => x.id === 'T1').week === '第一週', '原主題 T1 完全沒被改動');
  const nt = state.themes.find(x => x.id === saveCall().p.data.id);
  ok(nt.themeName === '另存的主題' && nt.week === '第三週' && nt.goals.length === 1 && nt.goals[0].activity === '活動T1' && /已新增主題活動「另存的主題」/.test(toasts.join('|')), '新主題是修改後的內容（含目標），提示「已新增主題活動」');

  // F. 複製
  reset(); copyThemeInAdmin('T1');
  ok(open() && /以「我的班級新生活」為範本新增/.test(txt()) && /原主題活動不會改變/.test(txt()) && cls($('themeModalBox'), 'border-sky-300') && $('btnSaveTheme').textContent.trim() === '➕ 新增這筆主題活動' && !vis($('btnSaveThemeAsNew')), '複製：藍色橫幅「原主題活動不會改變，請先填好新的週別與日期」、只有一顆「新增這筆主題活動」');
  ok($('modalThemeId').value === '' && $('modalThemeWeek').value === '' && $('modalThemeStartDate').value === '' && $('modalThemeEndDate').value === '' && $('modalThemeResults').value === '' && $('modalThemeName').value === '我的班級新生活' && $('modalThemeConcept').value === '概念T1' && document.querySelector('.theme-goal-row .goal-activity').value === '活動T1', '複製：沒有編號、週別與日期與成果照片清空，學期、主題名稱、概念、目標保留');
  ok($('modalThemeTitle').textContent === '複製主題活動', '彈窗標題「複製主題活動」');
  saveThemeData(); ok(cbs.length === 0 && alerts.length === 1 && /必填/.test(alerts[0]), '複製後沒填週別就存：擋下並提示必填');
  $('modalThemeWeek').value = '第九週'; $('modalThemeStartDate').value = '2026-10-19'; saveThemeData();
  ok(confirms.length === 0 && !!saveCall() && saveCall().p.data.id !== 'T1' && state.themes.length === 3 && state.themes.find(x => x.id === 'T1').week === '第一週' && saveCall().p.data.week === '第九週' && saveCall().p.data.photos.length === 0 && /已新增主題活動/.test(toasts.join('|')), '填好後存檔：新的一筆、原主題 T1 不變、成果照片是空的、提示「已新增主題活動」');

  // G. 防呆
  reset(); editTheme('T1'); confirms.length = 0; closeThemeModal();
  ok(confirms.length === 0 && !open(), '剛開編輯、沒改內容就關閉（✕／取消／點背景都走同一個函式）：不跳確認');
  editTheme('T1'); $('modalThemeConcept').value = '改到一半'; answer = false; closeThemeModal();
  ok(confirms.length === 1 && /尚未儲存/.test(confirms[0]) && open() && $('modalThemeConcept').value === '改到一半', '改到一半按關閉：先問，取消則彈窗與內容都保留');
  answer = true; closeThemeModal(); ok(!open(), '確定放棄：彈窗關閉');
  openThemeModal(); $('modalThemeName').value = '新增寫到一半'; answer = false; closeThemeModal(); ok(open() && $('modalThemeName').value === '新增寫到一半', '新增模式寫到一半按關閉：同樣先確認');
  confirms.length = 0; answer = false; copyThemeInAdmin('T2'); ok(confirms.length === 1 && $('modalThemeName').value === '新增寫到一半', '彈窗開著且有未儲存內容時按「複製」：先確認');
  answer = true; closeThemeModalNow();

  // H. 安全
  reset(); state.themes[0].themeName = '<img src=x onerror=window.__thpwn=1>惡意'; state.themes[0].name = state.themes[0].themeName; editTheme('T1');
  ok(!window.__thpwn && !$('themeFormModeBanner').querySelector('img') && $('themeFormModeText').textContent.indexOf('<img') >= 0, '惡意主題名稱：橫幅以純文字顯示，沒有注入元素');
  renderAdminThemesList(); ok(!document.querySelector('#adminThemesListBody img[src="x"]') && [...document.querySelectorAll('#adminThemesListBody tr')].every(r => r.querySelectorAll('button').length === 3), '後台主題列表每一列有 3 顆鈕（編輯、複製、刪除），惡意名稱不注入元素');

  reset(); window.confirm = real.confirm; window.alert = real.alert; window.callBackend = real.cb; window.showToast = real.toast;
  state.themes = saved.themes; state.themeSemesters = saved.sems; state.adminPassword = saved.pwd; window.handleDataLoaded = realHandle;
  try { renderAdminThemesList(); renderThemes(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
