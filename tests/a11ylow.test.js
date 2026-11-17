// 無障礙「低」與補強項（2026-11-16 檢查報告；使用者說「繼續」）：
// ⑩ 視窗開著時 Tab 會跑到背後頁面、各視窗 Esc 行為不一致（2.1.2／2.4.3）；
// ⑪ 欄位只換邊框色、鍵盤焦點不明顯（2.4.7）；
// ⑫ 動畫與平滑捲動沒有尊重「減少動態效果」（2.3.3）；
// ⑬ 幾顆小文字按鈕點擊範圍小於 24px（2.5.8）。
// 執行：node tests/a11ylow.test.js（已納入 tests/ci.sh）
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function fn(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); return html.slice(i, html.indexOf('\n    }\n', i) + 6); }

console.log('A. Tab 只在視窗內循環');
{
  const mk = (n) => ({ n, focused: 0, offsetParent: {}, disabled: false, focus() { this.focused++; cur.v = this; } });
  const cur = { v: null };
  const a = mk('a'), b = mk('b'), c = mk('c');
  const dlg = { querySelectorAll: () => [a, b, c], contains: (x) => [a, b, c].includes(x) };
  const doc = { get activeElement() { return cur.v; } };
  const src = 'const DIALOG_FOCUSABLE = "x";\n' + fn('dialogFocusables') + '\n' + fn('dialogTrapTab') + '\nreturn dialogTrapTab;';
  const trap = new Function(src)();
  const ev = (o) => Object.assign({ key: 'Tab', shiftKey: false, prevented: 0, preventDefault() { this.prevented++; } }, o);
  let e = ev({}); cur.v = c; ok(trap(e, dlg, doc) === true && a.focused === 1 && e.prevented === 1, '最後一個按 Tab：回到第一個');
  e = ev({ shiftKey: true }); cur.v = a; ok(trap(e, dlg, doc) === true && c.focused === 1 && e.prevented === 1, '第一個按 Shift+Tab：跳到最後一個');
  e = ev({}); cur.v = b; ok(trap(e, dlg, doc) === false && e.prevented === 0, '中間的控制項：交給瀏覽器照順序走');
  e = ev({}); cur.v = { outside: true }; const f0 = a.focused; ok(trap(e, dlg, doc) === true && a.focused === f0 + 1, '焦點在視窗外（例如背後頁面）：拉回視窗第一個');
  e = ev({ key: 'Enter' }); ok(trap(e, dlg, doc) === false, '其他按鍵不處理');
  e = ev({ ctrlKey: true }); ok(trap(e, dlg, doc) === false, 'Ctrl+Tab（切換瀏覽器分頁）不攔');
  const empty = { querySelectorAll: () => [], contains: () => false }; e = ev({}); ok(trap(e, empty, doc) === true && e.prevented === 1, '視窗裡沒有控制項：Tab 不動（不跑到背後）');
  const hid = mk('h'); hid.offsetParent = null; const dlg2 = { querySelectorAll: () => [hid, b], contains: (x) => x === b || x === hid };
  e = ev({}); cur.v = b; ok(trap(e, dlg2, doc) === true && b.focused === 1, '看不見的控制項不算（只剩一個時按 Tab 留在它身上）');
}

