// 手機底部導覽列設定（後端）：Settings 的 MOBILE_NAV_TABS 解析、saveMobileNav 驗證與寫入、getAppData 接線與權限。
// 執行：node tests/mobilenav.test.js
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

function env(rows, opts) {
  opts = opts || {};
  const data = rows ? rows.map(r => r.slice()) : null, formats = [];
  let cleared = 0;
  const sheet = data && {
    getDataRange: () => ({ getValues: () => data.map(r => r.slice()) }),
    getLastRow: () => data.length,
    getRange: (r, c) => ({
      setNumberFormat: f => { formats.push(r + ':' + c + ':' + f); },
      setValue: v => { while (data.length < r) data.push([]); const row = data[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; }
    })
  };
  const ctx = { console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) }, PropertiesService: {}, LockService: {}, SpreadsheetApp: {}, ContentService: {}, HtmlService: {}, UrlFetchApp: {}, DriveApp: {}, Session: {}, ScriptApp: {}, Utilities: {} };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet = () => ({ getSheetByName: n => n === 'Settings' ? sheet : null });
  ctx.checkPassword = tok => tok === 'good';
  ctx.authFail_ = () => ({ success: false, error: '登入已逾時或無效，請重新登入。' });
  ctx.clearAppDataCache = () => { cleared++; };
  return { ctx, data, formats, cleared: () => cleared };
}
const BASE = () => [['key', 'value'], ['CLASS_NAME', '諾貝爾 A 班'], ['TICKER_MESSAGE', '歡迎']];

console.log('A. parseMobileNavTabs_');
let e = env(BASE()); const P = v => JSON.stringify(e.ctx.parseMobileNavTabs_(v));
ok(P('home,albums,themes,songs') === '["home","albums","themes","songs"]', '正常：依順序回傳');
ok(P(' home , docs，tasks  transition') === '["home","docs","tasks","transition"]', '逗號（含全形）、空白都可分隔，前後空白去掉');
ok(P('home,home,albums,壞的,admin,javascript:x,songs,docs,themes') === '["home","albums","songs","docs"]', '重複、不認得、後台（admin）、危險字串略過；最多 4 個');
ok(P('') === '[]' && P(null) === '[]' && P(undefined) === '[]' && P(123) === '[]', '空白、null、數字：空陣列（前端用預設）');

console.log('B. saveMobileNav');
e = env(BASE());
let r = e.ctx.saveMobileNav(['home', 'albums', 'themes', 'songs'], 'bad'); ok(r.success === false && /登入/.test(r.error) && e.data.length === 3 && e.cleared() === 0, '錯誤 token：拒絕，不動資料');
ok(/4/.test(e.ctx.saveMobileNav(['home', 'albums', 'themes'], 'good').error) && /4/.test(e.ctx.saveMobileNav(['home', 'albums', 'themes', 'songs', 'docs'], 'good').error), '不是正好 4 個：拒絕');
ok(/不認得/.test(e.ctx.saveMobileNav(['home', 'albums', 'themes', 'admin'], 'good').error) && /不認得/.test(e.ctx.saveMobileNav(['home', 'albums', 'themes', '<img>'], 'good').error), '後台或不認得的代號：拒絕');
ok(/兩次/.test(e.ctx.saveMobileNav(['home', 'albums', 'home', 'songs'], 'good').error), '重複：拒絕');
ok(e.ctx.saveMobileNav('home,albums,themes,songs', 'good').success === false && e.ctx.saveMobileNav(null, 'good').success === false && e.data.length === 3, '不是陣列：拒絕，沒有寫入');
r = e.ctx.saveMobileNav(['home', 'albums', 'themes', 'songs'], 'good');
ok(r.success && JSON.stringify(r.tabs) === '["home","albums","themes","songs"]' && e.data.length === 4 && e.data[3][0] === 'MOBILE_NAV_TABS' && e.data[3][1] === 'home,albums,themes,songs' && e.cleared() === 1, 'Settings 沒有這一列：自動新增 MOBILE_NAV_TABS，值為逗號分隔，清快取');
ok(e.formats.some(f => /^4:2:@$/.test(f)), '值以純文字格式寫入');
r = e.ctx.saveMobileNav(['docs', 'tasks', 'home', 'transition'], 'good');
ok(r.success && e.data.length === 4 && e.data[3][1] === 'docs,tasks,home,transition' && e.data[1][1] === '諾貝爾 A 班' && e.data[2][1] === '歡迎', '已有這一列：原地更新，其他設定不動');
ok(e.ctx.saveMobileNav([' home ', 'albums', 'themes', 'songs'], 'good').success === true && e.data[3][1] === 'home,albums,themes,songs', '代號前後空白會去掉');
e = env(null); ok(/Settings/.test(e.ctx.saveMobileNav(['home', 'albums', 'themes', 'songs'], 'good').error), '沒有 Settings 工作表：提示，不出錯');

console.log('C. 接線與安全');
ok(/mobileNavTabs: parseMobileNavTabs_\(settings\.MOBILE_NAV_TABS\)/.test(src), 'getAppData 的 settings 帶 mobileNavTabs（已解析成陣列）');
ok(/action === 'saveMobileNav'/.test(src), 'doPost 接上 saveMobileNav');
const i = src.indexOf('function saveMobileNav('); ok(/if \(!checkPassword\(password\)\) return authFail_\(\);/.test(src.slice(i, i + 200)), 'saveMobileNav 第一步驗證 token');
ok(!/MobileNav/.test(src.slice(src.indexOf('function doGet('), src.indexOf('function doPost('))), 'doGet（公開、匿名）沒有寫入動作');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
