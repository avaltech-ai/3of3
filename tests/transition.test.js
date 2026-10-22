// 幼小銜接後端測試：TransitionPlan（銜接計畫項目）、TransitionArticles（銜接文章重點）的解析、驗證、儲存／刪除／整學年複製、接線與權限。
// 執行：node tests/transition.test.js
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const PLAN_H = ['id', 'year', 'category', 'order', 'kind', 'text', 'updatedAt'];
const ART_H = ['id', 'order', 'title', 'source', 'url', 'summary', 'points', 'bubbles', 'quote', 'updatedAt'];
const Y = '115 學年度', Y2 = '116 學年度';

function env(planRows, artRows, opts) {
  opts = opts || {};
  const sheets = {}, rowsOf = {}, formats = [];
  let cleared = 0, uuid = 0;
  const chain = { setFontWeight() { return chain; }, setBackground() { return chain; } };
  const mkSheet = (rows, name) => ({
    getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }),
    getLastColumn: () => rows.reduce((m, r) => Math.max(m, r.length), 0),
    getLastRow: () => rows.length, appendRow: r => { rows.push(r.slice()); }, setFrozenRows() {},
    deleteRow: n => { rows.splice(n - 1, 1); },
    getRange: (r, c, nr, nc) => ({
      setFontWeight() { return chain; }, setBackground() { return chain; },
      getValues: () => { const out = []; for (let i = 0; i < (nr || 1); i++) { const row = []; for (let j = 0; j < (nc || 1); j++) { const v = (rows[r - 1 + i] || [])[c - 1 + j]; row.push(v === undefined ? '' : v); } out.push(row); } return out; },
      setNumberFormat: f => { formats.push(name + ':' + r + ':' + c + ':' + f); return chain; },
      setValue: v => { while (rows.length < r) rows.push([]); const row = rows[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; return chain; }
    })
  });
  const add = (name, rows) => { if (rows) { rowsOf[name] = rows.map(r => r.slice()); sheets[name] = mkSheet(rowsOf[name], name); } };
  add('TransitionPlan', planRows); add('TransitionArticles', artRows);
  const ctx = { console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) }, PropertiesService: {}, LockService: {}, SpreadsheetApp: {}, ContentService: {}, HtmlService: {}, UrlFetchApp: {}, DriveApp: {}, Session: {}, ScriptApp: {} };
  ctx.Utilities = { formatDate: () => '2026-10-17', getUuid: () => 'abcd' + (++uuid) + '-0000-0000-0000-000000000000' };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet_ = () => ({ getSheetByName: n => sheets[n] || null, insertSheet: n => { add(n, []); return sheets[n]; } });
  ctx.checkPassword = tok => tok === 'good';
  ctx.authFail_ = () => ({ success: false, error: '登入已逾時或無效，請重新登入。' });
  ctx.clearAppDataCache_ = () => { cleared++; };
  return { ctx, rows: rowsOf, formats, cleared: () => cleared };
}
const P = (id, year, cat, ord, kind, text) => [id, year, cat, ord, kind, text, '2026-10-01'];
const ids = list => list.map(t => t.id).join();
const objs = (H, rows) => rows.map(r => { const o = {}; H.forEach((h, i) => { o[h] = r[i]; }); return o; });

console.log('A. 計畫項目解析（parseTransitionPlan_）');
let e = env([PLAN_H], [ART_H]); const PP = e.ctx.parseTransitionPlan_;
let t = PP(objs(PLAN_H, [
  P('r2', Y, '規律生活', 2, '在家', '21:00-21:30 前上床睡覺'), P('l1', Y, '生活自理能力', 1, '一起', '能自己整理物品'), P('r1', Y, '規律生活', 1, '在園', '8:20-8:40 前入學'),
  P('l2', Y, '生活自理能力', 2, '一起', '如廁後能自己擦屁股'), P('bad', Y, '規律生活', 3, '亂寫', '種類不合法'), P('nt', Y, '規律生活', 4, '在家', ''), P('ny', '', '規律生活', 4, '在家', '沒有學年度'), P('nc', Y, '', 4, '在家', '沒有類別')
]));
ok(ids(t) === 'r1,r2,l1,l2', '類別依「第一次出現在試算表」的順序排（規律生活在前）、類別內依順序；種類不合法、沒有內容／學年度／類別的列略過');
ok(t[0].kind === '在園' && t[1].kind === '在家' && t[2].kind === '一起' && t[0].year === Y && t[0].category === '規律生活' && t[0].text === '8:20-8:40 前入學', '欄位完整帶出（種類、學年度、類別、內容）');
t = PP(objs(PLAN_H, [P('b', Y2, 'X', 1, '一起', 'b'), P('a', Y, 'X', 1, '一起', 'a')])); ok(ids(t) === 'a,b', '不同學年度分開排列');
t = PP(objs(PLAN_H, [P('x3', Y, 'X', '', '一起', '無順序'), P('x1', Y, 'X', 5, '一起', '五'), P('x2', Y, 'X', 1000, '一起', '超出'), P('x5', Y, 'X', 1.9, '一起', '小數')]));
ok(ids(t) === 'x5,x1,x3,x2', '順序：小數取整數；空白、超出 1～999 排最後（相同維持原列順序）');
t = PP(objs(PLAN_H, [P('l', Y, 'C'.repeat(50), 1, '一起', 'T'.repeat(300))])); ok(t[0].category.length === 30 && t[0].text.length === 200, '過長的類別、內容被截斷（30、200）');
ok(PP(null).length === 0 && PP([null]).length === 0, '沒有資料、null：空陣列');