console.log('B. Esc 關閉最上層視窗');
{
  const src = 'const DIALOG_FOCUSABLE = "x"; const DIALOG_OWN_ESC = ' + html.match(/const DIALOG_OWN_ESC = (\[[^\]]*\]);/)[1] + ';\n' + fn('dialogIsOpen') + '\n' + fn('dialogFocusables') + '\n' + fn('dialogTrapTab') + '\n' + fn('dialogCloseButton') + '\n' + fn('dialogKeydown') + '\nreturn dialogKeydown;';
  const keydown = new Function(src)();
  const mkDlg = (id, hidden, btn, nested) => ({ id, classList: { contains: (c) => c === 'hidden' && hidden }, parentElement: nested ? { closest: () => ({}) } : null, querySelectorAll: (q) => (/close|data-close/.test(q) && btn ? [btn] : []), contains: () => false });
  const btn1 = { clicked: 0, click() { this.clicked++; } }, btn2 = { clicked: 0, click() { this.clicked++; } };
  const themeM = mkDlg('themeModal', false, btn1), songM = mkDlg('songPlayerModal', false, btn2), closedM = mkDlg('editAlbumModal', true, { click() { throw new Error('不該點'); } });
  const mkDoc = (list) => ({ querySelectorAll: () => list, activeElement: null });
  const E = (k) => ({ key: k, prevented: 0, preventDefault() { this.prevented++; } });
  let e = E('Escape'); ok(keydown(e, mkDoc([themeM, closedM, songM])) === true && btn2.clicked === 1 && btn1.clicked === 0 && e.prevented === 1, 'Esc：只關最上層（文件順序最後一個開著的），沒開的不動');
  const photo = mkDlg('photoViewerModal', false, { click() { throw new Error('有自己的 Esc 處理，不該重複關'); } });
  e = E('Escape'); ok(keydown(e, mkDoc([themeM, photo])) === false, '照片檢視、歷史焦點、相簿、完整連結：另有自己的 Esc，不重複處理');
  e = E('Escape'); ok(keydown(e, mkDoc([closedM])) === false, '沒有開著的視窗：什麼都不做');
  const outer = mkDlg('trPrintModal', false, btn1), inner = mkDlg('', false, { click() { throw new Error('內層不單獨算'); } }, true);
  btn1.clicked = 0; e = E('Escape'); ok(keydown(e, mkDoc([outer, inner])) === true && btn1.clicked === 1, '巢狀的內層 dialog 不單獨算（避免永遠被當成開著）');
  e = E('Escape'); const noBtn = mkDlg('activityPickerModal', false, null); ok(keydown(e, mkDoc([noBtn])) === false && e.prevented === 0, '找不到關閉鈕：不攔 Esc');
  ok(/document\.addEventListener\('keydown', function\(e\) \{ dialogKeydown\(e, document\); \}\);/.test(fn('initDialogFocus')), '頁面載入時掛上全域按鍵處理');
  // 每個一般視窗都有可被找到的關閉鈕（onclick 含 close）
  ['themeModal', 'activityPickerModal', 'spotlightModal', 'trPrintModal', 'calendarSubscribeModal', 'songPlayerModal', 'editAlbumModal', 'mobileMoreSheet'].forEach(id => {
    const i = html.indexOf('<div id="' + id + '"'); let seg = html.slice(i, i + 9000);
    ok(/onclick="[^"]*close[A-Za-z]*\(/i.test(seg) || /data-close/.test(seg), id + '：有關閉鈕可讓 Esc 觸發');
  });
}

console.log('C. 輸入欄位鍵盤焦點框');
ok(/input:focus-visible, select:focus-visible, textarea:focus-visible\s*\{[^}]*outline:\s*2px solid #4338CA !important/.test(html), '輸入框／下拉／文字區在鍵盤聚焦時畫 2px 外框（蓋過 focus:outline-none）');

console.log('D. 減少動態效果');
{
  const m = html.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n    \}/);
  ok(!!m && /\.animate-ping/.test(m[1]) && /\.animate-pulse/.test(m[1]) && /\.animate-bounce/.test(m[1]) && /animation:\s*none !important/.test(m[1]), '減少動態：ping／pulse／bounce 動畫關閉');
  ok(!!m && /scroll-behavior:\s*auto !important/.test(m[1]), '減少動態：平滑捲動關閉');
  ok(!/behavior: 'smooth'/.test(html) && (html.match(/behavior: smoothBehavior\(\)/g) || []).length >= 8, '程式裡的平滑捲動一律走 smoothBehavior()（沒有寫死 smooth）');
  const sb = new Function('prefersReducedMotion', fn('smoothBehavior') + '\nreturn smoothBehavior;');
  ok(sb(() => true)() === 'auto' && sb(() => false)() === 'smooth', 'smoothBehavior：減少動態→auto，否則 smooth');
}

console.log('E. 觸控範圍');
{
  ok(/\.tap-min\s*\{\s*min-height:\s*24px;\s*min-width:\s*24px;\s*\}/.test(html), '.tap-min：至少 24×24px');
  ok((html.match(/返回單日點選/g) || []).length >= 2 && (html.match(/hover:underline tap-min">\s*返回單日點選/g) || []).length === 2, '兩個「返回單日點選」');
  ok(/id="btnResetAlbumFilters"[^>]*tap-min/.test(html), '相簿「重設」');
  ok(/onclick="resetSongFilters\(\)"[^>]*tap-min/.test(html), '歌曲「重設」');
  ok(/id="btnToggleSelectAllFiltered"[^>]*tap-min/.test(html), '「全選目前歌曲」');
  ok(/today-toggle[^']*tap-min/.test(html), '「展開完整內容」');
  ok(/<label for="bottomBarSelectAllCheckbox"[^>]*tap-min/.test(html), '底部列全選勾選框的標籤');
}

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
