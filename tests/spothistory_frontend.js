// 「歷史焦點」介面測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 以假的焦點活動資料與固定的「今天」驗證：膠囊按鈕、開啟／關閉、只列最近一季已結束且非停用且不在輪播的活動、年月分段與排序、卡片內容、
// 搜尋、詳情與返回、影片、英文介面（月份、標題）、空狀態、ESC、點背景關閉、跳脫（含標籤的標題不會注入）。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realToday = window.getTodayDateStr, saved = { spot: state.spotlights, lang: state.lang, tm: state.textMap, idx: currentSpotlightIndex };
  window.getTodayDateStr = function () { return '2026-10-06'; };
  state.lang = 'zh-TW'; state.textMap = null;
  const sp = (id, start, end, extra) => Object.assign({ id: id, title: '標題' + id, subtitle: '日期：' + end.replace(/-/g, '/'), imageUrl: 'https://example.com/' + id + '.jpg', mediaType: 'image', tags: '標籤' + id + '甲,標籤' + id + '乙,標籤' + id + '丙', bulletPoints: '【注意事項】內容' + id + '\n一般說明' + id, startDate: start, endDate: end, duration: 5, priority: 1, status: '啟用' }, extra || {});
  const A = sp('A', '2026-10-01', '2026-10-31');
  const B = sp('B', '2026-09-10', '2026-09-20');
  const C = sp('C', '2026-09-01', '2026-09-05');
  const D = sp('D', '2026-08-10', '2026-08-15', { mediaType: 'video', imageUrl: 'https://www.youtube.com/watch?v=abc123' });
  const E = sp('E', '2026-07-01', '2026-07-06');
  const F = sp('F', '2026-06-20', '2026-07-05');
  const G = sp('G', '2026-08-25', '2026-09-01', { status: '停用' });
  const H = sp('H', '2026-11-01', '2026-11-30');
  const X = sp('X', '2026-09-21', '2026-09-25', { title: '<img src=x onerror="window.__histpwn=1">惡意標題', tags: '<b>粗體</b>,"><script>window.__histpwn=2<\/script>', bulletPoints: '【<i>x</i>】<img src=x onerror="window.__histpwn=3">' });
  const data = [A, B, C, D, E, F, G, H, X];
  state.spotlights = data;
  const $ = id => document.getElementById(id);
  const cards = () => [...document.querySelectorAll('#spotHistCards .spot-hist-card')];
  const cardIds = () => cards().map(c => c.getAttribute('data-id')).join(',');
  const heads = () => [...document.querySelectorAll('#spotHistCards h4')].map(h => h.textContent);
  const modal = $('spotlightHistoryModal');
  const close = () => { try { closeSpotlightHistory(); } catch (e) {} };
  close();
  currentSpotlightIndex = 0; renderSpotlightSection();
  const homePointsBefore = $('spotlightPoints').innerHTML;

  // A. 按鈕
  const btn = $('spotlightHistoryBtn');
  ok(!!btn && /歷史焦點/.test(btn.textContent), '焦點活動膠囊旁有「歷史焦點」按鈕');
  ok(!!document.querySelector('#spotlightContainer #spotlightHistoryBtn') && btn.previousElementSibling && /焦點活動/.test(btn.previousElementSibling.textContent), '按鈕緊接在「焦點活動」膠囊之後（同一個標頭列）');
  ok(modal.classList.contains('hidden'), '一開始彈窗是關閉的');

  // B. 開啟與列表
  btn.click();
  ok(!modal.classList.contains('hidden') && isSpotlightHistoryOpen(), '按下按鈕：開啟歷史焦點彈窗');
  ok(cardIds() === 'X,B,C,D,E', '只列最近一季已結束、非停用、不在輪播的：X、B、C、D、E（依結束日由新到舊）');
  ok(!/[AFGH]/.test(cardIds()), '不含進行中（A）、超過一季（F）、停用（G）、未開始（H）');
  ok(heads().join('|') === '2026 年 9 月|2026 年 8 月|2026 年 7 月', '依結束年月分段：9 月（X、B、C）、8 月（D）、7 月（E）');
  const grids = [...document.querySelectorAll('#spotHistCards > div')];
  ok(grids.length === 3 && grids[0].children.length === 3 && grids[1].children.length === 1 && grids[2].children.length === 1, '各月份下的卡片數：3、1、1');
  const cB = cards().find(c => c.getAttribute('data-id') === 'B');
  ok(cB.textContent.indexOf('標題B') >= 0 && cB.textContent.indexOf('日期：2026/09/20') >= 0, '卡片有標題與日期（subtitle）');
  ok(cB.querySelectorAll('span.rounded-full').length === 2 && cB.textContent.indexOf('標籤B甲') >= 0 && cB.textContent.indexOf('標籤B丙') < 0, '卡片最多顯示 2 個標籤');
  ok(cB.querySelector('img') && cB.querySelector('img').getAttribute('src') === 'https://example.com/B.jpg' && cB.querySelector('img').loading === 'lazy', '縮圖使用海報網址並延遲載入');
  const cD = cards().find(c => c.getAttribute('data-id') === 'D');
  ok(!cD.querySelector('img') && /影片/.test(cD.textContent), '影片類型：以「🎬 影片」代替縮圖');
  ok(!$('spotHistListPane').classList.contains('hidden') && $('spotHistDetailPane').classList.contains('hidden') && $('spotHistEmpty').classList.contains('hidden'), '列表顯示、詳情隱藏、無空狀態提示');

  // C. 跳脫
  ok(!window.__histpwn && document.querySelectorAll('#spotHistCards img[src="x"], #spotHistCards script, #spotHistCards b').length === 0, '含標籤的標題與標籤以純文字顯示，沒有執行或注入元素');
  ok(cards().find(c => c.getAttribute('data-id') === 'X').textContent.indexOf('<img src=x') >= 0, '原始字串完整保留');

  // D. 搜尋
  spotHistOnQuery('標題B'); ok(cardIds() === 'B', '搜尋標題');
  spotHistOnQuery('標籤c乙'); ok(cardIds() === 'C', '搜尋標籤（含第 3 個以後、不分大小寫也能找到）');
  spotHistOnQuery('內容D'); ok(cardIds() === 'D', '搜尋重點內容');
  spotHistOnQuery('2026/08'); ok(cardIds() === 'D', '搜尋日期（副標題）');
  ok(heads().length === 1, '搜尋後只剩有結果的月份標題');
  spotHistOnQuery('不存在的字'); ok(cards().length === 0 && !$('spotHistEmpty').classList.contains('hidden') && /沒有符合/.test($('spotHistEmpty').textContent), '沒有符合：顯示「沒有符合的活動」');
  spotHistOnQuery('');

  // E. 詳情與返回
  cards().find(c => c.getAttribute('data-id') === 'B').click();
  ok($('spotHistListPane').classList.contains('hidden') && !$('spotHistDetailPane').classList.contains('hidden'), '點卡片：切到詳情');
  ok($('spotHistDetailTitle').textContent === '標題B' && $('spotHistDetailSub').textContent === '日期：2026/09/20', '詳情：標題與日期');
  ok($('spotHistDetailImg').getAttribute('src') === 'https://example.com/B.jpg' && !$('spotHistDetailImg').classList.contains('hidden') && $('spotHistDetailVideoBox').classList.contains('hidden'), '詳情：顯示大圖、影片區隱藏');
  ok($('spotHistDetailTags').children.length === 3, '詳情：顯示全部 3 個標籤');
  ok($('spotHistDetailPoints').children.length === 2 && /注意事項/.test($('spotHistDetailPoints').textContent) && /內容B/.test($('spotHistDetailPoints').textContent) && /一般說明B/.test($('spotHistDetailPoints').textContent), '詳情：重點條列（【標籤】卡片與一般說明）');
  ok($('spotlightPoints').innerHTML === homePointsBefore && homePointsBefore.indexOf('內容A') >= 0, '詳情的重點條列不影響首頁的焦點活動區（首頁仍是 A 的內容）');
  spotHistBack();
  ok(!$('spotHistListPane').classList.contains('hidden') && $('spotHistDetailPane').classList.contains('hidden') && cardIds() === 'X,B,C,D,E', '返回列表：列表完整');
  // 影片
  cards().find(c => c.getAttribute('data-id') === 'D').click();
  ok(!$('spotHistDetailVideoBox').classList.contains('hidden') && $('spotHistDetailImg').classList.contains('hidden') && /youtube-nocookie\.com\/embed\/abc123/.test($('spotHistDetailIframe').src), '影片詳情：嵌入 YouTube 播放器');
  spotHistBack();
  ok($('spotHistDetailIframe').getAttribute('src') === '', '返回列表：停止影片（清掉播放器網址）');
  // 詳情中點惡意活動
  cards().find(c => c.getAttribute('data-id') === 'X').click();
  ok(!window.__histpwn && document.querySelectorAll('#spotHistDetailPane img[src="x"], #spotHistDetailPane script, #spotHistDetailPane b, #spotHistDetailPane i').length === 0 && $('spotHistDetailTitle').textContent.indexOf('<img src=x') >= 0, '詳情中含標籤的標題、標籤、重點也只以純文字顯示');
  spotHistBack();

  // F. 關閉：按鈕、ESC、點背景
  cards().find(c => c.getAttribute('data-id') === 'D').click();
  closeSpotlightHistory();
  ok(modal.classList.contains('hidden') && spotHist.openId === null && !/youtube/.test($('spotHistDetailIframe').src), '按 ✕ 關閉：彈窗隱藏、詳情狀態重設、影片停止');
  openSpotlightHistory(); ok(!$('spotHistListPane').classList.contains('hidden') && cards().length === 5, '再開啟：回到列表且搜尋已清空');
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); ok(modal.classList.contains('hidden'), '按 ESC 關閉');
  openSpotlightHistory(); modal.click(); ok(modal.classList.contains('hidden'), '點彈窗外的背景關閉');
  openSpotlightHistory(); $('spotHistListPane').click(); ok(!modal.classList.contains('hidden'), '點彈窗內容不會關閉');
  close();

  // G. 英文介面
  state.lang = 'en'; state.textMap = { '標題B': 'Title B', '日期：2026/09/20': 'Date: 2026/09/20', '標籤B甲,標籤B乙,標籤B丙': 'TagB1, TagB2, TagB3' };
  applyTranslations();
  ok(/Past Highlights/.test(btn.textContent), '英文介面：按鈕「Past Highlights」');
  btn.click();
  ok(heads().join('|') === 'September 2026|August 2026|July 2026', '英文介面：月份「September 2026」');
  const cBen = cards().find(c => c.getAttribute('data-id') === 'B');
  ok(cBen.textContent.indexOf('Title B') >= 0 && cBen.textContent.indexOf('Date: 2026/09/20') >= 0 && cBen.textContent.indexOf('TagB1') >= 0 && cBen.textContent.indexOf('標題B') < 0, '英文介面：標題、日期、標籤用英文對照');
  ok(cards().find(c => c.getAttribute('data-id') === 'C').textContent.indexOf('標題C') >= 0, '沒有英文對照的退回中文');
  ok(/Search title/.test($('spotHistSearch').placeholder), '英文介面：搜尋框提示為英文');
  spotHistOnQuery('title b'); ok(cardIds() === 'B', '英文介面：可用英文搜尋');
  spotHistOnQuery('');
  cards().find(c => c.getAttribute('data-id') === 'B').click();
  ok($('spotHistDetailTitle').textContent === 'Title B', '英文介面：詳情標題為英文');
  state.lang = 'zh-TW'; applyTranslations();
  ok(isSpotlightHistoryOpen() && $('spotHistDetailTitle').textContent === '標題B', '開著詳情時切回中文：畫面即時換語言');
  close();

  // H. 空狀態
  state.spotlights = [A, F, G, H]; openSpotlightHistory();
  ok(cards().length === 0 && !$('spotHistEmpty').classList.contains('hidden') && /目前還沒有歷史焦點/.test($('spotHistEmpty').textContent), '沒有歷史資料：顯示「目前還沒有歷史焦點」');
  close();
  state.spotlights = [B, C]; openSpotlightHistory();
  ok(cards().length === 0 && /目前還沒有歷史焦點/.test($('spotHistEmpty').textContent), '沒有進行中的活動時，輪播退而顯示 B、C → 它們不重複出現在歷史');
  close();
  state.spotlights = []; openSpotlightHistory(); ok(cards().length === 0 && /目前還沒有歷史焦點/.test($('spotHistEmpty').textContent), '完全沒有焦點活動資料：也不出錯');
  close();
  state.spotlights = undefined; try { openSpotlightHistory(); ok(true, 'spotlights 為 undefined 也不出錯'); } catch (e) { ok(false, 'spotlights 為 undefined 時出錯：' + e.message); } close();

  // I. 不影響首頁輪播
  state.spotlights = data; currentSpotlightIndex = 0; renderSpotlightSection();
  ok(filterActiveSpotlights(state.spotlights).length === 1 && $('spotlightTitle').textContent === '標題A', '首頁輪播只含進行中的 A，不受歷史焦點影響');

  window.getTodayDateStr = realToday; state.spotlights = saved.spot; state.lang = saved.lang; state.textMap = saved.tm; currentSpotlightIndex = saved.idx; window.handleDataLoaded = realHandle;
  try { applyTranslations(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
