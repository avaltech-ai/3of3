// 自由文字英文（TextMap）前台測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md）。
// 驗證 tx() 查表、各顯示位置（活動、菜單、列印、焦點活動、相簿、文件、主題）、查不到退回中文、中文介面不受影響、跳脫、載入與快取。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { lang: state.lang, textMap: state.textMap, events: state.events, menus: state.menus, themes: state.themes, spotlights: state.spotlights, docs: state.docs, albums: state.cachedAlbums, sel: state.selectedDateStr };
  const realLoadTextMap = window.loadTextMap;
  const realToast = window.showToast; window.showToast = function () {};

  const MAP = {
    '八月壽星慶生': 'August Birthday Party', '八月份壽星慶祝活動': 'August birthday celebration', '請家長準時接送': 'Please pick up on time',
    '17:00 開始': 'Starts 17:00', '快樂上學趣': 'Happy School Days', '紅藜雙色饅頭、米漿': 'Quinoa buns, rice milk', '當季水果': 'Seasonal fruit',
    '糙白米飯': 'Brown & white rice', '青椒炒雞柳': 'Stir-fried chicken with green pepper', '木須炒蛋': 'Moo shu eggs', '有機蔬菜': 'Organic vegetables',
    '玉米濃湯': 'Corn chowder', '滑蛋雞肉粥': 'Chicken congee', '本園未使用不合格油品': 'No non-compliant oils are used',
    '書本大探索': 'Big Book Adventure', '喜歡閱讀': 'Loves reading', '聆聽《公主的願望》': 'Listen to "The Princess\'s Wish"', '語-1-5 理解圖畫書': 'Understand picture books',
    '牙齒塗氟日': 'Fluoride Day', '【衛教宣導】正確刷牙示範': '[Health] Proper brushing demo', '【注意事項】請攜帶「健保卡」': '[Notice] Please bring the NHI card',
    '2026.09 諾貝爾 A 大肌肉活動': '2026.09 Nobel A Gross Motor', '牙齒塗氟同意書.pdf': 'Fluoride Consent Form.pdf', '請家長填寫後交回': 'Please fill in and return',
    '惡意': '<img src=x onerror="window.__txpwn=1">'
  };

  // A. tx()
  state.lang = 'zh-TW'; state.textMap = MAP;
  ok(tx('八月壽星慶生') === '八月壽星慶生', '中文介面：原樣回傳（即使有對照表）');
  state.lang = 'en';
  ok(tx('八月壽星慶生') === 'August Birthday Party', '英文介面：查到就顯示英文');
  ok(tx('  八月壽星慶生 ') === 'August Birthday Party' && tx('八月壽星　慶生'.replace('　', '')) === 'August Birthday Party', '前後空白不影響查表');
  ok(tx('沒有翻譯的文字') === '沒有翻譯的文字', '查不到：顯示中文原文');
  ok(tx('【衛教宣導】正確刷牙示範\n\n【注意事項】請攜帶「健保卡」') === '[Health] Proper brushing demo\n\n[Notice] Please bring the NHI card', '多行文字以「行」為單位對照（空行保留）');
  ok(tx('【衛教宣導】正確刷牙示範\n沒翻譯的一行') === '[Health] Proper brushing demo\n沒翻譯的一行', '多行中只有部分有翻譯：有的換英文、沒有的保留中文');
  ok(tx(null) === null && tx(undefined) === undefined && tx('') === '', 'null／undefined／空字串原樣回傳（呼叫端的「沒有就顯示預設」邏輯不變）');
  ok(tx('constructor') === 'constructor' && tx('__proto__') === '__proto__' && tx('toString') === 'toString', '中文以外的關鍵字（constructor、__proto__）不會被原型鏈誤查到');
  state.textMap = null; ok(tx('八月壽星慶生') === '八月壽星慶生', '對照表尚未載入：顯示中文');
  state.textMap = MAP;

  // B. 活動與菜單（每日詳情）
  state.selectedDateStr = '2026-10-07';
  state.events = [{ id: 'E1', date: '2026-10-07', title: '八月壽星慶生', description: '八月份壽星慶祝活動\n請家長準時接送', timeLocation: '17:00 開始', theme: '快樂上學趣', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '' }];
  state.menus = [{ date: '2026-10-07', morningSnack: '紅藜雙色饅頭、米漿', fruit: '當季水果', lunchStaple: '糙白米飯', lunchMain: '青椒炒雞柳', lunchSide1: '木須炒蛋', lunchSide2: '有機蔬菜', lunchSoup: '玉米濃湯', afternoonSnack: '滑蛋雞肉粥', note: '本園未使用不合格油品' }];
  renderSelectedDayDetails('2026-10-07');
  const dayTxt = (document.getElementById('selectedDayEventsList').textContent + document.getElementById('selectedDayMenuList').textContent + document.getElementById('themeNameText').textContent).replace(/\s+/g, ' ');
  ok(/August Birthday Party/.test(dayTxt) && /August birthday celebration/.test(dayTxt) && /Please pick up on time/.test(dayTxt) && /Starts 17:00/.test(dayTxt), '每日詳情：活動標題、說明（兩行）、時間地點為英文');
  ok(/Happy School Days/.test(dayTxt), '每日詳情：學期主題為英文');
  ok(/Quinoa buns, rice milk/.test(dayTxt) && /Seasonal fruit/.test(dayTxt) && /Brown & white rice/.test(dayTxt) && /Stir-fried chicken/.test(dayTxt) && /Moo shu eggs/.test(dayTxt) && /Organic vegetables/.test(dayTxt) && /Corn chowder/.test(dayTxt) && /Chicken congee/.test(dayTxt) && /No non-compliant oils/.test(dayTxt), '每日詳情：菜單所有欄位（早點、水果、主食、主菜、副菜、湯、午點、備註）為英文');
  ok(!/壽星|饅頭|濃湯/.test(dayTxt), '每日詳情：沒有殘留的中文原文');
  state.textMap = {}; renderSelectedDayDetails('2026-10-07');
  ok(/八月壽星慶生/.test(document.getElementById('selectedDayEventsList').textContent) && /紅藜雙色饅頭/.test(document.getElementById('selectedDayMenuList').textContent), '對照表是空的：全部退回中文');
  state.textMap = MAP; state.lang = 'zh-TW'; renderSelectedDayDetails('2026-10-07');
  ok(/八月壽星慶生/.test(document.getElementById('selectedDayEventsList').textContent) && /玉米濃湯/.test(document.getElementById('selectedDayMenuList').textContent), '中文介面：照常顯示中文');
  state.lang = 'en';

  // C. 週檢視、月檢視、列印
  renderWeekView(); const wk = document.getElementById('weekDaysList').textContent.replace(/\s+/g, ' ');
  ok(/August Birthday Party/.test(wk) && /Brown & white rice/.test(wk) && /Chicken congee/.test(wk), '週檢視：活動標題與午餐摘要為英文');
  state.viewYear = 2026; state.viewMonth = 10; renderMonthView(); const mo = document.getElementById('monthEventsTimeline').textContent.replace(/\s+/g, ' ');
  ok(/August Birthday Party/.test(mo) && /August birthday celebration/.test(mo), '全月總覽：標題與說明為英文');
  const pr = buildWeekMenuPrintHtml();
  ok(/Quinoa buns, rice milk/.test(pr) && /Seasonal fruit/.test(pr) && /Brown &amp; white rice, Stir-fried chicken with green pepper, Moo shu eggs, Organic vegetables, Corn chowder/.test(pr) && /Chicken congee/.test(pr), '列印菜單：各欄位為英文（午餐各項以逗號串接）');

  // D. 焦點活動
  state.spotlights = [{ id: 'S1', title: '牙齒塗氟日', subtitle: '日期：2026/10/23 (五) 08:30 起全園分班檢查', bulletPoints: '【衛教宣導】正確刷牙示範\n【注意事項】請攜帶「健保卡」', mediaType: 'image', imageUrl: '', status: 'active', priority: 1, startDate: '2000-01-01', endDate: '2099-12-31', tags: '' }];
  currentSpotlightIndex = 0; renderSpotlightSection();
  ok(document.getElementById('spotlightTitle').textContent.trim() === 'Fluoride Day', '焦點活動標題為英文');
  ok(/Proper brushing demo/.test(document.getElementById('spotlightPoints').textContent) && /NHI card/.test(document.getElementById('spotlightPoints').textContent), '焦點活動重點（逐行）為英文');
  ok(/起全園分班檢查/.test(document.getElementById('spotlightSubtitle').textContent), '焦點活動副標題沒有翻譯 → 顯示中文原文');
  openSpotlightModal(); ok(document.getElementById('modalSpotlightTitle').textContent === 'Fluoride Day' && /Proper brushing demo/.test(document.getElementById('modalSpotlightDesc').textContent), '焦點活動放大視窗：標題與說明為英文');
  document.getElementById('spotlightModal') && document.getElementById('spotlightModal').classList.add('hidden');

  // E. 相簿、文件、主題
  const albums = [{ id: 'a1' + 'x'.repeat(20), title: '2026.09 諾貝爾 A 大肌肉活動', category: '班級主題', photoCount: 3, coverUrl: '', updatedAt: '2020-01-01' }];
  renderAlbumsList(albums);
  ok(document.querySelector('#albumsGrid h4').textContent.trim() === '2026.09 Nobel A Gross Motor', '相簿卡片標題為英文');
  ok(document.querySelector('#albumsGrid img').getAttribute('alt') === '2026.09 Nobel A Gross Motor', '相簿圖片替代文字為英文');
  state.cachedAlbums = albums; document.getElementById('albumSearchInput') && (document.getElementById('albumSearchInput').value = 'gross motor');
  const tx0 = (alb) => (String(alb.title || '') + ' ' + String(tx(alb.title || '') || '')).toLowerCase().includes('gross motor');
  ok(tx0(albums[0]) && !(albums[0].title.toLowerCase().includes('gross motor')), '相簿搜尋：英文介面可用英文關鍵字找到（同時仍可用中文）');
  const realFetch = window.fetch; window.fetch = function () { return new Promise(() => {}); };
  openAlbumPhotos('a1' + 'x'.repeat(20), '2026.09 諾貝爾 A 大肌肉活動');
  ok(document.getElementById('modalAlbumTitle').textContent === '2026.09 Nobel A Gross Motor', '相簿視窗標題為英文');
  closeAlbumModal(); window.fetch = realFetch;

  state.docs = [{ id: 'd1', fileName: '牙齒塗氟同意書.pdf', category: '一般文件', description: '請家長填寫後交回', downloadUrl: 'https://example.com/a', updatedAt: '2020-01-01' }];
  renderDocsList('全部'); const dc = document.getElementById('docsListContainer') ? document.getElementById('docsListContainer').textContent : document.getElementById('tabContent-docs').textContent;
  ok(/Fluoride Consent Form\.pdf/.test(dc) && /Please fill in and return/.test(dc), '常用文件：名稱與說明為英文');

  state.themes = [{ id: 'T1', week: 'W1', themeName: '書本大探索', name: '書本大探索', themeConcept: '喜歡閱讀', concept: '喜歡閱讀', semester: '', startDate: '2026-10-01', updatedAt: '2020-01-01', goals: [{ activity: '聆聽《公主的願望》', course: '語-1-5 理解圖畫書' }], photos: [], results: [] }];
  currentThemeSemester = 'all'; renderThemes(); const th = document.getElementById('themesList').textContent.replace(/\s+/g, ' ');
  ok(/Big Book Adventure/.test(th) && /Loves reading/.test(th) && /Understand picture books/.test(th) && /Listen to "The Princess's Wish"/.test(th), '主題活動：名稱、概念、活動目標與課程目標為英文');

  // F. 跳脫
  state.events = [{ id: 'E2', date: '2026-10-07', title: '惡意', description: '', timeLocation: '', theme: '', target: '全園活動', categoryMajor: '', categoryMinor: '' }];
  renderSelectedDayDetails('2026-10-07');
  ok(!window.__txpwn && document.querySelectorAll('#selectedDayEventsList img').length === 0 && /<img src=x/.test(document.getElementById('selectedDayEventsList').textContent), '對照表內容含惡意 HTML：被跳脫成純文字，不會執行');

  // G. 載入與快取
  let calls = 0, applied = 0; const realCB = window.callBackend, realApply = window.applyTranslations;
  window.applyTranslations = function () { applied++; return realApply.apply(this, arguments); };
  window.callBackend = function (action, payload, okCb) { calls++; if (action === 'getTextMap') okCb({ success: true, map: window.__nextMap }); };
  state.lang = 'en'; state.textMap = null; try { localStorage.removeItem('nobel_a_text_map'); } catch (e) {}
  window.__nextMap = { '甲': 'A' }; loadTextMap();
  ok(state.textMap && state.textMap['甲'] === 'A' && applied === 1, '載入成功：套用對照並重新渲染一次');
  ok(JSON.parse(localStorage.getItem('nobel_a_text_map')).map['甲'] === 'A', '對照存進 localStorage');
  applied = 0; window.__nextMap = { '甲': 'A' }; loadTextMap(); ok(applied === 0, '內容沒變：不重新渲染（避免畫面閃動）');
  window.__nextMap = { '甲': 'A2' }; loadTextMap(); ok(applied === 1 && state.textMap['甲'] === 'A2', '內容有變：重新渲染');
  window.callBackend = function (action, payload, okCb, errCb) { okCb({ success: false, map: {} }); };
  applied = 0; loadTextMap(); ok(state.textMap['甲'] === 'A2' && applied === 0, '後端回報失敗：維持現有對照、不打擾');
  window.callBackend = function (action, payload, okCb, errCb) { errCb(new Error('x')); }; loadTextMap(); ok(state.textMap['甲'] === 'A2', '網路失敗：維持現有對照');
  state.lang = 'zh-TW'; calls = 0; window.callBackend = function () { calls++; }; loadTextMap(); ok(calls === 0, '中文介面：不載入英文對照（零額外請求）');
  state.lang = 'en'; state.textMap = null; localStorage.setItem('nobel_a_text_map', JSON.stringify({ map: { '乙': 'B' } })); primeTextMapFromStorage();
  ok(state.textMap && state.textMap['乙'] === 'B', '先用 localStorage 的上次對照立即顯示');
  state.textMap = null; localStorage.setItem('nobel_a_text_map', '{壞掉'); primeTextMapFromStorage(); ok(!state.textMap, 'localStorage 內容損毀：忽略，不拋錯');
  localStorage.setItem('nobel_a_text_map', JSON.stringify({ map: 'not-object' })); primeTextMapFromStorage(); ok(!state.textMap, 'localStorage 格式不對：忽略');
  window.callBackend = realCB; window.applyTranslations = realApply;
  ok(/getTextMap/.test(String(realCB)), 'callBackend 支援 getTextMap（GET）');

  // 還原
  Object.assign(state, { lang: saved.lang, textMap: saved.textMap, events: saved.events, menus: saved.menus, themes: saved.themes, spotlights: saved.spotlights, docs: saved.docs, cachedAlbums: saved.albums, selectedDateStr: saved.sel });
  window.handleDataLoaded = realHandle; window.showToast = realToast; try { localStorage.removeItem('nobel_a_text_map'); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
