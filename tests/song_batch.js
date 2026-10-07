// 唱跳音符「批次設定不開放／開放」前端測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：每列與表頭勾選、全選本頁、全選目前篩選結果（跨頁、不受分頁影響）、已選數量、分批（每 5 首）送出與進度、確認視窗、
// 結果摘要與失敗原因、即時反映到本機資料、停止、登入逾時、連線中斷、執行中鎖定按鈕、跳脫。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realCB = window.callBackend, realToast = window.showToast, realConfirm = window.confirm, realLoad = window.loadAppData;
  const saved = { songs: state.songs, pw: state.adminPassword, cats: state.songCategories };
  state.adminPassword = 'tok'; state.songCategories = ['兒歌', '英文歌曲'];
  let log = [], toasts = [], confirms = [], confirmAnswer = true, loads = 0, handler = null;
  window.callBackend = function (a, p, okCb, errCb) { log.push({ action: a, payload: JSON.parse(JSON.stringify(p)) }); setTimeout(function () { if (a === 'adminSongList') { okCb({ success: true, songs: FULL(), categories: [] }); return; } const r = handler ? handler(p, log.filter(x => x.action === 'adminSongSetAccess').length) : { success: true, results: [] }; if (r instanceof Error) errCb(r); else okCb(r); }, 0); };
  window.showToast = function (m) { toasts.push(String(m)); };
  window.confirm = function (m) { confirms.push(String(m)); return confirmAnswer; };
  window.loadAppData = function () { loads++; };
  const $ = id => document.getElementById(id);
  { let n = $('songFormCard').parentElement; while (n && n !== document.body) { n.classList.remove('hidden'); n.style.display = ''; n = n.parentElement; } }
  const pad = n => ('0' + n).slice(-2);
  const FULL = () => Array.from({ length: 12 }, (_, i) => ({ id: 'S' + pad(i), category: i < 8 ? '兒歌' : '英文歌曲', title: '歌曲' + pad(i), youtubeUrl: 'https://youtu.be/aaaaaaaaaa' + (i % 10), youtubeId: 'aaaaaaaaaa' + (i % 10), duration: '01:00', fileName: i === 11 ? undefined : 'f' + i + '.mp3', fileSize: 100, driveFileId: i === 11 ? undefined : 'F' + i, downloadUrl: i === 11 ? undefined : 'https://drive.google.com/uc?export=download&id=F' + i, noDownload: false }));
  const setup = async () => { log = []; toasts = []; confirms = []; confirmAnswer = true; loads = 0; songBatch.sel.clear(); songBatch.running = false; songBatch.cancel = false; resetAdminSongInfo(); state.songs = FULL().map(songPublicView); adminLists.songs = { query: '', cat: '', page: 0, size: 10 }; try { localStorage.removeItem('nobel_a_adminlist_size_songs'); } catch (e) {} const rb = $('songBatchResult'); if (rb) rb.classList.add('hidden'); renderAdminSongsTable(); await wait(60); };
  const rows = () => [...document.querySelectorAll('#adminSongsTableBody tr')];
  const cbs = () => [...document.querySelectorAll('.song-batch-cb')];
  const calls = () => log.filter(x => x.action === 'adminSongSetAccess');
  const okRes = (p, extra) => ({ success: true, blocked: p.blocked, results: p.ids.map(id => Object.assign({ id: id, title: '歌曲' + id.slice(1), ok: true, noFile: id === 'S11', noDownload: p.blocked, error: '' }, extra && extra[id] || {})) });

  await setup();

  // A. 介面
  ok(!!$('songBatchBar') && !!$('songBatchPageAll') && cbs().length === 10, '歌曲列表有批次列、表頭勾選框，第 1 頁每列都有勾選框（10 列）');
  ok($('songBatchBlockBtn').disabled && $('songBatchOpenBtn').disabled && $('songBatchClearBtn').disabled && $('songBatchCount').textContent === '尚未選取歌曲', '沒有選取：設定按鈕與取消選取停用，顯示「尚未選取歌曲」');
  ok(/全選目前篩選結果（12 首）/.test($('songBatchSelAllBtn').textContent), '「全選目前篩選結果（12 首）」');
  ok(rows().every(r => r.children.length === 6), '表格改為 6 欄（含勾選欄）');

  // B. 選取
  cbs()[0].checked = true; cbs()[0].dispatchEvent(new Event('change', { bubbles: true }));
  ok(songBatch.sel.size === 1 && $('songBatchCount').textContent === '已選 1 首' && !$('songBatchBlockBtn').disabled && !$('songBatchOpenBtn').disabled && !$('songBatchClearBtn').disabled, '勾一列：已選 1 首，按鈕啟用');
  ok($('songBatchPageAll').indeterminate === true && $('songBatchPageAll').checked === false, '表頭勾選框呈「部分選取」狀態');
  $('songBatchPageAll').checked = true; $('songBatchPageAll').dispatchEvent(new Event('change', { bubbles: true }));
  ok(songBatch.sel.size === 10 && cbs().every(c => c.checked) && $('songBatchPageAll').checked === true && $('songBatchPageAll').indeterminate === false, '勾表頭：選取這一頁 10 首');
  $('songBatchPageAll').checked = false; $('songBatchPageAll').dispatchEvent(new Event('change', { bubbles: true }));
  ok(songBatch.sel.size === 0 && cbs().every(c => !c.checked), '再按一次表頭：取消這一頁的選取');

  // C. 全選目前篩選結果（跨頁、搭配篩選）
  songBatchSelectFiltered();
  ok(songBatch.sel.size === 12 && $('songBatchCount').textContent === '已選 12 首', '全選目前篩選結果（無篩選）：12 首，含第 2 頁的歌曲');
  adminListGo('songs', 'next'); ok(cbs().length === 2 && cbs().every(c => c.checked), '換到第 2 頁：選取狀態保留');
  songBatchClear(); ok(songBatch.sel.size === 0 && $('songBatchCount').textContent === '尚未選取歌曲', '取消選取');
  adminListGo('songs', 'first');
  adminListOnFilter('songs', 'cat', '英文歌曲'); songBatchSelectFiltered();
  ok(songBatch.sel.size === 4 && /已選 4 首/.test($('songBatchCount').textContent) && /全選目前篩選結果（4 首）/.test($('songBatchSelAllBtn').textContent), '篩選「英文歌曲」後全選：只選那 4 首');
  adminListClear('songs');
  ok($('songBatchCount').textContent === '已選 4 首', '清除篩選後（4 首都在範圍內）：只顯示「已選 4 首」，不顯示「不在範圍內」');
  adminListOnFilter('songs', 'cat', '兒歌');
  ok(/其中 4 首不在目前篩選範圍內/.test($('songBatchCount').textContent), '換成別的篩選：提示「其中 4 首不在目前篩選範圍內」（避免誤以為只處理畫面上的）');
  adminListClear('songs'); songBatchClear();

  // D. 確認視窗與取消
  songBatchSelectFiltered(); confirmAnswer = false;
  songBatchApply(true);
  ok(confirms.length === 1 && /12 首/.test(confirms[0]) && /不開放下載/.test(confirms[0]) && /私人資料夾/.test(confirms[0]) && calls().length === 0 && songBatch.running === false, '設為不開放：先跳確認視窗（12 首、私人資料夾說明）；按取消不送出');
  songBatchApply(false);
  ok(confirms.length === 2 && /開放下載/.test(confirms[1]) && /搬回/.test(confirms[1]) && calls().length === 0, '設為開放：確認視窗說明會搬回資料夾；取消不送出');

  // E. 分批執行（成功）
  confirmAnswer = true; handler = (p) => okRes(p);
  let sawLocked = null;
  const origHandler = handler; handler = (p, n) => { if (n === 1) { sawLocked = { block: $('songBatchBlockBtn').disabled, open: $('songBatchOpenBtn').disabled, sel: $('songBatchSelAllBtn').disabled, cb: cbs().every(c => c.disabled), prog: !$('songBatchProgress').classList.contains('hidden') }; } return origHandler(p, n); };
  songBatchApply(true); await wait(400);
  ok(calls().length === 3 && calls().map(c => c.payload.ids.length).join(',') === '5,5,2', '12 首分 3 批送出（5、5、2）');
  ok(calls().every(c => c.payload.blocked === true && c.payload.password === 'tok'), '每批都帶 blocked=true 與管理員 token');
  ok(calls().map(c => c.payload.ids).flat().sort().join(',') === Array.from({ length: 12 }, (_, i) => 'S' + pad(i)).join(','), '12 首都送到，沒有重複或遺漏');
  ok(sawLocked && sawLocked.block && sawLocked.open && sawLocked.sel && sawLocked.cb && sawLocked.prog, '執行中：設定按鈕、全選、勾選框都鎖住，並顯示進度');
  ok($('songBatchProgress').classList.contains('hidden') && songBatch.running === false && songBatch.sel.size === 0, '完成後：進度條收起、解除鎖定、選取清空');
  ok(/成功 12 首/.test($('songBatchResult').textContent) && /其中 1 首只有 YouTube/.test($('songBatchResult').textContent) && /失敗 0 首/.test($('songBatchResult').textContent) && !$('songBatchResult').classList.contains('hidden') && /emerald/.test($('songBatchResult').className), '結果摘要：成功 12 首（其中 1 首只有 YouTube）、失敗 0 首，綠色');
  ok(state.songs.every(sg => sg.noDownload === true && sg.downloadUrl === undefined && sg.driveFileId === undefined), '本機公開資料即時更新：12 首都不含下載網址');
  ok(adminSongFull(state.songs.find(sg => sg.id === 'S00')).noDownload === true && rows().length === 10 && rows().every(r => !!r.querySelector('.admin-song-lock')), '後台列表（第 1 頁 10 列）即時都出現「🔒 不開放下載」標籤');
  ok(loads === 1, '全部完成後重新載入一次資料');
  ok(toasts.some(t => /成功 12 首/.test(t)), '提示訊息顯示結果');

  // F. 失敗原因
  await setup(); songBatchSelectFiltered(); handler = (p) => okRes(p, { S03: { ok: false, noDownload: true, error: '搬到私人資料夾失敗：Exception: 存取遭拒：DriveApp。 目前狀態：在唱跳音符（公開）資料夾' }, S08: { ok: false, noDownload: true, error: '<img src=x onerror="window.__sbpwn=1">' } });
  songBatchApply(true); await wait(400);
  const rtxt = $('songBatchResult').textContent;
  ok(/成功 10 首/.test(rtxt) && /失敗 2 首/.test(rtxt) && /歌曲03：搬到私人資料夾失敗/.test(rtxt) && /存取遭拒/.test(rtxt) && /音樂檔可能還是公開/.test(rtxt) && /amber/.test($('songBatchResult').className), '有失敗：摘要列出失敗歌名與具體原因，說明檔案可能還公開，黃色警示');
  ok(!window.__sbpwn && $('songBatchResult').querySelectorAll('img').length === 0 && rtxt.indexOf('<img src=x') >= 0, '失敗原因以純文字顯示（含標籤的內容不會執行）');

  // G. 停止
  await setup(); songBatchSelectFiltered(); handler = (p, n) => { if (n === 1) songBatchStop(); return okRes(p); };
  songBatchApply(true); await wait(300);
  ok(calls().length === 1 && /已停止/.test($('songBatchResult').textContent) && /成功 5 首/.test($('songBatchResult').textContent) && /未處理 7 首/.test($('songBatchResult').textContent), '按停止：做完目前這一批就停，顯示已停止、成功 5 首、未處理 7 首');

  // H. 登入逾時、連線中斷、後端失敗
  await setup(); songBatchSelectFiltered(); handler = () => ({ success: false, error: 'x', authExpired: true });
  songBatchApply(true); await wait(200);
  ok(/登入已逾時/.test($('songBatchResult').textContent) && songBatch.running === false && /rose|amber/.test($('songBatchResult').className), '登入逾時：中止並提示重新登入，解除鎖定');
  await setup(); songBatchSelectFiltered(); handler = (p, n) => n === 2 ? new Error('逾時') : okRes(p);
  songBatchApply(true); await wait(300);
  ok(/連線中斷/.test($('songBatchResult').textContent) && /成功 5 首/.test($('songBatchResult').textContent) && /未處理 7 首/.test($('songBatchResult').textContent) && songBatch.running === false, '第 2 批連線中斷：保留已完成的結果、說明這一批結果不明、未處理數');
  await setup(); songBatchSelectFiltered(); handler = () => ({ success: false, error: '一次最多處理 10 首' });
  songBatchApply(true); await wait(200);
  ok(/後端回報失敗：一次最多處理 10 首/.test($('songBatchResult').textContent), '後端回報失敗：顯示原因');

  // I. 設為開放
  await setup(); songBatchSelectFiltered(); handler = (p) => okRes(p);
  songBatchApply(true); await wait(400);
  songBatchSelectFiltered(); handler = (p) => { const r = okRes(p); r.results.forEach(x => { x.noDownload = false; }); return r; }; confirms = [];
  songBatchApply(false); await wait(400);
  ok(calls().filter(c => c.payload.blocked === false).length === 3 && /成功 12 首/.test($('songBatchResult').textContent) && /開放下載/.test($('songBatchResult').textContent), '設為開放：同樣分批，blocked=false');
  ok(state.songs.filter(sg => sg.noDownload).length === 0 && /id=F0/.test(state.songs.find(sg => sg.id === 'S00').downloadUrl || '') && state.songs.find(sg => sg.id === 'S11').downloadUrl === undefined, '本機旗標已清除，並從後台完整資料恢復下載網址（沒有音樂檔的那首仍沒有）');

  // J. 沒有選取、沒有登入
  await setup(); songBatchApply(true); ok(confirms.length === 0 && calls().length === 0, '沒有選取任何歌曲：不做事');
  songBatchSelectFiltered(); state.adminPassword = ''; songBatchApply(true); ok(calls().length === 0 && toasts.some(t => /請先登入/.test(t)), '沒有登入：提示先登入，不送出'); state.adminPassword = 'tok';

  window.callBackend = realCB; window.showToast = realToast; window.confirm = realConfirm; window.loadAppData = realLoad;
  songBatch.sel.clear(); songBatch.running = false;
  state.songs = saved.songs; state.adminPassword = saved.pw; state.songCategories = saved.cats; window.handleDataLoaded = realHandle;
  adminLists.songs = { query: '', cat: '', page: 0, size: adminListStoredSize('songs') };
  resetAdminSongInfo(); try { renderAdminSongsTable(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
