// 唱跳音符「不開放下載」後端測試：公開資料不含檔案資訊、後台專用完整歌單、儲存時的 Drive 存取調整（私人資料夾、搬回）、
// 安全網（不清空檔案資訊、沿用原設定）、上傳、doPost 路由。以模擬的 Sheets 與 Drive 執行。執行：node tests/songnodl.test.js（已納入 tests/ci.sh）
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

function mkSheet(rows) {
  const sh = { rows: rows.map(r => r.slice()) };
  const width = () => sh.rows.reduce((m, r) => Math.max(m, r.length), 0);
  const cell = (r, c) => ((sh.rows[r - 1] || [])[c - 1] === undefined ? '' : sh.rows[r - 1][c - 1]);
  sh.getLastRow = () => sh.rows.length; sh.getLastColumn = () => width();
  sh.getDataRange = () => ({ getValues: () => sh.rows.map(r => { const c = r.slice(); while (c.length < width()) c.push(''); return c; }) });
  sh.getRange = (r, c, nr, nc) => {
    const R = nr || 1, C = nc || 1;
    const self = {
      getValues: () => { const out = []; for (let i = 0; i < R; i++) { const row = []; for (let j = 0; j < C; j++) row.push(cell(r + i, c + j)); out.push(row); } return out; },
      setValue(v) { return self.setValues([[v]]); },
      setValues(vals) { for (let i = 0; i < vals.length; i++) { while (sh.rows.length < r + i) sh.rows.push([]); const row = sh.rows[r - 1 + i]; for (let j = 0; j < vals[i].length; j++) { while (row.length < c - 1 + j) row.push(''); row[c - 1 + j] = vals[i][j]; } } return self; },
      setNumberFormat() { return self; }, setFontWeight() { return self; }, setBackground() { return self; }
    };
    return self;
  };
  sh.appendRow = row => { sh.rows.push(row.slice()); };
  sh.setFrozenRows = () => {};
  return sh;
}
const TOK = 'tok';
const HEAD = ['id', 'category', 'title', 'youtubeUrl', 'youtubeId', 'duration', 'fileName', 'fileSize', 'driveFileId', 'downloadUrl', 'updatedAt', 'noDownload'];
const row = (o) => HEAD.map(h => o[h] === undefined ? '' : o[h]);
const SONGS = () => [HEAD,
  row({ id: 'S1', category: '兒歌', title: '開放的歌', youtubeUrl: 'https://youtu.be/abcdefghijk', youtubeId: 'abcdefghijk', duration: '02:00', fileName: 'a.mp3', fileSize: 100, driveFileId: 'F1', downloadUrl: 'https://drive.google.com/uc?export=download&id=F1' }),
  row({ id: 'S2', category: '兒歌', title: '不開放的歌', youtubeUrl: 'https://youtu.be/bbbbbbbbbbb', youtubeId: 'bbbbbbbbbbb', duration: '03:00', fileName: 'b.mp3', fileSize: 200, driveFileId: 'F2', downloadUrl: 'https://drive.google.com/uc?export=download&id=F2', noDownload: true }),
  row({ id: 'S3', category: '兒歌', title: '只有 YouTube', youtubeUrl: 'https://youtu.be/ccccccccccc', youtubeId: 'ccccccccccc', duration: '01:00' })];

