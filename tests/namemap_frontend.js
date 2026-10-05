// 名稱對照表前端測試（在瀏覽器頁面內執行；用法見 tests/README.md）
// 驗證：tn()／nameEn() 的翻譯與備援、對照表過濾、各顯示點（相簿、文件、歌曲、學期、活動對象）、
//       篩選功能仍以中文原名運作、搜尋同時比對中英文、切換語言即時更新、惡意內容被跳脫。
(function () {
  window.__nameMapFrontendTest = async function () {
    const R = {}; const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const text = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
    const saved = { lang: state.lang, nameMap: state.nameMap, sel: state.selectedAlbumCategories, ssel: state.selectedSongCategories };
    // 測試期間，背景的雲端資料更新（handleDataLoaded）不可清掉測試用的對照（目前線上資料可能還沒有 nameMap 欄位）
    const realHDL = window.handleDataLoaded; let pinnedMap = null;
    window.handleDataLoaded = function (d) { realHDL(d); if (pinnedMap) state.nameMap = pinnedMap; };
    const pin = function () { pinnedMap = state.nameMap; };
    const containerId = function (fn) { const m = String(fn).match(/getElementById\('([A-Za-z0-9_-]+)'\)/); return m ? m[1] : null; };

    // ── 純函式 ──
    R.t1_normName = { pass: normName('諾貝爾 A ') === '諾貝爾 A' && normName('  米羅   A　 ') === '米羅 A' && normName('\n幸福\t廚房\r') === '幸福 廚房' && normName(null) === '' && normName(undefined) === '' && normName(123) === '123' };
    setNameMap({ '幸福廚房': 'Happy Kitchen', '諾貝爾 A ': 'Nobel A', '兩果': '', '空白': '   ', '非字串': 123, '物件': { a: 1 }, '  ': 'blank key', '長': 'x'.repeat(300), '__proto__': 'polluted', 'constructor': 'ctor' });
    state.lang = 'en';
    R.t2_translate = { pass: tn('幸福廚房') === 'Happy Kitchen' && tn(' 幸福廚房 ') === 'Happy Kitchen' && tn('諾貝爾 A') === 'Nobel A' && tn('諾貝爾 A ') === 'Nobel A' };
    R.t3_fallbackToChinese = { pass: tn('兩果') === '兩果' && tn('空白') === '空白' && tn('非字串') === '非字串' && tn('物件') === '物件' && tn('完全沒有的名稱') === '完全沒有的名稱' && tn('') === '' && tn(null) === '' };
    R.t4_longTruncated = { pass: tn('長').length === 100 };
    R.t5_noPrototypeIssues = { pass: tn('toString') === 'toString' && tn('hasOwnProperty') === 'hasOwnProperty' && tn('__proto__') === '__proto__' && tn('constructor') === 'ctor' && Object.getPrototypeOf(state.nameMap) === null };
    state.lang = 'zh-TW';
    R.t6_chineseUnchanged = { pass: tn('幸福廚房') === '幸福廚房' && tn('諾貝爾 A') === '諾貝爾 A' };
    R.t7_nameEnRegardlessOfLang = { pass: nameEn('幸福廚房') === 'Happy Kitchen' && nameEn('沒有') === '' };
    setNameMap(undefined); setNameMap(null); setNameMap([1, 2]); setNameMap('abc'); setNameMap(5);
    R.t8_badInputsSafe = { pass: Object.keys(state.nameMap).length === 0 && tn('幸福廚房') === '幸福廚房' };

    // ── 實際畫面（以真實資料的名稱建立對照，每個名稱對應一個英文代號）──
    const albumCats = (state.albumCategories || []).slice(), songCats = (state.songCategories || []).filter(function (c) { return /[㐀-鿿]/.test(c); }), docCats = (state.docCategories || []).filter(function (c) { return c !== '全部文件' && c !== '全部'; });
    const sems = (state.themeSemesters || []).slice();
    const evWithTarget = (state.events || []).find(function (e) { return e.target && /,|，/.test('') || (e.target || '').trim(); });
    const targetName = normName((evWithTarget.target || '').split(/[,，]/)[0]);
    const map = {}; const tok = function (kind, i) { return 'en' + kind + String(i); };
    albumCats.forEach(function (c, i) { map[c] = tok('alb', i); }); songCats.forEach(function (c, i) { map[c] = tok('song', i); }); docCats.forEach(function (c, i) { map[c] = tok('doc', i); }); sems.forEach(function (c, i) { map[c] = tok('sem', i); }); map[targetName] = 'enTarget';
    // 刻意留一個沒有英文的相簿類別，驗證備援
    const unmappedAlbumCat = albumCats[albumCats.length - 1]; delete map[unmappedAlbumCat];
    setNameMap(map); pin(); if (state.lang !== 'en') toggleLanguage(); await wait(400);

    // 相簿
    switchTab('albums'); await wait(400); applyAlbumFilters(); await wait(300);
    const albPills = document.getElementById(containerId(renderAlbumCategoryPills));
    const albPillTexts = Array.from(albPills.querySelectorAll('button')).map(function (b) { return text(b); });
    R.t9_albumPills = { texts: albPillTexts.slice(0, 4), pass: albPillTexts.includes('enalb0') && albPillTexts.includes(unmappedAlbumCat) && !albPillTexts.includes(albumCats[0]) };
    const albBadges = Array.from(document.querySelectorAll('#albumsGrid .absolute.top-2.left-2')).map(function (e) { return text(e); });
    const usedCats = new Set((state.cachedAlbums || []).map(function (a) { return a.category; }));
    R.t10_albumBadges = { sample: albBadges.slice(0, 3), pass: albBadges.length > 0 && albBadges.every(function (b) { return /^enalb\d+$/.test(b) || b === unmappedAlbumCat; }) };
    const filterSel = document.getElementById('albumFilter-category');
    const opts = filterSel ? Array.from(filterSel.options).map(function (o) { return { v: o.value, t: o.textContent }; }) : [];
    // 相簿類別下拉選單目前頁面上沒有這個元素（舊程式碼已不會執行）；若日後恢復，選項文字須翻譯、值須維持中文原名
    R.t11_albumSelect = { present: !!filterSel, pass: !filterSel || (opts.some(function (o) { return o.v === albumCats[0] && o.t === 'enalb0'; }) && opts.every(function (o) { return o.v === '' || albumCats.indexOf(o.v) >= 0; })) };
    // 篩選仍用中文原名運作
    const pickCat = Array.from(usedCats).find(function (c) { return map[c]; }) || Array.from(usedCats)[0];
    state.selectedAlbumCategories = new Set([pickCat]); applyAlbumFilters(); await wait(200);
    const expectCount = (state.cachedAlbums || []).filter(function (a) { return String(a.category || '').trim() === pickCat; }).length;
    R.t12_albumFilterStillWorks = { expectCount: expectCount, shown: document.querySelectorAll('#albumsGrid > div').length, pass: expectCount > 0 && document.querySelectorAll('#albumsGrid > div').length === expectCount };
    state.selectedAlbumCategories = new Set(); applyAlbumFilters();
    // 搜尋：英文（有對照）與中文都能搜到
    const kwEl = document.getElementById('albumFilter-keyword');
    kwEl.value = map[pickCat] ? map[pickCat].toLowerCase() : pickCat; applyAlbumFilters(); await wait(200);
    const byEn = document.querySelectorAll('#albumsGrid > div').length; kwEl.value = pickCat; applyAlbumFilters(); await wait(200); const byZh = document.querySelectorAll('#albumsGrid > div').length;
    kwEl.value = ''; applyAlbumFilters();
    // 英文代號只存在於「類別名稱」，所以英文搜尋 = 該類別的相簿數；中文搜尋還會比對標題（標題剛好含同樣文字的相簿也會被搜到），故不少於類別數
    R.t13_albumSearchBoth = { expectCount: expectCount, byEn: byEn, byZh: byZh, pass: expectCount > 0 && byEn === expectCount && byZh >= expectCount };

    // 歌曲
    switchTab('songs'); await wait(400); renderSongCategoryPills(); applySongFilters(); await wait(300);
    const songPills = Array.from(document.getElementById(containerId(renderSongCategoryPills)).querySelectorAll('button')).map(function (b) { return text(b); });
    R.t14_songPills = { texts: songPills, pass: songCats.every(function (c, i) { return songPills.includes('ensong' + i) && !songPills.includes(c); }) && songPills.includes('momo') };
    // 逐張卡片比對：類別徽章必須等於「有對照 → 英文代號；沒有對照（momo、yoyo）→ 原文」
    const filteredSongs = getFilteredSongs(); const songCards = Array.from(document.querySelectorAll('#songsListContainer > div'));
    const badgeMismatch = songCards.filter(function (card, i) { const cat = String((filteredSongs[i] || {}).category || '').trim(); return text(card.querySelector('span.font-extrabold')) !== (map[cat] || cat); }).length;
    R.t15_songBadges = { cards: songCards.length, mismatches: badgeMismatch, pass: songCards.length > 0 && badgeMismatch === 0 && songCards.some(function (c) { return /^ensong/.test(text(c.querySelector('span.font-extrabold'))); }) };
    // 播放視窗的類別徽章
    const firstMapped = (state.songs || []).find(function (sg) { return map[String(sg.category || '').trim()]; });
    let playerBadge = null; try { openSongPlayer(firstMapped.id); playerBadge = text(document.getElementById('songPlayerCategory')); closeSongPlayer(); } catch (e) { playerBadge = 'ERR ' + e.message; }
    R.t15b_playerBadge = { badge: playerBadge, pass: playerBadge === map[String(firstMapped.category || '').trim()] };
    state.selectedSongCategories = new Set([songCats[0]]); applySongFilters(); await wait(200);
    const expectSongs = (state.songs || []).filter(function (s) { return String(s.category || '').trim() === songCats[0]; }).length;
    R.t16_songFilterStillWorks = { expectSongs: expectSongs, shown: document.querySelectorAll('#songsListContainer > div').length, pass: expectSongs > 0 && document.querySelectorAll('#songsListContainer > div').length === expectSongs };
    state.selectedSongCategories = new Set(); applySongFilters();
    document.getElementById('songFilter-keyword').value = 'ensong0'; applySongFilters(); await wait(200);
    R.t17_songSearchEnglish = { shown: document.querySelectorAll('#songsListContainer > div').length, pass: document.querySelectorAll('#songsListContainer > div').length === (state.songs || []).filter(function (s) { return String(s.category || '').trim() === songCats[0]; }).length };
    document.getElementById('songFilter-keyword').value = ''; applySongFilters();

    // 文件（含管理員才有的按鈕不影響）、學期、活動對象
    switchTab('docs'); await wait(300); renderDocCategoriesUI(); renderDocsList(); await wait(200);
    const docPills = Array.from(document.getElementById('docCategoryPills').querySelectorAll('button')).map(function (b) { return text(b); });
    R.t18_docPills = { texts: docPills, pass: docCats.every(function (c, i) { return docPills.includes('endoc' + i); }) && docPills.length > 0 };
    switchTab('themes'); await wait(400); initThemeFilters(); renderThemes(); await wait(200);
    const semSel = document.getElementById('themeSemesterFilter');
    const semOpts = semSel ? Array.from(semSel.options).map(function (o) { return { v: o.value, t: o.textContent }; }) : [];
    R.t19_semester = { opts: semOpts, pass: semOpts.some(function (o) { return o.v === sems[0] && o.t === 'ensem0'; }) && semOpts.some(function (o) { return o.v === 'all'; }) };
    R.t20_semesterOnCards = { pass: document.getElementById('themesList') ? document.getElementById('themesList').textContent.includes('ensem0') && !document.getElementById('themesList').textContent.includes(sems[0]) : false };
    switchTab('home'); await wait(300); state.selectedDateStr = evWithTarget.date; renderSelectedDayDetails(evWithTarget.date); await wait(200);
    R.t21_targetBadge = { pass: text(document.getElementById('selectedDayEventsList')).includes('enTarget') };

    // 中文介面：完全不受影響
    toggleLanguage(); await wait(400);
    switchTab('albums'); await wait(300); applyAlbumFilters(); await wait(200);
    R.t22_chineseUnaffected = { pass: Array.from(document.getElementById(containerId(renderAlbumCategoryPills)).querySelectorAll('button')).map(function (b) { return text(b); }).includes(albumCats[0]) && !document.getElementById('albumsGrid').textContent.includes('enalb') };
    toggleLanguage(); await wait(400); switchTab('albums'); await wait(200);
    R.t23_liveSwitchBack = { pass: Array.from(document.getElementById(containerId(renderAlbumCategoryPills)).querySelectorAll('button')).map(function (b) { return text(b); }).includes('enalb0') };

    // 惡意內容：對照表的英文含 HTML → 只當文字顯示，不產生元素
    const evil = Object.assign({}, map); evil[albumCats[0]] = '<img src=x onerror=window.__nm_xss=1>';
    window.__nm_xss = 0; setNameMap(evil); pin(); applyAlbumFilters(); renderAlbumCategoryPills(); await wait(500);
    R.t24_xssEscaped = { pass: document.querySelectorAll('#albumsGrid img[src="x"], #' + containerId(renderAlbumCategoryPills) + ' img').length === 0 && window.__nm_xss === 0 && text(document.getElementById(containerId(renderAlbumCategoryPills))).includes('<img src=x') };

    // 還原
    window.handleDataLoaded = realHDL; pinnedMap = null; state.nameMap = saved.nameMap; state.selectedAlbumCategories = saved.sel; state.selectedSongCategories = saved.ssel;
    if (state.lang !== saved.lang) toggleLanguage();
    R.allPass = Object.keys(R).every(function (k) { return k === 'allPass' || (R[k] && R[k].pass === true); });
    return R;
  };
})();
