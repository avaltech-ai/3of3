// 幼小銜接「四週打卡表」列印測試（瀏覽器）：按鈕、A4 橫式、固定 5 個習慣、4 週 × 7 天空白格、假日習慣的平日格灰底、小獎勵欄、
// 與計畫資料無關、英文、列印後清除，並用「真正的列印樣式」量出排版能塞進一頁 A4 橫式。需從中文介面開始。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(2500);
  const $ = id => document.getElementById(id);
  const title0 = document.title;   // 網頁原本的標題（列印會暫時改掉，最後要還原）
  const real = { print: window.print, plan: state.transitionPlan, lang: state.lang };
  let printed = 0, html = '', cls = false, style = '', titleAtPrint = '';
  window.print = () => { printed++; titleAtPrint = document.title; html = $('printTransitionArea').innerHTML; cls = document.body.classList.contains('printing-transition'); const st = $('trPrintPageStyle'); style = st ? st.textContent : ''; };
  const wrap = document.createElement('div'); wrap.innerHTML = '';

  // A. 按鈕
  const btn = document.querySelector('#trPrintModal button[data-print="habit4"]');
  ok(!!btn && btn.textContent.indexOf('好習慣打卡表（四週）') !== -1, '列印面板有「好習慣打卡表（四週）」卡片');

  // B. 列印（即使計畫資料是空的也能印：習慣是固定一份，不依賴工作表）
  state.transitionPlan = [];
  printHabitSheet();
  ok(printed === 1 && cls && /size: A4 landscape/.test(style), '列印：呼叫列印、暫時加上 A4 橫式與列印 class');
  const box = document.createElement('div'); box.innerHTML = html;
  const rows = box.querySelectorAll('table.habit tbody tr');
  ok(rows.length === 5 && Array.from(rows).every(r => r.querySelectorAll('td.day').length === 28), '固定 5 個好習慣，每個習慣 4 週 × 7 天＝28 個空白格');
  ok(box.querySelectorAll('thead tr:first-child th.wk-start').length === 4 && Array.from(box.querySelectorAll('thead tr:first-child th[colspan="7"]')).map(x => x.textContent).join() === '第 1 週,第 2 週,第 3 週,第 4 週', '表頭：第 1～4 週，各佔 7 欄');
  ok(Array.from(box.querySelectorAll('thead tr:nth-child(2) th')).slice(0, 7).map(x => x.textContent).join('') === '一二三四五六日' && box.querySelectorAll('thead tr:nth-child(2) th').length === 28, '第二列是「一二三四五六日」重複 4 週（週一起算）');
  ok(Array.from(rows).every(r => Array.from(r.querySelectorAll('td.day')).every(c => c.textContent === '')), '所有格子都是空白（不預先填日期或勾選）');
  const wk = rows[4];
  ok(!!wk && wk.querySelector('td.hname').textContent.indexOf('假日') !== -1 && wk.querySelectorAll('td.off').length === 20 && Array.from(wk.querySelectorAll('td.day')).every((c, i) => c.classList.contains('off') === (i % 7 < 5)), '假日運動：每週一～五的格子灰底（共 20 格）、週六日可打卡');
  ok(Array.from(rows).slice(0, 4).every(r => r.querySelectorAll('td.off').length === 0), '其他 4 個每天習慣：沒有灰格');
  ok(box.querySelector('.habit-reward') && /小獎勵/.test(box.querySelector('.habit-reward').textContent) && box.querySelector('.habit-reward .line'), '有小獎勵欄（集滿幾個勾、想要什麼，留橫線讓孩子填）');
  ok(/姓名/.test(box.querySelector('.habit-info').textContent) && /開始日期/.test(box.querySelector('.habit-info').textContent) && !/\d{4}[-/年]\d/.test(box.querySelector('.habit-info').textContent), '姓名與開始日期是空白線（不自動填日期）');
  ok(/新北市桃子腳非營利幼兒園/.test(box.querySelector('.print-note').textContent), '底部有園所與班級');
  ok(!/回條|簽名/.test(box.textContent), '不附回條與簽名欄');
  ok(Array.from(rows).map(r => r.querySelector('td.hname').textContent.slice(0, 5)).join('|').indexOf('21:00') !== -1, '習慣文字是固定的（含「21:00–21:30 前上床睡覺」）');

  // C. 計畫的資料有惡意文字時，打卡表完全不受影響（習慣固定、不讀資料）
  state.transitionPlan = [{ id: 'X', year: '115 學年度', category: '<img src=x onerror=window.__habpwn=1>', order: 1, kind: '在家', text: '"><script>window.__habpwn=1</script>' }];
  printHabitSheet();
  ok(!window.__habpwn && html === $('printTransitionArea').innerHTML && !/<img src=x|<script/i.test($('printTransitionArea').innerHTML), '計畫資料含惡意字串：打卡表內容不受影響、沒有被注入');

  // D. 純函式：文字一律跳脫
  const t1 = buildHabitSheetHtml({ title: '<b>T</b>', sub: 's', name: 'n', start: 'st', date: 'd', column: 'c', week: 'W{n}', days: 'a,b,c,d,e,f,g', rewardTitle: 'r', rewardLine: 'l', note: 'x' }, [{ text: '<img src=x onerror=1>', weekendOnly: false }]);
  ok(t1.indexOf('<b>T</b>') === -1 && t1.indexOf('&lt;b&gt;') !== -1 && t1.indexOf('<img') === -1, '傳進來的文字一律跳脫（標題與習慣名稱）');

  // E. 列印後清除
  await wait(1700);
  ok(!document.body.classList.contains('printing-transition') && !$('trPrintPageStyle'), '列印後移除列印 class 與橫式設定（不影響菜單與計畫清單的列印）');
  printTransitionPlan(false);
  ok(/size: A4 portrait/.test(style), '同一個列印流程：計畫清單仍是直式');
  await wait(1700);

  // F. 英文
  state.lang = 'en'; printHabitSheet(); state.lang = real.lang;
  const eb = document.createElement('div'); eb.innerHTML = html;
  ok(!/[一-鿿]/.test(eb.textContent.replace(/Taozijiao.*/, '')) && /Week 1/.test(eb.textContent) && /Mon/.test(eb.textContent) && /Little reward/.test(eb.textContent) && eb.querySelectorAll('tbody tr').length === 5, '英文介面：標題、週、星期、習慣、小獎勵全是英文，仍是 5 列');
  await wait(1700);

  // H. 單週版：內容比照四週版，只有 7 天
  const btn1 = document.querySelector('#trPrintModal button[data-print="habit1"]');
  ok(!!btn1 && btn1.textContent.indexOf('好習慣打卡表（單週）') !== -1 && /habit4/.test(btn.getAttribute('onclick')) && /habit1/.test(btn1.getAttribute('onclick')), '面板裡兩張打卡表卡片：四週呼叫 habit4、單週呼叫 habit1');
  printed = 0; printHabitSheet(1);
  const b1 = document.createElement('div'); b1.innerHTML = html;
  const rows1 = b1.querySelectorAll('table.habit.w1 tbody tr');
  ok(printed === 1 && /size: A4 landscape/.test(style) && /單週/.test(b1.querySelector('h1').textContent) && /這一週/.test(b1.querySelector('.print-sub').textContent), '單週版：A4 橫式、標題寫「單週」、說明是「這一週」');
  ok(rows1.length === 5 && Array.from(rows1).every(r => r.querySelectorAll('td.day').length === 7 && Array.from(r.querySelectorAll('td.day')).every(c => c.textContent === '')), '單週版：同樣 5 個好習慣，每個 7 個空白格（一週七天）');
  ok(b1.querySelectorAll('thead tr').length === 1 && Array.from(b1.querySelectorAll('thead th')).map(x => x.textContent).join('|') === '好習慣|一|二|三|四|五|六|日' && !/第 \d 週/.test(b1.textContent), '單週版表頭只有一列：「好習慣｜一～日」，沒有「第 N 週」');
  ok(Array.from(rows1).map(r => r.querySelector('td.hname').textContent).join('|') === Array.from(rows).map(r => r.querySelector('td.hname').textContent).join('|'), '單週版與四週版的 5 個習慣文字完全相同');
  ok(!!rows1[4] && rows1[4].querySelectorAll('td.off').length === 5 && Array.from(rows1[4].querySelectorAll('td.day')).every((c, i) => c.classList.contains('off') === (i < 5)) && Array.from(rows1).slice(0, 4).every(r => !r.querySelector('td.off')), '單週版：假日運動週一～五（5 格）灰底，其他習慣沒有灰格');
  ok(b1.querySelector('.habit-reward .line') && /小獎勵/.test(b1.querySelector('.habit-reward').textContent) && /姓名/.test(b1.querySelector('.habit-info').textContent) && /開始日期/.test(b1.querySelector('.habit-info').textContent) && /桃子腳/.test(b1.querySelector('.print-note').textContent), '單週版：姓名、開始日期、小獎勵欄、園所班級都有');
  ok(buildHabitSheetHtml({ title: 't', sub: 's', name: 'n', start: 's', date: 'd', column: 'c', week: 'W{n}', days: 'a,b,c,d,e,f,g', rewardTitle: 'r', rewardLine: 'l', note: 'x' }, [{ text: 'h' }]).split('class="day').length - 1 === 28, '純函式不給週數：預設四週（28 格）；只有 1 才是單週');
  await wait(1700);
  state.lang = 'en'; printHabitSheet(1); state.lang = real.lang;
  const eb1 = document.createElement('div'); eb1.innerHTML = html;
  ok(/1 week/.test(eb1.querySelector('h1').textContent) && /Mon/.test(eb1.textContent) && !/Week \d/.test(eb1.textContent) && !/[一-鿿]/.test(eb1.textContent.replace(/Taozijiao.*/, '')), '單週版英文介面：標題 (1 week)、Mon～Sun、沒有中文');
  await wait(1700);

  // J. 列印面板（方案 A）：工具列只留一個「列印…」，點開才看到四種列印
  const tab0 = state.currentTab; switchTab('transition'); await wait(200);   // 按鈕要在畫面上才拿得到焦點
  const tb = $('trPlanToolbar'), opener = $('trPrintOpenBtn'), modal = $('trPrintModal');
  const printBtns = Array.from(tb.querySelectorAll('button')).filter(b => /print/i.test(b.getAttribute('onclick') || ''));
  ok(!!opener && opener.textContent.indexOf('列印…') !== -1 && printBtns.length === 1 && printBtns[0] === opener && opener.getAttribute('aria-haspopup') === 'dialog', '工具列只有一個列印按鈕「🖨️ 列印…」（篩選與清除勾選旁不再有四個列印鈕）');
  ok(!!tb.querySelector('button[onclick="clearTransitionChecks()"]') && !!$('trFilterChips'), '工具列仍有篩選鈕與「清除勾選」');
  ok(modal.classList.contains('hidden') && modal.querySelector('[role="dialog"]').getAttribute('aria-modal') === 'true' && modal.parentElement === document.body, '面板平常是隱藏的；是 body 的直接子元素（列印時會被整個隱藏）；role=dialog、aria-modal');
  opener.focus(); openTrPrintPanel();
  ok(!modal.classList.contains('hidden') && document.activeElement === modal.querySelector('.tr-print-card'), '按「列印…」：面板打開、焦點移到第一張卡片');
  const cards = Array.from(modal.querySelectorAll('.tr-print-card'));
  const tagOf = c => c.lastElementChild.textContent.trim();
  ok(cards.length === 4 && cards.map(c => c.dataset.print).join() === 'check,blank,habit4,habit1', '面板有 4 張卡片，順序：含勾選、空白、四週、單週');
  ok(cards.map(tagOf).join('|') === 'A4 直式|A4 直式|A4 橫式|A4 橫式', '每張卡片標示紙張方向：計畫兩張 A4 直式、打卡表兩張 A4 橫式');
  ok(cards.every(c => c.querySelectorAll('span.block').length === 2 && c.querySelectorAll('span.block')[0].textContent.trim() && c.querySelectorAll('span.block')[1].textContent.trim()), '每張卡片都有標題與一行說明');
  ok(/5 個好習慣 × 4 週/.test(cards[2].textContent) && /5 個好習慣 × 1 週/.test(cards[3].textContent) && /☑/.test(cards[0].textContent), '說明文字：計畫含勾選會印成 ☑；打卡表是 5 個習慣 × 4 週／1 週');
  // Safari 提醒：只有 Safari 看得到
  const realSafari = window.trBrowserIgnoresPageSize;
  window.trBrowserIgnoresPageSize = () => true; closeTrPrintPanel(); openTrPrintPanel();
  const tipOn = !$('trPrintTipSafari').classList.contains('hidden') && /橫向/.test($('trPrintTipSafari').textContent);
  window.trBrowserIgnoresPageSize = () => false; closeTrPrintPanel(); openTrPrintPanel();
  const tipOff = $('trPrintTipSafari').classList.contains('hidden');
  window.trBrowserIgnoresPageSize = realSafari;
  ok(tipOn && tipOff, 'Safari 會看到「請選橫向」的提醒；Chrome／Edge 看不到');
  // 判斷 Safari 的規則
  const uaOf = ua => { const real = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent'); Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => ua }); const r = trBrowserIgnoresPageSize(); delete navigator.userAgent; return r; };
  ok(uaOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15') === true && uaOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1') === true && uaOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1') === true, 'Safari（Mac）與 iPhone 上的所有瀏覽器（含 Chrome、Firefox：它們在 iOS 上都是 Safari 引擎）都算「不支援」');
  ok(uaOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36') === false && uaOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0') === false && uaOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0 Safari/537.36') === false, 'Windows／Mac 的 Chrome、Edge 不算（它們會自動橫向）');
  // 點卡片：關閉面板並列印，方向正確
  const kinds = [['check', 'portrait', '幼小銜接計畫（含勾選）'], ['blank', 'portrait', '幼小銜接計畫（空白）'], ['habit4', 'landscape', '好習慣打卡表（四週）'], ['habit1', 'landscape', '好習慣打卡表（單週）']];
  state.transitionPlan = [{ id: 'Z', year: '115 學年度', category: '規律生活', order: 1, kind: '在家', text: '測試項目' }];
  const seen = [];
  for (const [k, orient, name] of kinds) {
    window.dispatchEvent(new Event('afterprint')); closeTrPrintPanel(); openTrPrintPanel();
    printed = 0; style = ''; titleAtPrint = '';
    modal.querySelector('button[data-print="' + k + '"]').click();
    seen.push(printed === 1 && modal.classList.contains('hidden') && new RegExp('size: A4 ' + orient).test(style) && titleAtPrint.indexOf(name) === 0);
  }
  ok(seen.every(Boolean), '點四張卡片：各自列印一次、面板關閉、方向（直／直／橫／橫）與檔名都對');
  window.dispatchEvent(new Event('afterprint')); await wait(1700);
  // 關閉方式
  openTrPrintPanel(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  const escOk = modal.classList.contains('hidden');
  openTrPrintPanel(); modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const bgOk = modal.classList.contains('hidden');
  openTrPrintPanel(); modal.querySelector('button[onclick="closeTrPrintPanel()"]').click();
  const xOk = modal.classList.contains('hidden');
  openTrPrintPanel(); modal.querySelector('[role="dialog"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const insideOk = !modal.classList.contains('hidden');
  closeTrPrintPanel();
  ok(escOk && bgOk && xOk && insideOk, '關閉：Esc、點背景、點 ✕ 都能關；點面板內部不會關');
  opener.focus(); openTrPrintPanel(); closeTrPrintPanel();
  ok(document.activeElement === opener, '關閉後焦點回到「列印…」按鈕');
  const realLang0 = state.lang; state.lang = 'en'; applyTranslations(); openTrPrintPanel();
  const enText = modal.textContent; const enBtn = opener.textContent;
  closeTrPrintPanel(); state.lang = realLang0; applyTranslations();
  ok(/Print…/.test(enBtn) && /A4 landscape/.test(enText) && /A4 portrait/.test(enText) && /Habit chart \(4 weeks\)/.test(enText) && !/[一-鿿]/.test(enText), '英文介面：按鈕與面板全是英文');

  switchTab(tab0 || 'home');
  // I. PDF 檔名：列印期間網頁標題＝「項目名稱 - 班級」，印完還原；四個項目、菜單、英文都各自不同
  window.dispatchEvent(new Event('afterprint'));   // 前面幾次列印還沒「印完」，先送出，讓標題回到原本的
  const origTitle = document.title, cls0 = t('header.class'), titles = [];
  ok(origTitle === title0, '前面的列印都印完後：網頁標題回到原本的「' + title0.slice(0, 12) + '…」');
  const grab = fn => { titleAtPrint = ''; fn(); titles.push(titleAtPrint); window.dispatchEvent(new Event('afterprint')); return titleAtPrint; };
  state.transitionPlan = [{ id: 'Z', year: '115 學年度', category: '規律生活', order: 1, kind: '在家', text: '測試項目' }];
  const tCheck = grab(() => printTransitionPlan(true)), tBlank = grab(() => printTransitionPlan(false)), tH4 = grab(() => printHabitSheet(4)), tH1 = grab(() => printHabitSheet(1));
  ok(tCheck === '幼小銜接計畫（含勾選） - ' + cls0 && tBlank === '幼小銜接計畫（空白） - ' + cls0 && tH4 === '好習慣打卡表（四週） - ' + cls0 && tH1 === '好習慣打卡表（單週） - ' + cls0, '列印時網頁標題＝項目名稱＋班級（PDF 預設檔名）：計畫含勾選／空白、四週打卡表、單週打卡表各不相同');
  ok(new Set(titles).size === 4 && document.title === origTitle, '四個項目的檔名互不相同（不會互相覆蓋）；afterprint 後網頁標題還原');
  const realMenus = state.menus; state.menus = [{ date: state.selectedDateStr, lunchMain: '測試菜' }].concat(state.menus || []);
  const tMenu = grab(() => printWeekMenu()); state.menus = realMenus;
  ok(/^本週菜單（\d\d-\d\d～\d\d-\d\d） - /.test(tMenu) && document.title === origTitle, '菜單列印：檔名含這一週的日期範圍（用「10-18」不用斜線）、印完還原');
  ok(titles.concat(tMenu).every(x => !/[\/\\:*?"<>|]/.test(x)), '檔名不含 / \\ : * ? " < > | 這些檔名不能用的字元');
  printHabitSheet(4); printHabitSheet(1);   // 連按兩次（還沒送出 afterprint）
  ok(titleAtPrint === '好習慣打卡表（單週） - ' + cls0, '連按兩次：第二次標題是第二個項目');
  window.dispatchEvent(new Event('afterprint'));
  ok(document.title === origTitle, '連按兩次後印完：標題還原成最初的（不是第一次改過的）');
  state.lang = 'en'; const tEn = grab(() => printHabitSheet(4)); state.lang = real.lang;
  ok(/^Habit chart \(4 weeks\) - /.test(tEn) && !/[一-鿿]/.test(tEn), '英文介面：檔名是英文');
  await wait(1700);

  // G. 真正的列印樣式量排版：A4 橫式、邊界 12mm → 內容區 273 × 186 mm
  const rules = [];
  Array.from(document.styleSheets).forEach(ss => { try { Array.from(ss.cssRules).forEach(r => { if (r.type === CSSRule.MEDIA_RULE && /print/.test(r.conditionText || r.media.mediaText)) Array.from(r.cssRules).forEach(x => { if (x.selectorText && x.selectorText.indexOf('#printTransitionArea') !== -1 && x.selectorText.indexOf('body') === -1) rules.push(x.cssText); }); }); } catch (e) {} });
  const stl = document.createElement('style'); stl.textContent = rules.join('\n'); document.head.appendChild(stl);
  printHabitSheet();
  const area = $('printTransitionArea');
  const old = area.getAttribute('style'); area.style.cssText = 'display:block;position:absolute;left:-9999px;top:0;width:273mm;background:#fff;color:#000;font-family:"Noto Sans TC",sans-serif';
  await wait(200);
  const mm = px => px / 96 * 25.4;
  const hmm = mm(area.scrollHeight), wmm = mm(area.scrollWidth);
  ok(rules.length >= 10, '取得列印樣式規則（' + rules.length + ' 條）');
  const wr = rules.map(r => /^#printTransitionArea table \{[^}]*width: calc\(100% - ([\d.]+)(px|mm)\)/.exec(r)).find(Boolean);
  const cut = wr ? (wr[2] === 'mm' ? Number(wr[1]) : Number(wr[1]) / 96 * 25.4) : 0;   // 瀏覽器會把 mm 換成 px 顯示
  ok(cut >= 1.4 && cut <= 3, '列印表格的寬度規則是「100% 減 ' + cut.toFixed(2) + ' mm」（計畫清單與打卡表共用，右邊框線不被切）');
  ok(hmm <= 186, '排版高度 ' + hmm.toFixed(1) + ' mm ≤ 186 mm：塞得進一頁 A4 橫式');
  const limitPx = Math.ceil(273 / 25.4 * 96);   // scrollWidth 是整數像素
  ok(area.scrollWidth <= limitPx, '排版寬度 ' + area.scrollWidth + ' px ≤ ' + limitPx + ' px（273 mm 進位）：沒有橫向超出版心');
  const cell = (area.querySelector('td.day') || document.body).getBoundingClientRect();
  ok(mm(cell.width) >= 6 && mm(cell.height) >= 12, '打卡格 ' + mm(cell.width).toFixed(1) + ' × ' + mm(cell.height).toFixed(1) + ' mm：孩子用鉛筆打勾夠大');
  const offEl = area.querySelector('td.off'), onEl = area.querySelector('td.day:not(.off)');
  const offBg = offEl ? getComputedStyle(offEl).backgroundColor : '', onBg = onEl ? getComputedStyle(onEl).backgroundColor : '';
  ok(!!offEl && offBg !== onBg && /217/.test(offBg), '灰色格子是淺灰（印出來看得出來、不會蓋過打勾）');
  const tbl = area.querySelector('table.habit');
  const gap = mm(area.getBoundingClientRect().right - tbl.getBoundingClientRect().right);
  ok(!!tbl && gap >= 1.2 && getComputedStyle(tbl).tableLayout === 'fixed', '四週版：表格右緣離版心右緣 ' + gap.toFixed(1) + ' mm（≥ 1.2 mm，最右邊那條框線不會被列印邊界切掉）、欄寬固定');
  window.__habitShot = area;   // 供截圖用

  // 單週版同樣量一次：格子更大、同樣塞得進一頁
  printHabitSheet(1);
  area.style.cssText = 'display:block;position:absolute;left:-9999px;top:0;width:273mm;background:#fff;color:#000;font-family:"Noto Sans TC",sans-serif';
  await wait(200);
  const h1mm = mm(area.scrollHeight), w1mm = mm(area.scrollWidth), c1 = (area.querySelector('td.day') || document.body).getBoundingClientRect();
  const tbl1 = area.querySelector('table.habit'), gap1 = tbl1 ? mm(area.getBoundingClientRect().right - tbl1.getBoundingClientRect().right) : 0;
  ok(h1mm <= 186 && area.scrollWidth <= limitPx && gap1 >= 1.2, '單週版排版 ' + w1mm.toFixed(2) + ' × ' + h1mm.toFixed(1) + ' mm、右緣離版心 ' + gap1.toFixed(1) + ' mm：塞得進一頁 A4 橫式、右邊框線不被切');
  ok(mm(c1.width) >= 25 && mm(c1.height) >= 18, '單週版打卡格 ' + mm(c1.width).toFixed(1) + ' × ' + mm(c1.height).toFixed(1) + ' mm：比四週版大很多（適合孩子每天自己貼貼紙或打勾）');
  area.setAttribute('style', old || ''); stl.remove();

  await wait(1700);
  window.dispatchEvent(new Event('afterprint'));
  window.print = real.print; state.transitionPlan = real.plan; state.lang = real.lang;
  ok(document.title === title0, '測試結束：網頁標題已還原');
  const fail = res.filter(r => r.indexOf('✗') === 0).length;
  console.log(res.join('\n')); return { allPass: fail === 0, pass: res.length - fail, fail: fail, res: res };
})();
