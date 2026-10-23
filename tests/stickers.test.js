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
const BATCH2 = ['sparkle', 'clock', 'cal', 'clipboard', 'calMonth', 'calSub', 'star', 'sprout', 'grain', 'fish', 'broccoli', 'apple', 'bookOpen', 'school', 'together', 'broom', 'speech', 'jump', 'puzzle', 'magnifier', 'hearts', 'globe', 'bell', 'bulb', 'pin'];
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
var EMOJI_STICKER = JSON.parse(/const EMOJI_STICKER = (\{[^\n]*\});/.exec(html)[1].replace(/'/g, '"'));
eval(grab('esc')); eval(grab('stickerSvg')); eval(grab('emojiIconHtml'));
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
ok(/calIcons\.map\(ic => emojiIconHtml\(ic, 'w-4 h-4'\)\)/.test(html), '日曆格子：圖示經 emojiIconHtml 顯示');
ok(/badgesHtml \+= '<span class="inline-flex leading-none select-none" title="' \+ esc\(t\('ui\.calDotNobel'\)\) \+ '">' \+ stickerSvg\('heart', 'sticker-sm w-3 h-3'\) \+ '<\/span>'/.test(html), '日曆格子：諾貝爾 A 班的愛心改用圖示（保留滑過說明）');
ok(emojiIconHtml('🍱', 'w-4 h-4').indexOf(LIB.meal) > 0 && emojiIconHtml('🥐', 'w-4 h-4').indexOf(LIB.chef) > 0 && emojiIconHtml('🎂', 'w-4 h-4').indexOf(LIB.cake) > 0, 'emojiIconHtml：🍱→餐點、🥐→廚師帽、🎂→蛋糕');
ok(emojiIconHtml('🥮', 'w-4 h-4') === '<span>🥮</span>' && emojiIconHtml('<img src=x onerror=alert(1)>', 'w-4 h-4').indexOf('<img') < 0, 'emojiIconHtml：其他圖示（節慶，第 4 批再換）照舊顯示文字，而且會跳脫');
ok(/calendarDayIcons\(dayEvents, dayMenu, offDay\)\.filter\(function\(ic\) \{ return ic !== '🍱'; \}\)/.test(html) && /b\.innerHTML = emojiIconHtml\(ic, 'w-4 h-4'\) \+ ' ' \+ esc\(t\(ic === '🥐'/.test(html), '今日卡片的「幸福廚房／慶生」小標籤也用圖示');
const cd = grab('calendarDayIcons');
ok(/icons\.push\('🍱'\)/.test(cd) && /icons\.push\('🥐'\)/.test(cd) && /icons\.push\('🎂'\)/.test(cd), 'calendarDayIcons 的判斷邏輯不變（仍回傳 🍱／🥐／🎂 代號，只有顯示改變）');

console.log('E. 第 2 批：圖示庫（25 個新圖示）');
ok(BATCH2.every(k => typeof LIB[k] === 'string' && LIB[k].length > 20), '第 2 批 25 個圖示都在庫裡');
ok(Object.keys(LIB).length === BATCH1.length + BATCH2.length, '圖示庫總數 = 第 1 批 13 ＋ 第 2 批 25（' + Object.keys(LIB).length + '）');
const MAPN = { '🍱': 'meal', '🥐': 'chef', '🎂': 'cake', '🏫': 'school', '🏡': 'home', '🤝': 'together', '🧹': 'broom', '⏰': 'clock', '💬': 'speech', '🤸': 'jump', '🧩': 'puzzle', '🔍': 'magnifier', '💞': 'hearts', '🌏': 'globe' };
Object.keys(MAPN).forEach(e => ok(emojiIconHtml(e, 'w-4 h-4').indexOf(LIB[MAPN[e]]) > 0, 'emojiIconHtml：' + e + ' → ' + MAPN[e]));

console.log('F. 第 2 批：靜態頁面（沒有 Emoji）');
const before = (key, n) => { const i = html.indexOf(key); return i < 0 ? '' : html.slice(Math.max(0, i - (n || 260)), i); };
const EMO = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u;
[['data-i18n="cal.spotlightTag"', 'sparkle'], ['data-i18n="ui.spotHistBtn"', 'clock'], ['data-i18n="cal.dayView"', 'cal'], ['data-i18n="cal.weekView"', 'clipboard'], ['data-i18n="cal.monthView"', 'calMonth'], ['data-i18n="cal.subscribeBtn"', 'calSub'], ['data-i18n="cal.weekOverviewTitle"', 'clipboard'], ['id="monthViewTitle"', 'calMonth'], ['data-i18n="cal.todayEventsTitle"', 'cal'], ['id="themeNameText"', 'sprout']].forEach(([k, key]) => {
  const b = before(k, 1800); const lastSvg = b.lastIndexOf('<svg'); const seg = lastSvg >= 0 ? b.slice(lastSvg) : '';
  ok(seg.indexOf(LIB[key]) > 0 && !EMO.test(b.slice(Math.max(0, b.length - 260))), k + '：前面是「' + key + '」圖示，沒有 Emoji');
});
[['cal.nutriGrain', 'grain', '🌾'], ['cal.nutriProtein', 'fish', '🥩'], ['cal.nutriVeg', 'broccoli', '🥦'], ['cal.nutriFruit', 'apple', '🍎']].forEach(([k, key, e]) => {
  const i = html.indexOf('data-i18n="' + k + '"'), seg = html.slice(i, html.indexOf('</span>', html.indexOf('</svg>', i)) + 7);
  ok(i > 0 && seg.indexOf(LIB[key]) > 0 && seg.indexOf(e) < 0, '營養分類標籤 ' + k + '：用「' + key + '」圖示，沒有 ' + e);
});
['linkedSubtitle'].forEach(k => { const i = html.indexOf('data-i18n="ui.' + k + '"'); ok(html.slice(i - 400, i).indexOf(LIB.star) > 0, '連動區標題：用 star 圖示'); });
const lm = html.indexOf('id="linkedContentSection"');
ok(html.indexOf(LIB.meal, html.indexOf('data-i18n="cal.todayEventsTitle"')) > 0, '當日菜單小標題：用 meal 圖示');
[['tabContent-albums', 'photo'], ['tabContent-songs', 'song'], ['tabContent-themes', 'books'], ['tabContent-tasks', 'target'], ['tabContent-transition', 'bag'], ['tabContent-docs', 'folder']].forEach(([id, key]) => {
  const a = html.indexOf('id="' + id + '"'), seg = html.slice(a, a + 1500);
  ok(a > 0 && seg.indexOf(LIB[key]) > 0 && !/<span class="(text-2xl|text-rose-500)">[\u{1F300}-\u{1FAFF}]/u.test(seg), id + ' 頁面標題：用「' + key + '」圖示');
});
ok(/id="trViewBtn-plan"[^>]*>[\s\S]{0,300}?<svg/.test(html) && /id="trViewBtn-article"[^>]*>[\s\S]{0,300}?<svg/.test(html), '幼小銜接「銜接計畫／為什麼重要」切換鈕用圖示');
const emptyBig = html.match(/<div class="mb-3 opacity-50 grayscale[^>]*>\s*<svg/g) || [];
ok(emptyBig.length >= 4, '四個空白提示（主題、任務、銜接、文章）的大圖示改成貼紙（' + emptyBig.length + ' 個）');

console.log('G. 第 2 批：動態產生的地方');
const trk = /const TR_KIND_META = \{([\s\S]*?)\n    \};/.exec(html);
ok(!!trk && /在園[^\n]*sticker: 'school'/.test(trk[1]) && /在家[^\n]*sticker: 'home'/.test(trk[1]) && /一起[^\n]*sticker: 'together'/.test(trk[1]), 'TR_KIND_META：在園／在家／一起對應 school／home／together');
const trc = /const TR_CATEGORY_STYLE = \{([\s\S]*?)\n    \};/.exec(html);
const cats = { '生活自理能力': 'broom', '規律生活': 'clock', '語文能力': 'speech', '大小肌肉能力': 'jump', '視覺動作整合能力': 'puzzle', '專注力能力': 'magnifier', '人際互動情緒管理': 'hearts', '社會能力': 'globe' };
ok(!!trc && Object.keys(cats).every(c => new RegExp("'" + c + "': \\{[^}]*sticker: '" + cats[c] + "'").test(trc[1])), 'TR_CATEGORY_STYLE：8 個能力分類各有圖示（' + Object.values(cats).join('、') + '）');
ok(/function trCategoryStyle\(cat\) \{ return TR_CATEGORY_STYLE\[cat\] \|\| \{ icon: '🌟', sticker: 'star', tone: 'slate' \}; \}/.test(html), 'trCategoryStyle 預設用 star');
const cr = html.slice(html.indexOf('function renderTransitionPlan'), html.indexOf('function renderTransitionPlan') + 6000);
ok(/ic\.innerHTML = stickerSvg\(st\.sticker/.test(html) && /dot\.innerHTML = stickerSvg\(meta\.sticker/.test(html) && /tag\.innerHTML = stickerSvg\(meta\.sticker/.test(html), '幼小銜接前台：分類圖示、項目圓點、類型標籤都用 stickerSvg');
ok(/tag\.innerHTML = stickerSvg\(meta\.sticker, 'sticker-sm w-4 h-4'\) \+ ' ' \+ esc\(t\(meta\.label\)\)/.test(html), '類型標籤的文字有跳脫（esc）');
ok(/<span aria-hidden="true">' \+ stickerSvg\(g\.sticker, 'sticker-sm w-6 h-6'\) \+ '<\/span>/.test(html) && /key: '班級小任務'[^\n]*sticker: 'school'/.test(html) && /key: '家長配合事項'[^\n]*sticker: 'home'/.test(html), '學期任務群組標題：用 school／home 圖示');
ok(/<h3 class="font-black text-slate-800 text-base sm:text-lg inline-flex items-center gap-1\.5">' \+ stickerSvg\('pin'/.test(html), '主題總覽標題：pin 圖示');
ok(/p\.innerHTML = stickerSvg\('bell', 'sticker-sm w-4 h-4'\) \+ ' ' \+ esc\(tx\(ev\.calendarPrompt\)\)/.test(html), '今日卡片的提示標籤：bell 圖示，文字有跳脫');
ok(/<span aria-hidden="true" class="shrink-0 mt-0\.5">' \+ stickerSvg\('bulb'/.test(html), '銜接文章金句：bulb 圖示');
ok(/\[\['all', 'transition\.filterAll', ''\], \['home', 'transition\.filterHome', 'home'\], \['school', 'transition\.filterSchool', 'school'\]\]/.test(html) && /b\.innerHTML = \(c\[2\] \? stickerSvg\(c\[2\], 'sticker-sm w-4 h-4'\) \+ ' ' : ''\) \+ esc\(t\(c\[1\]\)\)/.test(html), '幼小銜接的篩選按鈕（全部／在家陪伴／在園練習）：圖示用 stickerSvg，文字跳脫');
ok(/filterHome: '在家陪伴'/.test(html) && /filterSchool: '在園練習'/.test(html) && /filterHome: 'At home'/.test(html) && /filterSchool: 'At school'/.test(html) && !/filterHome: '🏡|filterSchool: '🏫/.test(html), '篩選按鈕的中英文字典不再內含 Emoji');
ok(/<h2>' \+ esc\(trCategoryStyle\(cat\)\.icon \+ ' ' \+ tx\(cat\)\)/.test(html), '列印用的銜接計畫（另一個視窗，沒有網站樣式）維持原本的文字 Emoji');
ok(/icon: '🏫'/.test(html) && /icon: '🏡'/.test(html), 'Emoji 欄位（icon）保留給後台列表與列印使用');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
