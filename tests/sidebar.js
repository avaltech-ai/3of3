// 側邊欄測試（瀏覽器，視窗寬度需 ≥ 768）：圖示／文字對齊、觸控裝置（沒有 hover，例如 iPad）的展開／收合。
// 用法見 tests/README.md。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(3000);
  ok(window.innerWidth >= 768, '視窗寬度 ≥ 768（目前 ' + window.innerWidth + '）才會顯示側邊欄');
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const sb = document.getElementById('desktopSidebar');
  const left = e => Math.round(e.getBoundingClientRect().left * 10) / 10;

  // A. 對齊：切換過頁籤之後（switchTab 會改寫按鈕 class），所有項目的圖示與文字左緣必須一致
  switchTab('albums'); await wait(300); switchTab('home'); await wait(300);
  expandSidebar(); await wait(600);
  const hdrIcon = left(sb.querySelector('.border-b span.text-base'));
  const btns = [...sb.querySelectorAll('nav > button')].filter(b => b.offsetParent);
  const icons = btns.map(b => left(b.querySelector('span.text-base')));
  const labels = btns.map(b => left(b.querySelector('.sidebar-text')));
  ok(btns.length >= 8, '可見的選單按鈕數量 ' + btns.length);
  ok(Math.max(...icons) - Math.min(...icons) < 0.6, '所有項目圖示左緣一致（' + [...new Set(icons)].join('／') + '）');
  ok(Math.max(...labels) - Math.min(...labels) < 0.6, '所有項目文字左緣一致（' + [...new Set(labels)].join('／') + '）');
  ok(Math.abs(icons[0] - hdrIcon) < 0.6, '項目圖示與標題列圖示對齊（' + icons[0] + ' vs ' + hdrIcon + '）');
  const hs = btns.filter(b => b.id !== 'sidebarTouchToggle').map(b => Math.round(b.getBoundingClientRect().height));
  ok(Math.max(...hs) - Math.min(...hs) <= 2, '各項目高度一致（' + [...new Set(hs)].join('／') + ' px）');
  collapseSidebar();

  // B. 觸控展開鈕的樣式規則（無法在桌面模擬 hover:none，改檢查規則文字）
  const css = [...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.cssText).join('\n'); } catch (e) { return ''; } }).join('\n');
  ok(/#sidebarTouchToggle\s*\{\s*display:\s*none/.test(css), '預設隱藏展開鈕（滑鼠裝置不顯示）');
  ok(/@media \(hover: none\) and \(min-width: 768px\)[^{]*\{[^}]*#sidebarTouchToggle\s*\{\s*display:\s*flex/.test(css.replace(/\n/g, ' ')), '只在沒有 hover 的裝置且寬度 ≥ 768 才顯示展開鈕');
  ok(/#pinSidebarBtn\s*\{\s*opacity:\s*1/.test(css), '觸控裝置圖釘常顯');

  // C. 展開／收合邏輯
  const tg = document.getElementById('sidebarTouchToggle'), icon = document.getElementById('sidebarTouchIcon');
  const isExpanded = () => sb.classList.contains('md:w-[152px]') && !sb.classList.contains('md:w-12');
  ok(!isExpanded() && icon.textContent === '»' && tg.getAttribute('aria-expanded') === 'false', '初始：收合、顯示 »');
  toggleSidebarTouch(); await wait(100);
  ok(isExpanded() && icon.textContent === '«' && tg.getAttribute('aria-expanded') === 'true', '按展開鈕：展開、顯示 «、aria-expanded=true');
  ok([...document.querySelectorAll('.sidebar-text')].every(e => e.classList.contains('opacity-100')), '展開後文字標籤顯示');
  toggleSidebarTouch(); await wait(100);
  ok(!isExpanded() && icon.textContent === '»', '再按一次：收合');

  toggleSidebarTouch(); await wait(50);
  sb.querySelector('nav').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  ok(isExpanded(), '點選單內部：不收合');
  document.getElementById('tabContent-home').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  ok(!isExpanded() && icon.textContent === '»', '點選單以外的地方：自動收合');

  toggleSidebarTouch(); await wait(50); switchTab('docs'); await wait(200);
  ok(!isExpanded(), '選了頁籤：自動收合');
  switchTab('home');

  togglePinSidebar(); await wait(100); toggleSidebarTouch(); document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(100);
  ok(isExpanded(), '已釘選：點外面不會收合');
  togglePinSidebar(); await wait(100); collapseSidebar();

  const iw = window.innerWidth; Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
  toggleSidebarTouch(); ok(!sidebarTouchExpanded, '手機寬度（<768）：展開鈕不動作（手機用漢堡選單）');
  Object.defineProperty(window, 'innerWidth', { value: iw, configurable: true });

  window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
