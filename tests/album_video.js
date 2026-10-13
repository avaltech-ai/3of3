// 相簿影片前端測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：後端清單中的影片（v:1）與照片混排顯示；縮圖的 ▶ 標記與數量徽章；檢視器對影片改用 Drive 內建播放器（iframe）、
// 隱藏相片與幻燈片鈕、顯示備用連結；切回相片還原；關閉時停止影片；自動播放跳過影片；不合法 ID 與惡意檔名；舊版後端（沒有 v）相容。
// 注意：不測實際播放（需要真實裝置與網路，請手動驗證）。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realFetch = window.fetch, saved = { list: currentAlbumPhotosList, idx: currentAlbumPhotoIndex, lang: state.lang };
  state.lang = 'zh-TW';
  const $ = id => document.getElementById(id);
  const ID = c => c.repeat(28);
  const P1 = ID('A'), V1 = ID('B'), P2 = ID('C'), V2 = ID('D'), P3 = ID('E');
  const mock = photos => { window.fetch = function (u) { if (String(u).includes('getAlbumPhotos')) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, folderName: 'x', photos: photos }) }); return realFetch.apply(this, arguments); }; };
  const open = async photos => { mock(photos); openAlbumPhotos('1gRFbxu4MSAUl-YxW8o7AqVs222aCrezE', 'test'); await wait(1500); window.fetch = realFetch; };
  const cells = () => [...document.querySelectorAll('#albumPhotosGrid > div')];
  const frame = $('photoViewerVideo'), img = $('photoViewerImg'), link = $('photoViewerDriveLink'), autoBtn = $('photoAutoPlayBtn');
  const hidden = el => el.classList.contains('hidden');
  try { closePhotoViewer(); } catch (e) {}

  // A. 混排清單
  await open([{ id: P1, name: 'IMG_1.jpeg', size: 1 }, { id: V1, name: 'IMG_2.MOV', size: 2, v: 1 }, { id: P2, name: 'IMG_3.jpeg', size: 3 }, { id: V2, name: 'IMG_4.MOV', size: 4, v: 1 }]);
  ok(currentAlbumPhotosList.length === 4 && currentAlbumPhotosList.map(p => p.isVideo ? 'V' : 'P').join('') === 'PVPV', '清單 4 項，順序與後端一致（P V P V），影片有 isVideo 旗標');
  ok(currentAlbumPhotosList[1].embedUrl === 'https://drive.google.com/file/d/' + V1 + '/preview', '影片的內嵌播放網址是 Drive 預覽（/preview）');
  ok(cells().length === 4, '格狀縮圖 4 格（照片與影片同一份清單）');
  ok(cells()[1].textContent.indexOf('▶') >= 0 && cells()[3].textContent.indexOf('▶') >= 0 && cells()[0].textContent.indexOf('▶') < 0 && cells()[2].textContent.indexOf('▶') < 0, '只有影片的格子有 ▶ 標記');
  ok(cells()[1].textContent.indexOf('🎬') >= 0 && cells()[0].textContent.indexOf('🎬') < 0, '影片格子底層有 🎬（縮圖載入失敗時仍看得出是影片）');
  ok(/點擊播放影片/.test(cells()[1].textContent) && /點擊放大/.test(cells()[0].textContent), '懸停提示：影片「點擊播放影片」、照片「點擊放大」');
  ok($('modalAlbumCount').textContent === '（共 2 張・2 部影片）', '數量徽章：「（共 2 張・2 部影片）」（實際：' + $('modalAlbumCount').textContent + '）');
  ok(cells()[1].querySelector('img').getAttribute('src').indexOf('drive.google.com/thumbnail?id=' + V1) >= 0, '影片縮圖使用 Drive 縮圖網址（會是影片截圖）');

  // B. 檢視器：影片
  openPhotoViewerByIndex(1);
  ok(!hidden(frame) && frame.src.indexOf('/file/d/' + V1 + '/preview') >= 0, '開影片：顯示播放器 iframe，網址為該檔的 /preview');
  ok(hidden(img) && hidden(autoBtn) && !hidden(link), '開影片：相片隱藏、幻燈片鈕隱藏、備用連結顯示');
  ok(link.getAttribute('href') === 'https://drive.google.com/file/d/' + V1 + '/view' && link.target === '_blank' && /noopener/.test(link.rel), '備用連結指向該檔的 Drive 頁面，新分頁開啟且 noopener');
  ok($('photoViewerCounter').textContent === '2 / 4' && $('photoViewerTitle').textContent === 'IMG_2.MOV', '位置「2 / 4」、標題為檔名');
  ok(/allowfullscreen|allowFullscreen/i.test(frame.outerHTML) && /fullscreen/.test(frame.getAttribute('allow')), '播放器允許全螢幕');

  // C. 切換：影片 → 相片 → 影片
  navigatePhoto(1);
  ok(currentAlbumPhotoIndex === 2 && hidden(frame) && frame.src === 'about:blank' && !hidden(img) && !hidden(autoBtn) && hidden(link), '下一項是相片：播放器停止並隱藏（src 清空）、相片與幻燈片鈕還原、備用連結隱藏');
  navigatePhoto(1); ok(currentAlbumPhotoIndex === 3 && !hidden(frame) && frame.src.indexOf(V2) >= 0, '再下一項是影片：播放器載入新影片');
  navigatePhoto(-1); navigatePhoto(-1); ok(currentAlbumPhotoIndex === 1 && frame.src.indexOf(V1) >= 0, '往回切到上一部影片');
  // 鍵盤與滑動可在影片間切換
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); ok(currentAlbumPhotoIndex === 2, '鍵盤 → 可離開影片');

  // D. 關閉時停止
  openPhotoViewerByIndex(1); closePhotoViewer();
  ok(frame.src === 'about:blank' && hidden(frame) && $('photoViewerModal').classList.contains('hidden'), '關閉檢視器：影片停止（iframe 清空）');
  openPhotoViewerByIndex(0); ok(!hidden(img) && hidden(frame) && !hidden(autoBtn), '重新開相片：正常顯示相片、不殘留影片');
  closePhotoViewer();

  // E. 自動播放跳過影片
  await open([{ id: P1, name: 'a.jpg', size: 1 }, { id: V1, name: 'b.mov', size: 1, v: 1 }, { id: P2, name: 'c.jpg', size: 1 }]);
  openPhotoViewerByIndex(1); startPhotoAutoPlay(); ok(isPhotoAutoPlaying === false, '正在看影片時按幻燈片：不啟動');
  openPhotoViewerByIndex(0); startPhotoAutoPlay(); ok(isPhotoAutoPlaying === true, '在相片上啟動幻燈片');
  openPhotoViewerByIndex(1); ok(isPhotoAutoPlaying === false, '幻燈片進行中手動切到影片：自動停止（無法得知影片長度）');
  openPhotoViewerByIndex(0); startPhotoAutoPlay(); await wait((typeof PHOTO_AUTO_PLAY_DELAY === 'number' ? PHOTO_AUTO_PLAY_DELAY : 3000) + 600);
  ok(currentAlbumPhotoIndex === 2 && isPhotoAutoPlaying === true, '自動換張：a.jpg → 跳過影片 → c.jpg（索引 2）');
  stopPhotoAutoPlay(); closePhotoViewer();
  await open([{ id: V1, name: 'only.mov', size: 1, v: 1 }]);
  ok(cells().length === 1 && $('modalAlbumCount').textContent === '（共 0 張・1 部影片）', '只有影片的相簿：可顯示（共 0 張・1 部影片）');
  openPhotoViewerByIndex(0); ok(!hidden(frame), '只有一部影片：可開啟播放器');
  closePhotoViewer();

  // F. 安全與相容
  await open([{ id: P1, name: '<img src=x onerror=window.__vidpwn=1>.mov', size: 1, v: 1 }, { id: '"><script>window.__vidpwn=2<\/script>', name: 'evil.mov', size: 1, v: 1 }, { id: 'short', name: 'bad.mov', size: 1, v: 1 }]);
  ok(currentAlbumPhotosList.length === 1, '影片的 id 不合法（含惡意字元、太短）：略過，只剩 1 項');
  openPhotoViewerByIndex(0);
  ok(!window.__vidpwn && !document.querySelector('#photoViewerTitle img, #albumPhotosGrid script') && $('photoViewerTitle').textContent.indexOf('<img') >= 0, '惡意檔名：以純文字顯示，沒有執行');
  closePhotoViewer();
  await open([{ id: P1, name: 'old1.jpg', size: 1 }, { id: P2, name: 'old2.jpg', size: 1 }]);
  ok(currentAlbumPhotosList.every(p => !p.isVideo) && $('modalAlbumCount').textContent === '（共 2 張）' && cells().every(c => c.textContent.indexOf('▶') < 0), '舊版後端（沒有 v）：全部視為相片，徽章維持「（共 2 張）」');
  state.lang = 'en'; applyTranslations();
  await open([{ id: P1, name: 'a.jpg', size: 1 }, { id: V1, name: 'b.mov', size: 1, v: 1 }]);
  ok($('modalAlbumCount').textContent === '(1 photos, 1 videos)', '英文：「(1 photos, 1 videos)」（實際：' + $('modalAlbumCount').textContent + '）');
  openPhotoViewerByIndex(1); ok(/Video won't play/.test(link.textContent), '英文：備用連結文字為英文');
  closePhotoViewer(); state.lang = 'zh-TW'; applyTranslations();

  // G. 「重新整理相簿」：管理員登入時先清相簿清單快取、重讀，再在背景逐本重算照片數與影片數，最後再重讀一次
  const realCB = window.callBackend, realPwd = state.adminPassword, realToast = window.showToast, realCached = state.cachedAlbums;
  const calls = [], toasts = [];
  const IDS = ['a'.repeat(20), 'b'.repeat(20), 'c'.repeat(20)];
  const albums3 = IDS.map((id, i) => ({ id: id, category: '戶外踏訪', title: '相簿' + i, photoCount: 10 + i, videoCount: 0, coverUrl: '', coverCandidates: [], updatedAt: '2026-04-21' }));
  let mode = {};
  window.showToast = function (m, ic) { toasts.push(m + '|' + ic); };
  window.callBackend = function (action, payload, ok2, err2) {
    calls.push(action === 'recountAlbum' ? 'recount:' + payload.albumId.charAt(0) : action);
    if (action === 'clearAlbumListCache') { if (mode.clearFail) { if (err2) err2('boom'); } else if (ok2) ok2({ success: true, cleared: 3 }); }
    else if (action === 'getAlbums') { if (ok2) ok2({ success: true, albums: albums3 }); }
    else if (action === 'recountAlbum') {
      if (mode.hold) return;
      const k = payload.albumId.charAt(0);
      if (mode.authExpiredAt === k) { if (ok2) ok2({ success: false, error: 'x', authExpired: true }); }
      else if (mode.failAt === k) { if (ok2) ok2({ success: false, error: 'Drive 錯誤' }); }
      else if (ok2) ok2({ success: true, photoCount: 5, videoCount: 2, changed: k === 'a' });
    }
  };
  const reset = m => { calls.length = 0; toasts.length = 0; mode = m || {}; albumRecount.running = false; refreshAlbums._clearing = false; setAlbumRecountStatus(''); };
  state.adminPassword = 'tok'.repeat(15);
  reset(); refreshAlbums();
  ok(calls.join() === 'clearAlbumListCache,getAlbums,recount:a,recount:b,recount:c,getAlbums', '管理員按「重新整理」：清快取 → 讀相簿 → 逐本重算（3 本）→ 再讀一次（實際：' + calls.join() + '）');
  ok(toasts.length === 1 && /3 本相簿/.test(toasts[0]) && /1 本有變動/.test(toasts[0]) && /✅/.test(toasts[0]), '完成提示：「已重新計算 3 本相簿的張數與影片數（1 本有變動）」');
  ok(albumRecount.running === false && $('albumRecountStatus').classList.contains('hidden'), '結束後狀態文字收起、可以再次執行');
  reset({ clearFail: true }); refreshAlbums(); ok(calls.join() === 'clearAlbumListCache,getAlbums,recount:a,recount:b,recount:c,getAlbums', '清快取失敗：仍照常重讀與重算（不會卡住）');
  reset({ failAt: 'b' }); refreshAlbums(); ok(calls.length === 6 && /2 本相簿/.test(toasts[0]) && /1 本失敗/.test(toasts[0]) && /⚠️/.test(toasts[0]), '其中一本重算失敗：其他照常完成，提示「1 本失敗」');
  reset({ authExpiredAt: 'b' }); refreshAlbums(); ok(calls.join() === 'clearAlbumListCache,getAlbums,recount:a,recount:b' && toasts.length === 0 && albumRecount.running === false, '登入逾時：立即停止，不再重算其他本、不再重讀、不跳完成提示');
  reset(); state.adminPassword = ''; refreshAlbums(); ok(calls.join() === 'getAlbums', '沒有登入（一般使用者）：只重新讀取，不清快取、不重算（實際：' + calls.join() + '）');
  reset(); state.adminPassword = ''; recountAlbumsInBackground(albums3); ok(calls.length === 0 && albumRecount.running === false, '沒有登入時直接呼叫重算：什麼都不做（雙重保護）');
  reset({ hold: true }); state.adminPassword = 'tok'.repeat(15); refreshAlbums();
  ok(calls.join() === 'clearAlbumListCache,getAlbums,recount:a' && /1\/3/.test($('albumRecountStatus').textContent) && !$('albumRecountStatus').classList.contains('hidden'), '重算進行中：顯示進度「（1/3）」');
  refreshAlbums(); ok(calls.filter(a => a.indexOf('recount:') === 0).length === 1, '重算進行中再按一次：不會重複啟動第二輪');
  reset(); refreshAlbums._clearing = false;

  // H. 封面與後台表格的影片數量
  state.cachedAlbums = [Object.assign({}, albums3[0], { photoCount: 45, videoCount: 19 }), Object.assign({}, albums3[1], { photoCount: 12, videoCount: 0 }), Object.assign({}, albums3[2], { photoCount: 0, videoCount: 3 })];
  renderAlbumsList(state.cachedAlbums);
  const cardsT = [...document.querySelectorAll('#albumsGrid > *')].map(c => c.textContent.replace(/\s+/g, ' '));
  ok(cardsT.length === 3 && /📷 ?45 張.*🎬 ?19 部/.test(cardsT[0]), '封面：「📷 45 張・🎬 19 部」（實際：' + (cardsT[0] || '').trim().slice(0, 60) + '）');
  ok(/12 張/.test(cardsT[1]) && cardsT[1].indexOf('🎬') < 0, '沒有影片的相簿：只顯示「12 張」，不顯示影片段');
  ok(/0 張/.test(cardsT[2]) && /🎬 3 部/.test(cardsT[2]), '只有影片的相簿：「0 張・🎬 3 部」');
  state.lang = 'en'; applyTranslations(); renderAlbumsList(state.cachedAlbums);
  const cardsEn = [...document.querySelectorAll('#albumsGrid > *')].map(c => c.textContent.replace(/\s+/g, ' '));
  ok(/45 photos/.test(cardsEn[0]) && /19 videos/.test(cardsEn[0]) && cardsEn[1].indexOf('🎬') < 0, '英文：「45 photos・🎬 19 videos」');
  state.lang = 'zh-TW'; applyTranslations();
  try { renderAdminAlbumsTable(); const rows = [...document.querySelectorAll('#adminAlbumsTableBody tr, #adminAlbumsTable tr')].map(r => r.textContent.replace(/\s+/g, ' ')); ok(rows.some(t => /45 張・🎬 19 部/.test(t)) && rows.some(t => /12 張/.test(t) && t.indexOf('🎬') < 0), '後台相簿表格：同樣顯示「45 張・🎬 19 部」，沒影片的不顯示'); } catch (e) { ok(false, '後台表格渲染出錯：' + e.message); }
  window.callBackend = realCB; state.adminPassword = realPwd; window.showToast = realToast; state.cachedAlbums = realCached; delete window.__clearFail;
  try { renderAlbumsList(realCached || []); } catch (e) {}

  const allJs = Array.from(document.scripts).map(x => x.textContent).join('\n');
  ok(!/cachedAlbums\.length === 0\) refreshAlbums\(\)/.test(allJs) && (allJs.match(/cachedAlbums\.length === 0\) refreshAlbumsNow\(\)/g) || []).length === 2, '切到相簿分頁時的自動載入不清快取（只有使用者按「重新整理」才清）');

  try { closeAlbumModal(); } catch (e) {}
  window.fetch = realFetch; currentAlbumPhotosList = saved.list; currentAlbumPhotoIndex = saved.idx; state.lang = saved.lang; window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
