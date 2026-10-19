// 後台「介面標題」（頁首：基金會名稱、學校名稱、班級名稱、標籤；頁尾：聯絡資訊、標語）後端測試（2026-10-19）：
// saveSiteTitles（驗證 token、驗證內容、寫入 Settings、預設值＝留空）、公開資料的解析、英文對照（名稱／內容）的出處蒐集與同步、doPost 路由。
// 以模擬的試算表執行，不碰真實資料。執行：node tests/sitetitles.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mkSheet(rows) {
  const sh = { rows: rows.map(r => r.slice()), formats: {} };
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
      setNumberFormat(f) { sh.formats[r + ',' + c] = f; return self; }, setFontWeight() { return self; }, setBackground() { return self; }
    };
    return self;
  };
  sh.appendRow = row => { sh.rows.push(row.slice()); };
  sh.deleteRow = r => { sh.rows.splice(r - 1, 1); };
  sh.insertColumnAfter = () => {};
  return sh;
}

const TOK = 'tok';
function env(sheets, opts) {
  opts = opts || {};
  const book = {}; Object.keys(sheets || {}).forEach(k => { book[k] = mkSheet(sheets[k]); });
  const store = {}; const calls = { clearApp: 0 };
  const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = String(v); }, remove: k => { delete store[k]; },
    putAll: o => { Object.keys(o).forEach(k => { store[k] = String(o[k]); }); }, removeAll: ks => ks.forEach(k => delete store[k]) };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    LanguageApp: { translate: z => 'EN(' + z + ')' },
    Utilities: {}, DriveApp: {}, HtmlService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {},
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this; } }) },
    SpreadsheetApp: { getUi: () => { throw new Error('no UI'); } }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => { book[n] = mkSheet([]); return book[n]; } };
  ctx.getSpreadsheet = () => ss; ctx.checkPassword = p => p === TOK;
  ctx.clearAppDataCache = () => { calls.clearApp++; };
  ctx.getAppData = () => ({ success: true, data: opts.data || {} });
  return { ctx, ss, book, store, calls };
}
const SETTINGS = () => [['key', 'value', 'description'], ['CLASS_NAME', '諾貝爾 A 班', '班級名稱'], ['ADMIN_PASSWORD', 'secret-pass-123', '管理員密碼'], ['TICKER_MESSAGE', '歡迎', '跑馬燈']];
const valOf = (e, key) => { const r = e.book.Settings.rows.find(x => String(x[0]).trim() === key); return r ? r[1] : undefined; };
const rowsOf = (e, key) => e.book.Settings.rows.filter(x => String(x[0]).trim() === key).length;
const DEF = { headerFoundation: '三之三生命教育基金會', headerSchool: '新北市桃子腳非營利幼兒園', headerClass: '諾貝爾 A 班', headerBadge: 'Happy Life', footerContact: 'TEL：02-2668-8249｜FAX：02-2668-8245', footerMotto: '用愛陪伴孩子成長的每一步', footerLineUrl: '' };
const PROPS = Object.keys(DEF);

console.log('A. 驗證 token');
let e = env({ Settings: SETTINGS() }); let c = e.ctx;
let snap = JSON.stringify(e.book.Settings.rows);
let r = c.saveSiteTitles({ headerClass: '駭客班' }, 'bad');
ok(r.success === false && r.authExpired === true && JSON.stringify(e.book.Settings.rows) === snap && e.calls.clearApp === 0, '錯誤 token：拒絕並要求重新登入，Settings 完全沒被改動、也沒清快取');
r = c.saveSiteTitles({ headerClass: '駭客班' }, undefined); ok(r.authExpired === true, '沒帶 token：同樣拒絕');

