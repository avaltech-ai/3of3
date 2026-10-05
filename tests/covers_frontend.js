// 相簿封面「每天固定一張」前端測試（在瀏覽器頁面內執行；用法見 tests/README.md）
// 驗證：決定性（同一天同一本永遠相同）、每天輪替、分佈、備援、惡意資料過濾、實際渲染與圖片載入失敗時的退回。
(function () {
  window.__coverFrontendTest = async function () {
    const R = {}; const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const cands = Array.from({ length: 12 }, function (_, i) { return 'CANDIDATE' + String(i).padStart(2, '0') + 'abcdefghij'; });
    const alb = { id: 'ALBUM-AAAAAAAAAAAA', title: '測試相簿', category: '班級主題', photoCount: 99, coverUrl: 'https://drive.google.com/thumbnail?id=FIXEDCOVER00001&sz=w600', coverCandidates: cands, folderUrl: 'https://drive.google.com/drive/folders/x', updatedAt: '2026-01-01' };
    const idOf = function (url) { return (url.match(/id=([A-Za-z0-9_-]+)/) || [])[1]; };
    const p = function (a, d) { return pickDailyCoverUrl(a, d); };

    // 1. 決定性：同一天、同一本，不論呼叫幾次都相同
    const day = '2026-10-05'; const first = p(alb, day).url;
    R.t1_deterministic = { pass: Array.from({ length: 50 }, function () { return p(alb, day).url; }).every(function (u) { return u === first; }) };
    // 2. 挑出的一定是候選之一，且使用縮圖尺寸（不下載原圖）
    R.t2_fromCandidates = { pass: cands.indexOf(idOf(first)) >= 0 && /sz=w600$/.test(first) && first.indexOf('https://drive.google.com/thumbnail?id=') === 0 };
    // 3. 每天輪替：60 天內用到多數候選，分佈不偏斜
    const counts = {}; for (let i = 0; i < 60; i++) { const d = new Date(2026, 9, 1 + i); const id = idOf(p(alb, localDateKey(d)).url); counts[id] = (counts[id] || 0) + 1; }
    const used = Object.keys(counts).length, maxShare = Math.max.apply(null, Object.values(counts)) / 60;
    R.t3_rotatesDaily = { used: used, maxSharePct: Math.round(maxShare * 100), pass: used >= 9 && maxShare < 0.3 };
    // 4. 不同相簿同一天不會全部一樣（不是整站同一張照片的 index）
    const albs = Array.from({ length: 12 }, function (_, i) { return Object.assign({}, alb, { id: 'ALBUM-' + String(i).padStart(12, '0') }); });
    const idxSet = new Set(albs.map(function (a) { return cands.indexOf(idOf(p(a, day).url)); }));
    R.t4_albumsDiffer = { distinct: idxSet.size, pass: idxSet.size >= 5 };
    // 5. 隔天會換（12 本相簿中至少多數會變）
    const next = '2026-10-06'; const changed = albs.filter(function (a) { return p(a, day).url !== p(a, next).url; }).length;
    R.t5_changesNextDay = { changed: changed, pass: changed >= 8 };
    // 6. 沒有候選 → 固定封面；連固定封面都沒有 → 內建佔位圖；沒有備援
    const noCand = p(Object.assign({}, alb, { coverCandidates: [] }), day), noAnything = p({ id: 'x', coverUrl: '', coverCandidates: [] }, day), missingField = p({ id: 'x', coverUrl: alb.coverUrl }, day);
    R.t6_fallbacks = { pass: noCand.url === alb.coverUrl && noCand.fallback === '' && noAnything.url === ALBUM_COVER_PLACEHOLDER && missingField.url === alb.coverUrl };
    // 7. 惡意／格式不符的候選被過濾；全部不合法時退回固定封面
    const evil = ['"><img src=x onerror=alert(1)>', 'javascript:alert(1)', 'short', 12345, null, { a: 1 }, 'a b c d e f g h i j'];
    const allBad = p(Object.assign({}, alb, { coverCandidates: evil }), day), mixed = p(Object.assign({}, alb, { coverCandidates: evil.concat(['GOODCANDIDATE001']) }), day);
    R.t7_filtersEvil = { pass: allBad.url === alb.coverUrl && idOf(mixed.url) === 'GOODCANDIDATE001' && !/[<>"' ]/.test(mixed.url) };
    // 8. coverCandidates 不是陣列（被改壞）也不會當掉
    R.t8_notArray = { pass: ['{"a":1}', 'abc', 5, null, undefined, {}].every(function (v) { return p(Object.assign({}, alb, { coverCandidates: v }), day).url === alb.coverUrl; }) };
    // 9. 備援：挑中的候選與固定封面不同時，fallback 為固定封面；相同時不設
    R.t9_fallbackField = { pass: p(alb, day).fallback === alb.coverUrl && p(Object.assign({}, alb, { coverUrl: p(alb, day).url }), day).fallback === '' };
    // 10. 日期鍵格式
    R.t10_dateKey = { pass: /^\d{4}-\d{2}-\d{2}$/.test(localDateKey()) && localDateKey(new Date(2026, 0, 5)) === '2026-01-05' };

    // 11. 實際渲染：src 為當天挑選的候選、data-fb 為固定封面；重新渲染（例如切換語言）封面不變
    //     注意：測試用的候選 ID 是假的，瀏覽器真的去要圖會失敗並觸發 onerror 備援，所以渲染後必須「立即同步讀取」，不可等待。
    const savedAlbums = state.cachedAlbums; const grid = document.getElementById('albumsGrid');
    switchTab('albums'); await wait(300);
    const albB = Object.assign({}, alb, { id: 'ALBUM-BBBBBBBBBBBB', coverCandidates: [], coverUrl: 'https://drive.google.com/thumbnail?id=ONLYFIXED00001&sz=w600' });
    renderAlbumsList([alb, albB]);
    const imgs1 = Array.from(grid.querySelectorAll('img')); const srcs1 = imgs1.map(function (i) { return i.getAttribute('src'); }); const fb1 = imgs1.map(function (i) { return i.dataset.fb; });
    renderAlbumsList([alb, albB]);
    const srcs2 = Array.from(grid.querySelectorAll('img')).map(function (i) { return i.getAttribute('src'); });
    R.t11_render = { pass: srcs1[0] === p(alb).url && fb1[0] === alb.coverUrl && srcs1[1].indexOf('ONLYFIXED00001') > 0 && fb1[1] === '' && JSON.stringify(srcs1) === JSON.stringify(srcs2) };
    // 12. 圖片載入失敗 → 退回固定封面；再次失敗不會無限重試
    renderAlbumsList([alb, albB]);
    const im = grid.querySelectorAll('img')[0]; const picked = im.getAttribute('src');
    im.dispatchEvent(new Event('error')); const afterFirst = im.getAttribute('src');
    im.dispatchEvent(new Event('error')); const afterSecond = im.getAttribute('src');
    R.t12_onerrorFallback = { pass: picked !== alb.coverUrl && afterFirst === alb.coverUrl && afterSecond === alb.coverUrl };
    // 13. 沒有備援的卡片，載入失敗不會改成別的東西
    renderAlbumsList([alb, albB]);
    const im2 = grid.querySelectorAll('img')[1]; const before2 = im2.getAttribute('src'); im2.dispatchEvent(new Event('error'));
    R.t13_noFallbackNoChange = { pass: im2.getAttribute('src') === before2 };
    // 13b. 真實世界：候選 ID 無效（例如照片在 Drive 被刪除）時，瀏覽器收到錯誤後會自動退回固定封面
    renderAlbumsList([alb]); await wait(4000);
    R.t13b_realNetworkFailure = { finalSrc: grid.querySelector('img').getAttribute('src'), pass: grid.querySelector('img').getAttribute('src') === alb.coverUrl };
    // 14. 後台管理表維持固定封面（不隨每日輪替）
    state.cachedAlbums = [alb]; renderAdminAlbumsTable(); await wait(100);
    const adminImg = document.querySelector('#adminAlbumsTableBody img');
    R.t14_adminFixed = { pass: !!adminImg && adminImg.getAttribute('src') === alb.coverUrl };
    state.cachedAlbums = savedAlbums; try { applyAlbumFilters(); } catch (e) {}
    R.allPass = Object.keys(R).every(function (k) { return k === 'allPass' || (R[k] && R[k].pass === true); });
    return R;
  };
})();
