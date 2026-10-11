// 後台焦點活動列表（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：預設只顯示「播映中」、預設排序「輪播順序」、清除篩選回到預設；順位只屬於播映中的活動（下拉選項 1～N、其他顯示「未排順位／已取消順位」）；
// 到期自動取消、後面補位；改順位寫回（播映中 1～N、其餘清空）；儲存與刪除後整理；搜尋、分頁、跳脫。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realCB = window.callBackend, realToast = window.showToast, realToday = window.getTodayDateStr, realConfirm = window.confirm;
  const saved = { sp: state.spotlights, pw: state.adminPassword, idx: currentSpotlightIndex };
  let lsBackup = {}; ['nobel_a_spotlights_list', 'nobel_a_adminlist_size_spotlights', 'nobel_a_spotlight_custom'].forEach(k => { try { lsBackup[k] = localStorage.getItem(k); } catch (e) {} });
  state.adminPassword = 'tok'; window.getTodayDateStr = function () { return '2026-10-07'; };
  let log = [], toasts = [];
  window.callBackend = function (a, p, okCb) { log.push({ action: a, payload: JSON.parse(JSON.stringify(p)) }); setTimeout(function () { okCb({ success: true, message: 'ok' }); }, 0); };
  window.showToast = function (m) { toasts.push(String(m)); };
  window.confirm = function () { return true; };
  const $ = id => document.getElementById(id);
  const pad = n => ('0' + n).slice(-2);
  { let n = $('spAdminListContainer').parentElement; while (n && n !== document.body) { n.classList.remove('hidden'); n.style.display = ''; n = n.parentElement; } }

  // 25 筆：i%5==0 停用；其餘 i%3==0 播映中、==1 排程中、==2 已下架。初始順位（i+1）是「過期的舊值」，有空號、也有已下架／排程中的殘留。
  const mk = () => Array.from({ length: 25 }, (_, i) => {
    const st = i % 5 === 0 ? '停用' : '啟用', g = i % 3;
    return { id: 'SP-' + (1791000000000 + ((i * 7) % 25) * 1000000), title: '活動' + pad(i), subtitle: i === 3 ? '副標題找我' : '', bulletPoints: i === 4 ? '【注意事項】請帶水壺' : '', mediaType: 'image', imageUrl: '', status: st, priority: i + 1, duration: 5,
      startDate: g === 1 ? '2026-11-01' : '2026-10-01', endDate: g === 2 ? '2026-09-01' : (g === 1 ? '2026-11-10' : '2026-10-31') };
  });
  const PLAYING = [3, 6, 9, 12, 18, 21, 24];            // 播映中的 i（依初始順位 i+1 由小到大 → 順位 1～7）
  const titleOfI = i => '活動' + pad(i);
  const defaults = () => ({ query: '', status: '', play: 'playing', sort: 'order', page: 0, size: 10 });
  const resetAll = () => { spotlightOrderChecked = true; state.spotlights = mk(); state.spotlights.sort(spotlightOrderCompare); adminLists.spotlights = defaults(); try { localStorage.removeItem('nobel_a_adminlist_size_spotlights'); } catch (e) {} log = []; toasts = []; renderAdminSpotlightsList(); };
  const cards = () => [...document.querySelectorAll('#spAdminListContainer > div')].filter(c => c.querySelector('h5'));
  const titleOf = c => c.querySelector('h5').textContent;
  const titles = () => cards().map(titleOf);
  const pager = () => $('adminSpotlightsPager');
  const countText = () => { const c = pager().querySelector('.admin-pager-count'); return c ? c.textContent : null; };
  const pick = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
  const type = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  const cardOf = t => cards().find(c => titleOf(c) === t);
  const sel = t => cardOf(t).querySelector('.sp-order-select');
  const rankText = t => { const s = sel(t); return s ? Number(s.value) : null; };
  const spOf = t => state.spotlights.find(s => s.title === t);
  const orderCalls = () => log.filter(x => x.action === 'updateSpotlightsOrder');
  const play = s => s.status === '停用' ? 'off' : (s.startDate > '2026-10-07' ? 'scheduled' : (s.endDate < '2026-10-07' ? 'ended' : 'playing'));

  resetAll();

  // A. 預設：只顯示播映中、依輪播順序
  ok($('adminSpotlightsPlay').value === 'playing' && $('adminSpotlightsSort').value === 'order' && $('adminSpotlightsStatus').value === '', '預設篩選：輪播狀態＝播映中、排序＝輪播順序');
  ok(countText() === '符合 7 筆（共 25 筆）' && cards().length === 7, '預設只列出播映中的 7 筆（共 25 筆）');
  ok(titles().join(',') === PLAYING.map(titleOfI).join(','), '依輪播順序排列（順位 1～7）');
  ok($('adminSpotlightsClear').disabled === true, '預設狀態：「清除篩選」停用（沒有偏離預設）');
  ok($('spAdminCountBadge').textContent === '共 25 個活動', '標題旁「共 25 個活動」不受篩選影響');
  ok(document.querySelectorAll('.sp-up-btn, .sp-down-btn').length === 0, '沒有 ▲▼ 按鈕');

  // B. 順位：下拉 1～N，顯示的就是目前播映中的順位（舊的殘留順位值不影響）
  ok(cards().every(c => c.querySelectorAll('.sp-order-select').length === 1 && c.querySelector('.sp-order-select').options.length === 7), '每個播映中的活動有順位下拉，選項只有第 1～7 順位（不是全部 25 個）');
  ok(PLAYING.every((i, k) => rankText(titleOfI(i)) === k + 1), '下拉顯示的順位是連續的 1～7（原本的舊順位 4、7、10、13、19、22、25 已自動補成連續）');
  ok(cards().every(c => !c.querySelector('.sp-no-rank')), '播映中的活動不會顯示「未排順位」');

  // C. 沒有順位的活動
  pick('adminSpotlightsPlay', '');
  ok(countText() === '共 25 筆' && cards().length === 10, '輪播狀態改選「全部輪播狀態」：25 筆分頁');
  ok($('adminSpotlightsClear').disabled === false, '偏離預設後「清除篩選」啟用');
  const setSizeAll = () => { const s = pager().querySelector('.admin-pager-size'); s.value = '0'; s.dispatchEvent(new Event('change', { bubbles: true })); };
  setSizeAll();
  const lab = t => { const c = cardOf(t); const x = c.querySelector('.sp-no-rank'); return x ? x.textContent : null; };
  const firstOf = f => mk().findIndex((s, i) => f(s, i));
  const iEnded = firstOf((s, i) => play(s) === 'ended'), iSched = firstOf((s, i) => play(s) === 'scheduled'), iOff = firstOf((s, i) => play(s) === 'off');
  ok(lab(titleOfI(iEnded)) === '已取消順位' && !sel(titleOfI(iEnded)), '已下架的活動：沒有順位下拉，顯示「已取消順位」');
  ok(/未排順位（開播後排最後）/.test(lab(titleOfI(iSched))) && !sel(titleOfI(iSched)), '排程中的活動：沒有下拉，顯示「未排順位（開播後排最後）」');
  ok(lab(titleOfI(iOff)) === '未排順位' && !sel(titleOfI(iOff)), '停用的活動：沒有下拉，顯示「未排順位」');
  ok(cards().filter(c => c.querySelector('.sp-order-select')).length === 7 && cards().filter(c => c.querySelector('.sp-no-rank')).length === 18, '全部 25 筆：7 筆有順位下拉、18 筆沒有順位');
  adminListClear('spotlights');
  ok($('adminSpotlightsPlay').value === 'playing' && $('adminSpotlightsSort').value === 'order' && cards().length === 7 && $('adminSpotlightsClear').disabled === true, '「清除篩選」回到預設（播映中、輪播順序），不是「全部」');
  pick('adminSpotlightsSort', 'new');
  ok($('adminSpotlightsClear').disabled === false, '改排序也算偏離預設');
  adminListClear('spotlights');

  // D. 改順位：寫回播映中 1～N、其餘清空
  resetAll();
  const t4 = titleOfI(PLAYING[3]);            // 目前第 4 順位
  const sel4 = sel(t4); sel4.value = '1'; sel4.onchange({ target: sel4 });
  ok(titles().join(',') === [PLAYING[3]].concat(PLAYING.filter((_, k) => k !== 3)).map(titleOfI).join(','), '把第 4 順位移到第 1：列表立即依新順位排列，其餘依序往後');
  ok(PLAYING.map(i => rankText(titleOfI(i))).sort().join(',') === '1,2,3,4,5,6,7' && rankText(t4) === 1, '順位仍是連續且不重複的 1～7');
  const oc = orderCalls();
  ok(oc.length === 1 && oc[0].payload.orderList.length === 25 && oc[0].payload.password === 'tok', '同步到試算表：送出整份順位清單（25 筆）與 token');
  const pl = oc[0].payload.orderList;
  const byId = Object.fromEntries(pl.map(x => [x.id, x.priority]));
  ok(state.spotlights.filter(s => play(s) === 'playing').every(s => Number.isInteger(byId[s.id]) && byId[s.id] >= 1 && byId[s.id] <= 7) && new Set(state.spotlights.filter(s => play(s) === 'playing').map(s => byId[s.id])).size === 7, '清單裡播映中的 7 筆是 1～7');
  ok(state.spotlights.filter(s => play(s) !== 'playing').every(s => byId[s.id] === ''), '清單裡已下架、排程中、停用的 18 筆順位都是空白（取消順位）');
  await wait(60);
  ok(toasts.some(t => /調為第 1 順位/.test(t)), '提示「已將…調為第 1 順位」');
  ok(state.spotlights.filter(s => play(s) !== 'playing').every(s => spotlightPriorityOrNone(s.priority) === ''), '本機：沒有順位的活動順位已清空');

  // D2. 不是播映中的活動不能設定順位（保險；介面本來就沒有下拉）
  resetAll(); log = []; toasts = [];
  moveSpotlightToRank(mk()[iEnded].id, 1); await wait(40);
  ok(orderCalls().length === 0 && toasts.some(t => /只有播映中的焦點活動才能設定順位/.test(t)), '對已下架的活動呼叫設定順位：提示「只有播映中的焦點活動才能設定順位」，不寫回');

  // E. 到期自動取消、後面補位
  resetAll();
  const expiring = titleOfI(PLAYING[1]);       // 第 2 順位
  spOf(expiring).endDate = '2026-10-06';        // 昨天到期
  renderAdminSpotlightsList();
  ok(countText() === '符合 6 筆（共 25 筆）' && titles().indexOf(expiring) === -1, '第 2 順位的活動到期下架：從「播映中」清單消失（6 筆）');
  ok(titles().map((t, k) => rankText(t)).join(',') === '1,2,3,4,5,6' && cards().every(c => c.querySelector('.sp-order-select').options.length === 6), '其餘 6 筆自動補位成連續的 1～6，下拉選項也變成 1～6');
  pick('adminSpotlightsPlay', 'ended');
  ok(cardOf(expiring) && !sel(expiring) && /已取消順位/.test(cardOf(expiring).textContent), '切到「已下架」：剛到期的那筆顯示「已取消順位」');
  pick('adminSpotlightsPlay', 'playing');

  // F. 排程中的活動開播：排在最後
  resetAll();
  normalizeSpotlightOrder(false);                 // 管理員整理過順位後（排程中的活動沒有順位）
  const sch = titleOfI(iSched);
  spOf(sch).startDate = '2026-10-07'; spOf(sch).endDate = '2026-10-20';   // 今天開播
  renderAdminSpotlightsList();
  ok(countText() === '符合 8 筆（共 25 筆）' && rankText(sch) === 8, '排程中的活動到了開始日：變成播映中，自動排在最後（第 8 順位）');

  // G. 刪除後補位並寫回
  resetAll(); log = [];
  const del = titleOfI(PLAYING[0]);
  cardOf(del).querySelector('.sp-del-btn').onclick(); await wait(80);
  ok(titles().length === 6 && titles().map(t => rankText(t)).join(',') === '1,2,3,4,5,6', '刪除第 1 順位的活動：其餘自動補位成 1～6');
  ok(log.some(x => x.action === 'deleteSpotlight') && orderCalls().length === 1 && orderCalls()[0].payload.orderList.filter(o => o.priority !== '').length === 6, '刪除成功後把整理後的順位寫回試算表（播映中 6 筆為 1～6）');

  // H. 儲存：新的播映中活動排在最後；改成已下架則取消順位
  resetAll(); log = [];
  finalizeSaveSpotlight({ id: 'SP-NEW', title: '全新活動', subtitle: '', mediaType: 'image', imageUrl: '', bulletPoints: '', startDate: '2026-10-01', endDate: '2026-10-31', duration: 5, priority: '', status: '啟用' });
  await wait(80);
  const sv = log.find(x => x.action === 'saveSpotlight');
  ok(!!sv && sv.payload.data.priority === 8 && rankText('全新活動') === 8 && countText() === '符合 8 筆（共 26 筆）', '新增的播映中活動：自動排在最後（第 8 順位），儲存時 priority=8');
  ok(orderCalls().length === 1, '儲存成功後再把整份整理後的順位寫回（其他活動若有變動）');
  resetAll(); log = [];
  const edit = Object.assign({}, spOf(titleOfI(PLAYING[0])), { endDate: '2026-10-01' });   // 把第 1 順位的活動改成已到期
  const edit2 = Object.assign({}, edit, { endDate: '2026-09-30' });
  finalizeSaveSpotlight(edit2); await wait(80);
  const sv2 = log.find(x => x.action === 'saveSpotlight');
  ok(sv2.payload.data.priority === '' && countText() === '符合 6 筆（共 25 筆）' && titles().map(t => rankText(t)).join(',') === '1,2,3,4,5,6', '把播映中的活動改成已到期後儲存：它的順位清空（priority=\'\'），其餘補位成 1～6');
  resetAll(); log = [];
  const dis = Object.assign({}, spOf(titleOfI(PLAYING[2])), { status: '停用' });
  finalizeSaveSpotlight(dis); await wait(80);
  ok(log.find(x => x.action === 'saveSpotlight').payload.data.priority === '' && countText() === '符合 6 筆（共 25 筆）', '把播映中的活動改為停用：取消順位，其餘補位');

  // H2. 管理員第一次畫列表：自動整理並寫回（只有有變動才寫）
  resetAll(); log = []; spotlightOrderChecked = false;
  renderAdminSpotlightsList(); await wait(80);
  ok(orderCalls().length === 1 && orderCalls()[0].payload.orderList.filter(o => o.priority !== '').length === 7 && orderCalls()[0].payload.orderList.filter(o => o.priority === '').length === 18, '登入後第一次畫焦點列表：發現舊順位（有空號、已下架／排程中／停用還留著數字）→ 自動整理並寫回（播映中 1～7，其餘 18 筆清空）');
  ok(spotlightOrderChecked === true && titles().map(t => rankText(t)).join(',') === '1,2,3,4,5,6,7', '整理後畫面順位連續');
  log = []; renderAdminSpotlightsList(); await wait(40);
  ok(orderCalls().length === 0, '之後再畫列表不再重複整理');
  spotlightOrderChecked = false; log = []; renderAdminSpotlightsList(); await wait(40);
  ok(orderCalls().length === 0, '資料已整理好時，即使重新檢查也不會寫回（沒有變動就不寫）');
  resetAll(); log = []; spotlightOrderChecked = false; state.adminPassword = ''; renderAdminSpotlightsList(); await wait(40); state.adminPassword = 'tok';
  ok(orderCalls().length === 0 && spotlightOrderChecked === false, '沒有登入：不整理、不寫回');

  ok(/spotlightOrderChecked = false/.test(realHandle.toString()), '每次載入新資料（handleDataLoaded）後，會重新整理一次順位');

  // I. 搜尋與分頁仍可用
  resetAll(); pick('adminSpotlightsPlay', ''); setSizeAll();
  type('adminSpotlightsSearch', '副標題找我'); ok(titles().join(',') === '活動03', '關鍵字：副標題');
  type('adminSpotlightsSearch', '水壺'); ok(titles().join(',') === '活動04', '關鍵字：重點');
  type('adminSpotlightsSearch', ''); adminListClear('spotlights');
  pick('adminSpotlightsStatus', '停用'); ok(countText() === '符合 0 筆（共 25 筆）' || cards().every(c => /已停用/.test(c.textContent)), '狀態＝停用（預設為播映中，停用的不屬於播映中）');
  pick('adminSpotlightsPlay', ''); ok(countText() === '符合 5 筆（共 25 筆）' && cards().every(c => /已停用/.test(c.textContent)), '輪播狀態改全部、狀態＝停用：5 筆');
  adminListClear('spotlights');

  // J. 跳脫
  resetAll(); state.spotlights.find(s => s.title === titleOfI(PLAYING[0])).title = '<img src=x onerror="window.__splpwn=1">惡意'; renderAdminSpotlightsList();
  ok(!window.__splpwn && $('spAdminListContainer').querySelectorAll('img[src="x"]').length === 0 && cards()[0].textContent.indexOf('<img src=x') >= 0, '含標籤的標題：以純文字顯示，不會執行或注入元素');

  window.callBackend = realCB; window.showToast = realToast; window.getTodayDateStr = realToday; window.confirm = realConfirm;
  state.spotlights = saved.sp; state.adminPassword = saved.pw; currentSpotlightIndex = saved.idx; window.handleDataLoaded = realHandle;
  adminLists.spotlights = { query: '', status: '', play: ADMIN_LIST_DEFAULTS.spotlights.play, sort: ADMIN_LIST_DEFAULTS.spotlights.sort, page: 0, size: adminListStoredSize('spotlights') };
  Object.keys(lsBackup).forEach(k => { try { if (lsBackup[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, lsBackup[k]); } catch (e) {} });
  try { renderSpotlightSection(); renderAdminSpotlightsList(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
