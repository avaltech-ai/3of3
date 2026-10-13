// 重新整理頁面時停在原本頁面的測試（瀏覽器）：頁籤與後台子面板記在 sessionStorage，啟動時還原；只接受已知名稱；儲存空間不能用時不出錯。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const saved = { tab: state.currentTab, sub: state.currentAdminSubtab, pwd: state.adminPassword, rst: window.readStoredToken, t: sessionStorage.getItem('nobel_a_current_tab'), s: sessionStorage.getItem('nobel_a_admin_subtab') };
  const $ = id => document.getElementById(id);
  const vis = t => !$('tabContent-' + t).classList.contains('hidden');
  const only = t => ['home', 'albums', 'songs', 'themes', 'docs', 'admin'].every(x => vis(x) === (x === t));
  window.readStoredToken = () => '';
  const reset = () => { state.adminPassword = ''; state.currentAdminSubtab = 'events'; sessionStorage.removeItem('nobel_a_current_tab'); sessionStorage.removeItem('nobel_a_admin_subtab'); switchTab('home'); sessionStorage.removeItem('nobel_a_current_tab'); };

  // A. 切換時記錄
  reset(); switchTab('albums');
  ok(sessionStorage.getItem('nobel_a_current_tab') === 'albums', '切到「影像記錄」：記下目前頁籤');
  switchTab('docs'); ok(sessionStorage.getItem('nobel_a_current_tab') === 'docs', '再切到「常用文件」：記錄跟著更新');
  state.adminPassword = 'tok'.repeat(15); switchAdminSubtab('songs'); ok(sessionStorage.getItem('nobel_a_admin_subtab') === 'songs', '後台切到「唱跳音符」子面板：記下子面板');
  switchAdminSubtab('不存在的面板'); ok(sessionStorage.getItem('nobel_a_admin_subtab') === 'songs', '未知的子面板名稱：不記錄（維持原本記的）');

  // B. 還原
  reset(); sessionStorage.setItem('nobel_a_current_tab', 'albums'); restoreSavedTab();
  ok(state.currentTab === 'albums' && only('albums'), '重新整理後還原：停在「影像記錄」，其他頁籤隱藏');
  reset(); sessionStorage.setItem('nobel_a_current_tab', 'docs'); restoreSavedTab(); ok(state.currentTab === 'docs' && only('docs'), '還原到「常用文件」');
  reset(); sessionStorage.setItem('nobel_a_current_tab', 'themes'); restoreSavedTab(); ok(state.currentTab === 'themes' && only('themes'), '還原到「主題活動」');
  reset(); sessionStorage.setItem('nobel_a_current_tab', 'songs'); restoreSavedTab(); ok(state.currentTab === 'songs' && only('songs'), '還原到「唱跳音符」');

  // C. 後台與子面板
  reset(); state.adminPassword = 'tok'.repeat(15); sessionStorage.setItem('nobel_a_current_tab', 'admin'); sessionStorage.setItem('nobel_a_admin_subtab', 'spotlight'); restoreSavedTab();
  ok(state.currentTab === 'admin' && only('admin') && state.currentAdminSubtab === 'spotlight' && !$('adminPanel-spotlight').classList.contains('hidden') && $('adminPanel-events').classList.contains('hidden'), '重新整理後還原：停在後台的「焦點活動」子面板（已登入）');
  reset(); sessionStorage.setItem('nobel_a_current_tab', 'admin'); restoreSavedTab(); ok(state.currentTab === 'admin' && only('admin'), '後台但沒有登入：停在後台頁（會看到登入畫面），不出錯');

  // D. 異常值
  ['hacker', '<img src=x onerror=window.__tabpwn=1>', 'admin2', 'HOME', 'daily'].forEach(v => {
    reset(); sessionStorage.setItem('nobel_a_current_tab', v); restoreSavedTab();
    ok(state.currentTab === 'home' && only('home') && !window.__tabpwn, '未知的頁籤名稱「' + v.slice(0, 12) + '」：一律忽略，維持首頁、所有頁籤不會被隱藏');
  });
  reset(); sessionStorage.setItem('nobel_a_admin_subtab', '<script>'); restoreSavedTab(); ok(state.currentAdminSubtab === 'events', '未知的後台子面板名稱：忽略');
  reset(); restoreSavedTab(); ok(state.currentTab === 'home' && only('home'), '沒有任何記錄（第一次開啟、或關掉後重新開啟）：從首頁開始');
  reset(); sessionStorage.setItem('nobel_a_current_tab', 'home'); restoreSavedTab(); ok(state.currentTab === 'home', '記錄是首頁：維持首頁');

  // E. 儲存空間不能用
  const realGet = Storage.prototype.getItem, realSet = Storage.prototype.setItem;
  Storage.prototype.getItem = function () { throw new Error('denied'); }; Storage.prototype.setItem = function () { throw new Error('denied'); };
  let threw = false; try { restoreSavedTab(); switchTab('albums'); switchAdminSubtab('events'); } catch (e) { threw = true; }
  Storage.prototype.getItem = realGet; Storage.prototype.setItem = realSet;
  ok(!threw, 'sessionStorage 讀寫都被拒絕（無痕模式等）：不出錯，頁面照常運作');
  switchTab('home');

  // F. 啟動流程有呼叫還原
  const src = Array.from(document.scripts).map(s => s.textContent).join('\n');
  ok(/initStandaloneSupport\(\);\s*\n\s*\/\/[^\n]*\n\s*restoreSavedTab\(\);/.test(src), '啟動流程（initApp）有呼叫 restoreSavedTab()');

  window.readStoredToken = saved.rst; state.adminPassword = saved.pwd; state.currentAdminSubtab = saved.sub;
  try { saved.t === null ? sessionStorage.removeItem('nobel_a_current_tab') : sessionStorage.setItem('nobel_a_current_tab', saved.t); saved.s === null ? sessionStorage.removeItem('nobel_a_admin_subtab') : sessionStorage.setItem('nobel_a_admin_subtab', saved.s); } catch (e) {}
  switchTab(saved.tab || 'home');
  console.log(res.join('\n')); return res;
})();
