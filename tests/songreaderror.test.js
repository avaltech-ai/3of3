// 後台「唱跳音符」選了音樂檔但瀏覽器讀不到時的處理（2026-10-23）。
// 使用者回報：新增歌曲選了 mp3，按儲存後顯示「讀取音樂檔失敗（資料庫可能未更新，請重新整理確認後再試）」。
// 這個錯誤只發生在瀏覽器讀本機檔案那一步（還沒送到雲端），常見原因是檔案還在 iCloud 沒下載、被移動或損毀。
// 原本的訊息看不出怎麼辦，還說「資料庫可能未更新」（其實完全沒送出），已選的壞檔案也留著，再按儲存又會失敗。
// 這裡確認：① 訊息有明確提示且不提資料庫；② 失敗時清掉已選檔案與檔案輸入框，狀態列回到未選取；
// ③ 讀檔失敗確實走這條處理；④ 真正的連線失敗仍維持原本的訊息與提示。
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function grab(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); const j = html.indexOf('\n    }\n', i); return html.slice(i, j + 6); }

const msgLine = (/^ {4}var SONG_READ_FAIL_MSG = .*;$/m.exec(html) || [''])[0];
ok(!!msgLine, '有 SONG_READ_FAIL_MSG（讀不到音樂檔的提示文字）');

function makeEnv(opts) {
  opts = opts || {};
  const log = { progress: [], toasts: [], saving: [], status: [] };
  const els = { 'songForm-fileInput': { value: 'C:\\fakepath\\壞檔.mp3' } };
  const ctx = {
    document: { getElementById: id => els[id] || null },
    state: { songs: opts.songs || [] },
    songFormSelectedFile: { name: '壞檔.mp3', size: 1468006 },
    songFormEditingId: opts.editingId || '',
    songUploadTimer: null,
    clearInterval: () => {},
    setSongSaving: v => log.saving.push(v),
    setSongProgress: (p, s, e, isErr) => log.progress.push({ pct: p, status: s, isErr: !!isErr }),
    showToast: (m, i) => log.toasts.push({ m: m, icon: i }),
    adminSongFull: s => s,
    setSongFormFileStatus: existing => log.status.push({ selected: ctx.songFormSelectedFile, existing: existing })
  };
  vm.createContext(ctx);
  vm.runInContext(msgLine + '\n' + grab('failSongSave') + '\n' + (html.indexOf('    function songFileReadFailed(') > 0 ? grab('songFileReadFailed') : ''), ctx);
  return { ctx, log, els };
}

console.log('A. 讀不到檔案：明確提示、不提資料庫、清掉已選檔案');
const a = makeEnv();
ok(typeof a.ctx.songFileReadFailed === 'function', '有 songFileReadFailed 函式');
a.ctx.songFileReadFailed({ name: 'NotReadableError' });
const msg = a.ctx.SONG_READ_FAIL_MSG || '';
ok(/iCloud/.test(msg) && /原位置|移動/.test(msg) && /重新選取/.test(msg), '提示文字說明可能原因（iCloud 未下載、檔案被移動）與該怎麼做（重新選取）');
ok(/YouTube/.test(msg), '提示文字也告訴老師可以先不選檔案、只用 YouTube 新增');
ok(!/資料庫可能未更新/.test(JSON.stringify(a.log.progress)), '進度列的訊息不再說「資料庫可能未更新」（讀檔失敗時完全沒送出）');
ok(a.log.progress.length === 1 && a.log.progress[0].isErr === true && a.log.progress[0].status.indexOf(msg) >= 0, '進度列顯示紅色錯誤與完整提示文字');
ok(/（錯誤代碼：NotReadableError）$/.test(a.log.progress[0].status), '進度列最後附上瀏覽器回報的錯誤代碼（NotReadableError），之後才能分辨是檔案權限、被移動還是別的原因');
ok(a.log.toasts.length === 1 && !/連線失敗/.test(a.log.toasts[0].m) && /音樂檔/.test(a.log.toasts[0].m), '跳出的提示不說「連線失敗」（不是連線問題），並指出是音樂檔');
ok(a.log.toasts[0].m.length <= 30, '跳出的提示很短（長說明留在進度列）');
ok(a.ctx.songFormSelectedFile === null, '已選的檔案被清掉（再按儲存不會又拿同一個壞檔案）');
ok(a.els['songForm-fileInput'].value === '', '檔案輸入框被清空（選同一個檔案也會觸發 change）');
ok(a.log.saving[a.log.saving.length - 1] === false, '儲存中狀態解除（按鈕可再按）');
ok(a.log.status.length === 1 && a.log.status[0].selected === null && a.log.status[0].existing === null, '檔案狀態列更新成「尚未選取」（新增歌曲沒有原檔案）');

