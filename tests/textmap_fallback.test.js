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

console.log('C. 文件頁「多個檔案」清單：檔名在英文介面也走英文對照（使用者要求；2026-10-23）');
const li = html.slice(html.indexOf("getDocFileIconHtml({ fileName: f.name, fileExtension: f.ext }, true)"));
const seg = li.slice(0, li.indexOf("'</a></li>';") + 12);
ok(/wrap-any">' \+ esc\(tx\(f\.name\)\) \+ '<\/div>/.test(seg), '檔名顯示：esc(tx(f.name))（對照表有就顯示英文，沒有就維持原檔名）');
ok(/title="' \+ esc\(\(en \? 'Download ' : '下載 '\) \+ tx\(f\.name\)\) \+ '"/.test(seg) && /aria-label="' \+ esc\(\(en \? 'Download ' : '下載 '\) \+ tx\(f\.name\)\) \+ '"/.test(seg), '下載按鈕的提示與螢幕閱讀器標籤也用同一個名稱');
ok(!/esc\(f\.name\)/.test(seg), '這一段不再直接顯示原始檔名');
ok(/docFiles\.map\(function\(f\) \{ return f\.name; \}/.test(html), '後台的檔案摘要（只有管理員看、中文）維持原檔名，不受影響');
state.lang = 'en'; state.textMap = { '注音學習卡（形狀口訣）v2': 'Mandarin Phonetic Symbols Learning Cards (Shape Mnemonics) v2' };
ok(tx('注音學習卡（形狀口訣）v2') === 'Mandarin Phonetic Symbols Learning Cards (Shape Mnemonics) v2' && tx('沒登記的檔名.pdf') === '沒登記的檔名.pdf', '行為：有對照的檔名顯示英文，沒對照的維持原樣（下載到的檔案名稱不受影響）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
