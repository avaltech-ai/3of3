// 手機底部導覽列、「更多」面板、後台設定，以及手機月曆「只看這一週」（瀏覽器）。會暫時把 window.innerWidth 假裝成手機／電腦。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const startLang = state.lang; if (state.lang === 'en') { toggleLanguage(); await wait(300); }
  const saved = { settings: JSON.parse(JSON.stringify(state.settings || {})), tab: state.currentTab, pwd: state.adminPassword, sel: state.selectedDateStr, vy: state.viewYear, vm: state.viewMonth, mode: state.currentCalView, big: document.documentElement.classList.contains('big-text') };
  const real = { cb: window.callBackend, toast: window.showToast, load: window.loadAppData, big: window.toggleBigText, lang: window.toggleLanguage };
  const $ = id => document.getElementById(id);
  const cbs = [], toasts = [];
  window.showToast = m => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  window.callBackend = (a, p, okCb) => { if (a === 'mapStatus') return; cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true, tabs: p.tabs, message: '手機底部導覽列已更新！' }); };
  const fakeWidth = w => { try { Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => w }); } catch (e) {} };
  const restoreWidth = () => { try { delete window.innerWidth; } catch (e) {} };
  const navLabels = () => [...document.querySelectorAll('#mobileBottomNavItems button')].map(b => b.textContent.trim());
  const navBtnOf = k => document.querySelector('#mobileBottomNavItems button[data-tab="' + k + '"]');
  const sheetOpen = () => !$('mobileMoreSheet').classList.contains('hidden');

  // A. 預設項目與外觀
  state.settings = Object.assign({}, saved.settings, { mobileNavTabs: [] });
  switchTab('home');
  ok(/md:hidden/.test($('mobileBottomNav').className) && /fixed/.test($('mobileBottomNav').className) && $('mobileBottomNav').parentElement === document.body, '底部導覽列：只在手機（< 768）出現、固定在畫面底部');
  ok(navLabels().join('|') === '🏠班級日常|📸影像記錄|📚主題活動|🎵唱跳音符|⋯更多', '後台沒設定：預設 班級日常、影像記錄、主題活動、唱跳音符＋更多');
  ok(navBtnOf('home').getAttribute('aria-current') === 'page' && /text-peach-600/.test(navBtnOf('home').className) && !/text-peach-600/.test($('mobileNavMoreBtn').className), '目前頁面（班級日常）亮起');
  navBtnOf('albums').click(); ok(state.currentTab === 'albums' && navBtnOf('albums').getAttribute('aria-current') === 'page', '按「影像記錄」：切換頁面，按鈕亮起');
  switchTab('docs'); ok(/text-peach-600/.test($('mobileNavMoreBtn').className) && !document.querySelector('#mobileBottomNavItems [aria-current="page"][data-tab]'), '目前頁面不在 4 個之中（常用文件）：「更多」亮起');
  ok(/pb-\[calc\(4\.25rem/.test(document.querySelector('.flex-1.flex.flex-col.min-w-0').className) && /md:pb-0/.test(document.querySelector('.flex-1.flex.flex-col.min-w-0').className), '主內容在手機上留出導覽列高度（最後的內容不會被蓋住）');
  ok(/md:bottom-6/.test($('toast').className) && /md:bottom-6/.test($('songsBottomPlayBar').className) && /5rem/.test($('toast').className), '提示訊息與歌曲播放列在手機上移到導覽列上方');

  // B. 「更多」面板
  switchTab('home'); $('mobileNavMoreBtn').click();
  ok(sheetOpen() && [...document.querySelectorAll('#mobileMorePages button')].map(b => b.getAttribute('data-tab')).join() === 'tasks,transition,docs', '「更多」：列出其他頁面（學期任務、幼小銜接、常用文件），順序同側邊欄');
  ok([...document.querySelectorAll('#mobileMoreTools button')].map(b => b.textContent.trim()).join('|') === '🔠大字|🌐English|⚙️管理後台', '「更多」：大字、English、管理後台');
  document.querySelector('#mobileMorePages button[data-tab="transition"]').click(); ok(!sheetOpen() && state.currentTab === 'transition', '在「更多」選頁面：關閉面板並切換');
  $('mobileNavMoreBtn').click(); ok(document.querySelector('#mobileMorePages button[data-tab="transition"]').className.indexOf('bg-peach-50') >= 0, '「更多」裡目前的頁面有標示');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); ok(!sheetOpen(), '按 Esc：關閉');
  $('mobileNavMoreBtn').click(); document.querySelector('#mobileMoreSheet > div').click(); ok(!sheetOpen(), '點背景：關閉');
  let bigCalled = 0; window.toggleBigText = () => { bigCalled++; };
  $('mobileNavMoreBtn').click(); document.querySelectorAll('#mobileMoreTools button')[0].click(); ok(bigCalled === 1 && !sheetOpen(), '「大字」：切換並關閉面板');
  window.toggleBigText = real.big;

  // C. 後台設定的項目
  state.settings.mobileNavTabs = ['docs', 'tasks', 'home', 'transition']; renderMobileBottomNav();
  ok(navLabels().join('|') === '📁常用文件|🎯學期任務|🏠班級日常|🎒幼小銜接|⋯更多', '後台設定 4 個：依設定的順序顯示');
  $('mobileNavMoreBtn').click(); ok([...document.querySelectorAll('#mobileMorePages button')].map(b => b.getAttribute('data-tab')).join() === 'themes,albums,songs', '「更多」改列其餘的頁面'); closeMobileMore();
  [['home', 'home', 'albums', 'songs'], ['home', 'albums'], ['home', 'albums', 'themes', 'admin'], 'home,albums,themes,songs', null].forEach(v => { state.settings.mobileNavTabs = v; renderMobileBottomNav(); });
  ok(navLabels().join('|') === '🏠班級日常|📸影像記錄|📚主題活動|🎵唱跳音符|⋯更多', '設定不合法（重複、不足 4 個、含後台、不是陣列、空值）：一律退回預設');

  // D. 後台設定卡
  state.adminPassword = 'tok'.repeat(15);
  state.settings.mobileNavTabs = ['home', 'albums', 'themes', 'songs'];
  switchTab('admin'); switchAdminSubtab('settings');
  ok($('adminPanel-settings').contains($('mobileNavSettingsCard')) && [1, 2, 3, 4].map(i => $('mobileNavSlot-' + i).value).join() === 'home,albums,themes,songs' && $('mobileNavSlot-1').options.length === 7, '後台「密碼與設定」：4 格下拉帶入目前設定，每格 7 個頁面可選（沒有管理後台）');
  $('mobileNavSlot-2').value = 'home'; cbs.length = 0; saveMobileNavSettings();
  ok(cbs.length === 0 && /不能選兩次：班級日常/.test(toasts[toasts.length - 1]), '選到重複：提示，不送出');
  $('mobileNavSlot-2').value = 'tasks'; $('mobileNavSlot-4').value = 'docs'; saveMobileNavSettings();
  ok(cbs.length === 1 && cbs[0].a === 'saveMobileNav' && cbs[0].p.tabs.join() === 'home,tasks,themes,docs' && cbs[0].p.password.length > 10, '儲存：呼叫 saveMobileNav，依第 1～4 格順序送出');
  ok(state.settings.mobileNavTabs.join() === 'home,tasks,themes,docs' && navLabels().join('|') === '🏠班級日常|🎯學期任務|📚主題活動|📁常用文件|⋯更多' && /已更新/.test(toasts[toasts.length - 1]), '成功：底部導覽列立刻換成新的項目');
  resetMobileNavSlots(); ok([1, 2, 3, 4].map(i => $('mobileNavSlot-' + i).value).join() === 'home,albums,themes,songs', '「恢復預設」：4 格回到預設（按儲存才生效）');

  // E. 英文
  toggleLanguage(); await wait(200); renderMobileBottomNav();
  ok(/Daily/.test(navLabels()[0]) && /More/.test(navLabels()[4]), '英文介面：導覽列文字是英文');
  toggleLanguage(); await wait(200);

  // F. 手機月曆：模式鈕與格子連動
  switchTab('home');
  const shown = () => [...$('calendarGrid').children].filter(c => !c.classList.contains('hidden'));
  const allCells = () => $('calendarGrid').children.length;
  const activeMode = () => ['day', 'week', 'month'].filter(m => /shadow-xs/.test($('viewModeBtn-' + m).className)).join();
  fakeWidth(390); state.viewYear = 2026; state.viewMonth = 10; state.selectedDateStr = '2026-10-21'; state.currentCalView = 'day'; renderCalendar();
  calDefaultModeApplied = false; applyCalDefaultMode();
  ok(state.currentCalView === 'week' && activeMode() === 'week' && !$('weekViewContainer').classList.contains('hidden') && $('linkedContentSection').classList.contains('hidden'), '手機第一次載入：預設選「查看本週」（按鈕亮起、下方顯示本週列表）');
  ok(shown().length === 7 && shown().some(c => /^\s*18/.test(c.textContent)) && shown().some(c => /^\s*24/.test(c.textContent)), '格子只顯示這一週（10/18～10/24），和按鈕一致');
  ok(!document.getElementById('calWeekToggle'), '不再有另外的「展開整個月」按鈕（同一件事只有一個開關）');
  setCalViewMode('day'); applyCalDefaultMode(); ok(state.currentCalView === 'day', '預設只套用一次：使用者自己切換後不會被改回來');
  onDateClicked('2026-10-22'); ok(state.currentCalView === 'day' && activeMode() === 'day' && state.selectedDateStr === '2026-10-22' && shown().length === 7 && !$('linkedContentSection').classList.contains('hidden'), '點某一天：切到「單日點選」看那天詳情，格子仍是那一週');
  setCalViewMode('month'); ok(shown().length === allCells() && activeMode() === 'month' && !$('monthViewContainer').classList.contains('hidden'), '「本月總覽」：格子展開整個月');
  ok($('calPrevBtn').title === '上個月' && $('calNextBtn').title === '下個月', '整月時 ‹ › 是上個月／下個月');
  const m0 = state.viewMonth; changeMonth(1); ok(state.viewMonth === 11 && state.selectedDateStr === '2026-10-22' && shown().length === allCells(), '整月時按 ›：換到下個月（選取日期不變）');
  changeMonth(-1);
  setCalViewMode('week'); ok(shown().length === 7 && $('calPrevBtn').title === '上一週' && $('calNextBtn').title === '下一週', '回到「查看本週」：格子收回一週，‹ › 變成上一週／下一週');
  changeMonth(1); ok(state.selectedDateStr === '2026-10-29' && state.viewMonth === 10 && shown().length === 7 && shown().some(c => /^\s*29/.test(c.textContent)), '週模式按 ›：移到下一週（10/29 那週）');
  ok([...document.querySelectorAll('#weekDaysList > div')].some(d => /29/.test(d.textContent)), '下方本週列表跟著換成那一週');
  changeMonth(1); ok(state.selectedDateStr === '2026-11-05' && state.viewMonth === 11 && /11/.test($('calendarCurrentMonthText').textContent) && shown().length === 7, '跨月：移到 11/5 那週，月份標題換成 11 月');
  changeMonth(-1); changeMonth(-1); ok(state.selectedDateStr === '2026-10-22' && state.viewMonth === 10, '按 ‹：一次退一週');
  setCalViewMode('day'); changeMonth(1); ok(state.selectedDateStr === '2026-10-29' && /29/.test($('selectedDateHeader').textContent), '單日模式按 ›：也是移一週，並顯示那天詳情');
  goToToday(); ok(state.currentCalView === 'week' && state.selectedDateStr === getTodayDateStr() && shown().length === 7, '手機按「今天」：回到今天並回到「查看本週」');
  fakeWidth(1024); setCalViewMode('week'); ok(shown().length === allCells() && $('calPrevBtn').title === '上個月', '電腦／平板（≥ 768）：任何模式都是整月，‹ › 一次一個月');
  goToToday(); ok(state.currentCalView === 'day', '電腦按「今天」：維持原本的「單日點選」');
  restoreWidth();
  ok([...document.querySelectorAll('.cal-view-btn')].every(b => /truncate/.test(b.className) && /min-w-0/.test(b.className)) && /whitespace-nowrap/.test(document.querySelector('[onclick="goToToday()"]').className), '模式鈕不換行也不會超出畫面（太窄時以「…」結尾）；「今天」鈕不換行');

  window.callBackend = real.cb; window.showToast = real.toast; window.loadAppData = real.load; window.toggleBigText = real.big;
  state.settings = saved.settings; state.adminPassword = saved.pwd; state.selectedDateStr = saved.sel; state.viewYear = saved.vy; state.viewMonth = saved.vm; state.currentCalView = saved.mode || 'day'; window.handleDataLoaded = realHandle;
  if (state.lang !== startLang) toggleLanguage();
  try { closeMobileMore(); switchTab(saved.tab || 'home'); renderCalendar(); setCalViewMode(state.currentCalView); renderMobileBottomNav(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