function env(opts) {
  opts = opts || {};
  const book = { Songs: mkSheet(opts.songs || SONGS()), SongCategories: mkSheet([['categoryName'], ['兒歌']]) };
  const drive = { files: { F1: { parent: 'SONGS', access: 'ANYONE' }, F2: { parent: 'PRIVATE', access: 'PRIVATE' } }, ops: [], folders: {}, failOn: opts.failOn || null, nextId: 1 };
  const store = {}; let clears = 0;
  const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = String(v); }, remove: k => { delete store[k]; } };
  const mkFolder = (id) => ({ id, setSharing() { drive.ops.push(['folderShare', id]); }, createFile(blob) { const fid = 'N' + (drive.nextId++); drive.files[fid] = { parent: id, access: 'DEFAULT', name: blob.name }; drive.ops.push(['create', fid, id]); return fileObj(fid); } });
  const fileObj = (fid) => ({ getId: () => fid,
    setSharing(a) { if (drive.failOn === 'share') throw new Error('share boom'); drive.files[fid].access = a; drive.ops.push(['share', fid, a]); },
    moveTo(folder) { if (drive.failOn === 'move') throw new Error('move boom'); drive.files[fid].parent = folder.id; drive.ops.push(['move', fid, folder.id]); },
    setTrashed() { drive.files[fid].trashed = true; } });
  const ctx = { console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => cache }, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { formatDate: () => '2026-10-07', base64Decode: s => Array.from(Buffer.from(s, 'base64')), newBlob: (b, m, n) => ({ bytes: b, mime: m, name: n }) },
    DriveApp: { Access: { PRIVATE: 'PRIVATE', ANYONE_WITH_LINK: 'ANYONE' }, Permission: { NONE: 'NONE', VIEW: 'VIEW' },
      getFileById: id => { if (!drive.files[id]) throw new Error('no file ' + id); return fileObj(id); },
      getFolderById: id => { drive.ops.push(['getFolder', id]); return mkFolder(id === ctx.__songsId ? 'SONGS' : id); },
      getRootFolder: () => ({ getFoldersByName: n => { const f = drive.folders[n]; return { hasNext: () => !!f, next: () => f }; }, createFolder: n => { drive.ops.push(['createFolder', n]); drive.folders[n] = mkFolder('PRIVATE'); return drive.folders[n]; } }) },
    HtmlService: {}, UrlFetchApp: { fetch: () => ({ getResponseCode: () => 500 }) }, Session: {}, ScriptApp: {}, SpreadsheetApp: { getUi: () => { throw new Error('no UI'); } },
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this; } }) } };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.__songsId = vm.runInContext('SONGS_FOLDER_ID', ctx);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => { book[n] = mkSheet([]); return book[n]; } };
  ctx.getSpreadsheet = () => ss; ctx.checkPassword = p => p === TOK;
  ctx.clearAppDataCache = () => { clears++; };
  return { ctx, book, drive, store, clears: () => clears, songRow: id => { const r = book.Songs.rows.find(x => x[0] === id); const o = {}; HEAD.forEach((h, i) => { o[h] = r ? r[i] : undefined; }); return o; } };
}
const driveOps = (e, kinds) => e.drive.ops.filter(o => kinds.indexOf(o[0]) !== -1);
const base = (o) => Object.assign({ id: 'S1', category: '兒歌', title: '開放的歌', youtubeUrl: 'https://youtu.be/abcdefghijk', duration: '02:00' }, o);

console.log('A. 判斷與公開檢視');
const t0 = env().ctx;
[[true, true], ['TRUE', true], ['true', true], [' 是 ', true], ['不開放', true], [1, true], ['1', true], [false, false], ['FALSE', false], ['', false], [undefined, false], [null, false], [0, false], ['否', false], ['開放', false]]
  .forEach(([v, exp]) => ok(t0.songNoDownload_(v) === exp, 'songNoDownload_(' + JSON.stringify(v) + ') = ' + exp));
const full = { id: 'S2', title: 't', youtubeUrl: 'u', fileName: 'b.mp3', fileSize: 1, driveFileId: 'F2', downloadUrl: 'https://x', noDownload: 'TRUE' };
const pubB = t0.songPublicView_(full);
ok(pubB.noDownload === true && pubB.fileName === undefined && pubB.fileSize === undefined && pubB.driveFileId === undefined && pubB.downloadUrl === undefined && pubB.title === 't' && pubB.youtubeUrl === 'u', '不開放：公開檢視拿掉檔名、大小、檔案 ID、下載網址，保留其他欄位與 noDownload:true');
ok(!JSON.stringify(pubB).includes('F2') && !JSON.stringify(pubB).includes('drive.google'), '公開檢視序列化後完全找不到檔案 ID 或網址');
ok(full.downloadUrl === 'https://x' && full.driveFileId === 'F2', '不會改動傳入的物件');
const pubO = t0.songPublicView_({ id: 'S1', title: 't', fileName: 'a.mp3', driveFileId: 'F1', downloadUrl: 'https://y', noDownload: '' });
ok(pubO.downloadUrl === 'https://y' && pubO.driveFileId === 'F1' && !('noDownload' in pubO), '開放的歌：原樣，且不帶 noDownload 欄（資料量不增加）');
ok(t0.songPublicView_(null) === null && t0.songPublicView_(undefined) === undefined, 'null、undefined 不出錯');

