// 節慶主題畫面測試（瀏覽器）：平常不下載節慶圖片、各節慶的底色／色條／小圖示、頁首下方掛飾、標題卡角落淡圖（在文字後面）、
// 月曆節日格圖示、今天小卡節日當天的標籤與插圖（文字不被壓到）、元宵階段 🏮、節慶結束回到季節。需從中文介面開始。結束後還原成今天。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(2500);
  const html = document.documentElement, $ = id => document.getElementById(id);
  const shown = el => !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
  const badge = () => getComputedStyle($('seasonBadge'), '::after').content.replace(/["']/g, '');
  const saved = { tab: state.currentTab, y: state.viewYear, m: state.viewMonth, sel: state.selectedDateStr };

  // A. 平常（今天不是節慶期間時）不下載節慶圖片
  const todayKey = festivalOn(festYmd(new Date()));
  const fetched = () => performance.getEntriesByType('resource').filter(e => /\/festival\//.test(e.name)).length;
  if (!todayKey) ok(fetched() === 0 && !html.hasAttribute('data-festival') && !shown($('festivalGarland')), '今天不是節慶期間：沒有 data-festival、沒有掛飾、沒有下載任何節慶圖片');
  else ok(html.getAttribute('data-festival') === todayKey.key, '今天是節慶期間：data-festival 正確');
  ok(/data-festival/.test(Array.from(document.head.querySelectorAll('script')).map(s => s.textContent).join('\n')), '<head> 有及早設定節慶的程式（避免先閃季節色）');

  // B. 各節慶外觀
  const cases = { lny: [2026, 1, 17, '🧧'], children: [2027, 3, 4, '🎈'], mother: [2026, 4, 10, '💐'], dragon: [2026, 5, 19, '🐲'], father: [2026, 7, 8, '👔'],
    moon: [2026, 8, 25, '🥮'], teacher: [2026, 8, 28, '🍎'], halloween: [2026, 9, 31, '🎃'], xmas: [2026, 11, 25, '🎄'] };
  const bgs = new Set();
  for (const k of Object.keys(cases)) {
    const c = cases[k];
    applyFestival(new Date(c[0], c[1], c[2]));
    const g = getComputedStyle($('festivalGarland'));
    bgs.add(getComputedStyle(document.body).backgroundColor);
    ok(html.getAttribute('data-festival') === k && badge() === c[3] && shown($('festivalGarland')) && g.backgroundImage.indexOf('festival/' + k + '-garland.svg') !== -1 && g.backgroundRepeat.indexOf('repeat') === 0,
      k + '：data-festival、小圖示 ' + c[3] + '、頁首下方掛飾（左右重複）');
  }
  ok(bgs.size === 9, '9 個節慶的頁面底色各不相同');

  // C. 掛飾的圖片真的載得到
  applyFestival(new Date(2026, 9, 31));
  const imgOk = await new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = 'festival/halloween-garland.svg'; });
  ok(imgOk, '萬聖節掛飾 SVG 載入成功');
  const g = $('festivalGarland').getBoundingClientRect(), hdr = document.querySelector('header').getBoundingClientRect();
  ok(Math.abs(g.top - hdr.bottom) < 2 && g.height >= 40 && g.height <= 48, '掛飾緊貼在頁首正下方、高度約 44px');
  ok(getComputedStyle(document.querySelector('header')).position === 'sticky' && !document.querySelector('header').contains($('festivalGarland')), '掛飾不在固定的頁首裡（不會讓頁首變高）');

  // D. 標題卡角落淡圖：三頁、在文字後面
  switchTab('albums');
  const sh = Array.from(document.querySelectorAll('.festival-shadow'));
  ok(sh.length === 3, '影像記錄、唱跳音符、常用文件三張標題卡各有一個角落淡圖');
  const s0 = document.querySelector('#tabContent-albums .festival-shadow');
  const cs = getComputedStyle(s0), card = s0.parentElement, ccs = getComputedStyle(card);
  ok(shown(s0) && cs.backgroundImage.indexOf('festival/halloween-sticker.svg') !== -1 && Number(cs.opacity) < 0.4 && cs.pointerEvents === 'none' && s0.getAttribute('aria-hidden') === 'true', '淡圖顯示、半透明、不擋點擊、對螢幕閱讀器隱藏');
  ok(cs.zIndex === '-1' && ccs.isolation === 'isolate' && ccs.overflow === 'hidden' && ccs.position === 'relative', '淡圖在卡片內容後面（isolate＋z-index:-1），超出卡片的部分被裁掉');
  const btn = card.querySelector('button');
  if (btn) { const r = btn.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); ok(!top || btn.contains(top) || top === btn, '卡片上的按鈕仍可點（淡圖沒有蓋在上面）'); }

  // E. 月曆節日格
  switchTab('home');
  state.viewYear = 2026; state.viewMonth = 10; renderCalendar();
  const cellText = Array.from(document.querySelectorAll('#calendarGrid > div')).map(c => c.textContent);
  const c31 = cellText.find(t => /^\s*31/.test(t)), c30 = cellText.find(t => /^\s*30/.test(t));
  ok(!!c31 && c31.indexOf('🎃') !== -1 && c30.indexOf('🎃') === -1, '2026 年 10 月月曆：10/31 有 🎃，10/30 沒有');
  state.viewYear = 2026; state.viewMonth = 2; renderCalendar();
  const feb17 = Array.from(document.querySelectorAll('#calendarGrid > div')).map(c => c.textContent).find(t => /^\s*17/.test(t));
  ok(!!feb17 && feb17.indexOf('🧧') !== -1, '2026 年 2 月：春節 2/17 有 🧧');

  // F. 今天小卡：節日當天
  const p = todayPanelEl('2026-10-31', '今天', true);
  document.body.appendChild(p); p.style.width = '300px';
  const chip = p.querySelector('.today-festival-chip'), st = p.querySelector('.today-festival-sticker');
  ok(!!chip && chip.textContent.indexOf('萬聖節') !== -1 && chip.textContent.indexOf('快樂') === -1, '節日當天：標頭有「🎃 萬聖節」標籤（只寫節日名稱，不是祝福語）');
  ok(!!st && /halloween-sticker\.svg/.test(st.style.background || st.style.backgroundImage) && st.getAttribute('aria-hidden') === 'true', '節日當天：右上角萬聖節插圖');
  const sr = st ? st.getBoundingClientRect() : { left: 0, right: 0, top: 0, bottom: 0 };
  const overlap = !st || Array.from(p.querySelectorAll('span, div')).filter(e => e !== st && e.children.length === 0 && e.textContent.trim()).some(e => { const r = e.getBoundingClientRect(); return r.left < sr.right - 1 && sr.left < r.right - 1 && r.top < sr.bottom - 1 && sr.top < r.bottom - 1; });
  ok(!overlap, '300px 寬的小卡：插圖不壓到任何文字');
  p.remove();
  const p2 = todayPanelEl('2026-10-30', '明天', false);
  ok(!p2.querySelector('.today-festival-chip') && !p2.querySelector('.today-festival-sticker') && !p2.style.paddingRight, '不是節日當天（10/30）：沒有標籤與插圖');
  const p3 = todayPanelEl('2026-03-03', '今天', true);
  const chip3 = p3.querySelector('.today-festival-chip');
  ok(!!chip3 && chip3.textContent.indexOf('🏮 元宵節') !== -1, '元宵當天：標籤是「🏮 元宵節」');

  // G. 元宵階段、節慶結束
  applyFestival(new Date(2026, 1, 28));
  ok(html.getAttribute('data-festival') === 'lny' && html.getAttribute('data-festival-phase') === 'lantern' && badge() === '🏮', '元宵前 3 天：小圖示換成 🏮');
  applyFestival(new Date(2026, 1, 20));
  ok(!html.hasAttribute('data-festival-phase') && badge() === '🧧', '春節期間：🧧');
  applyFestival(new Date(2026, 10, 15)); applySeason(new Date(2026, 10, 15));
  ok(!html.hasAttribute('data-festival') && !shown($('festivalGarland')) && !shown(s0) && badge() === '🍁', '節慶結束：掛飾與淡圖消失，回到季節（秋天 🍁）');

  // H. 英文介面標籤
  const realLang = state.lang; state.lang = 'en';
  const pe = todayPanelEl('2026-12-25', 'Today', true); state.lang = realLang;
  const chipE = pe.querySelector('.today-festival-chip');
  ok(!!chipE && chipE.textContent.indexOf('Christmas') !== -1, '英文介面：標籤是「🎄 Christmas」');

  applyFestival(); applySeason();
  state.viewYear = saved.y; state.viewMonth = saved.m; state.selectedDateStr = saved.sel; renderCalendar(); switchTab(saved.tab || 'home');
  const fail = res.filter(r => r.indexOf('✗') === 0).length;
  console.log(res.join('\n')); return { allPass: fail === 0, pass: res.length - fail, fail: fail, res: res };
})();
