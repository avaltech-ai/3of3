// 幼小銜接「四週打卡表」列印測試（瀏覽器）：按鈕、A4 橫式、固定 5 個習慣、4 週 × 7 天空白格、假日習慣的平日格灰底、小獎勵欄、
// 與計畫資料無關、英文、列印後清除，並用「真正的列印樣式」量出排版能塞進一頁 A4 橫式。需從中文介面開始。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(2500);
  const $ = id => document.getElementById(id);
  const real = { print: window.print, plan: state.transitionPlan, lang: state.lang };
  let printed = 0, html = '', cls = false, style = '';
  window.print = () => { printed++; html = $('printTransitionArea').innerHTML; cls = document.body.classList.contains('printing-transition'); const st = $('trPrintPageStyle'); style = st ? st.textContent : ''; };
  const wrap = document.createElement('div'); wrap.innerHTML = '';

  // A. 按鈕
  const btn = Array.from(document.querySelectorAll('#trPlanToolbar button')).find(b => /printHabitSheet/.test(b.getAttribute('onclick') || ''));
  ok(!!btn && btn.textContent.indexOf('列印四週打卡表') !== -1, '幼小銜接計畫頁有「列印四週打卡表」按鈕');

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
  const btn1 = Array.from(document.querySelectorAll('#trPlanToolbar button')).find(b => /printHabitSheet\(1\)/.test(b.getAttribute('onclick') || ''));
  ok(!!btn1 && btn1.textContent.indexOf('列印單週打卡表') !== -1 && /printHabitSheet\(4\)/.test(btn.getAttribute('onclick')), '兩個按鈕：「列印四週打卡表」呼叫 (4)、「列印單週打卡表」呼叫 (1)');
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
  ok(hmm <= 186, '排版高度 ' + hmm.toFixed(1) + ' mm ≤ 186 mm：塞得進一頁 A4 橫式');
  ok(wmm <= 273.5, '排版寬度 ' + wmm.toFixed(1) + ' mm ≤ 273.5 mm：沒有橫向超出');
  const cell = (area.querySelector('td.day') || document.body).getBoundingClientRect();
  ok(mm(cell.width) >= 6 && mm(cell.height) >= 12, '打卡格 ' + mm(cell.width).toFixed(1) + ' × ' + mm(cell.height).toFixed(1) + ' mm：孩子用鉛筆打勾夠大');
  const offEl = area.querySelector('td.off'), onEl = area.querySelector('td.day:not(.off)');
  const offBg = offEl ? getComputedStyle(offEl).backgroundColor : '', onBg = onEl ? getComputedStyle(onEl).backgroundColor : '';
  ok(!!offEl && offBg !== onBg && /217/.test(offBg), '灰色格子是淺灰（印出來看得出來、不會蓋過打勾）');
  const tbl = area.querySelector('table.habit');
  ok(!!tbl && mm(tbl.getBoundingClientRect().width) <= 273.5 && getComputedStyle(tbl).tableLayout === 'fixed', '表格寬度在版心內、欄寬固定');
  window.__habitShot = area;   // 供截圖用

  // 單週版同樣量一次：格子更大、同樣塞得進一頁
  printHabitSheet(1);
  area.style.cssText = 'display:block;position:absolute;left:-9999px;top:0;width:273mm;background:#fff;color:#000;font-family:"Noto Sans TC",sans-serif';
  await wait(200);
  const h1mm = mm(area.scrollHeight), w1mm = mm(area.scrollWidth), c1 = (area.querySelector('td.day') || document.body).getBoundingClientRect();
  ok(h1mm <= 186 && w1mm <= 273.5, '單週版排版 ' + w1mm.toFixed(1) + ' × ' + h1mm.toFixed(1) + ' mm：塞得進一頁 A4 橫式');
  ok(mm(c1.width) >= 25 && mm(c1.height) >= 18, '單週版打卡格 ' + mm(c1.width).toFixed(1) + ' × ' + mm(c1.height).toFixed(1) + ' mm：比四週版大很多（適合孩子每天自己貼貼紙或打勾）');
  area.setAttribute('style', old || ''); stl.remove();

  await wait(1700);
  window.print = real.print; state.transitionPlan = real.plan; state.lang = real.lang;
  const fail = res.filter(r => r.indexOf('✗') === 0).length;
  console.log(res.join('\n')); return { allPass: fail === 0, pass: res.length - fail, fail: fail, res: res };
})();
