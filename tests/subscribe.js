// 訂閱行事曆介面測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const modal = document.getElementById('calendarSubscribeModal');
  const url = GAS_API_URL + '?action=getCalendarIcs';

  ok(!!document.getElementById('btnCalendarSubscribe') && document.getElementById('btnCalendarSubscribe').textContent.indexOf('訂閱行事曆') >= 0, '行事曆區有「訂閱行事曆」按鈕');
  ok(modal.classList.contains('hidden') && /Modal$/.test(modal.id), '視窗預設隱藏；id 以 Modal 結尾（回到前景自動同步時會視為「使用者忙碌」）');
  document.getElementById('btnCalendarSubscribe').click();
  ok(!modal.classList.contains('hidden'), '按下按鈕：開啟視窗');
  ok(document.getElementById('calSubUrl').value === url && /\?action=getCalendarIcs$/.test(url), '訂閱網址為後端唯讀動作 getCalendarIcs（' + url.slice(0, 50) + '…）');
  const apple = document.getElementById('calSubAppleLink').getAttribute('href');
  ok(apple === 'webcal://' + url.replace(/^https:\/\//, '') && apple.indexOf('webcal://script.google.com/macros/s/') === 0, 'Apple 連結改用 webcal://（' + apple.slice(0, 45) + '…）');
  ok(apple.indexOf('https') === -1, 'webcal 連結不含 https');
  ok(!/password|token|key=/i.test(url), '網址不含任何密碼或金鑰（公開唯讀）');

  // 複製
  let copied = null, toast = ''; const realToast = window.showToast; window.showToast = m => { toast = m; };
  const clip = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { copied = t; return Promise.resolve(); } }, configurable: true });
  copyCalendarSubscribeUrl(); await wait(100);
  ok(copied === url && /已複製/.test(toast), '複製：寫入剪貼簿的是訂閱網址，並提示已複製（' + toast + '）');
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
  const realExec = document.execCommand; document.execCommand = () => false; toast = '';
  copyCalendarSubscribeUrl(); await wait(100);
  ok(/無法自動複製/.test(toast), '剪貼簿被拒絕且 execCommand 失敗：提示手動複製');
  document.execCommand = () => true; toast = '';
  copyCalendarSubscribeUrl(); await wait(100);
  ok(/已複製/.test(toast), '剪貼簿被拒絕但 execCommand 成功：仍提示已複製');
  document.execCommand = realExec;
  if (clip) Object.defineProperty(navigator, 'clipboard', clip); else delete navigator.clipboard;
  window.showToast = realToast;

  // 關閉
  modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  ok(modal.classList.contains('hidden'), '點背景：關閉');
  openCalendarSubscribe(); modal.firstElementChild.click(); ok(!modal.classList.contains('hidden'), '點視窗內容：不關閉');
  closeCalendarSubscribe(); ok(modal.classList.contains('hidden'), '關閉函式：隱藏');

  // 英文
  const lang = state.lang; state.lang = 'en';
  ok(/Subscribe/.test(t('cal.subscribeBtn')) && /12 to 24 hours/.test(t('cal.subscribeNote')) && /iPhone/.test(t('cal.subscribeApple')), '英文字典齊全');
  state.lang = lang;
  ok(['subscribeBtn', 'subscribeTitle', 'subscribeIntro', 'subscribeApple', 'subscribeGoogleTitle', 'subscribeStep1', 'subscribeStep2', 'subscribeStep3', 'subscribeUrlLabel', 'subscribeCopy', 'subscribeCopied', 'subscribeCopyFail', 'subscribeNote'].every(k => t('cal.' + k) && t('cal.' + k) !== 'cal.' + k), '中文字典所有鍵都有值');

  window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
