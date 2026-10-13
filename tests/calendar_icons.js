// 日曆格子圖示測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：🥐 幸福廚房日、🎂 當月慶生日只看當天活動／菜單備註，不依賴有沒有菜單；🍱 有菜單且非週末才有；
// 以及實際畫出的月曆格子（用假資料：有活動沒菜單、有菜單沒活動、兩者都有、週末活動）。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { ev: state.events, mn: state.menus, y: state.viewYear, m: state.viewMonth, sel: state.selectedDateStr, lang: state.lang, tm: state.textMap, view: state.currentCalView };
  state.lang = 'zh-TW'; state.textMap = null;
  const ev = (date, title, major, minor) => ({ id: 'E' + date, date: date, title: title, categoryMajor: major || '', categoryMinor: minor || '', target: '全園' });
  const menu = (date, extra) => Object.assign({ date: date, lunchMain: '雞腿飯', afternoonSnack: '水果', note: '' }, extra || {});

  // A. 純函式
  const f = calendarDayIcons;
  ok(f([], null, false).join('') === '', '沒活動沒菜單：沒有圖示');
  ok(f([], menu('x'), false).join('') === '🍱', '只有菜單：🍱');
  ok(f([], menu('x'), true).join('') === '', '週末有菜單：不畫 🍱');
  ok(f([ev('x', '十一月份幸福廚房', '班級主題', '幸福廚房')], null, false).join('') === '🥐', '有幸福廚房活動、沒有菜單：仍顯示 🥐（本次修正）');
  ok(f([ev('x', '十一月壽星慶生', '全園活動', '慶生活動')], null, false).join('') === '🎂', '有慶生活動、沒有菜單：仍顯示 🎂（本次修正）');
  ok(f([ev('x', '十一月份幸福廚房', '班級主題', '幸福廚房')], menu('x'), false).join('') === '🍱🥐', '幸福廚房＋菜單：🍱🥐（順序）');
  ok(f([ev('x', '壽星慶生', '全園活動', '慶生活動'), ev('x', '幸福廚房', '班級主題', '幸福廚房')], menu('x'), false).join('') === '🍱🥐🎂', '兩者都有＋菜單：🍱🥐🎂（順序）');
  ok(f([ev('x', '幸福廚房', '班級主題', '幸福廚房')], null, true).join('') === '🥐', '週末的幸福廚房活動：仍顯示 🥐');
  ok(f([], menu('x', { note: '今日幸福廚房' }), false).join('') === '🍱🥐', '菜單備註含「幸福廚房」：🥐（原有規則保留）');
  ok(f([], menu('x', { afternoonSnack: '慶生蛋糕' }), false).join('') === '🍱🎂', '菜單點心含「慶生」：🎂（原有規則保留）');
  ok(f([ev('x', '本月壽星派對', '', '')], null, false).join('') === '🎂', '標題含「壽星」：🎂（原有規則保留）');
  ok(f([ev('x', '十一月手作課', '班級主題', '幸福廚房')], null, false).join('') === '🥐', '標題沒寫、只有細項是「幸福廚房」：🥐');
  ok(f([ev('x', '全園活動日', '幸福廚房', '')], null, false).join('') === '🥐', '標題沒寫、只有大項是「幸福廚房」：🥐');
  ok(f([ev('x', '全園活動日', '全園活動', '慶生活動')], null, false).join('') === '🎂', '標題沒寫、只有細項是「慶生活動」：🎂');
  ok(f([ev('x', '親師座談', '親職活動', '親師座談')], null, false).join('') === '', '無關活動：沒有圖示');
  ok(f(undefined, undefined, false).join('') === '', '缺資料不出錯');

  // B. 實際月曆格子（2026 年 11 月：11/2、11/3 幸福廚房、11/13 慶生、11/7 週六幸福廚房；11/4 有菜單＋幸福廚房；11/5 只有菜單）
  state.events = [ev('2026-11-02', '十一月份幸福廚房', '班級主題', '幸福廚房'), ev('2026-11-03', '十一月份幸福廚房', '班級主題', '幸福廚房'), ev('2026-11-04', '十一月份幸福廚房', '班級主題', '幸福廚房'), ev('2026-11-07', '週末幸福廚房', '班級主題', '幸福廚房'), ev('2026-11-13', '十一月壽星慶生', '全園活動', '慶生活動'), ev('2026-11-16', '親師座談', '親職活動', '親師座談')];
  state.menus = [menu('2026-11-04'), menu('2026-11-05')];
  state.viewYear = 2026; state.viewMonth = 11; state.selectedDateStr = '2026-11-20';
  renderCalendar();
  const cell = d => [...document.querySelectorAll('#calendarGrid > div')].find(c => { const sp = c.querySelector('div > span'); return sp && sp.textContent.trim() === String(d) && !c.className.includes('opacity-40'); });
  const icons = d => { const c = cell(d); return c ? [...c.querySelectorAll('.inline-flex > span')].map(x => x.textContent).join('') : null; };
  ok(!!cell(2), '月曆格子可找到（11/2）');
  ok(icons(2) === '🥐' && icons(3) === '🥐', '11/2、11/3：有幸福廚房活動、沒有菜單 → 🥐（原本整格沒有圖示）');
  ok(icons(4) === '🍱🥐', '11/4：有菜單＋幸福廚房 → 🍱🥐');
  ok(icons(5) === '🍱', '11/5：只有菜單 → 🍱');
  ok(icons(7) === '🥐', '11/7（週六）：週末幸福廚房 → 🥐、沒有 🍱');
  ok(icons(13) === '🎂', '11/13：慶生活動、沒有菜單 → 🎂（原本整格沒有圖示）');
  ok(icons(16) === '' || icons(16) === null || icons(16) === undefined, '11/16：無關活動 → 沒有圖示');
  ok(icons(10) === '' , '沒有任何事的日子：沒有圖示');

  state.events = saved.ev; state.menus = saved.mn; state.viewYear = saved.y; state.viewMonth = saved.m; state.selectedDateStr = saved.sel; state.lang = saved.lang; state.textMap = saved.tm; window.handleDataLoaded = realHandle;
  try { renderCalendar(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
