// 相簿封面候選（每天固定一張）後端測試：取樣、解析、試算表欄位處理、重建、上傳流程與 getAlbums 整合。
// 以模擬的 Drive／Sheets 執行，不碰真實資料。
// 執行：node tests/covers.test.js    （修改 Code.js 的相簿相關程式後必跑，全部 ✓ 才可部署）
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── 模擬環境 ──
function iter(arr) { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; }
function mkSheet(rows) {
  const sh = { rows: rows.map(r => r.slice()), appended: 0 };
  const width = () => sh.rows.reduce((m, r) => Math.max(m, r.length), 0);
  sh.getLastColumn = () => width();
  sh.getDataRange = () => ({ getValues: () => sh.rows.map(r => { const c = r.slice(); while (c.length < width()) c.push(''); return c; }) });
  sh.getRange = (r, c, nr, nc) => ({
    getValues: () => { const out = []; for (let i = 0; i < (nr || 1); i++) { const row = []; for (let j = 0; j < (nc || 1); j++) row.push((sh.rows[r - 1 + i] || [])[c - 1 + j] === undefined ? '' : sh.rows[r - 1 + i][c - 1 + j]); out.push(row); } return out; },
    setValue(v) { while (sh.rows.length < r) sh.rows.push([]); const row = sh.rows[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; return this; },
    setNumberFormat() { return this; }, setFontWeight() { return this; }, setBackground() { return this; }
  });
  sh.appendRow = row => { sh.rows.push(row.slice()); sh.appended++; };
  sh.clear = () => { sh.rows = []; };
  return sh;
}
function mkFile(f) { return { getId: () => f.id, getName: () => f.name, getMimeType: () => f.mime || 'image/jpeg', setSharing() {} }; }
function mkFolder(id, files, opts) {
  opts = opts || {};
  return { id, files, getId: () => id, getName: () => opts.name || ('F-' + id), getUrl: () => 'https://drive.google.com/drive/folders/' + id,
    getDateCreated: () => new Date('2026-01-01T00:00:00Z'), getFiles: () => iter(files.map(mkFile)),
    createFile: blob => { const f = { id: 'NEWFILE' + (files.length + 1) + 'xyz1234', name: blob.name, mime: 'image/jpeg' }; files.push(f); return mkFile(f); },
    getFolders: () => iter(opts.subfolders || []) };
}
function env(opts) {
  opts = opts || {};
  const sheet = opts.sheet || mkSheet([['id', 'category', 'title', 'folderName', 'photoCount', 'coverUrl', 'folderUrl', 'updatedAt']]);
  const folders = opts.folders || {};
  const calls = { clearCache: 0 };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-000000000001', base64Decode: () => [1, 2, 3], newBlob: (b, m, n) => ({ name: n }), formatDate: () => '20260101_000000' },
    DriveApp: { Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 }, getFolderById: id => { if (!folders[id]) throw new Error('No item with the given ID could be found: ' + id); return folders[id]; } },
    SpreadsheetApp: { getUi: () => { throw new Error('no UI'); } }, HtmlService: {}, ContentService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {}
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet = () => ({ getSheetByName: n => (n === 'Albums' ? sheet : null), insertSheet: () => sheet });
  ctx.clearAppDataCache = () => { calls.clearCache++; };
  return { ctx, sheet, calls };
}
const mkEntries = n => Array.from({ length: n }, (_, i) => ({ id: 'IMGID' + String(i).padStart(5, '0') + 'abcdef', name: 'IMG_' + String(i).padStart(4, '0') + '.jpg' }));
const ID = k => 'FOLDERID' + k + 'abcdefghijkl';