console.log('B. 文章解析（parseTransitionArticles_）');
const A = (id, ord, title, source, url, summary, points, bubbles, quote) => [id, ord, title, source, url, summary, points, bubbles, quote, '2026-10-01'];
let a = e.ctx.parseTransitionArticles_(objs(ART_H, [A('a2', 2, '第二篇', '', '', '', '', '', ''), A('a1', 1, '幼小銜接很重要', '未來親子', 'https://example.com/x', '摘要', '重點一\n重點二', '心聲一', '金句'), A('no', 3, '', 'x', '', '', '', '', '')])) ;
ok(ids(a) === 'a1,a2' && a[0].points === '重點一\n重點二' && a[0].source === '未來親子' && a[0].quote === '金句' && a[0].url === 'https://example.com/x', '依順序排列；沒有標題的略過；多行重點保留換行');
a = e.ctx.parseTransitionArticles_(objs(ART_H, [A('j', 1, 'T', '', 'javascript:alert(1)', '', '', '', ''), A('k', 2, 'U', '', 'https://ok.example/"onmouseover=x', '', '', '', ''), A('m', 3, 'V', '', 'http://ok.example/p?a=1', '', '', '', '')]));
ok(a[0].url === '' && a[1].url === '' && a[2].url === 'http://ok.example/p?a=1', '原文連結：javascript: 與含引號的網址一律丟掉，只留正常的 http/https');

console.log('C. 工作表自動建立');
e = env(null, null); e.ctx.getTransitionData_();
ok(e.rows.TransitionPlan[0].join() === PLAN_H.join() && e.rows.TransitionArticles[0].join() === ART_H.join(), '兩張工作表不存在：自動建立並寫入標題列');
e = env([['id', 'year', 'text']], [ART_H]); e.ctx.getTransitionData_(); ok(e.rows.TransitionPlan[0].join() === 'id,year,text,category,order,kind,updatedAt', '缺少的欄位補在右邊，原有欄位不動');
ok(/transitionPlan:\s*transitionPlan/.test(src) && /transitionArticles:\s*transitionArticles/.test(src), 'getAppData 的回應含 transitionPlan 與 transitionArticles（讀不到時退回空陣列）');
ok(/\['transitionPlan', \['category', 'text'\], '幼小銜接計畫'\]/.test(src) && /\['transitionArticles', \['title', 'source', 'summary', 'points', 'bubbles', 'quote'\], '幼小銜接文章'\]/.test(src), '計畫與文章的文字納入英文對照（TextMap）掃描來源');

