// 學期任務後端測試：SemesterTasks 工作表（班級小任務、家長配合事項）、各學期選填總覽圖、儲存／刪除／整學期複製／設定總覽圖。
// 執行：node tests/semestertasks.test.js
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const ID = '1QMSKstvzHuprCzZTj0MSwDGIuuY-ELHi';
const TASK_H = ['id', 'semester', 'group', 'order', 'icon', 'title', 'description', 'updatedAt'];
const SEM = '115 學年上學期', SEM2 = '115 學年下學期';
const G1 = '班級小任務', G2 = '家長配合事項';

function env(taskRows, semRows, opts) {
  opts = opts || {};
  const tasks = taskRows.map(r => r.slice()), sems = semRows.map(r => r.slice()), formats = [];
  let cleared = 0, uuid = 0;
  const chain = { setFontWeight() { return chain; }, setBackground() { return chain; } };
  const mkSheet = (rows, name) => ({
    getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }),
    getLastColumn: () => rows.reduce((m, r) => Math.max(m, r.length), 0),
    getLastRow: () => rows.length, appendRow: r => { rows.push(r.slice()); }, setFrozenRows() {},
    deleteRow: n => { rows.splice(n - 1, 1); },
    insertSheet() {},
    getRange: (r, c, nr, nc) => ({
      setFontWeight() { return chain; }, setBackground() { return chain; },
      getValues: () => { const out = []; for (let i = 0; i < (nr || 1); i++) { const row = []; for (let j = 0; j < (nc || 1); j++) { const v = (rows[r - 1 + i] || [])[c - 1 + j]; row.push(v === undefined ? '' : v); } out.push(row); } return out; },
      setNumberFormat: f => { formats.push(name + ':' + r + ':' + c + ':' + f); return chain; },
      setValue: v => { while (rows.length < r) rows.push([]); const row = rows[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; return chain; },
      setValues: vs => { vs.forEach((vr, i) => vr.forEach((v, j) => { while (rows.length < r + i) rows.push([]); const row = rows[r - 1 + i]; while (row.length < c + j) row.push(''); row[c - 1 + j] = v; })); return chain; }
    })
  });
  const taskSheet = mkSheet(tasks, 'T'), semSheet = mkSheet(sems, 'S'), themeSheet = mkSheet([['id', 'semester', 'week', 'startDate', 'endDate', 'themeName', 'themeConcept', 'goals', 'photos', 'updatedAt']], 'H');
  const ctx = { console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) }, PropertiesService: {}, LockService: {}, SpreadsheetApp: {}, ContentService: {}, HtmlService: {}, UrlFetchApp: {}, DriveApp: {}, Session: {}, ScriptApp: {} };
  ctx.Utilities = { formatDate: () => '2026-10-14', getUuid: () => 'abcd' + (++uuid) + '-0000-0000-0000-000000000000' };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet = () => ({ getSheetByName: n => n === 'SemesterTasks' ? (opts.noTaskSheet ? null : taskSheet) : (n === 'ThemeSemesters' ? semSheet : (n === 'Themes' ? themeSheet : null)), insertSheet: n => { if (n === 'SemesterTasks') { opts.noTaskSheet = false; return taskSheet; } return null; } });
  ctx.checkPassword = tok => tok === 'good';
  ctx.authFail_ = () => ({ success: false, error: '登入已逾時或無效，請重新登入。' });
  ctx.clearAppDataCache = () => { cleared++; };
  return { ctx, tasks, sems, formats, cleared: () => cleared };
}
const SEM_ROWS = () => [['semesterName', 'overviewImage', 'tasksOverviewImage'], [SEM, '', ''], [SEM2, '', '']];
const row = (id, sem, grp, ord, icon, title, desc) => [id, sem, grp, ord, icon, title, desc || '', '2026-10-01'];
const ids = list => list.map(t => t.id).join();

