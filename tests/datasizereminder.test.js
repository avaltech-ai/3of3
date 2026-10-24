// 後台「待辦提醒」：公開資料太大時提醒（2026-10-24）。
// 公開資料 getAppData 會隨學期累積（菜單、活動、主題）。雲端快取壓縮後約可放 210 KB 的原始資料，超過後快取失效、載入會變慢（7～12 秒）。
// 在還有餘裕（約 70%，150 KB）時就提醒，老師／工程人員有時間處理，不用等到變慢才發現。
// 這裡確認：① 門檻判斷；② 資料大小怎麼量（UTF-8 位元組，中文算 3）；③ 提醒接進待辦清單，沒有按鈕也能顯示；④ 載入資料時有記下大小。
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL: ' + m); } };
function fn(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) return ''; return html.slice(i, html.indexOf('\n    }\n', i) + 6); }

const warnLine = (/^ {4}const APP_DATA_WARN_BYTES = (\d+);/m.exec(html) || [])[1];
ok(warnLine === '150000', '門檻是 150000 位元組（約快取容量 210 KB 的 70%）');
const ctx = {}; vm.createContext(ctx);
vm.runInContext('const APP_DATA_WARN_BYTES = ' + (warnLine || 0) + ';\n' + fn('jsonUtf8Bytes') + '\n' + fn('appDataSizeReminder'), ctx);

console.log('A. 資料大小：UTF-8 位元組');
ok(typeof ctx.jsonUtf8Bytes === 'function' && ctx.jsonUtf8Bytes({ a: 'abc' }) === Buffer.byteLength(JSON.stringify({ a: 'abc' })), '英文：與實際位元組數相同');
const zh = { t: '諾貝爾 A 班🍄', n: [1, 2, 3] };
ok(typeof ctx.jsonUtf8Bytes === 'function' && ctx.jsonUtf8Bytes(zh) === Buffer.byteLength(JSON.stringify(zh), 'utf8'), '中文與 Emoji：與實際位元組數相同（中文 3 位元組、Emoji 4 位元組）');
ok(typeof ctx.jsonUtf8Bytes === 'function' && ctx.jsonUtf8Bytes(null) === 4 && ctx.jsonUtf8Bytes(undefined) === 0, 'null 是 4（"null"）、undefined 是 0，不會出錯');
const circ = {}; circ.self = circ;
ok(typeof ctx.jsonUtf8Bytes === 'function' && ctx.jsonUtf8Bytes(circ) === 0, '無法轉成文字（循環參照）：回傳 0，不拋錯');

console.log('B. 提醒內容');
const f = ctx.appDataSizeReminder;
ok(typeof f === 'function' && f(0) === null && f(85738) === null && f(149999) === null && f(undefined) === null && f(NaN) === null, '低於門檻、沒有量到（0、undefined、NaN）：不提醒');
const it = typeof f === 'function' ? f(150000) : null;
ok(!!it && it.kind === 'dataSize' && /150 KB/.test(it.text) && /210 KB/.test(it.text), '達到門檻：提醒，文字有目前大小（150 KB）與估計上限（210 KB）');
const it2 = typeof f === 'function' ? f(212345) : null;
ok(!!it2 && /212 KB/.test(it2.text), '大小四捨五入到 KB（212345 → 212 KB）');
ok(!!it && !it.action, '這則提醒沒有「前往」按鈕（資料整理不在後台某個頁籤，要請工程人員處理）');
ok(!!it && /工程/.test(it.text), '提醒文字說明該找誰處理');

console.log('C. 接進待辦清單與載入流程');
const air = fn('adminReminderItems'), rar = fn('renderAdminReminders');
ok(/appDataSizeReminder\(ctx\.dataBytes\)/.test(air), 'adminReminderItems 加入資料量提醒（用 ctx.dataBytes）');
ok(/dataBytes:\s*state\.appDataBytes/.test(rar), 'renderAdminReminders 把 state.appDataBytes 傳進去');
ok(/if \(it\.action\) \{/.test(rar) || /if \(it\.action\)/.test(rar), '提醒沒有 action 時不建立按鈕（其他提醒不受影響）');
ok(/state\.appDataBytes = jsonUtf8Bytes\(data\)/.test(fn('handleDataLoaded')), 'handleDataLoaded：每次載入資料（含手機裡的快取）都記下大小');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
