// 名稱對照表（NameMap）後端測試：正規化、英文草稿、掃描、同步、回傳給前台的內容。
// 以模擬的 Sheets 執行，不碰真實資料。
// 執行：node tests/namemap.test.js    （修改 Code.js 的名稱對照相關程式後必跑，全部 ✓ 才可部署）
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
  return sh;
}
function env(sheets) {
  const book = {}; Object.keys(sheets).forEach(k => { book[k] = mkSheet(sheets[k]); });
  const calls = { clearCache: 0 };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: {}, DriveApp: {}, HtmlService: {}, ContentService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {},
    SpreadsheetApp: { getUi: () => { throw new Error('no UI'); } }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => { book[n] = mkSheet([]); return book[n]; } };
  ctx.getSpreadsheet = () => ss; ctx.clearAppDataCache = () => { calls.clearCache++; };
  return { ctx, ss, book, calls };
}
// 代表性的資料：含真實遇到的問題（字典多一個空白、資料用了字典沒有的「雨果」、非中文名稱、全部文件）
const world = () => ({
  AlbumCategories: [['categoryName'], ['主題活動'], ['幸福廚房'], ['慶生會']],
  DocCategories: [['categoryName'], ['全部文件'], ['保健用藥']],
  SongCategories: [['categoryName'], ['桃子腳'], ['momo'], ['yoyo'], ['其他']],
  ThemeSemesters: [['semesterName'], ['115 學年上學期'], ['115 學年下學期']],
  EventCategories: [['categoryName'], ['重要活動'], ['休園']],
  EventCategoriesMinor: [['categoryName'], ['幸福廚房'], ['高峰活動']],
  EventTargets: [['targetName', 'displayName'], ['全園活動', '全園活動'], ['諾貝爾 A ', '諾貝爾 A'], ['兩果', '兩果']],
  Events: [['id', 'date', 'target', 'categoryMajor', 'categoryMinor'], ['1', '2026-10-01', '全園活動, 諾貝爾 A', '重要活動', '幸福廚房'], ['2', '2026-10-02', '雨果，兩果', '休園', '']],
  Albums: [['id', 'category'], ['a', '主題活動'], ['b', '舊相簿類別']],
  Docs: [['id', 'category'], ['d', '保健用藥']],
  Songs: [['id', 'category'], ['s', '桃子腳'], ['t', 'momo']],
  Themes: [['id', 'semester'], ['t', '115 學年上學期']]
});

console.log('A. 正規化與草稿');
let e = env(world()); let c = e.ctx;
ok(c.normalizeName_('諾貝爾 A ') === '諾貝爾 A' && c.normalizeName_('  米羅   A　 ') === '米羅 A' && c.normalizeName_(null) === '' && c.normalizeName_(undefined) === '' && c.normalizeName_(123) === '123', '前後空白、連續空白、全形空白都被收斂；null／數字安全');
ok(c.hasCjk_('幸福廚房') && !c.hasCjk_('momo') && !c.hasCjk_('') && c.hasCjk_('A 班'), '只有含中文的名稱才需要翻譯（momo、yoyo 不需要）');
ok(c.draftNameTranslation_('幸福廚房') === 'Happy Kitchen' && c.draftNameTranslation_(' 幸福廚房 ') === 'Happy Kitchen', '已知名稱有英文草稿（含前後空白）');
ok(c.draftNameTranslation_('115 學年上學期') === 'Academic Year 115, Semester 1' && c.draftNameTranslation_('116 學年下學期') === 'Academic Year 116, Semester 2', '學期依規則自動產生（未來學年也適用）');
ok(c.draftNameTranslation_('諾貝爾 A') === '' && c.draftNameTranslation_('雨果') === '' && c.draftNameTranslation_('高峰活動') === '' && c.draftNameTranslation_('隨便一個名稱') === '', '班級名稱、不確定的名稱、未知名稱：不給草稿（留空，前台顯示中文）');
ok(c.draftNameTranslation_('constructor') === '' && c.draftNameTranslation_('__proto__') === '' && c.draftNameTranslation_('toString') === '', '名稱剛好是 JavaScript 內建屬性名稱時不會誤判');

