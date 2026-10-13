// 後台「第一次點進來清單是空的」修正測試（瀏覽器）：重新整理頁面時 initApp() 先用還沒載入的空資料畫過一次行事曆活動列表，
// 雲端資料之後才到；若當時不在後台頁籤就不會重畫，第一次點進後台看到「目前沒有活動紀錄」。修正：資料載入後（已登入）一律重畫，且進入後台頁籤時依目前子面板重畫。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const saved = { events: state.events, pwd: state.adminPassword, tab: state.currentTab, sub: state.currentAdminSubtab, rst: window.readStoredToken, sw: window.switchAdminSubtab };
  const $ = id => document.getElementById(id);
  const cont = () => $('adminEventsTableContainer');
  const EV = [{ id: 'E1', date: '2026-10-07', title: '十月份幸福廚房', target: '諾貝爾 A', categoryMajor: '班級主題', categoryMinor: '幸福廚房' }, { id: 'E2', date: '2026-10-08', title: '十月壽星慶生會', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '慶生活動' }];
  const cached = (() => { try { const c = JSON.parse(localStorage.getItem('nobel_a_cached_app_data') || 'null'); return c && (c.data || c); } catch (e) { return null; } })();
  window.readStoredToken = () => '';
  state.adminPassword = 'tok'.repeat(15);

  // A. 重現原本的情況：用空資料畫過 → 之後資料才到，但使用者在首頁
  state.currentTab = 'home'; state.events = []; renderAdminEventsTable();
  ok(/目前沒有活動紀錄/.test(cont().textContent), '（前置）用空資料畫過：顯示「目前沒有活動紀錄」');
  if (cached) {
    const d = Object.assign({}, cached, { events: EV.map(e => Object.assign({}, e)) });
    handleDataLoaded(d);
    ok(cont().textContent.indexOf('十月份幸福廚房') >= 0 && cont().textContent.indexOf('目前沒有活動紀錄') < 0, '雲端資料到達時使用者還在首頁（已登入）：後台活動列表也會重畫，不再留著空清單');
    state.currentTab = 'home';
  } else { ok(true, '（略過：沒有可用的快取資料）'); }

  // B. 進入後台頁籤時重畫
  state.currentTab = 'home'; state.events = []; renderAdminEventsTable(); state.events = EV.map(e => Object.assign({}, e));
  ok(/目前沒有活動紀錄/.test(cont().textContent), '（前置）畫面上是舊的空清單，但資料其實已經有了');
  state.currentAdminSubtab = 'events'; switchTab('admin');
  ok(cont().textContent.indexOf('十月壽星慶生會') >= 0 && !$('adminPanel-events').classList.contains('hidden'), '切到後台頁籤：自動重畫活動列表（看到 2 筆），子面板正確顯示');

  // C. 依「目前子面板」重畫；沒登入不呼叫
  const calls = []; window.switchAdminSubtab = function (s) { calls.push(s); return saved.sw.apply(this, arguments); };
  state.currentAdminSubtab = 'themes'; switchTab('admin'); ok(calls.join() === 'themes', '最後停留在「主題活動」子面板：進入後台時重畫的是那個子面板（實際：' + calls.join() + '）');
  calls.length = 0; state.currentAdminSubtab = undefined; switchTab('admin'); ok(calls.join() === 'events', '沒有記錄過子面板：預設重畫「活動」');
  calls.length = 0; state.adminPassword = ''; switchTab('admin'); ok(calls.length === 0, '沒有登入：不呼叫（不必畫後台列表、也不會對沒登入的人發出後台請求）');
  calls.length = 0; state.adminPassword = 'tok'.repeat(15); switchTab('home'); ok(calls.length === 0, '切到其他頁籤：不重畫後台');
  window.switchAdminSubtab = saved.sw;

  // D. 沒登入時資料到達：不出錯
  state.adminPassword = ''; state.currentTab = 'home';
  try { if (cached) handleDataLoaded(Object.assign({}, cached)); ok(true, '沒登入時雲端資料到達：不出錯'); } catch (e) { ok(false, '沒登入時資料到達出錯：' + e.message); }

  window.readStoredToken = saved.rst; state.events = saved.events; state.adminPassword = saved.pwd; state.currentTab = saved.tab; state.currentAdminSubtab = saved.sub;
  try { switchTab(saved.tab || 'home'); renderAdminEventsTable(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
