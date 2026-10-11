// 首頁焦點輪播鍵盤與滑動測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：鍵盤 ← →（頭尾繞回、輸入框／組合鍵／有彈窗／不在首頁／卡片不在畫面內／只有一張時不動）、
// 手機左右滑動（方向、門檻、斜向、按鈕與歷史焦點鈕上起手不算、條件同鍵盤）、焦點放大彈窗內的 ← → 與滑動、提示文字。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realToday = window.getTodayDateStr, saved = { spot: state.spotlights, lang: state.lang, tm: state.textMap, idx: currentSpotlightIndex };
  window.getTodayDateStr = function () { return '2026-10-11'; };
  state.lang = 'zh-TW'; state.textMap = null;
  const sp = id => ({ id: id, title: '標題' + id, subtitle: '日期', imageUrl: 'https://example.com/' + id + '.jpg', mediaType: 'image', tags: '', bulletPoints: '【注意事項】內容' + id, startDate: '2026-10-01', endDate: '2026-10-31', duration: 5, priority: 1, status: '啟用' });
  const $ = id => document.getElementById(id);
  const setSlides = ids => { state.spotlights = ids.map(sp); currentSpotlightIndex = 0; renderSpotlightSection(); };
  const title = () => $('spotlightTitle').textContent;
  const counter = () => $('spotlightSlideCounter').textContent.trim();
  const key = (k, extra, target) => (target || window).dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true }, extra || {})));
  const touch = (el, x0, y0, x1, y1, fingers) => {
    const mk = (type, x, y) => {
      const e = new Event(type, { bubbles: true }); const t = { clientX: x, clientY: y };
      const all = []; for (let i = 0; i < (fingers || 1); i++) all.push(t);
      Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : all });
      Object.defineProperty(e, 'changedTouches', { value: [t] });
      el.dispatchEvent(e);
    };
    mk('touchstart', x0, y0); mk('touchend', x1, y1);
  };
  const box = $('spotlightContainer'), home = $('tabContent-home');
  const closeAll = () => { try { closeSpotlightModal(); } catch (e) {} try { closeSpotlightHistory(); } catch (e) {} };
  closeAll();
  home.classList.remove('hidden'); box.scrollIntoView({ block: 'center' });
  setSlides(['A', 'B', 'C']);

  // A. 鍵盤
  ok(title() === '標題A' && counter() === '1 / 3', '起始：第 1 張 A（1 / 3）');
  key('ArrowRight'); ok(title() === '標題B' && counter() === '2 / 3', '→：下一張 B');
  key('ArrowLeft'); ok(title() === '標題A', '←：回 A');
  key('ArrowLeft'); ok(title() === '標題C' && counter() === '3 / 3', '第 1 張按 ←：繞回最後一張 C（與按鈕一致）');
  key('ArrowRight'); ok(title() === '標題A', '最後一張按 →：繞回第 1 張');
  key('ArrowRight', { ctrlKey: true }); key('ArrowRight', { metaKey: true }); key('ArrowRight', { altKey: true }); key('ArrowRight', { shiftKey: true });
  ok(title() === '標題A', '搭配 Ctrl／⌘／Alt／Shift：不觸發');
  const inp = document.createElement('input'); document.body.appendChild(inp);
  key('ArrowRight', {}, inp); ok(title() === '標題A', '焦點在輸入框：不觸發');
  inp.remove();
  key('ArrowUp'); key('Enter'); ok(title() === '標題A', '其他按鍵：不觸發');

  // B. 不該回應的情況
  $('photoViewerModal').classList.remove('hidden'); key('ArrowRight'); ok(title() === '標題A', '相簿照片檢視器開著：首頁輪播不動（由檢視器自己處理）'); $('photoViewerModal').classList.add('hidden');
  openSpotlightHistory(); key('ArrowRight'); ok(title() === '標題A', '歷史焦點彈窗開著：首頁輪播不動'); closeSpotlightHistory();
  const inView = () => ({ top: 100, bottom: 600, left: 0, right: 300, width: 300, height: 500 });
  const rr0 = box.getBoundingClientRect; box.getBoundingClientRect = inView;
  home.classList.add('hidden'); key('ArrowRight'); touch(box, 300, 200, 100, 200); ok(title() === '標題A', '不在首頁分頁（即使卡片位置在畫面內）：鍵盤與滑動都不動'); home.classList.remove('hidden');
  box.getBoundingClientRect = rr0;
  const realRect = box.getBoundingClientRect;
  box.getBoundingClientRect = () => ({ top: -900, bottom: -300, left: 0, right: 100, width: 100, height: 600 });
  key('ArrowRight'); ok(title() === '標題A', '輪播卡片已捲出畫面上方：不動（避免看不到卻換圖）');
  box.getBoundingClientRect = () => ({ top: window.innerHeight + 50, bottom: window.innerHeight + 650, left: 0, right: 100, width: 100, height: 600 });
  key('ArrowRight'); ok(title() === '標題A', '輪播卡片在畫面下方外：不動');
  box.getBoundingClientRect = () => ({ top: window.innerHeight - 20, bottom: window.innerHeight + 500, left: 0, right: 100, width: 100, height: 520 });
  key('ArrowRight'); ok(title() === '標題B', '卡片只有一小部分在畫面內：仍可操作');
  box.getBoundingClientRect = realRect; key('ArrowLeft');
  setSlides(['A']); key('ArrowRight'); key('ArrowLeft'); ok(title() === '標題A', '只有一張：不動、不出錯');
  setSlides(['A', 'B', 'C']);

  // C. 手機滑動
  touch($('spotlightImg'), 300, 200, 180, 205); ok(title() === '標題B', '圖片上往左滑 120px：下一張');
  touch($('spotlightTitle'), 100, 200, 260, 190); ok(title() === '標題A', '標題文字上往右滑 160px：上一張');
  touch(box, 100, 200, 260, 200); ok(title() === '標題C', '第 1 張往右滑：繞回最後一張');
  touch(box, 300, 200, 100, 200); ok(title() === '標題A', '最後一張往左滑：繞回第 1 張');
  touch(box, 300, 200, 270, 200); ok(title() === '標題A', '只滑 30px：不算');
  touch(box, 300, 100, 230, 260); ok(title() === '標題A', '斜向／偏垂直：不算');
  touch(box, 300, 200, 100, 200, 2); ok(title() === '標題A', '兩指：不算');
  touch($('spotlightOverlayNextBtn'), 300, 200, 100, 200); ok(title() === '標題A', '從 ❯ 按鈕上起手：不算');
  touch($('spotlightHistoryBtn'), 300, 200, 100, 200); ok(title() === '標題A', '從「歷史焦點」按鈕上起手：不算');
  touch(document.body, 300, 200, 100, 200); ok(title() === '標題A', '起點在輪播卡片外：不算');
  $('photoViewerModal').classList.remove('hidden'); touch(box, 300, 200, 100, 200); ok(title() === '標題A', '有彈窗開著時滑動：不動'); $('photoViewerModal').classList.add('hidden');
  box.getBoundingClientRect = () => ({ top: -900, bottom: -300, left: 0, right: 100, width: 100, height: 600 });
  touch(box, 300, 200, 100, 200); ok(title() === '標題A', '卡片在畫面外時滑動：不動'); box.getBoundingClientRect = realRect;
  setSlides(['A']); touch(box, 300, 200, 100, 200); ok(title() === '標題A', '只有一張：滑動不動');
  setSlides(['A', 'B', 'C']);

  // D. 滑動換張會重新倒數（計時器重設）
  const t0 = spotlightTimer; touch(box, 300, 200, 100, 200); ok(spotlightTimer !== t0 && title() === '標題B', '滑動換張後自動輪播重新倒數');
  touch(box, 100, 200, 300, 200);

  // E. 焦點放大彈窗
  const mtitle = () => currentSpotlightIndex;
  openSpotlightModal();
  ok(isSpotlightModalOpen() && currentSpotlightIndex === 0, '開啟放大彈窗：第 1 張');
  key('ArrowRight'); ok(currentSpotlightIndex === 1, '彈窗內 →：下一張');
  key('ArrowLeft'); key('ArrowLeft'); ok(currentSpotlightIndex === 2, '彈窗內 ← ×2：繞回最後一張');
  key('ArrowRight', { ctrlKey: true }); ok(currentSpotlightIndex === 2, '彈窗內搭配 Ctrl：不觸發');
  touch($('modalSpotlightImg'), 300, 200, 100, 200); ok(currentSpotlightIndex === 0, '彈窗圖片上往左滑：下一張（繞回第 1 張）');
  touch($('modalSpotlightMediaWrapper'), 100, 200, 300, 200); ok(currentSpotlightIndex === 2, '彈窗媒體區往右滑：上一張');
  touch($('modalSpotlightNextBtn'), 300, 200, 100, 200); ok(currentSpotlightIndex === 2, '彈窗：從按鈕上起手不算');
  touch($('modalSpotlightMediaWrapper'), 300, 200, 270, 200); ok(currentSpotlightIndex === 2, '彈窗：只滑 30px 不算');
  ok(title() !== undefined && !$('spotlightModal').classList.contains('hidden'), '彈窗仍開著');
  closeSpotlightModal();
  key('ArrowRight'); ok(currentSpotlightIndex === 0, '關閉彈窗後 →：回到首頁輪播的行為（2 → 0 繞回）');
  setSlides(['A']); openSpotlightModal(); key('ArrowRight'); ok(currentSpotlightIndex === 0, '彈窗只有一張：→ 不動、不出錯'); closeSpotlightModal();
  setSlides(['A', 'B', 'C']);

  // F. 提示文字
  ok(/鍵盤 ← 鍵/.test($('spotlightOverlayPrevBtn').title) && /鍵盤 → 鍵/.test($('spotlightOverlayNextBtn').title) && /鍵盤 ← 鍵/.test($('modalSpotlightPrevBtn').title), '中文：按鈕提示說明可用鍵盤');
  state.lang = 'en'; applyTranslations();
  ok(/← key/.test($('spotlightOverlayPrevBtn').title) && /→ key/.test($('modalSpotlightNextBtn').title), '英文：按鈕提示說明可用鍵盤');
  state.lang = 'zh-TW'; applyTranslations();

  closeAll();
  window.getTodayDateStr = realToday; state.spotlights = saved.spot; state.lang = saved.lang; state.textMap = saved.tm; currentSpotlightIndex = saved.idx; window.handleDataLoaded = realHandle;
  try { renderSpotlightSection(); applyTranslations(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