console.log('B. getAppData 的公開歌曲');
{
  const e = env(); const names = ['Events', 'Menus', 'Spotlight', 'Docs', 'DocCategories', 'Settings'];
  const orig = e.ctx.getSpreadsheet();
  const ss = { getSheetByName: n => e.book[n] || (names.indexOf(n) >= 0 ? (e.book[n] = mkSheet([['id']])) : null), insertSheet: n => (e.book[n] = mkSheet([])) };
  e.ctx.getSpreadsheet = () => ss;
  ['ensureDatabaseInitialized', 'ensureAlbumSheetsExist', 'getAlbums', 'getThemesData', 'getNameMapForApp_', 'getActivityFolder'].forEach(n => { e.ctx[n] = () => (n === 'getAlbums' ? { albums: [] } : n === 'getThemesData' ? { themes: [], semesters: [] } : n === 'getNameMapForApp_' ? {} : null); });
  let r; try { r = e.ctx.getAppData(); } catch (err) { r = { success: false, error: String(err) }; }
  const songs = r && r.success ? r.data.songs : null;
  ok(!!songs && songs.length === 3, 'getAppData 回傳 3 首歌曲（' + (r && r.error ? r.error : 'ok') + '）');
  if (songs) {
    const s1 = songs.find(s => s.id === 'S1'), s2 = songs.find(s => s.id === 'S2'), s3 = songs.find(s => s.id === 'S3');
    ok(s1.downloadUrl && s1.driveFileId === 'F1' && !('noDownload' in s1), '開放的歌：照常帶下載資訊');
    ok(s2.noDownload === true && s2.downloadUrl === undefined && s2.driveFileId === undefined && s2.fileName === undefined, '不開放的歌：公開資料沒有下載網址、檔案 ID、檔名');
    ok(s3.title === '只有 YouTube', '沒有音樂檔的歌：不受影響');
    const cached = e.store['app_data_v4'] || '';
    ok(cached.length > 0 && !JSON.stringify(r).includes('id=F2') && !cached.includes('id=F2') && !cached.includes('"F2"') && cached.includes('id=F1'), '整份公開資料與寫入快取的內容，都找不到不開放那首的下載網址或檔案 ID（開放那首仍在）');
  }
}

console.log('C. adminSongList（後台專用，需 token）');
{
  const e = env(); const c = e.ctx;
  let r = c.adminSongList('bad'); ok(r.success === false && r.authExpired === true, '錯誤 token → 拒絕並要求重新登入');
  r = c.adminSongList(undefined); ok(r.success === false, '沒有 token → 拒絕');
  r = c.adminSongList(TOK);
  const s2 = r.songs && r.songs.find(s => s.id === 'S2');
  ok(r.success && r.songs.length === 3 && s2.noDownload === true && s2.driveFileId === 'F2' && /id=F2/.test(s2.downloadUrl) && s2.fileName === 'b.mp3', '正確 token：完整歌單，含不開放的歌的檔案資訊，noDownload 為布林值');
  ok(r.songs.find(s => s.id === 'S1').noDownload === false && Array.isArray(r.categories) && r.categories[0] === '兒歌', '開放的歌 noDownload=false；附類別');
}