console.log('A. 取樣 sampleCoverCandidates_');
let e = env(); let c = e.ctx;
ok(eq(c.sampleCoverCandidates_([], 12), []) && eq(c.sampleCoverCandidates_(undefined), []) && eq(c.sampleCoverCandidates_(null), []), '空清單／undefined／null → 空陣列');
let s5 = c.sampleCoverCandidates_(mkEntries(5)); ok(s5.length === 5 && s5[0] === 'IMGID00000abcdef' && s5[4] === 'IMGID00004abcdef', '≤12 張：全部保留，依檔名排序');
let s12 = c.sampleCoverCandidates_(mkEntries(12)); ok(s12.length === 12, '剛好 12 張：全部保留');
const s470 = c.sampleCoverCandidates_(mkEntries(470));
ok(s470.length === 12 && new Set(s470).size === 12, '470 張：取 12 張且不重複');
const idxs = s470.map(id => Number(id.slice(5, 10)));
ok(idxs.every((v, i) => i === 0 || v > idxs[i - 1]), '取樣結果依檔名順序遞增');
ok(idxs[0] < 470 / 12 && idxs[11] >= 470 - 470 / 12, '涵蓋整場活動：第一張在前段、最後一張在後段');
ok(Math.max.apply(null, idxs.map((v, i) => i ? v - idxs[i - 1] : 0)) <= Math.ceil(470 / 12) + 1, '相鄰候選間距均勻（不會集中在某一段）');
const shuffled = mkEntries(470).sort(() => Math.random() - 0.5);
ok(eq(c.sampleCoverCandidates_(shuffled), s470), '結果與輸入順序無關（Drive 回傳順序不同也得到相同候選）');
const dirty = [{ id: '<script>alert(1)</script>', name: 'a' }, { id: 'short', name: 'b' }, { id: 12345, name: 'c' }, null, undefined, {}, { id: 'GOODID0000000001', name: 'd' }, { id: 'GOODID0000000001', name: 'd2' }, { id: '"><img src=x onerror=1>', name: 'e' }];
ok(eq(c.sampleCoverCandidates_(dirty), ['GOODID0000000001']), '非法 ID、重複、非字串、null 全部被丟棄');
ok(c.sampleCoverCandidates_(mkEntries(100), 50).length === 12 && c.sampleCoverCandidates_(mkEntries(100), 3).length === 3 && c.sampleCoverCandidates_(mkEntries(100), 0.4).length === 1, 'max 參數：上限 12、可調小、小數無條件捨去但至少 1');
ok(c.sampleCoverCandidates_(mkEntries(100), 0).length === 12 && c.sampleCoverCandidates_(mkEntries(100), -5).length === 12 && c.sampleCoverCandidates_(mkEntries(100), 'abc').length === 12 && c.sampleCoverCandidates_(mkEntries(100), NaN).length === 12, 'max 不是正數（0、負數、字串、NaN）→ 一律使用預設值 12');
ok(eq(c.sampleCoverCandidates_(mkEntries(470)), c.sampleCoverCandidates_(mkEntries(470))), '同樣輸入永遠得到同樣結果（決定性）');

console.log('B. 解析 parseCoverCandidates_');
const good = ['AAAAAAAAAA01', 'BBBBBBBBBB02'];
ok(eq(c.parseCoverCandidates_(JSON.stringify(good)), good) && eq(c.parseCoverCandidates_(good), good), 'JSON 字串與陣列都能解析');
ok(eq(c.parseCoverCandidates_(''), []) && eq(c.parseCoverCandidates_(null), []) && eq(c.parseCoverCandidates_(undefined), []) && eq(c.parseCoverCandidates_(123), []), '空值、null、數字 → 空陣列');
ok(eq(c.parseCoverCandidates_('not json'), []) && eq(c.parseCoverCandidates_('{"a":1}'), []) && eq(c.parseCoverCandidates_('["a","b"'), []), '壞掉的 JSON／非陣列 → 空陣列（不拋錯）');
ok(eq(c.parseCoverCandidates_(['"><img src=x onerror=alert(1)>', 'x', 'javascript:alert(1)', 'GOOD000000001', '<b>', 'GOOD000000001']), ['GOOD000000001']), '惡意或格式不符的 ID 被擋下，重複只留一個（防止有人改試算表注入）');
ok(c.parseCoverCandidates_(Array.from({ length: 50 }, (_, i) => 'IDIDIDID' + String(i).padStart(4, '0'))).length === 12, '超過 12 筆只取前 12 筆');

