// 常用文件「釘選置頂」與「最後更新的在上面」（2026-10-29）。
// 使用者要求：前台文件列表最後更新的放最上面；後台可以把最常用的文件釘選置頂，固定在上方、不受更新時間影響排序。
// 資料：Docs 工作表新增 pinned 欄（Y＝釘選；老師在試算表手填 是／TRUE／1 也算）。排序：釘選的在前 → 各自依更新日期新到舊 → 同一天則試算表較下面（較晚加入）的在前。
// 這裡確認：① 後端 docPinned_ 判斷；② saveDoc 寫入／清除／舊版前端沒帶時保留 pinned；③ getAppData 把 pinned 整理成 true／false；
// ④ 前端排序函式與前台、後台列表都用同一個排序；⑤ 表單有釘選勾選、儲存時送出、比對變更；⑥ 列表有「置頂」標示。執行：node tests/docpin.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
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
function env(sheets) {
  const book = {}; Object.keys(sheets || {}).forEach(k => { book[k] = mkSheet(sheets[k]); });
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { formatDate: (d, tz, pat) => pat === 'yyyy-MM-dd' ? '2026-10-29' : '20261029120000' },
    DriveApp: {}, HtmlService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {},
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: t => ({ text: t }) },
    SpreadsheetApp: { getUi: () => { throw new Error('no UI'); } }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => { book[n] = mkSheet([]); return book[n]; } };
  ctx.getSpreadsheet_ = () => ss; ctx.checkPassword = p => p === TOK; ctx.clearAppDataCache_ = () => {};
  return { ctx, book };
}
const url = id => 'https://drive.google.com/uc?export=download&id=' + id;
const HDR = ['id', 'fileName', 'category', 'description', 'driveFileId', 'downloadUrl', 'updatedAt'];
const row = (id, name, upd) => [id, name, '保健用藥', '', 'FILEID000' + id.slice(-1), url('FILEID000' + id.slice(-1)), upd];
const base = (o) => Object.assign({ fileName: '託藥單', category: '保健用藥', description: '', driveFileId: 'FILEID0001', downloadUrl: url('FILEID0001') }, o);

console.log('A. 後端 docPinned_：哪些值算「釘選」');
{
  const { ctx } = env({});
  const f = ctx.docPinned_;
  ok(typeof f === 'function', '有 docPinned_ 函式');
  [true, 'TRUE', 'true', 'Y', 'y', '是', '1', 1, '✓', ' 是 '].forEach(v => ok(f(v) === true, JSON.stringify(v) + ' → 釘選'));
  [false, '', undefined, null, 'FALSE', 'false', '0', 0, '否', 'N', '隨便'].forEach(v => ok(f(v) === false, JSON.stringify(v) + ' → 不釘選'));
}

console.log('B. saveDoc：寫入、清除、舊版前端沒帶時保留');
{
  const e = env({ Docs: [HDR, row('DOC-1', '託藥單', '2026-10-02')] });
  const r1 = e.ctx.saveDoc(base({ id: 'DOC-1', pinned: true }), TOK);
  const sh = e.book.Docs;
  const pc = sh.rows[0].indexOf('pinned');
  ok(r1.success && pc > 0, '第一次釘選：成功，並自動新增 pinned 欄（' + sh.rows[0].join('、') + '）');
  ok(sh.rows[1][pc] === 'Y', '更新既有文件：pinned 寫入 Y');
  const r2 = e.ctx.saveDoc(base({ id: 'DOC-1', description: '只改說明' }), TOK);
  ok(r2.success && sh.rows[1][pc] === 'Y', '舊版前端沒帶 pinned：原本的釘選保留（不會被清掉）');
  const r3 = e.ctx.saveDoc(base({ id: 'DOC-1', pinned: false }), TOK);
  ok(r3.success && sh.rows[1][pc] === '', '取消釘選（pinned: false）：欄位清空');
  const r4 = e.ctx.saveDoc(base({ pinned: true }), TOK);
  const last = sh.rows[sh.rows.length - 1];
  ok(r4.success && sh.rows.length === 3 && last[pc] === 'Y' && last[1] === '託藥單', '新增文件時一起釘選：新的一列 pinned = Y');
  const r5 = e.ctx.saveDoc(base({ id: 'DOC-5', fileName: '菜單' }), TOK);
  const last2 = sh.rows[sh.rows.length - 1];
  ok(r5.success && last2[pc] === '', '新增文件沒帶 pinned：空白（不釘選）');
  const bad = e.ctx.saveDoc(base({ id: 'DOC-1', pinned: true }), 'wrong');
  ok(!bad.success, '密碼錯誤：拒絕（釘選不能繞過驗證）');
}

console.log('C. getAppData：公開資料的 pinned 是 true／false');
ok(/docs\.forEach\(function\(d\) \{ d\.pinned = docPinned_\(d\.pinned\); \}\);/.test(src), 'getAppData 對每份文件做 d.pinned = docPinned_(d.pinned)（試算表手填「是」也會變成 true）');

