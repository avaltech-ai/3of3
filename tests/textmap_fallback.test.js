// 英文介面：沒有活動時「本期學期主題」的預設名稱也要走英文對照（2026-10-23，使用者回報）。
// 原本只有「活動自己帶的 theme 欄位」會經過 tx()，預設文字 '主題活動：人與自己／人與他人概念' 沒有，
// 所以英文介面（前綴已是 Semester Theme:）後面卻還是中文，而英文對照表裡其實有這一筆翻譯。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

console.log('A. 主題名稱的兩條路徑都要翻譯');
const i = html.indexOf("const themeText = ");
const line = html.slice(i, html.indexOf('\n', i));
ok(i > 0 && /tx\(firstEvent\.theme\)/.test(line), '有活動且帶 theme：翻譯活動的 theme（原本就有）');
ok(/: tx\('主題活動：人與自己／人與他人概念'\);/.test(line), '沒有活動或活動沒有 theme：預設名稱也走 tx()（本次修正）');
ok(/document\.getElementById\('themeNameText'\)\.textContent = themeText;/.test(html), '結果寫入 #themeNameText');

console.log('B. 行為：用真的 tx() 與對照表驗證');
function grab(name) { const a = html.indexOf('    function ' + name + '('); if (a < 0) throw new Error('找不到 ' + name); const b = html.indexOf('\n    }\n', a); return html.slice(a, b + 6); }
const state = { lang: 'en', textMap: { '主題活動：人與自己／人與他人概念': 'Themed Activity: Concepts of Self and Others' } };
eval(grab('textKey')); eval(grab('tx'));
const theme = (firstEvent) => (firstEvent && firstEvent.theme) ? tx(firstEvent.theme) : tx('主題活動：人與自己／人與他人概念');
ok(theme(undefined) === 'Themed Activity: Concepts of Self and Others', '英文、沒有活動：顯示英文名稱');
ok(theme({}) === 'Themed Activity: Concepts of Self and Others', '英文、活動沒有 theme：顯示英文名稱');
ok(theme({ theme: '主題活動：人與自己／人與他人概念' }) === 'Themed Activity: Concepts of Self and Others', '英文、活動有 theme：顯示英文名稱');
state.lang = 'zh-TW';
ok(theme(undefined) === '主題活動：人與自己／人與他人概念', '中文：維持中文（不被翻譯）');
state.lang = 'en'; state.textMap = {};
ok(theme(undefined) === '主題活動：人與自己／人與他人概念', '英文但對照表沒有這筆：退回中文（與其他文字一致，不會空白）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
