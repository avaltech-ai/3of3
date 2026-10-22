// 管理員登入的「裝置金鑰」前端（紅隊檢查 M-2，2026-10-23）：登入時帶上這台裝置的金鑰、成功後保存後端發的金鑰、登出不清除、
// 不合法的金鑰不保存、GAS 內嵌環境也會傳。直接從 index.html 取出函式，以最小的假 DOM／儲存空間執行（不需要瀏覽器）。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function grab(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); const j = html.indexOf('\n    }\n', i); return html.slice(i, j + 6); }
function grabLine(startsWith) { const i = html.indexOf(startsWith); if (i < 0) throw new Error('找不到 ' + startsWith); return html.slice(i, html.indexOf('\n', i)); }

const mkStore = (broken) => { const m = {}; return { getItem: k => { if (broken) throw new Error('blocked'); return k in m ? m[k] : null; }, setItem: (k, v) => { if (broken) throw new Error('blocked'); m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; };
function build(opts) {
  opts = opts || {};
  const ctx = { localStorage: mkStore(opts.brokenStorage), sessionStorage: mkStore(false), state: { adminPassword: '' }, calls: [], toasts: [], box: { reply: null } };
  const input = { value: '' };
  ctx.document = { getElementById: id => id === 'adminPasswordInput' ? input : { classList: { add() {}, remove() {} } } };
  ctx.input = input;
  const code = [grabLine('    var ADMIN_TOKEN_KEY'), grab('readStoredToken'), grabLine('    var ADMIN_DEVICE_KEY'), grab('readDeviceKey'), grab('saveDeviceKey'), grab('doAdminLogin'), grab('clearAdminSession')].join('\n') + `
    var showToast = m => toasts.push(String(m)); var showAdminDashboard = () => {}; var renderDocsList = () => {}; var resetAdminSongInfo = () => {}; var updateAdminAuthUI = () => {};
    var callBackend = (a, p, okCb, errCb) => { calls.push({ a: a, p: p }); if (a === 'verifyPassword') { if (box.reply === 'netfail') errCb(new Error('x')); else okCb(box.reply); } };
    return { doAdminLogin, clearAdminSession, readDeviceKey, saveDeviceKey };`;
  const fn = new Function(...Object.keys(ctx), code);
  return Object.assign(ctx, fn(...Object.values(ctx)));
}
const KEY = 'nobel_a_device_key', K1 = 'k'.repeat(64), K2 = 'm'.repeat(64);
const login = (c, pwd) => { c.input.value = pwd; c.calls.length = 0; c.doAdminLogin(); };

let c = build();
c.box.reply = { success: true, token: 't'.repeat(64), deviceKey: K1 }; login(c, 'pw-1');
ok(c.calls[0].a === 'verifyPassword' && c.calls[0].p.password === 'pw-1' && c.calls[0].p.deviceKey === '', '第一次登入：送出密碼，裝置金鑰是空的');
ok(c.localStorage.getItem(KEY) === K1 && c.state.adminPassword === 't'.repeat(64), '登入成功：把後端發的裝置金鑰存進 localStorage，並保存 token');
c.clearAdminSession(); login(c, 'pw-2');
ok(c.calls[0].p.deviceKey === K1, '之後登入：帶上這台裝置的金鑰');
ok(c.localStorage.getItem(KEY) === K1 && c.state.adminPassword !== '' , '（登入成功後）');
c.clearAdminSession(); ok(c.localStorage.getItem(KEY) === K1 && c.state.adminPassword === '', '登出（清除登入狀態）：token 清掉，裝置金鑰保留');
c.box.reply = { success: true, token: 't'.repeat(64), deviceKey: K2 }; login(c, 'pw-3'); ok(c.localStorage.getItem(KEY) === K2, '後端換發新金鑰（例如換過密碼）：更新成新的');
c.clearAdminSession(); c.box.reply = { success: false, locked: true, error: '嘗試次數過多' }; login(c, 'wrong');
ok(c.localStorage.getItem(KEY) === K2 && c.state.adminPassword === '' && c.toasts.some(t => /嘗試次數過多/.test(t)), '被鎖定：不改動裝置金鑰、不登入、顯示原因');
ok(c.calls[0].p.deviceKey === K2, '鎖定中仍帶著裝置金鑰送出（讓後端判斷這台是不是受信任裝置）');
[undefined, null, '', 123, {}, [], 'short', 'x'.repeat(300), true].forEach(v => { c.clearAdminSession(); c.box.reply = { success: true, token: 't'.repeat(64), deviceKey: v }; login(c, 'pw'); ok(c.localStorage.getItem(KEY) === K2, '後端回傳不合法的金鑰（' + JSON.stringify(v === undefined ? 'undefined' : v).slice(0, 14) + '）：不覆蓋原本的'); });
ok(!c.toasts.some(t => t.indexOf(K1) >= 0 || t.indexOf(K2) >= 0), '裝置金鑰不會出現在任何提示訊息裡');
c.clearAdminSession(); c.box.reply = 'netfail'; login(c, 'pw'); ok(c.localStorage.getItem(KEY) === K2 && /無法連線/.test(c.toasts[c.toasts.length - 1]), '連線失敗：提示，不動裝置金鑰');
c = build({ brokenStorage: true }); c.box.reply = { success: true, token: 't'.repeat(64), deviceKey: K1 };
let threw = false; try { login(c, 'pw'); } catch (e) { threw = true; }
ok(!threw && c.state.adminPassword === 't'.repeat(64) && c.calls[0].p.deviceKey === '', '瀏覽器擋掉 localStorage（隱私模式）：不拋錯，照常登入（只是沒有裝置金鑰）');
ok(/runner\.verifyPassword\(payload\.password, payload\.deviceKey\)/.test(html), 'GAS 內嵌環境（google.script.run）也會傳裝置金鑰');
console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
