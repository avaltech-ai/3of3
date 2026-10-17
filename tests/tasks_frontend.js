// 「學期任務」前台頁面與後台管理（瀏覽器）：側邊欄位置、兩個類別的圖示卡片、學期切換、選填總覽圖、英文、空狀態、跳脫；
// 後台：列表（搜尋／學期／類別／分頁）、新增／編輯／複製表單、刪除、整學期複製、總覽圖設定。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const startLang = state.lang; if (state.lang === 'en') { toggleLanguage(); await wait(300); }   // 本測試的中文斷言需要從中文介面開始（瀏覽器會記住上次的語言）
  const saved = { tasks: state.semesterTasks, ov: state.taskOverviews, lang: state.lang, pwd: state.adminPassword, tab: state.currentTab, sem: state.themeSemesters, tm: state.textMap, lists: JSON.stringify(adminLists.tasks) };
  const real = { confirm: window.confirm, cb: window.callBackend, toast: window.showToast, load: window.loadAppData };
  const $ = id => document.getElementById(id);
  const cbs = [], confirms = [], toasts = []; let answer = true, failNext = '';
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.showToast = m => { toasts.push(String(m)); };
  window.loadAppData = function () {};
  let seq = 0;
  window.callBackend = (a, p, okCb) => {
    cbs.push({ a: a, p: p });
    if (failNext === a) { failNext = ''; if (okCb) okCb({ success: false, error: '模擬失敗' }); return; }
    if (!okCb) return;
    if (a === 'saveSemesterTask') {
      const d = p.data; let order = d.order;
      if (order === '' || order === null) order = Math.max(0, ...state.semesterTasks.filter(x => x.semester === d.semester && x.group === d.group && x.id !== d.id).map(x => x.order)) + 1;
      okCb({ success: true, taskId: d.id || ('TASK-NEW-' + (++seq)), order: order });
    } else if (a === 'saveTaskOverview') okCb({ success: true, fileId: p.link ? 'F'.repeat(33) : '', message: p.link ? '總覽圖已設定！' : '已清除總覽圖。' });
    else okCb({ success: true, message: '好了' });
  };
  state.adminPassword = 'tok'.repeat(15);
  state.themeSemesters = ['115 學年上學期', '115 學年下學期'];
  const SEM1 = '114 學年下學期', SEM2 = '115 學年上學期', SEM3 = '115 學年下學期';
  const mk = (id, sem, grp, ord, icon, title, desc) => ({ id: id, semester: sem, group: grp, order: ord, icon: icon, title: title, description: desc || '', updatedAt: '2026-10-01' });
  const base = () => [
    mk('a1', SEM2, '班級小任務', 1, '📖', '注重閱讀的品質', '同時學習保護書籍。'), mk('a2', SEM2, '班級小任務', 2, '🎲', '學習數與量的概念', '使用桌遊增進合作能力。'), mk('a3', SEM2, '班級小任務', 3, '📅', '認識日期與時間順序'),
    mk('b1', SEM2, '家長配合事項', 1, '📚', '每天共讀一本繪本', '請孩子看圖敘述故事。'), mk('b2', SEM2, '家長配合事項', 2, '⏰', '練習看整點時間'),
    mk('c1', SEM1, '班級小任務', 1, '🧩', '舊學期任務')
  ];
  const reset = () => { cbs.length = 0; confirms.length = 0; toasts.length = 0; answer = true; failNext = ''; seq = 0; state.lang = 'zh-TW'; state.semesterTasks = base(); state.taskOverviews = {}; Object.assign(adminLists.tasks, { query: '', cat: '', semester: '', page: 0, size: 10 }); closeTaskFormNow(); currentTaskSemester = ''; };
  const cards = () => [...document.querySelectorAll('#tasksGroups .task-card')];
  const groups = () => [...document.querySelectorAll('#tasksGroups .task-group')];
  const rows = () => [...document.querySelectorAll('#taskAdminListContainer > div')].filter(r => r.querySelector('button[data-act]'));
  const rowTitles = () => rows().map(r => r.querySelector('span.font-black').textContent.trim());
  const formOpen = () => !$('taskFormWrap').classList.contains('hidden');
  const cls = (el, c) => el.className.split(/\s+/).indexOf(c) >= 0;
  const saveCall = () => cbs.filter(c => c.a === 'saveSemesterTask').pop();
  reset();

  // A. 側邊欄與頁籤
  const navIds = [...document.querySelectorAll('nav .tab-btn')].map(b => b.id);
  ok(navIds.indexOf('tabBtn-tasks') === navIds.indexOf('tabBtn-themes') + 1 && navIds.indexOf('tabBtn-albums') > navIds.indexOf('tabBtn-tasks'), '側邊欄：「學期任務」緊接在「主題活動」之後、在「影像記錄」之前（中間另有「幼小銜接」）');
  ok(/學期任務/.test($('tabBtn-tasks').textContent) && /🎯/.test($('tabBtn-tasks').textContent) && VALID_TABS.indexOf('tasks') >= 0, '按鈕文字「🎯 學期任務」；頁籤在重新整理還原的白名單內');
  switchTab('tasks');
  ok(!$('tabContent-tasks').classList.contains('hidden') && ['home', 'albums', 'songs', 'themes', 'docs', 'admin'].every(t => $('tabContent-' + t).classList.contains('hidden')) && /bg-peach-50/.test($('tabBtn-tasks').className), '切到「學期任務」：只顯示這一頁，側邊欄按鈕變成選取樣式');

  // B. 前台內容
  renderSemesterTasks();
  ok(groups().length === 2 && groups()[0].getAttribute('data-group') === '班級小任務' && groups()[1].getAttribute('data-group') === '家長配合事項', '兩個類別區塊：班級小任務在前、家長配合事項在後');
  ok(cards().length === 5 && $('taskSemesterFilter').value === SEM2 && currentTaskSemester === SEM2, '預設顯示最新有任務的學期（115 學年上學期，不是 114 學年下學期），共 5 張卡片');
  const c0 = cards()[0];
  ok(/📖/.test(c0.textContent) && /注重閱讀的品質/.test(c0.querySelector('h4').textContent) && /同時學習保護書籍/.test(c0.querySelector('p').textContent), '卡片：圖示、粗體標題、說明');
  ok(cards()[2].querySelector('p') === null, '沒有說明的任務：不留空白的說明段落');
  ok(/3 件事/.test(groups()[0].querySelector('p').textContent) && /2 件事/.test(groups()[1].querySelector('p').textContent), '副標顯示各類別任務數（3 件、2 件）');
  ok(groups()[0].className.indexOf('emerald') >= 0 && groups()[1].className.indexOf('amber') >= 0, '兩個類別用不同色系（綠／暖橘）');
  ok(cards().map(c => c.querySelector('h4').textContent).join('|') === '注重閱讀的品質|學習數與量的概念|認識日期與時間順序|每天共讀一本繪本|練習看整點時間', '依類別、順序排列');
  ok(!$('taskSemesterFilter').classList.contains('hidden') && [...$('taskSemesterFilter').options].map(o => o.value).join() === SEM2 + ',' + SEM1, '有兩個學期：顯示學期下拉（新到舊）');
  $('taskSemesterFilter').value = SEM1; filterSemesterTasks();
  ok(cards().length === 1 && /舊學期任務/.test(cards()[0].textContent) && groups().length === 1, '切到舊學期：只顯示該學期；沒有任務的類別整個區塊不出現');
  state.semesterTasks = state.semesterTasks.filter(x => x.semester === SEM2); renderSemesterTasks();
  ok($('taskSemesterFilter').classList.contains('hidden') && !$('taskSemesterBadge').classList.contains('hidden') && /115 學年上學期/.test($('taskSemesterBadge').textContent), '只有一個學期：不顯示下拉，改在標題旁顯示學期標籤');

  // C. 總覽圖
  const FID = '1QMSKstvzHuprCzZTj0MSwDGIuuY-ELHi';
  ok($('tasksOverview').innerHTML === '', '沒設定總覽圖：不顯示');
  state.taskOverviews = { [SEM2]: FID, [SEM1]: 'x"><img src=x onerror=window.__taskpwn=1>' }; renderSemesterTasks();
  ok(!!$('tasksOverview').querySelector('img') && /thumbnail\?id=1QMSKstvzHuprCzZTj0MSwDGIuuY-ELHi/.test($('tasksOverview').querySelector('img').src) && $('tasksOverview').querySelector('button[onclick^="openTaskOverview"]'), '設定了總覽圖：頁面最上方顯示縮圖，可點擊放大');
  const realOpen = window.openPhotoViewerByIndex; let opened = -1; window.openPhotoViewerByIndex = i => { opened = i; };
  openTaskOverview($('tasksOverview').querySelector('button')); ok(opened === 0 && currentAlbumPhotosList.length >= 1, '點圖：開啟照片檢視器（單張）'); window.openPhotoViewerByIndex = realOpen;
  state.semesterTasks.push(mk('c1', SEM1, '班級小任務', 1, '🧩', '舊學期任務')); currentTaskSemester = SEM1; renderSemesterTasks();
  ok($('tasksOverview').innerHTML === '' && !window.__taskpwn, '總覽圖 ID 含惡意字元：不顯示、不執行');
  currentTaskSemester = SEM2; renderSemesterTasks();

  // D. 英文與空狀態
  state.textMap = Object.assign({}, state.textMap || {}, { '注重閱讀的品質': 'Quality reading' });
  state.lang = 'en'; renderSemesterTasks();
  ok(/Class Mini Missions/.test(groups()[0].textContent) && /How Parents Can Help/.test(groups()[1].textContent) && /3 things/.test(groups()[0].textContent), '英文介面：類別名稱與副標是英文');
  ok(/Quality reading/.test(cards()[0].textContent) && /每天共讀一本繪本/.test(groups()[1].textContent), '英文介面：有對照的標題顯示英文，沒對照的退回中文');
  state.lang = 'zh-TW';
  state.semesterTasks = []; renderSemesterTasks();
  ok(!$('tasksEmptyState').classList.contains('hidden') && $('tasksGroups').classList.contains('hidden') && /準備中/.test($('tasksEmptyState').textContent), '沒有任何任務：顯示「準備中」的空狀態');
  state.semesterTasks = undefined; try { renderSemesterTasks(); renderAdminTasksList(); ok(true, '資料欄位不存在（舊版快取）：不出錯'); } catch (e) { ok(false, '資料欄位不存在時拋出例外：' + e.message); }

  // E. 跳脫
  reset(); state.semesterTasks = [mk('x1', SEM2, '班級小任務', 1, '<img src=x onerror=window.__taskpwn2=1>', '<img src=x onerror=window.__taskpwn3=1>惡意標題', '<b id=task-b>說明</b>')];
  renderSemesterTasks(); renderAdminTasksList();
  ok(!window.__taskpwn2 && !window.__taskpwn3 && !$('task-b') && !document.querySelector('#tasksGroups img[src="x"], #taskAdminListContainer img[src="x"]') && /<img src=x/.test(cards()[0].textContent), '惡意圖示、標題、說明：前台與後台列表都以純文字顯示，沒有注入元素');
  reset();

  // F. 後台：頁籤與列表
  ok(!!$('adminSubtabBtn-tasks') && /學期任務/.test($('adminSubtabBtn-tasks').textContent) && VALID_ADMIN_SUBTABS.indexOf('tasks') >= 0 && !!$('adminPanel-tasks'), '後台有「🎯 學期任務」頁籤與面板；在還原白名單內');
  switchTab('admin'); switchAdminSubtab('tasks');
  ok(!$('adminPanel-tasks').classList.contains('hidden') && rows().length === 6 && $('taskAdminCountBadge').textContent === '共 6 筆任務', '進入頁籤就有列表：6 筆');
  ok(rowTitles().join('|') === '注重閱讀的品質|學習數與量的概念|認識日期與時間順序|每天共讀一本繪本|練習看整點時間|舊學期任務', '排序：學期新到舊 → 班級小任務在前 → 順序');
  ok(rows()[0].querySelectorAll('button[data-act]').length === 3 && [...rows()[0].querySelectorAll('button[data-act]')].map(b => b.getAttribute('data-act')).join() === 'edit,copy,del', '每列有編輯、複製、刪除三個圖示按鈕');
  adminListOnQuery('tasks', '桌遊'); ok(rows().length === 1 && /學習數與量/.test(rowTitles()[0]), '搜尋：比對說明也找得到');
  adminListClear('tasks'); adminListOnFilter('tasks', 'semester', SEM1); ok(rows().length === 1 && /舊學期任務/.test(rowTitles()[0]), '學期篩選');
  adminListOnFilter('tasks', 'cat', '家長配合事項'); ok(rows().length === 0 && /沒有符合條件/.test($('taskAdminListContainer').textContent), '學期＋類別篩選無結果：提示');
  adminListClear('tasks'); ok(rows().length === 6 && $('adminTasksClear').disabled === true, '清除篩選：回到全部');
  adminListOnFilter('tasks', 'cat', '家長配合事項'); ok(rows().length === 2, '類別篩選：家長配合事項 2 筆'); adminListClear('tasks');
  adminListOnSize('tasks', '10'); state.semesterTasks = []; for (let i = 1; i <= 12; i++) state.semesterTasks.push(mk('p' + i, SEM2, '班級小任務', i, '⭐', '任務' + i)); renderAdminTasksList();
  ok(rows().length === 10 && /2/.test(document.querySelector('#adminTasksPager .admin-pager-page').textContent), '超過 10 筆：分頁（第 1 頁 10 筆）'); adminListGo('tasks', 'next'); ok(rows().length === 2, '下一頁：2 筆'); reset();

  // G. 新增
  switchAdminSubtab('tasks'); openTaskForm();
  ok(formOpen() && /新增學期任務：儲存後會建立一筆新的任務/.test($('taskFormModeText').textContent) && cls($('taskFormBox'), 'border-emerald-200') && $('taskFormSaveLabel').textContent === '新增這筆任務' && $('taskFormSaveAsNewBtn').classList.contains('hidden'), '新增模式：綠色橫幅、按鈕「新增這筆任務」、沒有「另存為新」');
  ok($('taskForm-semester').value === SEM3 || $('taskForm-semester').value === SEM2, '學期預設為最新的學期（含試算表學期清單裡還沒有任務的）');
  ok(document.querySelectorAll('#taskEmojiPicks button').length >= 20, '圖示：有常用表情符號可一鍵選取');
  document.querySelectorAll('#taskEmojiPicks button')[0].click(); ok($('taskForm-icon').value === '📖', '按圖示按鈕：填入圖示欄');
  $('taskForm-semester').value = SEM2; $('taskForm-group').value = '家長配合事項'; $('taskForm-title').value = ''; handleSaveTask({ preventDefault() {} });
  ok(cbs.length === 0 && /請輸入標題/.test(toasts[toasts.length - 1]) && formOpen(), '沒填標題：提示，不送出，表單保持開啟');
  $('taskForm-title').value = '每天看月曆'; $('taskForm-description').value = '找今天、昨天和明天。'; $('taskForm-order').value = '1000'; handleSaveTask({ preventDefault() {} });
  ok(cbs.length === 0 && /1～999/.test(toasts[toasts.length - 1]), '順序超出範圍：提示，不送出');
  $('taskForm-order').value = ''; handleSaveTask({ preventDefault() {} });
  const sc = saveCall();
  ok(sc && sc.p.data.id === '' && sc.p.data.semester === SEM2 && sc.p.data.group === '家長配合事項' && sc.p.data.title === '每天看月曆' && sc.p.data.icon === '📖' && sc.p.data.order === '' && sc.p.password.length > 10, '送出新增：編號空白、帶學期／類別／標題／說明／圖示，順序留白交給後端');
  ok(!formOpen() && state.semesterTasks.length === 7 && state.semesterTasks.find(x => x.title === '每天看月曆').order === 3 && /已新增任務「每天看月曆」/.test(toasts.join('|')), '成功：表單收起、列表多一筆（順序接在最後＝3）、提示「已新增任務」');
  state.currentTab = 'tasks'; renderSemesterTasks(); ok(cards().some(c => /每天看月曆/.test(c.textContent)), '前台立刻看得到新任務');
  reset(); switchAdminSubtab('tasks'); openTaskForm(); $('taskForm-title').value = 'X'; failNext = 'saveSemesterTask'; handleSaveTask({ preventDefault() {} });
  ok(state.semesterTasks.length === 6 && formOpen() && /儲存失敗：模擬失敗/.test(toasts[toasts.length - 1]) && $('taskFormSaveBtn').disabled === false, '後端回報失敗：不新增、表單與內容保留、按鈕可再按');

  // H. 編輯
  reset(); switchAdminSubtab('tasks'); rows()[1].querySelector('button[data-act="edit"]').click();
  ok(formOpen() && $('taskForm-id').value === 'a2' && /正在編輯既有任務「學習數與量的概念」/.test($('taskFormModeText').textContent) && cls($('taskFormBox'), 'border-amber-400') && $('taskFormSaveLabel').textContent === '更新原任務' && !$('taskFormSaveAsNewBtn').classList.contains('hidden'), '編輯模式：橘色橫幅、「更新原任務」＋「另存為新任務」、帶入原編號');
  ok($('taskForm-title').value === '學習數與量的概念' && $('taskForm-order').value === '2' && $('taskForm-icon').value === '🎲' && $('taskForm-description').value === '使用桌遊增進合作能力。', '帶入原內容（標題、順序、圖示、說明）');
  handleSaveTask({ preventDefault() {} }); ok(cbs.length === 0 && /沒有任何變更/.test(toasts[toasts.length - 1]) && formOpen(), '沒改任何東西就更新：提示沒有變更，不送出');
  $('taskForm-title').value = '學習數與量（改）'; $('taskForm-order').value = '5'; answer = false; handleSaveTask({ preventDefault() {} });
  ok(confirms.length === 1 && /即將修改原任務「學習數與量的概念」/.test(confirms[0]) && /標題：學習數與量的概念 → 學習數與量（改）/.test(confirms[0]) && /順序：2 → 5/.test(confirms[0]) && /另存為新任務/.test(confirms[0]) && cbs.length === 0 && formOpen(), '更新前列出差異（標題、順序）並提醒可另存為新任務；按取消：不送出、表單保留');
  answer = true; handleSaveTask({ preventDefault() {} });
  ok(saveCall().p.data.id === 'a2' && state.semesterTasks.length === 6 && state.semesterTasks.find(x => x.id === 'a2').title === '學習數與量（改）' && state.semesterTasks.find(x => x.id === 'a2').order === 5 && !formOpen(), '確定更新：以原編號送出，筆數不變、內容更新、表單收起');
  reset(); switchAdminSubtab('tasks'); openTaskForm('a1'); $('taskForm-title').value = '另存的任務'; handleSaveTask(null, true);
  ok(saveCall().p.data.id === '' && state.semesterTasks.length === 7 && state.semesterTasks.find(x => x.id === 'a1').title === '注重閱讀的品質' && confirms.length === 0, '另存為新任務：編號空白（新增）、原任務 a1 不變、不跳確認');

  // I. 複製與防呆
  reset(); switchAdminSubtab('tasks'); rows()[0].querySelector('button[data-act="copy"]').click();
  ok(formOpen() && $('taskForm-id').value === '' && $('taskForm-order').value === '' && /以「注重閱讀的品質」為範本新增/.test($('taskFormModeText').textContent) && cls($('taskFormBox'), 'border-sky-300') && $('taskForm-title').value === '注重閱讀的品質' && /複製學期任務/.test($('taskFormTitle').textContent), '複製：藍色橫幅、帶入內容、沒有編號、順序留白');
  $('taskForm-semester').value = SEM3; handleSaveTask({ preventDefault() {} });
  ok(saveCall().p.data.id === '' && saveCall().p.data.semester === SEM3 && state.semesterTasks.length === 7 && state.semesterTasks.find(x => x.id === 'a1').semester === SEM2, '複製後改學期存檔：新的一筆、原任務不變');
  reset(); switchAdminSubtab('tasks'); openTaskForm('a1'); $('taskForm-title').value = '改到一半'; answer = false; confirms.length = 0; closeTaskForm();
  ok(confirms.length === 1 && /尚未儲存/.test(confirms[0]) && formOpen() && $('taskForm-title').value === '改到一半', '改到一半按取消：先問；選擇不放棄則表單與內容保留');
  openTaskForm('a2'); ok(confirms.length === 2 && $('taskForm-id').value === 'a1', '有未儲存內容時開啟另一筆：先確認');
  answer = true; closeTaskForm(); ok(!formOpen(), '確定放棄：表單關閉');
  openTaskForm('a1'); confirms.length = 0; closeTaskForm(); ok(confirms.length === 0 && !formOpen(), '沒改內容就取消：不跳確認');

  // J. 刪除
  reset(); switchAdminSubtab('tasks'); rows()[0].querySelector('button[data-act="del"]').click();
  ok(confirms.length === 1 && /注重閱讀的品質/.test(confirms[0]) && cbs.some(c => c.a === 'deleteSemesterTask' && c.p.id === 'a1') && state.semesterTasks.length === 5 && rows().length === 5, '刪除：先確認，確定後呼叫後端並更新列表');
  reset(); answer = false; switchAdminSubtab('tasks'); rows()[0].querySelector('button[data-act="del"]').click(); ok(cbs.length === 0 && state.semesterTasks.length === 6, '刪除時按取消：不呼叫後端、不變');
  reset(); failNext = 'deleteSemesterTask'; switchAdminSubtab('tasks'); rows()[0].querySelector('button[data-act="del"]').click(); ok(state.semesterTasks.length === 6 && /刪除失敗：模擬失敗/.test(toasts[toasts.length - 1]), '後端刪除失敗：資料保留，提示原因');

  // K. 整學期複製
  reset(); switchAdminSubtab('tasks');
  const setSel = (id, v) => { $(id).value = v; };
  // 預設值：來源只列有任務的學期；目標預設是還沒有任務的最新學期；自己選過就不再自動改
  delete $('taskCopyFrom').dataset.touched; delete $('taskCopyTo').dataset.touched; renderAdminTasksList();
  ok([...$('taskCopyFrom').options].map(o => o.value).join() === SEM2 + ',' + SEM1 && $('taskCopyFrom').value === SEM2, '整批複製的來源：只列有任務的學期（不含還沒任務的 115 學年下學期），預設最新的');
  ok($('taskCopyTo').value === SEM3, '整批複製的目標：預設是「還沒有任務」的最新學期（115 學年下學期）');
  $('taskCopyTo').value = SEM1; $('taskCopyTo').dispatchEvent(new Event('change')); $('taskCopyFrom').value = SEM1; $('taskCopyFrom').dispatchEvent(new Event('change')); renderAdminTasksList();
  ok($('taskCopyTo').value === SEM1 && $('taskCopyFrom').value === SEM1, '使用者自己選過：重畫列表（搜尋、換頁）不會把選擇改掉');
  delete $('taskCopyFrom').dataset.touched; delete $('taskCopyTo').dataset.touched; renderAdminTasksList();
  setSel('taskCopyFrom', SEM2); setSel('taskCopyTo', SEM2); copyTaskSemester(); ok(cbs.length === 0 && /不能相同/.test(toasts[toasts.length - 1]), '來源等於目標：提示，不送出');
  setSel('taskCopyTo', SEM1); copyTaskSemester(); ok(cbs.length === 0 && /已經有任務/.test(toasts[toasts.length - 1]), '目標學期已有任務：前端先擋下（不送出）');
  setSel('taskCopyFrom', SEM3); setSel('taskCopyTo', SEM2); copyTaskSemester(); ok(cbs.length === 0 && $('taskCopyFrom').value === '' && /請選擇/.test(toasts[toasts.length - 1]), '沒有任務的學期不在來源選項裡（選不到）；來源空白按複製：提示請選擇，不送出');
  setSel('taskCopyFrom', SEM2); setSel('taskCopyTo', SEM3); answer = false; copyTaskSemester(); ok(cbs.length === 0 && confirms.length === 1 && /5 筆任務/.test(confirms[0]), '複製前確認（說明筆數），按取消不送出');
  answer = true; copyTaskSemester();
  ok(cbs.length === 1 && cbs[0].a === 'copySemesterTasks' && cbs[0].p.fromSemester === SEM2 && cbs[0].p.toSemester === SEM3 && adminLists.tasks.semester === SEM3, '確定：呼叫 copySemesterTasks（來源、目標），列表切到目標學期');

  // L. 總覽圖設定
  reset(); switchAdminSubtab('tasks');
  setSel('taskOverviewSemester', SEM2); renderTaskOverviewTool(); ok(/沒有總覽圖/.test($('taskOverviewStatus').textContent) && $('taskOverviewPreview').classList.contains('hidden'), '沒設定：狀態列提示、不顯示縮圖');
  $('taskOverviewLink').value = ''; saveTaskOverviewLink(); ok(cbs.length === 0 && /請貼上圖檔連結/.test(toasts[toasts.length - 1]), '沒設定也沒貼連結就按儲存：提示');
  $('taskOverviewLink').value = 'https://drive.google.com/file/d/' + FID + '/view'; saveTaskOverviewLink();
  ok(cbs[0].a === 'saveTaskOverview' && cbs[0].p.semester === SEM2 && cbs[0].p.link.indexOf(FID) >= 0 && /^F+$/.test(state.taskOverviews[SEM2]) && $('taskOverviewLink').value === '' && !$('taskOverviewPreview').classList.contains('hidden'), '貼連結儲存：呼叫 saveTaskOverview，狀態更新、輸入框清空、顯示縮圖');
  cbs.length = 0; $('taskOverviewLink').value = ''; saveTaskOverviewLink(); ok(confirms.length >= 1 && cbs.length === 1 && cbs[0].p.link === '' && !state.taskOverviews[SEM2], '已設定時留白儲存＝清除（先確認）：圖被移除');

  reset(); window.confirm = real.confirm; window.callBackend = real.cb; window.showToast = real.toast; window.loadAppData = real.load;
  state.semesterTasks = saved.tasks; state.taskOverviews = saved.ov; if (state.lang !== startLang) toggleLanguage(); state.lang = startLang; state.adminPassword = saved.pwd; state.themeSemesters = saved.sem; state.textMap = saved.tm; window.handleDataLoaded = realHandle;
  try { Object.assign(adminLists.tasks, JSON.parse(saved.lists)); } catch (e) {}
  try { renderSemesterTasks(); renderAdminTasksList(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
