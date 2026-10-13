// 後台「每日菜單」表單模式測試（瀏覽器）：以日期為識別——沒有菜單＝新增、已有菜單＝編輯（覆蓋前列差異確認）、複製到其他日期（新日期已有菜單時警告覆蓋）、換日期的未儲存防呆。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { menus: state.menus, pwd: state.adminPassword, ls: (function () { try { return localStorage.getItem('nobel_a_menus_custom'); } catch (e) { return null; } })() };
  const real = { confirm: window.confirm, cb: window.callBackend, toast: window.showToast, load: window.loadAppData };
  const $ = id => document.getElementById(id);
  const toasts = [], cbs = [], confirms = []; let answer = true;
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.showToast = m => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  window.callBackend = (a, p, okCb) => { cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true }); };
  state.adminPassword = 'tok'.repeat(15);
  const mk = (date, main) => ({ date: date, morningSnack: '饅頭', fruit: '香蕉', lunchStaple: '白飯', lunchMain: main, lunchSide1: '炒蛋', lunchSide2: '青菜', lunchSoup: '玉米濃湯', afternoonSnack: '雞肉粥', note: '', nutrients: 'x' });
  const reset = () => { toasts.length = 0; cbs.length = 0; confirms.length = 0; answer = true; state.menus = [mk('2026-10-07', '雞肉'), mk('2026-10-08', '豬排')]; $('menuForm-date').value = ''; loadMenuForSelectedDate(); };
  const cls = (el, c) => el.className.split(/\s+/).indexOf(c) >= 0;
  const txt = () => $('menuFormModeText').textContent;
  const vis = el => !el.classList.contains('hidden');
  const pick = d => { $('menuForm-date').value = d; loadMenuForSelectedDate(); };
  const saveCall = () => cbs.filter(c => c.a === 'saveMenu')[0];
  const save = () => handleSaveMenu({ preventDefault() {} });
  reset();

  // A. 還沒選日期
  ok(/新增菜單：請先選擇日期/.test(txt()) && cls($('menuFormCard'), 'border-emerald-200') && $('saveMenuBtn').textContent.trim() === '➕ 新增這天菜單' && !vis($('menuCopyBtn')), '還沒選日期：綠色橫幅「新增菜單：請先選擇日期」、按鈕「➕ 新增這天菜單」、沒有「複製到其他日期」');
  save(); ok(cbs.length === 0 && /請先選擇菜單日期/.test(toasts[toasts.length - 1]), '沒選日期就存：擋下並提示');

  // B. 選到沒有菜單的日期
  pick('2026-10-20');
  ok(/新增 2026-10-20 的菜單：這一天目前沒有菜單/.test(txt()) && cls($('menuFormCard'), 'border-emerald-200') && $('menuForm-fruit').value === '當季水果' && $('menuForm-lunchStaple').value === '糙白米飯' && $('menuForm-lunchMain').value === '', '沒有菜單的日期：綠色「新增」、帶入預設內容（當季水果、糙白米飯、有機蔬菜）');

  // C. 選到已有菜單的日期
  pick('2026-10-07');
  ok(/正在編輯 2026-10-07 的既有菜單：按「更新這天菜單」會覆蓋這一天原本的內容/.test(txt()) && cls($('menuFormCard'), 'border-amber-400') && !cls($('menuFormCard'), 'border-emerald-200') && $('saveMenuBtn').textContent.trim() === '💾 更新這天菜單' && cls($('saveMenuBtn'), 'bg-amber-500') && vis($('menuCopyBtn')), '已有菜單的日期：橘色橫幅「正在編輯 2026-10-07 的既有菜單…會覆蓋」、按鈕「💾 更新這天菜單」、出現「📄 複製到其他日期」');
  ok($('menuForm-lunchMain').value === '雞肉' && $('menuForm-morningSnack').value === '饅頭' && /已載入該日菜單/.test(toasts.join('|')), '帶入該日菜單內容並提示「已載入該日菜單」');

  // D. 沒有變更
  save(); ok(cbs.length === 0 && confirms.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]), '沒改任何東西就更新：提示「沒有任何變更」，不確認、不送出');

  // E. 有變更
  $('menuForm-lunchMain').value = '魚排'; $('menuForm-note').value = '今日慶生';
  answer = false; save();
  ok(confirms.length === 1 && /即將修改 2026-10-07 的既有菜單/.test(confirms[0]) && /主菜：雞肉 → 魚排/.test(confirms[0]) && /備註：（空白） → 今日慶生/.test(confirms[0]), '更新前列出差異（主菜 雞肉 → 魚排、備註 空白 → 今日慶生）');
  ok(cbs.length === 0 && state.menus.find(m => m.date === '2026-10-07').lunchMain === '雞肉' && $('menuForm-lunchMain').value === '魚排', '按取消：沒送出、原菜單不變、表單內容保留');
  answer = true; save();
  ok(!!saveCall() && saveCall().p.data.date === '2026-10-07' && saveCall().p.data.lunchMain === '魚排' && state.menus.length === 2 && state.menus.find(m => m.date === '2026-10-07').lunchMain === '魚排', '確定更新：以該日送出、菜單數不變、內容已更新');
  ok(/已更新 2026-10-07 的菜單/.test(toasts.join('|')) && /正在編輯 2026-10-07/.test(txt()), '提示「已更新 2026-10-07 的菜單」；表單仍是編輯該日');
  confirms.length = 0; cbs.length = 0; save(); ok(confirms.length === 0 && cbs.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]), '儲存後再按更新：視為沒有變更（基準已更新）');

  // F. 新增
  reset(); pick('2026-10-20'); $('menuForm-lunchMain').value = '雞腿'; save();
  ok(confirms.length === 0 && !!saveCall() && saveCall().p.data.date === '2026-10-20' && state.menus.length === 3 && /已新增 2026-10-20 的菜單/.test(toasts.join('|')) && /正在編輯 2026-10-20/.test(txt()), '新日期存檔：不跳確認、菜單數 +1、提示「已新增 2026-10-20 的菜單」，之後表單轉為編輯該日');

  // G. 換日期的防呆
  reset(); pick('2026-10-07'); pick('2026-10-08');
  ok(confirms.length === 0 && $('menuForm-lunchMain').value === '豬排' && /正在編輯 2026-10-08/.test(txt()), '沒有改動時直接換到另一天：不跳確認，載入那天的菜單');
  $('menuForm-lunchMain').value = '改到一半'; answer = false; $('menuForm-date').value = '2026-10-07'; loadMenuForSelectedDate();
  ok(confirms.length === 1 && /尚未儲存/.test(confirms[0]) && $('menuForm-date').value === '2026-10-08' && $('menuForm-lunchMain').value === '改到一半', '改到一半換日期：先問；按取消則日期還原、內容保留（不會被另一天的菜單蓋掉）');
  answer = true; $('menuForm-date').value = '2026-10-07'; loadMenuForSelectedDate(); ok($('menuForm-lunchMain').value === '雞肉' && /正在編輯 2026-10-07/.test(txt()), '按確定：才載入那天的菜單');
  $('menuForm-lunchMain').value = '又改了'; confirms.length = 0; answer = false; loadMenuForSelectedDate(true);
  ok(confirms.length === 1 && $('menuForm-lunchMain').value === '又改了', '按「載入該日菜單」：有未儲存內容時也先確認，取消則保留');
  answer = true; loadMenuForSelectedDate(true); ok($('menuForm-lunchMain').value === '雞肉', '確定才重新載入原內容');

  // H. 複製到其他日期（新日期沒有菜單）
  reset(); pick('2026-10-07'); $('menuForm-lunchMain').value = '複製用的主菜'; copyMenuToAnotherDate();
  ok($('menuForm-date').value === '' && $('menuForm-lunchMain').value === '複製用的主菜' && /以 2026-10-07 的菜單為範本新增/.test(txt()) && /2026-10-07 原本的菜單不會改變/.test(txt()) && cls($('menuFormCard'), 'border-sky-300') && $('saveMenuBtn').textContent.trim() === '➕ 存成這天的菜單' && !vis($('menuCopyBtn')), '複製：日期清空、保留目前表單內容；藍色橫幅「以 2026-10-07 的菜單為範本…原本的菜單不會改變」；沒有「複製」鈕');
  save(); ok(cbs.length === 0 && /請先選擇要存到的日期/.test(toasts[toasts.length - 1]), '複製後沒選日期就存：擋下並提示');
  pick('2026-10-21');
  ok($('menuForm-lunchMain').value === '複製用的主菜' && /以 2026-10-07 的菜單為範本新增/.test(txt()) && txt().indexOf('⚠️') < 0 && confirms.length === 0, '複製中選新日期（沒有菜單）：不重新載入、內容保留、沒有覆蓋警告');
  save(); ok(confirms.length === 0 && !!saveCall() && saveCall().p.data.date === '2026-10-21' && saveCall().p.data.lunchMain === '複製用的主菜' && state.menus.length === 3, '存檔：新日期、複製的內容、菜單數 +1，不跳確認');
  ok(state.menus.find(m => m.date === '2026-10-07').lunchMain === '雞肉' && /已新增 2026-10-21 的菜單/.test(toasts.join('|')) && /正在編輯 2026-10-21/.test(txt()), '原本 10-07 的菜單不變；提示「已新增」；表單轉為編輯 10-21');

  // I. 複製到已有菜單的日期
  reset(); pick('2026-10-07'); $('menuForm-lunchMain').value = '要複製的'; copyMenuToAnotherDate(); pick('2026-10-08');
  ok(/⚠️ 2026-10-08 已經有菜單，儲存會覆蓋它/.test(txt()) && $('menuForm-lunchMain').value === '要複製的', '複製中選到已有菜單的日期：橫幅警告「已經有菜單，儲存會覆蓋它」，內容仍是複製來的');
  answer = false; save();
  ok(confirms.length === 1 && /2026-10-08 已經有菜單，儲存會覆蓋它/.test(confirms[0]) && /主菜：豬排 → 要複製的/.test(confirms[0]) && /覆蓋/.test(confirms[0]) && cbs.length === 0 && state.menus.find(m => m.date === '2026-10-08').lunchMain === '豬排', '儲存前確認覆蓋，並列出將被覆蓋的差異（豬排 → 要複製的）；按取消不送出、10-08 不變');
  answer = true; save();
  ok(!!saveCall() && saveCall().p.data.date === '2026-10-08' && state.menus.length === 2 && state.menus.find(m => m.date === '2026-10-08').lunchMain === '要複製的' && state.menus.find(m => m.date === '2026-10-07').lunchMain === '雞肉' && /已更新 2026-10-08 的菜單/.test(toasts.join('|')), '確定覆蓋：10-08 被更新、10-07 不變、提示「已更新 2026-10-08 的菜單」');
  reset(); pick('2026-10-07'); copyMenuToAnotherDate(); pick('2026-10-08'); state.menus.find(m => m.date === '2026-10-08').lunchMain = '雞肉'; confirms.length = 0; save();
  ok(confirms.length === 0 && cbs.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]), '複製到「內容完全相同」的日期：沒有差異，提示沒有變更、不送出');

  // J. 刪除與清空日期
  reset(); pick('2026-10-07'); answer = true; handleDeleteMenu();
  ok(state.menus.length === 1 && cbs.some(c => c.a === 'deleteMenu') && /新增 2026-10-07 的菜單：這一天目前沒有菜單/.test(txt()) && cls($('menuFormCard'), 'border-emerald-200') && $('menuForm-fruit').value === '當季水果', '刪除這天菜單後：表單回到「新增」（預設內容），不會殘留舊內容');
  pick('2026-10-08'); $('menuForm-date').value = ''; loadMenuForSelectedDate(); ok(/新增菜單：請先選擇日期/.test(txt()), '清掉日期：回到「請先選擇日期」');

  reset(); window.confirm = real.confirm; window.callBackend = real.cb; window.showToast = real.toast; window.loadAppData = real.load;
  state.menus = saved.menus; state.adminPassword = saved.pwd; window.handleDataLoaded = realHandle;
  try { if (saved.ls === null) localStorage.removeItem('nobel_a_menus_custom'); else localStorage.setItem('nobel_a_menus_custom', saved.ls); } catch (e) {}
  try { renderCalendar(); renderSelectedDayDetails(state.selectedDateStr); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
