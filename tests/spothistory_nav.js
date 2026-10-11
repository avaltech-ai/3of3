// 「歷史焦點」詳情上一則／下一則測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：左右三角形按鈕、位置提示「n / 總數」、到頭停用（不繞回）、順序（◀較新、▶較舊）、只在目前搜尋結果內切換、
// 鍵盤 ← →（輸入框與組合鍵不觸發、列表畫面不觸發）、手機滑動（門檻、方向、影片區與列表畫面不觸發）、切換時影片停止、英文介面文字。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realToday = window.getTodayDateStr, saved = { spot: state.spotlights, lang: state.lang, tm: state.textMap };
  window.getTodayDateStr = function () { return '2026-10-06'; };
  state.lang = 'zh-TW'; state.textMap = null;
  const sp = (id, start, end, extra) => Object.assign({ id: id, title: '標題' + id, subtitle: '日期：' + end, imageUrl: 'https://example.com/' + id + '.jpg', mediaType: 'image', tags: '標籤' + id, bulletPoints: '【注意事項】內容' + id, startDate: start, endDate: end, duration: 5, priority: 1, status: '啟用' }, extra || {});
  const A = sp('A', '2026-10-01', '2026-10-31');
  const X = sp('X', '2026-09-21', '2026-09-25');
  const B = sp('B', '2026-09-10', '2026-09-20');
  const C = sp('C', '2026-09-01', '2026-09-05');
  const D = sp('D', '2026-08-10', '2026-08-15', { mediaType: 'video', imageUrl: 'https://www.youtube.com/watch?v=abc123' });
  const E = sp('E', '2026-07-01', '2026-07-06');
  state.spotlights = [A, B, C, D, E, X]; // 歷史順序（新→舊）：X、B、C、D、E
  const $ = id => document.getElementById(id);
  const title = () => $('spotHistDetailTitle').textContent;
  const pos = () => $('spotHistDetailPos').textContent;
  const pv = () => $('spotHistPrevBtn'), nx = () => $('spotHistNextBtn');
  const key = (k, extra, target) => (target || window).dispatchEvent(Object.assign(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true }, extra || {}))));
  const touch = (el, x0, y0, x1, y1) => {
    const mk = (type, x, y) => { const e = new Event(type, { bubbles: true }); const t = { clientX: x, clientY: y }; Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [t] }); Object.defineProperty(e, 'changedTouches', { value: [t] }); el.dispatchEvent(e); };
    mk('touchstart', x0, y0); mk('touchend', x1, y1);
  };
  const close = () => { try { closeSpotlightHistory(); } catch (e) {} };
  close(); openSpotlightHistory();

  // A. 列表畫面：不顯示導覽、鍵盤與滑動不動作
  key('ArrowRight'); ok(spotHist.openId === null && !$('spotHistListPane').classList.contains('hidden'), '列表畫面按 → 不會開任何詳情');
  const listCard = document.querySelector('#spotHistCards .spot-hist-card');
  touch($('spotHistListPane'), 300, 100, 100, 100); ok(spotHist.openId === null, '列表畫面滑動不會開詳情');

  // B. 開詳情：位置、按鈕狀態
  spotHistOpen('X');
  ok(title() === '標題X' && pos() === '1 / 5', '第一則：標題 X、位置「1 / 5」');
  ok(pv().disabled === true && nx().disabled === false, '第一則：◀ 停用、▶ 可按');
  spotHistOpen('E');
  ok(pos() === '5 / 5' && pv().disabled === false && nx().disabled === true, '最後一則：位置「5 / 5」、◀ 可按、▶ 停用');
  spotHistOpen('C');
  ok(pos() === '3 / 5' && !pv().disabled && !nx().disabled, '中間：位置「3 / 5」、兩顆都可按');

  // C. 按鈕：◀ 較新、▶ 較舊
  nx().click(); ok(title() === '標題D' && pos() === '4 / 5', '按 ▶：下一則（較舊）＝ D');
  pv().click(); pv().click(); ok(title() === '標題B' && pos() === '2 / 5', '按 ◀ 兩次：回到 C 再到 B（較新）');
  pv().click(); ok(title() === '標題X' && pv().disabled, '到第一則後 ◀ 停用');
  pv().click(); spotHistStep(-1); ok(title() === '標題X' && pos() === '1 / 5', '第一則再往前：不動、不繞回最後一則');
  spotHistOpen('E'); spotHistStep(1); nx().click(); ok(title() === '標題E' && pos() === '5 / 5', '最後一則再往後：不動、不繞回第一則');

  // D. 鍵盤
  spotHistOpen('C');
  key('ArrowRight'); ok(title() === '標題D', '鍵盤 →：下一則（較舊）');
  key('ArrowLeft'); key('ArrowLeft'); ok(title() === '標題B', '鍵盤 ← ×2：上一則（較新）');
  key('ArrowRight', { ctrlKey: true }); key('ArrowRight', { metaKey: true }); key('ArrowRight', { altKey: true }); ok(title() === '標題B', '搭配 Ctrl／⌘／Alt 不觸發（避免與瀏覽器上一頁衝突）');
  const inp = document.createElement('input'); document.body.appendChild(inp);
  key('ArrowRight', {}, inp); ok(title() === '標題B', '焦點在輸入框時不觸發');
  inp.remove();
  spotHistOpen('X'); key('ArrowLeft'); ok(title() === '標題X', '鍵盤在第一則按 ←：不動');
  key('Escape'); ok($('spotlightHistoryModal').classList.contains('hidden'), 'ESC 仍可關閉彈窗');
  key('ArrowRight'); ok($('spotlightHistoryModal').classList.contains('hidden') && spotHist.openId === null, '彈窗關閉後按 →：沒有任何反應');
  openSpotlightHistory();

  // E. 手機滑動
  const pane = $('spotHistDetailPane');
  spotHistOpen('C');
  touch($('spotHistDetailImg'), 300, 200, 200, 205); ok(title() === '標題D', '往左滑 100px：下一則（較舊）');
  touch(pane, 100, 200, 220, 190); ok(title() === '標題C', '往右滑 120px：上一則（較新）');
  touch(pane, 300, 200, 270, 200); ok(title() === '標題C', '只滑 30px：不算（門檻 50px）');
  touch(pane, 300, 100, 230, 260); ok(title() === '標題C', '斜向／偏垂直（捲動）：不算');
  touch($('spotHistDetailVideoBox'), 300, 200, 100, 200); ok(title() === '標題C', '起點在影片區：不攔截');
  touch(document.body, 300, 200, 100, 200); ok(title() === '標題C', '起點在彈窗外：不觸發');
  spotHistOpen('X'); touch(pane, 100, 200, 300, 200); ok(title() === '標題X', '第一則往右滑：不動');
  spotHistOpen('E'); touch(pane, 300, 200, 100, 200); ok(title() === '標題E', '最後一則往左滑：不動');

  // F. 切換時影片停止
  spotHistOpen('D');
  ok(/youtube/.test($('spotHistDetailIframe').src), '影片詳情：播放器已載入');
  spotHistStep(1); ok(title() === '標題E' && !/youtube/.test($('spotHistDetailIframe').src), '從影片切到下一則：影片停止');
  spotHistStep(-1); ok(/youtube/.test($('spotHistDetailIframe').src), '切回影片：重新載入');
  close();

  // G. 只在目前搜尋結果內切換
  const B2 = Object.assign({}, B, { tags: '共同詞' }), D2 = Object.assign({}, D, { tags: '共同詞' });
  state.spotlights = [A, B2, C, D2, E, X];
  openSpotlightHistory(); $('spotHistSearch').value = '共同詞'; spotHistOnQuery('共同詞');
  ok(spotHistRows().map(r => r.id).join() === 'B,D', '搜尋「共同詞」：只剩 B、D');
  spotHistOpen('B'); ok(pos() === '1 / 2' && pv().disabled && !nx().disabled, '搜尋後詳情：位置「1 / 2」');
  nx().click(); ok(title() === '標題D' && pos() === '2 / 2' && nx().disabled, '▶ 直接跳到 D（略過 C，不在搜尋結果內）');
  spotHistBack(); ok(!$('spotHistListPane').classList.contains('hidden') && $('spotHistSearch').value === '共同詞' && document.querySelectorAll('#spotHistCards .spot-hist-card').length === 2, '返回列表：搜尋條件仍在');
  spotHistOnQuery(''); close();

  // H. 只有一則
  state.spotlights = [A, B]; openSpotlightHistory(); spotHistOpen('B');
  ok(pos() === '1 / 1' && pv().disabled && nx().disabled, '只有一則：位置「1 / 1」、兩顆都停用');
  key('ArrowRight'); touch(pane, 300, 200, 100, 200); ok(title() === '標題B', '只有一則：鍵盤與滑動都不動');
  close(); state.spotlights = [A, B, C, D, E, X];

  // I. 英文介面與無障礙
  ok(/上一則/.test(pv().title) && /下一則/.test(nx().title) && /較新/.test(pv().getAttribute('aria-label')) && /較舊/.test(nx().getAttribute('aria-label')), '中文：提示文字與 aria-label 說明較新／較舊');
  state.lang = 'en'; applyTranslations();
  ok(/Previous/.test(pv().title) && /Next/.test(nx().title) && /newer/.test(pv().getAttribute('aria-label')) && /older/.test(nx().getAttribute('aria-label')), '英文：提示文字與 aria-label 為英文');
  state.lang = 'zh-TW'; applyTranslations();

  // J. 資料更新（背景重新載入）使目前這則消失：不出錯，詳情自動回列表
  openSpotlightHistory(); spotHistOpen('C'); state.spotlights = [A, B, D, E, X];
  try { renderSpotlightHistory(); ok(spotHist.openId === null && !$('spotHistListPane').classList.contains('hidden'), '目前這則在更新後消失：自動回到列表，不出錯'); } catch (e) { ok(false, '資料更新後出錯：' + e.message); }
  close();

  window.getTodayDateStr = realToday; state.spotlights = saved.spot; state.lang = saved.lang; state.textMap = saved.tm; window.handleDataLoaded = realHandle;
  try { applyTranslations(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
