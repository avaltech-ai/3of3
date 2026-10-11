// 照片檢視器手機滑動測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：往左滑＝下一張、往右滑＝上一張（頭尾沿用原本的繞回）、滑動門檻與方向、多指不算、按鈕上起手不算、
// 檢視器關閉時滑動無作用、只有一張時不動、自動播放中手動滑動會重新倒數、既有鍵盤 ← → 與按鈕仍可用。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { list: currentAlbumPhotosList, idx: currentAlbumPhotoIndex };
  const mkPhoto = n => ({ name: '照片' + n, viewUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=#' + n, thumbnailUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=#t' + n });
  currentAlbumPhotosList = [mkPhoto(1), mkPhoto(2), mkPhoto(3)];
  const $ = id => document.getElementById(id);
  const modal = $('photoViewerModal');
  const counter = () => $('photoViewerCounter').textContent;
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
  const key = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  const img = $('photoViewerImg');
  try { closePhotoViewer(); } catch (e) {}

  // A. 檢視器關閉：滑動無作用
  openPhotoViewerByIndex(0); closePhotoViewer();
  const idx0 = currentAlbumPhotoIndex;
  touch(document.body, 300, 200, 100, 200); touch(img, 300, 200, 100, 200);
  ok(currentAlbumPhotoIndex === idx0 && modal.classList.contains('hidden'), '檢視器關閉時滑動：沒有作用');

  // B. 基本方向
  openPhotoViewerByIndex(0);
  ok(counter() === '1 / 3', '開啟第 1 張：「1 / 3」');
  touch(img, 300, 200, 180, 205); ok(counter() === '2 / 3', '往左滑 120px：下一張');
  touch(img, 300, 200, 180, 190); ok(counter() === '3 / 3', '再往左滑：第 3 張');
  touch(img, 100, 200, 260, 200); ok(counter() === '2 / 3', '往右滑 160px：上一張');
  touch(modal, 100, 200, 260, 200); ok(counter() === '1 / 3', '在檢視器背景區往右滑：上一張');

  // C. 頭尾沿用原本的繞回
  touch(img, 100, 200, 260, 200); ok(counter() === '3 / 3', '第 1 張往右滑：繞回最後一張（與按鈕、鍵盤行為一致）');
  touch(img, 300, 200, 100, 200); ok(counter() === '1 / 3', '最後一張往左滑：繞回第一張');

  // D. 不算滑動
  touch(img, 300, 200, 270, 200); ok(counter() === '1 / 3', '只滑 30px：不算');
  touch(img, 300, 100, 230, 260); ok(counter() === '1 / 3', '斜向／偏垂直：不算');
  touch(img, 300, 200, 100, 200, 2); ok(counter() === '1 / 3', '兩指（縮放）：不算');
  touch($('photoViewerNextBtn'), 300, 200, 100, 200); ok(counter() === '1 / 3', '從按鈕上起手：不算（避免與點按衝突）');
  touch($('photoViewerPrevBtn'), 100, 200, 300, 200); ok(counter() === '1 / 3', '從 ◀ 按鈕上起手：不算');

  // E. 既有操作不受影響
  key('ArrowRight'); ok(counter() === '2 / 3', '鍵盤 →：下一張（原有功能）');
  key('ArrowLeft'); ok(counter() === '1 / 3', '鍵盤 ←：上一張（原有功能）');
  $('photoViewerNextBtn').click(); ok(counter() === '2 / 3', '按 ❯：下一張（原有功能）');
  $('photoViewerPrevBtn').click(); ok(counter() === '1 / 3', '按 ❮：上一張（原有功能）');

  // F. 與歷史焦點的滑動互不干擾
  ok(typeof spotHistStep === 'function', '歷史焦點的滑動仍在');
  const before = spotHist.openId; touch(img, 300, 200, 100, 200); ok(spotHist.openId === before && counter() === '2 / 3', '照片檢視器的滑動不會觸發歷史焦點');

  // G. 自動播放中手動滑動：重新倒數、繼續播放
  let resched = 0; const realSched = window.scheduleNextAutoPlay;
  isPhotoAutoPlaying = true; window.scheduleNextAutoPlay = function () { resched++; };
  touch(img, 300, 200, 100, 200);
  ok(resched >= 1 && counter() === '3 / 3', '自動播放中滑動：換張並重新倒數 3 秒');
  isPhotoAutoPlaying = false; window.scheduleNextAutoPlay = realSched; try { stopPhotoAutoPlay(); } catch (e) {}

  // H. 只有一張
  currentAlbumPhotosList = [mkPhoto(9)]; openPhotoViewerByIndex(0);
  touch(img, 300, 200, 100, 200); touch(img, 100, 200, 300, 200);
  ok(counter() === '1 / 1' && currentAlbumPhotoIndex === 0, '只有一張：滑動不出錯、仍是第 1 張');
  currentAlbumPhotosList = []; try { touch(img, 300, 200, 100, 200); ok(true, '沒有照片清單：滑動不出錯'); } catch (e) { ok(false, '沒有清單時出錯：' + e.message); }

  closePhotoViewer();
  currentAlbumPhotosList = saved.list; currentAlbumPhotoIndex = saved.idx; window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