console.log('A. 讀取與整理（parseSemesterTasks_）');
let e = env([TASK_H], SEM_ROWS()); let P = e.ctx.parseSemesterTasks_; const objs = rows => rows.map(r => { const o = {}; TASK_H.forEach((h, i) => { o[h] = r[i]; }); return o; });
let t = P(objs([
  row('a2', SEM, G2, 2, '📅', '每天看月曆'), row('b1', SEM, G1, 2, '🎲', '學習數與量的概念', '使用桌遊增進合作能力。'), row('a1', SEM, G2, 1, '📚', '每天共讀一本繪本'),
  row('b0', SEM, G1, 1, '📖', '注重閱讀的品質'), row('bad', SEM, '亂寫的類別', 1, 'x', '應略過'), row('nt', SEM, G1, 3, 'x', ''), row('ns', '', G1, 3, 'x', '沒有學期')
]));
ok(ids(t) === 'b0,b1,a1,a2', '依類別（班級小任務在前、家長配合事項在後）再依順序排列；類別不合法、沒有標題、沒有學期的列略過');
ok(t[1].description === '使用桌遊增進合作能力。' && t[0].icon === '📖' && t[0].order === 1 && t[0].semester === SEM, '欄位完整帶出（說明、圖示、順序、學期）');
t = P(objs([row('x3', SEM, G1, '', '', '無順序的'), row('x1', SEM, G1, 5, '', '五'), row('x2', SEM, G1, 1000, '', '超出範圍'), row('x4', SEM, G1, 'abc', '', '亂碼'), row('x5', SEM, G1, 1.9, '', '小數')]));
ok(ids(t) === 'x5,x1,x3,x2,x4', '順序：小數取整數、空白／亂碼／超出 1～999 一律排最後（相同時維持原列順序）');
ok(P(null).length === 0 && P([]).length === 0 && P([null, undefined]).length === 0, '沒有資料、null：空陣列，不出錯');
t = P(objs([row('l', SEM, G1, 1, '😀'.repeat(20), 'T'.repeat(300), 'D'.repeat(900))]));
ok(t[0].title.length === 100 && t[0].description.length === 500 && t[0].icon.length <= 16, '過長的標題、說明、圖示被截斷（標題 100、說明 500、圖示 16）');
t = P(objs([row('n', SEM, G1, 1, '', 12345, 6789)]));
ok(t[0].title === '12345' && t[0].description === '6789', '數字型儲存格也轉成文字');

console.log('B. 總覽圖（ThemeSemesters.tasksOverviewImage）');
e = env([TASK_H], SEM_ROWS());
let ov = e.ctx.parseTaskOverviews_([{ semesterName: SEM, tasksOverviewImage: 'https://drive.google.com/file/d/' + ID + '/view?usp=sharing' }, { semesterName: SEM2, tasksOverviewImage: '' }, { semesterName: '  114 學年下學期 ', tasksOverviewImage: ID }, { semesterName: SEM, overviewImage: ID }, { semesterName: 'x', tasksOverviewImage: 'not an id' }]);
ok(JSON.stringify(ov) === JSON.stringify({ [SEM]: ID, '114 學年下學期': ID }), '只留學期名稱與圖檔都有效的列；值是純檔案 ID；與主題架構圖（overviewImage 欄）互不影響');
ok(JSON.stringify(e.ctx.parseTaskOverviews_(null)) === '{}' && JSON.stringify(e.ctx.parseTaskOverviews_([])) === '{}', '沒有資料：空物件');

console.log('C. 工作表與欄位自動建立');
e = env([], SEM_ROWS(), { noTaskSheet: true }); e.ctx.ensureSemesterTasksSheet_();
ok(e.tasks[0] && e.tasks[0].join() === TASK_H.join(), '沒有 SemesterTasks 工作表：自動建立並寫入標題列');
e = env([['id', 'semester', 'title']], SEM_ROWS()); e.ctx.ensureSemesterTasksSheet_();
ok(e.tasks[0].join() === 'id,semester,title,group,order,icon,description,updatedAt', '缺少的欄位補在右邊，原有欄位不動');
e = env([TASK_H], [['semesterName', 'overviewImage'], [SEM, '']]); e.ctx.ensureThemeSheetsExist();
ok(e.sems[0].join() === 'semesterName,overviewImage,tasksOverviewImage', 'ThemeSemesters 缺 tasksOverviewImage：補上標題，不動其他欄');
e.ctx.ensureThemeSheetsExist(); ok(e.sems[0].length === 3, '再執行一次：不重複新增');
e = env([TASK_H], [['semesterName'], [SEM]]); e.ctx.ensureThemeSheetsExist(); ok(e.sems[0].join() === 'semesterName,overviewImage,tasksOverviewImage', 'ThemeSemesters 只有學期名稱一欄：兩個欄位標題依序補在右邊，互不覆蓋');

