// 焦點活動內容裡【標題】前面的圖示（2026-10-27）。
// 使用者回報：每個【】前面的圖示是固定的（牙齒、聽診器、禮物），但活動不一定跟牙齒有關（例如戶外踏訪的「活動日期」前面也是牙齒），
// 看起來與內容不符。決定：圖示只留在「重要／注意」類的警示（⚠️），其他標題不放圖示；顏色分組維持不變。
// 這裡確認：① 警示類標題仍有 ⚠️ 且整列橫跨兩欄；② 其他標題（含戶外踏訪的活動日期／時間／地點／內容）前面沒有任何圖示；
// ③ 標題文字「【…】」與內容不變；④ 範例卡片（靜態 HTML）也沒有牙齒／聽診器；⑤ 沒有標題的一般行維持原樣（✨）。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function fn(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); return html.slice(i, html.indexOf('\n    }\n', i) + 6); }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function run(text) {
  const kids = [];
  const container = { innerHTML: '', appendChild(k) { kids.push(k); } };
  const document = { getElementById: () => container, createElement: () => ({ className: '', innerHTML: '' }) };
  new Function('esc', 'document', fn('renderSpotlightPoints') + '\nrenderSpotlightPoints(' + JSON.stringify(text) + ', null);')(esc, document);
  return kids;
}
const ICON = /<span>[^<]*<\/span> 【/;

console.log('A. 警示類標題保留 ⚠️');
const warn = run('【注意事項】請家長務必幫寶貝攜帶「健保卡」');
ok(warn.length === 1 && /<span>⚠️<\/span> 【注意事項】/.test(warn[0].innerHTML), '「注意事項」：⚠️ 還在');
ok(/col-span-1 sm:col-span-2/.test(warn[0].className) && /border-amber-200/.test(warn[0].className), '警示列仍橫跨兩欄、琥珀色');
ok(/<span>⚠️<\/span> 【重要注意事項】/.test(run('【重要注意事項】帶水壺')[0].innerHTML), '「重要注意事項」：⚠️ 還在');
ok(/<span>⚠️<\/span> 【帶健保卡】/.test(run('【帶健保卡】請攜帶')[0].innerHTML), '標題含「卡」也算警示（原本的判斷不變）');

console.log('B. 其他標題沒有圖示（戶外踏訪、塗氟日的各種標題）');
['衛教宣導', '塗氟檢查', '活動日期', '活動時間', '活動地點', '活動內容', '活動尾聲', '禮物時間', '集合方式'].forEach(tag => {
  const k = run('【' + tag + '】內容')[0];
  ok(!ICON.test(k.innerHTML) && /<div class="[^"]*flex items-center gap-1 mb-0\.5 text-xs">【/.test(k.innerHTML.replace(/<div class="([^"]*)">/, '<div class="$1">')) , '【' + tag + '】前面沒有圖示');
});
const all = run('【衛教宣導】a\n【塗氟檢查】b\n【活動尾聲】c').map(k => k.innerHTML).join('');
ok(!/🦷|🩺|🎁/.test(all), '產生的內容裡沒有 🦷、🩺、🎁');

console.log('C. 標題文字、內容、顏色分組不變');
const t1 = run('【活動地點】新北市立圖書館三峽北大分館')[0];
ok(t1.innerHTML.indexOf('【活動地點】') > 0 && t1.innerHTML.indexOf('新北市立圖書館三峽北大分館') > 0, '標題「【活動地點】」與內容都在');
ok(/text-rose-600/.test(t1.innerHTML) && /border-rose-100/.test(t1.className), '一般標題：玫瑰色（不變）');
ok(/text-teal-700/.test(run('【活動時間】09:20')[0].innerHTML) && /border-teal-100/.test(run('【塗氟檢查】x')[0].className), '含「時間／檢查」：青綠色（不變）');
ok(/text-indigo-700/.test(run('【活動尾聲】x')[0].innerHTML), '含「尾聲」：靛藍色（不變）');
ok(esc('<b>') === '&lt;b&gt;' && run('【標題】<b>x</b>')[0].innerHTML.indexOf('<b>') < 0, '內容仍會跳脫（不能塞入標籤）');
const plain = run('沒有標題的一行');
ok(plain.length === 1 && /✨/.test(plain[0].innerHTML), '沒有【】的一般行：維持原樣（✨）');

console.log('D. 範例卡片（頁面裡原本寫死的 HTML）');
const a = html.indexOf('<div id="spotlightPoints"'), b = html.indexOf('<!-- 輪播圓點指示器 -->');
const sample = html.slice(a, b);
ok(a > 0 && b > a && !/🦷|🩺/.test(sample), '範例卡片沒有牙齒、聽診器');
ok(/<span>⚠️<\/span> 【重要注意事項】/.test(sample.replace(/\s+/g, ' ')), '範例卡片的「重要注意事項」保留 ⚠️');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
