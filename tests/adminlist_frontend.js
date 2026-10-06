// 後台列表（活動、相簿、歌曲）搜尋與分頁介面測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 以假資料驗證：預設每頁 10 筆、最新建立在最上面、分頁列（第一頁／上一頁／頁碼／下一頁／最末頁，圖示按鈕且沒有文字）、每頁 20／50／全部與記住選擇、
// 關鍵字／類別／對象／排序、清除篩選、符合筆數、無符合與無資料提示、刪除後頁碼夾回、跳脫（惡意標題）、互不影響。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { events: state.events, albums: state.cachedAlbums, songs: state.songs, evMaj: state.eventCategoriesMajor, evMin: state.eventCategoriesMinor, evTg: state.eventTargets, alCat: state.albumCategories, sgCat: state.songCategories };
  const pad = n => ('0' + n).slice(-2);
  const KEYS = ['events', 'albums', 'songs'];
  const clearStore = () => { try { KEYS.forEach(k => localStorage.removeItem('nobel_a_adminlist_size_' + k)); } catch (e) {} };
  const resetLists = () => { clearStore(); adminLists.events = { query: '', cat: '', target: '', sort: 'new', page: 0, size: 10 }; adminLists.albums = { query: '', cat: '', page: 0, size: 10 }; adminLists.songs = { query: '', cat: '', page: 0, size: 10 }; };
  const $ = id => document.getElementById(id);

  // ---- 假資料 ----
  const MAJ = ['班級主題', '全園活動', '重要活動'], MIN = ['幸福廚房', '慶生活動', '親師座談', ''], TG = ['諾貝爾 A', '全園活動', '米羅 A, 雨果'];
  const evs = Array.from({ length: 30 }, (_, i) => ({ id: 'ev' + i, date: '2026-09-' + pad(1 + (i % 28)), title: '活動' + pad(i), categoryMajor: MAJ[i % 3], categoryMinor: MIN[i % 4], target: TG[i % 3], description: i === 7 ? '請攜帶保鮮盒' : (i < 12 ? '共同說明' : ''), timeLocation: '', calendarPrompt: '' }));
  const CATS = ['班級主題', '全園活動', '健康檢查', '幸福廚房'];
  const albs = Array.from({ length: 25 }, (_, i) => ({ id: String(1791000000 + i), category: CATS[i % 4], title: '相簿' + pad(i), folderName: '資料夾' + pad(i), photoCount: 10 + i, coverUrl: '', updatedAt: '2026-09-' + pad(1 + Math.floor(i / 2)) }));
  const SC = ['桃子腳', 'yoyo', '其他'];
  const sgs = Array.from({ length: 23 }, (_, i) => ({ id: 's' + i, category: SC[i % 3], title: '歌曲' + pad(i), fileName: '檔案' + pad(i) + '.mp3', duration: '02:00', downloadUrl: '' }));
  state.events = evs; state.eventCategoriesMajor = MAJ; state.eventCategoriesMinor = ['幸福廚房', '慶生活動', '親師座談']; state.eventTargets = [{ targetName: '諾貝爾 A ' }, { targetName: '全園活動' }, { targetName: '米羅 A' }, { targetName: '雨果' }];
  state.cachedAlbums = albs; state.albumCategories = CATS; state.songs = sgs; state.songCategories = SC;
  resetLists();

  const rowsOf = key => key === 'events' ? [...document.querySelectorAll('#adminEventsTableContainer tbody tr')] : [...document.querySelectorAll(key === 'albums' ? '#adminAlbumsTableBody tr' : '#adminSongsTableBody tr')];
  const pager = key => $('admin' + key[0].toUpperCase() + key.slice(1) + 'Pager');
  const countText = key => { const c = pager(key).querySelector('.admin-pager-count'); return c ? c.textContent : null; };
  const pageText = key => { const c = pager(key).querySelector('.admin-pager-page'); return c ? c.textContent : null; };
  const btn = (key, where) => pager(key).querySelector('button[data-go="' + where + '"]');
  const render = { events: renderAdminEventsTable, albums: renderAdminAlbumsTable, songs: renderAdminSongsTable };
  const type = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  const pick = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };

  // ===== A. 活動：預設、順序、分頁列 =====
  renderAdminEventsTable();
  ok(rowsOf('events').length === 10, '活動：預設每頁 10 筆');
  ok(countText('events') === '共 30 筆' && pageText('events') === '1 / 3', '活動：顯示「共 30 筆」與頁碼「1 / 3」');
  ok(rowsOf('events')[0].textContent.indexOf('活動29') >= 0 && rowsOf('events')[9].textContent.indexOf('活動20') >= 0, '活動：最新建立（最後一列）在最上面，第 1 頁是活動29～活動20');
  const navBtns = [...pager('events').querySelectorAll('.admin-pager-nav button')];
  ok(navBtns.map(b => b.getAttribute('data-go')).join(',') === 'first,prev,next,last', '分頁列：第一頁、上一頁、下一頁、最末頁 四個按鈕，順序正確');
  ok(navBtns.every(b => b.textContent.trim() === '' && !!b.querySelector('svg') && !!b.getAttribute('aria-label')), '四個按鈕都是圖示（SVG）、沒有文字標籤，並有無障礙名稱');
  ok(btn('events', 'first').disabled && btn('events', 'prev').disabled && !btn('events', 'next').disabled && !btn('events', 'last').disabled, '第 1 頁：第一頁、上一頁停用');
  ok(pager('events').querySelector('.admin-pager-size').value === '10', '每頁筆數下拉預設 10');
  ok([...pager('events').querySelectorAll('.admin-pager-size option')].map(o => o.textContent).join(',') === '10,20,50,全部', '每頁選項：10、20、50、全部');

  btn('events', 'next').click();
  ok(pageText('events') === '2 / 3' && rowsOf('events')[0].textContent.indexOf('活動19') >= 0 && !btn('events', 'first').disabled && !btn('events', 'prev').disabled, '下一頁：第 2 頁（活動19 起），第一頁／上一頁啟用');
  btn('events', 'last').click();
  ok(pageText('events') === '3 / 3' && rowsOf('events').length === 10 && btn('events', 'next').disabled && btn('events', 'last').disabled, '最末頁：第 3 頁，下一頁、最末頁停用');
  btn('events', 'prev').click(); ok(pageText('events') === '2 / 3', '上一頁：回到第 2 頁');
  btn('events', 'first').click(); ok(pageText('events') === '1 / 3', '第一頁：回到第 1 頁');

  // ===== B. 每頁筆數 =====
  const setSize = (key, v) => { const s = pager(key).querySelector('.admin-pager-size'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); };
  btn('events', 'next').click(); setSize('events', '20');
  ok(rowsOf('events').length === 20 && pageText('events') === '1 / 2' && adminLists.events.page === 0, '改每頁 20：回到第 1 頁、共 2 頁、顯示 20 筆');
  ok(localStorage.getItem('nobel_a_adminlist_size_events') === '20' && adminListStoredSize('events') === 20, '每頁筆數記在這台瀏覽器（重新開啟後台會沿用）');
  ok(localStorage.getItem('nobel_a_adminlist_size_albums') === null, '三個列表各記各的（相簿沒有被改動）');
  setSize('events', '50'); ok(rowsOf('events').length === 30 && pager('events').querySelector('.admin-pager-nav') === null && countText('events') === '共 30 筆', '每頁 50：30 筆全部在同一頁，沒有分頁按鈕');
  setSize('events', '0'); ok(rowsOf('events').length === 30 && pager('events').querySelector('.admin-pager-nav') === null && pager('events').querySelector('.admin-pager-size').value === '0', '「全部」：不分頁、顯示全部 30 筆');
  setSize('events', '10'); ok(rowsOf('events').length === 10 && pageText('events') === '1 / 3', '改回 10：恢復分頁');
  localStorage.setItem('nobel_a_adminlist_size_events', '999'); ok(adminListStoredSize('events') === 10, '儲存的值不合法：退回 10');
  localStorage.setItem('nobel_a_adminlist_size_events', '0'); ok(adminListStoredSize('events') === 0, '儲存「全部」可還原（0 不被當成沒有儲存）');
  clearStore();

  // ===== C. 活動：搜尋、類別、對象、排序、清除 =====
  const clearBtn = $('adminEventsClear');
  ok(clearBtn.disabled === true, '沒有篩選時「清除篩選」停用');
  type('adminEventsSearch', '保鮮盒');
  ok(rowsOf('events').length === 1 && rowsOf('events')[0].textContent.indexOf('活動07') >= 0 && countText('events') === '符合 1 筆（共 30 筆）', '關鍵字（說明欄位）：只剩 1 筆，顯示「符合 1 筆（共 30 筆）」');
  ok(clearBtn.disabled === false, '有篩選時「清除篩選」啟用');
  type('adminEventsSearch', '共同說明');
  ok(rowsOf('events').length === 10 && countText('events') === '符合 11 筆（共 30 筆）' && pageText('events') === '1 / 2', '關鍵字「共同說明」符合 11 筆：每頁 10 筆分 2 頁');
  btn('events', 'next').click(); ok(rowsOf('events').length === 1, '第 2 頁剩 1 筆');
  type('adminEventsSearch', '共同說明 ');
  ok(pageText('events') === '1 / 2', '再輸入關鍵字：回到第 1 頁');
  adminListClear('events');
  ok($('adminEventsSearch').value === '' && rowsOf('events').length === 10 && countText('events') === '共 30 筆' && clearBtn.disabled === true, '清除篩選：搜尋框清空、回到全部、按鈕停用');

  const catOpts = [...$('adminEventsCat').querySelectorAll('optgroup')];
  ok(catOpts.map(g => g.label).join(',') === '大項,細項' && catOpts[0].children.length === 3 && catOpts[1].children.length === 3, '類別下拉分「大項」（3）與「細項」（3），空白細項不列出');
  ok($('adminEventsCat').options[0].textContent === '全部類別', '類別下拉第一項「全部類別」');
  pick('adminEventsCat', 'M:班級主題');
  ok(countText('events') === '符合 10 筆（共 30 筆）' && rowsOf('events').length === 10, '類別（大項）班級主題：10 筆');
  pick('adminEventsCat', 'm:幸福廚房');
  const expKit = evs.filter(e => e.categoryMinor === '幸福廚房').length;
  ok(countText('events') === '符合 ' + expKit + ' 筆（共 30 筆）', '類別（細項）幸福廚房：' + expKit + ' 筆');
  pick('adminEventsCat', '');
  const tOpts = [...$('adminEventsTarget').options].map(o => o.textContent);
  ok(tOpts[0] === '全部對象' && tOpts.indexOf('諾貝爾 A') >= 0 && tOpts.indexOf('全園活動') >= 0 && tOpts.indexOf('雨果') >= 0 && tOpts.filter(x => x === '諾貝爾 A').length === 1, '對象下拉：全部對象＋對象清單（去除尾端空白、不重複）');
  pick('adminEventsTarget', '雨果');
  ok(countText('events') === '符合 10 筆（共 30 筆）', '對象「雨果」：10 筆（對象為「米羅 A, 雨果」的活動）');
  pick('adminEventsCat', 'M:班級主題');
  const expBoth = evs.filter(e => e.categoryMajor === '班級主題' && e.target === '米羅 A, 雨果').length;
  ok(countText('events') === (expBoth === 0 ? '符合 0 筆（共 30 筆）' : '符合 ' + expBoth + ' 筆（共 30 筆）'), '類別與對象同時套用：' + expBoth + ' 筆');
  adminListClear('events');
  pick('adminEventsSort', 'dateAsc');
  ok(rowsOf('events')[0].textContent.indexOf('2026-09-01') >= 0 && clearBtn.disabled === false, '排序「日期由舊到新」：第一筆是 2026-09-01；排序也算篩選（可清除）');
  pick('adminEventsSort', 'dateDesc'); ok(rowsOf('events')[0].textContent.indexOf('2026-09-28') >= 0, '排序「日期由新到舊」：第一筆是 2026-09-28');
  pick('adminEventsSort', 'new'); ok(rowsOf('events')[0].textContent.indexOf('活動29') >= 0 && clearBtn.disabled === true, '排序回「最新建立」');
  type('adminEventsSearch', '完全不存在的字');
  ok(rowsOf('events').length === 1 && /沒有符合條件的活動/.test(rowsOf('events')[0].textContent) && countText('events') === '符合 0 筆（共 30 筆）' && pager('events').querySelector('.admin-pager-nav') === null, '沒有符合：顯示「沒有符合條件的活動」，沒有分頁按鈕');
  adminListClear('events');

  // ===== D. 刪除／資料變少後頁碼夾回；新增停留 =====
  btn('events', 'last').click(); ok(pageText('events') === '3 / 3', '（準備）移到最末頁');
  state.events = evs.slice(0, 25); renderAdminEventsTable();
  ok(pageText('events') === '3 / 3' && rowsOf('events').length === 5, '資料變成 25 筆：停留在第 3 頁（剩 5 筆），不跳回第 1 頁');
  state.events = evs.slice(0, 12); renderAdminEventsTable();
  ok(pageText('events') === '2 / 2' && rowsOf('events').length === 2 && adminLists.events.page === 1, '資料變成 12 筆：頁碼夾回最後一頁（2 / 2）');
  state.events = evs.slice(0, 8); renderAdminEventsTable();
  ok(pager('events').querySelector('.admin-pager-nav') === null && rowsOf('events').length === 8 && adminLists.events.page === 0, '不到一頁：自動隱藏分頁按鈕');
  state.events = []; renderAdminEventsTable();
  ok(/目前沒有活動紀錄/.test(rowsOf('events')[0].textContent) && pager('events').children.length === 0, '完全沒有活動：顯示「目前沒有活動紀錄」，不顯示分頁列');
  state.events = evs;
  const saveSrc = handleSaveEvent.toString();
  ok(saveSrc.indexOf('state.events.push(eventData)') >= 0 && saveSrc.indexOf('state.events.unshift') < 0, '新增活動時本機也加在最後（與試算表的新增順序一致，重新整理後順序不變）');

  // ===== E. 跳脫 =====
  state.events = evs.concat([{ id: 'evx', date: '2026-09-30', title: '<img src=x onerror="window.__alpwn=1">惡意', categoryMajor: '<b>粗</b>', categoryMinor: '', target: '<i>x</i>', description: '' }]);
  renderAdminEventsTable();
  ok(!window.__alpwn && document.querySelectorAll('#adminEventsTableContainer img[src="x"], #adminEventsTableContainer b, #adminEventsTableContainer i').length === 0 && rowsOf('events')[0].textContent.indexOf('<img src=x') >= 0, '含標籤的活動名稱、類別、對象：以純文字顯示，不會執行或注入元素');
  type('adminEventsSearch', '<img'); ok(rowsOf('events').length === 1, '可以用含 < 的字搜尋');
  adminListClear('events'); state.events = evs; renderAdminEventsTable();

  // ===== F. 相簿 =====
  renderAdminAlbumsTable();
  ok(rowsOf('albums').length === 10 && countText('albums') === '共 25 筆' && pageText('albums') === '1 / 3', '相簿：預設每頁 10 筆、共 25 筆、1 / 3');
  ok(/共 25 本相簿/.test($('adminAlbumsCountBadge').textContent), '相簿：標題旁「共 25 本相簿」不受篩選影響');
  ok(rowsOf('albums')[0].textContent.indexOf('相簿24') >= 0 && rowsOf('albums')[1].textContent.indexOf('相簿23') >= 0, '相簿：更新日期最新的在最上面，同一天編號大的（相簿24）在前');
  btn('albums', 'last').click(); ok(pageText('albums') === '3 / 3' && rowsOf('albums').length === 5, '相簿：最末頁 5 筆');
  btn('albums', 'first').click();
  ok([...$('adminAlbumsCat').options].map(o => o.textContent).join(',') === '全部活動類別,班級主題,全園活動,健康檢查,幸福廚房', '相簿：類別下拉為「全部活動類別」＋類別清單');
  pick('adminAlbumsCat', '健康檢查'); ok(countText('albums') === '符合 ' + albs.filter(a => a.category === '健康檢查').length + ' 筆（共 25 筆）', '相簿：類別篩選');
  type('adminAlbumsSearch', '資料夾06'); ok(rowsOf('albums').length === 1 && rowsOf('albums')[0].textContent.indexOf('相簿06') >= 0, '相簿：類別「健康檢查」＋關鍵字（資料夾名稱）同時套用');
  type('adminAlbumsSearch', '資料夾04'); ok(rowsOf('albums').length === 1 && /沒有符合條件的相簿/.test(rowsOf('albums')[0].textContent), '相簿：資料夾04 屬於別的類別 → 同時套用時沒有符合');
  pick('adminAlbumsCat', ''); type('adminAlbumsSearch', 'zzz'); ok(/沒有符合條件的相簿/.test(rowsOf('albums')[0].textContent), '相簿：沒有符合 → 「沒有符合條件的相簿」');
  adminListClear('albums'); ok(rowsOf('albums').length === 10 && $('adminAlbumsClear').disabled === true, '相簿：清除篩選');
  btn('albums', 'last').click(); state.cachedAlbums = albs.slice(0, 12); renderAdminAlbumsTable();
  ok(pageText('albums') === '2 / 2' && adminLists.albums.page === 1 && rowsOf('albums').length === 2, '相簿：刪除後資料變少，頁碼夾回最後一頁（2 / 2）');
  state.cachedAlbums = albs; adminListClear('albums');
  setSize('albums', '20'); ok(rowsOf('albums').length === 20 && pageText('albums') === '1 / 2' && localStorage.getItem('nobel_a_adminlist_size_albums') === '20', '相簿：每頁 20 並記住');
  clearStore(); adminLists.albums.size = 10; renderAdminAlbumsTable();

  // ===== G. 歌曲 =====
  renderAdminSongsTable();
  ok(rowsOf('songs').length === 10 && countText('songs') === '共 23 筆' && pageText('songs') === '1 / 3', '歌曲：預設每頁 10 筆、共 23 筆、1 / 3');
  ok(rowsOf('songs')[0].textContent.indexOf('歌曲22') >= 0, '歌曲：最新建立（最後一列）在最上面');
  ok([...$('adminSongsCat').options].map(o => o.textContent).join(',') === '全部類別,桃子腳,yoyo,其他', '歌曲：類別下拉');
  pick('adminSongsCat', 'yoyo'); ok(countText('songs') === '符合 ' + sgs.filter(s => s.category === 'yoyo').length + ' 筆（共 23 筆）', '歌曲：類別篩選');
  type('adminSongsSearch', '檔案05'); ok(rowsOf('songs').length === 1 && /沒有符合條件的歌曲/.test(rowsOf('songs')[0].textContent), '歌曲：類別 yoyo 與檔名「檔案05」（該首是「其他」）同時套用 → 沒有符合');
  pick('adminSongsCat', ''); type('adminSongsSearch', '檔案05'); ok(rowsOf('songs').length === 1 && rowsOf('songs')[0].textContent.indexOf('歌曲05') >= 0, '歌曲：不限類別時用檔名找到歌曲05');
  type('adminSongsSearch', 'zzz'); ok(/沒有符合條件的歌曲/.test(rowsOf('songs')[0].textContent), '歌曲：沒有符合 → 「沒有符合條件的歌曲」');
  adminListClear('songs'); btn('songs', 'last').click(); ok(pageText('songs') === '3 / 3' && rowsOf('songs').length === 3, '歌曲：最末頁 3 筆');
  state.songs = sgs.slice(0, 12); renderAdminSongsTable();
  ok(pageText('songs') === '2 / 2' && adminLists.songs.page === 1 && rowsOf('songs').length === 2, '歌曲：刪除後資料變少，頁碼夾回最後一頁（2 / 2）');
  state.songs = sgs; adminListClear('songs');
  state.songs = []; renderAdminSongsTable(); ok(/目前尚無歌曲/.test(rowsOf('songs')[0].textContent) && pager('songs').children.length === 0, '歌曲：完全沒有資料 → 原本的提示，不顯示分頁列');
  state.songs = sgs;

  // ===== H. 互不影響 =====
  adminLists.events.query = '活動05'; adminLists.albums.query = ''; renderAdminEventsTable(); renderAdminAlbumsTable(); renderAdminSongsTable();
  ok(rowsOf('events').length === 1 && rowsOf('albums').length === 10 && rowsOf('songs').length === 10, '三個列表的篩選互不影響');
  adminListClear('events');

  state.events = saved.events; state.cachedAlbums = saved.albums; state.songs = saved.songs; state.eventCategoriesMajor = saved.evMaj; state.eventCategoriesMinor = saved.evMin; state.eventTargets = saved.evTg; state.albumCategories = saved.alCat; state.songCategories = saved.sgCat;
  resetLists(); try { renderAdminEventsTable(); renderAdminAlbumsTable(); renderAdminSongsTable(); } catch (e) {}
  window.handleDataLoaded = realHandle;
  console.log(res.join('\n')); return res;
})();