console.log('D. saveTransitionItem');
e = env([PLAN_H, P('r1', Y, '規律生活', 1, '在園', '入學'), P('r2', Y, '規律生活', 2, '在家', '睡覺'), P('z1', Y, '語文能力', 7, '在家', '共讀')], [ART_H]);
const base = { year: Y, category: '規律生活', kind: '一起', text: '學會看時鐘', order: '' };
let r = e.ctx.saveTransitionItem(base, 'bad'); ok(r.success === false && /登入/.test(r.error) && e.rows.TransitionPlan.length === 4 && e.cleared() === 0, '錯誤 token：拒絕，不動資料');
ok(/學年度/.test(e.ctx.saveTransitionItem(Object.assign({}, base, { year: '' }), 'good').error) && /類別/.test(e.ctx.saveTransitionItem(Object.assign({}, base, { category: '' }), 'good').error) && /誰來做/.test(e.ctx.saveTransitionItem(Object.assign({}, base, { kind: '別的' }), 'good').error) && /內容/.test(e.ctx.saveTransitionItem(Object.assign({}, base, { text: ' ' }), 'good').error), '缺學年度、類別、種類不合法、缺內容：各自提示');
ok(e.ctx.saveTransitionItem(Object.assign({}, base, { text: 'x'.repeat(201) }), 'good').success === false && e.ctx.saveTransitionItem(Object.assign({}, base, { category: 'x'.repeat(31) }), 'good').success === false && e.ctx.saveTransitionItem(Object.assign({}, base, { order: 0 }), 'good').success === false && e.ctx.saveTransitionItem(Object.assign({}, base, { order: 'abc' }), 'good').success === false && e.rows.TransitionPlan.length === 4, '太長、順序不合法：拒絕，不寫入');
r = e.ctx.saveTransitionItem(base, 'good');
let last = e.rows.TransitionPlan[e.rows.TransitionPlan.length - 1];
ok(r.success && /^TRP-/.test(r.itemId) && r.order === 3 && last[4] === '一起' && last[5] === '學會看時鐘' && last[6] === '2026-10-17' && e.cleared() === 1, '新增：新編號、順序接在同學年同類別最後（2 → 3；別的類別 7 不影響）、清快取');
r = e.ctx.saveTransitionItem({ year: Y2, category: '規律生活', kind: '在家', text: '明年的' }, 'good'); ok(r.success && r.order === 1, '另一學年度：從 1 開始');
r = e.ctx.saveTransitionItem(Object.assign({}, base, { id: 'r2', text: '睡覺（改）', kind: '在家' }), 'good');
ok(r.success && r.itemId === 'r2' && e.rows.TransitionPlan[2][5] === '睡覺（改）' && e.rows.TransitionPlan[2][3] === 2 && e.rows.TransitionPlan.filter(x => x[0] === 'r2').length === 1, '編輯：以編號更新原列、不新增；順序留白且學年度類別沒變時維持原順序');
const n = e.rows.TransitionPlan.length; r = e.ctx.saveTransitionItem({ id: 'nope', year: Y, category: '規律生活', kind: '在家', text: '外來編號' }, 'good'); ok(r.success && e.rows.TransitionPlan.length === n + 1 && r.itemId !== 'nope', '編號不存在：當成新增（產生新編號）');
e.formats.length = 0; e.ctx.saveTransitionItem(Object.assign({}, base, { text: '=HYPERLINK("x")' }), 'good'); ok(e.formats.some(f => /^TransitionPlan:\d+:6:@$/.test(f)) && !e.formats.some(f => /^TransitionPlan:\d+:4:@$/.test(f)), '內容欄寫入前設為純文字（避免公式）；順序欄維持數字');
const big = []; for (let i = 0; i < 400; i++) big.push(P('k' + i, Y, 'X', 1, '一起', 'x'));
e = env([PLAN_H].concat(big), [ART_H]); ok(/上限/.test(e.ctx.saveTransitionItem(base, 'good').error) && e.ctx.saveTransitionItem(Object.assign({}, base, { id: 'k3', text: '改' }), 'good').success, '已有 400 筆：新增被擋，編輯既有的仍可以');

console.log('E. deleteTransitionItem');
e = env([PLAN_H, P('a', Y, 'X', 1, '一起', 'a'), P('b', Y, 'X', 2, '一起', 'b')], [ART_H]);
ok(e.ctx.deleteTransitionItem('a', 'bad').success === false && e.rows.TransitionPlan.length === 3, '錯誤 token：拒絕');
r = e.ctx.deleteTransitionItem('a', 'good'); ok(r.success && e.rows.TransitionPlan.length === 2 && e.rows.TransitionPlan[1][0] === 'b' && e.cleared() === 1, '刪除：只移除該列、清快取');
ok(/找不到/.test(e.ctx.deleteTransitionItem('a', 'good').error) && e.ctx.deleteTransitionItem('', 'good').success === false && e.ctx.deleteTransitionItem(null, 'good').success === false && e.rows.TransitionPlan.length === 2, '不存在、空編號、null：拒絕，不誤刪');

