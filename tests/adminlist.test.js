// 後台列表（活動、相簿、歌曲）搜尋、篩選、排序與分頁的純函式測試：從建置好的 index.html 取出函式直接執行。
// 執行：node tests/adminlist.test.js（已納入 tests/ci.sh）
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = html.indexOf('const ADMIN_LIST_SIZES');
const b = html.indexOf('// ===== 以下為畫面');
if (a < 0 || b < 0 || b < a) { console.log('FAIL: 在 index.html 找不到後台列表函式'); process.exit(1); }
const api = new Function(html.slice(a, b) + '\nreturn { ADMIN_LIST_SIZES, adminListTerms, adminListMatches, adminListKey, adminListSlice, adminEventsView, adminAlbumsView, adminSongsView, adminIdNewerFirst };')();

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ FAIL: ' + m); } }
const ids = list => list.map(x => x.id).join(',');

console.log('A. 分頁 adminListSlice');
ok(JSON.stringify(api.ADMIN_LIST_SIZES) === '[10,20,50,0]', '每頁選項：10、20、50、全部（0）');
const items = Array.from({ length: 25 }, (_, i) => ({ id: 'x' + i }));
let r = api.adminListSlice(items, { page: 0, size: 10 });
ok(r.rows.length === 10 && r.pages === 3 && r.page === 0 && r.total === 25 && r.rows[0].id === 'x0' && r.rows[9].id === 'x9', '25 筆、每頁 10：共 3 頁，第 1 頁是第 1～10 筆');
r = api.adminListSlice(items, { page: 2, size: 10 });
ok(r.rows.length === 5 && r.rows[0].id === 'x20' && r.page === 2, '最後一頁只有 5 筆');
r = api.adminListSlice(items, { page: 9, size: 10 });
ok(r.page === 2 && r.rows.length === 5, '頁碼超出範圍：夾回最後一頁');
r = api.adminListSlice(items, { page: 1e9, size: 10 });
ok(r.page === 2, '「最末頁」用極大頁碼也會夾回最後一頁');
r = api.adminListSlice(items, { page: -3, size: 10 });
ok(r.page === 0, '負的頁碼：夾回第 1 頁');
r = api.adminListSlice(items, { page: NaN, size: 10 }); ok(r.page === 0, 'NaN 頁碼：第 1 頁');
r = api.adminListSlice(items, { page: 0, size: 20 }); ok(r.rows.length === 20 && r.pages === 2, '每頁 20：2 頁');
r = api.adminListSlice(items, { page: 0, size: 50 }); ok(r.rows.length === 25 && r.pages === 1, '每頁 50：1 頁，不需分頁');
r = api.adminListSlice(items, { page: 3, size: 0 }); ok(r.rows.length === 25 && r.pages === 1 && r.page === 0, '全部顯示：1 頁、全部筆數');
r = api.adminListSlice([], { page: 0, size: 10 }); ok(r.rows.length === 0 && r.pages === 1 && r.page === 0 && r.total === 0, '沒有資料：0 筆、1 頁、不出錯');
r = api.adminListSlice([], { page: 5, size: 0 }); ok(r.rows.length === 0 && r.pages === 1, '沒有資料且全部顯示：不出錯');
r = api.adminListSlice(items.slice(0, 10), { page: 0, size: 10 }); ok(r.pages === 1 && r.rows.length === 10, '剛好 10 筆：1 頁');
r = api.adminListSlice(items.slice(0, 11), { page: 0, size: 10 }); ok(r.pages === 2, '11 筆：2 頁');

console.log('B. 關鍵字與工具');
ok(api.adminListTerms('  幸福  廚房　九月 ').join('|') === '幸福|廚房|九月', '關鍵字以空白（含全形）分開、去空白');
ok(api.adminListTerms('ABC').join('|') === 'abc' && api.adminListTerms(null).length === 0 && api.adminListTerms(undefined).length === 0, '轉小寫；null、undefined 視為空');
ok(api.adminListMatches('九月份幸福廚房', ['幸福', '九月']) && !api.adminListMatches('九月份幸福廚房', ['幸福', '十月']), '多個詞必須全部符合（AND）');
ok(api.adminListMatches('Happy Kitchen', ['happy']) && api.adminListMatches(undefined, []) , '不分大小寫；空詞列表恆為符合');
ok(api.adminListKey(' 諾貝爾 A ') === '諾貝爾A' && api.adminListKey(null) === '', '類別、對象比對：去掉所有空白');

