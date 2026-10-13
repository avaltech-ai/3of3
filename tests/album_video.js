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

  try { closeAlbumModal(); } catch (e) {}
  window.fetch = realFetch; currentAlbumPhotosList = saved.list; currentAlbumPhotoIndex = saved.idx; state.lang = saved.lang; window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
