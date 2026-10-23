// 季節主題色測試（瀏覽器）：月份對應季節、<head> 及早設定、四季的底色／頂部色條／Logo 小圖示、主色（桃粉色按鈕）不變、
// 小圖示不佔版面、跨月回到前景會更新、列印區不受影響。結束後還原成今天的季節。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  await new Promise(r => setTimeout(r, 1500));
  const html = document.documentElement, $ = id => document.getElementById(id);
  const months = { spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11], winter: [12, 1, 2] };

  // A. 月份對應
  ok(Object.keys(months).every(s => months[s].every(m => seasonOf(m) === s)), '月份對應：春 3～5、夏 6～8、秋 9～11、冬 12～2');
  ok(seasonOf(0) === 'winter' && seasonOf('x') === 'winter', '不合理的月份：當作冬天（不出錯）');

  // B. <head> 依同一套規則及早設定
  const head = Array.from(document.head.querySelectorAll('script')).map(s => s.textContent).join('\n');
  ok(/data-season/.test(head), '<head> 有及早設定 data-season 的程式（避免先閃預設色）');
  ok(html.getAttribute('data-season') === seasonOf(new Date().getMonth() + 1), '目前的季節與今天的月份一致');

  // C. 四季外觀
  const bodyBg = () => getComputedStyle(document.body).backgroundColor;
  const barImg = () => getComputedStyle($('seasonBar')).backgroundImage;
  // 頁首右側的圖示是 ::after 的內嵌 SVG 圖片：解開後比對圖示庫，回傳圖示名稱（沒有圖片回傳 ''）
  const badge = () => { const bg = getComputedStyle($('seasonBadge'), '::after').backgroundImage; const m = /url\("data:image\/svg\+xml,([^"]*)"\)/.exec(bg); if (!m) return ''; const svg = decodeURIComponent(m[1]); return Object.keys(STICKER_SVG).find(k => svg.indexOf(STICKER_SVG[k]) > 0) || '?'; };
  const peachBefore = getComputedStyle(document.querySelector('.bg-peach-500') || document.body).backgroundColor;
  const seen = { bg: new Set(), bar: new Set(), badge: new Set() };
  const expectBadge = { spring: 'blossom', summer: 'watermelon', autumn: 'maple', winter: 'snowman' };
  Object.keys(months).forEach(s => {
    applySeason(new Date(2027, months[s][0] - 1, 15));
    ok(html.getAttribute('data-season') === s, s + '：applySeason 依日期切換');
    seen.bg.add(bodyBg()); seen.bar.add(barImg()); seen.badge.add(badge());
    ok(/gradient/.test(barImg()) && badge() === expectBadge[s], s + '：頂部色條是漸層、頁首右側圖示是 ' + expectBadge[s]);
    ok(getComputedStyle(document.querySelector('.bg-peach-500') || document.body).backgroundColor === peachBefore, s + '：主色（桃粉色按鈕）不變');
  });
  ok(seen.bg.size === 4 && seen.bar.size === 4 && seen.badge.size === 4, '四季的底色、色條、小圖示各不相同');

  // D. 沒有 data-season：維持原本外觀
  html.removeAttribute('data-season');
  ok(bodyBg() === 'rgb(253, 251, 247)' && /gradient/.test(barImg()) && badge() === '' && getComputedStyle($('seasonBadge')).display === 'none', '沒有季節設定：維持原本的米白底色與彩虹色條、沒有圖示（也不佔位）');

  // E. 圖示：頁首右側、38px、微微傾斜、裝飾性，不在 Logo 與膠囊裡
  applySeason(new Date(2027, 9, 1));
  const sb = $('seasonBadge'), cs = getComputedStyle(sb), logoBox = document.querySelector('header .relative.w-11') || document.querySelector('header .rounded-2xl');
  const r = sb.getBoundingClientRect(), hr = document.querySelector('header').getBoundingClientRect(), pr = $('headerBadge').getBoundingClientRect();
  ok(Math.abs(r.width - 38) < 8 && Math.abs(r.height - 38) < 8 && cs.pointerEvents === 'none' && sb.getAttribute('aria-hidden') === 'true' && /matrix/.test(cs.transform), '圖示約 38px、傾斜（有 transform）、對螢幕閱讀器隱藏、不擋點擊');
  ok(!logoBox.contains(sb) && !$('headerBadge').contains(sb), '圖示不在 Logo 方塊裡、也不在 Happy Life 膠囊裡');
  ok(r.right > pr.right && r.left >= pr.right - 1 && r.right <= hr.right + 1 && r.top >= hr.top && r.bottom <= hr.bottom, '圖示在膠囊右邊、頁首範圍內（不超出頁首、不與膠囊重疊）');
  const lr = logoBox.getBoundingClientRect(); ok(r.left > lr.right, '圖示完全在 Logo 右邊，沒有壓到 Logo');
  const w1 = $('headerClass').getBoundingClientRect().width; sb.style.display = 'none'; const w2 = $('headerClass').getBoundingClientRect().width; sb.style.display = '';
  ok(w2 >= w1 - 0.5, '拿掉圖示後班名那一行只會更寬或一樣（圖示是用右側空位，不會把班名擠短）：' + Math.round(w1) + ' → ' + Math.round(w2));

  // F. 跨月：回到前景時更新
  html.setAttribute('data-season', 'spring');
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });   // 模擬「回到前景」（瀏覽器窗格在背景時 document.hidden 會是 true）
  document.dispatchEvent(new Event('visibilitychange'));
  delete document.hidden;
  ok(html.getAttribute('data-season') === seasonOf(new Date().getMonth() + 1), '回到前景（visibilitychange）：依今天重新設定季節');

  // G. 列印區背景不受季節影響
  const pa = $('printMenuArea');
  ok(!pa || !/season/.test(pa.className), '列印區沒有套用季節樣式');

  applySeason();
  const fail = res.filter(r => r.indexOf('✗') === 0).length;
  console.log(res.join('\n')); return { allPass: fail === 0, pass: res.length - fail, fail: fail, res: res };
})();