console.log('B. 儲存');
e = env({ Settings: SETTINGS() }); c = e.ctx;
r = c.saveSiteTitles({ headerClass: '諾貝爾 B 班', footerMotto: '快樂學習每一天' }, TOK);
ok(r.success === true && e.calls.clearApp === 1, '成功並清除公開資料快取');
ok(valOf(e, 'HEADER_CLASS') === '諾貝爾 B 班' && valOf(e, 'FOOTER_MOTTO') === '快樂學習每一天', '寫進 Settings 的 HEADER_CLASS、FOOTER_MOTTO（原本沒有的列自動新增）');
ok(rowsOf(e, 'HEADER_CLASS') === 1 && rowsOf(e, 'HEADER_SCHOOL') === 0, '只新增有傳的欄位；沒傳的不會新增列');
const hr = e.book.Settings.rows.find(x => x[0] === 'HEADER_CLASS');
ok(/班級名稱/.test(String(hr[2])) && /頁首/.test(String(hr[2])), '新增的列帶說明（頁首：班級名稱），方便在試算表裡看得懂');
ok(eq(Object.keys(r.titles), PROPS) && r.titles.headerClass === '諾貝爾 B 班' && r.titles.footerMotto === '快樂學習每一天' && r.titles.headerSchool === '', '回傳目前六段的值（沒設定的是空字串＝使用預設）');
ok(valOf(e, 'ADMIN_PASSWORD') === 'secret-pass-123' && valOf(e, 'CLASS_NAME') === '諾貝爾 A 班' && valOf(e, 'TICKER_MESSAGE') === '歡迎', '其他設定（密碼、班級名稱、跑馬燈）完全不動');
r = c.saveSiteTitles({ headerClass: '諾貝爾 C 班' }, TOK);
ok(valOf(e, 'HEADER_CLASS') === '諾貝爾 C 班' && rowsOf(e, 'HEADER_CLASS') === 1 && valOf(e, 'FOOTER_MOTTO') === '快樂學習每一天', '再存一次：更新同一列（不重複新增），沒傳的欄位保留原值');
ok(e.book.Settings.formats[(e.book.Settings.rows.findIndex(x => x[0] === 'HEADER_CLASS') + 1) + ',2'] === '@', '儲存格設成純文字格式（開頭是 = + - 的內容不會被當成公式）');
r = c.saveSiteTitles({ headerSchool: '=HYPERLINK("x")', footerContact: '+886 2 1234 5678' }, TOK);
ok(valOf(e, 'HEADER_SCHOOL') === '=HYPERLINK("x")' && valOf(e, 'FOOTER_CONTACT') === '+886 2 1234 5678', '以 = 或 + 開頭的內容：原樣存成文字');
const all = c.saveSiteTitles({ headerFoundation: '基金會甲', headerSchool: '學校乙', headerClass: '班丙', headerBadge: 'Good Life', footerContact: 'TEL：02-1111-2222', footerMotto: '標語丁', footerLineUrl: 'https://lin.ee/izXkZCI' }, TOK);
ok(all.success && PROPS.every(p => all.titles[p] !== ''), '七段（含 LINE 連結）一次全存：全部成功');

console.log('C. 預設值與清理');
e = env({ Settings: SETTINGS() }); c = e.ctx;
r = c.saveSiteTitles(Object.assign({}, DEF), TOK);
ok(r.success && PROPS.every(p => r.titles[p] === ''), '內容與預設文字相同：存成空白（＝使用預設），不會把預設文字當成自訂');
ok(valOf(e, 'HEADER_CLASS') === '' && valOf(e, 'FOOTER_MOTTO') === '', 'Settings 裡是空白');
r = c.saveSiteTitles({ headerClass: '  諾貝爾   A 班 ', footerMotto: '用愛陪伴孩子成長的每一步　' }, TOK);
ok(r.titles.headerClass === '' && r.titles.footerMotto === '', '只差前後或中間多餘空白的預設文字：也視為預設');
r = c.saveSiteTitles({ headerClass: '諾貝爾 B 班' }, TOK); r = c.saveSiteTitles({ headerClass: '' }, TOK);
ok(r.success && valOf(e, 'HEADER_CLASS') === '' && r.titles.headerClass === '', '傳空字串：清除自訂、恢復預設');
r = c.saveSiteTitles({ headerClass: '諾貝爾 B 班' }, TOK); r = c.saveSiteTitles({ headerClass: null }, TOK);
ok(r.success && valOf(e, 'HEADER_CLASS') === '', '傳 null：同樣恢復預設');
r = c.saveSiteTitles({ footerMotto: '第一行\n第二行\t\u0007第三行   後面' }, TOK);
ok(r.titles.footerMotto === '第一行 第二行 第三行 後面', '換行、Tab、控制字元換成空白並收斂空白');
r = c.saveSiteTitles({ footerMotto: '   ' }, TOK); ok(r.success && r.titles.footerMotto === '', '只有空白：視為清除');

