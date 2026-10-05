// 「NEW」標籤測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 規則：今天（含）起往前 7 個日曆日（台北時區）內的 updatedAt 為「新」；未來日期、無法解析、空值都不算。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {}; // 擋住背景雲端更新，避免洗掉測試資料
  const now = new Date('2026-10-05T04:00:00Z'); // 台北 2026-10-05 12:00

  // A. 判斷邏輯
  const N = v => isNewItem(v, now);
  ok(N('2026-10-05') === true, '今天 → 新');
  ok(N('2026-09-29') === true, '第 6 天前 → 新（含邊界）');
  ok(N('2026-09-28') === false, '第 7 天前 → 不算（邊界外）');
  ok(N('2026-10-06') === false && N('2027-01-01') === false, '未來日期 → 不算（避免資料錯誤時亂標）');
  ok(N('2026-10-03T18:26:06.197Z') === true, 'ISO 時間（UTC 10/3 18:26 = 台北 10/4）→ 新');
  ok(N('2026-10-04T16:30:00Z') === true, '台北時區跨日：UTC 10/4 16:30 = 台北 10/5 00:30 → 新');
  ok(N('2026-09-28T16:00:00Z') === true && N('2026-09-28T15:59:00Z') === false, '邊界以台北時區換日（UTC 16:00 為台北 0 點）');
  ok(N('2026/10/3') === true && N('2026/9/29') === true && N('2026/9/28') === false, '斜線與未補零日期');
  ok(N('  2026-10-04  ') === true, '前後空白');
  ok(N('') === false && N(null) === false && N(undefined) === false && N('abc') === false && N({}) === false && N('2026-13-45') === false, '空值／亂碼／不存在的日期 → 不算');
  ok(isNewItem('2026-09-29', new Date('2026-10-05T16:30:00Z')) === false, '現在是台北 10/6 00:30：9/29 已滿 7 天 → 不算');

  // B. 相簿／文件／主題的渲染
  const today = taipeiYmd(new Date());
  const days = n => taipeiYmd(new Date(Date.now() - n * 86400000));
  const albums = [
    { id: 'a1' + 'x'.repeat(20), title: '新相簿', category: '班級主題', photoCount: 3, coverUrl: '', updatedAt: today },
    { id: 'a2' + 'x'.repeat(20), title: '舊相簿', category: '班級主題', photoCount: 3, coverUrl: '', updatedAt: days(30) },
    { id: 'a3' + 'x'.repeat(20), title: '壞日期', category: '班級主題', photoCount: 3, coverUrl: '', updatedAt: '"><img src=x onerror=__x()>' },
    { id: 'a4' + 'x'.repeat(20), title: '無日期', category: '班級主題', photoCount: 3, coverUrl: '' }
  ];
  renderAlbumsList(albums);
  const g = document.getElementById('albumsGrid');
  ok(g.querySelectorAll('.new-badge').length === 1, '相簿：只有近 7 天的那本有 NEW（實際 ' + g.querySelectorAll('.new-badge').length + '）');
  ok(g.querySelector('.new-badge') && g.querySelector('.new-badge').textContent === 'NEW' && /7/.test(g.querySelector('.new-badge').title), 'NEW 文字與提示（' + (g.querySelector('.new-badge') && g.querySelector('.new-badge').title) + '）');
  ok(g.querySelectorAll('img[onerror*="__x"]').length === 0 && !/__x\(\)/.test(g.innerHTML.replace(/onerror="if\(this\.dataset/g, '')), '壞日期字串不會被注入');

  state.docs = [
    { id: 'd1', fileName: '新文件', category: '一般文件', description: '', downloadUrl: 'https://example.com/a', updatedAt: today },
    { id: 'd2', fileName: '舊文件', category: '一般文件', description: '', downloadUrl: 'https://example.com/b', updatedAt: days(40) }
  ];
  renderDocsList('全部');
  const dl = document.getElementById('docsList') || document.body;
  const cards = [...document.querySelectorAll('#tabContent-docs h4')].filter(h => /新文件|舊文件/.test(h.textContent));
  const badgeOf = t => { const h = cards.find(x => x.textContent === t); return h ? h.parentElement.querySelectorAll('.new-badge').length : -1; };
  ok(badgeOf('新文件') === 1 && badgeOf('舊文件') === 0, '文件：新文件有 NEW、舊文件沒有（' + badgeOf('新文件') + '／' + badgeOf('舊文件') + '）');

  state.themes = [
    { id: 't1', week: 'W1', themeName: '新主題', startDate: today, semester: '', updatedAt: today },
    { id: 't2', week: 'W2', themeName: '舊主題', startDate: days(60), semester: '', updatedAt: days(60) }
  ];
  currentThemeSemester = 'all';
  renderThemes();
  const th = [...document.querySelectorAll('#themesList h3')];
  const tb = t => { const h = th.find(x => x.textContent === t); return h ? h.parentElement.querySelectorAll('.new-badge').length : -1; };
  ok(tb('新主題') === 1 && tb('舊主題') === 0, '主題：新主題有 NEW、舊主題沒有（' + tb('新主題') + '／' + tb('舊主題') + '）');

  // C. 英文介面
  const lang = state.lang; state.lang = 'en';
  ok(t('ui.newBadge') === 'NEW' && /last 7 days/.test(t('ui.newBadgeTitle')), '英文介面：NEW 與英文提示');
  state.lang = lang;
  window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
