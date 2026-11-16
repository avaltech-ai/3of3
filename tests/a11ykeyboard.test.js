// 無障礙「嚴重」三項修正（2026-11-16，WCAG 2.2 AA 檢查後使用者要求先修）：
// ① 行事曆日期格（含「本週／本月」列表）只能用滑鼠點，鍵盤選不到日期；
// ② 相簿卡片、主題活動週次卡片、焦點圖片「放大查看」也只能用滑鼠開；
// ③ 焦點輪播只有滑鼠停在上面才會暫停（鍵盤、手機無法停止自動換頁；2.2.2）。
// 修法：可點的區塊加上 tabindex="0"、role="button"、清楚的名稱；全站一個 keydown 處理器讓 Enter／空白鍵觸發點擊；
// 輪播加「暫停／繼續」按鈕，鍵盤焦點在輪播內也暫停，系統設定「減少動態效果」時預設不自動換頁。
// 執行：node tests/a11ykeyboard.test.js（已納入 tests/ci.sh）
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function fn(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); return html.slice(i, html.indexOf('\n    }\n', i) + 6); }
const flat = s => s.replace(/\s+/g, ' ');

console.log('A. 全站：role="button" 的區塊可以用 Enter／空白鍵觸發');
{
  const kbd = new Function(fn('kbdActivate') + '\nreturn kbdActivate;')();
  const mk = (tag, role, key) => { const el = { tagName: tag, clicked: 0, getAttribute: k => (k === 'role' ? role : null), click() { this.clicked++; }, isContentEditable: false }; const ev = { key, target: el, prevented: 0, preventDefault() { this.prevented++; }, defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false }; return { el, ev }; };
  let t = mk('DIV', 'button', 'Enter'); kbd(t.ev); ok(t.el.clicked === 1 && t.ev.prevented === 1, 'div[role=button]＋Enter → 觸發點擊');
  t = mk('DIV', 'button', ' '); kbd(t.ev); ok(t.el.clicked === 1 && t.ev.prevented === 1, 'div[role=button]＋空白鍵 → 觸發點擊（不捲動頁面）');
  t = mk('BUTTON', 'button', 'Enter'); kbd(t.ev); ok(t.el.clicked === 0, '原生 <button> 不重複觸發（瀏覽器自己會處理）');
  t = mk('DIV', null, 'Enter'); kbd(t.ev); ok(t.el.clicked === 0, '沒有 role=button 的區塊：不處理');
  t = mk('DIV', 'button', 'a'); kbd(t.ev); ok(t.el.clicked === 0, '其他按鍵：不處理');
  t = mk('DIV', 'button', 'Enter'); t.ev.ctrlKey = true; kbd(t.ev); ok(t.el.clicked === 0, '按著 Ctrl／Cmd 等組合鍵：不處理');
  ok(/document\.addEventListener\('keydown', kbdActivate\)/.test(html), '已在 document 註冊 keydown');
}