console.log('D. 長度上限與格式驗證（有一筆不對就整批拒絕）');
const MAX = { headerFoundation: 30, headerSchool: 40, headerClass: 20, headerBadge: 20, footerContact: 80, footerMotto: 60, footerLineUrl: 300 };
const fill = (p, n) => p === 'footerLineUrl' ? 'https://x.test/' + 'a'.repeat(n - 15) : '字'.repeat(n);
e = env({ Settings: SETTINGS() }); c = e.ctx;
PROPS.forEach(p => {
  const okR = c.saveSiteTitles({ [p]: fill(p, MAX[p]) }, TOK);
  ok(okR.success && okR.titles[p].length === MAX[p], p + '：剛好 ' + MAX[p] + ' 字可以');
  const s0 = JSON.stringify(e.book.Settings.rows);
  const badR = c.saveSiteTitles({ [p]: fill(p, MAX[p] + 1) }, TOK);
  ok(badR.success === false && /最多/.test(badR.error) && JSON.stringify(e.book.Settings.rows) === s0, p + '：多 1 字被拒絕、不寫入');
});
e = env({ Settings: SETTINGS() }); c = e.ctx; snap = JSON.stringify(e.book.Settings.rows);
const bad = [[null, 'null'], [undefined, 'undefined'], ['x', '字串'], [[], '陣列'], [['a'], '陣列有內容'], [{}, '空物件'], [5, '數字']];
bad.forEach(([v, why]) => { const x = c.saveSiteTitles(v, TOK); ok(x.success === false && JSON.stringify(e.book.Settings.rows) === snap, '拒絕：' + why + '（' + (x.error || '') + '）'); });
ok(c.saveSiteTitles({ unknownField: 'x' }, TOK).success === false && c.saveSiteTitles({ headerClass: 'ok', unknownField: 'x' }, TOK).success === false && JSON.stringify(e.book.Settings.rows) === snap, '不認得的欄位：整批拒絕（連同有效的那一筆也不寫）');
ok(c.saveSiteTitles(JSON.parse('{"__proto__":"x"}'), TOK).success === false && c.saveSiteTitles({ constructor: 'x' }, TOK).success === false && c.saveSiteTitles({ toString: 'x' }, TOK).success === false, '__proto__、constructor、toString 這類欄位名：拒絕');
ok(c.saveSiteTitles({ headerClass: 123 }, TOK).success === false && c.saveSiteTitles({ headerClass: { a: 1 } }, TOK).success === false && c.saveSiteTitles({ headerClass: ['x'] }, TOK).success === false && c.saveSiteTitles({ headerClass: true }, TOK).success === false, '值不是字串（數字、物件、陣列、布林）：拒絕');
ok(JSON.stringify(e.book.Settings.rows) === snap, '以上被拒絕的都沒有寫入、也沒有新增列');
const noSheet = env({}); ok(noSheet.ctx.saveSiteTitles({ headerClass: '甲' }, TOK).success === false, '沒有 Settings 工作表：回報失敗');
const mixed = c.saveSiteTitles({ headerClass: '甲班', headerBadge: '字'.repeat(21) }, TOK); ok(mixed.success === false && rowsOf(e, 'HEADER_CLASS') === 0, '一筆有效、一筆超長：整批拒絕，有效的也不會先寫入');

console.log('E. 公開資料 siteTitlesFromSettings_');
const S = c.siteTitlesFromSettings_;
ok(typeof S === 'function' && eq(Object.keys(S({})), PROPS) && PROPS.every(p => S({})[p] === ''), '沒有任何設定：六個欄位都是空字串（前台用預設）');
const raw = { HEADER_CLASS: ' 諾貝爾 B 班 ', FOOTER_MOTTO: '快樂\n學習', HEADER_BADGE: 12345, HEADER_SCHOOL: '', FOOTER_CONTACT: null, ADMIN_PASSWORD: 'secret-pass-123', TICKER_MESSAGE: '歡迎' };
const sv = S(raw);
ok(sv.headerClass === '諾貝爾 B 班' && sv.footerMotto === '快樂 學習' && sv.headerBadge === '12345' && sv.headerSchool === '' && sv.footerContact === '', '清理空白與換行、數字轉文字、空白與 null 是空字串');
ok(JSON.stringify(sv).indexOf('secret-pass-123') === -1 && JSON.stringify(sv).indexOf('歡迎') === -1 && eq(Object.keys(sv), PROPS), '只輸出這六個欄位，不會帶出密碼或其他設定');
ok(S({ HEADER_CLASS: '諾貝爾 A 班' }).headerClass === '' && S({ FOOTER_MOTTO: ' 用愛陪伴孩子成長的每一步 ' }).footerMotto === '', '試算表裡手動填了和預設相同的文字：也視為預設');
ok(S({ HEADER_FOUNDATION: '字'.repeat(80) }).headerFoundation.length === 30, '試算表裡手動填了超長內容：公開時截到上限（不讓版面被撐爆）');
ok(S({ HEADER_CLASS: new Date(2026, 9, 19) }).headerClass === '' && S({ HEADER_SCHOOL: new Date(2026, 9, 19) }).headerSchool === '', '儲存格被試算表轉成日期：視為沒自訂（不顯示日期字串），也不拋錯');
ok(/tickerMessage:[\s\S]{0,400}\.\.\.siteTitlesFromSettings_\(settings\)/.test(src), 'getAppData 的公開 settings 帶入這六個欄位（接在 tickerMessage 之後展開）');

