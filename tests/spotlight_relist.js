// 後台焦點活動「再次上架」測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 以假資料與假的 callBackend 驗證：每筆有「再次上架」按鈕；帶入原內容與圖片（新編號、起始日＝今天、結束日留空、啟用、排最後）；
// 沿用原圖不上傳；原本那一筆不受影響；結束日未填儲存前提醒、填了不提醒；結束日早於開始日擋下；編輯／新增流程不受影響；跳脫。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realCB = window.callBackend, realConfirm = window.confirm, realAlert = window.alert, realToast = window.showToast, realToday = window.getTodayDateStr;
  const savedState = { sp: state.spotlights, pw: state.adminPassword, idx: currentSpotlightIndex };
  let lsBackup = {}; ['nobel_a_spotlights_list', 'nobel_a_spotlight_custom'].forEach(k => { try { lsBackup[k] = localStorage.getItem(k); } catch (e) {} });
  state.adminPassword = 'tok';
  window.getTodayDateStr = function () { return '2026-10-07'; };
  let log = [], confirms = [], alerts = [], toasts = [], confirmAnswer = true;
  window.callBackend = function (a, p, okCb) { log.push({ action: a, payload: JSON.parse(JSON.stringify(p)) }); setTimeout(function () { okCb({ success: true, message: 'ok' }); }, 0); };
  window.confirm = function (m) { confirms.push(String(m)); return confirmAnswer; };
  window.alert = function (m) { alerts.push(String(m)); };
  window.showToast = function (m) { toasts.push(String(m)); };
  const $ = id => document.getElementById(id);
  const calls = a => log.filter(x => x.action === a);
  const reset = () => { log = []; confirms = []; alerts = []; toasts = []; confirmAnswer = true; };

  const OLD = { id: 'SP-OLD', title: '桃子腳幼兒園 牙齒塗氟日', subtitle: '日期：2026/08/10 (一) 08:30', mediaType: 'image', imageUrl: 'https://example.com/old.jpg', tags: '', bulletPoints: '【注意事項】請攜帶健保卡\n一般說明', startDate: '2026-08-01', endDate: '2026-08-08', duration: 8, priority: 3, status: '啟用' };
  const ACT = { id: 'SP-ACT', title: '進行中', subtitle: '', mediaType: 'image', imageUrl: 'https://example.com/act.jpg', bulletPoints: '', startDate: '2026-10-01', endDate: '2026-10-31', duration: 5, priority: 1, status: '啟用' };
  const OFF = { id: 'SP-OFF', title: '已停用的活動', subtitle: '', mediaType: 'video', imageUrl: 'https://www.youtube.com/watch?v=abc123', bulletPoints: '重點', startDate: '2026-07-01', endDate: '2026-07-10', duration: 12, priority: 2, status: '停用' };
  const XSS = { id: 'SP-XSS', title: '<img src=x onerror="window.__rlpwn=1">惡意', subtitle: '', mediaType: 'image', imageUrl: 'https://example.com/x.jpg', bulletPoints: '', startDate: '2026-06-01', endDate: '2026-06-02', duration: 5, priority: 4, status: '啟用' };
  const fresh = () => [OLD, ACT, OFF, XSS].map(x => Object.assign({}, x));
  // 讓後台面板可見（隱藏中的欄位無法取得游標）
  { let n = $('spAdminFormContainer').parentElement; while (n && n !== document.body) { n.classList.remove('hidden'); n.style.display = ''; n = n.parentElement; } }
  state.spotlights = fresh(); renderAdminSpotlightsList();

  // A. 按鈕
  const btns = [...document.querySelectorAll('.sp-relist-btn')];
  ok(btns.length === 4 && btns.every(b => /再次上架/.test(b.textContent)), '後台焦點列表：每一筆都有「🔁 再次上架」按鈕（共 4 筆）');
  const oldCard = btns.map(b => b.closest('div.p-3\\.5, div[class*="rounded-2xl"]')).find(c => c && c.textContent.indexOf('牙齒塗氟日') >= 0);
  ok(!!oldCard && oldCard.textContent.indexOf('已過期下架') >= 0, '已過期的活動在列表中顯示「已過期下架」且有按鈕');
  ok(!!oldCard.querySelector('.sp-edit-btn') && !!oldCard.querySelector('.sp-del-btn'), '原有的「編輯」「刪除」按鈕仍在');
  const btnOld = [...document.querySelectorAll('.sp-relist-btn')].find(b => b.closest('[class*="rounded-2xl"]').textContent.indexOf('牙齒塗氟日') >= 0);

  // B. 帶入
  btnOld.click();
  ok(!$('spAdminFormContainer').classList.contains('hidden'), '按下「再次上架」：開啟表單');
  ok($('spForm-id').value === '', '編號為空：儲存時會產生新編號（新的一筆）');
  ok($('spForm-title').value === OLD.title && $('spForm-subtitle').value === OLD.subtitle && $('spForm-bulletPoints').value === OLD.bulletPoints, '標題、副標題、重點條列原樣帶入（標題不加「複製」）');
  ok($('spForm-imageUrl').value === OLD.imageUrl && $('spForm-mediaType').value === 'image', '圖片網址與媒體類型沿用');
  ok($('spForm-duration').value === '8', '停留秒數沿用（8 秒）');
  ok($('spForm-startDate').value === '2026-10-07' && $('spForm-endDate').value === '', '開始日＝今天，結束日留空');
  ok($('spForm-status').value === '啟用', '狀態為啟用');
  ok($('spForm-priority').value === '5', '輪播順位排在最後（目前 4 筆 → 第 5）');
  ok(/再次上架/.test($('spAdminFormTitle').textContent) && /請設定新的起訖日期/.test($('spAdminFormTitle').textContent) && $('spAdminFormTitle').textContent.indexOf(OLD.title) >= 0, '表單標題：「再次上架：…（請設定新的起訖日期）」');
  ok(/不會重新上傳/.test($('spImageUploadStatus').textContent), '提示：沿用原檔，不會重新上傳');
  ok(spPendingUploadFile === null && spRelistMode === true, '沒有待上傳的檔案；再次上架模式已開啟');
  ok(document.activeElement === $('spForm-endDate'), '游標停在「結束日期」欄位，方便直接填寫');

  // C. 結束日未填：儲存前提醒
  reset(); confirmAnswer = false;
  saveSpotlightSettings();
  ok(confirms.length === 1 && /尚未填寫結束日期/.test(confirms[0]) && /不會自動下架/.test(confirms[0]) && /歷史焦點/.test(confirms[0]), '結束日未填：儲存前跳出提醒（說明不會自動下架、不會進入歷史焦點）');
  ok(calls('saveSpotlight').length === 0 && state.spotlights.length === 4 && !$('spAdminFormContainer').classList.contains('hidden'), '按取消：不儲存、表單仍開著');
  ok(document.activeElement === $('spForm-endDate'), '按取消後游標回到結束日期欄位');

  // D. 結束日早於開始日
  reset(); $('spForm-endDate').value = '2026-10-01'; saveSpotlightSettings();
  ok(alerts.length === 1 && /不能早於/.test(alerts[0]) && confirms.length === 0 && calls('saveSpotlight').length === 0, '結束日早於開始日：擋下並提示，不儲存');

  // E. 填了結束日 → 儲存成新的一筆
  reset(); $('spForm-endDate').value = '2026-10-14'; saveSpotlightSettings(); await wait(40);
  ok(confirms.length === 0, '有填結束日：不再提醒');
  ok(calls('uploadSpotlightImage').length === 0, '沒有呼叫上傳圖片（沿用原檔）');
  const sv = calls('saveSpotlight');
  ok(sv.length === 1 && sv[0].payload.data.id !== 'SP-OLD' && /^SP-\d+$/.test(sv[0].payload.data.id) && sv[0].payload.password === 'tok', '儲存為新的一筆：新編號，帶管理員 token');
  const nd = sv[0].payload.data;
  ok(nd.title === OLD.title && nd.imageUrl === OLD.imageUrl && nd.startDate === '2026-10-07' && nd.endDate === '2026-10-14' && nd.duration === 8 && nd.status === '啟用' && nd.bulletPoints === OLD.bulletPoints, '新的一筆：內容與圖片沿用，起訖日為新設定');
  const oldNow = state.spotlights.find(s => s.id === 'SP-OLD');
  ok(state.spotlights.length === 5 && JSON.stringify(oldNow) === JSON.stringify(OLD), '原本那一筆完全沒變（仍是 2026-08-01～08-08），總數由 4 變 5');
  ok(state.spotlights.filter(s => s.imageUrl === OLD.imageUrl).length === 2, '兩筆共用同一個圖片網址（沒有重複上傳檔案）');
  ok($('spAdminFormContainer').classList.contains('hidden') && spRelistMode === false, '儲存後表單關閉、再次上架模式結束');

  // F. 結束日留空但確認要這樣存
  reset(); state.spotlights = fresh(); renderAdminSpotlightsList();
  [...document.querySelectorAll('.sp-relist-btn')].find(b => b.closest('[class*="rounded-2xl"]').textContent.indexOf('牙齒塗氟日') >= 0).click();
  confirmAnswer = true; saveSpotlightSettings(); await wait(40);
  ok(confirms.length === 1 && calls('saveSpotlight').length === 1 && calls('saveSpotlight')[0].payload.data.endDate === '', '確認要永久播映：可以儲存（結束日為空）');

  // G. 停用的活動再次上架 → 啟用
  reset(); state.spotlights = fresh(); renderAdminSpotlightsList();
  [...document.querySelectorAll('.sp-relist-btn')].find(b => b.closest('[class*="rounded-2xl"]').textContent.indexOf('已停用的活動') >= 0).click();
  ok($('spForm-status').value === '啟用' && $('spForm-mediaType').value === 'video' && $('spForm-imageUrl').value === OFF.imageUrl && $('spForm-duration').value === '12', '停用的活動再次上架：狀態改為啟用，影片類型、網址、秒數沿用');
  cancelSpotlightEdit(); ok(spRelistMode === false && $('spAdminFormContainer').classList.contains('hidden'), '取消：結束再次上架模式');

  // H. 編輯與新增流程不受影響
  reset(); openSpotlightEditForm('SP-OLD');
  ok(spRelistMode === false && $('spForm-id').value === 'SP-OLD' && $('spForm-endDate').value === '2026-08-08', '編輯：仍是原編號與原日期，不是再次上架模式');
  $('spForm-endDate').value = ''; saveSpotlightSettings(); await wait(40);
  ok(confirms.length === 0 && calls('saveSpotlight').length === 1 && calls('saveSpotlight')[0].payload.data.id === 'SP-OLD', '編輯：結束日留空不提醒（維持原本行為），存回同一編號');
  state.spotlights = fresh(); reset(); openSpotlightCreateForm();
  ok(spRelistMode === false && $('spForm-id').value === '' && $('spForm-title').value === '' && $('spForm-startDate').value === '', '新增：空白表單、不是再次上架模式');
  $('spForm-title').value = '全新的活動'; saveSpotlightSettings(); await wait(40);
  ok(confirms.length === 0 && calls('saveSpotlight').length === 1, '新增：結束日留空不提醒（維持原本行為）');
  reset(); state.spotlights = fresh(); renderAdminSpotlightsList(); openSpotlightEditForm('SP-OLD'); $('spForm-startDate').value = '2026-10-10'; $('spForm-endDate').value = '2026-10-01'; saveSpotlightSettings();
  ok(alerts.length === 1 && calls('saveSpotlight').length === 0, '編輯時結束日早於開始日：同樣擋下');
  cancelSpotlightEdit();

  // I. 預設值函式
  const d = spotlightRelistDefaults({ title: 'a', imageUrl: 'u', duration: 0, status: '停用' }, '2026-10-07', 6);
  ok(d.startDate === '2026-10-07' && d.endDate === '' && d.duration === 5 && d.status === '啟用' && d.priority === 7 && d.mediaType === 'image' && d.subtitle === '' && d.bulletPoints === '', '預設值函式：缺欄位不出錯（秒數 0 → 5、媒體類型 → image、順位 = 筆數 + 1）');

  // J. 跳脫
  reset(); state.spotlights = fresh(); renderAdminSpotlightsList();
  [...document.querySelectorAll('.sp-relist-btn')].find(b => b.closest('[class*="rounded-2xl"]').textContent.indexOf('惡意') >= 0).click();
  ok(!window.__rlpwn && $('spAdminFormTitle').querySelectorAll('img').length === 0 && $('spAdminFormTitle').textContent.indexOf('<img src=x') >= 0 && $('spForm-title').value.indexOf('<img src=x') >= 0, '含標籤的標題：表單標題以純文字顯示、欄位值原樣保留，不會執行或注入元素');
  cancelSpotlightEdit();

  // 還原
  window.callBackend = realCB; window.confirm = realConfirm; window.alert = realAlert; window.showToast = realToast; window.getTodayDateStr = realToday;
  state.spotlights = savedState.sp; state.adminPassword = savedState.pw; currentSpotlightIndex = savedState.idx; window.handleDataLoaded = realHandle;
  Object.keys(lsBackup).forEach(k => { try { if (lsBackup[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, lsBackup[k]); } catch (e) {} });
  try { renderSpotlightSection(); renderAdminSpotlightsList(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
