// 常用文件「一份文件多個檔案」後端測試（2026-10-19）：Docs 新增 files 欄（JSON 清單）、單檔上傳 uploadDocFile、
// saveDoc 驗證與相容舊前端、公開資料的解析。以模擬的 Drive 與試算表執行，不碰真實資料。執行：node tests/docfiles.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mkSheet(rows) {
  const sh = { rows: rows.map(r => r.slice()) };
  const width = () => sh.rows.reduce((m, r) => Math.max(m, r.length), 0);
  const cell = (r, c) => ((sh.rows[r - 1] || [])[c - 1] === undefined ? '' : sh.rows[r - 1][c - 1]);
  sh.getLastRow = () => sh.rows.length;
  sh.getLastColumn = () => width();
  sh.getDataRange = () => ({ getValues: () => sh.rows.map(r => { const c = r.slice(); while (c.length < width()) c.push(''); return c; }) });
  sh.getRange = (r, c, nr, nc) => {
    const R = nr || 1, C = nc || 1;
    const self = {
      getValues: () => { const out = []; for (let i = 0; i < R; i++) { const row = []; for (let j = 0; j < C; j++) row.push(cell(r + i, c + j)); out.push(row); } return out; },
      setValue(v) { return self.setValues([[v]]); },
      setValues(vals) { for (let i = 0; i < vals.length; i++) { while (sh.rows.length < r + i) sh.rows.push([]); const row = sh.rows[r - 1 + i]; for (let j = 0; j < vals[i].length; j++) { while (row.length < c + j) row.push(''); row[c - 1 + j] = vals[i][j]; } } return self; },
      setNumberFormat() { return self; }, setFontWeight() { return self; }, setBackground() { return self; }
    };
    return self;
  };
  sh.appendRow = row => { sh.rows.push(row.slice()); };
  sh.deleteRow = r => { sh.rows.splice(r - 1, 1); };
  sh.insertColumnAfter = () => {};
  return sh;
}

const TOK = 'tok';
const DOCS_FOLDER = '1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR';
function env(sheets, opts) {
  opts = opts || {};
  const book = {}; Object.keys(sheets || {}).forEach(k => { book[k] = mkSheet(sheets[k]); });
  const store = {}; const calls = { clearApp: 0, created: [], shared: [], folders: [] };
  const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = String(v); }, remove: k => { delete store[k]; },
    putAll: o => { Object.keys(o).forEach(k => { store[k] = String(o[k]); }); }, removeAll: ks => ks.forEach(k => delete store[k]) };
  let idn = 0;
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: {
      base64Decode: s => Array.from(Buffer.from(String(s), 'base64')),
      newBlob: (bytes, mime, name) => ({ bytes: bytes, mime: mime, name: name }),
      formatDate: (d, tz, pat) => pat === 'yyyy-MM-dd' ? '2026-10-19' : '20261019120000'
    },
    DriveApp: {
      Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' }, Permission: { VIEW: 'VIEW' },
      getFolderById: id => { calls.folders.push(id); return { createFile: blob => {
        if (opts.createFails) throw new Error('Drive 目前無法使用');
        const f = { id: 'FILEID' + (++idn) + 'ABCDEFGHIJ', blob: blob, getId() { return f.id; }, setSharing(a, p) { if (opts.shareFails) throw new Error('不允許分享'); calls.shared.push([f.id, a, p]); } };
        calls.created.push(f); return f; } }; }
    },
    HtmlService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {},
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this; } }) },
    SpreadsheetApp: { getUi: () => { throw new Error('no UI'); } }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => { book[n] = mkSheet([]); return book[n]; } };
  ctx.getSpreadsheet = () => ss; ctx.checkPassword = p => p === TOK;
  ctx.clearAppDataCache = () => { calls.clearApp++; };
  return { ctx, ss, book, store, calls };
}
const HDR = ['id', 'fileName', 'category', 'description', 'driveFileId', 'downloadUrl', 'updatedAt'];
const DOCS = () => [HDR, ['DOC-01', '託藥單', '保健用藥', '說明', 'OLDFILEID0001', 'https://drive.google.com/uc?export=download&id=OLDFILEID0001', '2026-10-02']];
const url = id => 'https://drive.google.com/uc?export=download&id=' + id;
const F = o => Object.assign({ name: '園外教學.zip', ext: 'zip', driveFileId: 'ABCDEFGHIJ1', downloadUrl: url('ABCDEFGHIJ1'), size: 1234 }, o || {});
const b64 = s => Buffer.from(s).toString('base64');
const colOf = (e, h) => e.book.Docs.rows[0].indexOf(h);
const rowOf = (e, id) => e.book.Docs.rows.find(r => r[0] === id);
const get = (e, id, h) => (rowOf(e, id) || [])[colOf(e, h)];

