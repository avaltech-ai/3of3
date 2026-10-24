// 側邊欄展開寬度跟著字級放大（2026-10-24）。
// 使用者回報：開啟「大字」後，展開的側邊欄標題「選單導覽」被截成「選單…」。
// 原因：展開寬度寫死 152px，但大字模式根字級由 19px 變 22px，文字變寬、寬度卻沒變
// （量測：中文大字「選單導覽」需要 66px、只剩 52px）。改用 rem（8.5rem：標準 161.5px、大字 187px），寬度隨字級一起放大。
// 這裡確認：① 不再有寫死的 152px；② 所有該一起改的地方（側邊欄本體、釘選時的佔位、展開／收合／釘選／手機抽屜的程式）寬度一致；
// ③ 建置出來的樣式有這個寬度。實際不截斷由瀏覽器量測（見 tests/README.md 的說明）。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function fn(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); return html.slice(i, html.indexOf('\n    }\n', i) + 6); }
const W = 'w-[8.5rem]';

console.log('A. 不再有寫死的 152px');
ok(!/w-\[152px\]/.test(html), '網頁裡沒有 w-[152px]（含 md: 版本）');

console.log('B. 各處寬度一致（都用 ' + W + '）');
const aside = html.slice(html.indexOf('<aside id="desktopSidebar"'), html.indexOf('>', html.indexOf('<aside id="desktopSidebar"')));
ok(aside.indexOf(' ' + W + ' ') > 0 && aside.indexOf('md:w-12') > 0, '側邊欄本體：手機抽屜寬度用 ' + W + '，電腦版收合時維持 md:w-12（圖示欄）');
const ex = fn('expandSidebar'), co = fn('collapseSidebar'), pin = fn('togglePinSidebar'), mob = fn('toggleMobileSidebar');
ok(ex.indexOf("classList.add('md:" + W + "')") > 0, 'expandSidebar：展開時加上 md:' + W);
ok(co.indexOf("classList.remove('md:" + W + "')") > 0, 'collapseSidebar：收合時移除 md:' + W);
ok(pin.indexOf("wrap.classList.add('" + W + "')") > 0 && pin.indexOf("wrap.classList.remove('" + W + "')") > 0, 'togglePinSidebar：釘選時佔位欄（sidebarWrapper）寬度與側邊欄一致，取消釘選時移除');
ok(mob.indexOf("sidebar.classList.add('" + W + "')") > 0 && mob.indexOf("sidebar.classList.remove('" + W + "')") > 0, 'toggleMobileSidebar：手機抽屜開／關用同一個寬度');
ok(co.indexOf('md:w-12') > 0 && pin.indexOf("wrap.classList.add('w-12')") > 0, '收合寬度（48px 圖示欄 w-12）不變');

console.log('C. 建置出的樣式有這個寬度（單位是 rem，跟著大字放大）');
const css = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>'));
ok(/\.w-\\\[8\\\.5rem\\\]\s*\{\s*width:\s*8\.5rem;?\s*\}/.test(css), '.w-[8.5rem] → width: 8.5rem');
ok(/\.md\\:w-\\\[8\\\.5rem\\\]\s*\{\s*width:\s*8\.5rem;?\s*\}/.test(css), '.md:w-[8.5rem] → width: 8.5rem（在 md 斷點內）');
ok(/html\.big-text|data-big-text|font-size:\s*22px/.test(html), '大字模式會把根字級放大（rem 寬度才會跟著變）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