console.log('C. 試算表欄位處理 setAlbumCoverCandidates_');
const baseRows = () => [['id', 'category', 'title', 'folderName', 'photoCount', 'coverUrl', 'folderUrl', 'updatedAt'], [ID('A'), '班級主題', '相簿A', 'A', 10, 'covA', 'urlA', '2026-01-01'], [ID('B'), '幸福廚房', '相簿B', 'B', 20, 'covB', 'urlB', '2026-01-02']];
e = env({ sheet: mkSheet(baseRows()) }); c = e.ctx;
const before = JSON.stringify(e.sheet.rows);
ok(c.setAlbumCoverCandidates_(e.sheet, ID('A'), good) === true, '找到相簿 → 回傳 true');
ok(e.sheet.rows[0][8] === 'coverCandidates', '欄位不存在時自動新增標題 coverCandidates（放在最後一欄）');
ok(e.sheet.rows[1][8] === JSON.stringify(good), '只寫入目標相簿那一格，內容為 JSON');
ok(!e.sheet.rows[2][8], '其他相簿的候選欄不受影響');
ok(eq(e.sheet.rows[1].slice(0, 8), JSON.parse(before)[1].slice(0, 8)) && eq(e.sheet.rows[2].slice(0, 8), JSON.parse(before)[2].slice(0, 8)), '原有 8 欄資料完全沒被改動');
c.setAlbumCoverCandidates_(e.sheet, ID('B'), ['CCCCCCCCCC03']);
ok(e.sheet.rows[0].filter(h => h === 'coverCandidates').length === 1 && e.sheet.rows[2][8] === '["CCCCCCCCCC03"]', '第二次寫入沿用既有欄位，不會重複新增標題');
ok(c.setAlbumCoverCandidates_(e.sheet, 'NOT-EXIST-ID', good) === false, '找不到該相簿 → 回傳 false，且不修改任何資料');
c.setAlbumCoverCandidates_(e.sheet, ID('A'), ['"><img src=x>', 'GOODGOODGOOD1']);
ok(e.sheet.rows[1][8] === '["GOODGOODGOOD1"]', '寫入前再次過濾非法 ID');
const noId = env({ sheet: mkSheet([['title'], ['x']]) }); ok(noId.ctx.setAlbumCoverCandidates_(noId.sheet, 'x', good) === false, '工作表沒有 id 欄 → false（不拋錯）');

console.log('D. 重建 rebuildAlbumCoverCandidates_');
const imgs = n => Array.from({ length: n }, (_, i) => ({ id: 'PHOTO' + String(i).padStart(4, '0') + 'zzzzzz', name: 'P' + String(i).padStart(3, '0') + '.jpg', mime: 'image/jpeg' }));
const foldersD = {};
foldersD[ID('A')] = mkFolder(ID('A'), imgs(40).concat([{ id: 'DOCFILE000000001', name: 'readme.pdf', mime: 'application/pdf' }, { id: 'VIDFILE000000001', name: 'v.mp4', mime: 'video/mp4' }]));
foldersD[ID('B')] = mkFolder(ID('B'), imgs(5));
foldersD[ID('C')] = mkFolder(ID('C'), [{ id: 'DOCFILE000000002', name: 'only.pdf', mime: 'application/pdf' }]);
const rowsD = baseRows(); rowsD.push([ID('C'), '班級主題', '相簿C', 'C', 0, '', 'urlC', '2026-01-03']); rowsD.push([ID('GONE'), '班級主題', '已刪除的相簿', 'G', 3, '', 'urlG', '2026-01-04']); rowsD.push(['', '', '', '', '', '', '', '']);
e = env({ sheet: mkSheet(rowsD), folders: foldersD }); c = e.ctx;
const resD = c.rebuildAlbumCoverCandidates_();
ok(resD.updated === 2, '2 本有圖片的相簿成功建立候選（A、B）');
ok(resD.errors.length === 1 && /GONE/.test(resD.errors[0]), 'Drive 找不到的資料夾 → 記錄為失敗，不中斷其他相簿');
ok(resD.skipped === 2, '沒有圖片的相簿（C）與空白列被略過');
const candA = JSON.parse(e.sheet.rows[1][8]); ok(candA.length === 12 && candA.every(id => /^PHOTO/.test(id)), 'A 相簿：12 張候選，且只包含圖片（不含 pdf／影片）');
ok(eq(JSON.parse(e.sheet.rows[2][8]).length, 5), 'B 相簿：只有 5 張 → 全部保留');
ok(!e.sheet.rows[3][8], 'C 相簿（無圖片）沒有被寫入候選');
ok(e.calls.clearCache === 1, '完成後清除前台資料快取，新候選立即生效');
ok(e.ctx.rebuildAlbumCoverCandidates_().updated === 2 && eq(JSON.parse(e.sheet.rows[1][8]), candA), '重複執行結果相同（冪等）');
const emptyEnv = env({ sheet: mkSheet([['id', 'title']]) }); ok(eq(emptyEnv.ctx.rebuildAlbumCoverCandidates_(), { updated: 0, skipped: 0, errors: [] }), '沒有任何相簿 → 安全回傳 0');
let uiThrew = false; try { e.ctx.menuRebuildCoverCandidates(); } catch (x) { uiThrew = true; }
ok(uiThrew, '選單函式在沒有試算表介面（例如從網頁呼叫）時無法執行');

