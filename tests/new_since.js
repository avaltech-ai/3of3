// 「上次來之後有什麼新的」導覽列紅點測試（瀏覽器）：比對純函式、第一次開啟不提示、新開啟時依上次記錄標出新項目、
// 同一次開啟（重新整理）維持、離開頁面紅點消失、「更多」按鈕與面板、開播的焦點算新、過去的活動不算、儲存空間壞掉不出錯。
// 測試期間會改寫 localStorage／sessionStorage 的紅點記錄，結束後還原。需從中文介面開始。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(3000);
  const $ = id => document.getElementById(id);
  const K = { snap: 'nobel_a_seen_v1', base: 'nobel_a_new_base', seen: 'nobel_a_new_seen' };
  const saved = { tab: state.currentTab, snap: localStorage.getItem(K.snap), base: sessionStorage.getItem(K.base), seen: sessionStorage.getItem(K.seen), settings: state.settings };
  const raw = JSON.parse(localStorage.getItem('nobel_a_cached_app_data') || 'null');
  ok(!!raw && Array.isArray(raw.events), '前置：手機裡有快取資料');
  const clone = o => JSON.parse(JSON.stringify(o));
  const today = getTodayDateStr();
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); };
  const dot = el => !!(el && el.querySelector('.new-dot'));
  const side = tab => dot($('tabBtn-' + tab));
  const bar = tab => dot(document.querySelector('#mobileBottomNavItems [data-tab="' + tab + '"]'));
  const freshSession = () => { sessionStorage.removeItem(K.base); sessionStorage.removeItem(K.seen); };
  state.settings = Object.assign({}, state.settings || {}, { mobileNavTabs: ['home', 'albums', 'themes', 'songs'] });
  switchTab('home'); renderMobileBottomNav();

  // A. 純函式
  const d0 = { events: [{ id: 'E1', date: addDays(today, 3) }, { id: 'E2', date: addDays(today, -10) }, { id: 'E3', date: addDays(today, -2), endDate: addDays(today, 1) }, { id: '', date: today }],
    spotlights: [{ id: 'S1', status: '啟用', startDate: addDays(today, -1) }, { id: 'S2', status: '啟用', startDate: addDays(today, 5) }, { id: 'S3', status: '停用' }],
    albums: [{ id: 'A1' }], transitionPlan: [{ id: 'P1' }], transitionArticles: [{ id: 'P1' }] };
  const c0 = newSinceCollect(d0, today);
  ok(c0.events.all.join() === 'E1,E2,E3' && c0.events.eligible.join() === 'E1,E3', '活動：存全部編號；只有今天以後（含跨到今天以後的多日活動）可以算新；沒有編號的略過');
  ok(c0.spotlights.all.join() === 'S1', '焦點：只記「播映中」的（排程中、停用不記）');
  ok(c0.transition.all.join() === 'P1,art:P1', '幼小銜接：計畫與文章編號分開（文章加 art: 前綴，不會撞號）');
  const df = newSinceDiff(c0, { events: ['E1'], albums: [], spotlights: ['S1'] });
  ok(JSON.stringify(df) === JSON.stringify({ home: ['events:E3'], albums: ['albums:A1'] }), '比對：只列起點沒有的；起點沒有該類別（例如幼小銜接）就不提示');
  ok(JSON.stringify(newSinceDiff(c0, null)) === '{}', '沒有起點：不提示');

  // B. 第一次開啟：只記下起點
  localStorage.removeItem(K.snap); freshSession();
  updateNewSince(clone(raw));
  ok(!!localStorage.getItem(K.snap) && !!sessionStorage.getItem(K.base), '第一次開啟：手機記下這次看到的內容（起點）');
  ok(Object.keys(NAV_TAB_META).every(k => !side(k) && !bar(k)) && !dot($('mobileNavMoreBtn')), '第一次開啟：沒有任何紅點');

  // C. 下次開啟：上次記錄裡沒有的就是新的
  const prev = clone(raw);
  const upcoming = (raw.events || []).find(e => (e.endDate || e.date) && normalizeDate(e.endDate || e.date) >= today);
  const past = (raw.events || []).find(e => e.date && normalizeDate(e.endDate || e.date) < today);
  const drop = (arr, id) => (arr || []).filter(x => String(x.id) !== String(id));
  if (upcoming) prev.events = drop(prev.events, upcoming.id);
  if (past) prev.events = drop(prev.events, past.id);
  const alb = raw.albums && raw.albums[0], song = raw.songs && raw.songs[0], art = raw.transitionArticles && raw.transitionArticles[0];
  if (alb) prev.albums = drop(prev.albums, alb.id);
  if (song) prev.songs = drop(prev.songs, song.id);
  if (art) prev.transitionArticles = drop(prev.transitionArticles, art.id);
  ok(!!(upcoming && past && alb && song && art), '前置：資料裡有今天以後的活動、過去的活動、相簿、歌曲、銜接文章可以拿來模擬');
  localStorage.removeItem(K.snap); freshSession(); updateNewSince(prev);   // 上次開啟
  freshSession(); updateNewSince(clone(raw));                             // 這次開啟（新的一次）
  ok(side('home') && bar('home'), '新的活動（今天以後）：「班級日常」紅點（側邊欄與底部導覽）');
  ok((newSince.items.home || []).indexOf('events:' + past.id) === -1, '補登的過去活動：不算新');
  ok(side('albums') && bar('albums') && side('songs') && bar('songs'), '新相簿、新歌曲：「影像記錄」「唱跳音符」紅點');
  ok(side('transition') && !bar('transition') && dot($('mobileNavMoreBtn')), '新銜接文章：側邊欄「幼小銜接」紅點；不在底部 4 格 → 「更多」紅點');
  ok(!side('docs') && !side('themes') && !side('tasks'), '沒有新內容的頁面：沒有紅點');
  ok(Array.from(document.querySelectorAll('.new-dot')).every(d => d.getAttribute('aria-hidden') === 'true') && !!$('tabBtn-albums').querySelector('.new-dot-sr'), '紅點本身對螢幕閱讀器隱藏，另有「（有新內容）」文字');
  openMobileMore(); ok(dot(document.querySelector('#mobileMorePages [data-tab="transition"]')), '打開「更多」：「幼小銜接」那格有紅點'); closeMobileMore();

  // D. 同一次開啟（重新整理、背景同步）維持
  updateNewSince(clone(raw));
  ok(side('albums') && side('home'), '同一次開啟再載入一次資料（重新整理、背景同步）：紅點還在');

  // E. 離開頁面紅點消失
  ok(state.currentTab === 'home' && side('home'), '停在「班級日常」：首頁紅點還在（離開才消失）');
  switchTab('albums'); ok(!side('home') && !bar('home'), '離開「班級日常」：首頁紅點消失');
  ok(side('albums'), '正在看「影像記錄」：紅點還在');
  switchTab('songs'); ok(!side('albums') && !bar('albums'), '離開「影像記錄」：紅點消失');
  updateNewSince(clone(raw)); ok(!side('albums') && !side('home'), '重新整理後：已看過的頁面不會再出現紅點');
  switchTab('transition'); switchTab('home');
  ok(!dot($('mobileNavMoreBtn')), '「更多」裡的頁面都看過：「更多」紅點消失');

  // F. 同一次開啟中途又有新內容（背景同步）：已看過的頁面再出現紅點
  const more = clone(raw); more.albums = (more.albums || []).concat([{ id: 'TEST-NEW-ALBUM', title: 'x' }]);
  updateNewSince(more); ok(side('albums'), '中途同步到新的相簿：「影像記錄」紅點再出現');

  // G. 關掉重開：以上次為起點，沒有新東西就沒有紅點
  freshSession(); updateNewSince(more);
  ok(Object.keys(NAV_TAB_META).every(k => !side(k)), '關掉網站重開（沒有新內容）：沒有紅點');

  // H. 排程中的焦點開播那天算新
  const sp = clone(raw); sp.spotlights = (sp.spotlights || []).concat([{ id: 'SP-TEST', status: '啟用', startDate: addDays(today, 1), title: 'x' }]);
  freshSession(); updateNewSince(sp);
  freshSession(); updateNewSince(sp); ok(!side('home'), '排程中的焦點：還沒開播不算新');
  const sp2 = clone(sp); sp2.spotlights.forEach(s => { if (s.id === 'SP-TEST') s.startDate = today; });
  freshSession(); updateNewSince(sp2); ok((newSince.items.home || []).indexOf('spotlights:SP-TEST') !== -1 && side('home'), '同一則焦點開播後再開網站：算新、首頁紅點');

  // I. 壞掉的記錄、儲存空間不能用
  localStorage.setItem(K.snap, '{壞掉'); freshSession(); let threw = false;
  try { updateNewSince(clone(raw)); } catch (e) { threw = true; }
  ok(!threw && Object.keys(NAV_TAB_META).every(k => !side(k)), '手機裡的記錄壞掉：當作第一次，不出錯、不提示');
  const rg = Storage.prototype.getItem, rs = Storage.prototype.setItem;
  Storage.prototype.getItem = function () { throw new Error('denied'); }; Storage.prototype.setItem = function () { throw new Error('denied'); };
  threw = false; try { updateNewSince(clone(raw)); switchTab('albums'); switchTab('home'); renderNewDots(); } catch (e) { threw = true; }
  Storage.prototype.getItem = rg; Storage.prototype.setItem = rs;
  ok(!threw, '儲存空間被拒絕（無痕模式等）：不出錯');

  // J. 菜單不算、修改不算
  const mm = clone(raw); mm.menus = (mm.menus || []).concat([{ date: addDays(today, 2), id: 'M-TEST' }]);
  if (mm.albums && mm.albums[0]) mm.albums[0].title = '改過的標題';
  freshSession(); updateNewSince(mm); freshSession(); updateNewSince(mm);
  const mm2 = clone(mm); mm2.menus.push({ date: addDays(today, 3), id: 'M-TEST2' }); if (mm2.albums && mm2.albums[0]) mm2.albums[0].title = '又改了';
  freshSession(); updateNewSince(mm2); ok(Object.keys(NAV_TAB_META).every(k => !side(k)), '新增菜單、修改相簿標題：不算新');

  // K. 中英文字
  ok(I18N['zh-TW'].nav.hasNew && I18N.en.nav.hasNew && !/[一-鿿]/.test(I18N.en.nav.hasNew), '「有新內容」有中文與英文');

  // 還原
  const restore = (store, key, v) => { v === null ? store.removeItem(key) : store.setItem(key, v); };
  restore(localStorage, K.snap, saved.snap); restore(sessionStorage, K.base, saved.base); restore(sessionStorage, K.seen, saved.seen);
  state.settings = saved.settings; newSince.items = {}; switchTab(saved.tab || 'home'); renderMobileBottomNav(); renderNewDots();
  const fail = res.filter(r => r.indexOf('✗') === 0).length;
  console.log(res.join('\n')); return { allPass: fail === 0, pass: res.length - fail, fail: fail, res: res };
})();
