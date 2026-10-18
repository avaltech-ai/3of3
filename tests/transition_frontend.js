// 「幼小銜接」前台與後台（瀏覽器）：側邊欄位置、計畫／文章兩個分頁、能力類別卡片、篩選、勾選（只存在這台裝置）、進度、列印（含勾選／空白）、
// 文章重點卡片／對話泡泡／金句／原文連結、英文、空狀態、跳脫；後台：計畫項目列表與表單（新增／編輯／複製／刪除）、整學年複製、文章表單。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const startLang = state.lang; if (state.lang === 'en') { toggleLanguage(); await wait(300); }   // 中文斷言需要從中文介面開始
  const saved = { plan: state.transitionPlan, arts: state.transitionArticles, pwd: state.adminPassword, tm: state.textMap, lists: JSON.stringify(adminLists.trItems), checks: (function () { try { return localStorage.getItem('nobel_a_transition_checks'); } catch (e) { return null; } })() };
  const real = { confirm: window.confirm, cb: window.callBackend, toast: window.showToast, load: window.loadAppData, print: window.print };
  const $ = id => document.getElementById(id);
  const cbs = [], confirms = [], toasts = []; let answer = true, failNext = '', printed = 0, printHtml = '', printClass = false, printStyle = '';
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.showToast = m => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  window.print = () => { printed++; printHtml = $('printTransitionArea').innerHTML; printClass = document.body.classList.contains('printing-transition'); const st = $('trPrintPageStyle'); printStyle = st ? st.textContent : ''; };
  let seq = 0;
  window.callBackend = (a, p, okCb) => {
    if (a === 'mapStatus') return;   // 進入後台時更新英文對照紅點，與本測試無關
    cbs.push({ a: a, p: p });
    if (failNext === a) { failNext = ''; if (okCb) okCb({ success: false, error: '模擬失敗' }); return; }
    if (!okCb) return;
    if (a === 'saveTransitionItem') okCb({ success: true, itemId: p.data.id || ('TRP-NEW-' + (++seq)), order: p.data.order === '' ? 99 : p.data.order });
    else if (a === 'saveTransitionArticle') okCb({ success: true, articleId: p.data.id || ('TRA-NEW-' + (++seq)), order: p.data.order === '' ? 9 : p.data.order });
    else okCb({ success: true, message: '好了' });
  };
  state.adminPassword = 'tok'.repeat(15);
  const Y = '115 學年度', Y0 = '114 學年度';
  const mk = (id, year, cat, ord, kind, text) => ({ id: id, year: year, category: cat, order: ord, kind: kind, text: text, updatedAt: '2026-10-01' });
  const base = () => [
    mk('r1', Y, '規律生活', 1, '在園', '8:20-8:40 前入學'), mk('r2', Y, '規律生活', 2, '在家', '21:00-21:30 前上床睡覺'), mk('r3', Y, '規律生活', 3, '一起', '學會看時鐘'),
    mk('l1', Y, '語文能力', 1, '在園', '每天故事時間'), mk('l2', Y, '語文能力', 2, '在家', '每日 10-15 分鐘親子共讀時間'), mk('l3', Y, '語文能力', 3, '一起', '能完整表達自己的需求'),
    mk('x1', Y, '自訂類別', 1, '在園', '只有在園的項目'),
    mk('o1', Y0, '規律生活', 1, '在家', '去年的項目')
  ];
  const art = () => [{ id: 'A1', order: 1, title: '「幼小銜接」是整個學齡歷程中最具衝擊性的時刻', source: '文／劉慈惠，刊於未來親子', url: 'https://futureparenting.cwgv.com.tw/family/content/index/36400', summary: '第一段摘要。\n第二段摘要。', points: '📝 第一次正式評量\n第一次被點名回答', bubbles: '老師怎麼突然生氣了？\n下課要先喝水還是先上廁所？', quote: '先安頓孩子的心。', updatedAt: '2026-10-01' }];
  const reset = () => { cbs.length = 0; confirms.length = 0; toasts.length = 0; answer = true; failNext = ''; seq = 0; printed = 0; printHtml = ''; state.transitionPlan = base(); state.transitionArticles = art(); try { localStorage.removeItem('nobel_a_transition_checks'); } catch (e) {} currentTransitionYear = ''; currentTransitionView = 'plan'; currentTransitionFilter = 'all'; Object.assign(adminLists.trItems, { query: '', year: '', cat: '', kind: '', page: 0, size: 10 }); closeTrItemFormNow(); closeTrArtFormNow(); ['trCopyFrom', 'trCopyTo'].forEach(id => { if ($(id)) delete $(id).dataset.touched; }); };
  const cards = () => [...document.querySelectorAll('#trPlanCards .tr-card')];
  const items = () => [...document.querySelectorAll('#trPlanCards .tr-item')];
  const checksBoxes = () => [...document.querySelectorAll('#trPlanCards .tr-check')];
  const rows = () => [...document.querySelectorAll('#trItemListContainer > div')].filter(r => r.querySelector('button[data-act]'));
  const cls = (el, c) => el.className.split(/\s+/).indexOf(c) >= 0;
  reset();

  // A. 側邊欄與頁籤
  const navIds = [...document.querySelectorAll('nav .tab-btn')].map(b => b.id);
  ok(navIds.indexOf('tabBtn-transition') === navIds.indexOf('tabBtn-tasks') + 1 && navIds.indexOf('tabBtn-albums') === navIds.indexOf('tabBtn-transition') + 1, '側邊欄：「幼小銜接」在「學期任務」與「影像記錄」之間');
  ok(/🎒/.test($('tabBtn-transition').textContent) && /幼小銜接/.test($('tabBtn-transition').textContent) && VALID_TABS.indexOf('transition') >= 0, '按鈕「🎒 幼小銜接」；頁籤在重新整理還原的白名單內');
  switchTab('transition');
  ok(!$('tabContent-transition').classList.contains('hidden') && ['home', 'themes', 'tasks', 'albums', 'docs', 'admin'].every(t => $('tabContent-' + t).classList.contains('hidden')), '切到「幼小銜接」：只顯示這一頁');

  // B. 計畫：卡片、標籤、勾選
  ok(!$('trPlanView').classList.contains('hidden') && $('trArticleView').classList.contains('hidden') && $('trViewBtn-plan').getAttribute('aria-selected') === 'true', '預設顯示「銜接計畫」分頁');
  ok(currentTransitionYear === Y && cards().length === 3 && cards().map(c => c.getAttribute('data-category')).join() === '規律生活,語文能力,自訂類別', '預設最新學年度（115）；能力類別卡片依原本順序；去年的項目不出現');
  ok(/⏰/.test(cards()[0].querySelector('h3').textContent) && /🌟/.test(cards()[2].querySelector('h3').textContent) && cls(cards()[0], 'border-sky-200'), '常見類別有專屬圖示與顏色（規律生活 ⏰）；自訂類別用預設 🌟');
  ok(items().length === 7 && checksBoxes().length === 4, '7 個項目，其中「在家」與「一起」4 個有勾選框；「在園」沒有');
  const it0 = items()[0], it1 = items()[1], it2 = items()[2];
  ok(/在園/.test(it0.querySelector('.tr-tag').textContent) && /在家/.test(it1.querySelector('.tr-tag').textContent) && /一起/.test(it2.querySelector('.tr-tag').textContent) && !it0.querySelector('.tr-check'), '標籤：🏫 在園、🏡 在家、🤝 一起');
  ok($('trProgressText').textContent === '0 / 4' && $('trProgressFill').style.width === '0%', '進度：0 / 4');
  const cb = it1.querySelector('.tr-check'); cb.checked = true; cb.dispatchEvent(new Event('change'));
  const stored = JSON.parse(localStorage.getItem('nobel_a_transition_checks') || '{}');
  ok(stored.r2 === 1 && Object.keys(stored).length === 1 && $('trProgressText').textContent === '1 / 4' && $('trProgressFill').style.width === '25%' && cls(it1.querySelector('label span'), 'line-through'), '勾選：存進這台裝置（以項目編號）、進度 1 / 4、文字劃線');
  ok(!cbs.length, '勾選不會呼叫後端（不上傳）');
  renderTransition(); ok(items()[1].querySelector('.tr-check').checked === true, '重畫（或下次打開）時保留勾選');
  cb.checked = false; items()[1].querySelector('.tr-check').checked = false; items()[1].querySelector('.tr-check').dispatchEvent(new Event('change'));
  ok(!JSON.parse(localStorage.getItem('nobel_a_transition_checks') || '{}').r2 && $('trProgressText').textContent === '0 / 4', '取消勾選：移除紀錄');
  localStorage.setItem('nobel_a_transition_checks', '這不是 JSON'); renderTransition(); ok(checksBoxes().every(c => !c.checked) && $('trProgressText').textContent === '0 / 4', '儲存內容損壞：當成沒有勾選，不出錯');

  // C. 篩選
  setTransitionFilter('home');
  ok(items().map(i => i.getAttribute('data-kind')).every(k => k !== '在園') && items().length === 4 && cards().length === 2, '「在家陪伴」：只顯示在家＋一起；沒有可顯示項目的類別（只有在園的自訂類別）整張卡片不出現');
  ok(document.querySelector('#trFilterChips button[data-filter="home"]').getAttribute('aria-pressed') === 'true', '篩選鈕顯示目前選擇');
  setTransitionFilter('school'); ok(items().every(i => i.getAttribute('data-kind') !== '在家') && items().length === 5, '「在園練習」：在園＋一起');
  setTransitionFilter('all'); ok(items().length === 7, '「全部」：回到 7 個');

  // D. 清除勾選與列印
  localStorage.setItem('nobel_a_transition_checks', JSON.stringify({ r2: 1, l3: 1, o1: 1 })); renderTransition();
  answer = false; clearTransitionChecks(); ok(confirms.length === 1 && checksBoxes().filter(c => c.checked).length === 2, '清除勾選：先確認，按取消不清除');
  answer = true; printTransitionPlan(true);
  ok(printed === 1 && printClass && /size: A4 portrait/.test(printStyle), '列印：呼叫列印、暫時加上直式 A4 與列印 class');
  ok(/幼小銜接計畫（115 學年度）/.test(printHtml) && (printHtml.match(/☑/g) || []).length === 2 && (printHtml.match(/☐/g) || []).length === 2 && /<td class="box"><\/td><td>8:20-8:40 前入學/.test(printHtml), '「含我的勾選」：已勾 ☑（2 個）、未勾 ☐（2 個），在園項目沒有方框；去年的勾選不影響');
  ok(/⏰ 規律生活/.test(printHtml) && /🌟 自訂類別/.test(printHtml) && /桃子腳/.test(printHtml), '列印版依類別分段（含圖示）、頁尾有園所與班級');
  await wait(1600); ok(!document.body.classList.contains('printing-transition') && !$('trPrintPageStyle'), '列印後移除列印 class 與直式設定（不影響菜單的橫式列印）');
  printTransitionPlan(false); ok((printHtml.match(/☑/g) || []).length === 0 && (printHtml.match(/☐/g) || []).length === 4, '「空白版」：全部都是空方框');
  clearTransitionChecks(); ok(checksBoxes().every(c => !c.checked) && JSON.parse(localStorage.getItem('nobel_a_transition_checks')).o1 === 1, '確定清除：只清目前學年度的勾選（去年的保留）');
  state.transitionPlan = []; printed = 0; renderTransition(); printTransitionPlan(true);
  ok(printed === 0 && /沒有可以列印/.test(toasts[toasts.length - 1]) && !$('trPlanEmpty').classList.contains('hidden') && $('trPlanToolbar').classList.contains('hidden'), '沒有任何項目：顯示「準備中」、隱藏工具列、列印只提示');
  reset(); switchTab('transition');

  // E. 學年度切換
  ok(!$('trYearFilter').classList.contains('hidden') && [...$('trYearFilter').options].map(o => o.value).join() === Y + ',' + Y0, '有兩個學年度：顯示下拉（新到舊）');
  $('trYearFilter').value = Y0; filterTransitionYear(); ok(items().length === 1 && /去年的項目/.test(items()[0].textContent) && $('trProgressText').textContent === '0 / 1', '切到去年：只顯示去年的項目與進度');
  state.transitionPlan = base().filter(x => x.year === Y); currentTransitionYear = ''; renderTransition();
  ok($('trYearFilter').classList.contains('hidden') && !$('trYearBadge').classList.contains('hidden') && /115 學年度/.test($('trYearBadge').textContent), '只有一個學年度：不顯示下拉，改顯示學年度標籤');
  reset(); switchTab('transition');

  // F. 文章
  switchTransitionView('article');
  ok($('trPlanView').classList.contains('hidden') && !$('trArticleView').classList.contains('hidden') && $('trViewBtn-article').getAttribute('aria-selected') === 'true' && $('trYearFilter').classList.contains('hidden'), '切到「為什麼重要」：顯示文章、隱藏計畫與學年度下拉');
  const ac = document.querySelector('#trArticleList .tr-article');
  ok(!!ac && /最具衝擊性的時刻/.test(ac.querySelector('h3').textContent) && /出處：文／劉慈惠/.test(ac.textContent) && ac.querySelectorAll('p.text-sm').length === 2, '文章卡片：標題、出處、摘要分成兩段');
  const pts = [...ac.querySelectorAll('.tr-point')];
  ok(pts.length === 2 && pts[0].querySelector('span').textContent === '📝' && pts[0].textContent.indexOf('第一次正式評量') >= 0 && pts[1].querySelector('span').textContent === '✨', '重點卡片：行首的表情符號當圖示；沒有的用 ✨');
  const bubs = [...ac.querySelectorAll('.tr-bubble')];
  ok(bubs.length === 2 && cls(bubs[1], 'flex-row-reverse') && /老師怎麼突然生氣了/.test(bubs[0].textContent), '孩子的心聲：對話泡泡，左右交錯');
  ok(/先安頓孩子的心/.test(ac.querySelector('.tr-quote').textContent), '金句橫幅');
  const link = ac.querySelector('a[target="_blank"]');
  ok(link && link.href === 'https://futureparenting.cwgv.com.tw/family/content/index/36400' && link.rel.indexOf('noopener') >= 0 && /閱讀原文/.test(link.textContent), '「閱讀原文 ↗」連結（新分頁、noopener）');
  state.transitionArticles = [Object.assign(art()[0], { url: 'javascript:window.__trpwn=1', title: '<img src=x onerror=window.__trpwn2=1>標題', bubbles: '<b id=tr-b>泡泡</b>', points: '<i id=tr-i>點</i>' })]; renderTransition();
  ok(!document.querySelector('#trArticleList a[target="_blank"]') && !window.__trpwn2 && !$('tr-b') && !$('tr-i') && !document.querySelector('#trArticleList img[src="x"]'), '惡意連結不顯示；惡意標題、泡泡、重點以純文字顯示');
  state.transitionArticles = []; renderTransition(); ok(!$('trArticleEmpty').classList.contains('hidden'), '沒有文章：顯示「整理中」');
  reset(); switchTab('transition');

  // G. 英文
  state.textMap = { '規律生活': 'Daily routine', '學會看時鐘': 'Learn to read a clock' };   // 只用測試自己的對照（不併入線上現有的，否則老師之後補了「語文能力」的英文，「沒有對照就退回中文」就不成立）
  toggleLanguage(); await wait(200); renderTransition();
  ok(/Daily routine/.test(cards()[0].querySelector('h3').textContent) && items().some(i => /Learn to read a clock/.test(i.textContent)) && /Together/.test(items()[2].querySelector('.tr-tag').textContent) && /Our progress/.test($('trPlanToolbar').textContent), '英文介面：類別與項目走對照、標籤與工具列是英文');
  ok(/語文能力/.test(cards()[1].textContent), '沒有對照的類別退回中文');
  toggleLanguage(); await wait(200);

  // H. 跳脫
  reset(); state.transitionPlan = [mk('z1', Y, '<img src=x onerror=window.__trpwn3=1>類別', 1, '一起', '<img src=x onerror=window.__trpwn4=1>項目')]; renderTransition(); renderAdminTransition();
  printTransitionPlan(true);
  ok(!window.__trpwn3 && !window.__trpwn4 && !document.querySelector('#trPlanCards img[src="x"], #trItemListContainer img[src="x"]') && printHtml.indexOf('<img') === -1, '惡意類別與項目：前台卡片、後台列表、列印版都以純文字顯示');
  await wait(1600);

  // I. 後台：頁籤與列表
  reset();
  ok(!!$('adminSubtabBtn-transition') && /幼小銜接/.test($('adminSubtabBtn-transition').textContent) && VALID_ADMIN_SUBTABS.indexOf('transition') >= 0, '後台有「🎒 幼小銜接」頁籤，在還原白名單內');
  switchTab('admin'); switchAdminSubtab('transition');
  ok(!$('adminPanel-transition').classList.contains('hidden') && rows().length === 8 && $('trItemCountBadge').textContent === '共 8 個項目', '進入頁籤就有計畫項目列表（8 筆）');
  ok(rows()[0].textContent.indexOf('8:20-8:40') >= 0 && rows()[7].textContent.indexOf('去年的項目') >= 0, '排序：學年度新到舊，同學年度依類別與順序');
  ok([...rows()[0].querySelectorAll('button[data-act]')].map(b => b.getAttribute('data-act')).join() === 'edit,copy,del', '每列有編輯、複製、刪除圖示');
  adminListOnFilter('trItems', 'kind', '在家'); ok(rows().length === 3, '「誰來做」篩選：在家 3 筆');
  adminListOnFilter('trItems', 'year', Y0); ok(rows().length === 1 && $('adminTrItemsClear').disabled === false, '再加學年度：1 筆，清除篩選可按');
  adminListClear('trItems'); ok(rows().length === 8, '清除篩選');
  adminListOnQuery('trItems', '共讀'); ok(rows().length === 1, '搜尋內容'); adminListClear('trItems');
  ok($('trCopyFrom').value === Y && [...$('trCopyFrom').options].map(o => o.value).join() === Y + ',' + Y0 && $('trCopyTo').value === '116 學年度', '整學年複製：來源只列有項目的學年度、預設最新；目標預設「最新＋1」（116 學年度）');
  ok([...$('trCategoryOptions').options].map(o => o.value).indexOf('生活自理能力') >= 0 && [...$('trCategoryOptions').options].map(o => o.value).indexOf('自訂類別') >= 0, '類別輸入框有建議選項（8 個常見類別＋已用過的）');

  // J. 計畫項目表單
  openTrItemForm();
  ok(!$('trItemFormWrap').classList.contains('hidden') && /新增計畫項目：儲存後會建立一筆新的項目/.test($('trItemFormModeText').textContent) && cls($('trItemFormBox'), 'border-emerald-200') && $('trItemForm-year').value === Y && $('trItemForm-kind').value === '一起', '新增：綠色橫幅、學年度預設最新、誰來做預設「一起」');
  $('trItemForm-category').value = '規律生活'; $('trItemForm-text').value = ''; handleSaveTrItem({ preventDefault() {} }); ok(!cbs.length && /項目內容/.test(toasts[toasts.length - 1]), '沒填內容：提示，不送出');
  $('trItemForm-text').value = '每天看月曆'; $('trItemForm-kind').value = '在家'; handleSaveTrItem({ preventDefault() {} });
  const sc = cbs.filter(c => c.a === 'saveTransitionItem').pop();
  ok(sc && sc.p.data.id === '' && sc.p.data.year === Y && sc.p.data.category === '規律生活' && sc.p.data.kind === '在家' && sc.p.data.order === '' && sc.p.data.text === '每天看月曆', '送出新增：帶學年度、類別、誰來做、內容；順序留白交給後端');
  ok($('trItemFormWrap').classList.contains('hidden') && state.transitionPlan.length === 9 && /已新增項目「每天看月曆」/.test(toasts.join('|')), '成功：表單收起、列表多一筆');
  reset(); switchAdminSubtab('transition'); rows()[1].querySelector('button[data-act="edit"]').click();
  ok($('trItemForm-id').value === 'r2' && /正在編輯既有項目「21:00-21:30 前上床睡覺」/.test($('trItemFormModeText').textContent) && cls($('trItemFormBox'), 'border-amber-400') && $('trItemFormSaveLabel').textContent === '更新原項目' && !$('trItemFormSaveAsNewBtn').classList.contains('hidden'), '編輯：橘色橫幅、「更新原項目」＋「另存為新項目」');
  handleSaveTrItem({ preventDefault() {} }); ok(!cbs.length && /沒有任何變更/.test(toasts[toasts.length - 1]), '沒改就更新：不送出');
  $('trItemForm-text').value = '21:00 前上床睡覺'; answer = false; handleSaveTrItem({ preventDefault() {} });
  ok(confirms.length === 1 && /項目內容：21:00-21:30 前上床睡覺 → 21:00 前上床睡覺/.test(confirms[0]) && !cbs.length, '更新前列出差異；按取消不送出');
  answer = true; handleSaveTrItem({ preventDefault() {} }); ok(cbs[0].p.data.id === 'r2' && state.transitionPlan.find(x => x.id === 'r2').text === '21:00 前上床睡覺' && state.transitionPlan.length === 8, '確定更新：以原編號送出，筆數不變');
  reset(); switchAdminSubtab('transition'); rows()[2].querySelector('button[data-act="copy"]').click();
  ok($('trItemForm-id').value === '' && $('trItemForm-order').value === '' && /以「學會看時鐘」為範本新增/.test($('trItemFormModeText').textContent) && cls($('trItemFormBox'), 'border-sky-300'), '複製：藍色橫幅、沒有編號、順序留白');
  $('trItemForm-text').value = '改一下'; answer = false; confirms.length = 0; closeTrItemForm(); ok(confirms.length === 1 && !$('trItemFormWrap').classList.contains('hidden'), '改到一半按取消：先問，可保留');
  answer = true; closeTrItemForm(); ok($('trItemFormWrap').classList.contains('hidden'), '確定放棄：關閉');
  reset(); switchAdminSubtab('transition'); rows()[0].querySelector('button[data-act="del"]').click();
  ok(confirms.length === 1 && cbs.some(c => c.a === 'deleteTransitionItem' && c.p.id === 'r1') && state.transitionPlan.length === 7, '刪除：先確認，呼叫後端，列表少一筆');
  reset(); failNext = 'deleteTransitionItem'; switchAdminSubtab('transition'); rows()[0].querySelector('button[data-act="del"]').click(); ok(state.transitionPlan.length === 8 && /刪除失敗：模擬失敗/.test(toasts[toasts.length - 1]), '後端刪除失敗：資料保留');

  // K. 整學年複製
  reset(); switchAdminSubtab('transition');
  $('trCopyTo').value = Y; copyTrYear(); ok(!cbs.length && /不能相同/.test(toasts[toasts.length - 1]), '來源等於目標：提示');
  $('trCopyTo').value = Y0; copyTrYear(); ok(!cbs.length && /已經有項目/.test(toasts[toasts.length - 1]), '目標已有項目：前端先擋下');
  $('trCopyTo').value = '116 學年度'; answer = false; copyTrYear(); ok(!cbs.length && /7 個項目/.test(confirms[confirms.length - 1]), '複製前確認（說明筆數）；取消不送出');
  answer = true; copyTrYear(); ok(cbs[0] && cbs[0].a === 'copyTransitionYear' && cbs[0].p.fromYear === Y && cbs[0].p.toYear === '116 學年度' && adminLists.trItems.year === '116 學年度', '確定：呼叫 copyTransitionYear，列表切到新學年度');
  $('trCopyTo').value = '自己打的學年度'; $('trCopyTo').dispatchEvent(new Event('input')); renderAdminTransition(); ok($('trCopyTo').value === '自己打的學年度', '自己輸入過的目標學年度：重畫列表不會被改掉');

  // L. 文章表單
  reset(); switchAdminSubtab('transition');
  ok(document.querySelectorAll('#trArtListContainer > div button[data-act]').length === 3 && /共 1 篇/.test($('trArtCountBadge').textContent), '文章列表：1 篇、編輯／複製／刪除');
  openTrArtForm(); $('trArtForm-title').value = '新文章'; $('trArtForm-url').value = 'javascript:alert(1)'; handleSaveTrArt({ preventDefault() {} });
  ok(!cbs.length && /http/.test(toasts[toasts.length - 1]), '原文連結不是 http(s)：提示，不送出');
  $('trArtForm-url').value = 'https://example.com/a'; $('trArtForm-points').value = '一\n二'; handleSaveTrArt({ preventDefault() {} });
  const sa = cbs.filter(c => c.a === 'saveTransitionArticle').pop();
  ok(sa && sa.p.data.id === '' && sa.p.data.title === '新文章' && sa.p.data.points === '一\n二' && sa.p.data.url === 'https://example.com/a' && state.transitionArticles.length === 2 && $('trArtFormWrap').classList.contains('hidden'), '新增文章：送出所有欄位（多行保留換行）、列表多一篇、表單收起');
  reset(); switchAdminSubtab('transition'); document.querySelector('#trArtListContainer button[data-act="edit"]').click();
  ok($('trArtForm-id').value === 'A1' && $('trArtForm-summary').value === '第一段摘要。\n第二段摘要。' && /正在編輯既有文章/.test($('trArtFormModeText').textContent), '編輯文章：帶入原內容');
  $('trArtForm-summary').value = '改過的摘要'; handleSaveTrArt({ preventDefault() {} });
  ok(confirms.length === 1 && /摘要：（原內容） → （已修改）/.test(confirms[0]) && cbs[0].p.data.id === 'A1', '更新前列出差異（長文字只寫已修改），以原編號送出');
  reset(); switchAdminSubtab('transition'); document.querySelector('#trArtListContainer button[data-act="del"]').click(); ok(cbs.some(c => c.a === 'deleteTransitionArticle' && c.p.id === 'A1') && state.transitionArticles.length === 0, '刪除文章');

  reset(); window.confirm = real.confirm; window.callBackend = real.cb; window.showToast = real.toast; window.loadAppData = real.load; window.print = real.print;
  state.transitionPlan = saved.plan; state.transitionArticles = saved.arts; state.adminPassword = saved.pwd; state.textMap = saved.tm; window.handleDataLoaded = realHandle;
  try { Object.assign(adminLists.trItems, JSON.parse(saved.lists)); } catch (e) {}
  try { if (saved.checks === null) localStorage.removeItem('nobel_a_transition_checks'); else localStorage.setItem('nobel_a_transition_checks', saved.checks); } catch (e) {}
  if (state.lang !== startLang) toggleLanguage();
  try { renderTransition(); renderAdminTransition(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
