// XSS 偵測器（在瀏覽器頁面內執行；用法見 tests/README.md）
// 作法：取真實資料，把每個「自由文字」欄位換成攻擊字串，驅動所有畫面渲染，
// 再檢查 DOM 是否被注入元素、事件屬性是否能執行任意程式、網址是否為 javascript:。
// 所有網路寫入、confirm/alert/window.open 都被替換成無害的假函式，不會碰到真實資料。
(function () {
  // 不下毒的欄位：日期、數字、狀態列舉（下毒會讓畫面邏輯本身失效，與 XSS 無關）
  var SKIP = { date: 1, endDate: 1, startDate: 1, updatedAt: 1, priority: 1, duration: 1, photoCount: 1, mediaType: 1, status: 1, id: 0 };
  var URL_KEYS = { downloadUrl: 1, imageUrl: 1, folderUrl: 1, coverUrl: 1, youtubeUrl: 1, url: 1, fileUrl: 1, thumbUrl: 1, activityFolderUrl: 1 };

  function payloadFor(pass, key, isUrlKey) {
    if (pass === 'A') return '"\'><img src=x onerror=__x(\'A:' + key + '\')>';          // 破壞 HTML 結構／屬性
    if (pass === 'B') return '");__x("B:' + key + '");//';                              // 跳出雙引號 JS 字串
    if (pass === 'C') return "');__x('C:" + key + "');//";                              // 跳出單引號 JS 字串
    if (pass === 'D') return isUrlKey ? "javascript:__x('D:" + key + "')" : 'D-text';   // javascript: 網址
    if (pass === 'E') return '&quot;);__x(&quot;E:' + key + '&quot;);//';               // 以 &quot; 編碼的雙引號：測 onclick=\"f(&quot;值&quot;)\" 這種寫法
    if (pass === 'L') return 'L&<>"\'x';                                                // 正常特殊字元：必須原樣顯示，不得被雙重跳脫
    return 'x';
  }

  function poison(node, pass, key) {
    if (typeof node === 'string') return payloadFor(pass, key, !!URL_KEYS[key.split('.').pop()] || /url$/i.test(key));
    if (Array.isArray(node)) return node.map(function (v) { return poison(v, pass, key); });
    if (node && typeof node === 'object') {
      var out = {};
      Object.keys(node).forEach(function (k) {
        out[k] = SKIP[k] ? node[k] : poison(node[k], pass, key ? key + '.' + k : k);
      });
      return out;
    }
    return node;
  }

  window.__xssRun = async function (pass, raw) {
    var hits = [], errors = [];
    window.__x = function (tag) { hits.push(String(tag)); };

    // —— 安全閥：禁止任何真實網路寫入與對話框 ——
    var realFetch = window.fetch;
    window.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ success: true }); }, text: function () { return Promise.resolve(''); } }); };
    window.confirm = function () { return true; };
    window.alert = function () {};
    window.prompt = function () { return ''; };
    window.open = function () { return null; };

    // 確保相簿資料帶有 coverCandidates 欄位，這樣候選照片的路徑也會被下毒測試（即使後端尚未提供該欄位）
    var rawClone = JSON.parse(JSON.stringify(raw));
    (rawClone.albums || []).forEach(function (a) { if (!a.coverCandidates) a.coverCandidates = ['PLACEHOLDERCANDIDATE0001', 'PLACEHOLDERCANDIDATE0002']; });
    var data = poison(rawClone, pass, '');
    // 名稱對照表：以「被下毒後的名稱」當鍵、攻擊字串當英文值（需在英文介面下執行才會被顯示出來）
    var nm = {}, ni = 0;
    function addName(v) { if (typeof v === 'string' && v.trim()) nm[v.trim()] = payloadFor(pass, 'nameMap.' + (ni++), false); }
    (data.albumCategories || []).forEach(addName); (data.docCategories || []).forEach(addName); (data.songCategories || []).forEach(addName); (data.themeSemesters || []).forEach(addName);
    (data.eventTargets || []).forEach(function (t) { addName(t.targetName); });
    (data.events || []).forEach(function (e) { String(e.target || '').split(/[,，]/).forEach(addName); });
    (data.albums || []).forEach(function (a) { addName(a.category); }); (data.songs || []).forEach(function (sg) { addName(sg.category); }); (data.docs || []).forEach(function (d) { addName(d.category); }); (data.themes || []).forEach(function (th) { addName(th.semester); });
    data.nameMap = nm;
    function step(name, fn) { try { fn(); } catch (e) { errors.push(name + ': ' + (e && e.message)); } }

    state.adminPassword = 'x'.repeat(64);
    step('handleDataLoaded', function () { handleDataLoaded(data); });
    step('showAdminDashboard', function () { showAdminDashboard(); });

    // 首頁：月曆、每日詳情、週／月視圖、焦點輪播與彈窗
    step('switchTab home', function () { switchTab('home'); });
    step('renderCalendar', function () { renderCalendar(); });
    (data.events || []).slice(0, 40).forEach(function (ev, i) {
      var d = (raw.events[i] || {}).date; if (!d) return;
      step('day ' + d, function () { state.selectedDateStr = d; renderSelectedDayDetails(d); });
    });
    step('renderWeekView', function () { renderWeekView(); });
    step('renderMonthView', function () { renderMonthView(); });
    step('renderSpotlightSection', function () { renderSpotlightSection(); });
    (data.spotlights || []).forEach(function (_, i) { step('spotlight ' + i, function () { goToSpotlightSlide(i); openSpotlightModal(); }); });

    // 主題活動、相簿、文件、歌曲
    step('switchTab themes', function () { switchTab('themes'); });
    step('renderThemes', function () { renderThemes(); toggleAllThemeCards(); });
    step('switchTab albums', function () { switchTab('albums'); });
    step('albums', function () { renderAlbumCategoryPills(); applyAlbumFilters(); renderAlbumsList(state.cachedAlbums || data.albums || []); });
    step('album photos', function () {
      var photos = [{ id: 'p1', name: payloadFor(pass, 'photo.name'), url: payloadFor(pass, 'photo.url', true), thumbnailUrl: payloadFor(pass, 'photo.thumb', true), downloadUrl: payloadFor(pass, 'photo.dl', true) }];
      renderAlbumPhotosGrid(photos);
      state.currentAlbumPhotos = photos; openPhotoViewerByIndex(0);
    });
    step('switchTab docs', function () { switchTab('docs'); });
    step('renderDocsList', function () { renderDocCategoriesUI(); renderDocsList(); });
    (data.docs || []).forEach(function (d, i) { step('doc edit ' + i, function () { openDocEditModal(d.id); }); });
    step('switchTab songs', function () { switchTab('songs'); });
    step('songs', function () { renderSongCategoryPills(); renderSongsList(state.songs || data.songs || []); });

    // 管理後台各清單
    step('admin events', function () { renderAdminEventsTable(); });
    step('admin spotlights', function () { renderAdminSpotlightsList(); });
    step('admin albums', function () { renderAdminAlbumsTable(); });
    step('admin themes', function () { renderAdminThemesList(); });
    step('admin songs', function () { renderAdminSongsTable(); });
    step('admin drive links', function () { renderFullDriveMonthlyLinks(); });
    step('admin settings', function () { loadSettingsToForm(); });

    await new Promise(function (r) { setTimeout(r, 1200); }); // 讓 <img onerror> 有時間觸發

    var vulns = [];
    // 1) 注入的元素（攻擊字串中的 <img src=x>）
    document.querySelectorAll('img[src="x"]').forEach(function (el) {
      var m = (el.getAttribute('onerror') || '').match(/__x\('([^']+)'\)/);
      vulns.push({ type: 'html-injected', field: m ? m[1] : '?', container: (el.closest('[id]') || {}).id || '(none)' });
    });
    // 2) javascript: 網址
    document.querySelectorAll('[href],[src],[action],[formaction]').forEach(function (el) {
      ['href', 'src', 'action', 'formaction'].forEach(function (a) {
        var v = el.getAttribute(a); if (v && /^\s*javascript:/i.test(v) && v.indexOf('__x(') >= 0) vulns.push({ type: 'javascript-url', field: (v.match(/__x\('([^']+)'\)/) || [])[1] || '?', container: (el.closest('[id]') || {}).id || '(none)' });
      });
    });
    // 3) 事件屬性：實際執行每個 on* 處理器（網路已被替換），看是否能跑到攻擊程式
    var handlerCount = 0;
    document.querySelectorAll('*').forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (at) {
        if (!/^on/i.test(at.name) || at.name.toLowerCase() === 'onerror' && el.tagName === 'IMG' && el.getAttribute('src') === 'x') return;
        if (/location|\.href\s*=|reload\(/.test(at.value)) return;
        handlerCount++;
        var before = hits.length;
        try { new Function('event', at.value).call(el, new Event('click')); } catch (e) { /* 一般執行錯誤不代表漏洞 */ }
        if (hits.length > before) {
          hits.slice(before).forEach(function (h) { vulns.push({ type: 'handler-exec', field: h, container: (el.closest('[id]') || {}).id || '(none)', attr: at.name }); });
        }
      });
    });
    // 4) onerror 實際觸發
    hits.forEach(function (h) { if (!vulns.some(function (v) { return v.field === h; })) vulns.push({ type: 'script-fired', field: h, container: '?' }); });

    var extra = {};
    if (pass === 'L') {
      var clone = document.body.cloneNode(true);                                  // 排除 <script>/<style> 原始碼，只看畫面上的文字
      clone.querySelectorAll('script,style,noscript').forEach(function (n) { n.remove(); });
      var txt = clone.textContent || '';
      extra.literalOccurrences = txt.split('L&<>"\'x').length - 1;     // 原樣顯示的次數（應 > 0）
      var m = txt.match(/.{0,30}(&amp;|&lt;|&gt;|&quot;|&#39;).{0,30}/);
      extra.doubleEscaped = !!m;                                       // 畫面文字出現實體字樣 = 被雙重跳脫（應為 false）
      extra.doubleEscapedSample = m ? m[0] : null;
    }
    window.fetch = realFetch;
    // 去重（同欄位同位置只報一次）
    var seen = {}; vulns = vulns.filter(function (v) { var k = v.type + '|' + v.field + '|' + v.container; if (seen[k]) return false; seen[k] = 1; return true; });
    return { pass: pass, extra: extra, vulnCount: vulns.length, vulns: vulns, handlersExecuted: handlerCount, renderErrors: errors };
  };
})();
