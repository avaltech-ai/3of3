// 後端「冪等性」測試：同一個 idempotencyKey 只會真正執行一次（防止逾時重送造成重複寫入）。
// 以模擬的 Cache/Properties/Lock 執行，不碰真實資料。
// 執行：node tests/idempotency.test.js    （修改 Code.js 的 doPost 後必跑，全部 ✓ 才可部署）
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

function env() {
  let now = 1_000_000_000_000; const store = {}, props = {};
  const cache = {
    get: k => { const e = store[k]; if (!e) return null; if (e.exp <= now) { delete store[k]; return null; } return e.v; },
    put: (k, v, ttl) => { store[k] = { v: String(v), exp: now + ttl * 1000 }; },
    remove: k => { delete store[k]; }
  };
  let uuid = 0;
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
    Utilities: { getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-' + String(++uuid).padStart(12, '0') },
    LockService: { getScriptLock: () => ({ tryLock: () => !ctx.__busy, releaseLock() {} }) },
    ContentService: { createTextOutput: t => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 'J' } },
    HtmlService: { createHtmlOutput: () => ({ setXFrameOptionsMode() { return this; } }), XFrameOptionsMode: { ALLOWALL: 1 } },
    SpreadsheetApp: {}, DriveApp: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {}
  };
  ctx.Date = class extends Date { static now() { return now; } };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const settingsRows = [['key', 'value'], ['ADMIN_PASSWORD', 'CorrectHorse-99']];
  ctx.getSpreadsheet = () => ({ getSheetByName: () => ({ getDataRange: () => ({ getValues: () => settingsRows.map(r => r.slice()) }) }) });
  const token = ctx.verifyPassword('CorrectHorse-99').token;
  const calls = { save: 0, upload: 0 };
  ctx.saveEvent = (data, pw) => { if (!ctx.checkPassword(pw)) return ctx.authFail_(); calls.save++; return { success: true, id: 'EV-' + calls.save }; };
  ctx.uploadPhotosChunk = (p, pw) => { if (!ctx.checkPassword(pw)) return ctx.authFail_(); calls.upload++; return { success: true, saved: (p.files || []).length }; };
  const post = (action, body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(Object.assign({ action }, body)) } }).text);
  return { ctx, token, calls, post, adv: ms => { now += ms; } };
}
const KEY = 'k1abc2def3ghi4jkl5mno6pq';   // 24 字元，符合 [A-Za-z0-9_-]{16,80}

console.log('A. 同一個編號只會執行一次');
let e = env();
let r1 = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
let r2 = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
ok(r1.success && e.calls.save === 1, '第一次：正常執行');
ok(r2.success === true && r2.duplicate === true && e.calls.save === 1, '第二次（逾時重送）：沒有再執行，回傳上次結果並標記 duplicate');
ok(r2.id === r1.id, '兩次回傳的結果內容相同（同一個 id），前端無法分辨也無須分辨');
let r3 = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
ok(e.calls.save === 1 && r3.duplicate, '連續重送多次都只執行一次');
ok(r1.duplicate === undefined, '第一次的回應不帶 duplicate 標記');

console.log('B. 不同編號、或沒帶編號 → 照常執行');
e = env();
e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: 'k_aaaaaaaaaaaaaaaaaaaaaa1' });
e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: 'k_aaaaaaaaaaaaaaaaaaaaaa2' });
ok(e.calls.save === 2, '兩個不同編號 → 各執行一次');
e.post('saveEvent', { data: {}, password: e.token }); e.post('saveEvent', { data: {}, password: e.token });
ok(e.calls.save === 4, '沒帶編號（舊版前端）→ 不去重、行為與以前相同（向下相容）');

console.log('C. 失敗不快取：重試仍會重新執行');
e = env(); let attempt = 0;
e.ctx.saveEvent = (d, pw) => { if (!e.ctx.checkPassword(pw)) return e.ctx.authFail_(); attempt++; return attempt === 1 ? { success: false, error: '暫時性錯誤' } : { success: true, id: 'EV-OK' }; };
let f1 = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
let f2 = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
ok(f1.success === false && f2.success === true && attempt === 2 && !f2.duplicate, '第一次失敗 → 第二次（同編號）重新執行並成功');
let f3 = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
ok(f3.duplicate === true && attempt === 2, '成功之後的重送才命中快取');

