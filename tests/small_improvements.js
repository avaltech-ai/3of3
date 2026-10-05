// 小改善測試（瀏覽器）：縮圖 480、大字開關、列印本週菜單。在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};

  // A. 縮圖寬度
  const id = '1ABCDEFGHIJKLMNOPQRSTUVWXYZ0123';
  ok(/sz=w480$/.test(getPhotoDisplayUrl({ id: id }, false)), '相片物件（有 id）：縮圖 w480');
  ok(/sz=w2048$/.test(getPhotoDisplayUrl({ id: id }, true)), '相片物件：大圖檢視維持 w2048');
  ok(/sz=w480$/.test(getPhotoDisplayUrl('https://drive.google.com/file/d/' + id + '/view', false)), '主題相片（字串網址）：縮圖 w480');
  ok(/sz=w2048$/.test(getPhotoDisplayUrl('https://drive.google.com/uc?id=' + id, true)), '字串網址：大圖維持 w2048');
  const ex = expandAlbumPhotos([{ id: id, name: 'a.jpg' }])[0];
  ok(/sz=w480$/.test(ex.thumbnailUrl) && /sz=w2048$/.test(ex.viewUrl), '相簿清單展開：thumbnailUrl w480、viewUrl w2048');
  ok(!/w800/.test(JSON.stringify(ex)), '不再出現 w800');

  // B. 大字開關
  const html = document.documentElement;
  html.classList.remove('big-text'); try { localStorage.removeItem('nobel_a_big_text'); } catch (e) {}
  syncBigTextButton();
  const btn = document.getElementById('bigTextToggleBtn');
  ok(getComputedStyle(html).fontSize === '19px' && btn.getAttribute('aria-pressed') === 'false', '預設：根字級 19px、按鈕未按下');
  toggleBigText();
  ok(html.classList.contains('big-text') && getComputedStyle(html).fontSize === '22px', '開啟：根字級 22px');
  ok(btn.getAttribute('aria-pressed') === 'true' && btn.classList.contains('bg-amber-100'), '按鈕顯示按下狀態（aria-pressed 與底色）');
  ok(localStorage.getItem('nobel_a_big_text') === '1', '偏好已存到 localStorage');
  toggleBigText();
  ok(!html.classList.contains('big-text') && getComputedStyle(html).fontSize === '19px' && localStorage.getItem('nobel_a_big_text') === '0', '再按一次：還原 19px 並記住');
  ok(/nobel_a_big_text/.test(document.head.innerHTML), '標頭有早期套用的小段 script（避免開頁時閃一下標準字級）');
  ok(!!btn.querySelector('[data-i18n="nav.bigText"]') && t('nav.bigText') === '大字', '按鈕文字有字典（中文「大字」）');

  // C. 列印本週菜單
  let printed = 0, toast = ''; const realPrint = window.print, realToast = window.showToast;
  window.print = function () { printed++; }; window.showToast = function (m) { toast = m; };
  const area = document.getElementById('printMenuArea');
  ok(area && area.parentElement === document.body, '列印區是 body 的直接子元素（列印樣式才能只輸出它）');
  const css = [...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.cssText).join('\n'); } catch (e) { return ''; } }).join('\n');
  ok(/@media print/.test(css) && /#printMenuArea/.test(css) && /size: A4 landscape/i.test(css), '有列印樣式：@media print、A4 橫式、只輸出列印區');
  ok(getComputedStyle(area).display === 'none', '螢幕上列印區隱藏');

  const m0 = state.menus, sel0 = state.selectedDateStr, lang0 = state.lang;
  state.selectedDateStr = '2026-10-07'; // 週三；該週：10/4（日）～10/10（六）
  state.menus = [
    { date: '2026-10-05', morningSnack: '饅頭', fruit: '香蕉', lunchStaple: '白飯', lunchMain: '雞腿', lunchSide1: '青菜', lunchSide2: '', lunchSoup: '玉米濃湯', afternoonSnack: '布丁', note: '幸福廚房' },
    { date: '2026-10-07', morningSnack: '"><img src=x onerror=__x()>', fruit: '', lunchStaple: '糙米飯', lunchMain: '魚', lunchSide1: '', lunchSide2: '', lunchSoup: '', afternoonSnack: '' },
    { date: '2026-10-11', morningSnack: '週末活動點心', fruit: '', lunchStaple: '', lunchMain: '', lunchSide1: '', lunchSide2: '', lunchSoup: '', afternoonSnack: '' }
  ];
  state.lang = 'zh';
  printWeekMenu();
  ok(printed === 1, '有菜單：呼叫列印 1 次');
  const rows = [...area.querySelectorAll('tbody tr')];
  ok(rows.length === 5, '只有週一～週五（週六日沒有菜單不列出）：' + rows.length + ' 列');
  const cells = rows[0].querySelectorAll('td');
  ok(/10\/05 \(週一\)/.test(cells[0].textContent) && cells[1].textContent === '饅頭' && cells[2].textContent === '香蕉', '週一：日期、早點、水果正確（' + cells[0].textContent + '）');
  ok(cells[3].textContent === '白飯、雞腿、青菜、玉米濃湯', '午餐合併主食／主菜／副菜／湯（空欄位略過）：' + cells[3].textContent);
  ok(cells[4].textContent === '布丁' && cells[5].textContent === '幸福廚房', '午點與備註');
  ok(rows[1].querySelectorAll('td')[1].textContent === '—', '週二沒有菜單：顯示「—」');
  ok(area.querySelectorAll('img').length === 0 && area.innerHTML.indexOf('&lt;img') >= 0, '惡意字串被跳脫成文字，不會注入元素');
  ok(/桃子腳幼兒園 諾貝爾 A 班/.test(area.querySelector('h1').textContent) && /2026\/10\/04 – 2026\/10\/10/.test(area.textContent), '標題與日期範圍（週日起至週六）');
  ok(/本園餐點/.test(area.querySelector('.print-note').textContent), '附上既有的菜單註記');

  state.menus = state.menus.concat([{ date: '2026-10-10', morningSnack: '週六點心', fruit: '', lunchStaple: '', lunchMain: '', lunchSide1: '', lunchSide2: '', lunchSoup: '', afternoonSnack: '' }]);
  printWeekMenu();
  ok(area.querySelectorAll('tbody tr').length === 6 && /10\/10 \(週六\)/.test(area.textContent), '週末若有菜單資料：加列（週六）');

  state.lang = 'en'; printWeekMenu();
  ok(/Morning snack/.test(area.querySelector('thead').textContent) && /Weekly Menu/.test(area.querySelector('h1').textContent), '英文介面：英文表頭與標題');

  state.menus = [{ date: '2026-11-20', morningSnack: 'x' }]; printed = 0; state.lang = 'zh';
  printWeekMenu();
  ok(printed === 0 && /尚無菜單/.test(toast), '本週完全沒有菜單：提示並且不列印（' + toast + '）');

  state.menus = m0; state.selectedDateStr = sel0; state.lang = lang0; window.print = realPrint; window.showToast = realToast; area.innerHTML = '';
  window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