console.log('A. 驗證 token（新動作與 saveDoc 的 files）');
let e = env({ Docs: DOCS() }); let c = e.ctx;
let r = c.uploadDocFile({ name: 'a.zip', base64: b64('x') }, 'bad');
ok(r.success === false && r.authExpired === true, 'uploadDocFile：錯誤 token → 拒絕並要求重新登入');
ok(e.calls.created.length === 0 && e.calls.folders.length === 0, '拒絕後完全沒碰 Drive（沒建立檔案、沒開資料夾）');
r = c.uploadDocFile({ name: 'a.zip', base64: b64('x') }, undefined); ok(r.authExpired === true, '沒帶 token：同樣拒絕');
const snap = JSON.stringify(e.book.Docs.rows);
r = c.saveDoc({ id: 'DOC-01', fileName: '駭', files: [F()] }, 'bad');
ok(r.success === false && r.authExpired === true && JSON.stringify(e.book.Docs.rows) === snap, 'saveDoc（含 files）：錯誤 token → 拒絕、試算表不動');

console.log('B. uploadDocFile：上傳單一檔案到 Docs 資料夾（不動試算表）');
e = env({ Docs: DOCS() }); c = e.ctx;
const before = JSON.stringify(e.book.Docs.rows);
r = c.uploadDocFile({ name: '園外教學照片.zip', mimeType: 'application/zip', base64: b64('PK-hello') }, TOK);
ok(r.success === true && r.file && r.file.name === '園外教學照片.zip' && r.file.ext === 'zip' && r.file.size === 8, '成功：回傳檔名、副檔名 zip、大小 8 位元組');
ok(r.file.driveFileId === e.calls.created[0].id && r.file.downloadUrl === url(e.calls.created[0].id), '回傳 Drive 檔案編號與下載網址');
ok(e.calls.folders[0] === DOCS_FOLDER && e.calls.created.length === 1 && e.calls.created[0].blob.name === '園外教學照片.zip' && e.calls.created[0].blob.mime === 'application/zip', '建立在 Docs 資料夾、檔名與類型原樣帶入');
ok(eq(e.calls.shared[0], [e.calls.created[0].id, 'ANYONE_WITH_LINK', 'VIEW']) && !r.warning, '設為「知道連結的人可檢視」');
ok(JSON.stringify(e.book.Docs.rows) === before && e.calls.clearApp === 0, '不寫試算表（要等表單按儲存才登記）');
ok(Buffer.from(e.calls.created[0].blob.bytes).toString() === 'PK-hello', '檔案內容原樣寫入');
r = c.uploadDocFile({ name: '備份.RAR', base64: b64('Rar!') }, TOK);
ok(r.success && r.file.ext === 'rar' && e.calls.created[1].blob.mime === 'application/vnd.rar', '沒給類型：依副檔名補（.rar → application/vnd.rar）；副檔名轉小寫');
r = c.uploadDocFile({ name: 'x.7z', base64: b64('7z') }, TOK); ok(r.success && e.calls.created[2].blob.mime === 'application/x-7z-compressed', '.7z 類型');
r = c.uploadDocFile({ name: '報告.pdf', mimeType: '', base64: b64('%PDF') }, TOK); ok(r.success && e.calls.created[3].blob.mime === 'application/pdf', '空字串類型也依副檔名補');
r = c.uploadDocFile({ name: 'a/b\\c\n.zip', base64: b64('x') }, TOK);
ok(r.success && r.file.name === 'a_b_c .zip', '檔名的斜線、反斜線換成底線、換行換成空白');
r = c.uploadDocFile({ name: '長'.repeat(300) + '.zip', base64: b64('x') }, TOK); ok(r.success && r.file.name.length <= 200 && /\.zip$/.test(r.file.name), '檔名過長：截短但保留副檔名');
const created = e.calls.created.length;
const bad = [[{ name: 'virus.exe', base64: b64('MZ') }, /不支援/], [{ name: 'noext', base64: b64('x') }, /不支援/], [{ name: 'a.zip.exe', base64: b64('x') }, /不支援/],
  [{ name: 'a.zip' }, /缺少/], [{ name: 'a.zip', base64: '' }, /缺少/], [{ base64: b64('x') }, /缺少/], [null, /缺少/], [{ name: 'a.zip', base64: 12345 }, /缺少/]];