console.log('B. 掃描 collectNameSources_');
const col = c.collectNameSources_(e.ss);
const names = Object.keys(col.names);
ok(!names.includes('momo') && !names.includes('yoyo') && !names.includes('全部文件'), '不含 momo／yoyo（非中文）與「全部文件」（前台用固定文字）');
ok(names.includes('諾貝爾 A') && !names.includes('諾貝爾 A '), '「諾貝爾 A␣」與「諾貝爾 A」視為同一個名稱（以去除空白後的為準）');
ok(col.names['幸福廚房'].labels.includes('相簿類別') && col.names['幸福廚房'].labels.includes('活動細項（目前前台未顯示）'), '同一個詞出現在多個字典：只算一個名稱，出處合併');
ok(names.includes('全園'), '程式內建名稱「全園」被納入');
ok(names.includes('雨果') && col.names['雨果'].notes.some(m => /資料用了這個名稱，但字典「活動對象」沒有/.test(m)), '資料用了字典沒有的「雨果」→ 被標記（抓出打錯字）');
ok(col.names['諾貝爾 A'].notes.some(m => /多餘空白/.test(m)) && !col.names['諾貝爾 A'].notes.some(m => /資料用了這個名稱/.test(m)), '字典多一個空白被標記，但不會誤報成「字典沒有這個名稱」');
ok(names.includes('舊相簿類別') && col.names['舊相簿類別'].notes.some(m => /Albums.*相簿類別/.test(m)), '相簿用了字典沒有的類別 → 被標記');
ok(!col.names['兩果'].notes.length && col.names['兩果'].labels.includes('活動對象'), '正常的名稱沒有備註');
ok(col.names['諾貝爾 A'].labels.includes('活動對象') && col.order.indexOf('全園活動') < col.order.indexOf('雨果'), '字典名稱排在前面，資料中才出現的名稱在後');
const emptyBook = env({ AlbumCategories: [['categoryName']] }); ok(Object.keys(emptyBook.ctx.collectNameSources_(emptyBook.ss).names).length === 1, '缺少大部分工作表時不拋錯（只剩內建名稱）');
const noHeader = env({ AlbumCategories: [['別的欄位'], ['幸福廚房']] }); ok(Object.keys(noHeader.ctx.collectNameSources_(noHeader.ss).names).indexOf('幸福廚房') === -1, '字典欄位名稱不對 → 略過該字典（不拋錯）');

console.log('C. 同步 syncNameMap_');
e = env(world()); c = e.ctx;
const r1 = c.syncNameMap_(); const sh = e.book.NameMap;
ok(!!sh && eq(sh.rows[0], ['zh', 'en', 'used_in', 'note']), '第一次同步：自動建立 NameMap 工作表與標題列');
const rowOfName = n => sh.rows.findIndex((r, i) => i > 0 && r[0] === n);
const get = (n, col) => sh.rows[rowOfName(n)][col];
ok(get('幸福廚房', 1) === 'Happy Kitchen' && get('115 學年上學期', 1) === 'Academic Year 115, Semester 1', '新增列預填英文草稿');
ok(get('諾貝爾 A', 1) === '' && get('兩果', 1) === '' && get('雨果', 1) === '' && get('高峰活動', 1) === '', '班級名稱與不確定的名稱：英文欄留空');
ok(r1.added === col.order.length && r1.total === col.order.length && r1.missingEn.includes('諾貝爾 A') && r1.missingEn.includes('高峰活動') && !r1.missingEn.includes('幸福廚房'), '報告：新增數量、尚未填英文的清單正確');
ok(r1.issues.some(m => /^雨果：/.test(m)) && r1.issues.some(m => /^諾貝爾 A：/.test(m)), '報告列出資料問題（雨果、多餘空白）');
ok(get('雨果', 3) !== '' && get('幸福廚房', 2) === '相簿類別、活動細項（目前前台未顯示）', 'used_in／note 欄位被寫入');
ok(e.calls.clearCache === 1, '同步後清除前台快取');
// 老師填寫英文
sh.rows[rowOfName('諾貝爾 A')][1] = 'Nobel A'; sh.rows[rowOfName('幸福廚房')][1] = '我自己改的英文'; sh.rows[rowOfName('全園活動')][1] = '';   // 故意清空一個有草稿的
const snapshotEn = sh.rows.map(r => r[1]);
const r2 = c.syncNameMap_();
ok(eq(sh.rows.map(r => r[1]), snapshotEn), '再次同步：所有英文欄完全不變（老師改過的、故意清空的都不會被覆蓋）');
ok(r2.added === 0 && sh.rows.length === col.order.length + 1, '再次同步：沒有重複新增列（冪等）');
ok(!r2.missingEn.includes('諾貝爾 A') && r2.missingEn.includes('全園活動'), '報告正確反映最新狀態（填好的不再列為缺英文，清空的會列出）');
// 新增名稱、字典移除名稱
e.book.AlbumCategories.rows.push(['新增的相簿類別']); e.book.AlbumCategories.rows = e.book.AlbumCategories.rows.filter(r => r[0] !== '慶生會'); e.book.Albums.rows = e.book.Albums.rows;
const r3 = c.syncNameMap_();
ok(r3.added === 1 && rowOfName('新增的相簿類別') > 0 && get('新增的相簿類別', 1) === '', '字典新增名稱 → 同步後自動補進對照表（英文留空）');
ok(rowOfName('慶生會') > 0 && get('慶生會', 2) === '（目前沒有使用）' && r3.unused >= 1, '字典移除的名稱：列保留不刪除，出處標示「目前沒有使用」');
// 重複列
sh.rows.push(['幸福廚房', 'Dup', '', '']); const r4 = c.syncNameMap_();
ok(r4.issues.some(m => /^幸福廚房：.*重複/.test(m)), '對照表出現重複列 → 報告提醒');
// 使用者調換欄位順序也能運作
const swap = env(world()); swap.ctx.syncNameMap_(); const s2 = swap.book.NameMap; s2.rows = s2.rows.map(r => [r[1], r[0], r[2], r[3]]);
let swapOk = true; try { swap.ctx.syncNameMap_(); } catch (x) { swapOk = false; }
ok(swapOk, '即使老師調換了欄位順序，同步也不會拋錯');
let uiThrew = false; try { c.menuSyncNameMap(); } catch (x) { uiThrew = true; }
ok(uiThrew, '選單函式在沒有試算表介面（例如從網頁呼叫）時無法執行');