console.log('C. 活動 adminEventsView');
const E = [
  { id: 'e0', date: '2026-08-03', title: '新學期開學日', categoryMajor: '全園活動', categoryMinor: '開學活動', target: '全園活動', description: '歡迎新生' },
  { id: 'e1', date: '2026-09-07', title: '九月份幸福廚房', categoryMajor: '班級主題', categoryMinor: '幸福廚房', target: '米羅 A, 米羅 B, 雨果', timeLocation: '11:40 廚房教室' },
  { id: 'e2', date: '2026-08-25', title: '米羅 AB 親師座談', categoryMajor: '班級主題', categoryMinor: '親師座談', target: '米羅A,米羅B', calendarPrompt: '座談' },
  { id: 'e3', date: '2026-09-11', title: '九月壽星慶生', '活動類別 (大項)': '全園活動', '活動類別 (細項)': '慶生活動', target: '諾貝爾 A，全園活動', description: '請準備生日卡' },
  { id: 'e4', date: '2026-09-07', title: '同日第二筆', categoryMajor: '班級主題', categoryMinor: '幸福廚房', target: '雨果' },
  null
];
const defSt = () => ({ query: '', cat: '', target: '', sort: 'new', page: 0, size: 10 });
ok(ids(api.adminEventsView(E, defSt())) === 'e4,e3,e2,e1,e0', '預設「最新建立」：試算表列順序倒過來（最後一列＝最新），null 項目略過');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { sort: 'dateDesc' }))) === 'e3,e4,e1,e2,e0', '日期由新到舊；同一天的最新建立在前（e4 在 e1 前）');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { sort: 'dateAsc' }))) === 'e0,e2,e4,e1,e3', '日期由舊到新；同一天仍是最新建立在前（e4 在 e1 前）');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { query: '幸福廚房' }))) === 'e4,e1', '關鍵字：活動名稱與細項類別（e1 標題＋細項、e4 只有細項）');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { query: '廚房教室' }))) === 'e1', '關鍵字：時間地點');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { query: '生日卡' }))) === 'e3', '關鍵字：說明');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { query: '座談' }))) === 'e2', '關鍵字：月曆提示與標題');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { query: '2026-09' }))) === 'e4,e3,e1', '關鍵字：日期（2026-09）');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { query: '九月 廚房' }))) === 'e1', '多個關鍵字：同時符合');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { query: '不存在' }))) === '', '沒有符合：空陣列');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { cat: 'M:班級主題' }))) === 'e4,e2,e1', '類別（大項）：班級主題');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { cat: 'M:全園活動' }))) === 'e3,e0', '類別（大項）：欄位名稱為「活動類別 (大項)」的資料也能比對（e3）');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { cat: 'm:幸福廚房' }))) === 'e4,e1', '類別（細項）：幸福廚房');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { cat: 'm:慶生活動' }))) === 'e3', '類別（細項）：欄位名稱為「活動類別 (細項)」的資料也能比對');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { cat: 'M:幸福廚房' }))) === '', '大項與細項不混用：細項名稱選成大項不會符合');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { cat: 'm:班級主題' }))) === '', '大項與細項不混用：大項名稱選成細項也不會符合');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { target: '雨果' }))) === 'e4,e1', '對象：雨果（多對象的活動也找得到）');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { target: '米羅 A' }))) === 'e2,e1', '對象：「米羅 A」與「米羅A」空白寫法不同也視為同一個');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { target: '全園活動' }))) === 'e3,e0', '對象：全形逗號分隔也能拆開（e3）');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { target: '米羅' }))) === '', '對象為完全比對，不是片段（「米羅」不等於「米羅 A」）');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { cat: 'M:班級主題', target: '雨果', query: '同日' }))) === 'e4', '關鍵字、類別、對象同時套用');
ok(ids(api.adminEventsView(E, Object.assign(defSt(), { cat: 'M:班級主題', sort: 'dateAsc' }))) === 'e2,e4,e1', '篩選後再排序');
ok(api.adminEventsView(undefined, defSt()).length === 0 && api.adminEventsView(null, defSt()).length === 0, '資料為 undefined、null 不出錯');
const withND = api.adminEventsView([{ id: 'n1', date: '10', title: 'x' }], Object.assign(defSt(), { query: '2026-10-10' }), d => '2026-10-' + ('0' + d).slice(-2));
ok(withND.length === 1, '可傳入日期正規化函式（頁面使用 normalizeDate）');