bad.forEach(([f, re]) => { const x = c.uploadDocFile(f, TOK); ok(x.success === false && re.test(x.error), '拒絕：' + JSON.stringify(f && { name: f.name, b: typeof f.base64 }) + ' → ' + x.error); });
ok(e.calls.created.length === created, '以上被拒絕的都沒有建立 Drive 檔案');
const MB25 = 25 * 1024 * 1024;
r = c.uploadDocFile({ name: 'edge.zip', base64: Buffer.alloc(MB25).toString('base64') }, TOK); ok(r.success === true && r.file.size === MB25, '剛好 25 MB：可以');
const createdEdge = e.calls.created.length;
r = c.uploadDocFile({ name: 'big.zip', base64: Buffer.alloc(MB25 + 1).toString('base64') }, TOK); ok(r.success === false && /太大/.test(r.error) && e.calls.created.length === createdEdge, '多 1 位元組：拒絕（伺服器端也限制，不能只靠前端）');
r = c.uploadDocFile({ name: 'huge.zip', base64: 'A'.repeat(60 * 1024 * 1024) }, TOK); ok(r.success === false && /太大/.test(r.error), '超大的內容：不解碼就拒絕');
e = env({ Docs: DOCS() }, { shareFails: true }); r = e.ctx.uploadDocFile({ name: 'a.zip', base64: b64('x') }, TOK);
ok(r.success === true && r.file.driveFileId && /分享|共用|連結/.test(r.warning || ''), '設定分享失敗：仍回傳檔案但附警告（家長可能下載不到）');
e = env({ Docs: DOCS() }, { createFails: true }); r = e.ctx.uploadDocFile({ name: 'a.zip', base64: b64('x') }, TOK);
ok(r.success === false && /上傳/.test(r.error) && !r.file, 'Drive 建立失敗：回報失敗、沒有 file');

