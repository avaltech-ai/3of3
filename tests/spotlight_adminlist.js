// 後台焦點活動列表的搜尋與分頁（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 以假資料與假的 callBackend 驗證：預設每頁 10 筆、最新建立在最上面、只剩「第 N 順位」下拉（沒有 ▲▼）且 N 永遠是真實順位、
// 狀態／輪播狀態／關鍵字／排序、分頁列（圖示按鈕）、每頁筆數記住、在排序／篩選／換頁後改順位仍正確、清除、空狀態、跳脫。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realCB = window.callBackend, realToast = window.showToast, realToday = window.getTodayDateStr;
  const saved = { sp: state.spotlights, pw: state.adminPassword, idx: currentSpotlightIndex };
  let lsBackup = {}; ['nobel_a_spotlights_list', 'nobel_a_adminlist_size_spotlights'].forEach(k => { try { lsBackup[k] = localStorage.getItem(k); } catch (e) {} });
  state.adminPassword = 'tok'; window.getTodayDateStr = function () { return '2026-10-07'; };
  let log = [], toasts = [];
  window.callBackend = function (a, p, okCb) { log.push({ action: a, payload: JSON.parse(JSON.stringify(p)) }); setTimeout(function () { okCb({ success: true, message: 'ok' }); }, 0); };
  window.showToast = function (m) { toasts.push(String(m)); };
  const $ = id => document.getElementById(id);
  const pad = n => ('0' + n).slice(-2);
  { let n = $('spAdminListContainer').parentElement; while (n && n !== document.body) { n.classList.remove('hidden'); n.style.display = ''; n = n.parentElement; } }

  // 25 筆（陣列位置＝輪播順位）；編號時間與順位不同（用 7 的倍數打散）
  const mk = () => Array.from({ length: 25 }, (_, i) => {
    const st = i % 5 === 0 ? '停用' : '啟用', g = i % 3;
    return { id: 'SP-' + (1791000000000 + ((i * 7) % 25) * 1000000), title: '活動' + pad(i), subtitle: i === 3 ? '副標題找我' : '', bulletPoints: i === 4 ? '【注意事項】請帶水壺' : '', mediaType: 'image', imageUrl: '', status: st, priority: i + 1, duration: 5,
      startDate: g === 1 ? '2026-11-01' : '2026-10-01', endDate: g === 2 ? '2026-09-01' : (g === 1 ? '2026-11-10' : '2026-10-31') };
  });
  const resetAll = () => { state.spotlights = mk(); adminLists.spotlights = { query: '', status: '', play: '', sort: 'new', page: 0, size: 10 }; try { localStorage.removeItem('nobel_a_adminlist_size_spotlights'); } catch (e) {} log = []; toasts = []; renderAdminSpotlightsList(); };
  const cards = () => [...document.querySelectorAll('#spAdminListContainer > div')].filter(c => c.querySelector('h5'));
  const titleOf = c => c.querySelector('h5').textContent;
  const titles = () => cards().map(titleOf);
  const pager = () => $('adminSpotlightsPager');
  const countText = () => { const c = pager().querySelector('.admin-pager-count'); return c ? c.textContent : null; };
  const pageText = () => { const c = pager().querySelector('.admin-pager-page'); return c ? c.textContent : null; };
  const btn = w => pager().querySelector('button[data-go="' + w + '"]');
  const posOf = t => state.spotlights.findIndex(s => s.title === t) + 1;
  const pick = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
  const type = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  const cardOf = t => cards().find(c => titleOf(c) === t);
  const sel = t => cardOf(t).querySelector('.sp-order-select');
  const changePos = (t, n) => { const s = sel(t); s.value = String(n); s.onchange({ target: s }); };
  const idNum = s => Number(s.id.replace('SP-', ''));
  const play = s => s.status === '停用' ? 'off' : (s.startDate > '2026-10-07' ? 'scheduled' : (s.endDate < '2026-10-07' ? 'ended' : 'playing'));

  resetAll();
  const all = mk();
  const expNew = all.slice().sort((a, b) => idNum(b) - idNum(a)).map(s => s.title);

  // A. 預設
  ok(cards().length === 10 && countText() === '共 25 筆' && pageText() === '1 / 3', '預設每頁 10 筆、共 25 筆、1 / 3');
  ok(titles().join(',') === expNew.slice(0, 10).join(','), '最新建立（依編號時間）在最上面，第 1 頁是最新的 10 筆');
  ok($('spAdminCountBadge').textContent === '共 25 個活動', '標題旁「共 25 個活動」');
  ok(document.querySelectorAll('.sp-up-btn, .sp-down-btn').length === 0 && !/[▲▼]/.test($('spAdminListContainer').textContent), '▲▼ 按鈕已移除');
  ok(cards().every(c => c.querySelectorAll('.sp-order-select').length === 1 && c.querySelector('.sp-order-select').options.length === 25), '每列只有「第 N 順位」下拉，共 25 個選項');
  ok(cards().every(c => Number(c.querySelector('.sp-order-select').value) === posOf(titleOf(c))), '每列下拉顯示的 N 就是真實順位（與列表排列順序無關）');
  ok(cards().some(c => posOf(titleOf(c)) !== cards().indexOf(c) + 1), '（確認前提：列表排列順序與真實順位確實不同）');
  const navBtns = [...pager().querySelectorAll('.admin-pager-nav button')];
  ok(navBtns.map(b => b.getAttribute('data-go')).join(',') === 'first,prev,next,last' && navBtns.every(b => b.textContent.trim() === '' && !!b.querySelector('svg')), '分頁列：四個圖示按鈕、沒有文字');
  ok(cards().every(c => !!c.querySelector('.sp-edit-btn') && !!c.querySelector('.sp-relist-btn') && !!c.querySelector('.sp-del-btn')), '「編輯」「再次上架」「刪除」仍在');

  // B. 分頁
  btn('next').click(); ok(pageText() === '2 / 3' && titles().join(',') === expNew.slice(10, 20).join(','), '下一頁：第 11～20 筆');
  btn('last').click(); ok(pageText() === '3 / 3' && cards().length === 5, '最末頁 5 筆');
  btn('first').click(); ok(pageText() === '1 / 3', '第一頁');
  const setSize = v => { const s = pager().querySelector('.admin-pager-size'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); };
  setSize('20'); ok(cards().length === 20 && pageText() === '1 / 2' && localStorage.getItem('nobel_a_adminlist_size_spotlights') === '20', '每頁 20：2 頁，並記住');
  setSize('0'); ok(cards().length === 25 && pager().querySelector('.admin-pager-nav') === null, '全部：25 筆、不分頁');
  setSize('10');

  // C. 狀態、輪播狀態
  const expOff = all.filter(s => s.status === '停用').length;
  pick('adminSpotlightsStatus', '停用'); ok(countText() === '符合 ' + expOff + ' 筆（共 25 筆）' && cards().every(c => /已停用/.test(c.textContent)), '狀態＝停用：' + expOff + ' 筆，都顯示「已停用」');
  ok($('adminSpotlightsClear').disabled === false, '套用狀態篩選後「清除篩選」啟用');
  pick('adminSpotlightsStatus', '啟用'); ok(countText() === '符合 ' + (25 - expOff) + ' 筆（共 25 筆）' && cards().every(c => !/已停用/.test(c.textContent)), '狀態＝啟用：' + (25 - expOff) + ' 筆');
  adminListClear('spotlights');
  [['playing', '播映中'], ['scheduled', '尚未上架'], ['ended', '已過期下架']].forEach(pr => {
    const exp = all.filter(s => play(s) === pr[0]).length;
    pick('adminSpotlightsPlay', pr[0]);
    ok($('adminSpotlightsClear').disabled === false, '套用輪播狀態篩選（' + pr[1] + '）後「清除篩選」啟用');
    ok(countText() === '符合 ' + exp + ' 筆（共 25 筆）' && cards().every(c => c.textContent.indexOf(pr[1]) >= 0), '輪播狀態＝' + pr[1] + '：' + exp + ' 筆，每列標籤都是「' + pr[1] + '」');
  });
  pick('adminSpotlightsStatus', '停用'); ok(cards().length === 0 && /沒有符合條件的焦點活動/.test($('spAdminListContainer').textContent) && countText() === '符合 0 筆（共 25 筆）', '停用的活動不屬於播映中／排程中／已下架：兩者同時套用 → 沒有符合');
  adminListClear('spotlights');

  // D. 關鍵字與排序
  type('adminSpotlightsSearch', '活動07'); ok(titles().join(',') === '活動07', '關鍵字：標題');
  type('adminSpotlightsSearch', '副標題找我'); ok(titles().join(',') === '活動03', '關鍵字：副標題');
  type('adminSpotlightsSearch', '水壺'); ok(titles().join(',') === '活動04', '關鍵字：重點');
  type('adminSpotlightsSearch', '');
  pick('adminSpotlightsSort', 'order'); ok(titles().join(',') === Array.from({ length: 10 }, (_, i) => '活動' + pad(i)).join(',') && $('adminSpotlightsClear').disabled === false, '排序「輪播順序」：活動00～活動09（依真實順位）；排序也算篩選，可清除');
  adminListClear('spotlights'); ok(titles().join(',') === expNew.slice(0, 10).join(',') && $('adminSpotlightsClear').disabled === true && $('adminSpotlightsSort').value === 'new', '清除篩選：回到最新建立、按鈕停用');

  // E. 改順位（最新建立排序下）
  resetAll();
  const target = expNew[0];            // 列表第 1 筆（最新建立）
  changePos(target, 2);
  const mv = log.filter(x => x.action === 'updateSpotlightsOrder');
  ok(posOf(target) === 2 && state.spotlights.map(s => s.priority).join(',') === Array.from({ length: 25 }, (_, i) => i + 1).join(','), '在「最新建立」排序下改順位：該活動移到第 2 順位，所有順位重新編為 1～25');
  ok(mv.length === 1 && mv[0].payload.orderList.length === 25 && mv[0].payload.orderList[1].id === state.spotlights[1].id && mv[0].payload.orderList[1].priority === 2 && mv[0].payload.password === 'tok', '同步到後端：送出完整順位清單與 token');
  ok(titles().join(',') === expNew.slice(0, 10).join(',') && Number(sel(target).value) === 2, '列表排列仍是最新建立；該列下拉更新為「第 2 順位」');
  ok(cards().every(c => Number(c.querySelector('.sp-order-select').value) === posOf(titleOf(c))), '改完後每一列下拉顯示的仍是真實順位');
  ok(toasts.some(t => /調為第 2 順位/.test(t)), '提示「已將…調為第 2 順位」');

  // F. 篩選＋第 2 頁時改順位
  resetAll(); pick('adminSpotlightsPlay', 'ended');
  const t2 = titles()[0];
  changePos(t2, 25);
  ok(posOf(t2) === 25 && state.spotlights[24].title === t2, '套用「已下架」篩選後改順位：移到真實的第 25 順位（不是篩選結果裡的位置）');
  resetAll(); btn('next').click(); const t3 = titles()[0];
  changePos(t3, 1);
  ok(posOf(t3) === 1 && pageText() === '2 / 3' && cards().length === 10, '在第 2 頁改順位：真實順位更新、仍停留在第 2 頁');

  // G. 空狀態與跳脫
  state.spotlights = []; adminLists.spotlights = { query: '', status: '', play: '', sort: 'new', page: 0, size: 10 }; renderAdminSpotlightsList();
  ok(/尚無任何焦點活動/.test($('spAdminListContainer').textContent) && pager().children.length === 0, '完全沒有資料：原本的提示，不顯示分頁列');
  state.spotlights = mk(); state.spotlights[0].title = '<img src=x onerror="window.__splpwn=1">惡意'; state.spotlights[0].subtitle = '<b>粗</b>'; renderAdminSpotlightsList(); type('adminSpotlightsSearch', '<img');
  ok(!window.__splpwn && cards().length === 1 && $('spAdminListContainer').querySelectorAll('img[src="x"], b').length === 0 && cards()[0].textContent.indexOf('<img src=x') >= 0, '含標籤的標題：以純文字顯示、可搜尋、不會執行或注入元素');

  window.callBackend = realCB; window.showToast = realToast; window.getTodayDateStr = realToday;
  state.spotlights = saved.sp; state.adminPassword = saved.pw; currentSpotlightIndex = saved.idx; window.handleDataLoaded = realHandle;
  adminLists.spotlights = { query: '', status: '', play: '', sort: 'new', page: 0, size: adminListStoredSize('spotlights') };
  Object.keys(lsBackup).forEach(k => { try { if (lsBackup[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, lsBackup[k]); } catch (e) {} });
  try { renderSpotlightSection(); renderAdminSpotlightsList(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