console.log('D. 回傳給前台 getNameMapForApp_');
const nm = mkSheet([['zh', 'en', 'used_in', 'note'], ['幸福廚房', 'Happy Kitchen', '', ''], ['諾貝爾 A ', 'Nobel A', '', ''], ['兩果', '', '', ''], ['', 'orphan', '', ''], ['長名稱', 'x'.repeat(300), '', ''], ['控制字元', 'A\u0000B\u001fC\n', '', ''], ['<script>', '<img src=x onerror=alert(1)>', '', ''], ['幸福廚房', 'Dup', '', ''], ['__proto__', 'polluted', '', ''], ['constructor', 'ctor', '', '']]);
e = env({}); e.book.NameMap = nm;
const out = e.ctx.getNameMapForApp_(e.ss);
ok(out['幸福廚房'] === 'Happy Kitchen' && out['諾貝爾 A'] === 'Nobel A', '回傳 { 中文: 英文 }；中文名稱以正規化後的為準（含空白差異）');
ok(!('兩果' in out) && !('' in out), '英文欄空白、中文欄空白的列不回傳（前台顯示中文）');
ok(out['長名稱'].length === 100, '過長的英文被截斷到 100 字元');
ok(out['控制字元'] === 'ABC', '控制字元被移除');
ok(out['<script>'] === '<img src=x onerror=alert(1)>', 'HTML 內容照原樣當文字回傳（由前台輸出時跳脫）');
ok(out['幸福廚房'] === 'Happy Kitchen', '重複的列：只採用第一列');
const realmProto = vm.runInContext('Object.prototype', e.ctx);   // 結果物件在模擬環境中建立，要與「同一個環境」的原型比較
ok(Object.getPrototypeOf(out) === realmProto && out.polluted === undefined && vm.runInContext('({}).polluted', e.ctx) === undefined && Object.prototype.hasOwnProperty.call(out, 'constructor') && out['constructor'] === 'ctor' && !Object.prototype.hasOwnProperty.call(out, '__proto__'), '名稱是 __proto__／constructor 時不會污染物件原型（__proto__ 被忽略、constructor 當一般名稱）');
const big = mkSheet([['zh', 'en']].concat(Array.from({ length: 900 }, (_, i) => ['名稱' + i, 'N' + i]))); e = env({}); e.book.NameMap = big;
ok(Object.keys(e.ctx.getNameMapForApp_(e.ss)).length === 500, '筆數上限 500（避免資料異常膨脹）');
e = env({}); ok(eq(e.ctx.getNameMapForApp_(e.ss), {}), '沒有 NameMap 工作表 → 空物件（不拋錯）');
e = env({}); e.book.NameMap = mkSheet([['別的', '欄位'], ['a', 'b']]); ok(eq(e.ctx.getNameMapForApp_(e.ss), {}), 'NameMap 欄位名稱不對 → 空物件（不拋錯）');
e = env({}); e.ctx.getSpreadsheet = () => { throw new Error('boom'); }; ok(eq(e.ctx.getNameMapForApp_(null), {}), 'ss 為 null → 空物件');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
