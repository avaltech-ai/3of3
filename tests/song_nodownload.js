// 唱跳音符「不開放下載」前端測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：前台只有開放的歌曲有下載圖示（不開放的沒有，資料裡也沒有網址）；後台表單有勾選框；後台列表用登入後取得的完整資料顯示檔名並標「🔒 不開放下載」；
// 編輯／儲存不開放的歌曲不會把檔案資訊清空；儲存與上傳送出 noDownload；取消勾選；警告顯示；登出清除完整資料；跳脫。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const realCB = window.callBackend, realToast = window.showToast, realConfirm = window.confirm;
  const saved = { songs: state.songs, pw: state.adminPassword, cats: state.songCategories, lang: state.lang };
  state.lang = 'zh-TW'; state.adminPassword = 'tok'; state.songCategories = ['兒歌', '英文歌曲'];
  let log = [], toasts = [], handlers = {};
  window.callBackend = function (a, p, okCb, errCb) { log.push({ action: a, payload: JSON.parse(JSON.stringify(p)) }); const h = handlers[a]; setTimeout(function () { if (!h) { okCb({ success: false, error: 'no handler' }); return; } const r = h(p); if (r instanceof Error) errCb(r); else okCb(r); }, 0); };
  window.showToast = function (m) { toasts.push(String(m)); };
  window.confirm = function () { return true; };
  const calls = a => log.filter(x => x.action === a);
  const $ = id => document.getElementById(id);
  { let n = $('songFormCard').parentElement; while (n && n !== document.body) { n.classList.remove('hidden'); n.style.display = ''; n = n.parentElement; } }

  const FULL = [
    { id: 'S1', category: '兒歌', title: '開放的歌', youtubeUrl: 'https://youtu.be/abcdefghijk', youtubeId: 'abcdefghijk', duration: '02:00', fileName: 'open.mp3', fileSize: 1000, driveFileId: 'F1', downloadUrl: 'https://drive.google.com/uc?export=download&id=F1', noDownload: false },
    { id: 'S2', category: '兒歌', title: '不開放的歌', youtubeUrl: 'https://youtu.be/bbbbbbbbbbb', youtubeId: 'bbbbbbbbbbb', duration: '03:00', fileName: 'secret.mp3', fileSize: 2000, driveFileId: 'F2', downloadUrl: 'https://drive.google.com/uc?export=download&id=F2', noDownload: true },
    { id: 'S3', category: '英文歌曲', title: '只有 YouTube', youtubeUrl: 'https://youtu.be/ccccccccccc', youtubeId: 'ccccccccccc', duration: '01:00', noDownload: false }
  ];
  const PUBLIC = () => [{ id: 'S1', category: '兒歌', title: '開放的歌', youtubeUrl: 'https://youtu.be/abcdefghijk', youtubeId: 'abcdefghijk', duration: '02:00', fileName: 'open.mp3', fileSize: 1000, driveFileId: 'F1', downloadUrl: 'https://drive.google.com/uc?export=download&id=F1' },
    { id: 'S2', category: '兒歌', title: '不開放的歌', youtubeUrl: 'https://youtu.be/bbbbbbbbbbb', youtubeId: 'bbbbbbbbbbb', duration: '03:00', noDownload: true },
    { id: 'S3', category: '英文歌曲', title: '只有 YouTube', youtubeUrl: 'https://youtu.be/ccccccccccc', youtubeId: 'ccccccccccc', duration: '01:00' }];
  handlers.adminSongList = () => ({ success: true, songs: FULL.map(x => Object.assign({}, x)), categories: ['兒歌', '英文歌曲'] });
  const setup = async () => { log = []; toasts = []; resetAdminSongInfo(); state.songs = PUBLIC(); document.getElementById('songFilter-keyword') && (document.getElementById('songFilter-keyword').value = ''); state.selectedSongCategories = new Set(); applySongFilters(); renderAdminSongsTable(); await wait(80); };
  // 以「標題文字完全相同」找列（「開放的歌」不能誤抓到「不開放的歌」）
  const byTitle = (rows, t) => rows.find(r => [...r.querySelectorAll('*')].some(e => e.children.length === 0 && e.textContent.trim() === t));
  const pubRow = t => byTitle([...document.querySelectorAll('#songsListContainer > div')], t);
  const adminRow = t => byTitle([...document.querySelectorAll('#adminSongsTableBody tr')], t);
  const dlLinks = r => r ? [...r.querySelectorAll('a[target="_blank"]')].filter(a => /download|id=F/.test(a.getAttribute('href') || '')) : [];

  await setup();

  // A. 前台
  ok(dlLinks(pubRow('開放的歌')).length >= 1 && /id=F1/.test(dlLinks(pubRow('開放的歌'))[0].getAttribute('href')), '前台：開放的歌曲有下載圖示（連結指向音樂檔）');
  ok(!!pubRow('不開放的歌') && dlLinks(pubRow('不開放的歌')).length === 0 && !/下載音樂檔/.test(pubRow('不開放的歌').innerHTML), '前台：不開放的歌曲沒有任何下載圖示，但仍列在清單、可播放');
  ok(dlLinks(pubRow('只有 YouTube')).length === 0, '前台：沒有音樂檔的歌曲照舊沒有下載圖示');
  ok(!JSON.stringify(state.songs).includes('id=F2') && !JSON.stringify(state.songs).includes('secret.mp3'), '前台資料（state.songs）找不到不開放那首的檔案網址或檔名');
  ok(!!pubRow('不開放的歌').querySelector('input[type=checkbox]') || !!pubRow('不開放的歌').querySelector('button'), '前台：不開放的歌曲仍可勾選、點擊播放（只是不能下載）');

  // B. 後台表單
  const cb = $('songForm-noDownload');
  ok(!!cb && cb.type === 'checkbox' && cb.checked === false && /不開放下載/.test(cb.closest('label').textContent) && /YouTube/.test(cb.closest('label').textContent), '後台表單有「🔒 不開放下載」勾選框，預設未勾選，說明含只能用 YouTube 播放');

  // C. 後台列表（用完整資料）
  ok(calls('adminSongList').length === 1 && calls('adminSongList')[0].payload.password === 'tok', '後台列表畫出後，用 token 向後端取完整歌單（一次）');
  const r2 = adminRow('不開放的歌'), r1 = adminRow('開放的歌'), r3 = adminRow('只有 YouTube');
  ok(r2.textContent.indexOf('secret.mp3') >= 0 && /id=F2/.test(r2.querySelector('a').getAttribute('href')) && !!r2.querySelector('.admin-song-lock') && /不開放下載/.test(r2.textContent), '後台列表：不開放的歌曲顯示檔名與「🔒 不開放下載」標籤（用登入取得的完整資料）');
  ok(r1.textContent.indexOf('open.mp3') >= 0 && !r1.querySelector('.admin-song-lock') && !r3.querySelector('.admin-song-lock') && /未上傳/.test(r3.textContent), '一般歌曲沒有標籤；沒有音樂檔的顯示「未上傳」');
  renderAdminSongsTable(); renderAdminSongsTable(); await wait(40);
  ok(calls('adminSongList').length === 1, '重複畫列表不會重複向後端要資料');

  // D. 編輯不開放的歌曲
  editSongInAdmin('S2');
  ok($('songForm-noDownload').checked === true && /secret\.mp3|目前檔案/.test($('songForm-fileStatus').textContent + $('songForm-fileStatus').innerHTML), '編輯不開放的歌曲：勾選框已勾、檔案狀態顯示目前檔案（來自完整資料）');
  $('songForm-title').value = '不開放的歌（改名）';
  handlers.saveSong = p => ({ success: true, songId: 'S2', message: '歌曲資訊已成功更新！', noDownload: true });
  handleSaveSong(); await wait(60);
  const sv = calls('saveSong')[0];
  ok(!!sv && sv.payload.songData.id === 'S2' && sv.payload.songData.noDownload === true && sv.payload.songData.driveFileId === 'F2' && sv.payload.songData.downloadUrl.indexOf('id=F2') >= 0 && sv.payload.songData.fileName === 'secret.mp3', '儲存不開放的歌曲：送出 noDownload=true，且帶著完整的檔案資訊（不會存成空白）');
  ok(!JSON.stringify(state.songs.find(s => s.id === 'S2')).includes('F2') && state.songs.find(s => s.id === 'S2').noDownload === true, '儲存後本機公開資料仍不含檔案資訊');
  ok(adminSongFull(state.songs.find(s => s.id === 'S2')).driveFileId === 'F2', '但後台完整資料仍保有檔案資訊');

  // E. 取消勾選
  await setup(); editSongInAdmin('S2'); $('songForm-noDownload').checked = false;
  handlers.saveSong = p => ({ success: true, songId: 'S2', message: 'ok', noDownload: false });
  handleSaveSong(); await wait(60);
  const sv2 = calls('saveSong')[0];
  ok(sv2.payload.songData.noDownload === false && sv2.payload.songData.driveFileId === 'F2', '取消勾選後儲存：送出 noDownload=false（後端會把檔案搬回公開資料夾）');
  ok(state.songs.find(s => s.id === 'S2').downloadUrl.indexOf('id=F2') >= 0, '儲存後前台資料恢復下載網址（本機即時更新）');

  // F. 一般歌曲勾選為不開放
  await setup(); editSongInAdmin('S1'); ok($('songForm-noDownload').checked === false, '編輯一般歌曲：勾選框未勾'); $('songForm-noDownload').checked = true;
  handlers.saveSong = p => ({ success: true, songId: 'S1', message: 'ok', noDownload: true });
  handleSaveSong(); await wait(60);
  const sv3 = calls('saveSong')[0];
  ok(sv3.payload.songData.noDownload === true, '把一般歌曲改為不開放：送出 noDownload=true');
  const s1 = state.songs.find(s => s.id === 'S1');
  ok(s1.noDownload === true && s1.downloadUrl === undefined && s1.driveFileId === undefined && dlLinks(pubRow('開放的歌')).length === 0, '儲存後前台立即看不到下載圖示，公開資料不含網址');
  ok(adminRow('開放的歌') && !!adminRow('開放的歌').querySelector('.admin-song-lock'), '後台列表立即出現「🔒 不開放下載」標籤');

  // G. 警告
  await setup(); editSongInAdmin('S1'); $('songForm-noDownload').checked = true;
  handlers.saveSong = p => ({ success: true, songId: 'S1', message: 'ok', noDownload: true, warning: '已設為不開放，但 Google Drive 權限調整失敗：boom' });
  handleSaveSong(); await wait(60);
  ok(toasts.some(t => /權限調整失敗/.test(t)), '後端回報 Drive 權限調整失敗：畫面顯示警告');

  // H. 上傳
  await setup(); clearSongForm(); $('songForm-youtube').value = 'https://youtu.be/ddddddddddd'; $('songForm-title').value = '新歌'; $('songForm-noDownload').checked = true;
  songFormSelectedFile = new File(['abc'], 'new.mp3', { type: 'audio/mpeg' });
  handlers.uploadSong = p => ({ success: true, songId: 'SONG-NEW', message: 'ok', fileId: 'FN', fileName: 'new.mp3', fileSize: 3, downloadUrl: 'https://drive.google.com/uc?export=download&id=FN', noDownload: true });
  handleSaveSong(); await wait(300);
  const up = calls('uploadSong')[0];
  ok(!!up && up.payload.meta.noDownload === true && up.payload.file.name === 'new.mp3', '上傳音樂檔：meta 帶 noDownload=true');
  const ns = state.songs.find(s => s.id === 'SONG-NEW');
  ok(!!ns && ns.noDownload === true && ns.downloadUrl === undefined && adminSongFull(ns).downloadUrl.indexOf('id=FN') >= 0, '上傳後：前台資料不含網址，後台完整資料有');

  // I. 清空表單與登出
  clearSongForm(); ok($('songForm-noDownload').checked === false, '清空表單：取消勾選');
  await setup(); ok(adminSongInfo.loaded === true, '（前提）完整資料已載入');
  clearAdminSession(); ok(adminSongInfo.loaded === false && Object.keys(adminSongInfo.map).length === 0, '登出：完整資料清除');
  state.adminPassword = ''; log = []; resetAdminSongInfo(); renderAdminSongsTable(); await wait(40);
  ok(calls('adminSongList').length === 0, '沒有登入：不會向後端要完整歌單');
  ok(!adminRow('不開放的歌') || adminRow('不開放的歌').textContent.indexOf('secret.mp3') < 0, '沒有完整資料時，後台列表不顯示不開放歌曲的檔名（只有公開資料）');

  // J. 取完整資料失敗
  state.adminPassword = 'tok'; handlers.adminSongList = () => new Error('boom'); log = []; resetAdminSongInfo(); state.songs = PUBLIC(); renderAdminSongsTable(); await wait(60);
  ok(adminSongInfo.loaded === false && adminSongInfo.loading === false && !!adminRow('不開放的歌'), '取完整歌單失敗：不報錯、列表照常（用公開資料），之後可重試');
  editSongInAdmin('S2'); ok($('songForm-noDownload').checked === true, '失敗時編輯不開放的歌曲：勾選框仍正確（公開資料有 noDownload 旗標）');
  clearSongForm();

  // K. 跳脫
  handlers.adminSongList = () => ({ success: true, songs: FULL.map(x => Object.assign({}, x, x.id === 'S2' ? { fileName: '<img src=x onerror="window.__nodlpwn=1">.mp3' } : {})), categories: [] });
  resetAdminSongInfo(); state.songs = PUBLIC(); renderAdminSongsTable(); await wait(80);
  ok(!window.__nodlpwn && document.querySelectorAll('#adminSongsTableBody img[src="x"]').length === 0 && adminRow('不開放的歌').textContent.indexOf('<img src=x') >= 0, '含標籤的檔名：以純文字顯示，不會執行或注入元素');

  window.callBackend = realCB; window.showToast = realToast; window.confirm = realConfirm;
  state.songs = saved.songs; state.adminPassword = saved.pw; state.songCategories = saved.cats; state.lang = saved.lang; window.handleDataLoaded = realHandle;
  resetAdminSongInfo(); clearSongForm(); try { applySongFilters(); renderAdminSongsTable(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
