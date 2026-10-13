// 學期「主題架構圖」前端測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：架構圖卡片顯示在該學期「最早一週」貼文下方（不是最上方）、依學期篩選、沒有設定／ID 不合法不顯示、縮圖與原圖連結、
// 點圖用照片檢視器放大、惡意學期名稱以純文字顯示、英文介面、舊版後端（沒有 themeOverviews）相容。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { themes: state.themes, ov: state.themeOverviews, sem: currentThemeSemester, lang: state.lang, list: currentAlbumPhotosList, tm: state.textMap };
  state.lang = 'zh-TW'; state.textMap = null;
  const $ = id => document.getElementById(id);
  const ID = '1QMSKstvzHuprCzZTj0MSwDGIuuY-ELHi', ID2 = '1ABCDEFGHIJKLMNOP_qrstuvwxyz-0123';
  const S1 = '115 學年上學期', S2 = '115 學年下學期';
  const th = (id, sem, week, start, name) => ({ id: id, semester: sem, week: week, startDate: start, endDate: start, themeName: name, themeConcept: '概念' + id, goals: [], photos: [], updatedAt: '2026-01-01' });
  const THEMES = [th('t3', S1, '第三週', '2026-08-17', '主題三'), th('t1', S1, '第一週', '2026-08-03', '主題一'), th('t2', S1, '第二週', '2026-08-10', '主題二'), th('b1', S2, '第一週', '2027-02-01', '下學期主題一')]; // 故意亂序
  state.themes = THEMES.map(x => Object.assign({}, x));
  const show = (sem) => { currentThemeSemester = sem; renderThemes(); };
  const kids = () => [...$('themesList').children];
  const kind = c => c.classList.contains('theme-overview') ? 'O' : 'C';
  const seq = () => kids().map(c => kind(c) === 'O' ? 'O(' + c.getAttribute('data-semester').slice(-3) + ')' : (c.textContent.match(/第.週/) || ['?'])[0]).join(' ');
  try { closePhotoViewer(); } catch (e) {}

  // A. 位置：最早一週下方
  state.themeOverviews = { [S1]: ID };
  show(S1);
  ok(seq() === '第三週 第二週 第一週 O(上學期)', '篩選上學期：最新在上，架構圖在最早一週（第一週）下方、整串最後（實際：' + seq() + '）');
  ok(document.querySelectorAll('.theme-overview').length === 1, '只有一張架構圖');
  show('all');
  ok(seq() === '第一週 第三週 第二週 第一週 O(上學期)', '全部學期：下學期（無架構圖）在最上，上學期的架構圖仍接在上學期第一週之後（實際：' + seq() + '）');
  show(S2); ok(seq() === '第一週' && document.querySelectorAll('.theme-overview').length === 0, '篩選下學期（沒有設定）：不顯示架構圖');

  // B. 兩個學期都有
  state.themeOverviews = { [S1]: ID, [S2]: ID2 };
  show('all'); ok(seq() === '第一週 O(下學期) 第三週 第二週 第一週 O(上學期)', '兩個學期都有設定：各自接在自己最早一週之後（實際：' + seq() + '）');
  state.themes = [THEMES[3]].map(x => Object.assign({}, x)); show('all'); ok(seq() === '第一週 O(下學期)', '學期只有一週：架構圖接在那一週之後');
  state.themes = THEMES.map(x => Object.assign({}, x));

  // C. 不顯示的情況
  state.themeOverviews = undefined; show(S1); ok(seq() === '第三週 第二週 第一週', '舊版後端（沒有 themeOverviews）：不顯示、不出錯');
  state.themeOverviews = {}; show(S1); ok(document.querySelectorAll('.theme-overview').length === 0, '空物件：不顯示');
  state.themeOverviews = { [S1]: 'short' }; show(S1); ok(document.querySelectorAll('.theme-overview').length === 0, 'ID 太短：不顯示');
  state.themeOverviews = { [S1]: '"><script>window.__ovpwn=1<\/script>' }; show(S1); ok(document.querySelectorAll('.theme-overview').length === 0 && !window.__ovpwn, 'ID 含惡意字元：不顯示、不執行');
  state.themeOverviews = { [S1]: 123456789012345 }; show(S1); ok(document.querySelectorAll('.theme-overview').length === 0, 'ID 不是字串：不顯示');
  state.themeOverviews = { '不存在的學期': ID }; show(S1); ok(document.querySelectorAll('.theme-overview').length === 0, '設定的學期沒有任何主題：不顯示（沒有貼文可以接）');
  state.themes = []; show('all'); ok($('themesList').classList.contains('hidden'), '完全沒有主題：顯示空狀態、不出錯');
  state.themes = THEMES.map(x => Object.assign({}, x));

  // D. 內容
  state.themeOverviews = { [S1]: ID }; show(S1);
  const ov = document.querySelector('.theme-overview');
  ok(ov.querySelector('h3').textContent.trim() === '📌 115 學年上學期 主題架構圖', '標題：「📌 115 學年上學期 主題架構圖」');
  const im = ov.querySelector('img');
  ok(im.getAttribute('src') === 'https://drive.google.com/thumbnail?id=' + ID + '&sz=w1200' && im.loading === 'lazy', '預覽圖：Drive 縮圖 w1200、延遲載入');
  ok(!ov.querySelector('a') && ov.textContent.indexOf('開啟原圖') < 0 && ov.textContent.indexOf('點圖放大') < 0 && ov.textContent.indexOf('小字') < 0, '沒有「開啟原圖 ↗」連結，也沒有任何說明文字（手機與平板本來就能用螢幕縮放檢視；使用者 2026-10-13 要求）');
  ok(ov.querySelector('h3') && ov.querySelector('button img') && ov.children.length === 2, '卡片只有標題與預覽圖兩部分');

  // E. 點圖放大
  ov.querySelector('button').click();
  ok(!$('photoViewerModal').classList.contains('hidden') && currentAlbumPhotosList.length === 1 && currentAlbumPhotosList[0].id === ID, '點圖：開啟照片檢視器，清單只有這一張');
  ok($('photoViewerImg').getAttribute('src') === 'https://drive.google.com/thumbnail?id=' + ID + '&sz=w2048', '放大用寬 2048 的大圖');
  ok($('photoViewerCounter').textContent === '1 / 1' && /主題架構圖/.test($('photoViewerTitle').textContent), '位置「1 / 1」、標題為「…主題架構圖」');
  closePhotoViewer(); ok($('photoViewerModal').classList.contains('hidden'), '可關閉');

  // F. 安全：惡意學期名稱
  const EVIL = '<img src=x onerror=window.__ovpwn=2>學期';
  state.themes = [th('e1', EVIL, '第一週', '2026-08-03', '惡意學期的主題')]; state.themeOverviews = { [EVIL]: ID }; show('all');
  const ev = document.querySelector('.theme-overview');
  ok(!!ev && !window.__ovpwn && !ev.querySelector('h3 img') && ev.querySelector('h3').textContent.indexOf('<img') >= 0 && ev.getAttribute('data-semester') === EVIL, '學期名稱含標籤：標題以純文字顯示、沒有注入元素、data 屬性完整保留');
  ev.querySelector('button').click(); ok(!$('photoViewerModal').classList.contains('hidden') && !window.__ovpwn, '惡意名稱的架構圖仍可正常放大');
  closePhotoViewer();
  const EVIL2 = 'q" onfocus="window.__ovpwn=3" autofocus x="';
  state.themes = [th('e2', EVIL2, '第一週', '2026-08-03', '引號學期')]; state.themeOverviews = { [EVIL2]: ID }; show('all');
  const ev2 = document.querySelector('.theme-overview'), b2 = ev2 && ev2.querySelector('button');
  ok(!!b2 && !b2.hasAttribute('onfocus') && !ev2.hasAttribute('onfocus') && b2.getAttribute('data-semester') === EVIL2 && ev2.getAttribute('data-semester') === EVIL2, '學期名稱含雙引號（企圖跳出屬性）：屬性值完整保留、沒有多出 onfocus 之類的屬性');
  b2.click(); ok(!$('photoViewerModal').classList.contains('hidden'), '含引號的學期名稱：點圖仍能放大'); closePhotoViewer();
  state.themes = THEMES.map(x => Object.assign({}, x));

  // G. 英文
  state.lang = 'en'; state.textMap = null; state.themeOverviews = { [S1]: ID }; show(S1);
  const oe = document.querySelector('.theme-overview');
  ok(/Theme Overview/.test(oe.querySelector('h3').textContent) && !oe.querySelector('a') && oe.textContent.indexOf('Open original') < 0 && oe.textContent.indexOf('Tap to enlarge') < 0, '英文介面：標題「Theme Overview」，同樣沒有連結與說明文字');
  state.lang = 'zh-TW';

  // H. 既有功能不受影響
  show(S1); ok(kids().filter(c => kind(c) === 'C').length === 3 && kids().every(c => c.textContent.indexOf('概念') >= 0 || kind(c) === 'O'), '主題卡片本身內容照舊（3 張，含主題概念）');
  state.themeOverviews = { [S1]: ID }; renderAdminThemesList(); ok(true, '後台主題列表照常渲染（不出錯）');

  // I. 後端資料進來：handleDataLoaded 會把 data.themeOverviews 放進 state，並在主題頁畫出架構圖
  try {
    const cached = JSON.parse(localStorage.getItem('nobel_a_cached_app_data') || 'null'); const d0 = cached && (cached.data || cached);
    if (d0 && Array.isArray(d0.themes) && d0.themes.length) {
      const sem0 = d0.themes[0].semester;
      realHandle(Object.assign({}, d0, { themeOverviews: { [sem0]: ID } }));
      ok(state.themeOverviews && state.themeOverviews[sem0] === ID, '收到後端資料：themeOverviews 放進 state');
      currentThemeSemester = sem0; renderThemes(); ok(document.querySelectorAll('.theme-overview').length === 1 && kids().pop().classList.contains('theme-overview'), '收到後端資料後主題頁：架構圖顯示在該學期最後（最早一週）之後');
      const dOld = Object.assign({}, d0); delete dOld.themeOverviews; realHandle(dOld); ok(JSON.stringify(state.themeOverviews) === '{}', '後端資料沒有 themeOverviews（舊版後端）：state 退回空物件');
      realHandle(Object.assign({}, d0, { themeOverviews: 'bad' })); ok(JSON.stringify(state.themeOverviews) === '{}', 'themeOverviews 不是物件：忽略');
    } else { ok(true, '（略過：沒有可用的快取資料）'); }
  } catch (e) { ok(false, '送入後端資料時出錯：' + e.message); }

  state.themes = saved.themes; state.themeOverviews = saved.ov; currentThemeSemester = saved.sem; state.lang = saved.lang; currentAlbumPhotosList = saved.list; state.textMap = saved.tm; window.handleDataLoaded = realHandle;
  try { renderThemes(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
