// 列上操作按鈕統一為純圖示的測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證：六個列表（行事曆活動、相簿、歌曲、焦點活動、主題活動、常用文件）的編輯／複製／預覽／再次上架／刪除按鈕都是同一款純圖示按鈕——
// 沒有文字或表情符號、有 title 與 aria-label、同一功能在所有頁面用同一個圖示、順序固定（刪除永遠最後）、點下去會呼叫對應的處理函式；
// 表單上的主要按鈕仍保留文字。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { ev: state.events, al: state.cachedAlbums, so: state.songs, sp: state.spotlights, th: state.themes, dc: state.docs, pwd: state.adminPassword, info: JSON.stringify(adminSongInfo.map) };
  const called = [];
  const stubs = ['editEventInAdmin', 'copyEventInAdmin', 'deleteEventInAdmin', 'openAlbumPhotos', 'openEditAlbumModal', 'deleteAlbumInAdmin', 'editSongInAdmin', 'deleteSongInAdmin', 'openSpotlightEditForm', 'openSpotlightRelistForm', 'confirmDeleteSpotlight', 'editTheme', 'copyThemeInAdmin', 'confirmDeleteTheme', 'openDocEditModal', 'copyDocInAdmin', 'handleDeleteDocDirect'];
  const realFns = {}; stubs.forEach(n => { realFns[n] = window[n]; window[n] = function () { called.push(n + ':' + [].slice.call(arguments).join('|')); }; });
  state.adminPassword = 'tok'.repeat(15);
  const $ = id => document.getElementById(id);
  const svgByKind = {};
  const check = (name, rows, expected, expectedCalls) => {
    ok(rows.length > 0, name + '：有列可檢查（' + rows.length + ' 列）');
    let allOk = true, notes = [];
    rows.forEach(r => {
      const bs = [...r.querySelectorAll('button[data-act]')];
      const kinds = bs.map(b => b.getAttribute('data-act')).join();
      if (kinds !== expected) { allOk = false; notes.push('順序 ' + kinds); }
      bs.forEach(b => {
        if (!/\badmin-act\b/.test(b.className) || !/\bw-9\b/.test(b.className) || !/\bh-9\b/.test(b.className)) { allOk = false; notes.push('樣式'); }
        if (b.textContent.trim() !== '') { allOk = false; notes.push('有文字：' + b.textContent.trim()); }
        if (!b.querySelector('svg') || !b.title || !b.getAttribute('aria-label')) { allOk = false; notes.push('缺 svg／title／aria-label'); }
        const k = b.getAttribute('data-act'); const sv = b.querySelector('svg').innerHTML;
        (svgByKind[k] = svgByKind[k] || {})[name] = sv;
      });
    });
    ok(allOk, name + '：每列的操作按鈕＝' + expected + '，純圖示（無文字／表情符號）、統一樣式、有 title 與 aria-label' + (notes.length ? '（' + notes.slice(0, 3).join('；') + '）' : ''));
    // 點擊
    called.length = 0; const first = rows[0]; [...first.querySelectorAll('button[data-act]')].forEach(b => b.click());
    ok(JSON.stringify(called.map(c => c.split(':')[0])) === JSON.stringify(expectedCalls), name + '：點三顆（或兩顆）按鈕依序呼叫 ' + expectedCalls.join('、') + '（實際：' + called.map(c => c.split(':')[0]).join('、') + '）');
    ok(called.every(c => c.split(':')[1] !== '' ), name + '：呼叫時有帶資料編號');
  };

  // 行事曆活動
  state.events = [{ id: 'E1', date: '2026-10-07', title: '十月份幸福廚房', target: '諾貝爾 A', categoryMajor: '班級主題', categoryMinor: '幸福廚房' }, { id: 'E2', date: '2026-10-08', title: '壽星慶生會', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '慶生活動' }];
  renderAdminEventsTable();
  check('行事曆活動', [...document.querySelectorAll('#adminEventsTableContainer tbody tr')], 'edit,copy,del', ['editEventInAdmin', 'copyEventInAdmin', 'deleteEventInAdmin']);

  // 相簿
  state.cachedAlbums = [{ id: 'a'.repeat(20), category: '戶外踏訪', title: '相簿一', photoCount: 10, videoCount: 2, coverUrl: '', coverCandidates: [], updatedAt: '2026-04-21' }, { id: 'b'.repeat(20), category: '日常生活', title: "含'引號\"的相簿", photoCount: 5, videoCount: 0, coverUrl: '', coverCandidates: [], updatedAt: '2026-04-20' }];
  renderAdminAlbumsTable();
  const alRows = [...document.querySelectorAll('#adminAlbumsTableBody tr')];
  check('相簿', alRows, 'view,edit,del', ['openAlbumPhotos', 'openEditAlbumModal', 'deleteAlbumInAdmin']);
  called.length = 0; [...alRows[1].querySelectorAll('button[data-act]')][0].click(); ok(called[0] && called[0].indexOf("含'引號\"的相簿") >= 0, '相簿：標題含單引號與雙引號也能正確傳給處理函式（沒有弄壞屬性）');

  // 歌曲
  state.songs = [{ id: 'S1', category: '兒歌', title: '歌一', youtubeUrl: 'https://youtu.be/abcdefghijk', youtubeId: 'abcdefghijk', duration: '03:00', fileName: 'a.mp3', fileSize: '100', driveFileId: 'F1', downloadUrl: 'https://x' }, { id: 'S2', category: '兒歌', title: '歌二', youtubeUrl: 'https://youtu.be/abcdefghijl', youtubeId: 'abcdefghijl', duration: '02:00' }];
  adminSongInfo.map = {}; renderAdminSongsTable();
  check('歌曲', [...document.querySelectorAll('#adminSongsTableBody tr')], 'edit,del', ['editSongInAdmin', 'deleteSongInAdmin']);

  // 焦點活動（卡片）
  const today = getTodayDateStr();
  state.spotlights = [{ id: 'P1', title: '焦點一', subtitle: 'x', mediaType: 'image', imageUrl: 'https://example.com/a.jpg', startDate: '2026-10-01', endDate: '2099-12-31', duration: 5, priority: 1, status: '啟用', bulletPoints: '' }, { id: 'P2', title: '焦點二', subtitle: 'y', mediaType: 'image', imageUrl: 'https://example.com/b.jpg', startDate: '2026-10-01', endDate: '2099-12-31', duration: 5, priority: 2, status: '啟用', bulletPoints: '' }];
  renderAdminSpotlightsList();
  const spCards = [...document.querySelectorAll('#spAdminListContainer > div')].filter(c => c.querySelector('.sp-edit-btn'));
  check('焦點活動', spCards, 'edit,relist,del', ['openSpotlightEditForm', 'openSpotlightRelistForm', 'confirmDeleteSpotlight']);
  ok(spCards.length > 0 && spCards[0].querySelector('.sp-relist-btn').title.indexOf('再次上架') >= 0 && spCards[0].querySelector('.sp-relist-btn').getAttribute('aria-label') === '再次上架', '焦點活動：「再次上架」鈕的提示說明沿用原內容與圖片、aria-label 為「再次上架」');

  // 主題活動
  state.themes = [{ id: 'T1', semester: '115 學年上學期', week: '第一週', startDate: '2026-08-03', endDate: '2026-08-07', themeName: '主題一', goals: [], photos: [] }, { id: 'T2', semester: '115 學年上學期', week: '第二週', startDate: '2026-08-10', endDate: '2026-08-14', themeName: '主題二', goals: [], photos: [] }];
  renderAdminThemesList();
  check('主題活動', [...document.querySelectorAll('#adminThemesListBody tr')], 'edit,copy,del', ['editTheme', 'copyThemeInAdmin', 'confirmDeleteTheme']);

  // 常用文件（公開頁的管理員按鈕）
  state.docs = [{ id: 'D1', fileName: '幼兒用藥委託單.pdf', fileExtension: 'pdf', category: '保健用藥', description: '說明', driveFileId: 'F', downloadUrl: 'https://drive.google.com/file/d/D1/view', updatedAt: '2026-10-01' }];
  try { state.docCategory = '全部文件'; } catch (e) {}
  renderDocsList();
  const docCards = [...document.querySelectorAll('#docsListContainer > div')].filter(c => c.querySelector('button[data-act]'));
  check('常用文件', docCards, 'edit,copy,del', ['openDocEditModal', 'copyDocInAdmin', 'handleDeleteDocDirect']);

  // 同一功能＝同一個圖示（跨頁面）
  const same = k => { const vs = Object.values(svgByKind[k] || {}); return vs.length >= 2 && vs.every(v => v === vs[0]); };
  ok(same('edit') && same('del') && same('copy'), '同一功能在所有頁面用同一個圖示：編輯（鉛筆）、複製、刪除（垃圾桶）完全一致（共用同一份向量圖）');
  ok(Object.keys(svgByKind.view || {}).length >= 1 && Object.keys(svgByKind.relist || {}).length >= 1, '預覽（相簿）、再次上架（焦點活動）也是向量圖');
  const kinds = ['view', 'edit', 'copy', 'relist', 'del']; const uniq = new Set(kinds.map(k => (Object.values(svgByKind[k] || {})[0]) || k));
  ok(uniq.size === 5, '五種功能的圖示各不相同');
  const rose = document.querySelector('button[data-act="del"]'), amber = document.querySelector('button[data-act="edit"]'), sky = document.querySelector('button[data-act="copy"]');
  ok(/hover:text-rose-/.test(rose.className) && /hover:text-amber-/.test(amber.className) && /hover:text-sky-/.test(sky.className) && /text-slate-500/.test(rose.className) && !/\btext-rose-/.test(rose.className.replace(/hover:text-rose-\d+/g, '')), '平常是中性灰，只有滑過才依功能變色（刪除＝紅、編輯＝橘、複製＝藍）');

  // 表單上的主要按鈕仍保留文字
  ok($('saveEventBtn').textContent.trim().length > 2 && $('saveMenuBtn').textContent.trim().length > 2 && $('btnSaveTheme').textContent.trim().length > 2 && $('spBtnSaveLabel').textContent.trim().length > 2 && $('songFormSaveBtn').textContent.trim().length > 2, '表單上的主要按鈕（儲存／新增這筆…／更新原…）仍有文字，沒有被改成圖示');
  ok(actBtnHtml('edit', '', { title: '含"雙引號"與<標籤>' }).indexOf('title="含&quot;雙引號&quot;與&lt;標籤&gt;"') >= 0, '按鈕提示文字會跳脫（含雙引號與標籤也不會弄壞屬性）');

  stubs.forEach(n => { window[n] = realFns[n]; });
  state.events = saved.ev; state.cachedAlbums = saved.al; state.songs = saved.so; state.spotlights = saved.sp; state.themes = saved.th; state.docs = saved.dc; state.adminPassword = saved.pwd; window.handleDataLoaded = realHandle;
  try { adminSongInfo.map = JSON.parse(saved.info); } catch (e) {}
  try { renderAdminEventsTable(); renderAdminAlbumsTable(); renderAdminSongsTable(); renderAdminSpotlightsList(); renderAdminThemesList(); renderDocsList(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
