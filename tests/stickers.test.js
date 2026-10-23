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

console.log('H. 第 3 批：執行時把文字裡的 Emoji 換成圖示（按鈕、表單標題、提示訊息等 150 多處動態文字）');
const BATCH3 = ['add', 'minus', 'save', 'refresh', 'trash', 'pencil', 'folderOpen', 'doc', 'print', 'link', 'lock', 'unlock', 'image', 'play', 'shuffle', 'repeat', 'tag', 'phone', 'door', 'textSize', 'cookie', 'camera'];
ok(BATCH3.every(k => typeof LIB[k] === 'string' && LIB[k].length > 20), '第 3 批 22 個新圖示都在庫裡');
const mt = /const EMOJI_TEXT = (\{[^\n]*\});/.exec(html);
ok(!!mt, '有 EMOJI_TEXT 對照表（文字裡的 Emoji → 圖示名稱）');
var EMOJI_TEXT = mt ? JSON.parse(mt[1].replace(/'/g, '"')) : {};
const WANT = { '➕': 'add', '➖': 'minus', '💾': 'save', '🔄': 'refresh', '🗑': 'trash', '✏': 'pencil', '📂': 'folderOpen', '📄': 'doc', '🖨': 'print', '🔗': 'link', '🔒': 'lock', '🔓': 'unlock', '🖼': 'image', '🎬': 'play', '🔀': 'shuffle', '🔁': 'repeat', '🏷': 'tag', '📱': 'phone', '🚪': 'door', '🔠': 'textSize', '🍪': 'cookie', '📸': 'camera', '🌐': 'globe', '🔍': 'magnifier' };
Object.keys(WANT).forEach(e => ok(EMOJI_TEXT[e] === WANT[e] && !!LIB[WANT[e]], 'EMOJI_TEXT：' + e + ' → ' + WANT[e]));
ok(Object.keys(EMOJI_TEXT).every(e => !!LIB[EMOJI_TEXT[e]]), '對照表裡每個圖示名稱都真的存在');
var STICKER_SVG = LIB;
var EMOJI_TEXT_RE = eval(/const EMOJI_TEXT_RE = (new RegExp\([^\n]*\));/.exec(html)[1]);   // 用頁面裡真正的那一行建立
eval(grab('emojiSplit'));
const sp = t => JSON.stringify(emojiSplit(t));
ok(sp('💾 儲存變更（3）') === JSON.stringify([{ k: 'save' }, { t: ' 儲存變更（3）' }]), 'emojiSplit：開頭的 Emoji → 圖示＋文字');
ok(sp('🗑️ 刪除選取') === JSON.stringify([{ k: 'trash' }, { t: ' 刪除選取' }]) && sp('✏️ 編輯') === JSON.stringify([{ k: 'pencil' }, { t: ' 編輯' }]), 'emojiSplit：帶 U+FE0F 變體選擇符的寫法也認得，且變體符不會殘留');
ok(sp('➕ 新增 ➕') === JSON.stringify([{ k: 'add' }, { t: ' 新增 ' }, { k: 'add' }]), 'emojiSplit：一段文字裡有多個');
ok(emojiSplit('沒有圖示的文字') === null && emojiSplit('✓ 完成 ❮ ❯ ✕') === null && emojiSplit('') === null && emojiSplit(null) === null, 'emojiSplit：沒有對應的 Emoji（文字型符號 ✓ ❮ ❯ ✕）→ null，不改動');
ok(sp('<b>🔒 不開放下載</b>') === JSON.stringify([{ t: '<b>' }, { k: 'lock' }, { t: ' 不開放下載</b>' }]), 'emojiSplit：HTML 符號原樣留在文字裡（之後用文字節點放，不會被當成標籤）');
ok(sp('📸🌐') === JSON.stringify([{ k: 'camera' }, { k: 'globe' }]), 'emojiSplit：連續兩個');

// 用最小的假 DOM 執行真的 stickerizeNode
function FakeNode(type, tag, text) { this.nodeType = type; this.tagName = tag; this.nodeValue = text; this.childNodes = []; this.parentNode = null; this.attrs = {}; this.className = ''; this.innerHTML = ''; }
FakeNode.prototype.getAttribute = function (k) { return k in this.attrs ? this.attrs[k] : null; };
FakeNode.prototype.setAttribute = function (k, v) { this.attrs[k] = v; };
FakeNode.prototype.appendChild = function (n) { n.parentNode = this; this.childNodes.push(n); return n; };
FakeNode.prototype.insertBefore = function (n, ref) { n.parentNode = this; this.childNodes.splice(this.childNodes.indexOf(ref), 0, n); return n; };
FakeNode.prototype.removeChild = function (n) { this.childNodes.splice(this.childNodes.indexOf(n), 1); n.parentNode = null; return n; };
const document = { createElement: t => new FakeNode(1, t.toUpperCase()), createTextNode: t => new FakeNode(3, null, t) };
const el = (tag, kids, attrs) => { const n = new FakeNode(1, tag.toUpperCase()); (kids || []).forEach(k => n.appendChild(typeof k === 'string' ? new FakeNode(3, null, k) : k)); Object.assign(n.attrs, attrs || {}); return n; };
eval(grab('stickerizeText')); eval(grab('stickerizeNode'));
var STICKER_SKIP = JSON.parse(/const STICKER_SKIP = (\{[^\n]*\});/.exec(html)[1].replace(/'/g, '"'));
const dump = n => n.nodeType === 3 ? JSON.stringify(n.nodeValue) : '<' + n.tagName + (n.className ? '.' + n.className : '') + '>' + n.childNodes.map(dump).join('') + '</>';
let root = el('div', [el('button', ['💾 儲存變更']), el('span', ['沒有圖示']), el('p', ['先 ', el('b', ['🔄 重新整理']), ' 後 ➕ 再來'])]);
stickerizeNode(root);
const svgCount = n => (n.className === 'sticker-emoji' ? 1 : 0) + n.childNodes.reduce((a, c) => a + (c.nodeType === 1 ? svgCount(c) : 0), 0);
ok(svgCount(root) === 3, '假 DOM：button、b、p 裡共 3 個 Emoji → 3 個圖示（' + svgCount(root) + '）');
ok(dump(root).indexOf('💾') < 0 && dump(root).indexOf('🔄') < 0 && dump(root).indexOf('➕') < 0 && dump(root).indexOf('"沒有圖示"') > 0 && dump(root).indexOf('" 儲存變更"') > 0 && dump(root).indexOf('" 後 "') > 0, '假 DOM：Emoji 文字消失，其餘文字原樣保留');
const first = root.childNodes[0].childNodes[0];
ok(first.className === 'sticker-emoji' && first.attrs['aria-hidden'] === 'true' && first.innerHTML.indexOf('class="sticker sticker-sm sticker-inline"') > 0 && first.innerHTML.indexOf(LIB.save) > 0, '圖示外面是 aria-hidden 的 span，SVG 用小尺寸（sticker-sm）加隨文字大小的 sticker-inline');
root = el('div', [el('select', [el('option', ['➕ 新增']), el('option', ['🗑 刪除'])]), el('textarea', ['🔒 草稿']), el('script', ['var x="➕"']), el('style', ['a{content:"➕"}']), el('title', ['➕']), el('div', ['➕ 略過'], { 'data-no-sticker': '' }), el('input', [])]);
const snap = dump(root); stickerizeNode(root);
ok(dump(root) === snap, '不會動：select／option、textarea、script、style、title、input，以及標了 data-no-sticker 的區塊');
const tn = new FakeNode(3, null, '🖨 列印'); const opt = el('option', []); opt.appendChild(tn); stickerizeNode(tn);
ok(tn.parentNode === opt && opt.childNodes.length === 1, '單獨傳入文字節點（觀察器的 characterData）：父元素是 option 時不改');
const lone = el('span', []); const tn2 = new FakeNode(3, null, '🖨 列印'); lone.appendChild(tn2); stickerizeNode(tn2);
ok(svgCount(lone) === 1 && lone.childNodes.length === 2, '單獨傳入文字節點：換成圖示＋剩下的文字');
const evil = el('span', ['🔗 <img src=x onerror=alert(1)>']); stickerizeNode(evil);
ok(evil.childNodes.every(c => c.nodeType === 3 || c.className === 'sticker-emoji') && evil.childNodes.some(c => c.nodeType === 3 && c.nodeValue.indexOf('<img') >= 0), '文字裡的 HTML 符號用文字節點放，不會變成標籤（沒有 XSS）');
ok(/\n    startStickerize\(\);\n  <\/script>\n<\/body>/.test(html), '主 script 最後有呼叫 startStickerize()');
ok(/stickerizeNode\(document\.body\)/.test(html) && /new MutationObserver/.test(html) && /observe\(document\.body, \{ childList: true, subtree: true, characterData: true \}\)/.test(html) && /takeRecords\(\)/.test(html), '啟動：先處理整個頁面，再用 MutationObserver 監看新增與改變的文字；處理完用 takeRecords 丟掉自己造成的變動');
ok(/\.sticker-emoji\s*\{[^}]*display:\s*inline-flex/.test(html) && /\.sticker-inline\s*\{[^}]*width:\s*1\.15em[^}]*height:\s*1\.15em/.test(html), 'CSS：sticker-inline 隨文字大小（1.15em）、sticker-emoji 行內對齊');

console.log('I. 第 4 批：提示訊息、人物、節慶、季節、餐點與其他（含沿用前三批的圖示）');
const NEW4 = ['check', 'cross', 'warn', 'hourglass', 'party', 'gift', 'dotGreen', 'dotRed', 'dotYellow', 'dotWhite', 'heartYellow', 'girl', 'boy', 'woman', 'man', 'envelope', 'lantern', 'pinwheel', 'bouquet', 'zongzi', 'tie', 'moon', 'pumpkin', 'tree', 'blossom', 'watermelon', 'maple', 'snowman', 'stew', 'bowl', 'milk', 'curry', 'cakeSlice', 'tooth', 'stethoscope', 'peach', 'mushroom', 'antenna', 'headphones', 'flag', 'robot', 'sad', 'wave', 'key', 'sponge', 'abc', 'traffic', 'dice', 'ruler', 'scale', 'shirt', 'pants', 'teddy', 'loveFace', 'palette', 'runner', 'soap'];
ok(NEW4.every(k => typeof LIB[k] === 'string' && LIB[k].length > 20), '第 4 批 ' + NEW4.length + ' 個新圖示都在庫裡');
ok(Object.keys(LIB).length === BATCH1.length + BATCH2.length + BATCH3.length + NEW4.length, '圖示庫總數 = 13 + 25 + 22 + ' + NEW4.length + ' = ' + (BATCH1.length + BATCH2.length + BATCH3.length + NEW4.length) + '（實際 ' + Object.keys(LIB).length + '）');
const WANT4 = { '✅': 'check', '❌': 'cross', '⚠': 'warn', '⏳': 'hourglass', '🎉': 'party', '🎁': 'gift', '🟢': 'dotGreen', '🔴': 'dotRed', '🟡': 'dotYellow', '⚪': 'dotWhite', '💛': 'heartYellow', '👧': 'girl', '👦': 'boy', '👩': 'woman', '👨': 'man', '👨‍👩‍👧': 'together', '❤': 'heart',
  '🧧': 'envelope', '🏮': 'lantern', '🎈': 'pinwheel', '💐': 'bouquet', '🐲': 'zongzi', '👔': 'tie', '🥮': 'moon', '🎃': 'pumpkin', '🎄': 'tree', '🌸': 'blossom', '🍉': 'watermelon', '🍁': 'maple', '⛄': 'snowman',
  '🍲': 'stew', '🥣': 'bowl', '🥛': 'milk', '🍛': 'curry', '🍰': 'cakeSlice', '🦷': 'tooth', '🩺': 'stethoscope', '🍑': 'peach', '🍄': 'mushroom', '📡': 'antenna', '🎧': 'headphones', '🏁': 'flag', '🤖': 'robot', '😢': 'sad', '👋': 'wave', '🔑': 'key', '🧽': 'sponge',
  '🔤': 'abc', '🚦': 'traffic', '🎲': 'dice', '📏': 'ruler', '⚖': 'scale', '👕': 'shirt', '👖': 'pants', '🧸': 'teddy', '🥰': 'loveFace', '🎨': 'palette', '🏃': 'runner', '🧼': 'soap',
  '📅': 'cal', '📚': 'books', '🎵': 'song', '📋': 'clipboard', '⚙': 'set', '🌟': 'star', '⭐': 'star', '🎯': 'target', '🎒': 'bag', '📖': 'bookOpen', '📁': 'folder', '🍎': 'apple', '🍱': 'meal', '🥐': 'chef', '🎂': 'cake', '🏫': 'school', '🏡': 'home', '🏠': 'home', '🤝': 'together', '🧹': 'broom', '⏰': 'clock', '🕘': 'clock', '💬': 'speech', '🤸': 'jump', '🧩': 'puzzle', '💞': 'hearts', '🌏': 'globe', '✨': 'sparkle', '🌱': 'sprout', '🌾': 'grain', '🥩': 'fish', '🥦': 'broccoli', '📌': 'pin', '💡': 'bulb', '🔔': 'bell', '🗓': 'calMonth', '📆': 'calSub', '📷': 'camera' };
Object.keys(WANT4).forEach(e => { if (EMOJI_TEXT[e] !== WANT4[e]) ok(false, 'EMOJI_TEXT：' + e + ' → ' + WANT4[e] + '（實際 ' + EMOJI_TEXT[e] + '）'); });
ok(Object.keys(WANT4).every(e => EMOJI_TEXT[e] === WANT4[e]), '對照表：第 4 批新增的 ' + Object.keys(WANT4).length + ' 個 Emoji（含沿用前三批圖示的）都對到指定圖示');
ok(Object.keys(EMOJI_TEXT).every(e => !!LIB[EMOJI_TEXT[e]]), '對照表裡每個圖示名稱都存在（共 ' + Object.keys(EMOJI_TEXT).length + ' 個 Emoji）');
['✓', '✕', '❮', '❯', '➔', '➡', '☑', '☐', '☰', '↻', '↗', '⋯', '→'].forEach(e => ok(!(e in EMOJI_TEXT), '文字型符號 ' + e + ' 不轉成圖示（本來就是字型符號）'));
EMOJI_TEXT_RE = eval(/const EMOJI_TEXT_RE = (new RegExp\([^\n]*\));/.exec(html)[1]);
eval(grab('emojiSplit'));
const sp4 = t => JSON.stringify(emojiSplit(t));
ok(sp4('👨‍👩‍👧 家人') === JSON.stringify([{ k: 'together' }, { t: ' 家人' }]), 'emojiSplit：👨‍👩‍👧（家庭，由三個字加連接符組成）整組換成一個圖示，不會被拆成三個人');
ok(sp4('👨 爸爸 👩 媽媽') === JSON.stringify([{ k: 'man' }, { t: ' 爸爸 ' }, { k: 'woman' }, { t: ' 媽媽' }]), 'emojiSplit：單獨的 👨、👩 仍各自對應');
ok(sp4('⚖️ 天秤') === JSON.stringify([{ k: 'scale' }, { t: ' 天秤' }]) && sp4('❤️ 諾貝爾 A') === JSON.stringify([{ k: 'heart' }, { t: ' 諾貝爾 A' }]), 'emojiSplit：⚖️、❤️（帶變體符）');
ok(sp4('✅ 已儲存！') === JSON.stringify([{ k: 'check' }, { t: ' 已儲存！' }]) && sp4('❌ 失敗') === JSON.stringify([{ k: 'cross' }, { t: ' 失敗' }]) && sp4('⚠️ 注意') === JSON.stringify([{ k: 'warn' }, { t: ' 注意' }]), 'emojiSplit：提示訊息的 ✅ ❌ ⚠️');
const picker = /const TASK_EMOJI_CHOICES = \[([^\]]*)\];/.exec(html);
const pickList = picker ? picker[1].split(',').map(x => x.trim().replace(/^'|'$/g, '').replace(/\uFE0F/g, '')).filter(Boolean) : [];
ok(pickList.length === 24 && pickList.every(e => !!EMOJI_TEXT[e]), '任務圖示挑選器的 24 個 Emoji 都有對應圖示（老師挑的任務圖示顯示一致）：' + pickList.filter(e => !EMOJI_TEXT[e]).join('、'));
ok(/b\.onclick = function\(\) \{ const inp = document\.getElementById\('taskForm-icon'\); if \(inp\) inp\.value = em; \};/.test(html), '挑選器按下去寫入的是原本的 Emoji 變數（不是讀畫面上的文字）：資料仍存 Emoji');

console.log('J. 第 4 批：季節與節慶徽章（CSS 偽元素，不能放 SVG 元素，改用內嵌圖片）');
ok(!/#seasonBadge::after\s*\{[^}]*content:\s*'[^']/.test(html), '#seasonBadge::after 的 content 不再放 Emoji');
ok(/#seasonBadge::after\s*\{[^}]*content:\s*'';[^}]*display:\s*inline-block;[^}]*width:\s*1\.15em;[^}]*height:\s*1\.15em;[^}]*background-size:\s*contain/.test(html), '徽章基本樣式：空內容、行內區塊、1.15em 見方、圖片縮放到包含');
const seasonMap = { 'data-season="spring"': 'blossom', 'data-season="summer"': 'watermelon', 'data-season="autumn"': 'maple', 'data-season="winter"': 'snowman', 'data-festival="lny"]': 'envelope', 'data-festival="children"]': 'pinwheel', 'data-festival="mother"]': 'bouquet', 'data-festival="dragon"]': 'zongzi', 'data-festival="father"]': 'tie', 'data-festival="moon"]': 'moon', 'data-festival="teacher"]': 'apple', 'data-festival="halloween"]': 'pumpkin', 'data-festival="xmas"]': 'tree', 'data-festival="lny"][data-festival-phase="lantern"]': 'lantern' };
Object.keys(seasonMap).forEach(sel => {
  const re = new RegExp('html\\[' + sel.replace(/[\[\]"]/g, m => '\\' + m).replace(/\\\]$/, '') + '[^{]*#seasonBadge::after\\s*\\{\\s*background-image:\\s*url\\("data:image/svg\\+xml,([^"]*)"\\);');
  const m = html.match(re);
  const svgText = m ? decodeURIComponent(m[1]) : '';
  ok(!!m && svgText.indexOf('xmlns="http://www.w3.org/2000/svg"') > 0 && svgText.indexOf(LIB[seasonMap[sel]]) > 0 && !/<script|on\w+=|href/i.test(svgText), sel + ' → ' + seasonMap[sel] + '：內嵌的是完整、乾淨的 SVG');
});
ok(/\.d\s*\{\s*display:\s*none\s*\}/.test(decodeURIComponent((html.match(/#seasonBadge::after\s*\{\s*background-image:\s*url\("data:image\/svg\+xml,([^"]*)"\)/) || [0, ''])[1])), '徽章用小尺寸：內嵌 SVG 隱藏細節線條');
ok(!/content:\s*'[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(html), '整份頁面沒有 CSS content 放 Emoji 了');

console.log('K. 後台「手機底部導覽列」設定：下拉選單的選項放不進圖畫，改成選單旁邊顯示目前選的圖示');
const mn = html.slice(html.indexOf('    function renderMobileNavSettings('), html.indexOf('    function mobileNavSnapshot('));
ok(mn.indexOf('o.textContent = t(NAV_TAB_META[k].label);') > 0 && mn.indexOf('NAV_TAB_META[k].icon') < 0, '選項文字只有頁面名稱（不再放 Emoji：<option> 放不進圖畫）');
ok(/function mobileNavSlotIcon\(k, cls\)/.test(html) && /stickerSvg\(NAV_TAB_META\[k\]\.sticker, 'sticker-sm ' \+ cls\)/.test(html), 'mobileNavSlotIcon：依頁面代號取得圖示');
ok(/sel\.value = cur\[i\] \|\| DEFAULT_MOBILE_NAV\[i\];[\s\S]{0,260}pv\.innerHTML = mobileNavSlotIcon\(sel\.value, 'w-6 h-6'\);\n        sel\.onchange/.test(mn), '初始：設好選單值之後先放一次預覽圖示（打開設定頁就看得到）');
ok(/sel\.onchange = function\(\) \{ pv\.innerHTML = mobileNavSlotIcon\(sel\.value, 'w-6 h-6'\); \};/.test(mn) && /pv\.innerHTML = mobileNavSlotIcon\(sel\.value, 'w-6 h-6'\)/.test(mn) && /row\.appendChild\(pv\); row\.appendChild\(sel\);/.test(mn), '每一格：選單旁邊有預覽圖示，換選項時預覽跟著換，初始值也顯示');
ok(/id="mobileNavSlot-' \+ \(i \+ 1\)|sel\.id = 'mobileNavSlot-' \+ \(i \+ 1\);/.test(mn) && /function mobileNavSnapshot\(\) \{ return \[1, 2, 3, 4\]\.map\(function\(i\) \{ return \(document\.getElementById\('mobileNavSlot-' \+ i\) \|\| \{\}\)\.value/.test(html), '選單的 id 與「讀取目前選擇」的程式不變（儲存、恢復預設、是否有改動的判斷都靠它）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