console.log('F. 英文對照蒐集（名稱：基金會、學校、班級、標籤；內容：聯絡資訊、標語）');
e = env({ Settings: SETTINGS().concat([['HEADER_CLASS', '諾貝爾 B 班', ''], ['HEADER_FOUNDATION', '', ''], ['HEADER_BADGE', 'Good Life', ''], ['HEADER_SCHOOL', '桃子腳第二園', ''], ['FOOTER_MOTTO', '快樂學習每一天', '']]) }); c = e.ctx;
const ns = c.collectNameSources_(e.ss);
ok(ns.names['諾貝爾 B 班'] && eq(ns.names['諾貝爾 B 班'].labels, ['頁首：班級名稱']) && ns.names['桃子腳第二園'] && eq(ns.names['桃子腳第二園'].labels, ['頁首：學校名稱']), '名稱蒐集：自訂的班級名稱與學校名稱（出處標示「頁首：…」）');
ok(!ns.names['三之三生命教育基金會'] && !ns.names['諾貝爾 A 班'] && !ns.names['Good Life'], '沒自訂（空白＝預設）的、沒有中文的（Good Life）：不蒐集');
ok(!ns.names['快樂學習每一天'], '標語屬於「內容」，不放進名稱對照');
const ts = c.collectTextSources_({ settings: { footerMotto: '快樂學習每一天', footerContact: '電話：02-1111-2222', headerClass: '諾貝爾 B 班' } });
ok(ts.units['快樂學習每一天'] && eq(ts.units['快樂學習每一天'].labels, ['頁尾：標語']) && ts.units['電話：02-1111-2222'] && eq(ts.units['電話：02-1111-2222'].labels, ['頁尾：聯絡資訊']), '內容蒐集：標語、聯絡資訊（出處標示「頁尾：…」）');
ok(!ts.units['諾貝爾 B 班'], '班級名稱屬於「名稱」，不放進內容對照');
const ts2 = c.collectTextSources_({ settings: { footerMotto: '', footerContact: 'TEL：02-1111-2222｜FAX：02-1111-2223' } }); ok(Object.keys(ts2.units).length === 0, '空白、沒有中文的聯絡資訊（電話傳真）：不蒐集');
ok(Object.keys(c.collectTextSources_({}).units).length === 0 && Object.keys(c.collectTextSources_({ settings: null }).units).length === 0, '資料沒有 settings：不拋錯');
let sync = c.adminMapSync('name', TOK);
const nmRows = e.book.NameMap.rows;
ok(sync.success && nmRows.some(x => x[0] === '諾貝爾 B 班' && /頁首：班級名稱/.test(String(x[3]))) && nmRows.some(x => x[0] === '桃子腳第二園'), '同步名稱對照：自訂的班級、學校名稱出現在對照表，出處「頁首：班級名稱」');
c.saveSiteTitles({ headerClass: '諾貝爾 C 班' }, TOK); sync = c.adminMapSync('name', TOK);
const old = e.book.NameMap.rows.find(x => x[0] === '諾貝爾 B 班');
ok(e.book.NameMap.rows.some(x => x[0] === '諾貝爾 C 班') && old && /目前沒有使用/.test(String(old[3])), '改了班級名稱再同步：新名稱加入；舊名稱變成「目前沒有使用」（可勾選刪除）');
e.ctx.getAppData = () => ({ success: true, data: { settings: { footerMotto: '快樂學習每一天' } } });
sync = c.adminMapSync('text', TOK);
ok(sync.success && e.book.TextMap.rows.some(x => x[0] === '快樂學習每一天' && /頁尾：標語/.test(String(x[3]))), '同步內容對照：自訂的標語出現在對照表，出處「頁尾：標語」');

