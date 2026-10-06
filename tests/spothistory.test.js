// 「歷史焦點」篩選邏輯（純函式）測試：從建置好的 index.html 取出 filterActiveSpotlights、spotHistCutoff、getHistorySpotlights 直接執行。
// 規則：狀態不是「停用」、結束日早於今天且不早於「三個月前的今天」、目前沒有在輪播中顯示；依結束日由新到舊。
// 執行：node tests/spothistory.test.js（已納入 tests/ci.sh）
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function slice(from, to) {
  const a = html.indexOf(from), b = html.indexOf(to, a);
  if (a < 0 || b < 0) { console.log('FAIL: 在 index.html 找不到 ' + from); process.exit(1); }
  return html.slice(a, b);
}
const srcActive = slice('function filterActiveSpotlights(list) {', 'let currentSpotlightIndex');
const srcHist = slice('const SPOTLIGHT_HISTORY_MONTHS', 'function isSpotlightHistoryOpen');
let TODAY = '2026-10-06';
const api = new Function('getTodayDateStr', srcActive + '\n' + srcHist + '\nreturn { spotHistCutoff, getHistorySpotlights, filterActiveSpotlights, months: SPOTLIGHT_HISTORY_MONTHS };')(function () { return TODAY; });

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ FAIL: ' + m); } }
const ids = list => list.map(x => x.id).join(',');
const sp = (id, start, end, extra) => Object.assign({ id: id, title: id, startDate: start, endDate: end, status: '啟用' }, extra || {});

console.log('A. 一季 = 3 個月');
ok(api.months === 3, '常數：3 個月');
ok(api.spotHistCutoff('2026-10-06', 3) === '2026-07-06', '2026-10-06 → 2026-07-06');
ok(api.spotHistCutoff('2026-05-31', 3) === '2026-02-28', '5/31 往前三個月（2 月沒有 31 日）→ 2/28');
ok(api.spotHistCutoff('2024-05-31', 3) === '2024-02-29', '閏年 → 2/29');
ok(api.spotHistCutoff('2026-01-15', 3) === '2025-10-15', '跨年：2026-01-15 → 2025-10-15');
ok(api.spotHistCutoff('2026-03-31', 3) === '2025-12-31', '跨年：3/31 → 前一年 12/31');
ok(api.spotHistCutoff('2026-12-01', 3) === '2026-09-01', '12 月 → 9 月');

console.log('B. 篩選規則（今天 2026-10-06，門檻 2026-07-06）');
const A = sp('A', '2026-10-01', '2026-10-31');           // 進行中 → 在輪播
const B = sp('B', '2026-09-10', '2026-09-20');           // 已結束、一季內 → 歷史
const C = sp('C', '2026-09-01', '2026-09-05');
const D = sp('D', '2026-08-10', '2026-08-15');
const E = sp('E', '2026-07-01', '2026-07-06');           // 剛好等於門檻 → 納入
const F = sp('F', '2026-06-20', '2026-07-05');           // 超過一季 → 不顯示
const G = sp('G', '2026-08-25', '2026-09-01', { status: '停用' });   // 停用 → 不顯示
const H = sp('H', '2026-11-01', '2026-11-30');           // 還沒開始 → 不顯示
const I = sp('I', '2026-09-01', '');                     // 沒有結束日 → 不顯示
const J = sp('J', '2026-10-04', '2026-10-05');           // 昨天結束 → 歷史（最新）
const K = sp('K', '2026-10-06', '2026-10-06');           // 今天最後一天 → 仍在輪播，不算歷史
const all = [A, B, C, D, E, F, G, H, I, J, K];
ok(ids(api.getHistorySpotlights(all)) === 'J,B,C,D,E', '只列 J、B、C、D、E；依結束日由新到舊');
ok(!ids(api.getHistorySpotlights(all)).includes('A') && !ids(api.getHistorySpotlights(all)).includes('K'), '進行中（含今天最後一天）的不在歷史');
ok(!ids(api.getHistorySpotlights(all)).includes('F'), '結束日早於門檻一天（07-05）→ 不顯示');
ok(ids(api.getHistorySpotlights(all)).includes('E'), '結束日剛好等於門檻（07-06）→ 顯示');
ok(!ids(api.getHistorySpotlights(all)).match(/[GHI]/), '停用、未開始、沒有結束日的都不顯示');

console.log('C. 同一天結束的排序與無資料');
const S1 = sp('S1', '2026-09-01', '2026-09-20'), S2 = sp('S2', '2026-09-10', '2026-09-20');
ok(ids(api.getHistorySpotlights([A, S1, S2])) === 'S2,S1', '結束日相同：開始日較晚的在前');
ok(api.getHistorySpotlights([]).length === 0 && api.getHistorySpotlights(undefined).length === 0 && api.getHistorySpotlights(null).length === 0, '空資料、undefined、null 不出錯');

console.log('D. 目前正在輪播的不重複出現在歷史');
ok(ids(api.filterActiveSpotlights([B, C])) === 'B,C', '前提：沒有任何進行中的活動時，輪播會退而顯示已啟用的（B、C）');
ok(ids(api.getHistorySpotlights([B, C])) === '', '→ 這時 B、C 正在輪播，不重複列入歷史');
ok(ids(api.getHistorySpotlights([B, C, G])) === '', '停用的 G 在這種情況下仍不列入');
ok(ids(api.getHistorySpotlights([A, B, C])) === 'B,C', '有進行中的 A 時，B、C 才是歷史');

console.log('E. 隨日期推進，滿一季的會消失');
const L = sp('L', '2026-12-01', '2026-12-31'), M = sp('M', '2027-01-01', '2027-01-31');
TODAY = '2026-12-20';   // 門檻 2026-09-20
ok(ids(api.getHistorySpotlights([L, A, B, C, J])) === 'A,J,B', '12/20（門檻 9/20）：A、J、B（9/20 剛好）在；C（9/05）已消失');
TODAY = '2026-12-21';   // 門檻 2026-09-21
ok(ids(api.getHistorySpotlights([L, A, B, C, J])) === 'A,J', '12/21（門檻 9/21）：B（9/20）也消失');
TODAY = '2027-01-05';   // 門檻 2026-10-05，跨年
ok(ids(api.getHistorySpotlights([M, L, A, J, B])) === 'L,A,J', '跨年 2027-01-05（門檻 10/05）：L、A、J（10/05 剛好）在；B 已消失');
TODAY = '2026-10-06';

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
