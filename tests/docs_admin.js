// 常用文件的管理功能全部在後台（瀏覽器）：前台只有下載；後台「常用文件管理」有表單＋列表（搜尋、類別、分頁、編輯／複製／刪除）。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000);
  const realHandle = window.handleDataLoaded; window.handleDataLoaded = function () {};
  const saved = { docs: state.docs, pwd: state.adminPassword, tab: state.currentTab, sub: state.currentAdminSubtab, lists: JSON.stringify(adminLists.docs), ls: (function () { try { return localStorage.getItem('nobel_a_docs_custom'); } catch (e) { return null; } })() };
  const real = { confirm: window.confirm, cb: window.callBackend, toast: window.showToast, load: window.loadAppData };
  const $ = id => document.getElementById(id);
  const cbs = [], confirms = []; let answer = true;
  window.confirm = m => { confirms.push(String(m)); return answer; };
  window.showToast = function () {};
  window.loadAppData = function () {};
  window.callBackend = (a, p, okCb) => { cbs.push({ a: a, p: p }); if (okCb) okCb({ success: true }); };
  state.adminPassword = 'tok'.repeat(15);
  const mk = (i, extra) => Object.assign({ id: 'D' + i, fileName: '文件' + i + '.pdf', fileExtension: 'pdf', category: i % 2 ? '保健用藥' : '餐飲菜單', description: '說明' + i, driveFileId: 'F' + i, downloadUrl: 'https://drive.google.com/file/d/D' + i + '/view', updatedAt: '2026-10-01' }, extra || {});
  const reset = () => { cbs.length = 0; confirms.length = 0; answer = true; adminLists.docs.query = ''; adminLists.docs.cat = ''; adminLists.docs.page = 0; adminLists.docs.size = 10; docModalFiles = []; closeDocEditModalNow(); state.docs = []; for (let i = 1; i <= 12; i++) state.docs.push(mk(i)); };
  const rows = () => [...document.querySelectorAll('#docAdminListContainer > div')].filter(r => r.querySelector('button[data-act]'));
  const titles = () => rows().map(r => r.querySelector('a, span.font-black').textContent.trim());
  const open = () => !$('docEditModal').classList.contains('hidden');
  reset();

  // A. 前台只有下載
  switchTab('docs'); renderDocsList();
  ok(!$('docAdminBar') && !document.querySelector('#tabContent-docs #btnBrowseCloudDocs') && !document.querySelector('#tabContent-docs [onclick*="openDocEditModal"]'), '前台常用文件頁：沒有管理員提示列、「新增常用文件」、「瀏覽雲端 Docs 資料夾」');
  ok(document.querySelectorAll('#docsListContainer button[data-act]').length === 0 && document.querySelectorAll('#docsListContainer a[href*="drive.google.com/file/d/D1/"]').length === 1, '管理員已登入時，前台文件卡片也沒有編輯／複製／刪除，只有下載連結');

  // B. 後台版面
  ok(!$('docUpload-name') && !$('docFileInput') && !$('docUploadBtn'), '舊的「上傳文件」表單已移除（新增改走同一個表單）');
  ok($('adminPanel-uploadDoc').contains($('docEditModal')) && $('adminPanel-uploadDoc').contains($('docAdminListContainer')) && !$('docEditModal').className.split(/\s+/).includes('fixed'), '表單與列表都在後台「常用文件管理」面板內；表單是內嵌的，不是彈窗');
  ok(/常用文件管理/.test($('adminSubtabBtn-uploadDoc').textContent) && /常用文件管理/.test($('adminPanel-uploadDoc').querySelector('h4').textContent), '後台頁籤與標題為「常用文件管理」');
  ok($('adminPanel-uploadDoc').querySelector('#btnBrowseCloudDocs') && /drive\.google\.com/.test($('btnBrowseCloudDocs').href), '「開啟 Docs 雲端資料夾」鈕移到後台');

  // C. 進入頁籤就有列表（資料先到、使用者後到）
  switchTab('admin'); switchAdminSubtab('uploadDoc');
  ok(rows().length === 10 && $('docAdminCountBadge').textContent === '共 12 份文件', '進入頁籤：第一頁 10 筆、顯示共 12 份');
  ok(titles()[0] === '文件12.pdf' && titles()[9] === '文件3.pdf', '最新建立（試算表最後一列）在最上面');
  ok(!!document.querySelector('#adminDocsPager .admin-pager-count') && /2/.test(document.querySelector('#adminDocsPager .admin-pager-page').textContent), '分頁列：有「每頁」選項與頁碼（1 / 2）');
  adminListGo('docs', 'next'); ok(rows().length === 2 && titles()[0] === '文件2.pdf', '下一頁：剩 2 筆');
  adminListOnSize('docs', '0'); ok(rows().length === 12, '每頁「全部」：12 筆');
  adminListOnSize('docs', '10');
  adminListOnQuery('docs', '文件7'); ok(rows().length === 1 && $('adminDocsClear').disabled === false, '搜尋：只剩一筆，「清除篩選」可按');
  adminListClear('docs'); ok(rows().length === 10 && $('adminDocsClear').disabled === true, '清除篩選：回到全部');
  adminListOnFilter('docs', 'cat', '保健用藥'); ok(rows().length === 6 && [...$('adminDocsCat').options].some(o => o.value === '餐飲菜單'), '類別篩選：6 筆；下拉有「餐飲菜單」等類別');
  adminListClear('docs');

  // D. 編輯、複製、刪除都從列表按鈕進入
  rows()[0].querySelector('button[data-act="edit"]').click();
  ok(open() && $('docModal-id').value === 'D12' && /正在編輯既有文件「文件12.pdf」/.test($('docFormModeText').textContent) && $('docModalSaveBtn').textContent.trim() === '💾 更新原文件', '按列表的「編輯」：表單展開、編輯模式、帶入原編號 D12');
  closeDocEditModalNow();
  rows()[1].querySelector('button[data-act="copy"]').click();
  ok(open() && $('docModal-id').value === '' && /以「文件11.pdf」為範本新增/.test($('docFormModeText').textContent), '按列表的「複製」：表單展開、複製模式、沒有編號');
  $('docModal-fileName').value = '複製出來的文件.pdf'; handleSaveDocModal({ preventDefault() {} });
  ok(cbs.some(c => c.a === 'saveDoc' && /^DOC-/.test(c.p.docData.id)) && state.docs.length === 13 && !open() && titles()[0] === '複製出來的文件.pdf', '複製後存檔：新增一筆、表單收起、新文件立刻出現在後台列表最上面');
  cbs.length = 0;
  rows()[3].querySelector('button[data-act="del"]').click();
  ok(confirms.length === 1 && cbs.some(c => c.a === 'deleteDoc') && state.docs.length === 12, '按列表的「刪除」：先確認，確定後呼叫後端、列表少一筆');
  answer = false; confirms.length = 0; cbs.length = 0; rows()[0].querySelector('button[data-act="del"]').click();
  ok(confirms.length === 1 && cbs.length === 0 && state.docs.length === 12, '刪除時按取消：不呼叫後端、文件不變');
  answer = true;

  // E. 新增按鈕
  const newBtn = [...$('adminPanel-uploadDoc').querySelectorAll('button')].filter(b => /新增常用文件/.test(b.textContent))[0];
  ok(!!newBtn, '後台有「➕ 新增常用文件」按鈕'); newBtn.click();
  ok(open() && $('docModal-id').value === '' && /新增文件：儲存後會建立一筆新的常用文件/.test($('docFormModeText').textContent) && /選取檔案上傳/.test($('docEditForm').textContent), '按「新增」：表單展開、新增模式，內含「選取檔案上傳」');
  closeDocEditModalNow();

  // F. 空清單與無結果
  state.docs = []; renderAdminDocsList();
  ok(/尚無任何常用文件/.test($('docAdminListContainer').textContent), '沒有任何文件：提示「尚無任何常用文件」');
  reset(); adminListOnQuery('docs', '查無此文件'); ok(/沒有符合條件的文件/.test($('docAdminListContainer').textContent), '搜尋無結果：提示「沒有符合條件的文件」');
  adminListClear('docs');

  // G. 惡意名稱不注入
  reset(); state.docs[11].fileName = '<img src=x onerror=window.__docadminpwn=1>惡意'; state.docs[11].description = '<b id=docadmin-b>x</b>'; renderAdminDocsList();
  ok(!window.__docadminpwn && !$('docadmin-b') && !document.querySelector('#docAdminListContainer img[src="x"]') && titles()[0].indexOf('<img') >= 0, '惡意文件名稱與說明：列表以純文字顯示，沒有注入元素');

  reset(); window.confirm = real.confirm; window.callBackend = real.cb; window.showToast = real.toast; window.loadAppData = real.load;
  state.docs = saved.docs; state.adminPassword = saved.pwd; window.handleDataLoaded = realHandle;
  try { Object.assign(adminLists.docs, JSON.parse(saved.lists)); } catch (e) {}
  try { if (saved.ls === null) localStorage.removeItem('nobel_a_docs_custom'); else localStorage.setItem('nobel_a_docs_custom', saved.ls); } catch (e) {}
  try { renderDocsList(); } catch (e) {}
  console.log(res.join('\n')); return res;
})();
