// 後台「英文對照」網頁編輯後端測試：驗證 token、列表、批次儲存、刪除（只刪未使用）、同步、草稿、採用、統計、doPost 路由。
// 同一組動作服務 NameMap 與 TextMap。以模擬的 Sheets 執行，不碰真實資料。執行：node tests/mapadmin.test.js
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
  sh.deleteRow = r => { sh.rows.splice(r - 1, 1); sh.deleted = (sh.deleted || 0) + 1; };
  return sh;
}

const TOK = 'tok';
function env(sheets, opts) {
  opts = opts || {};
  const book = {}; Object.keys(sheets || {}).forEach(k => { book[k] = mkSheet(sheets[k]); });
  const store = {}; const calls = { clearApp: 0, translate: 0 };
  const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = String(v); }, remove: k => { delete store[k]; },
    putAll: o => { Object.keys(o).forEach(k => { store[k] = String(o[k]); }); }, removeAll: ks => ks.forEach(k => delete store[k]) };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    LanguageApp: { translate: z => { calls.translate++; return 'EN(' + z + ')'; } },
    Utilities: {}, DriveApp: {}, HtmlService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {},
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this; } }) },
    SpreadsheetApp: { getUi: () => { throw new Error('no UI'); } }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => { book[n] = mkSheet([]); return book[n]; } };
  ctx.getSpreadsheet = () => ss; ctx.checkPassword = p => p === TOK;
  const realClear = ctx.clearAppDataCache; ctx.clearAppDataCache = () => { calls.clearApp++; };
  ctx.getAppData = () => ({ success: true, data: opts.data || {} });
  return { ctx, ss, book, store, calls };
}
const TM = () => [['zh', 'en', 'draft', 'used_in', 'note'],
  ['白飯', 'Rice', '', '每日菜單：主食', ''], ['香蕉', '', 'Banana', '每日菜單：水果', '老師備註'], ['牛奶', '', '', '每日菜單：午點', ''],
  ['舊菜名', 'Old dish', '', '（目前沒有使用）', ''], ['白飯', 'Dup rice', '', '每日菜單：主食', ''], ['另一道舊菜', '', 'Other', '（目前沒有使用）', '']];
const NM = () => [['zh', 'en', 'used_in', 'note'], ['幸福廚房', 'Happy Kitchen', '相簿類別', ''], ['諾貝爾 A', '', '活動對象', '提醒'], ['舊名稱', 'Old', '（目前沒有使用）', '']];
const DATA = () => ({ events: [{ title: '新活動標題', description: '' }, { title: '白飯活動' }], menus: [{ lunchStaple: '白飯', fruit: '新水果' }] });

console.log('A. 驗證 token（全域函式等同公開 API，每一個都必須擋）');
let e = env({ TextMap: TM(), NameMap: NM() }, { data: DATA() }); let c = e.ctx;
const calls = [['adminMapList', ['text', 'bad']], ['adminMapSave', ['text', [{ zh: '白飯', en: 'x' }], 'bad']], ['adminMapDelete', ['text', ['舊菜名'], 'bad']],
  ['adminMapSync', ['text', 'bad']], ['adminTextDraft', [5, 'bad']], ['adminTextAdopt', [null, 'bad']], ['adminMapStatus', ['bad']]];
calls.forEach(([fn, args]) => { const r = c[fn].apply(null, args); ok(r.success === false && r.authExpired === true, fn + '：錯誤 token → 拒絕並要求重新登入'); });
const snapshot = JSON.stringify(e.book.TextMap.rows);
c.adminMapSave('text', [{ zh: '白飯', en: 'HACK' }], undefined); c.adminMapDelete('text', ['舊菜名'], null); c.adminTextAdopt(null, '');
ok(JSON.stringify(e.book.TextMap.rows) === snapshot && e.calls.translate === 0, '拒絕後試算表完全沒被改動、也沒有呼叫翻譯服務');
ok(c.adminMapList('bogus', TOK).success === false && c.adminMapSave('__proto__', [{ zh: 'a', en: 'b' }], TOK).success === false && c.adminMapSync('constructor', TOK).success === false, '未知的對照表類型（含 __proto__、constructor）→ 拒絕');