console.log('F. copyTransitionYear');
e = env([PLAN_H, P('a', Y, '規律生活', 1, '在園', '入學'), P('b', Y, '規律生活', 2, '在家', '睡覺'), P('c', Y, '語文能力', 1, '一起', '表達')], [ART_H]);
ok(e.ctx.copyTransitionYear(Y, Y2, 'bad').success === false && e.rows.TransitionPlan.length === 4, '錯誤 token：拒絕');
ok(/不能相同/.test(e.ctx.copyTransitionYear(Y, Y, 'good').error) && e.ctx.copyTransitionYear('', Y2, 'good').success === false && /沒有任何/.test(e.ctx.copyTransitionYear('114 學年度', Y2, 'good').error), '來源等於目標、缺來源、來源沒有項目：拒絕');
r = e.ctx.copyTransitionYear(Y, Y2, 'good'); const cp = e.rows.TransitionPlan.slice(4);
ok(r.success && r.count === 3 && cp.length === 3 && cp.every(x => x[1] === Y2) && new Set(cp.map(x => x[0])).size === 3 && cp.every(x => !['a', 'b', 'c'].includes(x[0])) && cp[0][5] === '入學' && cp[1][4] === '在家' && cp[2][2] === '語文能力', '複製 3 筆：新編號、學年度改成目標，類別／種類／內容／順序沿用');
ok(e.rows.TransitionPlan.slice(1, 4).every(x => x[1] === Y), '來源學年度不變');
ok(/已經有/.test(e.ctx.copyTransitionYear(Y, Y2, 'good').error) && e.rows.TransitionPlan.length === 7, '目標學年度已有項目：拒絕（不重複、不覆蓋）');
const big2 = []; for (let i = 0; i < 399; i++) big2.push(P('k' + i, Y, 'X', 1, '一起', 'x'));
e = env([PLAN_H].concat(big2), [ART_H]); ok(/上限/.test(e.ctx.copyTransitionYear(Y, Y2, 'good').error) && e.rows.TransitionPlan.length === 400, '複製後會超過上限：整批拒絕');

console.log('G. saveTransitionArticle / deleteTransitionArticle');
e = env([PLAN_H], [ART_H, A('a1', 1, '第一篇', '', '', '', '', '', '')]);
const art = { title: '幼小銜接很重要', source: '未來親子', url: 'https://example.com/a', summary: '摘要\r\n第二行', points: '重點一\n重點二', bubbles: '心聲', quote: '金句', order: '' };
ok(e.ctx.saveTransitionArticle(art, 'bad').success === false && e.rows.TransitionArticles.length === 2, '錯誤 token：拒絕');
ok(/標題/.test(e.ctx.saveTransitionArticle(Object.assign({}, art, { title: '' }), 'good').error) && /http/.test(e.ctx.saveTransitionArticle(Object.assign({}, art, { url: 'javascript:alert(1)' }), 'good').error) && /摘要/.test(e.ctx.saveTransitionArticle(Object.assign({}, art, { summary: 'x'.repeat(3001) }), 'good').error) && e.rows.TransitionArticles.length === 2, '缺標題、危險連結、摘要太長：拒絕');
r = e.ctx.saveTransitionArticle(art, 'good'); last = e.rows.TransitionArticles[2];
ok(r.success && /^TRA-/.test(r.articleId) && r.order === 2 && last[2] === '幼小銜接很重要' && last[5] === '摘要\n第二行' && last[6] === '重點一\n重點二' && last[4] === 'https://example.com/a' && e.cleared() === 1, '新增：新編號、排最後（順序 2）、換行統一為 \\n、連結保留');
r = e.ctx.saveTransitionArticle(Object.assign({}, art, { id: 'a1', title: '第一篇（改）', url: '' }), 'good'); ok(r.success && e.rows.TransitionArticles[1][2] === '第一篇（改）' && e.rows.TransitionArticles[1][1] === 1 && e.rows.TransitionArticles.length === 3, '編輯：更新原列、維持原順序、連結可清空');
r = e.ctx.deleteTransitionArticle('a1', 'good'); ok(r.success && e.rows.TransitionArticles.length === 2 && e.ctx.deleteTransitionArticle('a1', 'good').success === false, '刪除：移除該篇；再刪一次提示找不到');
const bigA = []; for (let i = 0; i < 30; i++) bigA.push(A('k' + i, i + 1, 't' + i, '', '', '', '', '', ''));
e = env([PLAN_H], [ART_H].concat(bigA)); ok(/上限/.test(e.ctx.saveTransitionArticle(art, 'good').error), '已有 30 篇：新增被擋');

console.log('H. 接線與安全');
['saveTransitionItem', 'deleteTransitionItem', 'copyTransitionYear', 'saveTransitionArticle', 'deleteTransitionArticle'].forEach(fn => {
  ok(new RegExp("action === '" + fn + "'").test(src), 'doPost 接上 ' + fn);
  const i = src.indexOf('function ' + fn + '('); ok(/if \(!checkPassword\(password\)\) return authFail_\(\);/.test(src.slice(i, i + 200)), fn + '：第一步驗證 token');
});
const getPart = src.slice(src.indexOf('function doGet('), src.indexOf('function doPost('));
ok(!/Transition/.test(getPart), 'doGet（公開、匿名）沒有任何幼小銜接的寫入動作');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
