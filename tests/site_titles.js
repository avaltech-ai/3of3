// 後台「系統」組拆成：英文對照／手機導覽列／介面標題／密碼與設定；介面標題（頁首四段、頁尾兩段）的表單、儲存、
// 套用到頁首頁尾、英文介面（內建英文、名稱對照、內容對照）。瀏覽器測試（2026-10-19）。需從剛載入的中文介面開始。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(3500);
  const $ = id => document.getElementById(id);
  const hidden = el => !el || el.classList.contains('hidden');
  const saved = { settings: state.settings, lang: state.lang, nameMap: state.nameMap, textMap: state.textMap, pwd: state.adminPassword, tab: state.currentTab, sub: state.currentAdminSubtab, mo: window.mapAdminOpen };
  const real = { cb: window.callBackend, toast: window.showToast };
  const toasts = [], cbs = []; let respond = null;
  window.showToast = m => { toasts.push(String(m)); };
  window.mapAdminOpen = function () {};
  window.callBackend = (a, p, okCb, errCb) => { cbs.push({ a: a, p: p }); if (respond) return respond(p, okCb, errCb); okCb({ success: true, titles: p.titles }); };
  state.adminPassword = 'tok'.repeat(15);
  const DEF = { headerFoundation: '三之三生命教育基金會', headerSchool: '新北市桃子腳非營利幼兒園', headerClass: '諾貝爾 A 班', headerBadge: 'Happy Life', footerContact: 'TEL：02-2668-8249｜FAX：02-2668-8245', footerMotto: '用愛陪伴孩子成長的每一步' };
  const EN = { headerFoundation: '3&3 Life Education', headerSchool: 'Taozihjiao Kindergarten', headerClass: 'Nobel A Class', headerBadge: 'Happy Life', footerContact: 'TEL：02-2668-8249｜FAX：02-2668-8245', footerMotto: "Accompanying children's growth with love" };
  const PROPS = Object.keys(DEF);
  const shown = () => { const o = {}; PROPS.forEach(p => { o[p] = $(p).textContent; }); return o; };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const reset = () => { toasts.length = 0; cbs.length = 0; respond = null; state.settings = Object.assign({}, saved.settings); PROPS.forEach(p => { state.settings[p] = ''; }); state.lang = 'zh-TW'; state.nameMap = Object.create(null); state.textMap = {}; applyTranslations(); };
  const fld = p => $('siteTitle-' + p);
  const visibleSubtabs = () => Array.from(document.querySelectorAll('.admin-subtab-btn')).filter(b => !hidden(b)).map(b => b.id.replace('adminSubtabBtn-', ''));
  reset();

  // A. 後台頁籤
  ok(same(ADMIN_SUBTAB_GROUPS.system, ['translations', 'mobileNav', 'siteTitles', 'settings']) && VALID_ADMIN_SUBTABS.indexOf('mobileNav') >= 0 && VALID_ADMIN_SUBTABS.indexOf('siteTitles') >= 0, '「系統」組有 4 個子頁籤：英文對照、手機導覽列、介面標題、密碼與設定');
  switchTab('admin'); switchAdminSubtab('mobileNav');
  ok(same(visibleSubtabs(), ['translations', 'mobileNav', 'siteTitles', 'settings']) && /手機導覽列/.test($('adminSubtabBtn-mobileNav').textContent) && /介面標題/.test($('adminSubtabBtn-siteTitles').textContent), '切到系統組：顯示 4 個子頁籤，標籤文字為「手機導覽列」「介面標題」');
  ok(!hidden($('adminPanel-mobileNav')) && hidden($('adminPanel-settings')) && hidden($('adminPanel-siteTitles')) && $('adminPanel-mobileNav').contains($('mobileNavSettingsCard')) && !$('adminPanel-settings').contains($('mobileNavSettingsCard')), '「手機導覽列」是獨立頁面：卡片在自己的面板裡，不在密碼與設定裡');
  ok([1, 2, 3, 4].every(i => $('mobileNavSlot-' + i) && $('mobileNavSlot-' + i).options.length >= 4) && /手機底部導覽列/.test($('adminPanel-mobileNav').textContent), '切到「手機導覽列」：4 個下拉選單已載入');
  switchAdminSubtab('settings');
  ok(!hidden($('adminPanel-settings')) && !!$('setting-newPassword') && !!$('setting-activityFolderUrl') && !/手機底部導覽列/.test($('adminPanel-settings').textContent), '「密碼與設定」只剩密碼與雲端資料夾，不再混著手機導覽列');
  switchAdminSubtab('siteTitles');
  ok(!hidden($('adminPanel-siteTitles')) && document.querySelectorAll('.admin-panel:not(.hidden)').length === 1 && $('adminSubtabBtn-siteTitles').classList.contains('bg-peach-500'), '切到「介面標題」：只顯示這個面板、按鈕高亮');
  switchAdminSubtab('translations'); $('adminGroupBtn-system').click(); ok(state.currentAdminSubtab === 'translations' || state.currentAdminSubtab === 'siteTitles', '點「系統」組別：回到系統組（上次停留的子頁籤）');
  switchAdminSubtab('siteTitles');

  // B. 表單結構
  const secs = Array.from($('siteTitlesFields').children);
  ok(secs.length === 2 && /頁首/.test(secs[0].textContent.slice(0, 4)) && /頁尾/.test(secs[1].textContent.slice(0, 4)) && secs[0].querySelectorAll('[data-site-field]').length === 4 && secs[1].querySelectorAll('[data-site-field]').length === 2, '兩個區段：頁首 4 段（基金會、學校、班級、標籤）、頁尾 2 段（聯絡資訊、標語）');
  ok(PROPS.every(p => fld(p) && fld(p).placeholder === DEF[p] && fld(p).value === ''), '每段一個輸入框，空白時以預設文字當提示');
  ok(PROPS.every(p => /預設：/.test(fld(p).closest('[data-site-field]').textContent) && fld(p).closest('[data-site-field]').textContent.indexOf(DEF[p]) >= 0), '每段下方寫出「預設：…」');
  ok(fld('headerFoundation').maxLength === 30 && fld('headerSchool').maxLength === 40 && fld('headerClass').maxLength === 20 && fld('headerBadge').maxLength === 20 && fld('footerContact').maxLength === 80 && fld('footerMotto').maxLength === 60, '字數上限與後端一致（30／40／20／20／80／60）');
  ok(PROPS.every(p => fld(p).closest('[data-site-field]').querySelector('[data-site-count]').textContent === '使用預設'), '空白時計數顯示「使用預設」');
  fld('headerClass').value = '諾貝爾 B 班'; siteTitleCount(fld('headerClass')); ok(fld('headerClass').closest('[data-site-field]').querySelector('[data-site-count]').textContent === '7 / 20 字', '輸入後計數即時更新（7 / 20 字）');
  ok(/英文對照/.test($('siteTitlesCard').textContent) && /同步新文字/.test($('siteTitlesCard').textContent) && /只填中文/.test($('siteTitlesCard').textContent), '說明英文介面的做法：只填中文，到「英文對照」同步');
  Array.from($('siteTitlesCard').querySelectorAll('button')).filter(b => /前往「英文對照」/.test(b.textContent))[0].click(); ok(state.currentAdminSubtab === 'translations', '「前往英文對照」按鈕：切到英文對照');
  switchAdminSubtab('siteTitles');

  // C. 預設顯示
  reset();
  ok(same(shown(), DEF), '沒有自訂：頁首頁尾顯示原本的中文');
  state.lang = 'en'; applyTranslations(); ok(same(shown(), EN), '英文介面、沒有自訂：顯示內建英文（3&3 Life Education、Taozihjiao Kindergarten、Nobel A Class…）');
  state.lang = 'zh-TW'; applyTranslations(); ok(same(shown(), DEF), '切回中文：還原');
  ok(!document.querySelector('#headerFoundation[data-i18n], #headerSchool[data-i18n], #headerClass[data-i18n], #footerMotto[data-i18n]'), '這幾段不再有 data-i18n（避免切語言時被固定文字蓋掉）');

  // D. 自訂顯示
  reset(); state.settings.headerClass = '諾貝爾 B 班'; state.settings.footerMotto = '快樂學習每一天'; applySiteTitles();
  ok($('headerClass').textContent === '諾貝爾 B 班' && $('footerMotto').textContent === '快樂學習每一天' && $('headerSchool').textContent === DEF.headerSchool && $('footerContact').textContent === DEF.footerContact, '自訂的班級名稱與標語顯示在頁首頁尾；沒自訂的維持預設');
  state.settings.headerClass = '  諾貝爾 C 班  '; applySiteTitles(); ok($('headerClass').textContent === '諾貝爾 C 班', '前後空白會去掉');
  state.settings.headerClass = ' 諾貝爾  A 班 '; applySiteTitles(); ok($('headerClass').textContent === DEF.headerClass, '和預設只差空白：視為預設');
  state.settings = { headerBadge: 'Good Life', footerContact: '電話：02-1111-2222' }; applySiteTitles(); ok($('headerBadge').textContent === 'Good Life' && $('footerContact').textContent === '電話：02-1111-2222' && $('headerClass').textContent === DEF.headerClass, '標籤與聯絡資訊也能自訂；設定物件裡沒有的欄位用預設');
  state.settings = undefined; applySiteTitles(); ok(same(shown(), DEF), 'state.settings 不存在（舊資料／載入前）：不拋錯、用預設');
  state.settings = Object.assign({}, saved.settings); PROPS.forEach(p => { state.settings[p] = ''; });
  state.settings.headerClass = '<img src=x onerror=window.__sitepwn=1>'; applySiteTitles();
  ok(!window.__sitepwn && !$('headerClass').querySelector('img') && $('headerClass').textContent.indexOf('<img') === 0, '惡意文字：以純文字顯示，不會注入元素');
  state.settings.headerClass = 12345; applySiteTitles(); ok($('headerClass').textContent === '12345', '設定值是數字：轉成文字顯示');
  state.settings.headerClass = { a: 1 }; applySiteTitles(); ok($('headerClass').textContent === DEF.headerClass, '設定值是物件等怪東西：用預設');

  // E. 英文介面
  reset(); state.settings.headerClass = '諾貝爾 B 班'; state.settings.footerMotto = '快樂學習每一天'; state.settings.headerSchool = '桃子腳第二園';
  state.lang = 'en'; applyTranslations();
  ok($('headerClass').textContent === '諾貝爾 B 班' && $('footerMotto').textContent === '快樂學習每一天', '英文介面、有自訂但還沒翻譯：暫時顯示中文');
  ok($('headerFoundation').textContent === EN.headerFoundation && $('footerContact').textContent === EN.footerContact, '英文介面、沒自訂的：維持內建英文');
  setNameMap({ '諾貝爾 B 班': 'Nobel B Class', '桃子腳第二園': 'Second Branch' }); state.textMap = {}; state.textMap[textKey('快樂學習每一天')] = 'Happy learning every day'; applySiteTitles();
  ok($('headerClass').textContent === 'Nobel B Class' && $('headerSchool').textContent === 'Second Branch', '名稱類（班級、學校）：查「英文對照→名稱」顯示英文');
  ok($('footerMotto').textContent === 'Happy learning every day', '內容類（標語）：查「英文對照→內容」顯示英文');
  state.lang = 'zh-TW'; applyTranslations(); ok($('headerClass').textContent === '諾貝爾 B 班' && $('footerMotto').textContent === '快樂學習每一天', '切回中文：顯示自訂的中文');
  state.lang = 'en'; state.textMap = {}; setNameMap({}); applyTranslations(); ok($('headerClass').textContent === '諾貝爾 B 班', '切到英文（對照表是空的）：套用語言時就會重畫頁首（applyTranslations 有呼叫 applySiteTitles）');
  setNameMap({ '諾貝爾 B 班': 'Nobel B Class' }); state.settings.headerClass = '諾貝爾 A 班'; applySiteTitles(); ok($('headerClass').textContent === EN.headerClass, '自訂內容剛好等於預設：英文介面用內建英文（不去查對照表）');
  state.lang = 'zh-TW'; applyTranslations();

  // F. 公開資料到達時套用
  reset(); const empty = { events: [], menus: [], spotlights: [], docs: [], themes: [], albums: [], songs: [], nameMap: { '諾貝爾 B 班': 'Nobel B Class' }, settings: Object.assign({}, state.settings, { headerClass: '諾貝爾 B 班', footerMotto: '資料載入後的標語' }) };
  try { handleDataLoaded(empty); } catch (e) { ok(false, 'handleDataLoaded 拋錯：' + e.message); }
  ok($('headerClass').textContent === '諾貝爾 B 班' && $('footerMotto').textContent === '資料載入後的標語', '公開資料載入完成：頁首頁尾立刻換成自訂文字');
  state.lang = 'en'; applyTranslations(); ok($('headerClass').textContent === 'Nobel B Class', '資料裡的名稱對照（nameMap）：英文介面顯示英文');
  state.lang = 'zh-TW'; applyTranslations();

  // G. 儲存
  reset(); switchAdminSubtab('siteTitles'); renderSiteTitlesForm();
  fld('headerClass').value = '  諾貝爾 B 班 '; fld('footerMotto').value = '快樂學習每一天'; fld('headerBadge').value = 'Good Life'; $('siteTitlesSaveBtn').click();
  ok(cbs.length === 1 && cbs[0].a === 'saveSiteTitles' && same(Object.keys(cbs[0].p.titles), PROPS) && cbs[0].p.password === state.adminPassword, '按「儲存」：呼叫 saveSiteTitles，送出六個欄位與管理員 token');
  ok(cbs[0].p.titles.headerClass === '諾貝爾 B 班' && cbs[0].p.titles.footerMotto === '快樂學習每一天' && cbs[0].p.titles.headerBadge === 'Good Life' && cbs[0].p.titles.headerFoundation === '' && cbs[0].p.titles.footerContact === '', '前後空白去掉；沒填的送空字串（＝預設）');
  ok(state.settings.headerClass === '諾貝爾 B 班' && $('headerClass').textContent === '諾貝爾 B 班' && $('footerMotto').textContent === '快樂學習每一天' && $('headerBadge').textContent === 'Good Life', '儲存成功：馬上套用到頁首頁尾');
  ok(/介面標題已更新/.test(toasts.join('|')) && /英文對照/.test(toasts.join('|')), '提示「介面標題已更新」，並提醒英文介面要到英文對照');
  ok(fld('headerClass').value === '諾貝爾 B 班' && fld('headerFoundation').value === '' && $('siteTitlesSaveBtn').disabled === false, '表單以儲存後的值重畫；儲存鈕恢復可按');
  toasts.length = 0; fld('footerContact').value = 'TEL：02-1111-2222｜FAX：02-1111-2223'; fld('headerClass').value = '諾貝爾 B 班'; $('siteTitlesSaveBtn').click();
  ok(/介面標題已更新/.test(toasts.join('|')) && !/英文對照/.test(toasts.join('|')), '只改了沒有中文的電話傳真：不提醒英文對照');
  toasts.length = 0; fld('headerClass').value = ''; $('siteTitlesSaveBtn').click();
  ok($('headerClass').textContent === DEF.headerClass && !/英文對照/.test(toasts.join('|')), '清空班級名稱再存：恢復預設，不提醒英文對照');
  respond = (p, okCb) => okCb({ success: false, error: '「班級名稱」最多 20 字' }); toasts.length = 0; fld('headerClass').value = '不會生效'; $('siteTitlesSaveBtn').click();
  ok(/儲存失敗：「班級名稱」最多 20 字/.test(toasts.join('|')) && $('headerClass').textContent === DEF.headerClass && $('siteTitlesSaveBtn').disabled === false && fld('headerClass').value === '不會生效', '後端拒絕：顯示原因、頁首不變、保留輸入的內容、儲存鈕恢復');
  respond = (p, okCb, errCb) => errCb(new Error('timeout')); toasts.length = 0; $('siteTitlesSaveBtn').click();
  ok(/網路連線逾時/.test(toasts.join('|')) && $('siteTitlesSaveBtn').disabled === false && $('headerClass').textContent === DEF.headerClass, '網路逾時：提示、儲存鈕恢復、頁首不變');
  respond = (p, okCb) => okCb(null); toasts.length = 0; $('siteTitlesSaveBtn').click(); ok(/儲存失敗：未知錯誤/.test(toasts.join('|')), '後端回應是空的：提示未知錯誤');
  respond = (p, okCb) => { ok($('siteTitlesSaveBtn').disabled === true, '送出期間儲存鈕停用（避免連按）'); okCb({ success: true, titles: p.titles }); }; $('siteTitlesSaveBtn').click();
  respond = null; cbs.length = 0; toasts.length = 0; fld('headerClass').maxLength = 100; fld('headerClass').value = '字'.repeat(21); $('siteTitlesSaveBtn').click();
  ok(cbs.length === 0 && /「班級名稱」最多 20 字/.test(toasts.join('|')), '超過字數上限（輸入框的限制被繞過）：前端先擋下，不送出');
  respond = (p, okCb) => okCb({ success: true, titles: Object.assign({}, p.titles, { headerClass: '後端整理後的班名' }) }); fld('headerClass').maxLength = 20; fld('headerClass').value = '原本輸入'; $('siteTitlesSaveBtn').click();
  ok($('headerClass').textContent === '後端整理後的班名' && fld('headerClass').value === '後端整理後的班名', '以後端回傳的值為準（後端整理過的內容）');

  // H. 恢復預設
  reset(); state.settings.headerClass = '諾貝爾 B 班'; state.settings.footerMotto = '快樂學習每一天'; applySiteTitles(); renderSiteTitlesForm();
  ok(fld('headerClass').value === '諾貝爾 B 班' && fld('footerMotto').value === '快樂學習每一天' && fld('headerSchool').value === '', '表單帶入目前的自訂值（沒自訂的是空白）');
  fld('headerClass').closest('[data-site-field]').querySelector('[data-site-reset]').click();
  ok(fld('headerClass').value === '' && fld('footerMotto').value === '快樂學習每一天' && fld('headerClass').closest('[data-site-field]').querySelector('[data-site-count]').textContent === '使用預設', '該欄的「恢復預設」：只清這一欄，計數回「使用預設」');
  ok($('headerClass').textContent === '諾貝爾 B 班', '「恢復預設」只改表單，要按「儲存」才生效');
  Array.from($('siteTitlesCard').querySelectorAll('button')).filter(b => /全部恢復預設/.test(b.textContent))[0].click();
  ok(PROPS.every(p => fld(p).value === ''), '「全部恢復預設」：六欄都清空');
  $('siteTitlesSaveBtn').click(); ok(cbs.length === 1 && PROPS.every(p => cbs[0].p.titles[p] === '') && PROPS.every(p => $(p).textContent === DEF[p]), '全部恢復預設後儲存：送出六個空字串，頁首頁尾回到原本的文字');

  // I. 其他
  ok(typeof saveMobileNavSettings === 'function' && typeof renderMobileNavSettings === 'function', '手機導覽列的儲存與載入函式仍在');
  ok(SITE_TITLE_DEFS.length === 6 && SITE_TITLE_DEFS.every(d => d.zh === DEF[d.prop]), '前端的預設文字與頁面原本的文字一致');

  // 還原
  window.callBackend = real.cb; window.showToast = real.toast; window.mapAdminOpen = saved.mo;
  state.settings = saved.settings; state.lang = saved.lang; state.nameMap = saved.nameMap; state.textMap = saved.textMap; state.adminPassword = saved.pwd;
  try { applyTranslations(); } catch (e) {}
  const bad = res.filter(x => x.startsWith('✗'));
  console.log(res.join('\n') + '\n\n' + (res.length - bad.length) + ' 項通過，' + bad.length + ' 項失敗');
  return res.join('\n') + '\n\n' + (res.length - bad.length) + ' pass / ' + bad.length + ' fail';
})();