console.log('B. 列表 adminMapList');
let r = c.adminMapList('text', TOK);
ok(r.success && r.hasDraft === true && r.rows.length === 5, 'TextMap：5 列（重複的「白飯」只取第一列）');
ok(r.rows[0].zh === '白飯' && r.rows[0].en === 'Rice' && r.rows[1].draft === 'Banana' && r.rows[1].note === '老師備註' && r.rows[1].used_in === '每日菜單：水果', '欄位內容正確（含 draft、出處、備註）');
r = c.adminMapList('name', TOK);
ok(r.success && r.hasDraft === false && r.rows.length === 3 && r.rows.every(x => x.draft === ''), 'NameMap：沒有 draft 欄');
e = env({}); r = e.ctx.adminMapList('text', TOK);
ok(r.success && r.rows.length === 0 && eq(e.book.TextMap.rows[0], ['zh', 'en', 'draft', 'used_in', 'note']), '工作表不存在：自動建立表頭、回傳空列表');

console.log('C. 批次儲存 adminMapSave');
e = env({ TextMap: TM(), NameMap: NM() }, { data: DATA() }); c = e.ctx; let sh = e.book.TextMap;
let before = JSON.stringify(sh.rows.map(x => [x[0], x[2], x[3], x[4]]));
let rangeCalls = 0; const origGetRange = sh.getRange; sh.getRange = function () { rangeCalls++; return origGetRange.apply(this, arguments); };
r = c.adminMapSave('text', [{ zh: '香蕉', en: 'Banana (sweet)' }, { zh: '牛奶', en: 'Milk' }, { zh: '白飯', en: 'Rice' }], TOK);
ok(r.success && r.updated === 2 && r.unchanged === 1 && r.added === 0, '更新 2 筆、1 筆沒變（白飯內容相同）');
ok(sh.rows[2][1] === 'Banana (sweet)' && sh.rows[3][1] === 'Milk' && sh.rows[1][1] === 'Rice', 'en 欄寫入正確');
ok(JSON.stringify(sh.rows.map(x => [x[0], x[2], x[3], x[4]])) === before, '只動 en 欄：zh、draft、出處、備註完全不變');
ok(rangeCalls <= 4, '整欄一次寫回，不是逐格寫入（getRange 呼叫 ' + rangeCalls + ' 次）');
ok(sh.rows[5][1] === 'Dup rice', '重複的第二列不受影響（只更新第一列）');
ok(e.store['text_map_v1_n'] === undefined, '有變更：清除英文對照快取');
e.store['text_map_v1_n'] = '1'; e.store['text_map_v1_0'] = '{}';
c.adminMapSave('text', [{ zh: '牛奶', en: 'Milk' }], TOK);
ok(e.store['text_map_v1_n'] === '1', '完全沒有變更：不清快取');
r = c.adminMapSave('text', [{ zh: '牛奶', en: '' }], TOK);
ok(r.updated === 1 && sh.rows[3][1] === '' && e.store['text_map_v1_n'] === undefined, 'en 傳空字串＝清除英文；清除快取');
r = c.adminMapSave('text', [{ zh: '全新手動文字', en: 'Brand new' }, { zh: '沒英文就不新增', en: '' }, { zh: '全新手動文字', en: 'dup in same batch' }], TOK);
ok(r.added === 1 && sh.rows[sh.rows.length - 1][0] === '全新手動文字' && sh.rows[sh.rows.length - 1][1] === 'Brand new' && sh.rows[sh.rows.length - 1][3] === '（手動新增）', '不存在的中文＋有英文 → 新增一列、出處「手動新增」；沒英文的不新增；同批重複只新增一次');
r = c.adminMapSave('text', [{ zh: '香蕉', en: '=HYPERLINK("x")' }, { zh: '白飯', en: 'Line1\nLine2\u0007 tab\t  x' }], TOK);
ok(/^'=/.test(sh.rows[2][1]) && sh.rows[1][1] === 'Line1 Line2 tab x', '公式開頭加前置符號；換行與控制字元換成空白');
r = c.adminMapSave('text', [{ zh: '香蕉', en: 'x'.repeat(900) }], TOK); ok(sh.rows[2][1].length === 600, 'TextMap 英文上限 600');
const en2 = env({ NameMap: NM() }); en2.ctx.adminMapSave('name', [{ zh: '幸福廚房', en: 'y'.repeat(300) }], TOK); ok(en2.book.NameMap.rows[1][1].length === 100, 'NameMap 英文上限 100');
en2.store['app_data_v4'] = '{"cached":1}'; en2.ctx.adminMapSave('name', [{ zh: '諾貝爾 A', en: 'Nobel A' }], TOK);
ok(en2.book.NameMap.rows[2][1] === 'Nobel A' && en2.store['app_data_v4'] === undefined, 'NameMap：更新後清除 getAppData 快取（NameMap 隨 getAppData 回傳）');
ok(en2.book.NameMap.rows[2][2] === '活動對象' && en2.book.NameMap.rows[2][3] === '提醒', 'NameMap：出處與備註不變');
r = c.adminMapSave('text', [{ zh: '', en: 'a' }, { zh: '__proto__', en: 'a' }, { zh: null, en: 'a' }], TOK);
ok(r.success && r.errors.length === 3 && r.updated === 0 && r.added === 0, '無效的中文原文（空、__proto__、null）→ 回報錯誤、不寫入');
ok(c.adminMapSave('text', [], TOK).success === false && c.adminMapSave('text', 'x', TOK).success === false && c.adminMapSave('text', null, TOK).success === false, '沒有變更或格式不對 → 拒絕');
ok(c.adminMapSave('text', Array.from({ length: 501 }, (_, i) => ({ zh: 'z' + i, en: 'e' })), TOK).success === false, '一次超過 500 筆 → 拒絕');
const bigE = env({ TextMap: [['zh', 'en', 'draft', 'used_in', 'note']].concat(Array.from({ length: 3000 }, (_, i) => ['文' + i, '', '', '', ''])) });
r = bigE.ctx.adminMapSave('text', [{ zh: '超過上限的新文字', en: 'x' }], TOK); ok(r.added === 0 && r.errors.length === 1 && /上限/.test(r.errors[0]), '已達 3000 列上限：不再新增並回報');

console.log('D. 刪除 adminMapDelete（只刪未使用）');
e = env({ TextMap: TM(), NameMap: NM() }); c = e.ctx; sh = e.book.TextMap;
r = c.adminMapDelete('text', ['舊菜名', '白飯', '不存在的'], TOK);
ok(r.success && r.deleted === 1 && r.skipped === 1, '「目前沒有使用」的刪除 1 列；使用中的「白飯」跳過（不能刪）');
ok(!sh.rows.some(x => x[0] === '舊菜名') && sh.rows.filter(x => x[0] === '白飯').length === 2 && sh.rows.some(x => x[0] === '另一道舊菜'), '只刪了指定且未使用的列，其他列完整保留');
r = c.adminMapDelete('text', ['另一道舊菜', '舊菜名'], TOK); ok(r.deleted === 1, '已刪過的不會再刪（冪等）');
e = env({ TextMap: [['zh', 'en', 'draft', 'used_in', 'note'], ['A', '', '', '（目前沒有使用）', ''], ['B', '', '', '使用中', ''], ['C', '', '', '（目前沒有使用）', ''], ['A', 'dup', '', '（目前沒有使用）', '']] });
r = e.ctx.adminMapDelete('text', ['A', 'C'], TOK);
ok(r.deleted === 3 && eq(e.book.TextMap.rows.map(x => x[0]), ['zh', 'B']), '由下往上刪除：列號不會錯位；重複的未使用列一併刪除');
ok(c.adminMapDelete('text', [], TOK).success === false && c.adminMapDelete('text', 'x', TOK).success === false && c.adminMapDelete('text', Array.from({ length: 101 }, (_, i) => 'z' + i), TOK).success === false, '空清單、格式不對、超過 100 筆 → 拒絕');
const dn = env({ NameMap: NM() }); r = dn.ctx.adminMapDelete('name', ['舊名稱', '幸福廚房'], TOK);
ok(r.deleted === 1 && r.skipped === 1 && dn.book.NameMap.rows.length === 3, 'NameMap：同樣只刪未使用的');

console.log('E. 同步與草稿與採用');
e = env({ TextMap: TM(), NameMap: NM() }, { data: DATA() }); c = e.ctx;
r = c.adminMapSync('text', TOK);
ok(r.success && r.report.added >= 2 && e.book.TextMap.rows.some(x => x[0] === '新活動標題') && e.book.TextMap.rows.some(x => x[0] === '新水果'), '同步 TextMap：新文字加入');
ok(e.book.TextMap.rows[1][1] === 'Rice' && e.book.TextMap.rows[2][2] === 'Banana', '同步不覆蓋既有 en 與 draft');
ok(c.adminMapSync('name', TOK).success === true, '同步 NameMap 可執行');
r = c.adminTextDraft(1000, TOK);
ok(r.success && r.result.drafted <= 20 && e.calls.translate === r.result.drafted, '網頁單次最多 20 筆草稿（要求 1000 也只做 ' + r.result.drafted + '）');
r = c.adminTextDraft('abc', TOK); ok(r.success, '亂填的 limit 不會拋錯（用預設）');
const manyE = env({ TextMap: [['zh', 'en', 'draft', 'used_in', 'note']].concat(Array.from({ length: 60 }, (_, i) => ['待翻譯' + i, '', '', '菜單', ''])) });
r = manyE.ctx.adminTextDraft(1000, TOK);
ok(r.result.drafted === 20 && manyE.calls.translate === 20 && r.result.remaining === 40, '待翻譯 60 筆、要求 1000：網頁單次只做 20 筆，回報剩餘 40（網頁會連續呼叫直到完成）');
r = manyE.ctx.adminTextDraft(0, TOK); ok(r.result.drafted === 20, 'limit 為 0 或負數：用預設 20，不會做 0 筆也不會卡住');
e = env({ TextMap: TM() }); c = e.ctx;
r = c.adminTextAdopt(['香蕉'], TOK);
ok(r.success && r.adopted === 1 && e.book.TextMap.rows[2][1] === 'Banana' && e.book.TextMap.rows[6][1] === '', '只採用指定的列（香蕉）；另一個有草稿的（另一道舊菜）不動');
r = c.adminTextAdopt(null, TOK); ok(r.adopted === 1 && e.book.TextMap.rows[6][1] === 'Other', 'zhList 為空 → 採用全部');
ok(c.adminTextAdopt('字串', TOK).success === false && c.adminTextAdopt(Array.from({ length: 501 }, () => 'z'), TOK).success === false, '格式不對／超過 500 筆 → 拒絕');

console.log('F. 統計 adminMapStatus（後台頁籤的提示）');
e = env({ TextMap: TM(), NameMap: NM() }, { data: DATA() }); c = e.ctx;
r = c.adminMapStatus(TOK);
ok(r.success && r.text.total === 5 && r.text.unused === 2 && r.text.missingEn === 2 && r.text.withDraft === 1, 'TextMap 統計：共 5、未使用 2、尚未填英文 2、其中有草稿 1（' + JSON.stringify(r.text) + '）');
ok(r.text.pendingNew === 3, '有 3 筆新文字（新活動標題、白飯活動、新水果）尚未收錄 → 提示待同步（' + r.text.pendingNew + '）');
ok(r.name.total === 3 && r.name.unused === 1 && r.name.missingEn === 1 && r.name.withDraft === 0, 'NameMap 統計');
e.ctx.getAppData = () => { throw new Error('boom'); }; r = e.ctx.adminMapStatus(TOK);
ok(r.success && r.text.pendingNew === 0, '資料讀取失敗：待同步數為 0，不拋錯');

console.log('G. doPost 路由');
const post = (ctx, body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
e = env({ TextMap: TM(), NameMap: NM() }, { data: DATA() }); c = e.ctx;
ok(post(c, { action: 'mapList', kind: 'text', password: TOK }).rows.length === 5, 'doPost mapList');
ok(post(c, { action: 'mapSave', kind: 'text', changes: [{ zh: '牛奶', en: 'Milk' }], password: TOK }).updated === 1, 'doPost mapSave');
ok(post(c, { action: 'mapDelete', kind: 'text', zhList: ['舊菜名'], password: TOK }).deleted === 1, 'doPost mapDelete');
ok(post(c, { action: 'mapSync', kind: 'text', password: TOK }).success === true, 'doPost mapSync');
ok(post(c, { action: 'textDraft', limit: 3, password: TOK }).result.drafted <= 3, 'doPost textDraft');
ok(post(c, { action: 'textAdopt', zhList: ['香蕉'], password: TOK }).adopted === 1, 'doPost textAdopt');
ok(post(c, { action: 'mapStatus', password: TOK }).text.total >= 1, 'doPost mapStatus');
ok(post(c, { action: 'mapList', kind: 'text', password: 'bad' }).authExpired === true, 'doPost：錯誤 token 一律拒絕');
const dupKey = 'k' + 'a'.repeat(20); const first = post(c, { action: 'mapSave', kind: 'text', changes: [{ zh: '牛奶', en: 'Milk2' }], password: TOK, idempotencyKey: dupKey });
const again = post(c, { action: 'mapSave', kind: 'text', changes: [{ zh: '牛奶', en: 'Milk3' }], password: TOK, idempotencyKey: dupKey });
ok(first.updated === 1 && again.duplicate === true && e.book.TextMap.rows.find(x => x[0] === '牛奶')[1] === 'Milk2', '冪等：同一次操作重送只執行一次（逾時重送不會重複寫入）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
