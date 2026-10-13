// 後台「唱跳音符」歌曲表單模式測試（瀏覽器）：新增／編輯既有的橫幅與顏色、更新前差異確認（含「不開放下載」變更）、沒有變更不送出、未儲存內容防呆。
// 歌曲刻意不提供「另存為新／複製」（兩首歌不能共用同一個音樂檔），測試也確認這點。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { songs: state.songs, pwd: state.adminPassword, info: JSON.stringify(adminSongInfo.map) };
  const real = { confirm: window.confirm, cb: window.callBackend, toast: window.showToast, load: window.loadAppData };
  const $ = id => document.getElementById(id);
  const toasts = [], cbs = [], confirms = []; let answer = true;
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.showToast = m => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  window.callBackend = (a, p, okCb) => { cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true, songId: (p.songData && p.songData.id) || 'NEWSONG' }); };
  state.adminPassword = 'tok'.repeat(15);
  const mk = (id, title, extra) => Object.assign({ id: id, category: '兒歌', title: title, youtubeUrl: 'https://www.youtube.com/watch?v=abcdefghi' + id.slice(-2), youtubeId: 'abcdefghi' + id.slice(-2), duration: '03:45', fileName: id + '.mp3', fileSize: '1000', driveFileId: 'FILE' + id + 'abcdefghijklmn', downloadUrl: 'https://drive.google.com/uc?export=download&id=FILE' + id, noDownload: false }, extra || {});
  const reset = () => { toasts.length = 0; cbs.length = 0; confirms.length = 0; answer = true; songFormSelectedFile = null; state.songs = [mk('SG01', '歌一'), mk('SG02', '歌二')]; adminSongInfo.map = {}; clearSongForm(); };
  const cls = (el, c) => el.className.split(/\s+/).indexOf(c) >= 0;
  const txt = () => $('songFormModeText').textContent;
  const vis = el => !el.classList.contains('hidden');
  const saveCall = () => cbs.filter(c => c.a === 'saveSong')[0];
  const save = () => handleSaveSong({ preventDefault() {} });
  reset();

  // A. 新增
  ok(/新增歌曲：儲存後會建立一首新的歌曲/.test(txt()) && cls($('songFormCard'), 'border-emerald-200') && $('songFormSaveBtn').textContent.trim() === '➕ 新增這首歌曲' && cls($('songFormSaveBtn'), 'bg-emerald-500') && !vis($('songFormCancelBtn')), '新增模式：綠色橫幅、按鈕「➕ 新增這首歌曲」、沒有「取消編輯」');
  ok(!$('songFormSaveAsNewBtn') && !document.querySelector('#adminPanel-songs button[onclick*="copySong"]'), '歌曲表單沒有「另存為新」與「複製」（音樂檔不能被兩首歌共用）');

  // B. 編輯
  editSongInAdmin('SG01');
  ok(/正在編輯既有歌曲「歌一」/.test(txt()) && /會修改這首原本的內容/.test(txt()) && cls($('songFormCard'), 'border-amber-400') && !cls($('songFormCard'), 'border-emerald-200'), '編輯模式：橘色橫幅「正在編輯既有歌曲「歌一」…會修改這首原本的內容」、卡片橘框');
  ok($('songFormSaveBtn').textContent.trim() === '💾 更新原歌曲' && cls($('songFormSaveBtn'), 'bg-amber-500') && !cls($('songFormSaveBtn'), 'bg-fuchsia-600') && vis($('songFormCancelBtn')) && $('songForm-title').value === '歌一', '編輯模式：「💾 更新原歌曲」、有「取消編輯」，帶入原內容');

  // C. 沒有變更
  save(); ok(cbs.length === 0 && confirms.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]), '沒改任何東西就更新：提示「沒有任何變更」，不確認、不送出');

  // D. 有變更
  $('songForm-title').value = '歌一（新）'; $('songForm-noDownload').checked = true; $('songForm-duration').value = '04:10';
  answer = false; save();
  ok(confirms.length === 1 && /即將修改原歌曲「歌一」/.test(confirms[0]) && /歌名：歌一 → 歌一（新）/.test(confirms[0]) && /不開放下載：否 → 是/.test(confirms[0]) && /時長：03:45 → 04:10/.test(confirms[0]), '更新前列出差異（歌名、時長，以及「不開放下載：否 → 是」）');
  ok(cbs.length === 0 && state.songs[0].title === '歌一' && $('songForm-title').value === '歌一（新）' && /正在編輯/.test(txt()), '按取消：沒送出、原歌曲不變、表單內容與編輯模式保留');
  answer = true; save();
  ok(!!saveCall() && saveCall().p.songData.id === 'SG01' && saveCall().p.songData.title === '歌一（新）' && saveCall().p.songData.noDownload === true && saveCall().p.songData.driveFileId === 'FILESG01abcdefghijklmn', '確定更新：以原編號 SG01 送出，沿用原音樂檔資訊，不開放下載＝是');
  ok(/已更新原歌曲「歌一（新）」/.test(toasts.join('|')) && state.songs.length === 2, '提示「已更新原歌曲」、歌曲數不變');
  await wait(1400); ok(/新增歌曲/.test(txt()) && cls($('songFormCard'), 'border-emerald-200') && $('songFormSaveBtn').textContent.trim() === '➕ 新增這首歌曲', '儲存完成後表單自動重設回新增模式（不會多問「放棄嗎」）');
  ok(confirms.length === 2, '整個流程只有那兩次差異確認');

  // E. 新增
  reset(); $('songForm-youtube').value = 'https://www.youtube.com/watch?v=zzzzzzzzzzz'; $('songForm-title').value = '全新歌曲';
  if (!$('songForm-category').value) { const o = document.createElement('option'); o.value = '兒歌'; o.textContent = '兒歌'; $('songForm-category').appendChild(o); $('songForm-category').value = '兒歌'; }
  save();
  ok(confirms.length === 0 && !!saveCall() && saveCall().p.songData.id === '' && /已新增歌曲「全新歌曲」/.test(toasts.join('|')), '新增模式存檔：不跳確認、沒有編號（後端建立新的一首）、提示「已新增歌曲」');
  await wait(1400);

  // F. 防呆
  reset(); editSongInAdmin('SG01'); editSongInAdmin('SG02');
  ok(confirms.length === 0 && /歌二/.test(txt()) && $('songForm-title').value === '歌二', '沒有改動時直接切到另一首：不跳確認');
  $('songForm-title').value = '改到一半'; answer = false; editSongInAdmin('SG01');
  ok(confirms.length === 1 && /尚未儲存/.test(confirms[0]) && $('songForm-title').value === '改到一半' && /歌二/.test(txt()), '改到一半去編輯別首：先問，取消則留在原處、內容還在');
  clearSongFormGuarded(); ok(confirms.length === 2 && $('songForm-title').value === '改到一半', '「取消編輯」／「清空表單」遇到未儲存內容：先確認，取消則保留');
  answer = true; clearSongFormGuarded(); ok($('songForm-title').value === '' && /新增歌曲/.test(txt()), '確定放棄：表單清空、回到新增模式');
  confirms.length = 0; editSongInAdmin('SG01'); clearSongFormGuarded(); ok(confirms.length === 0 && /新增歌曲/.test(txt()), '剛按編輯、沒改內容就取消：不跳確認');
  confirms.length = 0; $('songForm-title').value = '新增寫到一半'; answer = false; editSongInAdmin('SG01'); ok(confirms.length === 1 && $('songForm-title').value === '新增寫到一半', '新增模式寫到一半去編輯別首：先確認');
  answer = true; clearSongForm(); editSongInAdmin('SG01'); songFormSelectedFile = { name: 'new.mp3', size: 5000 }; confirms.length = 0; answer = false; clearSongFormGuarded();
  ok(confirms.length === 1 && songFormDirty(), '選了新的音樂檔（尚未上傳）也算未儲存內容'); songFormSelectedFile = null; answer = true;

  // G. 安全
  reset(); state.songs[0].title = '<img src=x onerror=window.__sgpwn=1>惡意'; editSongInAdmin('SG01');
  ok(!window.__sgpwn && !$('songFormModeBanner').querySelector('img') && $('songFormModeText').textContent.indexOf('<img') >= 0, '惡意歌名：橫幅以純文字顯示，沒有注入元素');

  reset(); window.confirm = real.confirm; window.callBackend = real.cb; window.showToast = real.toast; window.loadAppData = real.load;
  state.songs = saved.songs; state.adminPassword = saved.pwd; window.handleDataLoaded = realHandle;
  try { adminSongInfo.map = JSON.parse(saved.info); renderAdminSongsTable(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