console.log('B. 行事曆日期格');
{
  const rc = fn('renderCalendar');
  ok(/cell\.tabIndex = 0;/.test(rc) && /cell\.setAttribute\('role', 'button'\)/.test(rc), '本月日期格：可用 Tab 走到（tabIndex 0、role=button）');
  ok(/cell\.setAttribute\('aria-label', calendarDayLabel\(/.test(rc), '日期格的名稱由 calendarDayLabel 產生');
  ok(/cell\.setAttribute\('aria-pressed', isSelected \? 'true' : 'false'\)/.test(rc), '目前選取的日期：aria-pressed=true');
  ok((rc.match(/setAttribute\('aria-hidden', 'true'\)/g) || []).length >= 2, '上個月、下個月補位的灰色格子：對輔助科技隱藏（不可選）');
  ok(/cell\.setAttribute\('data-date', dayStr\)/.test(rc), '日期格帶 data-date（重畫後找得回同一天）');
  const od = fn('onDateClicked');
  ok(/const hadFocus = /.test(od) && /matches\(':focus-visible'\)/.test(od) && /#calendarGrid \[data-date="' \+ dateStr \+ '"\]/.test(od) && /\.focus\(\{ preventScroll: true \}\)/.test(od), '用鍵盤選了日期：重畫後焦點回到同一天的格子（不會掉回頁首）');
  const lab = new Function('state', fn('calendarDayLabel') + '\nreturn calendarDayLabel;');
  const zh = lab({ lang: 'zh' }), en = lab({ lang: 'en' });
  ok(zh('2026-11-16', 2, true, true, true) === '11 月 16 日（一），今天，已選取，2 項活動，有菜單', '中文名稱：' + zh('2026-11-16', 2, true, true, true));
  ok(zh('2026-11-21', 0, false, false, false) === '11 月 21 日（六）', '沒活動、沒菜單的週末：只有日期與星期');
  ok(en('2026-11-16', 1, true, false, false) === 'Mon, November 16, 1 event, menu', '英文名稱：' + en('2026-11-16', 1, true, false, false));
  ok(en('2026-11-17', 3, false, true, false) === 'Tue, November 17, today, 3 events', '英文：今天、多項活動');
  const rows = (html.match(/<div [^>]*onclick="onDateClicked\(/g) || []);
  ok(rows.length >= 3 && rows.every(r => /tabindex="0"/.test(r) && /role="button"/.test(r)), '「本週／本月」列表的每一列（' + rows.length + ' 種）都能用鍵盤選取');
}

console.log('C. 相簿卡片、主題活動週次卡片');
{
  const card = (html.match(/<div [^>]*onclick="openAlbumPhotos\(/g) || []);
  ok(card.length === 1 && /tabindex="0"/.test(card[0]) && /role="button"/.test(card[0]) && card[0].indexOf('aria-label="${esc((state.lang === \'en\' ? \'Open album: \' : \'開啟相簿：\') + tx(alb.title))}"') > 0, '相簿卡片：可用 Tab 走到，名稱是「開啟相簿：相簿名稱」');
  const th = (html.match(/<div [^>]*onclick="toggleThemeCard\(/g) || []);
  ok(th.length === 1 && /tabindex="0"/.test(th[0]) && /role="button"/.test(th[0]) && /aria-expanded="\$\{isExpanded \? 'true' : 'false'\}"/.test(th[0]) && /aria-controls="theme-content-/.test(th[0]) && /id="theme-head-/.test(th[0]), '主題卡標題列：可用 Tab 走到，標示展開／收合狀態（aria-expanded）與控制的內容區');
  const tg = new Function('document', fn('toggleThemeCard') + '\nreturn toggleThemeCard;');
  const els = {}; const mkEl = (cls) => ({ classList: { s: new Set(cls), contains(c) { return this.s.has(c); }, add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); } }, style: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } });
  els['theme-content-T1'] = mkEl(['hidden']); els['theme-arrow-T1'] = mkEl([]); els['theme-head-T1'] = mkEl([]);
  const toggle = tg({ getElementById: id => els[id] || null });
  toggle('T1'); ok(els['theme-head-T1'].attrs['aria-expanded'] === 'true' && !els['theme-content-T1'].classList.contains('hidden'), '展開後 aria-expanded=true');
  toggle('T1'); ok(els['theme-head-T1'].attrs['aria-expanded'] === 'false' && els['theme-content-T1'].classList.contains('hidden'), '收合後 aria-expanded=false');
}

console.log('D. 焦點活動「放大查看」');
{
  ok(/<button type="button" id="spotlightMediaHint"[^>]*onclick="openSpotlightModal\(\)"/.test(html), '「放大查看」改成真正的按鈕（可用 Tab 與 Enter）');
  ok(!/<span id="spotlightMediaHint"/.test(html), '不再是 span');
}

console.log('E. 焦點輪播：暫停／繼續');
{
  const nav = flat(html.slice(html.indexOf('id="spotlightNavControls"'), html.indexOf('id="spotlightNavControls"') + 2500));
  ok(/<button type="button" id="spotlightPauseBtn"[^>]*onclick="toggleSpotlightPause\(\)"[^>]*aria-pressed="false"/.test(nav), '輪播控制區有「暫停輪播」按鈕（aria-pressed 表示是否已暫停）');
  ok(/onfocusin="spotlightFocusChanged\(true, event\)"/.test(html) && /onfocusout="spotlightFocusChanged\(false, event\)"/.test(html), '焦點進入輪播區：交給 spotlightFocusChanged 判斷；離開：恢復');
  {
    const box = { v: false };
    const f = new Function('box', 'return ' + fn('spotlightFocusChanged').trim().replace(/^function spotlightFocusChanged/, 'function').replace(/spotlightFocusInside/g, 'box.v'))(box);
    f(true, { target: { matches: q => q === ':focus-visible' } }); ok(box.v === true, '鍵盤焦點（:focus-visible）進入：暫停');
    f(true, { target: { matches: () => false } }); ok(box.v === false, '滑鼠點擊造成的焦點：不暫停（滑鼠點了箭頭不會讓輪播停住）');
    box.v = true; f(false, {}); ok(box.v === false, '焦點離開輪播區：恢復');
  }
  const st = fn('startSpotlightTimer');
  ok(/spotlightShouldWait\(\)/.test(st) && !/if \(!isSpotlightHovered\)/.test(st), '計時器到點時改問 spotlightShouldWait()（滑鼠停留、焦點在內、使用者暫停都會等）');
  const wait = new Function('ctx', 'var isSpotlightHovered = ctx.h, spotlightFocusInside = ctx.f, spotlightUserPaused = ctx.p;\n' + fn('spotlightShouldWait') + '\nreturn spotlightShouldWait();');
  ok(wait({ h: false, f: false, p: false }) === false, '沒有任何暫停原因：照常換頁');
  ok(wait({ h: true, f: false, p: false }) && wait({ h: false, f: true, p: false }) && wait({ h: false, f: false, p: true }), '滑鼠停留／焦點在內／按了暫停：任一成立就不換頁');
  ok(/let spotlightUserPaused = prefersReducedMotion\(\);/.test(html), '系統設定「減少動態效果」：一開始就是暫停狀態');
  const pr = new Function('window', fn('prefersReducedMotion') + '\nreturn prefersReducedMotion();');
  ok(pr({ matchMedia: q => ({ matches: q === '(prefers-reduced-motion: reduce)' }) }) === true && pr({ matchMedia: () => ({ matches: false }) }) === false && pr({}) === false, 'prefersReducedMotion：依系統設定；不支援 matchMedia 時視為否');
  const tp = fn('toggleSpotlightPause'); const sync = fn('syncSpotlightPauseBtn');
  ok(/spotlightUserPaused = !spotlightUserPaused/.test(tp) && /syncSpotlightPauseBtn\(\)/.test(tp), 'toggleSpotlightPause：切換暫停並更新按鈕');
  ok(/if \(!spotlightUserPaused\) spotlightFocusInside = false;/.test(tp), '按「繼續輪播」：即使焦點還在按鈕上也恢復換頁');
  ok(/syncSpotlightPauseBtn\(\);\s*startSpotlightTimer\(/.test(fn('renderSpotlightSection')), '每次畫輪播都同步按鈕文字（減少動態效果時一開始就顯示「繼續輪播」）');
  ok(/setAttribute\('aria-pressed', spotlightUserPaused \? 'true' : 'false'\)/.test(sync) && /cal\.spotlightResume/.test(sync) && /cal\.spotlightPause/.test(sync), '按鈕文字與狀態：暫停中顯示「繼續輪播」、播放中顯示「暫停輪播」');
  ok(/spotlightPause: '暫停輪播'/.test(html) && /spotlightResume: '繼續輪播'/.test(html) && /spotlightPause: 'Pause'/.test(html) && /spotlightResume: 'Play'/.test(html), '中英文字都有');
}

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
