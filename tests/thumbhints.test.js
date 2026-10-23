// 縮圖不再有「滑過去才出現」的提示文字（2026-10-23）：
// 首頁焦點縮圖原本滑過會出現「點擊放大檢視攻略」、相簿縮圖滑過會出現「點擊放大／點擊播放影片」加檔名。
// 焦點縮圖左下角本來就有常駐的「🔍 放大查看」提示，所以拿掉這些浮出的文字。縮圖滑過時輕微放大的效果保留。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'build_index.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

console.log('A. 首頁焦點縮圖：沒有滑過浮出的提示');
ok(html.indexOf('spotlightImgHoverHint') < 0, '沒有 spotlightImgHoverHint 元素，也沒有任何程式引用它');
ok(html.indexOf('點擊放大檢視攻略') < 0 && html.indexOf('Click to enlarge') < 0, '頁面裡沒有「點擊放大檢視攻略」／「Click to enlarge」文字');
ok(html.indexOf('spotlightHoverHint') < 0, '中英文字典都沒有 spotlightHoverHint');
ok(/<img id="spotlightImg"[^>]*onclick="openSpotlightModal\(\)"/.test(html), '焦點縮圖本身仍可點擊開啟放大視窗');
ok(/id="spotlightMediaHint"[^>]*onclick="openSpotlightModal\(\)"[\s\S]{0,200}data-i18n="cal\.spotlightEnlarge"/.test(html), '左下角常駐提示「🔍 放大查看」仍在，也能點');
ok(/<img id="spotlightImg"[^>]*group-hover:scale-105/.test(html), '滑過縮圖的輕微放大效果保留');

console.log('B. 相簿縮圖：沒有滑過浮出的「點擊放大／播放」與檔名');
const i = html.indexOf('photos.forEach((p, idx) => {'), j = html.indexOf("grid.innerHTML = cells.join('')", i);
const cell = html.slice(i, j);
ok(i > 0 && j > i && cell.indexOf('openPhotoViewerByIndex') > 0, '（健全性）取得相簿縮圖的產生程式');
ok(cell.indexOf('group-hover:opacity-100') < 0, '縮圖格子裡沒有「滑過才顯示」的浮層');
ok(cell.indexOf('photoClick') < 0 && html.indexOf('photoClickEnlarge') < 0 && html.indexOf('photoClickPlay') < 0, '沒有「點擊放大／點擊播放影片」文字或字典鍵（中英文）');
ok(cell.indexOf('title=') < 0, '縮圖沒有 title 屬性（不會出現瀏覽器原生的檔名浮動提示）');
ok(!/\$\{esc\(p\.name/.test(cell.replace(/alt="\$\{esc\(p\.name[^}]*\}"/, '')), '檔名只出現在 alt（圖片載入失敗時的替代文字），沒有顯示在畫面上');
ok(cell.indexOf('group-hover:scale-105') > 0, '滑過縮圖的輕微放大效果保留');
ok(/onclick="openPhotoViewerByIndex\(\$\{idx\}\)"/.test(cell) && cell.indexOf('▶') > 0 && cell.indexOf('🎬') > 0, '點擊開啟檢視器、影片的 ▶ 標記與 🎬 底圖都保留');

console.log('C. 整份頁面：滑過浮出的元素只剩側邊欄的釘選按鈕');
const hits = html.split('group-hover:opacity-100').length - 1;
ok(hits === 1 && /id="pinSidebarBtn"[^>]*group-hover:opacity-100/.test(html), '「group-hover:opacity-100」只剩側邊欄釘選按鈕一處（共 ' + hits + ' 處）');
ok(src.indexOf('spotlightImgHoverHint') < 0, 'build_index.js 也沒有殘留');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