console.log('D. getSemesterTasksData_ 與 getAppData 接線');
e = env([TASK_H, row('a1', SEM, G2, 1, '📚', '每天共讀一本繪本')], [['semesterName', 'overviewImage', 'tasksOverviewImage'], [SEM, '', ID]]);
let d = e.ctx.getSemesterTasksData_();
ok(d.tasks.length === 1 && d.tasks[0].title === '每天共讀一本繪本' && JSON.stringify(d.overviews) === JSON.stringify({ [SEM]: ID }), '一次取回任務清單與總覽圖');
ok(/semesterTasks:\s*semesterTasks/.test(src) && /taskOverviews:\s*taskOverviews/.test(src) && /semesterTasks = taskData\.tasks/.test(src), 'getAppData 的回應含 semesterTasks 與 taskOverviews（讀不到時退回空陣列／空物件）');
ok(/\['semesterTasks', \['title', 'description'\], '學期任務'\]/.test(src), '標題與說明納入英文對照（TextMap）的掃描來源');

console.log('E. 驗證輸入（validateSemesterTask_）');
const V = x => e.ctx.validateSemesterTask_(x);
const base = { semester: SEM, group: G1, title: '標題', description: '說明', icon: '📖', order: 3 };
ok(V(base).value && V(base).value.order === 3 && V(base).value.title === '標題', '正常資料通過');
ok(/學期/.test(V(Object.assign({}, base, { semester: ' ' })).error) && /類別/.test(V(Object.assign({}, base, { group: '別的' })).error) && /標題/.test(V(Object.assign({}, base, { title: '  ' })).error), '缺學期、類別不合法、缺標題：各自提示');
ok(V(Object.assign({}, base, { title: 'x'.repeat(101) })).error && V(Object.assign({}, base, { description: 'x'.repeat(501) })).error && V(Object.assign({}, base, { icon: 'x'.repeat(17) })).error && V(Object.assign({}, base, { semester: 'x'.repeat(61) })).error, '標題 101 字、說明 501 字、圖示 17 字、學期 61 字：拒絕');
ok(V(Object.assign({}, base, { order: 0 })).error && V(Object.assign({}, base, { order: 1000 })).error && V(Object.assign({}, base, { order: 'abc' })).error && V(Object.assign({}, base, { order: -1 })).error, '順序 0、1000、亂碼、負數：拒絕');
ok(V(Object.assign({}, base, { order: '' })).value.order === null && V(Object.assign({}, base, { order: undefined })).value.order === null && V(Object.assign({}, base, { order: '2.7' })).value.order === 2, '順序留白＝自動排最後；小數取整數');
ok(V(null).error && V(undefined).error, 'null／undefined：提示而不是例外');

