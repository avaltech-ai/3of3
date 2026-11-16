// 無障礙「中」三項修正（2026-11-16 檢查報告第 7～9 項；使用者說「繼續」）：
// ⑦ 標題層級跳級（相簿卡片、文件卡片的標題從 h2 直接跳到 h4）與沒有「跳到主要內容」連結（1.3.1／2.4.1）；
// ⑧ 日曆活動類別只靠圓點顏色區分（1.4.1）；
// ⑨ 彈出視窗沒有 dialog 語意，開啟後焦點沒有移進去、關閉後沒有還回去（4.1.2／2.4.3）。
// 執行：node tests/a11ymedium.test.js（已納入 tests/ci.sh）
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function fn(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); return html.slice(i, html.indexOf('\n    }\n', i) + 6); }

console.log('A. 跳到主要內容');
{
  const b = html.indexOf('<body');
  const first = html.slice(html.indexOf('>', b) + 1).trimStart();
  ok(/^<a href="#mainContent" class="skip-link"[^>]*data-i18n="ui\.skipToMain"[^>]*>跳到主要內容<\/a>/.test(first), '<body> 的第一個元素是「跳到主要內容」連結');
  ok(/<main id="mainContent" tabindex="-1"/.test(html), '<main> 有 id="mainContent"、tabindex="-1"（連結點下去焦點會移到內容）');
  ok(/\.skip-link\s*\{[^}]*position:\s*absolute[^}]*\}/.test(html) && /\.skip-link:focus\s*\{[^}]*top:\s*0\.5rem/.test(html), '平常藏在畫面外，按 Tab 聚焦時才出現');
  ok(/skipToMain: '跳到主要內容'/.test(html) && /skipToMain: 'Skip to main content'/.test(html), '中英文字都有');
  ok(/#mainContent:focus\s*\{\s*outline:\s*none/.test(html), '內容區被程式聚焦時不畫外框（它不是控制項）');
}

