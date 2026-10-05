// App 模式（加到主畫面）行為測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：只有 App 模式才顯示重新整理鈕；回到前景超過 5 分鐘才自動同步；管理員登入／彈窗開著／非 App 模式時不同步。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realLoad = window.loadAppData; let syncs = 0; window.loadAppData = function () { syncs++; };
  const realNow = Date.now; let fake = realNow.call(Date);
  Date.now = () => fake;
  const setVis = v => { Object.defineProperty(document, 'visibilityState', { value: v, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); };
  const setStandalone = on => { Object.defineProperty(navigator, 'standalone', { value: on, configurable: true }); };
  const away = ms => { setVis('hidden'); fake += ms; setVis('visible'); };

  // A. 重新整理鈕只在 App 模式顯示
  const btn = document.getElementById('appRefreshBtn');
  setStandalone(false); btn.classList.add('hidden'); btn.classList.remove('flex'); initStandaloneSupport();
  ok(btn.classList.contains('hidden'), '一般瀏覽器：重新整理鈕不顯示');
  setStandalone(true); btn.classList.add('hidden'); initStandaloneSupport();
  ok(!btn.classList.contains('hidden') && btn.classList.contains('flex') && btn.textContent.trim() === '↻', 'App 模式：顯示 ↻ 鈕');
  ok(btn.getAttribute('aria-label') === '重新整理', '鈕有無障礙名稱');

  // B. 回到前景自動同步（上面 initStandaloneSupport 呼叫過 3 次，removeEventListener 不需要：同一個函式只會註冊一次）
  syncs = 0; setStandalone(true);
  away(2 * 60 * 1000); ok(syncs === 0, '離開 2 分鐘回來：不同步');
  away(5 * 60 * 1000 + 1000); ok(syncs === 1, '離開超過 5 分鐘回來：同步 1 次（實際 ' + syncs + '）');
  setVis('visible'); ok(syncs === 1, '沒有先離開就觸發 visible：不同步');
  setStandalone(false); away(30 * 60 * 1000); ok(syncs === 1, '非 App 模式：不自動同步（維持原本行為）');
  setStandalone(true);
  const m = document.createElement('div'); m.id = 'testModal'; document.body.appendChild(m);
  away(30 * 60 * 1000); ok(syncs === 1, '有彈窗開著（id 以 Modal 結尾且未隱藏）：不同步');
  m.classList.add('hidden'); away(30 * 60 * 1000); ok(syncs === 2, '彈窗關閉後離開再回來：同步');
  m.remove();
  state.adminPassword = 'fake-token'; away(30 * 60 * 1000); ok(syncs === 2, '管理員已登入：不同步（避免打斷編輯）');
  state.adminPassword = ''; away(30 * 60 * 1000); ok(syncs === 3, '登出後：恢復自動同步');

  // C. 同步失敗提示在 App 模式指向 ↻
  let toast = ''; const realToast = window.showToast; window.showToast = function (t) { toast = t; };
  setStandalone(true); notifySyncFailed(); ok(/↻/.test(toast), 'App 模式的同步失敗提示指向 ↻（' + toast + '）');
  setStandalone(false); notifySyncFailed(); ok(!/↻/.test(toast) && /重新整理頁面/.test(toast), '一般瀏覽器維持「請重新整理頁面」');
  window.showToast = realToast;

  Date.now = realNow; window.loadAppData = realLoad; window.handleDataLoaded = realHandle; setStandalone(false); setVis('visible');
  console.log(res.join('\n')); return res;
})();
