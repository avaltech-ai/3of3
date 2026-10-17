// 後台兩層頁籤（組別 → 子頁籤）的測試（瀏覽器）：分組完整、只顯示目前組別的子頁籤、點組別回到上次停留的子頁籤、
// 待辦提醒與重新整理還原會切到正確組別、英文對照的紅點同步顯示在「系統」組別上。需從中文介面開始。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(3000);
  const $ = id => document.getElementById(id);
  const hidden = el => !el || el.classList.contains('hidden');
  const saved = { tab: state.currentTab, sub: state.currentAdminSubtab, pwd: state.adminPassword, mo: window.mapAdminOpen, ra: window.refreshAlbumsNow, ms: mapAdmin.status, s: sessionStorage.getItem('nobel_a_admin_subtab') };
  window.mapAdminOpen = function () {}; window.refreshAlbumsNow = function () {};   // 不打後端
  state.adminPassword = 'tok'.repeat(15);
  const groups = Object.keys(ADMIN_SUBTAB_GROUPS);
  const visibleSubtabs = () => Array.from(document.querySelectorAll('.admin-subtab-btn')).filter(b => !hidden(b)).map(b => b.id.replace('adminSubtabBtn-', ''));
  const activeGroups = () => Array.from(document.querySelectorAll('.admin-group-btn')).filter(b => b.classList.contains('bg-slate-800')).map(b => b.id.replace('adminGroupBtn-', ''));
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  // A. 分組完整
  const all = groups.reduce((a, g) => a.concat(ADMIN_SUBTAB_GROUPS[g]), []);
  ok(same(groups, ['daily', 'media', 'semester', 'system']), '4 個組別，依序為 日常更新／影音與文件／學期課程／系統');
  ok(all.length === VALID_ADMIN_SUBTABS.length && VALID_ADMIN_SUBTABS.every(s => all.filter(x => x === s).length === 1), '11 個子頁籤每個都恰好屬於一組，沒有遺漏或重複');
  ok(groups.every(g => $('adminGroupBtn-' + g)), '每個組別都有按鈕');
  ok(all.every(s => $('adminSubtabBtn-' + s) && $('adminSubtabBtn-' + s).getAttribute('data-group') === adminGroupOf(s)), '每個子頁籤按鈕的 data-group 與對照表一致');
  const domOrder = Array.from(document.querySelectorAll('.admin-subtab-btn')).map(b => b.id.replace('adminSubtabBtn-', ''));
  ok(same(domOrder, all), '子頁籤按鈕在畫面上的順序與對照表相同');

  // B. 切換子頁籤：只顯示同組、組別高亮、面板顯示
  all.forEach(s => {
    switchAdminSubtab(s);
    const g = adminGroupOf(s);
    ok(same(visibleSubtabs(), ADMIN_SUBTAB_GROUPS[g]) && same(activeGroups(), [g]) && !hidden($('adminPanel-' + s)) &&
       document.querySelectorAll('.admin-panel:not(.hidden)').length === 1 && $('adminSubtabBtn-' + s).classList.contains('bg-peach-500'),
       '切到「' + s + '」：組別「' + g + '」高亮、只顯示該組子頁籤、只顯示這個面板');
  });

  // C. 點組別（B 已走過每個子頁籤，先清掉「上次停留」的記錄）
  ok(adminGroupLast.media === 'uploadDoc' && adminGroupLast.system === 'settings', '走過各子頁籤後：每組記住最後停留的那一個');
  Object.keys(adminGroupLast).forEach(k => delete adminGroupLast[k]);
  switchAdminSubtab('events');
  switchAdminGroup('media'); ok(state.currentAdminSubtab === 'uploadPhoto', '第一次點「影音與文件」：到該組第一個（相簿）');
  switchAdminSubtab('songs'); switchAdminGroup('daily'); ok(state.currentAdminSubtab === 'events', '點「日常更新」：回到上次停留的「行事曆活動」');
  switchAdminGroup('media'); ok(state.currentAdminSubtab === 'songs', '再點「影音與文件」：回到上次停留的「唱跳音符」，不是第一個');
  switchAdminGroup('system'); ok(state.currentAdminSubtab === 'translations', '點「系統」：到「英文對照」');
  switchAdminGroup('不存在'); ok(state.currentAdminSubtab === 'translations', '未知的組別名稱：不動作');
  $('adminGroupBtn-semester').click(); ok(state.currentAdminSubtab === 'themes' && same(activeGroups(), ['semester']), '實際點按鈕「學期課程」：切到「主題活動」');

  // D. 待辦提醒的按鈕直接跳到別組的子頁籤
  switchAdminSubtab('events');
  const realItems = window.adminReminderItems;
  window.adminReminderItems = () => [{ kind: 'x', icon: '🌐', text: '測試', actionLabel: '前往', action: 'translations' }];
  renderAdminReminders();
  const rb = document.querySelector('#adminReminders .admin-reminder button'); if (rb) rb.click();
  window.adminReminderItems = realItems; renderAdminReminders();
  ok(state.currentAdminSubtab === 'translations' && same(activeGroups(), ['system']) && same(visibleSubtabs(), ['translations', 'settings']), '待辦提醒「前往」英文對照：組別跟著切到「系統」');

  // E. 重新整理還原：子頁籤在其他組
  const realRst = window.readStoredToken; window.readStoredToken = () => '';
  state.currentAdminSubtab = 'events'; sessionStorage.setItem('nobel_a_current_tab', 'admin'); sessionStorage.setItem('nobel_a_admin_subtab', 'tasks');
  restoreSavedTab();
  ok(state.currentAdminSubtab === 'tasks' && same(activeGroups(), ['semester']) && same(visibleSubtabs(), ADMIN_SUBTAB_GROUPS.semester), '重新整理後還原到「學期任務」：組別為「學期課程」');
  window.readStoredToken = realRst;

  // F. 英文對照紅點同步到「系統」組別
  switchAdminSubtab('events');
  mapAdmin.status = { text: { pendingNew: 3 }, name: { pendingNew: 1 } }; mapAdminUpdateBadge();
  ok(!hidden($('adminGroupBadge-system')) && !hidden($('mapAdminTabBadge')) && $('mapAdminTabBadge').textContent === '4', '有 4 筆新文字：子頁籤顯示 4、「系統」組別顯示紅點（在其他組時也看得到）');
  mapAdmin.status = { text: { pendingNew: 0 }, name: { pendingNew: 0 } }; mapAdminUpdateBadge();
  ok(hidden($('adminGroupBadge-system')) && hidden($('mapAdminTabBadge')), '沒有新文字：兩個紅點都隱藏');
  mapAdmin.status = saved.ms; mapAdminUpdateBadge();

  // G. 中英文字
  ok(['groupDaily', 'groupMedia', 'groupSemester', 'groupSystem'].every(k => I18N['zh-TW'].admin[k] && I18N.en.admin[k] && !/[一-鿿]/.test(I18N.en.admin[k])), '組別名稱有中文與英文（英文不含中文字）');
  ok($('adminGroupBtn-daily').textContent.indexOf('日常更新') !== -1, '中文介面：組別顯示「日常更新」');

  window.mapAdminOpen = saved.mo; window.refreshAlbumsNow = saved.ra; state.adminPassword = saved.pwd;
  try { saved.s === null ? sessionStorage.removeItem('nobel_a_admin_subtab') : sessionStorage.setItem('nobel_a_admin_subtab', saved.s); } catch (e) {}
  switchAdminSubtab(saved.sub || 'events'); switchTab(saved.tab || 'home');
  const fail = res.filter(r => r.indexOf('✗') === 0).length;
  console.log(res.join('\n')); return { allPass: fail === 0, pass: res.length - fail, fail: fail, res: res };
})();
