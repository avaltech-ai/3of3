// 語系稽核（在瀏覽器頁面內執行；用法見 tests/README.md）
// 目的：在英文介面下，找出仍然顯示中文的「程式寫死的介面標籤」。
// 作法：驅動所有畫面渲染 → 掃描所有文字節點與屬性（title/placeholder/alt/aria-label）→
//       先剔除「試算表資料」（活動名稱、歌名…這類使用者輸入的內容本來就不翻譯）→ 剩下含中文的就是漏翻譯。
// 所有網路寫入、confirm/alert/window.open 在稽核期間被替換成無害的假函式。
(function () {
  const IDEO = /[㐀-鿿]/;   // 中日韓表意文字（含「：」「（」等全形符號時，只在同時有漢字才算）

  function collectDataStrings(raw) {
    const set = new Set();
    (function walk(n) {
      if (typeof n === 'string') {
        if (n.length >= 2) set.add(n.trim());
        n.split(/[\n,、，;；|／/]/).forEach(function (p) { p = p.trim(); if (p.length >= 2) set.add(p); });
      } else if (Array.isArray(n)) { n.forEach(walk); }
      else if (n && typeof n === 'object') { Object.keys(n).forEach(function (k) { walk(n[k]); }); }
    })(raw);
    return Array.from(set).sort(function (a, b) { return b.length - a.length; });
  }

  function stripData(text, dataList) {
    let t = text;
    for (let i = 0; i < dataList.length; i++) {
      const d = dataList[i];
      if (d && t.indexOf(d) !== -1) t = t.split(d).join(' ');
    }
    return t;
  }

  window.__i18nAudit = async function (raw) {
    const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const realFetch = window.fetch;
    window.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ success: true }); }, text: function () { return Promise.resolve(''); } }); };
    window.confirm = function () { return true; }; window.alert = function () {}; window.prompt = function () { return ''; }; window.open = function () { return null; };
    // 學期任務：線上資料還沒有時補幾筆假資料（標題等是「使用者輸入的內容」，會被當資料剔除；介面標籤才會被檢查）
    if (!raw.semesterTasks || !raw.semesterTasks.length) {
      raw = Object.assign({}, raw, {
        semesterTasks: [
          { id: 'T1', semester: '115 學年上學期', group: '班級小任務', order: 1, icon: '📖', title: '注重閱讀的品質', description: '同時學習保護書籍。', updatedAt: '2026-10-01' },
          { id: 'T2', semester: '115 學年上學期', group: '家長配合事項', order: 1, icon: '📚', title: '每天共讀一本繪本', description: '請孩子看圖敘述故事。', updatedAt: '2026-10-01' },
          { id: 'T3', semester: '114 學年下學期', group: '班級小任務', order: 1, icon: '🧩', title: '舊學期任務', description: '', updatedAt: '2026-10-01' }
        ],
        taskOverviews: { '115 學年上學期': 'PLACEHOLDEROVERVIEWID0000000001' }
      });
    }
    if (!raw.transitionPlan || !raw.transitionPlan.length) raw = Object.assign({}, raw, { transitionPlan: [
        { id: 'P1', year: '115 學年度', category: '規律生活', order: 1, kind: '在園', text: '8:20-8:40 前入學', updatedAt: '2026-10-01' },
        { id: 'P2', year: '115 學年度', category: '規律生活', order: 2, kind: '在家', text: '21:00-21:30 前上床睡覺', updatedAt: '2026-10-01' },
        { id: 'P3', year: '115 學年度', category: '語文能力', order: 1, kind: '一起', text: '能完整表達自己的需求', updatedAt: '2026-10-01' },
        { id: 'P4', year: '114 學年度', category: '社會能力', order: 1, kind: '一起', text: '去年的項目', updatedAt: '2026-10-01' }
      ], transitionArticles: [{ id: 'A1', order: 1, title: '幼小銜接很重要', source: '未來親子', url: 'https://example.com/a', summary: '第一段\n第二段', points: '📝 第一次評量\n第一次點名', bubbles: '老師怎麼生氣了？\n下課要先喝水嗎？', quote: '先安頓孩子的心', updatedAt: '2026-10-01' }] });
    const dataList = collectDataStrings(raw);
    const errors = [];
    const step = function (name, fn) { try { fn(); } catch (e) { errors.push(name + ': ' + (e && e.message)); } };

    if (state.lang !== 'en') toggleLanguage();
    await wait(500);
    state.adminPassword = 'x'.repeat(64);
    step('handleDataLoaded', function () { handleDataLoaded(raw); });
    step('admin', function () { showAdminDashboard(); });

    const found = {};   // 字串 → { count, where:Set }
    function scanNow(tag) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let n;
      while ((n = walker.nextNode())) {
        const p = n.parentElement; if (!p) continue;
        const tg = p.tagName; if (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'NOSCRIPT') continue;
        const raw0 = (n.nodeValue || '').replace(/\s+/g, ' ').trim(); if (!raw0 || !IDEO.test(raw0)) continue;
        const rest = stripData(raw0, dataList).replace(/\s+/g, ' ').trim();
        if (IDEO.test(rest)) record(rest, p, tag);
      }
      document.querySelectorAll('[title],[placeholder],[alt],[aria-label]').forEach(function (el) {
        ['title', 'placeholder', 'alt', 'aria-label'].forEach(function (a) {
          const v = (el.getAttribute(a) || '').replace(/\s+/g, ' ').trim(); if (!v || !IDEO.test(v)) return;
          const rest = stripData(v, dataList).replace(/\s+/g, ' ').trim();
          if (IDEO.test(rest)) record('[' + a + '] ' + rest, el, tag);
        });
      });
    }
    function record(text, el, tag) {
      const k = text.length > 90 ? text.slice(0, 90) + '…' : text;
      if (!found[k]) found[k] = { count: 0, where: new Set() };
      found[k].count++;
      const host = el.closest('[id]'); found[k].where.add((host ? '#' + host.id : el.tagName.toLowerCase()) + (tag ? ' @' + tag : ''));
    }

    // ── 首頁 ──
    step('home', function () { switchTab('home'); });
    step('calendar', function () { renderCalendar(); });
    const dates = (raw.events || []).map(function (e) { return e.date; }).filter(Boolean);
    const withMenu = (raw.menus || []).map(function (m) { return m.date; }).filter(Boolean);
    [dates[0], dates[Math.floor(dates.length / 2)], withMenu[0], '2026-10-04' /* 週日 */, '2026-10-10' /* 週六 */].filter(Boolean).forEach(function (d) {
      step('day ' + d, function () { state.selectedDateStr = d; renderSelectedDayDetails(d); });
    });
    step('week', function () { renderWeekView(); }); step('month', function () { renderMonthView(); });
    scanNow('home');
    // 焦點活動的三種狀態（尚未開始／進行中／已結束）與彈窗
    const sp0 = JSON.parse(JSON.stringify((raw.spotlights || [])[0] || {}));
    const day = 86400000, iso = function (ms) { return new Date(ms).toISOString().slice(0, 10); };
    [['upcoming', iso(Date.now() + 3 * day), iso(Date.now() + 9 * day)], ['active', iso(Date.now() - day), iso(Date.now() + 5 * day)], ['ended', iso(Date.now() - 9 * day), iso(Date.now() - 3 * day)]].forEach(function (c) {
      step('spotlight ' + c[0], function () {
        state.spotlights = [Object.assign({}, sp0, { startDate: c[1], endDate: c[2], status: '啟用', duration: 5 })];
        state.currentSpotlightIndex = 0; renderSpotlightSection(); openSpotlightModal(); scanNow('spotlight-' + c[0]); closeSpotlightModal && closeSpotlightModal();
      });
    });
    step('restore spotlights', function () { state.spotlights = raw.spotlights || []; renderSpotlightSection(); });

    // ── 主題、相簿、文件、歌曲 ──
    step('themes', function () { switchTab('themes'); renderThemes(); toggleAllThemeCards(); scanNow('themes'); });
    step('albums', function () { switchTab('albums'); renderAlbumCategoryPills(); applyAlbumFilters(); scanNow('albums'); });
    step('album photos', function () { renderAlbumPhotosGrid([{ id: 'p1', name: 'x.jpg', url: 'https://x/y.jpg' }]); currentAlbumPhotosList = [{ id: 'p1', name: 'x.jpg', url: 'https://x/y.jpg' }]; openPhotoViewerByIndex(0); scanNow('photo-viewer'); });
    step('docs', function () { switchTab('docs'); renderDocCategoriesUI(); renderDocsList(); scanNow('docs'); });
    step('tasks', function () { switchTab('tasks'); renderSemesterTasks(); scanNow('tasks'); });
    step('transition plan', function () { switchTab('transition'); switchTransitionView('plan'); renderTransition(); scanNow('transition-plan'); });
    step('transition article', function () { switchTransitionView('article'); scanNow('transition-article'); switchTransitionView('plan'); });
    step('songs', function () { switchTab('songs'); renderSongCategoryPills(); renderSongsList(state.songs || []); scanNow('songs'); });
    step('songs selected', function () { (state.songs || []).slice(0, 2).forEach(function (s) { toggleSelectSong(s.id); }); updateSongsBottomBarUI(); scanNow('songs-selected'); });

    // ── 管理後台（靜態 HTML 也一併掃描）──
    step('admin tabs', function () { switchTab('admin'); showAdminDashboard(); ['events', 'spotlight', 'upload', 'docs', 'songs', 'themes', 'uploadDoc', 'settings'].forEach(function (s) { try { switchAdminSubtab(s); } catch (e) {} }); try { switchAdminSubtab('tasks'); openTaskForm(); scanNow('admin-tasks'); closeTaskFormNow(); } catch (e) {} scanNow('admin'); });

    window.fetch = realFetch;
    const list = Object.keys(found).map(function (k) { return { text: k, count: found[k].count, where: Array.from(found[k].where).slice(0, 4) }; })
      .sort(function (a, b) { return b.count - a.count; });
    return { total: list.length, items: list, renderErrors: errors };
  };
})();
