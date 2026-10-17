// 首頁「今天／明天」小卡、後台待辦提醒、手機版標題不換行、「今天」按鈕回到真正的今天（瀏覽器）。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const startLang = state.lang; if (state.lang === 'en') { toggleLanguage(); await wait(300); }
  const saved = { ev: state.events, me: state.menus, sp: state.spotlights, pwd: state.adminPassword, tm: state.textMap, st: (typeof mapAdmin !== 'undefined') ? mapAdmin.status : null, sel: state.selectedDateStr, vy: state.viewYear, vm: state.viewMonth };
  const real = { plan: window.todayCardPlan, today: window.getTodayDateStr, sub: window.switchAdminSubtab };
  const $ = id => document.getElementById(id);
  const panels = () => [...document.querySelectorAll('#todayCard .today-panel')];
  const usePlan = (now) => { window.todayCardPlan = (d, ev) => real.plan(now, ev); };
  const at = (s, h) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], h, 0, 0); };
  state.events = [
    { id: 'e1', date: '2026-10-21', title: '牙齒塗氟日', calendarPrompt: '牙齒塗氟', timeLocation: '08:30 教室', target: '諾貝爾 A', categoryMajor: '重要活動' },
    { id: 'e2', date: '2026-10-22', title: '十月份幸福廚房', target: '諾貝爾 A', categoryMajor: '班級主題', categoryMinor: '幸福廚房' },
    { id: 'e3', date: '2026-10-26', title: '補假', categoryMajor: '節慶放假' },
    { id: 'e4', date: '2026-10-27', title: '<img src=x onerror=window.__tcpwn=1>惡意活動', calendarPrompt: '<b id=tc-b>x</b>', target: '全園' }
  ];
  state.menus = [
    { date: '2026-10-21', morningSnack: '饅頭', fruit: '香蕉', lunchStaple: '糙米飯', lunchMain: '滷雞腿', lunchSide1: '青菜', lunchSoup: '湯', afternoonSnack: '綠豆湯' },
    { date: '2026-10-27', lunchMain: '<img src=x onerror=window.__tcpwn2=1>' }
  ];

  // A. 平日白天
  usePlan(at('2026-10-21', 10)); renderTodayCard();
  ok(!$('todayCard').classList.contains('hidden') && panels().length === 2 && $('todayCard').parentElement.id === 'tabContent-home' && $('todayCard').nextElementSibling.id === 'spotlightContainer', '小卡在首頁最上方（焦點活動之前），兩格');
  ok(panels()[0].getAttribute('data-date') === '2026-10-21' && /今天/.test(panels()[0].querySelector('.today-label').textContent) && /10\/21（三）/.test(panels()[0].textContent) && panels()[1].getAttribute('data-date') === '2026-10-22' && /明天/.test(panels()[1].querySelector('.today-label').textContent), '平日白天：今天在前（10/21（三））、明天在後');
  ok(/border-peach-300/.test(panels()[0].className) && !/border-peach-300/.test(panels()[1].className), '前面那格是醒目的主卡');
  const p0 = panels()[0];
  ok(/🔔 牙齒塗氟/.test(p0.querySelector('.today-prompt').textContent) && /牙齒塗氟日/.test(p0.querySelector('.today-event').textContent) && /08:30 教室/.test(p0.textContent), '活動：行事曆提示放在最醒目處、活動名稱、時間地點');
  ok(/🍱 午餐：糙米飯・滷雞腿/.test(p0.querySelector('.today-menu').textContent) && /🍪 點心：早點 饅頭／水果 香蕉／午點 綠豆湯/.test(p0.querySelector('.today-menu').textContent), '午餐（主食・主菜）與點心（早點／水果／午點）');
  ok(/🥐 幸福廚房/.test(panels()[1].textContent) && /🍱 菜單尚未公布/.test(panels()[1].textContent), '明天：幸福廚房圖示；上課日沒有菜單 → 「菜單尚未公布」');

  // B. 晚上 6 點、週五晚上、週末
  usePlan(at('2026-10-21', 18)); renderTodayCard();
  ok(panels()[0].getAttribute('data-date') === '2026-10-22' && /明天/.test(panels()[0].querySelector('.today-label').textContent) && /border-peach-300/.test(panels()[0].className), '晚上 6 點：明天放前面並成為主卡');
  usePlan(at('2026-10-23', 20)); renderTodayCard();
  ok(panels()[0].getAttribute('data-date') === '2026-10-27' && /下一個上課日/.test(panels()[0].querySelector('.today-label').textContent) && /10\/27（二）/.test(panels()[0].textContent), '週五晚上：「下一個上課日」是 10/27（二）（跳過週末與 10/26 補假）');
  ok(!window.__tcpwn && !window.__tcpwn2 && !$('tc-b') && !document.querySelector('#todayCard img[src="x"]') && /<img src=x/.test(panels()[0].textContent), '惡意活動名稱、提示、菜單：以純文字顯示，沒有注入元素');
  usePlan(at('2026-10-24', 9)); renderTodayCard();
  ok(panels()[0].getAttribute('data-date') === '2026-10-27' && panels()[1].getAttribute('data-date') === '2026-10-24' && /放假在家/.test(panels()[1].textContent) && !/菜單尚未公布/.test(panels()[1].textContent), '週六：下一個上課日在前；今天顯示「放假在家」，不顯示菜單尚未公布');

  // C. 看詳細內容
  usePlan(at('2026-10-21', 10)); renderTodayCard();
  panels()[1].querySelector('.today-more').click();
  ok(state.selectedDateStr === '2026-10-22' && state.viewMonth === 10 && /22/.test($('selectedDateHeader').textContent), '按「看詳細內容」：月曆選到那一天並顯示當日詳情');

  // D. 英文
  state.textMap = Object.assign({}, state.textMap || {}, { '牙齒塗氟日': 'Fluoride day' });
  toggleLanguage(); await wait(200); usePlan(at('2026-10-21', 10)); renderTodayCard();
  ok(/Today/.test(panels()[0].querySelector('.today-label').textContent) && /Wed 10\/21/.test(panels()[0].textContent) && /Fluoride day/.test(panels()[0].textContent) && /Lunch/.test(panels()[0].textContent) && /Happy Kitchen/.test(panels()[1].textContent) && /See details/.test(panels()[0].textContent), '英文介面：標籤、日期、午餐、圖示說明是英文；活動走英文對照');
  toggleLanguage(); await wait(200);

  // E. 後台待辦提醒
  state.adminPassword = 'tok'.repeat(15);
  window.getTodayDateStr = () => '2026-10-20';
  state.spotlights = [{ title: '快結束的焦點', startDate: '2026-10-01', endDate: '2026-10-22', status: '啟用' }];
  if (typeof mapAdmin !== 'undefined') mapAdmin.status = { text: { pendingNew: 3 }, name: { pendingNew: 1 } };
  renderAdminReminders();
  const kinds = [...document.querySelectorAll('#adminReminders .admin-reminder')].map(r => r.getAttribute('data-kind')).join();
  ok(kinds === 'menu,text,spotEnding,nextMonth' && /待辦提醒（4）/.test($('adminReminders').textContent), '待辦提醒：菜單快沒了、英文對照 4 筆新文字、焦點快下架、下個月行事曆是空的');
  ok(/4 筆新文字/.test($('adminReminders').textContent) && /「快結束的焦點」10\/22/.test($('adminReminders').textContent), '提醒內容：筆數、焦點活動名稱與下架日');
  let went = ''; window.switchAdminSubtab = s => { went = s; };
  document.querySelector('#adminReminders .admin-reminder[data-kind="menu"] button').click(); ok(went === 'menu', '按「前往每日菜單」：切到菜單子面板');
  window.switchAdminSubtab = real.sub;
  const menus14 = []; for (let i = 0; i < 14; i++) menus14.push({ date: ymdAdd('2026-10-20', i), lunchMain: 'x' });
  state.menus = menus14; state.events = state.events.concat([{ date: '2026-11-05', title: '下個月的活動' }]); state.spotlights = [{ title: 'ok', startDate: '2026-10-01', endDate: '2099-01-01', status: '啟用' }]; if (typeof mapAdmin !== 'undefined') mapAdmin.status = { text: { pendingNew: 0 }, name: { pendingNew: 0 } };
  renderAdminReminders();
  ok(document.querySelectorAll('#adminReminders .admin-reminder').length === 0 && /目前沒有待辦提醒/.test($('adminReminders').textContent) && $('adminReminders').classList.contains('border-emerald-200'), '都沒事：顯示「目前沒有待辦提醒」（綠框）');
  window.getTodayDateStr = real.today;
  ok($('adminDashboard').contains($('adminReminders')) && $('adminReminders').nextElementSibling.querySelector('#adminSubtabBtn-events'), '提醒卡在後台頂部列下方、子頁籤上方');

  // F. 「今天」按鈕與版面
  goToToday();
  const now = new Date();
  ok(state.selectedDateStr === getTodayDateStr() && state.viewYear === now.getFullYear() && state.viewMonth === now.getMonth() + 1, '「今天」按鈕：回到真正的今天（不再固定跳到 2026/10/23）');
  ok(/whitespace-nowrap/.test($('headerClass').className) && /flex-wrap/.test($('headerClass').parentElement.className), '班名「諾貝爾 A 班」不會被擠成兩行（標題列可換行讓 Happy Life 移到下一行）');
  ok(/whitespace-nowrap/.test($('spotlightHistoryBtn').className) && /whitespace-nowrap/.test($('spotlightSlideCounter').className), '「歷史焦點」與「3 / 4」不會被擠成兩行');

  window.todayCardPlan = real.plan; window.getTodayDateStr = real.today;
  state.events = saved.ev; state.menus = saved.me; state.spotlights = saved.sp; state.adminPassword = saved.pwd; state.textMap = saved.tm; if (typeof mapAdmin !== 'undefined') mapAdmin.status = saved.st;
  state.selectedDateStr = saved.sel; state.viewYear = saved.vy; state.viewMonth = saved.vm; window.handleDataLoaded = realHandle;
  if (state.lang !== startLang) toggleLanguage();
  try { renderTodayCard(); renderCalendar(); renderSelectedDayDetails(state.selectedDateStr); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