console.log('C. saveDoc 存多個檔案（files 欄）');
e = env({ Docs: DOCS() }); c = e.ctx;
const f1 = F({ name: '注音卡.zip', ext: 'zip', driveFileId: 'ZIPFILEID001', downloadUrl: url('ZIPFILEID001'), size: 5000 });
const f2 = F({ name: '說明.pdf', ext: 'pdf', driveFileId: 'PDFFILEID001', downloadUrl: url('PDFFILEID001'), size: 100 });
r = c.saveDoc({ id: 'DOC-NEW', fileName: '注音學習卡', category: '學習資源', description: 'd', files: [f1, f2], updatedAt: '2026-10-19' }, TOK);
ok(r.success === true && e.calls.clearApp === 1, '新增多檔文件：成功並清除公開資料快取');
ok(colOf(e, 'files') > -1 && colOf(e, 'fileExtension') > -1, 'Docs 工作表自動補上 files 欄（與 fileExtension 欄）');
ok(eq(JSON.parse(get(e, 'DOC-NEW', 'files')), [f1, f2]), 'files 欄存成 JSON 清單（順序、欄位完整）');
ok(get(e, 'DOC-NEW', 'driveFileId') === 'ZIPFILEID001' && get(e, 'DOC-NEW', 'downloadUrl') === url('ZIPFILEID001') && get(e, 'DOC-NEW', 'fileExtension') === 'zip', '舊欄位（driveFileId、downloadUrl、fileExtension）同步成第一個檔案（舊版前端與其他讀取者照常能用）');
ok(get(e, 'DOC-NEW', 'fileName') === '注音學習卡' && get(e, 'DOC-NEW', 'category') === '學習資源' && get(e, 'DOC-NEW', 'updatedAt') === '2026-10-19', '標題、分類、更新日期照存');
r = c.saveDoc({ id: 'DOC-01', fileName: '託藥單', category: '保健用藥', description: '說明', files: [f2], updatedAt: '2026-10-19' }, TOK);
ok(r.success && eq(JSON.parse(get(e, 'DOC-01', 'files')), [f2]) && get(e, 'DOC-01', 'driveFileId') === 'PDFFILEID001' && e.book.Docs.rows.filter(x => x[0] === 'DOC-01').length === 1, '更新既有文件：同一列改成 files，舊欄位同步，不會多出一列');
r = c.saveDoc({ id: 'DOC-01', fileName: '託藥單', category: '保健用藥', description: '說明', files: [], driveFileId: 'MANUALID0001', downloadUrl: 'https://x.test/a.pdf', fileExtension: 'pdf' }, TOK);
ok(r.success && get(e, 'DOC-01', 'files') === '' && get(e, 'DOC-01', 'downloadUrl') === 'https://x.test/a.pdf', 'files 傳空陣列：清空 files 欄，回到舊的單檔欄位');
r = c.saveDoc({ id: 'DOC-NEW', fileName: '注音學習卡', files: Array.from({ length: 10 }, (_, i) => F({ name: 'f' + i + '.zip', driveFileId: 'ID' + i + 'ABCDEFGH', downloadUrl: url('ID' + i + 'ABCDEFGH') })) }, TOK);
ok(r.success && JSON.parse(get(e, 'DOC-NEW', 'files')).length === 10, '剛好 10 個檔案：可以');
const snap2 = JSON.stringify(e.book.Docs.rows);
r = c.saveDoc({ id: 'DOC-NEW', fileName: 'x', files: Array.from({ length: 11 }, (_, i) => F({ name: 'f' + i + '.zip' })) }, TOK);
ok(r.success === false && /10/.test(r.error) && JSON.stringify(e.book.Docs.rows) === snap2, '11 個檔案：拒絕、不寫入');
const badFiles = [
  ['files 不是陣列（物件）', { a: 1 }], ['files 是字串', '[{"name":"a"}]'], ['項目不是物件', ['x']], ['項目是 null', [null]],
  ['沒有下載網址', [F({ downloadUrl: '' })]], ['網址不是字串', [F({ downloadUrl: 123 })]], ['javascript: 網址', [F({ downloadUrl: 'javascript:alert(1)' })]],
  ['data: 網址', [F({ downloadUrl: 'data:text/html,<script>alert(1)</script>' })]], ['沒有名稱', [F({ name: '' })]], ['網址過長', [F({ downloadUrl: 'https://x.test/' + 'a'.repeat(2100) })]]
];
badFiles.forEach(([why, files]) => { const x = c.saveDoc({ id: 'DOC-NEW', fileName: 'x', files: files }, TOK); ok(x.success === false && JSON.stringify(e.book.Docs.rows) === snap2, '拒絕且不寫入：' + why + (x.error ? '（' + x.error + '）' : '')); });
r = c.saveDoc({ id: 'DOC-S', fileName: '清理', files: [{ name: ' 家長\n手冊.PDF ', ext: 'PDF', driveFileId: 'bad id!', downloadUrl: ' http://example.test/a.pdf ', size: -5 }, { name: '影片.mp4', ext: '', downloadUrl: 'https://example.test/v', size: '12abc' }, { name: '無副檔名', ext: '!!', downloadUrl: 'https://example.test/x', size: 3.7 }] }, TOK);
const sf = JSON.parse(get(e, 'DOC-S', 'files'));
ok(r.success && sf[0].name === '家長 手冊.PDF' && sf[0].ext === 'pdf' && sf[0].driveFileId === '' && sf[0].downloadUrl === 'http://example.test/a.pdf' && sf[0].size === 0, '清理：名稱的換行與前後空白、副檔名轉小寫、不合法的 Drive 編號清空、網址去空白、負的大小變 0');
ok(sf[1].ext === 'mp4' && sf[1].size === 0 && sf[2].ext === 'pdf' && sf[2].size === 3, '副檔名缺漏：由檔名推導；推導不出來用 pdf；大小取整數、不是數字變 0');
r = c.saveDoc({ id: 'DOC-X', fileName: 'x', files: [{ name: 'a.zip', ext: 'zip', downloadUrl: 'https://x.test/a', extra: '<script>', __proto__: { evil: 1 } }] }, TOK);
ok(r.success && !('extra' in JSON.parse(get(e, 'DOC-X', 'files'))[0]), '不認得的欄位不會被存進去');
r = c.saveDoc({ id: 'DOC-Y', fileName: '=HYPERLINK("x")', description: '+cmd', files: [F({ name: '=cmd|x.zip' })] }, TOK);
ok(r.success && /^\[/.test(get(e, 'DOC-Y', 'files')) && JSON.parse(get(e, 'DOC-Y', 'files'))[0].name === '=cmd|x.zip', 'files 以 JSON 文字存放（開頭是「[」，不會被試算表當成公式）');

e = env({ Docs: DOCS() }); const freshSnap = JSON.stringify(e.book.Docs.rows);
r = e.ctx.saveDoc({ id: 'DOC-F', fileName: 'x', files: Array.from({ length: 11 }, (_, i) => F({ name: 'f' + i + '.zip' })) }, TOK);
ok(r.success === false && JSON.stringify(e.book.Docs.rows) === freshSnap, '全新的工作表上被拒絕：連 files 欄位表頭都不會新增（驗證在動工作表之前）');

console.log('D. 相容舊前端（saveDoc 沒帶 files）');
e = env({ Docs: DOCS() }); c = e.ctx;
c.saveDoc({ id: 'DOC-M', fileName: '多檔', category: 'A', description: 'd0', files: [f1, f2] }, TOK);
r = c.saveDoc({ id: 'DOC-M', fileName: '多檔', category: 'A', description: '舊前端只改了說明', driveFileId: 'ZIPFILEID001', downloadUrl: url('ZIPFILEID001'), fileExtension: 'zip' }, TOK);
ok(r.success && eq(JSON.parse(get(e, 'DOC-M', 'files')), [f1, f2]) && get(e, 'DOC-M', 'description') === '舊前端只改了說明', '舊前端只改說明（連結不變）：files 保留，不會被悄悄清掉');
r = c.saveDoc({ id: 'DOC-M', fileName: '多檔', category: 'A', description: 'd', driveFileId: '', downloadUrl: 'https://new.test/other.pdf', fileExtension: 'pdf' }, TOK);
ok(r.success && get(e, 'DOC-M', 'files') === '' && get(e, 'DOC-M', 'downloadUrl') === 'https://new.test/other.pdf', '舊前端改了連結：files 清空（否則前台會顯示過期的檔案）');
r = c.saveDoc({ id: 'DOC-OLD', fileName: '舊式', category: 'A', description: '', driveFileId: 'OLDSTYLE0001', downloadUrl: url('OLDSTYLE0001'), fileExtension: 'zip' }, TOK);
ok(r.success && get(e, 'DOC-OLD', 'files') === '' && get(e, 'DOC-OLD', 'fileExtension') === 'zip', '舊前端新增單檔文件：files 空白、舊欄位照存');
e = env({ Docs: [HDR.concat(['fileExtension', 'files']), ['DOC-Z', 'z', 'c', 'd', 'X', 'https://x.test', '2026-01-01', 'pdf', '']] });
r = e.ctx.saveDoc({ id: 'DOC-Z', fileName: 'z2', category: 'c', description: 'd', driveFileId: 'X', downloadUrl: 'https://x.test', fileExtension: 'pdf' }, TOK);
ok(r.success && e.book.Docs.rows[0].length === 9 && get(e, 'DOC-Z', 'fileName') === 'z2', '工作表已有 files 欄：不會重複新增欄位');

console.log('E. 公開資料的解析 parseDocFiles_');
const P = c.parseDocFiles_;
ok(typeof P === 'function' && eq(P(''), []) && eq(P(undefined), []) && eq(P(null), []) && eq(P('   '), []), '空白、沒有：空陣列');
ok(eq(P(JSON.stringify([f1, f2])), [f1, f2]), '正常的 JSON：照原樣還原');
ok(eq(P('{壞掉的 json'), []) && eq(P('123'), []) && eq(P('{"a":1}'), []) && eq(P('"x"'), []), '損毀或不是陣列：空陣列（不拋錯，不讓整個網站壞掉）');
ok(eq(P(JSON.stringify([f1, { name: 'x' }, null, 5, F({ downloadUrl: 'javascript:alert(1)' }), f2])), [f1, f2]), '清單裡的壞項目（沒網址、null、數字、javascript: 網址）被略過，其餘保留');
ok(P(JSON.stringify(Array.from({ length: 30 }, (_, i) => F({ name: i + '.zip' })))).length === 10, '超過 10 筆：只取前 10 筆');
ok(eq(P([f1]), [f1]), '已經是陣列（不是字串）：也能處理');
ok(/d\.files = parseDocFiles_\(d\.files\)|doc\.files = parseDocFiles_\(doc\.files\)/.test(src), 'getAppData 對每份文件套用解析（沒有 files 的文件得到空陣列）');

console.log('F. doPost 路由');
const post = (ctx, body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
e = env({ Docs: DOCS() }); c = e.ctx;
r = post(c, { action: 'uploadDocFile', file: { name: 'a.zip', base64: b64('x') }, password: TOK });
ok(r.success === true && r.file.ext === 'zip' && e.calls.created.length === 1, 'doPost uploadDocFile');
r = post(c, { action: 'uploadDocFile', file: { name: 'a.zip', base64: b64('x') }, password: 'bad' }); ok(r.success === false && r.authExpired === true, 'doPost uploadDocFile：錯誤 token 被拒');
r = post(c, { action: 'saveDoc', docData: { id: 'DOC-R', fileName: '路由', files: [F()] }, password: TOK }); ok(r.success === true && !!get(e, 'DOC-R', 'files'), 'doPost saveDoc 帶 files');
const key = 'idem_key_0123456789abcdef';
r = post(c, { action: 'uploadDocFile', file: { name: 'b.zip', base64: b64('y') }, password: TOK, idempotencyKey: key });
const n1 = e.calls.created.length; const r2 = post(c, { action: 'uploadDocFile', file: { name: 'b.zip', base64: b64('y') }, password: TOK, idempotencyKey: key });
ok(e.calls.created.length === n1 && r2.duplicate === true && r2.file.driveFileId === r.file.driveFileId, '逾時重送（同一個 idempotencyKey）：不會重複上傳，回傳第一次的結果');
ok(post(c, { action: 'deleteDoc', id: 'DOC-R', password: TOK }).success === true && !rowOf(e, 'DOC-R'), '刪除文件：整列（含 files）移除，行為不變');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