console.log('E. 安全性：不能用猜編號取得別人的結果');
e = env(); e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
let evil = e.post('saveEvent', { data: {}, password: 'wrong-token-' + 'x'.repeat(40), idempotencyKey: KEY });
ok(evil.authExpired === true && !evil.id && !evil.duplicate, '無效 token + 已知編號 → 回 authExpired，不洩漏上次結果');
let evil2 = e.post('saveEvent', { data: {}, password: 'CorrectHorse-99', idempotencyKey: KEY });
ok(evil2.authExpired === true, '拿密碼當憑證 + 已知編號 → 一樣被拒');
let none = e.post('saveEvent', { data: {}, password: '', idempotencyKey: KEY });
ok(none.authExpired === true, '空憑證 + 已知編號 → 被拒');

console.log('F. 編號格式不合法 → 忽略（不報錯、不去重）');
e = env();
for (const bad of ['short', 'x'.repeat(200), 'has space in it 1234567', '含中文的編號１２３４５６７８９０１２３４５６', "k';DROP TABLE--abcdefgh", 12345, null, {}]) {
  const a = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: bad });
  const b = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: bad });
  if (!(a.success && b.success && !b.duplicate)) { ok(false, '格式不合法的編號應被忽略：' + JSON.stringify(bad)); }
}
ok(e.calls.save === 16, '8 種不合法編號 × 2 次，全部照常執行（共 16 次），沒有任何錯誤');

console.log('G. 登入／登出／檢查登入狀態不做去重');
e = env();
const l1 = e.post('verifyPassword', { password: 'CorrectHorse-99', idempotencyKey: KEY });
const l2 = e.post('verifyPassword', { password: 'CorrectHorse-99', idempotencyKey: KEY });
ok(l1.token && l2.token && l1.token !== l2.token && !l2.duplicate, '登入帶編號也每次發新 token（不回放舊 token）');
ok(e.post('checkSession', { password: l1.token, idempotencyKey: KEY }).success === true, 'checkSession 帶編號正常');

console.log('H. 期限與大小');
e = env(); e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
e.adv(9 * 60 * 1000); ok(e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY }).duplicate === true, '9 分鐘內重送 → 仍命中');
e.adv(2 * 60 * 1000); ok(e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY }).duplicate === undefined && e.calls.save === 2, '超過 10 分鐘 → 快取過期，視為新操作');
e = env(); e.ctx.saveEvent = (d, pw) => { e.calls.save++; return { success: true, blob: 'x'.repeat(95000) }; };
const big1 = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY }); const big2 = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
ok(big1.success && big1.blob.length === 95000 && e.calls.save === 2, '結果超過 90KB：仍正常回傳給呼叫端，但不快取（避免超過 Cache 單筆 100KB 上限而拋錯）');

console.log('I. 與互斥鎖、上傳區塊的互動');
e = env(); e.ctx.__busy = true;
const busy = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
ok(busy.success === false && /忙碌/.test(busy.error) && e.calls.save === 0, '鎖忙碌 → 回忙碌訊息，不執行，也不會把「忙碌」記成已處理');
e.ctx.__busy = false;
const afterBusy = e.post('saveEvent', { data: {}, password: e.token, idempotencyKey: KEY });
ok(afterBusy.success && !afterBusy.duplicate && e.calls.save === 1, '鎖恢復後同一個編號可正常執行一次');
e = env(); const c1 = e.post('uploadPhotosChunk', { albumId: 'A', files: [1, 2, 3], password: e.token, idempotencyKey: 'chunk_000000000000000001' });
const c1retry = e.post('uploadPhotosChunk', { albumId: 'A', files: [1, 2, 3], password: e.token, idempotencyKey: 'chunk_000000000000000001' });
const c2 = e.post('uploadPhotosChunk', { albumId: 'A', files: [4, 5, 6], password: e.token, idempotencyKey: 'chunk_000000000000000002' });
ok(c1.saved === 3 && c1retry.duplicate && c2.saved === 3 && e.calls.upload === 2, '相簿上傳：同一區塊重試不會重複儲存，下一個區塊（不同編號）正常儲存');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