console.log('F. saveSemesterTask');
e = env([TASK_H, row('a1', SEM, G1, 1, '📖', '甲'), row('a2', SEM, G1, 2, '🎲', '乙'), row('z1', SEM, G2, 7, '📚', '別類')], SEM_ROWS());
let r = e.ctx.saveSemesterTask(base, 'bad'); ok(r.success === false && /登入/.test(r.error) && e.tasks.length === 4 && e.cleared() === 0, '錯誤 token：拒絕，不動資料、不清快取');
r = e.ctx.saveSemesterTask(Object.assign({}, base, { title: '' }), 'good'); ok(r.success === false && e.tasks.length === 4, '驗證失敗：不寫入');
r = e.ctx.saveSemesterTask(Object.assign({}, base, { order: '', title: '丙' }), 'good');
ok(r.success && /^TASK-2026/.test(r.taskId) && e.tasks.length === 5 && e.tasks[4][3] === 3 && e.tasks[4][5] === '丙' && e.tasks[4][7] === '2026-10-14' && e.cleared() === 1, '新增：產生編號、順序接在同學期同類別最後（2 → 3；別的類別 7 不影響）、寫入更新日期並清快取');
const newId = r.taskId;
r = e.ctx.saveSemesterTask({ semester: SEM, group: G2, title: '另一類', order: '' }, 'good'); ok(r.success && r.order === 8, '另一類別：接在該類別最後（7 → 8）');
r = e.ctx.saveSemesterTask({ semester: SEM2, group: G1, title: '下學期', order: '' }, 'good'); ok(r.success && r.order === 1, '另一學期：從 1 開始');
r = e.ctx.saveSemesterTask(Object.assign({}, base, { id: 'a2', title: '乙（改）', order: '', icon: '🧩' }), 'good');
ok(r.success && r.taskId === 'a2' && e.tasks.filter(x => x[0] === 'a2').length === 1 && e.tasks[2][5] === '乙（改）' && e.tasks[2][4] === '🧩' && e.tasks[2][3] === 2, '編輯：以編號找到原列更新，不新增列；順序留白且學期、類別沒變時維持原順序（2 仍是 2）');
const n = e.tasks.length; r = e.ctx.saveSemesterTask(Object.assign({}, base, { id: 'a1', semester: SEM2, group: G2, order: '' }), 'good');
ok(r.success && e.tasks.length === n && e.tasks[1][1] === SEM2 && e.tasks[1][2] === G2 && e.tasks[1][3] === 1, '編輯可以改學期與類別；順序留白而且搬去新的學期類別時，接在該處最後（那裡原本沒有任務，所以是 1）');
r = e.ctx.saveSemesterTask(Object.assign({}, base, { id: 'nope', title: '編號不存在' }), 'good'); ok(r.success && e.tasks.length === n + 1 && e.tasks[e.tasks.length - 1][0] !== 'nope', '編號不存在：當成新增（產生新編號，不採用外來編號）');
e.formats.length = 0; e.ctx.saveSemesterTask(Object.assign({}, base, { title: '=HYPERLINK("http://x")', description: '+1+1' }), 'good');
ok(e.formats.filter(f => /^T:\d+:6:@$/.test(f)).length >= 1 && e.formats.filter(f => /^T:\d+:7:@$/.test(f)).length >= 1, '標題、說明欄寫入前設為純文字格式（避免「=」開頭被當成公式）');
const big = []; for (let i = 0; i < 300; i++) big.push(row('k' + i, SEM, G1, 1, '', 'x' + i));
e = env([TASK_H].concat(big), SEM_ROWS()); r = e.ctx.saveSemesterTask(base, 'good'); ok(r.success === false && /上限/.test(r.error), '已有 300 筆：新增被擋（提示上限）');
r = e.ctx.saveSemesterTask(Object.assign({}, base, { id: 'k5', title: '改' }), 'good'); ok(r.success === true, '已達上限時仍可編輯既有的');

console.log('G. deleteSemesterTask');
e = env([TASK_H, row('a1', SEM, G1, 1, '', '甲'), row('a2', SEM, G1, 2, '', '乙')], SEM_ROWS());
r = e.ctx.deleteSemesterTask('a1', 'bad'); ok(r.success === false && e.tasks.length === 3 && e.cleared() === 0, '錯誤 token：拒絕');
r = e.ctx.deleteSemesterTask('a1', 'good'); ok(r.success && e.tasks.length === 2 && e.tasks[1][0] === 'a2' && e.cleared() === 1, '刪除：只移除該列並清快取');
r = e.ctx.deleteSemesterTask('a1', 'good'); ok(r.success === false && /找不到/.test(r.error) && e.tasks.length === 2, '編號已不存在：提示找不到，不動資料');
r = e.ctx.deleteSemesterTask('', 'good'); ok(r.success === false && e.tasks.length === 2, '空編號：拒絕（不會誤刪空列）');
r = e.ctx.deleteSemesterTask(null, 'good'); ok(r.success === false, 'null 編號：拒絕');