console.log('D. 相簿 adminAlbumsView');
const A = [
  { id: 'alb_demo', category: '幸福廚房', title: '舊示範相簿', folderName: 'demo', updatedAt: '2026-09-01' },
  { id: '1791100000', category: '健康檢查', title: '牙齒塗氟日', folderName: '牙齒塗氟日口腔檢查', updatedAt: '2026-09-20' },
  { id: '1791200000', category: '幸福廚房', title: '九月幸福廚房', folderName: '2026.09 幸福廚房', updatedAt: '2026-09-20' },
  { id: '1791300000', category: '日常生活', title: '生活日常', folderName: 'life', updatedAt: '2026-10-01' },
  { id: 'abc', category: '日常生活', title: '字串編號相簿', folderName: 'str', updatedAt: '2026-09-20' },
  null
];
ok(ids(api.adminAlbumsView(A, { query: '', cat: '' })) === '1791300000,1791200000,1791100000,abc,alb_demo', '依更新日期由新到舊；同一天：數字編號大的在前、字串編號最後');
ok(ids(api.adminAlbumsView(A, { query: '', cat: '幸福廚房' })) === '1791200000,alb_demo', '類別篩選');
ok(ids(api.adminAlbumsView(A, { query: '塗氟', cat: '' })) === '1791100000', '關鍵字：標題或資料夾名稱');
ok(ids(api.adminAlbumsView(A, { query: '2026.09', cat: '' })) === '1791200000', '關鍵字：資料夾名稱');
ok(ids(api.adminAlbumsView(A, { query: '日常', cat: '日常生活' })) === '1791300000,abc', '關鍵字＋類別');
ok(api.adminAlbumsView(undefined, { query: '', cat: '' }).length === 0, '資料為 undefined 不出錯');
ok(api.adminIdNewerFirst('2', '10') > 0 && api.adminIdNewerFirst('10', '2') < 0 && api.adminIdNewerFirst('5', 'abc') < 0 && api.adminIdNewerFirst('abc', '5') > 0 && api.adminIdNewerFirst('b', 'a') < 0 && api.adminIdNewerFirst('', '') === 0, '編號比較：數字要用數值大小（10 比 2 新），數字在字串前');

console.log('E. 歌曲 adminSongsView');
const S = [
  { id: 's0', category: '桃子腳', title: 'Happy Little Sun 快樂小太陽', fileName: '快樂小太陽_三之三園歌.mp3' },
  { id: 's1', category: '其他', title: 'Have a healthy New Year', fileName: '健康過好年.mp3' },
  { id: 's2', category: 'yoyo', title: 'Kagab Island卡加布列島', fileName: '【卡加布列島】#YOYO.mp3' },
  { id: 's3', category: 'yoyo', title: 'Go Fishing 釣魚記', fileName: '' },
  null
];
ok(ids(api.adminSongsView(S, { query: '', cat: '' })) === 's3,s2,s1,s0', '預設：試算表列順序倒過來（最新在最上面）');
ok(ids(api.adminSongsView(S, { query: '', cat: 'yoyo' })) === 's3,s2', '類別篩選');
ok(ids(api.adminSongsView(S, { query: 'happy', cat: '' })) === 's0', '關鍵字：歌名（不分大小寫）');
ok(ids(api.adminSongsView(S, { query: '健康過', cat: '' })) === 's1', '關鍵字：音樂檔名');
ok(ids(api.adminSongsView(S, { query: '釣魚', cat: 'yoyo' })) === 's3', '關鍵字＋類別（沒有檔名也不出錯）');
ok(api.adminSongsView(null, { query: '', cat: '' }).length === 0, '資料為 null 不出錯');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
