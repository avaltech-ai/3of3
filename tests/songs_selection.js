// 唱跳音符「選取數量／播放內容」連動測試（在瀏覽器頁面內執行；用法見 tests/README.md）
// 規則：底部「已選取 N 首」、播放按鈕提示、實際播放內容，三者都只看「目前篩選範圍內」有勾選的歌；
//       在其他篩選條件下勾選、目前被隱藏的歌會保留（切回去仍打勾），但不計入、也不播放。
// 測試期間 openSongPlayerFromQueue 與 showToast 被替換成假函式，不會真的開播放器。
(function () {
  window.__songSelectionTest = async function () {
    const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const realOpen = window.openSongPlayerFromQueue, realToast = window.showToast;
    let lastQueue = null;
    window.openSongPlayerFromQueue = function () { lastQueue = songPlayerQueue.map(function (s) { return String(s.id); }); };
    window.showToast = function () {};
    const ui = function () { return { count: document.getElementById('bottomBarSelectedCount').textContent, label: document.getElementById('btnPlaySelectedSongs').getAttribute('title'), hint: document.getElementById('bottomBarSelectedCount').title || '' }; };
    const cats = Array.from(new Set(state.songs.map(function (s) { return String(s.category || '').trim(); })));
    const byCat = function (c) { return state.songs.filter(function (s) { return String(s.category || '').trim() === c; }).map(function (s) { return String(s.id); }); };
    const R = {};
    try {
      switchTab('songs'); await wait(600);
      // 取「最少 3 首」「最多」的類別做測試
      const sorted = cats.slice().sort(function (a, b) { return byCat(a).length - byCat(b).length; });
      const small = sorted[0], big = sorted[sorted.length - 1], mid = sorted[Math.floor(sorted.length / 2)];
      const bigLen = byCat(big).length, smallLen = byCat(small).length;
      resetSongFilters(); state.selectedSongIds.clear(); applySongFilters();
      const pickSmall = byCat(small), pickMid = byCat(mid).slice(0, 1), pickBig = byCat(big).slice(0, 2);
      pickSmall.concat(pickMid, pickBig).forEach(toggleSelectSong);
      const total = pickSmall.length + pickMid.length + pickBig.length;

      R.t1_allFilter = { pass: ui().count.indexOf(' ' + total + ' ') >= 0 };
      toggleSongCategoryFilter(small); await wait(150);
      R.t2_filterSmall_countsOnlyVisible = { pass: ui().count.indexOf(' ' + smallLen + ' ') >= 0 && ui().hint.indexOf('另有 ' + (total - smallLen) + ' 首') >= 0 };
      playSelectedSongs();
      R.t2_playOnlyVisibleSelected = { pass: lastQueue.length === smallLen && lastQueue.every(function (id) { return pickSmall.indexOf(id) >= 0; }) };
      toggleSongCategoryFilter(small); toggleSongCategoryFilter(big); await wait(150);
      R.t3_filterBig = { pass: ui().count.indexOf(' ' + pickBig.length + ' ') >= 0 };
      // 畫面上沒有任何勾選 → 數字 0；播放只播目前篩選的全部，絕不播看不見的歌
      toggleSongCategoryFilter(big); toggleSongCategoryFilter(mid); await wait(150);
      const midLen = byCat(mid).length;
      R.t4_nothingVisibleSelected = { pass: ui().count.indexOf(' ' + pickMid.length + ' ') >= 0 };
      state.selectedSongIds.delete(pickMid[0]); applySongFilters(); await wait(100);
      R.t4b_zeroSelected_label = { pass: ui().count.indexOf(' 0 ') >= 0 && ui().label.indexOf('播放全部歌曲 (' + midLen + ' 首)') >= 0 };
      playSelectedSongs();
      R.t4c_playsOnlyCurrentFilter = { pass: lastQueue.length === midLen && lastQueue.every(function (id) { return byCat(mid).indexOf(id) >= 0; }) };
      // 切回去：先前勾選仍保留
      toggleSongCategoryFilter(mid); toggleSongCategoryFilter(small); await wait(150);
      R.t5_selectionKept = { pass: document.querySelectorAll('#songsListContainer input[type=checkbox]:checked').length === smallLen };
      // 全選目前歌曲 → 等於該篩選範圍的總首數，與其他類別無關
      toggleSongCategoryFilter(small); toggleSongCategoryFilter(big); await wait(150);
      state.selectedSongIds.clear(); applySongFilters(); pickBig.forEach(toggleSelectSong); pickSmall.forEach(toggleSelectSong); await wait(100);
      toggleSelectAllFilteredSongs(); await wait(150);
      R.t6_selectAll = { pass: ui().count.indexOf(' ' + bigLen + ' ') >= 0 && document.getElementById('bottomBarSelectAllCheckbox').checked === true };
      toggleSelectAllFilteredSongs(); await wait(150);
      R.t7_deselectAll = { pass: ui().count.indexOf(' 0 ') >= 0 };
      // 搜尋關鍵字、重設
      resetSongFilters(); state.selectedSongIds.clear(); applySongFilters();
      const song = state.songs[0]; toggleSelectSong(song.id);
      document.getElementById('songFilter-keyword').value = '不存在的關鍵字zzz'; applySongFilters(); await wait(150);
      R.t8_keywordNoMatch = { pass: ui().count.indexOf(' 0 ') >= 0 };
      resetSongFilters(); await wait(150);
      R.t9_reset = { pass: ui().count.indexOf(' 1 ') >= 0 };
      // 點歌曲開始播放：佇列只含目前畫面上勾選的歌
      state.selectedSongIds.clear(); applySongFilters(); pickSmall.concat(pickBig).forEach(toggleSelectSong); toggleSongCategoryFilter(small); await wait(150);
      openSongPlayer(pickSmall[0]);
      R.t10_openSongQueue = { pass: lastQueue.length === smallLen };
      // 英文介面
      toggleLanguage(); await wait(400);
      R.t11_english = { pass: /Selected/.test(ui().count) && /Play Selected/.test(ui().label) };
      toggleLanguage(); await wait(200);
    } catch (e) { R.error = String(e && e.message); }
    window.openSongPlayerFromQueue = realOpen; window.showToast = realToast;
    R.allPass = !R.error && Object.keys(R).every(function (k) { return k === 'allPass' || (R[k] && R[k].pass === true); });
    return R;
  };
})();
