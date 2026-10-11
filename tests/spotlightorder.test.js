// 焦點活動「播放順位只屬於播映中的活動」測試：順位即時算出（連續 1～N）、移動、整理、已下架清空、預設篩選，
// 以及後端 updateSpotlightsOrder／saveSpotlight 可清空順位。純函式從 index.html 取出執行。執行：node tests/spotlightorder.test.js（已納入 tests/ci.sh）
const fs = require('fs'), vm = require('vm'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = html.indexOf('const ADMIN_LIST_SIZES'), b = html.indexOf('// ===== 以下為畫面');
if (a < 0 || b < 0) { console.log('FAIL: 在 index.html 找不到函式'); process.exit(1); }
const api = new Function(html.slice(a, b) + '\nreturn { spotlightPlayState, spotlightPriorityOrNone, spotlightOrderCompare, spotlightPlayingSorted, spotlightRanks, spotlightOrderList, spotlightOrderChanged, ADMIN_LIST_DEFAULTS };')();
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const T = '2026-10-11';
const sp = (id, pri, extra) => Object.assign({ id: id, title: id, priority: pri, status: '啟用', startDate: '2026-10-01', endDate: '2026-10-31' }, extra || {});
const ids = l => l.map(x => x.id).join(',');
const pr = l => l.map(x => x.id + ':' + x.priority).join(',');

console.log('A. 輔助');
ok(api.spotlightPriorityOrNone(3) === 3 && api.spotlightPriorityOrNone('4') === 4 && api.spotlightPriorityOrNone(999) === '' && api.spotlightPriorityOrNone(0) === '' && api.spotlightPriorityOrNone('') === '' && api.spotlightPriorityOrNone(null) === '' && api.spotlightPriorityOrNone('abc') === '' && api.spotlightPriorityOrNone(-2) === '' && api.spotlightPriorityOrNone(2.7) === 2, '順位只有 1～998 的正整數；空白、0、999（沒有順位的載入值）、負數、非數字都是「沒有順位」');
ok(JSON.stringify(api.ADMIN_LIST_DEFAULTS.spotlights) === '{"play":"playing","sort":"order"}', '後台列表預設：輪播狀態＝播映中、排序＝輪播順序');

console.log('B. 順位即時算出（連續、只含播映中）');
const L = [
  sp('A', 3), sp('B', 1), sp('C', 7), sp('D', 5, { endDate: '2026-10-05' }), sp('E', 2, { startDate: '2026-11-01', endDate: '2026-11-30' }), sp('F', 4, { status: '停用' }), sp('G', 999)
];
let rk = api.spotlightRanks(L, T);
ok(JSON.stringify(rk) === JSON.stringify({ B: 1, A: 2, C: 3, G: 4 }), '播映中的 B、A、C、G 依順位排成 1、2、3、4（原順位 1、3、7、無 → 補成連續）；已下架 D、排程中 E、停用 F 沒有順位');
ok(ids(api.spotlightPlayingSorted(L, T)) === 'B,A,C,G', '播映中排序：沒有順位（G）排最後');
const tie = [sp('X', 2), sp('Y', 2), sp('Z', 2)];
ok(ids(api.spotlightPlayingSorted(tie, T)) === 'Z,Y,X', '順位相同：編號新到舊（與前台輪播一致）');
ok(api.spotlightOrderCompare(sp('a', ''), sp('b', 5)) > 0 && api.spotlightOrderCompare(sp('a', 999), sp('b', 5)) > 0 && api.spotlightOrderCompare(sp('a', 1), sp('b', ''))< 0, '沒有順位（空白或 999）排在有順位之後');
ok(Object.keys(api.spotlightRanks([], T)).length === 0 && Object.keys(api.spotlightRanks(undefined, T)).length === 0 && Object.keys(api.spotlightRanks([null, sp('A', 1)], T)).length === 1, '空資料、undefined、含 null 不出錯');
// 隨日期推進：D 結束日 10/05，當天仍在播映中，隔天才下架
rk = api.spotlightRanks(L, '2026-10-05');
ok(rk.D !== undefined && Object.keys(rk).length === 5 && rk.E === undefined, '10/05 當天：D 仍在播映中，有順位（共 5 筆播映中）');
rk = api.spotlightRanks(L, '2026-10-06');
ok(rk.D === undefined && Object.keys(rk).length === 4, '10/06：D 到期下架，自動沒有順位，其餘 4 筆');

console.log('C. 整理（到期自動取消、後面補位）');
let ol = api.spotlightOrderList(L, T);
ok(pr(ol) === 'A:2,B:1,C:3,D:,E:,F:,G:4', '整理：播映中 → 1～4；已下架 D、排程中 E、停用 F → 空白（取消順位）；包含所有活動');
// 某筆到期後，後面自動補位：C 結束日已過
const L2 = L.map(x => x.id === 'C' ? Object.assign({}, x, { endDate: '2026-10-09' }) : x);
ol = api.spotlightOrderList(L2, T);
ok(pr(ol) === 'A:2,B:1,C:,D:,E:,F:,G:3', 'C 到期下架：C 取消順位，G 自動從 4 補位成 3，沒有空號');
ok(api.spotlightOrderChanged(L, api.spotlightOrderList(L, T)) === true, '原本順位 1、3、7、無、已下架 5、排程 2、停用 4 → 與整理後不同（需要寫回）');
const normalized = api.spotlightOrderList(L, T).map(o => Object.assign({}, L.find(x => x.id === o.id), { priority: o.priority === '' ? 999 : o.priority }));
ok(api.spotlightOrderChanged(normalized, api.spotlightOrderList(normalized, T)) === false, '已經整理好的資料：再整理不會有變動（不會一直寫回）');

console.log('D. 移動順位');
ol = api.spotlightOrderList(L, T, 'C', 1);
ok(pr(ol) === 'A:3,B:2,C:1,D:,E:,F:,G:4', 'C（第 3）移到第 1：B、A 依序往後；G 不變；沒有順位的不受影響');
ol = api.spotlightOrderList(L, T, 'B', 4);
ok(pr(ol) === 'A:1,B:4,C:2,D:,E:,F:,G:3', 'B（第 1）移到第 4（最後）：A、C、G 往前補');
ol = api.spotlightOrderList(L, T, 'A', 3);
ok(pr(ol) === 'A:3,B:1,C:2,D:,E:,F:,G:4', 'A（第 2）移到第 3');
ol = api.spotlightOrderList(L, T, 'B', 99); ok(ol.find(x => x.id === 'B').priority === 4, '目標順位超過範圍：夾在最後一位');
ol = api.spotlightOrderList(L, T, 'B', 0); ok(ol.find(x => x.id === 'B').priority === 1 && ol.every(x => x.priority === '' || Number(x.priority) >= 1), '目標順位 0 或負數：夾在第 1');
ol = api.spotlightOrderList(L, T, 'C', -5); ok(pr(ol) === 'A:3,B:2,C:1,D:,E:,F:,G:4', '目標順位為負數：夾在第 1（不會從尾端算起）');
ol = api.spotlightOrderList(L, T, 'D', 1);
ok(pr(ol) === 'A:2,B:1,C:3,D:,E:,F:,G:4', '想移動已下架的活動：忽略（它沒有順位，其餘不變）');
ol = api.spotlightOrderList(L, T, 'NOPE', 1); ok(pr(ol) === 'A:2,B:1,C:3,D:,E:,F:,G:4', '找不到的編號：忽略');
ol = api.spotlightOrderList(L, T, 'C', 2); ok(new Set(ol.filter(x => x.priority !== '').map(x => x.priority)).size === 4, '移動後順位不重複');

console.log('E. 後端：updateSpotlightsOrder／saveSpotlight 可清空順位');
function mkSheet(rows) {
  const sh = { rows: rows.map(r => r.slice()) };
  const width = () => sh.rows.reduce((m, r) => Math.max(m, r.length), 0);
  const cell = (r, c) => ((sh.rows[r - 1] || [])[c - 1] === undefined ? '' : sh.rows[r - 1][c - 1]);
  sh.getLastRow = () => sh.rows.length; sh.getLastColumn = () => width();
  sh.getDataRange = () => ({ getValues: () => sh.rows.map(r => { const c = r.slice(); while (c.length < width()) c.push(''); return c; }) });
  sh.getRange = (r, c, nr, nc) => { const R = nr || 1, C = nc || 1; const self = {
    getValues: () => { const o = []; for (let i = 0; i < R; i++) { const row = []; for (let j = 0; j < C; j++) row.push(cell(r + i, c + j)); o.push(row); } return o; },
    setValue(v) { return self.setValues([[v]]); },
    setValues(vals) { for (let i = 0; i < vals.length; i++) { while (sh.rows.length < r + i) sh.rows.push([]); const row = sh.rows[r - 1 + i]; for (let j = 0; j < vals[i].length; j++) { while (row.length < c - 1 + j) row.push(''); row[c - 1 + j] = vals[i][j]; } } return self; },
    sort() { sh.sorted = true; return self; }, setNumberFormat() { return self; }, setFontWeight() { return self; }, setBackground() { return self; } }; return self; };
  sh.appendRow = row => { sh.rows.push(row.slice()); }; sh.setFrozenRows = () => {};
  return sh;
}
const HEAD = ['id', 'title', 'subtitle', 'imageUrl', 'mediaType', 'tags', 'bulletPoints', 'startDate', 'endDate', 'duration', 'priority', 'status'];
const rowOf = o => HEAD.map(h => o[h] === undefined ? '' : o[h]);
function env(rows) {
  const book = { Spotlight: mkSheet([HEAD].concat(rows.map(rowOf))) };
  const store = {}; let clears = 0; const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = String(v); }, remove: k => { delete store[k]; } };
  const ctx = { console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => cache }, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) }, Utilities: { formatDate: () => '20261011120000' }, DriveApp: {}, HtmlService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {}, SpreadsheetApp: {},
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this; } }) } };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => (book[n] = mkSheet([])) };
  ctx.getSpreadsheet = () => ss; ctx.checkPassword = p => p === 'tok'; ctx.clearAppDataCache = () => { clears++; };
  return { ctx, sheet: book.Spotlight, clears: () => clears, pri: id => { const r = book.Spotlight.rows.find(x => x[0] === id); return r ? r[10] : undefined; } };
}
const base = () => [{ id: 'A', title: 'a', priority: 2 }, { id: 'B', title: 'b', priority: 1 }, { id: 'D', title: 'd', priority: 5 }];
let e = env(base());
let r = e.ctx.updateSpotlightsOrder([{ id: 'A', priority: 1 }, { id: 'B', priority: 2 }, { id: 'D', priority: '' }], 'bad');
ok(r.success === false && r.authExpired === true && e.pri('D') === 5, '錯誤 token：拒絕，不動資料');
r = e.ctx.updateSpotlightsOrder([{ id: 'A', priority: 1 }, { id: 'B', priority: 2 }, { id: 'D', priority: '' }], 'tok');
ok(r.success && e.pri('A') === 1 && e.pri('B') === 2 && e.pri('D') === '', 'updateSpotlightsOrder：播映中寫入 1、2；空白順位會清空（已下架 D 取消順位），不會變成 1');
e = env(base()); e.ctx.updateSpotlightsOrder([{ id: 'A', priority: 0 }, { id: 'B', priority: null }, { id: 'D', priority: 'abc' }], 'tok');
ok(e.pri('A') === '' && e.pri('B') === '' && e.pri('D') === '', '0、null、非數字都視為沒有順位（清空）');
e = env(base()); e.ctx.updateSpotlightsOrder([{ id: 'A', priority: 3.9 }, { id: 'B', priority: '2' }], 'tok');
ok(e.pri('A') === 3 && e.pri('B') === 2 && e.pri('D') === 5, '小數取整數、數字字串可用；清單沒提到的活動（D）不動');
e = env(base()); e.ctx.updateSpotlightsOrder([{ id: 'A', priority: 1 }, null, { priority: 2 }, { id: 'NOPE', priority: 1 }], 'tok');
ok(e.pri('A') === 1 && e.pri('B') === 1 && e.sheet.rows.length === 4, '清單含 null、缺編號、不存在的編號：不出錯、不新增列');
ok(e.clears() >= 1, '更新後清除快取');
e = env(base()); r = e.ctx.saveSpotlight({ id: 'N1', title: '新', priority: '', status: '啟用', startDate: '2026-10-01', endDate: '2026-10-31' }, 'tok');
ok(r.success && e.pri('N1') === '', 'saveSpotlight：priority 空白＝沒有順位（原本會被寫成 1）');
e = env(base()); e.ctx.saveSpotlight({ id: 'A', title: 'a', priority: 4, status: '啟用' }, 'tok'); ok(e.pri('A') === 4, 'saveSpotlight：有順位照存');
e = env(base()); e.ctx.saveSpotlight({ id: 'A', title: 'a', priority: 999 }, 'tok'); ok(e.pri('A') === 999, 'saveSpotlight：999 仍照存（前端會用 spotlightPriorityOrNone 轉成空白，後端不擅自改）');
e = env(base()); e.ctx.saveSpotlight({ id: 'A', title: 'a' }, 'tok'); ok(e.pri('A') === '', 'saveSpotlight：沒帶 priority → 沒有順位');
ok(e.ctx.spotlightPriorityCell_(0) === '' && e.ctx.spotlightPriorityCell_('') === '' && e.ctx.spotlightPriorityCell_('7') === 7 && e.ctx.spotlightPriorityCell_(2.5) === 2 && e.ctx.spotlightPriorityCell_(-1) === '' && e.ctx.spotlightPriorityCell_(Infinity) === '' && e.ctx.spotlightPriorityCell_(undefined) === '', 'spotlightPriorityCell_：只接受正的有限數');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