console.log('H. copySemesterTasks（整學期複製）');
e = env([TASK_H, row('a1', SEM, G1, 1, '📖', '甲', '說明甲'), row('a2', SEM, G2, 1, '📚', '乙'), row('a3', SEM, G1, 2, '🎲', '丙')], SEM_ROWS());
r = e.ctx.copySemesterTasks(SEM, SEM2, 'bad'); ok(r.success === false && e.tasks.length === 4, '錯誤 token：拒絕');
ok(e.ctx.copySemesterTasks('', SEM2, 'good').success === false && e.ctx.copySemesterTasks(SEM, '', 'good').success === false, '缺來源或目標：拒絕');
r = e.ctx.copySemesterTasks(SEM, SEM, 'good'); ok(r.success === false && /不能相同/.test(r.error) && e.tasks.length === 4, '來源等於目標：拒絕並說明「不能相同」');
r = e.ctx.copySemesterTasks('不存在的學期', SEM2, 'good'); ok(r.success === false && /沒有任何/.test(r.error) && e.tasks.length === 4, '來源學期沒有任務：拒絕');
r = e.ctx.copySemesterTasks(SEM, SEM2, 'good');
const copied = e.tasks.slice(4);
ok(r.success && r.count === 3 && copied.length === 3 && copied.every(x => x[1] === SEM2) && new Set(copied.map(x => x[0])).size === 3 && copied.every(x => !['a1', 'a2', 'a3'].includes(x[0])), '複製 3 筆到目標學期：全是新編號、學期改成目標');
ok(copied[0][2] === G1 && copied[0][5] === '甲' && copied[0][6] === '說明甲' && copied[0][4] === '📖' && copied[1][5] === '丙' && copied[2][2] === G2, '內容、圖示、類別、順序沿用（依班級小任務→家長配合事項排列）；原學期不變');
ok(e.tasks.slice(1, 4).every(x => x[1] === SEM) && e.cleared() === 1, '來源學期的資料完全沒被改動；清了快取');
r = e.ctx.copySemesterTasks(SEM, SEM2, 'good'); ok(r.success === false && /已經有/.test(r.error) && e.tasks.length === 7, '目標學期已有任務：拒絕（不重複複製、不覆蓋）');
const big2 = []; for (let i = 0; i < 299; i++) big2.push(row('k' + i, SEM, G1, 1, '', 'x' + i));
e = env([TASK_H].concat(big2), SEM_ROWS()); r = e.ctx.copySemesterTasks(SEM, SEM2, 'good'); ok(r.success === false && /上限/.test(r.error) && e.tasks.length === 300, '複製後會超過 300 筆：整批拒絕（不會只複製一半）');

console.log('I. saveTaskOverview（選填總覽圖）');
e = env([TASK_H], SEM_ROWS());
r = e.ctx.saveTaskOverview(SEM, ID, 'bad'); ok(r.success === false && e.sems[1][2] === '' && e.cleared() === 0, '錯誤 token：拒絕');
r = e.ctx.saveTaskOverview(SEM, 'https://drive.google.com/file/d/' + ID + '/view?usp=sharing', 'good');
ok(r.success && r.fileId === ID && e.sems[1][2] === ID && e.sems[2][2] === '' && e.cleared() === 1, '貼共用連結：試算表存的是純檔案 ID，只改那個學期的那一格');
ok(e.sems[1][1] === '', '不會動到主題架構圖（overviewImage 欄）');
r = e.ctx.saveTaskOverview(SEM, '不是連結', 'good'); ok(r.success === false && /連結格式/.test(r.error) && e.sems[1][2] === ID, '格式不對：拒絕，原本設定保留');
r = e.ctx.saveTaskOverview(SEM, '"><script>alert(1)</script>', 'good'); ok(r.success === false && e.sems[1][2] === ID, '惡意字串：拒絕');
r = e.ctx.saveTaskOverview(SEM, '', 'good'); ok(r.success && r.fileId === '' && e.sems[1][2] === '', '連結留白＝清除');
r = e.ctx.saveTaskOverview('不存在', ID, 'good'); ok(r.success === false && /找不到學期/.test(r.error), '學期不在 ThemeSemesters：拒絕');
ok(e.ctx.saveTaskOverview('', ID, 'good').success === false && e.ctx.saveTaskOverview(null, ID, 'good').success === false, '沒選學期：拒絕');
e = env([TASK_H], [['semesterName', 'overviewImage'], [SEM, '']]); r = e.ctx.saveTaskOverview(SEM, ID, 'good'); ok(r.success && e.sems[0].indexOf('tasksOverviewImage') === 2 && e.sems[1][2] === ID, '舊工作表沒有 tasksOverviewImage 欄：自動補欄再寫入');

console.log('J. 接線與安全');
ok(/action === 'saveSemesterTask'/.test(src) && /action === 'deleteSemesterTask'/.test(src) && /action === 'copySemesterTasks'/.test(src) && /action === 'saveTaskOverview'/.test(src), 'doPost 接上四個動作');
const getPart = src.slice(src.indexOf('function doGet('), src.indexOf('function doPost('));
ok(!/SemesterTask|TaskOverview/.test(getPart), 'doGet（公開、匿名）沒有任何學期任務的寫入動作');
['saveSemesterTask', 'deleteSemesterTask', 'copySemesterTasks', 'saveTaskOverview'].forEach(fn => {
  const i = src.indexOf('function ' + fn + '('); ok(/if \(!checkPassword\(password\)\) return authFail_\(\);/.test(src.slice(i, i + 200)), fn + '：第一步驗證 token');
});

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