console.log('B. 編輯既有歌曲時讀檔失敗：狀態列回到原本的檔案');
const orig = { id: 'SG01', downloadUrl: 'https://drive.google.com/uc?id=x', fileName: '原檔.mp3', fileSize: 2048 };
const b = makeEnv({ songs: [orig, { id: 'SG02' }], editingId: 'SG01' });
b.ctx.songFileReadFailed(null);
ok(!/錯誤代碼/.test(b.log.progress[0].status), '瀏覽器沒給錯誤物件時不顯示錯誤代碼（不會出現 undefined）');
ok(b.log.status.length === 1 && b.log.status[0].existing === orig && b.ctx.songFormSelectedFile === null, '狀態列顯示原本的檔案（「目前檔案：原檔.mp3」），不會誤以為已換新檔');

console.log('C. 真正的連線失敗仍維持原本的訊息');
const c = makeEnv();
c.ctx.failSongSave(new Error('連線逾時'));
ok(/連線逾時（資料庫可能未更新，請重新整理確認後再試）/.test(c.log.progress[0].status) && c.log.toasts[0].m === '連線失敗：連線逾時', '後端失敗或逾時：進度列仍提醒「資料庫可能未更新」，提示仍是「連線失敗：…」');
ok(c.ctx.songFormSelectedFile !== null, '連線失敗不清掉已選檔案（重按儲存可以直接重試）');