console.log('D. saveSong：Drive 存取調整');
{
  let e = env(); let r = e.ctx.saveSong(base({ noDownload: true, fileName: 'a.mp3', fileSize: 100, driveFileId: 'F1', downloadUrl: 'D1' }), 'bad');
  ok(r.success === false && r.authExpired === true && e.drive.ops.length === 0, '錯誤 token：拒絕，Drive 完全沒被動');

  e = env(); r = e.ctx.saveSong(base({ noDownload: true, fileName: 'a.mp3', fileSize: 100, driveFileId: 'F1', downloadUrl: 'D1' }), TOK);
  ok(r.success && r.noDownload === true && !r.warning, '開放 → 不開放：成功');
  ok(e.drive.files.F1.access === 'PRIVATE' && e.drive.files.F1.parent === 'PRIVATE', '檔案設為私人，並搬到私人資料夾（唱跳音符資料夾是公開的，只改權限不夠）');
  ok(driveOps(e, ['createFolder']).length === 1 && e.drive.folders['唱跳音符_不開放下載'], '私人資料夾「唱跳音符_不開放下載」自動建立在根目錄');
  ok(e.songRow('S1').noDownload === true && e.songRow('S1').driveFileId === 'F1' && e.songRow('S1').downloadUrl === 'D1', '試算表：noDownload 欄為 TRUE，檔案資訊保留');
  ok(e.clears() >= 1, '儲存後清除快取（公開資料立即更新）');

  r = e.ctx.saveSong(base({ noDownload: false, fileName: 'a.mp3', fileSize: 100, driveFileId: 'F1', downloadUrl: 'D1' }), TOK);
  ok(r.success && r.noDownload === false && e.drive.files.F1.access === 'ANYONE' && e.drive.files.F1.parent === 'SONGS', '不開放 → 開放：搬回唱跳音符資料夾並設為「知道連結者可檢視」');
  ok(e.songRow('S1').noDownload === '', '試算表：noDownload 欄清空');

  e = env(); e.ctx.saveSong(base({ id: 'S2', title: '不開放的歌', youtubeUrl: 'https://youtu.be/bbbbbbbbbbb', noDownload: true, fileName: 'b.mp3', fileSize: 200, driveFileId: 'F2', downloadUrl: 'D2' }), TOK);
  ok(driveOps(e, ['move', 'share', 'create', 'createFolder']).length === 0, '原本就是不開放、檔案沒換、再儲存：不重複動 Drive');
  e = env(); e.ctx.saveSong(base({ fileName: 'a.mp3', fileSize: 100, driveFileId: 'F1', downloadUrl: 'D1' }), TOK);
  ok(driveOps(e, ['move', 'share', 'create', 'createFolder']).length === 0, '開放的歌照舊儲存：完全不動 Drive');

  e = env(); r = e.ctx.saveSong({ id: 'S2', category: '兒歌', title: '不開放的歌（改名）', youtubeUrl: 'https://youtu.be/bbbbbbbbbbb', duration: '03:00', noDownload: true }, TOK);
  const s2 = e.songRow('S2');
  ok(r.success && s2.driveFileId === 'F2' && s2.fileName === 'b.mp3' && s2.fileSize === 200 && /id=F2/.test(s2.downloadUrl) && s2.title === '不開放的歌（改名）', '安全網：更新時沒帶檔案資訊（畫面拿到的是公開資料）→ 保留原本的檔案資訊，不會被清空');
  e = env(); r = e.ctx.saveSong({ id: 'S2', category: '兒歌', title: '改名', youtubeUrl: 'https://youtu.be/bbbbbbbbbbb', duration: '03:00' }, TOK);
  ok(e.songRow('S2').noDownload === true && r.noDownload === true && driveOps(e, ['move', 'share']).length === 0, '沒帶 noDownload 欄（舊版畫面）→ 沿用原本的不開放，不會意外變回開放');
  e = env(); e.ctx.saveSong({ id: 'S1', category: '兒歌', title: '開放的歌', youtubeUrl: 'https://youtu.be/abcdefghijk', duration: '02:00' }, TOK);
  ok(e.songRow('S1').noDownload === '' && e.songRow('S1').driveFileId === 'F1', '沒帶檔案資訊的開放歌曲：也保留檔案資訊');

  e = env(); r = e.ctx.saveSong({ id: 'S1', category: '兒歌', title: '開放的歌', youtubeUrl: 'https://youtu.be/abcdefghijk', duration: '02:00', noDownload: true, fileName: 'new.mp3', fileSize: 5, driveFileId: 'F9', downloadUrl: 'D9' }, TOK);
  ok(e.drive.files.F1 && e.drive.files.F1.access === 'PRIVATE' && e.drive.files.F1.parent === 'PRIVATE', '換了檔案且設為不開放：舊檔（原本公開的）也一併設為私人');

  e = env(); e.drive.files.F9 = { parent: 'SONGS', access: 'ANYONE' };
  r = e.ctx.saveSong(base({ id: 'NEW', title: '新歌', youtubeUrl: 'https://youtu.be/ddddddddddd', noDownload: true, fileName: 'n.mp3', fileSize: 5, driveFileId: 'F9', downloadUrl: 'D9' }), TOK);
  ok(r.success && e.drive.files.F9.access === 'PRIVATE' && e.drive.files.F9.parent === 'PRIVATE' && e.songRow('NEW').noDownload === true, '新增歌曲並直接設為不開放（檔案已存在）：搬到私人資料夾');
  e = env(); r = e.ctx.saveSong(base({ id: 'NEW2', title: '只有 YouTube', youtubeUrl: 'https://youtu.be/eeeeeeeeeee', noDownload: true }), TOK);
  ok(r.success && e.songRow('NEW2').noDownload === true && driveOps(e, ['move', 'share', 'createFolder']).length === 0, '沒有音樂檔的歌也可標示不開放：只存旗標，不動 Drive、不建資料夾');

  e = env({ failOn: 'move' }); r = e.ctx.saveSong(base({ noDownload: true, fileName: 'a.mp3', fileSize: 100, driveFileId: 'F1', downloadUrl: 'D1' }), TOK);
  ok(r.success === true && /Google Drive 權限調整失敗/.test(r.warning || '') && e.songRow('S1').noDownload === true, 'Drive 調整失敗：仍存下「不開放」（公開資料已不含網址），並回報警告請手動處理');
  e = env({ failOn: 'move' }); r = e.ctx.saveSong(base({ id: 'S2', title: '不開放的歌', youtubeUrl: 'https://youtu.be/bbbbbbbbbbb', noDownload: false, fileName: 'b.mp3', fileSize: 200, driveFileId: 'F2', downloadUrl: 'D2' }), TOK);
  ok(r.success === true && !!r.warning && e.songRow('S2').noDownload === '', '改回開放時 Drive 失敗：同樣回報警告');
}

