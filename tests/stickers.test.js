// 圖示改用自己畫的「柔和貼紙」SVG（2026-10-23 第 1 批：導覽列與行事曆圖例）。
// 網頁原本用 Emoji，每台手機長得不一樣、顏色也不跟網站色系；使用者選了 B 柔和貼紙風格，分批替換。
// 這裡確認：① 圖示庫只有一份（建置時與瀏覽器端相同）、SVG 結構完整；② 第 1 批的位置都換成 SVG、不再有對應的 Emoji；
// ③ 小尺寸會隱藏細節線條；④ 行事曆判斷邏輯（calendarDayIcons）不變，只有顯示方式改變。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'build_index.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function grab(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); const j = html.indexOf('\n    }\n', i); return html.slice(i, j + 6); }
const BATCH1 = ['home', 'books', 'target', 'bag', 'photo', 'song', 'folder', 'set', 'dots', 'heart', 'meal', 'chef', 'cake'];

console.log('A. 圖示庫');
const m = /const STICKER_SVG = (\{[^\n]*\});/.exec(html);
ok(!!m, '瀏覽器端有 STICKER_SVG 圖示庫');
const LIB = m ? JSON.parse(m[1]) : {};
ok(BATCH1.every(k => typeof LIB[k] === 'string' && LIB[k].length > 20), '第 1 批 13 個圖示都在：' + BATCH1.join('、'));
const buildLib = (() => { const box = {}; const i = src.indexOf('const STICKERS = {'); const j = src.indexOf('\n};\n', i); new Function('box', src.slice(i, j + 3) + '\nbox.lib = STICKERS;')(box); return box.lib; })();
ok(JSON.stringify(buildLib) === JSON.stringify(LIB), '建置時與瀏覽器端用同一份圖示庫（只畫一次）');
Object.keys(LIB).forEach(k => {
  const s = LIB[k];
  const opens = (s.match(/<g\b/g) || []).length, closes = (s.match(/<\/g>/g) || []).length;
  const tags = s.match(/<[^>]+>/g) || [];
  const bad = tags.filter(t => !/^<\/g>$/.test(t) && !/^<g\b[^>]*>$/.test(t) && !/^<(path|rect|circle|ellipse)\b[^>]*\/>$/.test(t));
  ok(opens === closes && bad.length === 0 && !/script|on[a-z]+=|href|url\(/i.test(s), k + '：只含 path／rect／circle／g，標籤都有關閉，沒有腳本或外部連結');
});
var STICKER_SVG = LIB;
eval(grab('esc')); eval(grab('stickerSvg')); eval(grab('calIconHtml'));
const svg = stickerSvg('home', 'sticker-sm w-5 h-5');
ok(/^<svg class="sticker sticker-sm w-5 h-5" viewBox="0 0 24 24"[^>]*aria-hidden="true"[^>]*focusable="false"[^>]*>/.test(svg) && svg.endsWith('</svg>') && svg.indexOf(LIB.home) > 0, 'stickerSvg：輸出 24×24 SVG，aria-hidden（旁邊有文字標籤），帶指定的 class');
ok(stickerSvg('不存在', 'x') === '', '不存在的圖示名稱：輸出空字串（不會壞掉版面）');
ok(/\.sticker-sm\s+\.d\s*\{\s*display:\s*none/.test(html) && /\.sticker-sm\s*\{[^}]*stroke-width:\s*1\.9/.test(html), '小尺寸（sticker-sm）隱藏細節線條、外框加粗');

console.log('B. 側邊欄 8 個頁籤');
['home', 'themes', 'tasks', 'transition', 'albums', 'songs', 'docs', 'admin'].forEach((tab, i) => {
  const a = html.indexOf('id="tabBtn-' + tab + '"'), b = html.indexOf('</button>', a);
  const btn = html.slice(a, b);
  const key = ['home', 'books', 'target', 'bag', 'photo', 'song', 'folder', 'set'][i];
  ok(a > 0 && btn.indexOf('<svg class="sticker sticker-sm') > 0 && btn.indexOf(LIB[key]) > 0 && !/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(btn), tab + '：用「' + key + '」圖示，沒有 Emoji');
});

console.log('C. 手機底部導覽列與「更多」');
const meta = /const NAV_TAB_META = \{([\s\S]*?)\};/.exec(html);
ok(!!meta && ['home:home', 'themes:books', 'tasks:target', 'transition:bag', 'albums:photo', 'songs:song', 'docs:folder'].every(p => { const [t, k] = p.split(':'); return new RegExp(t + ": \\{[^}]*sticker: '" + k + "'").test(meta[1]); }), 'NAV_TAB_META：7 個頁面都對應到圖示');
ok(/icon: '🏠'/.test(meta ? meta[1] : ''), 'NAV_TAB_META 保留 Emoji（後台下拉選單的選項文字還在用，第 3 批再換）');
const nb = grab('navBtn'), mm = html.slice(html.indexOf('    function openMobileMore('), html.indexOf('    function closeMobileMore('));
ok(/iconNode\(/.test(nb) && !/textContent = icon/.test(nb), 'navBtn：圖示用 iconNode 建立（SVG），不再是文字');
ok(/navBtn\(NAV_TAB_META\[k\]\.sticker/.test(html) && /navBtn\('dots', t\('nav\.more'\)/.test(html), '底部導覽列：頁面用 sticker，「更多」用 dots');
ok(/tile\(NAV_TAB_META\[k\]\.sticker/.test(mm) && /tile\('set', t\('nav\.admin'\)/.test(mm) && /tile\('🔠'/.test(mm) && /tile\('🌐'/.test(mm), '「更多」選單：頁面與管理後台用圖示；大字、English 不在第 1 批，維持原樣');
eval(grab('iconNode'));
const fakeDoc = { createElement: () => ({ className: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ''; }, textContent: '' }) };
const n1 = (function (document) { return eval('(' + grab('iconNode').trim().replace(/^function iconNode/, 'function') + ')')('home', 'w-6 h-6'); })(fakeDoc);
const n2 = (function (document) { return eval('(' + grab('iconNode').trim().replace(/^function iconNode/, 'function') + ')')('🔠', 'w-6 h-6'); })(fakeDoc);
ok(/<svg class="sticker sticker-sm w-6 h-6"/.test(n1.innerHTML) && n1.attrs['aria-hidden'] === 'true', 'iconNode：圖示名稱 → SVG（小尺寸版）');
ok(n2.innerHTML === '' && n2.textContent === '🔠', 'iconNode：不是圖示名稱（例如 🔠）→ 照舊當文字顯示');

console.log('D. 行事曆圖例、日曆格子、今日卡片');
const lg = html.slice(html.indexOf('<!-- 圖例說明 -->'), html.indexOf('<!-- 3. 【連動區段】'));
ok(['heart', 'meal', 'chef', 'cake'].every(k => lg.indexOf(LIB[k]) > 0) && !/❤️|🍱|🥐|🎂/.test(lg), '圖例：諾貝爾 A 班、餐點、幸福廚房、慶生改用圖示');
ok(/calIcons\.map\(ic => calIconHtml\(ic, 'w-4 h-4'\)\)/.test(html), '日曆格子：圖示經 calIconHtml 顯示');
ok(/badgesHtml \+= '<span class="inline-flex leading-none select-none" title="' \+ esc\(t\('ui\.calDotNobel'\)\) \+ '">' \+ stickerSvg\('heart', 'sticker-sm w-3 h-3'\) \+ '<\/span>'/.test(html), '日曆格子：諾貝爾 A 班的愛心改用圖示（保留滑過說明）');
ok(calIconHtml('🍱', 'w-4 h-4').indexOf(LIB.meal) > 0 && calIconHtml('🥐', 'w-4 h-4').indexOf(LIB.chef) > 0 && calIconHtml('🎂', 'w-4 h-4').indexOf(LIB.cake) > 0, 'calIconHtml：🍱→餐點、🥐→廚師帽、🎂→蛋糕');
ok(calIconHtml('🥮', 'w-4 h-4') === '<span>🥮</span>' && calIconHtml('<img src=x onerror=alert(1)>', 'w-4 h-4').indexOf('<img') < 0, 'calIconHtml：其他圖示（節慶，第 4 批再換）照舊顯示文字，而且會跳脫');
ok(/calendarDayIcons\(dayEvents, dayMenu, offDay\)\.filter\(function\(ic\) \{ return ic !== '🍱'; \}\)/.test(html) && /b\.innerHTML = calIconHtml\(ic, 'w-4 h-4'\) \+ ' ' \+ esc\(t\(ic === '🥐'/.test(html), '今日卡片的「幸福廚房／慶生」小標籤也用圖示');
const cd = grab('calendarDayIcons');
ok(/icons\.push\('🍱'\)/.test(cd) && /icons\.push\('🥐'\)/.test(cd) && /icons\.push\('🎂'\)/.test(cd), 'calendarDayIcons 的判斷邏輯不變（仍回傳 🍱／🥐／🎂 代號，只有顯示改變）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