console.log('E. 上傳最後一個區塊 uploadPhotosChunk 會順便建立候選');
const foldersE = {}; const photosE = imgs(60); foldersE[ID('A')] = mkFolder(ID('A'), photosE.slice());
e = env({ sheet: mkSheet(baseRows()), folders: foldersE }); c = e.ctx;
c.checkPassword = () => true;
const chunkRes = c.uploadPhotosChunk({ albumId: ID('A'), files: [{ base64: 'AAA', name: 'new1.jpg', mimeType: 'image/jpeg' }], isLastChunk: true, password: 'tok' });
ok(chunkRes.success === true && chunkRes.totalPhotos === 61, '上傳成功，照片總數精確（60 + 1 張新上傳）');
const candE = JSON.parse(e.sheet.rows[1][8] || '[]'); ok(candE.length === 12 && new Set(candE).size === 12, '最後一個區塊：寫入 12 張候選');
ok(e.sheet.rows[1][4] === 61 && /^https:\/\/drive\.google\.com\/thumbnail\?id=NEWFILE.*&sz=w600$/.test(e.sheet.rows[1][5]), '照片數已更新；固定封面 coverUrl 維持既有行為（設為該區塊第一張新照片，僅作備援）');
const c2 = env({ sheet: mkSheet(baseRows()), folders: { [ID('A')]: mkFolder(ID('A'), photosE.slice()) } }); c2.ctx.checkPassword = () => true;
c2.ctx.uploadPhotosChunk({ albumId: ID('A'), files: [{ base64: 'AAA', name: 'x.jpg' }], isLastChunk: false, password: 't' });
ok(!c2.sheet.rows[1][8], '不是最後一個區塊：不建立候選（只在最後做一次）');
const c3 = env({ sheet: mkSheet(baseRows()), folders: { [ID('A')]: mkFolder(ID('A'), photosE.slice()) } }); c3.ctx.checkPassword = () => true;
c3.ctx.setAlbumCoverCandidates_ = () => { throw new Error('sheet exploded'); };
const failRes = c3.ctx.uploadPhotosChunk({ albumId: ID('A'), files: [{ base64: 'AAA', name: 'x.jpg' }], isLastChunk: true, password: 't' });
ok(failRes.success === true && failRes.totalPhotos === 61, '建立候選時出錯：上傳仍然成功、照片數正確（候選失敗不影響上傳）');

console.log('F. getAlbums 回傳 coverCandidates');
const rowsF = baseRows(); rowsF[1][8] = JSON.stringify(['CANDIDATE0000001', 'CANDIDATE0000002']); rowsF[0][8] = 'coverCandidates';
rowsF.push(['SHEETONLY-ID-00001', '班級主題', '只在試算表的相簿', 'SO', 7, 'covSO', 'urlSO', '2026-02-01']); while (rowsF[2].length < 9) rowsF[2].push(''); while (rowsF[3].length < 9) rowsF[3].push(''); rowsF[3][8] = '["SHEETONLYCAND01"]';
const subA = mkFolder(ID('A'), imgs(3), { name: 'A' }), subB = mkFolder(ID('B'), imgs(3), { name: 'B' }), subNew = mkFolder('NEWDRIVEFOLDER000001', imgs(2), { name: '剛建立的資料夾' });
const root = mkFolder('ROOT', [], { subfolders: [subA, subB, subNew] });
e = env({ sheet: mkSheet(rowsF), folders: {} }); c = e.ctx;
c.DriveApp.getFolderById = id => root;
const gA = c.getAlbums();
ok(gA.success && gA.albums.length === 4, '回傳 4 本（3 個 Drive 資料夾 + 1 本只在試算表）');
const byId = {}; gA.albums.forEach(a => { byId[a.id] = a; });
ok(eq(byId[ID('A')].coverCandidates, ['CANDIDATE0000001', 'CANDIDATE0000002']), '有候選的相簿：回傳解析後的陣列');
ok(eq(byId[ID('B')].coverCandidates, []), '沒有候選的相簿：回傳空陣列（前端退回固定封面）');
ok(eq(byId['NEWDRIVEFOLDER000001'].coverCandidates, []), '剛建立、尚未登記的資料夾：空陣列');
ok(eq(byId['SHEETONLY-ID-00001'].coverCandidates, ['SHEETONLYCAND01']), '只在試算表的相簿也會帶出候選');
ok(byId[ID('A')].coverUrl === 'covA', '固定封面 coverUrl 仍然保留（作為備援）');
e.sheet.rows[1][8] = '<script>alert(1)</script>'; const gB = c.getAlbums();
ok(eq(gB.albums.find(a => a.id === ID('A')).coverCandidates, []), '試算表被改成惡意內容 → 解析為空陣列，不會流到前台');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