console.log('D. 儲存時：讀檔失敗確實走這條處理（讀檔動作集中在 readSongFileBase64）');
const sv = html.slice(html.indexOf('    function handleSaveSong('), html.indexOf('\n    }\n', html.indexOf('    function handleSaveSong(')) + 6);
ok(/readSongFileBase64\(file,/.test(sv) && /function\(err\) \{ songFileReadFailed\(err\); \}/.test(sv), 'handleSaveSong 用 readSongFileBase64 讀檔，失敗時呼叫 songFileReadFailed 並傳入錯誤');
ok(!/new FileReader\(\)/.test(sv) && !/new Error\('讀取音樂檔失敗'\)/.test(html), 'handleSaveSong 不再自己建 FileReader；舊的「讀取音樂檔失敗」錯誤已不存在');

console.log('E. 讀檔：FileReader 失敗時改用 file.arrayBuffer() 重試（Safari 偶爾對同一個檔案回報 NotReadableError）');
function makeReadEnv(readerMode, bufMode, size) {
  const bytes = Buffer.alloc(size || 100000); for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31 + 7) & 255;
  const calls = { buffer: 0 };
  function FakeReader() { this.error = null; }
  FakeReader.prototype.readAsDataURL = function () {
    const self = this;
    setTimeout(function () {
      if (readerMode === 'ok') { self.onprogress && self.onprogress({ lengthComputable: true, loaded: 5, total: 10 }); self.onload && self.onload({ target: { result: 'data:audio/mpeg;base64,' + bytes.toString('base64') } }); }
      else if (readerMode === 'abort') { self.error = null; self.onabort && self.onabort(); }
      else { self.error = { name: 'NotReadableError' }; self.onerror && self.onerror(); }
    }, 0);
  };
  const file = { name: 'a.mp3', size: bytes.length, type: 'audio/mpeg' };
  if (bufMode !== 'none') file.arrayBuffer = function () { calls.buffer++; return bufMode === 'ok' ? Promise.resolve(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length)) : Promise.reject({ name: 'NotFoundError' }); };
  const ctx = { FileReader: FakeReader, btoa: s => Buffer.from(s, 'latin1').toString('base64'), Uint8Array: Uint8Array, String: String };
  vm.createContext(ctx);
  vm.runInContext(html.indexOf('    function readSongFileBase64(') > 0 ? grab('readSongFileBase64') : '', ctx);
  return { ctx, file, bytes, calls };
}
function run(env) {
  return new Promise(res => {
    const prog = [];
    env.ctx.readSongFileBase64(env.file, function (l, t) { prog.push([l, t]); }, function (b64) { res({ done: b64, prog: prog }); }, function (err) { res({ fail: err, prog: prog }); });
  });
}
(async function () {
  const e1 = makeReadEnv('ok', 'ok'); const r1 = e1.ctx.readSongFileBase64 ? await run(e1) : {};
  ok(typeof e1.ctx.readSongFileBase64 === 'function', '有 readSongFileBase64 函式');
  ok(r1.done === e1.bytes.toString('base64') && e1.calls.buffer === 0, 'FileReader 讀得到：直接用它，不呼叫 arrayBuffer（不改變原本成功的情況）');
  ok(JSON.stringify(r1.prog) === JSON.stringify([[5, 10]]), '讀取進度照常回報（已讀、總量）');
  if (typeof e1.ctx.readSongFileBase64 === 'function') {
    const e2 = makeReadEnv('err', 'ok', 100000); const r2 = await run(e2);
    ok(r2.done === e2.bytes.toString('base64') && e2.calls.buffer === 1, 'FileReader 失敗、arrayBuffer 成功：照樣取得正確的 base64（100000 位元組，涵蓋分段轉換）');
    const e2b = makeReadEnv('err', 'ok', 5); const r2b = await run(e2b);
    ok(r2b.done === e2b.bytes.toString('base64'), '很小的檔案（5 位元組）備援讀法也正確');
    const e3 = makeReadEnv('err', 'bad'); const r3 = await run(e3);
    ok(r3.fail && r3.fail.name === 'NotReadableError→NotFoundError', '兩種讀法都失敗：錯誤代碼兩個都列出（NotReadableError→NotFoundError），方便判斷');
    const e4 = makeReadEnv('err', 'none'); const r4 = await run(e4);
    ok(r4.fail && r4.fail.name === 'NotReadableError', '沒有 arrayBuffer 可用（舊瀏覽器）：回報原本的錯誤');
    const e5 = makeReadEnv('abort', 'ok'); const r5 = await run(e5);
    ok(r5.done === e5.bytes.toString('base64'), '讀檔被中止（onabort）也改用備援讀法');
    const e6 = makeReadEnv('abort', 'none'); const r6 = await run(e6);
    ok(r6.fail && r6.fail.name === 'AbortError', '中止又沒有備援：錯誤代碼是 AbortError');
  }

  console.log('F. 選檔時建立的播放器（讀歌曲長度用）要釋放，不能一直占著檔案');
  const hc = html.indexOf('    function handleSongFileChosen(') > 0 ? grab('handleSongFileChosen') : '';
  const revoked = []; let audio = null; const durEl = { value: '' };
  const cctx = {
    SONG_MAX_FILE_BYTES: 25 * 1024 * 1024, formatSongBytes: n => n + 'B', showToast: () => {}, setSongFormFileStatus: () => {},
    songFormEditingId: '', state: { songs: [] }, adminSongFull: x => x, songFormSelectedFile: null, songTempAudioUrl: '',
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: u => revoked.push(u) },
    Audio: function (src) { audio = this; this.src = src; },
    document: { getElementById: id => id === 'songForm-duration' ? durEl : null },
    Math: Math, isNaN: isNaN
  };
  vm.createContext(cctx); vm.runInContext(hc, cctx);
  cctx.handleSongFileChosen({ target: { files: [{ name: 'a.mp3', size: 1000 }], value: 'x' } });
  ok(audio && typeof audio.onloadedmetadata === 'function' && typeof audio.onerror === 'function', '選檔會建立播放器讀長度，並設好成功與失敗兩個回呼');
  audio.duration = 163; audio.onloadedmetadata();
  ok(durEl.value === '02:43' && revoked.length === 1 && revoked[0] === 'blob:test', '讀到長度（02:43）後釋放檔案的暫時網址');
  revoked.length = 0; durEl.value = '';
  cctx.handleSongFileChosen({ target: { files: [{ name: 'b.mp3', size: 1000 }], value: 'x' } });
  audio.onerror();
  ok(revoked.length === 1 && durEl.value === '', '播放器讀不到（onerror）時也釋放，長度不亂填');
  revoked.length = 0;
  cctx.handleSongFileChosen({ target: { files: [{ name: 'c.mp3', size: 1000 }], value: 'x' } });
  const a2 = audio; cctx.handleSongFileChosen({ target: { files: [{ name: 'd.mp3', size: 1000 }], value: 'x' } });
  ok(revoked.length === 1, '連續選了第二個檔案時，前一個還沒讀完的播放器網址也會被釋放');

  console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
  process.exit(fail ? 1 : 0);
})();