console.log('D. 前端排序：釘選在前 → 更新日期新到舊 → 同日較晚加入的在前');
function slice(a, b) { const i = html.indexOf(a); const j = html.indexOf(b, i); if (i < 0 || j < 0) throw new Error('找不到 ' + a); return html.slice(i, j); }
const code = slice('    function isDocPinned(', '    // 學期新舊的比較值');
const api = new Function(code + '\nreturn { isDocPinned, sortDocsForDisplay, docsOrderCompare, docsSortStable };')();
const ids = l => l.map(x => x.id).join();
{
  const D = [
    { id: 'a', updatedAt: '2026-10-02' },
    { id: 'b', updatedAt: '2026-10-03' },
    { id: 'c', updatedAt: '2026-10-03' },
    { id: 'd', updatedAt: '2026-09-01', pinned: true },
    { id: 'e', updatedAt: '2026-10-20', pinned: '是' },
    { id: 'f' }
  ];
  const copy = D.slice();
  ok(ids(api.sortDocsForDisplay(D)) === 'e,d,c,b,a,f', '釘選的（e 新、d 舊）在最前；其餘新到舊；同日（b、c）試算表較下面的 c 在前；沒日期的最後');
  ok(ids(D) === ids(copy), '不改動傳入的陣列');
  ok(api.isDocPinned({ pinned: true }) && api.isDocPinned({ pinned: 'Y' }) && api.isDocPinned({ pinned: '是' }) && !api.isDocPinned({}) && !api.isDocPinned(null) && !api.isDocPinned({ pinned: false }), 'isDocPinned：true／Y／是 算釘選；沒有、null、false 不算');
  const cur = [{ id: 'x', updatedAt: '2026-10-29' }, { id: 'y', updatedAt: '2026-10-29' }, { id: 'z', updatedAt: '2026-10-01', pinned: true }];
  ok(ids(api.docsSortStable(cur)) === 'z,x,y', 'docsSortStable（儲存後本機重排）：保留原本的相對順序，只把釘選的移到前面');
  ok(ids(api.sortDocsForDisplay([{ id: 'p1', updatedAt: '2026-10-29', pinned: true }, { id: 'o', updatedAt: '2026-10-30' }])) === 'p1,o', '釘選的就算比較舊也在最上面（不受更新時間影響）');
}

console.log('E. 前台與後台列表用同一個排序');
{
  const pub = slice('    function renderDocsList(', '    // ==================== 後台「幼小銜接管理」');
  ok(/sortDocsForDisplay\(/.test(pub), '前台 renderDocsList：列表經過 sortDocsForDisplay');
  const adm = slice('    function adminDocsView(', '    // 學期新舊的比較值');
  ok(/sortDocsForDisplay\(/.test(adm) && !/b\.i - a\.i/.test(adm), '後台 adminDocsView：改用同一個排序（不再單純倒序）');
  const upd = slice('    function updateLocalDocState(', '    function handleDeleteDocDirect(');
  ok(/state\.docs = docsSortStable\(state\.docs\)/.test(upd) && /state\.docs\.unshift\(/.test(upd), '儲存後本機：新增的放最前、並重新排序，畫面立刻正確');
}

console.log('F. 表單：勾選、送出、比對變更');
ok(/<input type="checkbox" id="docModal-pinned"/.test(html) && /釘選置頂/.test(html.slice(html.indexOf('id="docModal-pinned"'), html.indexOf('id="docModal-pinned"') + 700)), '表單有「釘選置頂」勾選框（id docModal-pinned）');
ok(/\['pinned', '釘選置頂'\]/.test(html), 'DOC_FORM_FIELDS 含 pinned（更新前的「變更內容」確認會列出）');
const snap = slice('    function docFormSnapshot(', '    function docModalOpen(');
ok(/pinned:\s*\(?document\.getElementById\('docModal-pinned'\)/.test(snap), 'docFormSnapshot 記錄 pinned');
const open = slice('    function openDocEditModal(', '    // 使用者按 ✕／取消');
ok((open.match(/docModal-pinned'\)\.checked = /g) || []).length >= 2, '開啟表單：編輯帶入目前狀態、新增預設不勾（至少兩處設定 checked）');
const save = slice('    function handleSaveDocModal(', '    function updateLocalDocState(');
ok(/pinned:\s*!!\(document\.getElementById\('docModal-pinned'\)/.test(save) || /pinned:\s*docPinnedChecked\(\)/.test(save), '儲存：docData 帶 pinned（true／false）送給後端');

console.log('G. 列表上的「置頂」標示');
{
  const pub = slice('    function renderDocsList(', '    // ==================== 後台「幼小銜接管理」');
  ok((pub.match(/pinBadgeHtml\(/g) || []).length >= 2, '前台：多檔案卡與單檔卡都有置頂標示');
  const adm = slice('    function renderAdminDocsList(', '    // ---------- 文件表單的模式');
  ok(/pinBadgeHtml\(/.test(adm), '後台列表有置頂標示');
  const fn = new Function('state', 'isDocPinned', 'return ' + slice('    function pinBadgeHtml(', '\n    }\n') + '\n    }')({ lang: 'zh' }, api.isDocPinned);
  const fnEn = new Function('state', 'isDocPinned', 'return ' + slice('    function pinBadgeHtml(', '\n    }\n') + '\n    }')({ lang: 'en' }, api.isDocPinned);
  ok(/📌 置頂/.test(fn({ pinned: true })) && fn({}) === '', '釘選的文件：顯示「📌 置頂」；沒釘選：空字串');
  ok(/📌 Pinned/.test(fnEn({ pinned: true })), '英文介面：顯示「📌 Pinned」');
}

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
