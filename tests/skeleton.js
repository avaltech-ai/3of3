// 載入骨架畫面與「第一次開啟就連線失敗」的測試（瀏覽器）：沒有快取時顯示骨架、資料到了顯示內容、
// 手上沒有資料又連線失敗時換成「重新載入」面板（不跳「可能是舊資料」的提示）、已有資料時失敗照舊跳提示、重新載入、跳脫。
// 測試期間替換 callBackend／showToast／loadAppData，結束後還原並恢復原本的載入狀態。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(3000);
  const $ = id => document.getElementById(id);
  const html = document.documentElement;
  const shown = el => !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
  const saved = { tab: state.currentTab, cls: html.className, cb: window.callBackend, toast: window.showToast, lad: window.loadAppData };
  let toasts = []; window.showToast = function (m) { toasts.push(String(m)); };
  const raw = JSON.parse(localStorage.getItem('nobel_a_cached_app_data') || 'null');
  ok(!!raw && raw.events && raw.events.length > 0, '前置：手機裡有快取資料（測試用來模擬「資料到了」）');

  const tabs = { home: ['todayCard', 'spotlightContainer', 'calendarGrid', 'linkedContentSection'], albums: ['albumsGrid'], songs: ['songsListContainer'],
    themes: ['themesList'], tasks: ['tasksGroups'], transition: ['trPlanView'], docs: ['docsListContainer'] };

  // A. 頁首有及早加上 app-loading 的程式
  const head = Array.from(document.head.querySelectorAll('script')).map(s => s.textContent).join('\n');
  ok(/nobel_a_cached_app_data[\s\S]{0,80}app-loading/.test(head), '<head> 有「沒有快取就先加 app-loading」的程式（避免先閃一下空白內容）');

  // B. 載入中：每一頁都看到骨架、看不到資料區塊與失敗面板
  setAppLoadState('loading');
  Object.keys(tabs).forEach(tab => {
    switchTab(tab);
    const sec = $('tabContent-' + tab);
    const skel = sec.querySelector('.app-skel');
    ok(shown(skel) && skel.getAttribute('aria-busy') === 'true' && tabs[tab].every(id => !shown($(id))) && !shown($('appLoadFail')),
      '載入中「' + tab + '」：顯示骨架（aria-busy）、資料區塊隱藏、沒有失敗面板');
  });
  switchTab('songs'); ok(!shown($('songsBottomPlayBar')), '載入中：唱跳音符底部「已選取 0 首」播放列不顯示');
  ok(Array.from(document.querySelectorAll('.app-skel [class*="animate-pulse"]')).every(e => /motion-safe:animate-pulse/.test(e.className)), '骨架的閃動只用 motion-safe（系統設定「減少動態效果」時不閃）');
  ok(document.querySelectorAll('.app-skel .sr-only').length === Object.keys(tabs).length, '每個骨架都有給螢幕閱讀器的「正在載入」文字');

  // C. 資料到了
  handleDataLoaded(raw);
  ok(!html.classList.contains('app-loading') && !html.classList.contains('app-load-failed'), 'handleDataLoaded：載入狀態變成「完成」');
  switchTab('home');
  ok(!shown(document.querySelector('#tabContent-home .app-skel')) && shown($('calendarGrid')) && shown($('spotlightContainer')), '完成後：首頁骨架消失、月曆與焦點活動出現');
  switchTab('songs'); ok(shown($('songsListContainer')) && !shown(document.querySelector('#tabContent-songs .app-skel')), '完成後：唱跳音符列表出現');

  // D. 第一次開啟就連線失敗
  setAppLoadState('loading'); toasts = [];
  window.callBackend = function (action, payload, onOk, onErr) { if (action === 'getAppData') onErr(new TypeError('Failed to fetch')); };
  loadAppData(true);
  ok(html.classList.contains('app-load-failed') && !html.classList.contains('app-loading'), '沒有資料又連線失敗：切到「連線失敗」狀態');
  switchTab('home');
  ok(shown($('appLoadFail')) && !shown(document.querySelector('#tabContent-home .app-skel')) && !shown($('calendarGrid')) && !shown($('todayCard')), '失敗面板出現；骨架、月曆、小卡都不顯示（不會讓家長以為沒有活動）');
  ok(toasts.length === 0, '失敗面板出現時，不再跳「目前顯示的可能是舊資料」提示');
  ok($('appLoadFailWhy').textContent.indexOf('Failed to fetch') !== -1, '面板下方有簡短錯誤原因（方便回報）');
  switchTab('albums'); ok(shown($('appLoadFail')) && !shown($('albumsGrid')), '其他頁（影像記錄）也看到失敗面板');
  switchTab('home');

  // E. 後端回傳錯誤（不是連線失敗）也一樣
  setAppLoadState('loading'); toasts = [];
  window.callBackend = function (action, payload, onOk) { if (action === 'getAppData') onOk({ success: false, error: '<img src=x onerror=window.__skelpwn=1>' }); };
  loadAppData(true); await wait(50);
  ok(html.classList.contains('app-load-failed') && toasts.length === 0, '後端回傳失敗：同樣顯示失敗面板');
  ok(!window.__skelpwn && !$('appLoadFailWhy').querySelector('img'), '錯誤原因含 HTML 時只當文字顯示（不會被執行）');

  // F. 重新載入：先回到骨架，再呼叫 loadAppData
  let called = 0; const realLad = window.loadAppData;
  window.loadAppData = function () { called++; ok(html.classList.contains('app-loading'), '按「重新載入」後：先回到骨架'); };
  $('appLoadFail').querySelector('button').click();
  window.loadAppData = realLad;
  ok(called === 1, '按「重新載入」：重新向雲端讀取一次');
  window.callBackend = function (action, payload, onOk) { if (action === 'getAppData') onOk({ success: true, data: raw }); };
  loadAppData(true);
  ok(!html.classList.contains('app-loading') && !html.classList.contains('app-load-failed') && !shown($('appLoadFail')) && shown($('calendarGrid')), '重新載入成功：面板消失、內容出現');

  // G. 已有資料（有快取）時連線失敗：照舊跳提示，不換成失敗面板
  toasts = [];
  window.callBackend = function (action, payload, onOk, onErr) { if (action === 'getAppData') onErr(new Error('timeout')); };
  loadAppData(true);
  ok(!html.classList.contains('app-load-failed') && toasts.length === 1 && shown($('calendarGrid')), '已有資料時同步失敗：維持顯示內容，只跳「可能是舊資料」提示');

  // H. 中英文字
  ok(['skelLoading', 'loadFailTitle', 'loadFailBody', 'loadRetry'].every(k => I18N['zh-TW'].ui[k] && I18N.en.ui[k] && !/[一-鿿]/.test(I18N.en.ui[k])), '骨架與失敗面板的文字有中文與英文（英文不含中文字）');

  window.callBackend = saved.cb; window.showToast = saved.toast;
  html.className = saved.cls; switchTab(saved.tab || 'home');
  const fail = res.filter(r => r.indexOf('✗') === 0).length;
  console.log(res.join('\n')); return { allPass: fail === 0, pass: res.length - fail, fail: fail, res: res };
})();