console.log('H. LINE 連結（網址欄位：留空＝不顯示；只收 https 網址）');
e = env({ Settings: SETTINGS() }); c = e.ctx;
r = c.saveSiteTitles({ footerLineUrl: '  https://lin.ee/izXkZCI  ' }, TOK);
ok(r.success && r.titles.footerLineUrl === 'https://lin.ee/izXkZCI' && valOf(e, 'FOOTER_LINE_URL') === 'https://lin.ee/izXkZCI', '存網址：去前後空白，寫進 FOOTER_LINE_URL，公開值就是這個網址');
ok(/不顯示/.test(String(e.book.Settings.rows.find(x => x[0] === 'FOOTER_LINE_URL')[2])) && /頁尾/.test(String(e.book.Settings.rows.find(x => x[0] === 'FOOTER_LINE_URL')[2])) && /LINE/.test(String(e.book.Settings.rows.find(x => x[0] === 'FOOTER_LINE_URL')[2])), '新增的列說明寫出「頁尾：LINE 連結」，且說明空白＝不顯示（網址類沒有預設文字）');
snap = JSON.stringify(e.book.Settings.rows);
['http://lin.ee/x', 'ftp://lin.ee/x', 'javascript:alert(1)', 'data:text/html,x', 'lin.ee/izXkZCI', '//lin.ee/x', 'https://', 'https://a b', 'https:// lin.ee', 'HTTPS ://x', 'mailto:a@b.c'].forEach(u => {
  const x = c.saveSiteTitles({ footerLineUrl: u }, TOK);
  ok(x.success === false && /https:\/\//.test(x.error) && JSON.stringify(e.book.Settings.rows) === snap, '拒絕不合法的網址：' + u);
});
r = c.saveSiteTitles({ footerLineUrl: 'HTTPS://LIN.EE/ABC' }, TOK); ok(r.success && r.titles.footerLineUrl === 'HTTPS://LIN.EE/ABC', '協定大小寫不拘（HTTPS:// 可以）');
r = c.saveSiteTitles({ footerLineUrl: '' }, TOK); ok(r.success && r.titles.footerLineUrl === '' && valOf(e, 'FOOTER_LINE_URL') === '', '清空：不顯示（沒有預設值）');
r = c.saveSiteTitles({ footerLineUrl: 'https://lin.ee/第一\n第二' }, TOK); ok(r.success === false, '網址中間有換行（清理成空白後變成有空白）：拒絕');
ok(S({ FOOTER_LINE_URL: 'javascript:alert(1)' }).footerLineUrl === '' && S({ FOOTER_LINE_URL: 'http://x.test' }).footerLineUrl === '' && S({ FOOTER_LINE_URL: 'https://a b' }).footerLineUrl === '', '試算表裡被手動填了不合法網址：公開時一律當成空白（前台不會顯示壞連結或 javascript: 連結）');
ok(S({ FOOTER_LINE_URL: ' https://lin.ee/x ' }).footerLineUrl === 'https://lin.ee/x' && S({ FOOTER_LINE_URL: 'https://x.test/' + 'a'.repeat(400) }).footerLineUrl === '', '合法網址去空白後公開；超過 300 字的網址公開時當成空白（截斷後會變成錯誤連結，所以不是截短）');
e = env({ Settings: SETTINGS().concat([['FOOTER_LINE_URL', 'https://lin.ee/中文網址', '']]) }); c = e.ctx;
ok(Object.keys(c.collectNameSources_(e.ss).names).length === 1 && Object.keys(c.collectTextSources_({ settings: { footerLineUrl: 'https://lin.ee/中文網址' } }).units).length === 0, '網址（即使網址裡有中文）不進英文對照：名稱、內容都不蒐集（名稱對照只有程式內建的「全園」）');

console.log('G. doPost 路由');
const post = (ctx, body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
e = env({ Settings: SETTINGS() }); c = e.ctx;
r = post(c, { action: 'saveSiteTitles', titles: { headerClass: '諾貝爾 B 班' }, password: TOK });
ok(r.success === true && valOf(e, 'HEADER_CLASS') === '諾貝爾 B 班' && r.titles.headerClass === '諾貝爾 B 班', 'doPost saveSiteTitles');
r = post(c, { action: 'saveSiteTitles', titles: { headerClass: '駭客' }, password: 'bad' }); ok(r.success === false && r.authExpired === true && valOf(e, 'HEADER_CLASS') === '諾貝爾 B 班', 'doPost saveSiteTitles：錯誤 token 被拒');
const key = 'idem_key_0123456789abcdef';
r = post(c, { action: 'saveSiteTitles', titles: { footerMotto: '第一次' }, password: TOK, idempotencyKey: key });
const r2 = post(c, { action: 'saveSiteTitles', titles: { footerMotto: '第一次' }, password: TOK, idempotencyKey: key });
ok(r2.duplicate === true && valOf(e, 'FOOTER_MOTTO') === '第一次', '逾時重送（同一個 idempotencyKey）：回傳第一次的結果');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
