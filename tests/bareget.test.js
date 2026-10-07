// 直接開 GAS /exec（沒有 action）只回導向頁的測試：不開試算表、不做工作表檢查、不寫入、不提供舊版前端；
// 有 action 的唯讀 API 照舊。另確認 .claspignore 不再把 index.html 推上 GAS。執行：node tests/bareget.test.js（已納入 tests/ci.sh）
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m) } else { fail++; console.log('  ✗ FAIL:', m) } };

function env() {
  const calls = { ss: 0, ensureAlbum: 0, ensureDb: 0, fromFile: 0, getAppData: 0 };
  const cache = { get: () => null, put() {}, remove() {} };
  const mkHtml = html => ({ html: html, title: '', xframe: '', meta: {}, setTitle(t) { this.title = t; return this }, setXFrameOptionsMode(m) { this.xframe = m; return this }, addMetaTag(k, v) { this.meta[k] = v; return this }, setFaviconUrl() { return this } });
  const ctx = { console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => cache },
    ContentService: { MimeType: { ICAL: 'text/calendar', JSON: 'application/json' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this } }) },
    HtmlService: { XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }, createHtmlOutput: mkHtml, createHtmlOutputFromFile() { calls.fromFile++; return mkHtml('FROMFILE') } },
    PropertiesService: {}, Utilities: {}, LockService: {}, SpreadsheetApp: {}, DriveApp: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {} };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet = () => { calls.ss++; return null; };
  ctx.ensureAlbumSheetsExist = () => { calls.ensureAlbum++; };
  ctx.ensureDatabaseInitialized = () => { calls.ensureDb++; };
  ctx.getAppData = () => { calls.getAppData++; return { success: true, data: 'D' }; };
  return { ctx, calls };
}
const URL = 'https://avaltech-ai.github.io/3of3/';

console.log('A. 沒有 action：只回導向頁');
[['空參數', { parameter: {} }], ['沒有 parameter', {}], ['e 為 undefined', undefined], ['只有多餘參數（?fresh=1）', { parameter: { fresh: '1' } }], ['action 為空字串', { parameter: { action: '' } }]].forEach(function (c) {
  const t = env(); const out = t.ctx.doGet(c[1]);
  ok(out && typeof out.html === 'string' && out.html.indexOf(URL) >= 0 && out.html.indexOf('target="_top"') >= 0, c[0] + '：回傳導向頁（含正式網址與 target="_top" 連結）');
  ok(t.calls.ss === 0 && t.calls.ensureAlbum === 0 && t.calls.ensureDb === 0 && t.calls.fromFile === 0 && t.calls.getAppData === 0, c[0] + '：不開試算表、不檢查／建立工作表、不讀 getAppData、不提供舊版前端');
});
let t = env(); let out = t.ctx.doGet({ parameter: {} });
ok(out.title === '桃子腳幼兒園 - 諾貝爾 A 班' && out.xframe === 'ALLOWALL' && /width=device-width/.test(out.meta.viewport), '標題、可被嵌入、行動版 viewport');
ok(/window\.top\.location\.replace\("https:\/\/avaltech-ai\.github\.io\/3of3\/"\)/.test(out.html) && /try\{[^}]*\}catch\(e\)\{\}/.test(out.html), '嘗試自動跳轉（包在 try/catch，被沙箱擋下也不報錯）');
ok(/<a class="btn" href="https:\/\/avaltech-ai\.github\.io\/3of3\/" target="_top" rel="noopener">/.test(out.html), '備援：可點的「前往網站」連結（target=_top、rel=noopener）');
ok(out.html.split('<script>').length === 2 && !/https?:\/\/(?!avaltech-ai\.github\.io)/.test(out.html.replace(/xmlns[^ >]*/g, '')), '只有一段內嵌 script，且沒有指向其他網站的網址');
ok(out.html.indexOf('${') < 0 && out.html.indexOf('undefined') < 0, '內容沒有未替換的變數');

console.log('B. 有 action：唯讀 API 照舊');
t = env(); out = t.ctx.doGet({ parameter: { action: 'getAppData' } });
ok(out.mime === 'application/json' && JSON.parse(out.text).data === 'D' && t.calls.getAppData === 1, 'getAppData：回傳 JSON');
t = env(); out = t.ctx.doGet({ parameter: { action: 'listSheetNames' } });
ok(out.mime === 'application/json' && JSON.parse(out.text).error === '未知動作', '未知動作（listSheetNames）：回傳 JSON「未知動作」，不是導向頁');
t = env(); out = t.ctx.doGet({ parameter: { action: 'clearCache' } });
ok(JSON.parse(out.text).success === false && out.html === undefined, '寫入類動作（clearCache）：公開入口仍拒絕');
t = env(); t.ctx.doGet({ parameter: { action: 'getAlbums' } });
ok(t.calls.ensureAlbum === 1, '其他動作（getAlbums）：仍照舊檢查相簿工作表');

console.log('C. 專案設定');
ok(!/createHtmlOutputFromFile/.test(src), 'Code.js 不再讀取 GAS 內的 index.html');
const ig = fs.readFileSync(path.join(root, '.claspignore'), 'utf8');
ok(!/index\.html/i.test(ig) && /!Code\.js/.test(ig) && /!appsscript\.json/.test(ig), '.claspignore：不再把 index.html 推上 GAS（只推 Code.js 與 appsscript.json）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
