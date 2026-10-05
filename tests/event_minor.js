// 活動「細項」小標籤測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 規則：每日詳情卡片與全月總覽的活動標題旁顯示「細項」（不顯示大項）；沒有細項就不顯示；英文介面走名稱對照表；惡意字串被跳脫。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const lang0 = state.lang, events0 = state.events, nm0 = state.nameMap;

  state.lang = 'zh';
  state.events = [
    { id: 'E1', date: '2026-10-07', title: '八月壽星慶生', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '慶生活動', timeLocation: '10:00' },
    { id: 'E2', date: '2026-10-07', title: '無細項活動', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '' },
    { id: 'E3', date: '2026-10-07', title: '空白細項', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '   ' },
    { id: 'E4', date: '2026-10-07', title: '壞字串', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '"><img src=x onerror=__x()>' },
    { id: 'E5', date: '2026-10-07', title: '舊欄位名稱', target: '全園活動', categoryMajor: '全園活動', '活動類別 (細項)': '親師座談' }
  ];
  try { setNameMap({}); } catch (e) {}
  renderSelectedDayDetails('2026-10-07');
  const list = document.getElementById('selectedDayEventsList');
  const cardOf = t => [...list.querySelectorAll('h5')].find(h => h.textContent.includes(t));
  const minors = h => h ? [...h.querySelectorAll('.event-minor')].map(x => x.textContent) : null;
  ok(JSON.stringify(minors(cardOf('八月壽星慶生'))) === '["慶生活動"]', '每日詳情：標題旁顯示細項「慶生活動」');
  ok(minors(cardOf('八月壽星慶生')).join().indexOf('全園活動') === -1, '不顯示大項（全園活動）');
  ok(minors(cardOf('無細項活動')).length === 0, '細項為空：不顯示');
  ok(minors(cardOf('空白細項')).length === 0, '細項只有空白：不顯示');
  ok(JSON.stringify(minors(cardOf('舊欄位名稱'))) === '["親師座談"]', '相容舊欄位名稱「活動類別 (細項)」');
  ok(list.querySelectorAll('img[onerror]').length === 0 && cardOf('壞字串').querySelectorAll('.event-minor img').length === 0, '惡意細項字串被跳脫，不會注入元素');
  ok(cardOf('壞字串').querySelector('.event-minor').textContent.indexOf('<img') >= 0, '惡意字串以純文字顯示');

  // 全月總覽
  state.viewYear = 2026; state.viewMonth = 10;
  renderMonthView();
  const tl = document.getElementById('monthEventsTimeline');
  const rowOf = t => [...tl.querySelectorAll('span.text-xs.font-bold')].find(x => x.textContent === t);
  const rowMinor = t => { const r = rowOf(t); return r ? [...r.parentElement.querySelectorAll('.event-minor')].map(x => x.textContent) : null; };
  ok(JSON.stringify(rowMinor('八月壽星慶生')) === '["慶生活動"]', '全月總覽：標題旁顯示細項');
  ok(rowMinor('無細項活動').length === 0, '全月總覽：沒有細項不顯示');

  // 英文介面：走名稱對照表，查不到顯示中文
  state.lang = 'en';
  try { setNameMap({ '慶生活動': 'Birthday Celebration' }); } catch (e) {}
  renderSelectedDayDetails('2026-10-07');
  ok(JSON.stringify(minors(cardOf('八月壽星慶生'))) === '["Birthday Celebration"]', '英文介面：細項顯示對照表的英文');
  ok(JSON.stringify(minors(cardOf('舊欄位名稱'))) === '["親師座談"]', '英文介面且對照表沒有這個名稱：退回中文');

  state.lang = lang0; state.events = events0; state.nameMap = nm0; try { setNameMap(nm0 || {}); } catch (e) {}
  window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