console.log('B. 標題層級');
{
  const albumCard = html.slice(html.indexOf("grid.innerHTML += `"), html.indexOf("grid.innerHTML += `") + 3000);
  ok(/<h3 class="font-black text-slate-800 text-sm line-clamp-2 break-words"/.test(albumCard) && !/<h4 class="font-black text-slate-800 text-sm line-clamp-2/.test(albumCard), '相簿卡片標題：h4 → h3（頁面標題是 h2）');
  const docs = fn('renderDocsList');
  ok((docs.match(/<h3 class="font-black text-slate-800 text-sm sm:text-base">/g) || []).length === 2 && !/<h4/.test(docs), '文件卡片標題（單檔、多檔）：h4 → h3');
}

console.log('C. 日曆類別不只靠顏色');
{
  const rc = fn('renderCalendar');
  ok(/rounded-full bg-emerald-500 ring-1 ring-white" aria-hidden="true"/.test(rc), '全園活動：圓形（aria-hidden，名稱由日期格的 aria-label 說明）');
  ok(/w-2 h-2 rounded-sm bg-amber-400 ring-1 ring-white" aria-hidden="true"/.test(rc), '班級主題：方形');
  ok(/w-2 h-2 rotate-45 bg-rose-500 ring-1 ring-white" aria-hidden="true"/.test(rc), '重要活動：菱形');
  ok(/const kinds = \[\];/.test(rc) && /kinds\.push\(t\('ui\.calDotSchool'\)\)/.test(rc) && /kinds\.push\(t\('ui\.calDotClass'\)\)/.test(rc) && /kinds\.push\(t\('ui\.calDotImportant'\)\)/.test(rc) && /kinds\.push\(t\('ui\.calDotNobel'\)\)/.test(rc), '日期格依實際有的類別收集名稱');
  ok(/calendarDayLabel\(dayStr, dayEvents\.length, !!dayMenu && !isWeekend, dayStr === getTodayDateStr\(\), isSelected, kinds\)/.test(rc), '類別名稱放進日期格的 aria-label');
  const lg = html.slice(html.indexOf('<!-- 圖例說明 -->'), html.indexOf('<!-- 圖例說明 -->') + 1800);
  ok(/w-2\.5 h-2\.5 rounded-full bg-emerald-500/.test(lg) && /w-2\.5 h-2\.5 rounded-sm bg-amber-400/.test(lg) && /w-2 h-2 rotate-45 bg-rose-500/.test(lg), '圖例的形狀與日期格一致（圓、方、菱）');
  const lab = new Function('state', fn('calendarDayLabel') + '\nreturn calendarDayLabel;');
  const zh = lab({ lang: 'zh' }), en = lab({ lang: 'en' });
  ok(zh('2026-11-16', 2, true, false, false, ['全園活動', '重要活動']) === '11 月 16 日（一），2 項活動（全園活動、重要活動），有菜單', '中文：' + zh('2026-11-16', 2, true, false, false, ['全園活動', '重要活動']));
  ok(en('2026-11-16', 1, false, false, false, ['Class theme']) === 'Mon, November 16, 1 event (Class theme)', '英文：' + en('2026-11-16', 1, false, false, false, ['Class theme']));
  ok(zh('2026-11-16', 2, true, true, true) === '11 月 16 日（一），今天，已選取，2 項活動，有菜單', '沒帶類別時維持原樣（相容）');
  ok(zh('2026-11-16', 0, false, false, false, ['諾貝爾 A 班活動']) === '11 月 16 日（一），諾貝爾 A 班活動', '沒有活動但有類別（例如諾貝爾 A 班標記）：也唸出來');
}

console.log('D. 彈出視窗：dialog 語意與焦點');
{
  const ids = { themeModal: 'modalThemeTitle', spotlightModal: 'modalSpotlightTitle', albumPhotosModal: 'modalAlbumTitle', trPrintModal: 'trPrintTitle', calendarSubscribeModal: 'calSubTitle', songPlayerModal: 'songPlayerTitle' };
  Object.keys(ids).forEach(k => ok(new RegExp('<div id="' + k + '" role="dialog" aria-modal="true" aria-labelledby="' + ids[k] + '"').test(html), k + '：role=dialog、aria-modal、名稱來自標題 ' + ids[k]));
  ['spotlightHistoryModal', 'fullDriveLinksModal', 'editAlbumModal', 'activityPickerModal', 'photoViewerModal'].forEach(k => ok(new RegExp('<div id="' + k + '" role="dialog" aria-modal="true" aria-label="[^"]+"').test(html), k + '：role=dialog、aria-modal、有名稱'));
  const all = (html.match(/<div id="[A-Za-z]+Modal" role="dialog"/g) || []).length;
  ok(all === 11, '共 11 個彈出視窗都有 dialog 語意（實際 ' + all + '）');
  const { open, close } = new Function(fn('dialogIsOpen') + '\n' + fn('dialogToggled') + '\nreturn { open: (el, doc, st) => dialogToggled(el, true, doc, st), close: (el, doc, st) => dialogToggled(el, false, doc, st) };')();
  const mkBtn = (name) => ({ name, focused: 0, offsetParent: {}, getAttribute: () => null, focus() { this.focused++; doc.activeElement = this; } });
  const opener = mkBtn('opener'), closeBtn = mkBtn('closeBtn'), dlg = { tabindex: null, focused: 0, querySelectorAll: () => [closeBtn], setAttribute(k, v) { if (k === 'tabindex') this.tabindex = v; }, focus() { this.focused++; doc.activeElement = this; } };
  const doc = { activeElement: opener, body: {}, contains: () => true };
  const st = new Map();
  open(dlg, doc, st, true);
  ok(st.get(dlg) === opener, '開啟時：記下是哪個按鈕開的');
  ok(closeBtn.focused === 1 && dlg.focused === 0, '開啟時：焦點移到視窗裡第一個可操作的控制項（例如關閉鈕）');
  close(dlg, doc, st);
  ok(opener.focused === 1 && !st.has(dlg), '關閉時：焦點還回原本的按鈕');
  const dlg2 = { tabindex: null, focused: 0, querySelectorAll: () => [], setAttribute(k, v) { if (k === 'tabindex') this.tabindex = v; }, focus() { this.focused++; doc.activeElement = this; } };
  doc.activeElement = opener; open(dlg2, doc, st);
  ok(dlg2.tabindex === '-1' && dlg2.focused === 1, '視窗裡沒有控制項：焦點放在視窗本身（tabindex=-1）');
  doc.activeElement = { name: 'x' }; const gone = { ...opener, focused: 0 };
  st.set(dlg2, gone); const docGone = { activeElement: {}, body: {}, contains: () => false }; close(dlg2, docGone, st);
  ok(gone.focused === 0, '原本的按鈕已經不在頁面上：不報錯、不亂聚焦');
  ok(/function initDialogFocus\(\)/.test(html) && /new MutationObserver\(/.test(fn('initDialogFocus')) && /attributeFilter: \['class'\]/.test(fn('initDialogFocus')), '用 MutationObserver 監看 class 變化（各處開關視窗的程式不用改）');
  ok(/\n    initDialogFocus\(\);\n    startControlNames\(\);/.test(html), '頁面載入時啟動');
}

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
