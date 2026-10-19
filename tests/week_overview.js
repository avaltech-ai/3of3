// 「本週生活與餐點總覽」只列有供餐的日子（2026-10-19）＋列印菜單表格寬度（瀏覽器測試）。需從中文介面開始、剛載入的頁面。
// 規則：有供餐的日子完整列出；沒供餐但有行事曆活動的日子（連假、幸福廚房…）精簡一行；沒供餐也沒活動的日子不列；整週都沒有就顯示一句提示。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(2500);
  const $ = id => document.getElementById(id);
  const saved = { lang: state.lang, events: state.events, menus: state.menus, sel: state.selectedDateStr };
  const menu = (d, extra) => Object.assign({ date: d, morningSnack: '饅頭', fruit: '香蕉', lunchStaple: '糙白米飯', lunchMain: '塔香豆腐', lunchSide1: '', lunchSide2: '', lunchSoup: '', afternoonSnack: '香菇玉米粥', note: '' }, extra || {});
  const ev = (d, title, end) => ({ id: 'T' + d + title, date: d, endDate: end || '', title, target: '全園活動', categoryMajor: '全園活動', categoryMinor: '', description: '', timeLocation: '' });
  const rowsOf = () => Array.from($('weekDaysList').children);
  const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

  // 這一週：10/18（日）～10/24（六）。週一～五有菜單（週三沒有、但沒有活動）、週五有活動、週六是連假（沒菜單）
  state.lang = 'zh-TW';
  state.menus = [menu('2026-10-19'), menu('2026-10-20'), menu('2026-10-22'), menu('2026-10-23')];
  state.events = [ev('2026-10-23', '牙齒塗氟日'), ev('2026-10-24', '光復節連假', '2026-10-26')];
  state.selectedDateStr = '2026-10-18';
  renderWeekView();
  let rows = rowsOf();
  ok(rows.length === 5, '本週只列 5 列：週一、週二、週四、週五有供餐＋週六連假一行（週日、沒菜單也沒活動的週三不列）：' + rows.length);
  ok(!/2026-10-18|2026-10-21/.test(txt($('weekDaysList'))), '沒供餐也沒活動的日子（10/18 週日、10/21 週三）不在清單裡');
  ok(!/未供餐|家庭日/.test(txt($('weekDaysList'))), '清單裡不再出現「未供餐/家庭日」');
  const full = rows.filter(r => /主食/.test(r.textContent));
  ok(full.length === 4 && full.every(r => /🍱/.test(r.textContent) && /糙白米飯/.test(r.textContent)), '有供餐的 4 天：完整列（日期方塊、午餐摘要）');
  ok(/牙齒塗氟日/.test(txt(full[3])), '有供餐又有活動的日子：活動標籤照常顯示');
  const compact = rows.filter(r => !/主食/.test(r.textContent));
  ok(compact.length === 1 && /2026-10-24/.test(compact[0].textContent) && /光復節連假/.test(compact[0].textContent) && !/🍱|主食/.test(compact[0].textContent), '沒供餐但有活動的 10/24：精簡一行（日期＋活動），沒有午餐方塊');
  ok(!!compact[0] && compact[0].getAttribute('onclick') === "onDateClicked('2026-10-24')", '精簡列也能點，點了跳到那一天');
  ok(rows.map(r => (r.textContent.match(/2026-10-\d\d/) || [''])[0]).join() === '2026-10-19,2026-10-20,2026-10-22,2026-10-23,2026-10-24', '列的順序：日期由前到後');
  ok(!/週日～週六/.test($('weekViewContainer').textContent) && /本週生活與餐點總覽/.test($('weekViewContainer').textContent), '標題不再寫「週日～週六」');

  // 選到的日子是連假那天：精簡列有「今天」底色（和完整列一致）
  state.selectedDateStr = '2026-10-24'; renderWeekView();
  rows = rowsOf(); ok(/bg-peach-50/.test(rows[rows.length - 1].className), '選到的日子（精簡列）有選取底色');

  // 補班的週六有菜單：照常完整列出
  state.menus.push(menu('2026-10-17')); state.selectedDateStr = '2026-10-18'; state.events = [];
  renderWeekView(); rows = rowsOf();
  ok(rows.length === 4 && !rows.some(r => /2026-10-17/.test(r.textContent)), '（對照）10/17 屬於上一週，不會跑進這一週');
  state.menus.push(menu('2026-10-24', { lunchStaple: '補班日白飯' })); renderWeekView(); rows = rowsOf();
  ok(rows.length === 5 && /補班日白飯/.test(rows[4].textContent) && /2026-10-24/.test(rows[4].textContent), '週六有菜單（例如補班日）：照常完整列出');

  // 整週都沒有菜單也沒有活動：一句提示
  state.menus = []; state.events = []; renderWeekView();
  ok(rowsOf().length === 1 && /本週沒有供餐，也沒有行事曆活動/.test(txt($('weekDaysList'))), '整週沒資料：顯示「本週沒有供餐，也沒有行事曆活動」');
  // 整週沒菜單但有活動（菜單還沒上傳的週）：只列有活動的日子，不是空白
  state.events = [ev('2026-11-03', '十一月份幸福廚房', '2026-11-04')]; state.selectedDateStr = '2026-11-03'; renderWeekView(); rows = rowsOf();
  ok(rows.length === 2 && rows.every(r => /幸福廚房/.test(r.textContent) && !/主食/.test(r.textContent)), '菜單還沒上傳的週：有活動的 2 天各一行精簡列');

  // 英文介面
  state.lang = 'en'; state.menus = [menu('2026-10-19')]; state.events = [ev('2026-10-24', 'Test Holiday')]; state.selectedDateStr = '2026-10-18'; renderWeekView(); rows = rowsOf();
  ok(rows.length === 2 && /Staple:/.test(rows[0].textContent) && /Sat/.test(rows[1].textContent) && !/未供餐|家庭日|No meals\/Family Day/.test(txt($('weekDaysList'))), '英文介面：完整列用 Staple:／精簡列用 Sat，沒有殘留中文或舊提示');
  state.menus = []; state.events = []; renderWeekView();
  ok(/No meals or calendar events this week/.test(txt($('weekDaysList'))), '英文介面：整週沒資料的提示為英文');
  ok(!/[一-鿿]/.test(txt($('weekDaysList'))), '英文介面：提示沒有中文');
  state.lang = 'zh-TW';

  // 列印菜單表格：寬度要比紙內寬度少一點，否則最右邊框線在 Safari 會被裁切（和幼小銜接的表格相同做法）
  let printRule = '';
  for (const sh of Array.from(document.styleSheets)) { try { for (const r of Array.from(sh.cssRules)) { if (r.media && /print/.test(r.media.mediaText)) for (const x of Array.from(r.cssRules)) { if (x.selectorText === '#printMenuArea table') printRule = x.style.width; } } } catch (e) {} }
  ok(/^calc\(100%\s*-\s*[\d.]+(px|mm)\)$/.test(printRule), '列印菜單表格寬度為 calc(100% - 1.5mm)（瀏覽器會換算成 px；不會被紙邊裁掉最右邊框）：' + printRule);

  Object.assign(state, { lang: saved.lang, events: saved.events, menus: saved.menus, selectedDateStr: saved.sel });
  const bad = res.filter(x => x.startsWith('✗'));
  console.log(res.join('\n') + '\n\n' + (res.length - bad.length) + ' 項通過，' + bad.length + ' 項失敗');
  return res.length - bad.length + ' pass / ' + bad.length + ' fail';
})();