console.log('E. uploadSong');
{
  const file = { name: 'new.mp3', mimeType: 'audio/mpeg', base64: Buffer.from('abc').toString('base64') };
  let e = env(); let r = e.ctx.uploadSong({ id: 'U1', category: '兒歌', title: '上傳不開放', youtubeUrl: 'https://youtu.be/fffffffffff', duration: '01:00', noDownload: true }, file, TOK);
  const nf = r.fileId && e.drive.files[r.fileId];
  ok(r.success && r.noDownload === true && nf.parent === 'PRIVATE' && nf.access === 'PRIVATE', '上傳並不開放：直接建立在私人資料夾，權限私人');
  ok(!e.drive.ops.some(o => o[0] === 'share' && o[2] === 'ANYONE') && !e.drive.ops.some(o => o[0] === 'move'), '全程沒有公開過（沒有「知道連結者可檢視」）、也不需要再搬動');
  ok(e.songRow('U1').noDownload === true && e.songRow('U1').driveFileId === r.fileId, '試算表：旗標與檔案 ID 正確');
  e = env(); r = e.ctx.uploadSong({ id: 'U2', category: '兒歌', title: '上傳開放', youtubeUrl: 'https://youtu.be/ggggggggggg', duration: '01:00' }, file, TOK);
  const of = e.drive.files[r.fileId];
  ok(r.success && r.noDownload === false && of.parent === 'SONGS' && of.access === 'ANYONE' && e.songRow('U2').noDownload === '', '上傳一般歌曲：照舊放唱跳音符資料夾並公開');
  ok(driveOps(e, ['createFolder']).length === 0, '一般歌曲不會建立私人資料夾');
  e = env({ failOn: 'share' }); r = e.ctx.uploadSong({ id: 'U3', category: '兒歌', title: 'x', youtubeUrl: 'https://youtu.be/hhhhhhhhhhh', duration: '01:00', noDownload: true }, file, TOK);
  const failedFiles = Object.keys(e.drive.files).filter(k => e.drive.files[k].trashed);
  ok(r.success === false && /私人/.test(r.error || '') && failedFiles.length === 1 && !e.songRow('U3').id, '無法把新檔設為私人：取消上傳、丟進垃圾桶、不寫入試算表（寧可失敗也不公開）');
  e = env(); r = e.ctx.uploadSong({ id: 'U4', category: '兒歌', title: 'x', youtubeUrl: 'https://youtu.be/iiiiiiiiiii', duration: '01:00', noDownload: true }, file, 'bad');
  ok(r.success === false && r.authExpired === true && e.drive.ops.length === 0, '錯誤 token：拒絕，沒建立檔案');
  e = env(); r = e.ctx.uploadSong({ id: 'U5', category: '兒歌', title: 'x', youtubeUrl: 'https://youtu.be/jjjjjjjjjjj', duration: '01:00', noDownload: 'TRUE' }, file, TOK);
  ok(r.success && r.noDownload === true, 'noDownload 以字串 "TRUE" 傳入也視為不開放');
}

console.log('F. doPost 路由');
{
  const e = env();
  const post = o => JSON.parse(e.ctx.doPost({ postData: { contents: JSON.stringify(o) } }).text);
  let r = post({ action: 'adminSongList', password: 'bad' });
  ok(r.success === false && r.authExpired === true, 'adminSongList：錯誤 token 一律拒絕');
  r = post({ action: 'adminSongList', password: TOK });
  ok(r.success === true && r.songs.length === 3 && r.songs.find(s => s.id === 'S2').downloadUrl, 'adminSongList：正確 token 回完整歌單');
  r = post({ action: 'saveSong', password: TOK, songData: base({ noDownload: true, fileName: 'a.mp3', fileSize: 100, driveFileId: 'F1', downloadUrl: 'D1' }) });
  ok(r.success === true && r.noDownload === true && e.drive.files.F1.parent === 'PRIVATE', 'doPost saveSong：不開放走完整流程');
  const getRes = (() => { try { return JSON.parse(e.ctx.doGet({ parameter: { action: 'adminSongList' } }).text); } catch (err) { return { success: false }; } })();
  ok(getRes.success === false && getRes.error === '未知動作', 'doGet 沒有 adminSongList：公開的 GET 拿不到完整歌單');
}

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
